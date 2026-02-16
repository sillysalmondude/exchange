import { ObjectId } from "mongodb";
import rateLimit from "@/lib/limit";
import { getOrderDetails } from "@/lib/paypal";
import dbConnection from "@/lib/db";
import { checkAuthorization } from "@/lib/utils";

const limiter = rateLimit({
	interval: 60 * 1000,
	uniqueTokenPerInterval: 50,
});

export default async function handler(req, res) {
	try {
		await limiter.check(res, 5, "CHECK_PAYPAL_INTENT");
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

	const { id } = req.body;

	if (!id) {
		return res.status(400).json({ error: "Intent ID is required" });
	}

	try {
		const paypalIntentsCollection =
			await dbConnection.getCollection("paypal_intents");
		const idsCollection = await dbConnection.getCollection("ids");

		const intent = await paypalIntentsCollection.findOne({
			_id: new ObjectId(id),
		});

		if (!intent) {
			return res.status(404).json({ error: "Intent not found" });
		}

		const orderDetails = await getOrderDetails(intent.paypalOrderId);

		if (orderDetails.status === "COMPLETED" && intent.status !== "COMPLETED") {
			await paypalIntentsCollection.updateOne(
				{ _id: new ObjectId(id) },
				{ $set: { status: "COMPLETED" } },
			);

			await idsCollection.updateOne(
				{ identifier: intent.identifier },
				{
					$inc: { "balances.PayPal": intent.amount },
					$push: {
						transactions: {
							type: "deposit",
							token: "PayPal",
							amount: intent.amount,
							timestamp: new Date(),
						},
					},
				},
			);

			return res.status(200).json({
				id: intent._id,
				identifier: intent.identifier,
				amount: intent.amount,
				status: "COMPLETED",
				message:
					"Payment completed successfully. Funds have been added to your account.",
			});
		} else if (orderDetails.status === "APPROVED") {
			return res.status(200).json({
				id: intent._id,
				identifier: intent.identifier,
				amount: intent.amount,
				status: "APPROVED",
				message:
					"Payment approved but not yet completed. Please complete the capture process.",
				nextStep: "capture",
				captureUrl: `${process.env.NEXTAUTH_URL}/api/paypal/capture`,
				paypalOrderId: intent.paypalOrderId,
			});
		}

		return res.status(200).json({
			id: intent._id,
			identifier: intent.identifier,
			amount: intent.amount,
			status: orderDetails.status,
			message: `Current payment status: ${orderDetails.status}. Please check again later.`,
		});
	} catch (error) {
		console.error("PayPal intent check error:", error);
		res.status(500).json({ error: "Failed to check PayPal intent" });
	}
}
