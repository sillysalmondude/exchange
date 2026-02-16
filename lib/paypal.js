import axios from "axios";

const PAYPAL_API_BASE =
	process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

async function getAccessToken() {
	const auth = Buffer.from(
		`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
	).toString("base64");
	const response = await axios.post(
		`${PAYPAL_API_BASE}/v1/oauth2/token`,
		"grant_type=client_credentials",
		{
			headers: {
				Authorization: `Basic ${auth}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
		},
	);
	return response.data.access_token;
}

export async function createOrder(amount) {
	const accessToken = await getAccessToken();
	const response = await axios.post(
		`${PAYPAL_API_BASE}/v2/checkout/orders`,
		{
			intent: "CAPTURE",
			purchase_units: [
				{
					amount: {
						currency_code: "USD",
						value: amount.toString(),
					},
				},
			],
		},
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
		},
	);
	return response.data;
}

export async function capturePayment(orderId) {
	const accessToken = await getAccessToken();
	const response = await axios.post(
		`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
		{},
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
		},
	);
	return response.data;
}

export async function getOrderDetails(orderId) {
	const accessToken = await getAccessToken();
	const response = await axios.get(
		`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);
	return response.data;
}

export async function createPayout(email, amount, note) {
	const accessToken = await getAccessToken();
	try {
		const response = await axios.post(
			`${PAYPAL_API_BASE}/v1/payments/payouts`,
			{
				sender_batch_header: {
					sender_batch_id: `Payout_${Date.now()}`,
					email_subject: "You have a payout!",
					email_message:
						"You have received a payout! Thanks for using our service!",
				},
				items: [
					{
						recipient_type: "EMAIL",
						amount: {
							value: amount,
							currency: "USD",
						},
						receiver: email,
						note: note,
						sender_item_id: `Payout_${Date.now()}`,
					},
				],
			},
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
			},
		);
		return response.data;
	} catch (error) {
		if (error.response) {
			throw new Error(JSON.stringify(error.response.data));
		}
		throw error;
	}
}
