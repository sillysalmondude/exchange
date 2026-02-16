import { randomBytes } from "crypto";
import dbConnection from "@/lib/db";
import { checkAuthorization } from "../../../lib/utils";

async function handler(req, res) {
	if (req.method !== "POST") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	const user = await checkAuthorization(req, res);
	if (!user) {
		return res.status(403).json({ error: "Unauthorized" });
	}

	try {
		const collection = await dbConnection.getCollection("ids");

		let identifier;
		let isUnique = false;
		while (!isUnique) {
			identifier = randomBytes(16).toString("hex");
			const existingUser = await collection.findOne({ identifier });
			if (!existingUser) {
				isUnique = true;
			}
		}

		await collection.insertOne({
			identifier,
			balances: {
				ETH: 0,
				LTC: 0,
				PayPal: 0,
				CashApp: 0,
			},
			transactions: [],
		});

		res.status(201).json({ identifier });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to create user" });
	}
}

export default handler;
