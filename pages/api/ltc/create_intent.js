import { checkAuthorization } from "@/lib/utils";
import dbConnection from "@/lib/db";
import rateLimit from "@/lib/limit";
import { createLitecoinAddress } from "../../../lib/ltcUtils";

const limiter = rateLimit({
	interval: 2 * 1000,
	uniqueTokenPerInterval: 50,
});

export default async function handler(req, res) {
	await limiter.check(res, 2, "CREATE_LTC_ADDRESS");
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	const { identifier } = req.body;

	if (!identifier) {
		return res.status(400).json({ error: "Identifier is required" });
	}

	const auth = await checkAuthorization(req, res);
	if (!auth) {
		return res.status(403).json({ error: "Unauthorized" });
	}

	try {
		const { address, privateKey } = createLitecoinAddress();

		const ids = await dbConnection.getCollection("ids");
		const check = await ids.findOne({ identifier });

		if (!check) {
			return res.status(400).json({ error: "Identifier not found" });
		}

		const collection = await dbConnection.getCollection("litecoin_intents");
		const created = new Date();
		await collection.insertOne({
			address,
			privateKey,
			created,
			identifier,
			status: "PENDING",
		});

		res.status(201).json({ address, created });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to create LTC address" });
	}
}
