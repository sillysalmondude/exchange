import { sendLitecoin } from "../../../lib/ltcUtils";
import { checkAuthorization } from "@/lib/utils";
import dbConnection from "@/lib/db";
import rateLimit from "@/lib/limit";
import { convertCurrency } from "@/lib/currency-conversion";

const limiter = rateLimit({
	interval: 60 * 1000,
	uniqueTokenPerInterval: 50,
});

const NETWORK_FEE = 0.001;

export default async function handler(req, res) {
	try {
		await limiter.check(res, 5, "WITHDRAW_LTC");
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

	const { identifier, amount, recipient, fromCurrency } = req.body;

	if (!identifier) {
		return res.status(400).json({ error: "Identifier is required" });
	}

	if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
		return res.status(400).json({ error: "Invalid amount" });
	}

	if (!recipient) {
		return res.status(400).json({ error: "Invalid recipient address" });
	}

	if (!fromCurrency || !["ETH", "LTC", "USD"].includes(fromCurrency)) {
		return res.status(400).json({ error: "Invalid from currency" });
	}

	try {
		const idsCollection = await dbConnection.getCollection("ids");

		const user = await idsCollection.findOne({ identifier });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const ltcAmount = convertCurrency(parseFloat(amount), fromCurrency, "LTC");
		const totalAmount = ltcAmount + NETWORK_FEE;

		if (user.balances[fromCurrency] < parseFloat(amount)) {
			return res
				.status(400)
				.json({ error: "Insufficient funds (including network fee)" });
		}

		const centralWalletPrivateKey = process.env.LTC_CENTRAL_WALLET_PRIVATE_KEY;
		if (!centralWalletPrivateKey) {
			return res.status(500).json({ error: "Central wallet not configured" });
		}

		const txResult = await sendLitecoin(
			centralWalletPrivateKey,
			recipient,
			ltcAmount,
		);

		await idsCollection.updateOne(
			{ identifier },
			{
				$inc: { [`balances.${fromCurrency}`]: -parseFloat(amount) },
				$push: {
					transactions: {
						type: "withdrawal",
						token: "LTC",
						fromCurrency: fromCurrency,
						amount: ltcAmount,
						fee: NETWORK_FEE,
						recipient,
						txid: txResult.txid,
						timestamp: new Date(),
					},
				},
			},
		);

		return res.status(200).json({
			txid: txResult.txid,
			amount: ltcAmount,
			fee: NETWORK_FEE,
			recipient,
		});
	} catch (error) {
		console.error("LTC withdrawal error:", error);
		return res.status(500).json({ error: "Failed to process withdrawal" });
	}
}
