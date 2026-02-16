const axios = require("axios");
const ethers = require("ethers");
require("dotenv").config();

const BASE_URL = "http://localhost:3000/api";
const AUTH_TOKEN = "WEBSITEAUTHTOKEN";
const HOLESKY_RPC_URL = "https://holesky.infura.io/v3/INFURIAAPI";

const provider = new ethers.JsonRpcProvider(HOLESKY_RPC_URL);
const wallet = new ethers.Wallet("PRIVATEKEY", provider);

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

async function depositETH(identifier) {
	try {
		// Create deposit address
		const createResponse = await axios.post(
			`${BASE_URL}/eth/create_intent`,
			{ identifier: identifier },
			{ headers: { Authorization: `Bearer ${AUTH_TOKEN}` } },
		);
		const { address } = createResponse.data;
		console.log("Deposit address created:", address);

		// Send ETH to this address
		console.log("Sending ETH to deposit address...");
		const tx = await wallet.sendTransaction({
			to: address,
			value: ethers.parseEther("0.01"), // Sending 0.01 ETH
		});
		console.log("Transaction sent:", tx.hash);

		// Wait for transaction to be mined
		await tx.wait();
		console.log("Transaction confirmed");

		return address;
	} catch (error) {
		console.error(
			"Error in ETH deposit process:",
			error.response?.data || error.message,
		);
		throw error;
	}
}

async function checkIntent(address) {
	try {
		const response = await axios.post(
			`${BASE_URL}/eth/check_intent`,
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

async function withdrawETH(identifier, fromCurrency = "ETH") {
	try {
		const response = await axios.post(
			`${BASE_URL}/eth/withdraw`,
			{
				identifier,
				amount: "0.001",
				recipient: "0xCA9B2C3B584FC92cE20F0BB260124dF3Ad25Fc43",
				fromCurrency: fromCurrency,
			},
			{ headers: { Authorization: `Bearer ${AUTH_TOKEN}` } },
		);
		console.log("Withdrawal response:", response.data);
		if (response.data.transactionHash) {
			console.log("ETH withdrawal successful!", response.data.transactionHash);
		} else {
			console.log("Withdrawal initiated, but no transaction hash received.");
		}
	} catch (error) {
		console.error(
			"Error in ETH withdrawal process:",
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

		const depositAddress = await depositETH(identifier);
		console.log("Deposit address:", depositAddress);
		await delay(5000);
		let intentCheckResult = await checkIntent(depositAddress);
		console.log("Intent check result after deposit:", intentCheckResult);

		const balanceAfterDeposit = await getBalance(identifier);
		console.log("Balance after deposit:", balanceAfterDeposit);

		await withdrawETH(identifier);
		await delay(5000);

		const balanceAfterWithdrawal = await getBalance(identifier);
		console.log("Balance after withdrawal:", balanceAfterWithdrawal);

		const finalBalance = await getBalance(identifier);
		console.log("Final balance:", finalBalance);
	} catch (error) {
		console.error("Test failed:", error);
	}
}

runTest();
