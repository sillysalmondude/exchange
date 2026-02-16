import axios from "axios";
import ethers, { formatEther } from "ethers";
import dbConnection from "../../../lib/db";

async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	const { address } = req.query;

	try {
		const collection = await dbConnection.getCollection("ethereum_wallets");
		const wallet = await collection.findOne({ address: address });

		if (!wallet) {
			return res.status(404).json({ error: "Wallet not found" });
		}

		const balance = await axios.get(
			`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.ETHERSCAN_API}`,
		);

		res.status(200).json({ balance: formatEther(balance.data.result) });
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: "Failed to create wallet" });
	}
}

export default handler;
