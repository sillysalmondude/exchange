require("dotenv").config();
const axios = require("axios");
const readline = require("readline");

const BASE_URL = "http://localhost:3000/api";
const AUTH_TOKEN = "site auth";

async function createUser() {
	try {
		const response = await axios.post(
			`${BASE_URL}/user/create_user`,
			{
				identifier: `test-user-${Date.now()}`,
			},
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

async function createPayPalIntent(identifier, amount) {
	try {
		const response = await axios.post(
			`${BASE_URL}/paypal/create_intent`,
			{
				identifier,
				amount,
			},
			{
				headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
			},
		);
		console.log("PayPal intent created:", response.data);
		return response.data;
	} catch (error) {
		console.error(
			"Error creating PayPal intent:",
			error.response?.data || error.message,
		);
		throw error;
	}
}

async function checkPayPalIntent(id) {
	try {
		const response = await axios.post(
			`${BASE_URL}/paypal/check_intent`,
			{ id },
			{
				headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
			},
		);
		console.log("PayPal intent status:", response.data);
		return response.data;
	} catch (error) {
		console.error(
			"Error checking PayPal intent:",
			error.response?.data || error.message,
		);
		throw error;
	}
}

async function capturePayPalPayment(captureUrl, paypalOrderId) {
	try {
		const response = await axios.post(
			captureUrl,
			{ orderId: paypalOrderId },
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${AUTH_TOKEN}`,
				},
			},
		);
		console.log("PayPal payment captured:", response.data);
		return response.data;
	} catch (error) {
		console.error(
			"Error capturing PayPal payment:",
			error.response?.data || error.message,
		);
		throw error;
	}
}

async function withdrawPayPal(identifier, amount, email) {
	try {
		const response = await axios.post(
			`${BASE_URL}/paypal/withdraw`,
			{
				identifier,
				amount,
				email,
				fromCurrency: "PayPal",
			},
			{
				headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
			},
		);
		console.log("PayPal withdrawal initiated:", response.data);
		return response.data;
	} catch (error) {
		console.error(
			"Error initiating PayPal withdrawal:",
			error.response?.data || error.message,
		);
		throw error;
	}
}

function waitForUserInput(promptMessage) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) =>
		rl.question(promptMessage, (ans) => {
			rl.close();
			resolve(ans);
		}),
	);
}

async function runTest() {
	try {
		const identifier = await createUser();
		const intent = await createPayPalIntent(identifier, 50.0);
		console.log(
			"Please complete the payment using this link:",
			intent.approvalLink,
		);

		await waitForUserInput("Press Enter after completing the payment...");

		let status;
		do {
			status = await checkPayPalIntent(intent.id);
			if (status.status !== "APPROVED" && status.status !== "COMPLETED") {
				console.log(
					`Payment not yet approved. Current status: ${status.status}`,
				);
				await waitForUserInput(
					"Press Enter to check again or type 'exit' to quit: ",
				);
				if (input.toLowerCase() === "exit") {
					console.log("Test aborted by user.");
					return;
				}
			}
		} while (status.status !== "APPROVED" && status.status !== "COMPLETED");

		if (status.status === "APPROVED") {
			console.log("Payment approved. Capturing payment...");
			const captureResult = await capturePayPalPayment(
				status.captureUrl,
				status.paypalOrderId,
			);

			if (captureResult.status === "COMPLETED") {
				console.log("Payment captured successfully!");
			} else {
				console.log("Failed to capture payment:", captureResult);
				return;
			}
		} else if (status.status === "COMPLETED") {
			console.log("Payment already completed!");
		}

		const withdrawal = await withdrawPayPal(
			identifier,
			5.0,
			"sb-wus7d32628682@personal.example.com",
		);
		console.log("Withdrawal status:", withdrawal.status);
	} catch (error) {
		console.error("Test failed:", error);
	}
}

runTest();
