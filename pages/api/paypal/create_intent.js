import { createOrder } from "@/lib/paypal";
import { checkAuthorization } from "@/lib/utils";
import dbConnection from "@/lib/db";
import rateLimit from "@/lib/limit";

const limiter = rateLimit({
	interval: 60 * 1000,
	uniqueTokenPerInterval: 50,
});

export default async function handler(req, res) {
	try {
		await limiter.check(res, 5, "CREATE_PAYPAL_INTENT");
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

	const { identifier, amount } = req.body;

	if (
		!identifier ||
		!amount ||
		isNaN(parseFloat(amount)) ||
		parseFloat(amount) <= 0
	) {
		return res.status(400).json({ error: "Invalid identifier or amount" });
	}

	try {
		const idsCollection = await dbConnection.getCollection("ids");
		const paypalIntentsCollection =
			await dbConnection.getCollection("paypal_intents");

		const user = await idsCollection.findOne({ identifier });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const order = await createOrder(amount);

		const inserted = await paypalIntentsCollection.insertOne({
			created: new Date(),
			identifier,
			amount: parseFloat(amount),
			paypalOrderId: order.id,
			status: "CREATED",
		});

		res.status(200).json({
			id: inserted.insertedId,
			paypalOrderId: order.id,
			approvalLink: order.links.find((link) => link.rel === "approve").href,
			captureUrl: `${process.env.NEXTAUTH_URL}/api/paypal/capture`,
		});
	} catch (error) {
		console.error("PayPal intent creation error:", error);
		res.status(500).json({ error: "Failed to create PayPal intent" });
	}
}
