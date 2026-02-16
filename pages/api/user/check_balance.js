import { MongoClient } from "mongodb";
import rateLimit from "@/lib/limit";
import dbConnection from "@/lib/db";
import { checkAuthorization } from "@/lib/utils";

const limiter = rateLimit({
	interval: 60 * 1000, // 1 minute
	uniqueTokenPerInterval: 100,
});

async function handler(req, res) {
	try {
		await limiter.check(res, 10, "GET_ID_BALANCE");
	} catch {
		return res.status(429).json({ error: "Too many requests" });
	}

	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const auth = await checkAuthorization(req, res);
	if (!auth) {
		return res.status(403).json({ error: "Unauthorized" });
	}

	const { identifier } = req.query;

	if (!identifier) {
		return res.status(400).json({ error: "Identifier is required" });
	}

	try {
		const idsCollection = await dbConnection.getCollection("ids");

		const id = await idsCollection.findOne({ identifier: identifier });

		if (!id) {
			return res.status(404).json({ error: "Identifier not found" });
		}

		if (!id.balances) {
			id.balances = {
				ETH: 0,
				LTC: 0,
				PayPal: 0,
				CashApp: 0,
			};
		}
		const totalBalance = Object.values(id.balances).reduce(
			(sum, balance) => sum + balance,
			0,
		);

		return res.status(200).json({
			identifier: id.identifier,
			balances: id.balances,
			totalBalance: totalBalance,
		});
	} catch (error) {
		console.error("Error calculating id balance:", error);
		return res.status(500).json({ error: "Failed to calculate balance" });
	}
}

export default handler;
