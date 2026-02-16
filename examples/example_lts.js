const axios = require("axios");
const litecore = require("litecore-lib");
require("dotenv").config();

const BASE_URL = "http://localhost:3000/api";
const AUTH_TOKEN = "WEBSITEAUTHTOKEN";
const LTC_TESTNET_URL = "https://testnet.litecore.io/api";

const privateKey = new litecore.PrivateKey();
const address = privateKey.toAddress().toString();

console.log("Test wallet address:", address);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createUser() {
	try {
		const response = await axios.post(
			`${BASE_URL}/user/create_user`,
			{},
			{
				headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
			},
		);
		console.log("User created:", response.data);
		return response.data.identifier;
	} catch (error) {
		console.error(
			"Error creating user:",
			error.response?.data || error.message,
		);
		throw error;
	}
}

async function depositLTC(identifier) {
	try {
		const createResponse = await axios.post(
			`${BASE_URL}/ltc/create_intent`,
			{ identifier: identifier },
			{ headers: { Authorization: `Bearer ${AUTH_TOKEN}` } },
		);
		const { address } = createResponse.data;
		console.log("Deposit address created:", address);

		console.log("Simulating LTC deposit to address:", address);

		return address;
	} catch (error) {
		console.error(
			"Error in LTC deposit process:",
			error.response?.data || error.message,
		);
		throw error;
	}
}

async function checkIntent(address) {
	try {
		const response = await axios.post(
			`${BASE_URL}/ltc/check_intent`,
			{ address: address },
			{ headers: { Authorization: `Bearer ${AUTH_TOKEN}` } },
		);
		console.log("Intent check result:", response.data);
		if (response.data.message) {
			console.log("Message from intent check:", response.data.message);
		}
		return response.data;
	} catch (error) {
		console.error(
			"Error checking intent:",
			error.response?.data || error.message,
		);
		throw error;
	}
}

async function withdrawLTC(identifier, fromCurrency = "LTC") {
	try {
		const response = await axios.post(
			`${BASE_URL}/ltc/withdraw`,
			{
				identifier,
				amount: "0.1", // Withdraw 0.1 LTC
				recipient: address, // Use the test wallet address as recipient
				fromCurrency: fromCurrency,
			},
			{ headers: { Authorization: `Bearer ${AUTH_TOKEN}` } },
		);
		console.log("Withdrawal response:", response.data);
		if (response.data.txid) {
			console.log("LTC withdrawal successful!", response.data.txid);
		} else {
			console.log("Withdrawal initiated, but no transaction ID received.");
		}
	} catch (error) {
		console.error(
			"Error in LTC withdrawal process:",
			error.response?.data || error.message,
		);
		throw error;
	}
}

async function getBalance(identifier) {
	try {
		const response = await axios.get(
			`${BASE_URL}/user/check_balance?identifier=${identifier}`,
			{ headers: { Authorization: `Bearer ${AUTH_TOKEN}` } },
		);
		console.log("User balance:", response.data);
		return response.data;
	} catch (error) {
		console.error(
			"Error getting balance:",
			error.response?.data || error.message,
		);
		throw error;
	}
}

async function runTest() {
	try {
		const identifier = await createUser();
		console.log("Created user with identifier:", identifier);

		const initialBalance = await getBalance(identifier);
		console.log("Initial balance:", initialBalance);

		const depositAddress = await depositLTC(identifier);
		console.log("Deposit address:", depositAddress);
		await delay(5000);
		let intentCheckResult = await checkIntent(depositAddress);
		console.log("Intent check result after deposit:", intentCheckResult);
		const balanceAfterDeposit = await getBalance(identifier);
		console.log("Balance after deposit:", balanceAfterDeposit);
		await withdrawLTC(identifier);
		await delay(5000);
		const balanceAfterWithdrawal = await getBalance(identifier);
		console.log("Balance after withdrawal:", balanceAfterWithdrawal);
		await withdrawLTC(identifier, "ETH");
		const finalBalance = await getBalance(identifier);
		console.log("Final balance:", finalBalance);
	} catch (error) {
		console.error("Test failed:", error);
	}
}

runTest();
