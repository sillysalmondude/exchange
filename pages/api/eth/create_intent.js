import { ethers } from "ethers";
import rateLimit from "@/lib/limit";
import dbConnection from "@/lib/db";
import { checkAuthorization } from "@/lib/utils";

const limiter = rateLimit({
	interval: 2 * 1000,
	uniqueTokenPerInterval: 50,
});

async function handler(req, res) {
	await limiter.check(res, 2, "CREATE_ETH_ADDRESS");
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
		const wallet = ethers.Wallet.createRandom();

		const ids = await dbConnection.getCollection("ids");
		const user = await ids.findOne({ identifier });

		if (!user) {
			return res.status(400).json({ error: "User not found" });
		}

		const collection = await dbConnection.getCollection("ethereum_intents");
		const created = new Date();
		await collection.insertOne({
			address: wallet.address,
			privateKey: wallet.privateKey,
			created,
			identifier,
			status: "PENDING",
		});

		res.status(201).json({ address: wallet.address, created });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to create wallet" });
	}
}

export default handler;
