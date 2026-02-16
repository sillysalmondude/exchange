const axios = require("axios");
require("dotenv").config();

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";
const AUTH_TOKEN = process.env.AUTH_TOKEN;

async function makeRequest(method, endpoint, data = {}) {
	try {
		const response = await axios({
			method,
			url: `${BASE_URL}${endpoint}`,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${AUTH_TOKEN}`,
			},
			data,
		});
		return response.data;
	} catch (error) {
		console.error(`API request failed: ${error.message}`);
		throw new Error("An unexpected error occurred. Please try again later.");
	}
}

module.exports = makeRequest;
