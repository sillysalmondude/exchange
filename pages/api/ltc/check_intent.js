// pages/api/ltc/check_intent.js

import { getAddressBalance } from "../../../lib/ltcUtils";
import { checkAuthorization } from "@/lib/utils";
import dbConnection from "@/lib/db";
import rateLimit from "@/lib/limit";

const limiter = rateLimit({
	interval: 60 * 1000,
	uniqueTokenPerInterval: 50,
});

export default async function handler(req, res) {
	try {
		await limiter.check(res, 5, "CHECK_LTC_INTENT");
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

	const { address } = req.body;

	if (!address) {
		return res.status(400).json({ error: "Deposit address is required" });
	}

	try {
		const intentsCollection =
			await dbConnection.getCollection("litecoin_intents");
		const idsCollection = await dbConnection.getCollection("ids");

		const intent = await intentsCollection.findOne({ address });

		if (!intent) {
			return res.status(404).json({ error: "Address not found" });
		}

		const balance = await getAddressBalance(intent.address);

		if (balance > 0 && intent.status !== "COMPLETED") {
			await intentsCollection.updateOne(
				{ address, status: { $ne: "COMPLETED" } },
				{ $set: { status: "COMPLETED", amount: balance } },
			);

			const existingTransaction = await idsCollection.findOne({
				identifier: intent.identifier,
				"transactions.intentId": intent._id,
			});

			if (!existingTransaction) {
				await idsCollection.updateOne(
					{ identifier: intent.identifier },
					{
						$inc: { "balances.LTC": balance },
						$push: {
							transactions: {
								intentId: intent._id,
								type: "deposit",
								token: "LTC",
								amount: balance,
								timestamp: new Date(),
							},
						},
					},
				);
			}

			return res.status(200).json({
				id: intent._id,
				identifier: intent.identifier,
				address: intent.address,
				amount: balance,
				status: "COMPLETED",
			});
		}

		return res.status(200).json({
			id: intent._id,
			identifier: intent.identifier,
			address: intent.address,
			amount: balance,
			status: intent.status || "PENDING",
		});
	} catch (error) {
		console.error("Litecoin intent check error:", error);
		res.status(500).json({ error: "Failed to check Litecoin intent" });
	}
}
