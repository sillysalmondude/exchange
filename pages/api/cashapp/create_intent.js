import rateLimit from "@/lib/limit";
import dbConnection from "../../../lib/db";
import { checkAuthorization } from "@/lib/utils";

const limiter = rateLimit({
	interval: 2 * 1000,
	uniqueTokenPerInterval: 50,
});

async function handler(req, res) {
	await limiter.check(res, 2, "INTENT_CASHAPP");
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { identifier, amount } = req.body;

	if (!identifier) {
		return res.status(400).json({ error: "Identifier is required" });
	}

	if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
		return res.status(400).json({ error: "Valid amount is required" });
	}

	const auth = await checkAuthorization(req, res);
	if (!auth) {
		return res.status(403).json({ error: "Unauthorized" });
	}

	try {
		const idsCollection = await dbConnection.getCollection("ids");
		const cashappIntentsCollection =
			await dbConnection.getCollection("cashapp_intents");

		const user = await idsCollection.findOne({ identifier });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		let uniqueCode;
		let isUnique = false;

		while (!isUnique) {
			uniqueCode = Math.floor(1000000 + Math.random() * 9000000).toString();
			const existingCode = await cashappIntentsCollection.findOne({
				code: uniqueCode,
			});
			if (!existingCode) {
				isUnique = true;
			}
		}

		const inserted = await cashappIntentsCollection.insertOne({
			created: new Date(),
			identifier,
			ref: uniqueCode,
			amount: parseFloat(amount),
			status: "PENDING",
		});

		res.status(200).json({
			id: inserted.insertedId,
			ref: uniqueCode,
			amount: parseFloat(amount),
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to create CashApp intent" });
	}
}

export default handler;
