import { capturePayment } from "@/lib/paypal";
import { checkAuthorization } from "@/lib/utils";
import dbConnection from "@/lib/db";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const auth = await checkAuthorization(req, res);
	if (!auth) {
		return res.status(403).json({ error: "Unauthorized" });
	}

	const { orderId } = req.body;

	if (!orderId) {
		return res.status(400).json({ error: "Order ID is required" });
	}

	try {
		const captureResult = await capturePayment(orderId);

		if (captureResult.status === "COMPLETED") {
			const paypalIntentsCollection =
				await dbConnection.getCollection("paypal_intents");
			const idsCollection = await dbConnection.getCollection("ids");

			const intent = await paypalIntentsCollection.findOne({
				paypalOrderId: orderId,
			});

			if (intent) {
				await paypalIntentsCollection.updateOne(
					{ paypalOrderId: orderId },
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
			}

			return res.status(200).json({
				status: "COMPLETED",
				message:
					"Payment captured successfully. Funds have been added to your account.",
			});
		} else {
			return res.status(400).json({
				status: captureResult.status,
				message: "Payment capture was not successful.",
			});
		}
	} catch (error) {
		console.error("PayPal capture error:", error);
		res.status(500).json({ error: "Failed to capture PayPal payment" });
	}
}
