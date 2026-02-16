import { createPayout } from "@/lib/paypal";
import { checkAuthorization } from "@/lib/utils";
import dbConnection from "@/lib/db";
import rateLimit from "@/lib/limit";
import { convertCurrency } from "@/lib/currency-conversion";

const limiter = rateLimit({
	interval: 60 * 1000,
	uniqueTokenPerInterval: 50,
});

export default async function handler(req, res) {
	try {
		await limiter.check(res, 5, "WITHDRAW_PAYPAL");
	} catch {
		return res.status(429).json({ error: "Too many requests" });
	}

	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const auth = await checkAuthorization(req, res);
	if (!auth) {
		return res.status(403).json({ error: "Unauthorized" });
	}

	const { identifier, amount, email, fromCurrency } = req.body;

	if (!identifier) {
		return res.status(400).json({ error: "Identifier is required" });
	}

	if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
		return res.status(400).json({ error: "Invalid amount" });
	}

	if (!email || !email.includes("@")) {
		return res.status(400).json({ error: "Invalid email address" });
	}

	if (!fromCurrency || !["ETH", "LTC", "PayPal"].includes(fromCurrency)) {
		return res.status(400).json({ error: "Invalid from currency" });
	}

	try {
		const idsCollection = await dbConnection.getCollection("ids");
		const paypalWithdrawalsCollection =
			await dbConnection.getCollection("paypal_withdrawals");

		const user = await idsCollection.findOne({ identifier });

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const paypalAmount = convertCurrency(
			parseFloat(amount),
			fromCurrency,
			"PayPal",
		);

		if (user.balances[fromCurrency] < parseFloat(amount)) {
			return res.status(400).json({ error: "Insufficient funds" });
		}

		const payoutResult = await createPayout(
			email,
			paypalAmount,
			"Withdrawal from our service",
		);

		if (
			payoutResult.batch_header.batch_status === "PENDING" ||
			payoutResult.batch_header.batch_status === "SUCCESS"
		) {
			await idsCollection.updateOne(
				{ identifier },
				{
					$inc: { [`balances.${fromCurrency}`]: -parseFloat(amount) },
					$push: {
						transactions: {
							type: "withdrawal",
							token: "PayPal",
							fromCurrency: fromCurrency,
							amount: paypalAmount,
							timestamp: new Date(),
						},
					},
				},
			);

			const withdrawal = await paypalWithdrawalsCollection.insertOne({
				identifier,
				amount: paypalAmount,
				fromCurrency: fromCurrency,
				email,
				paypalPayoutId: payoutResult.batch_header.payout_batch_id,
				status: payoutResult.batch_header.batch_status,
				timestamp: new Date(),
			});

			return res.status(200).json({
				id: withdrawal.insertedId,
				amount: paypalAmount,
				email,
				status: payoutResult.batch_header.batch_status,
				paypalPayoutId: payoutResult.batch_header.payout_batch_id,
			});
		} else {
			return res.status(400).json({
				error: "Failed to process withdrawal",
				details: payoutResult,
			});
		}
	} catch (error) {
		console.error("PayPal withdrawal error:", error);
		return res.status(500).json({
			error: "Failed to process PayPal withdrawal",
			details: error.message,
		});
	}
}
