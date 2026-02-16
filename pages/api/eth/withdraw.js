import { ethers } from "ethers";
import rateLimit from "@/lib/limit";
import dbConnection from "../../../lib/db";
import { convertCurrency } from "@/lib/currency-conversion";

const limiter = rateLimit({
	interval: 60 * 1000,
	uniqueTokenPerInterval: 50,
});

async function handler(req, res) {
	try {
		await limiter.check(res, 5, "WITHDRAW_ETH");
	} catch {
		return res.status(429).json({ error: "Too many requests" });
	}

	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { identifier, amount, recipient, fromCurrency } = req.body;

	if (!identifier) {
		return res.status(400).json({ error: "Identifier is required" });
	}

	if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
		return res.status(400).json({ error: "Invalid amount" });
	}

	if (!recipient || !ethers.isAddress(recipient)) {
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

		const ethAmount = convertCurrency(parseFloat(amount), fromCurrency, "ETH");

		if (user.balances[fromCurrency] < parseFloat(amount)) {
			return res.status(400).json({ error: "Insufficient funds" });
		}

		const provider = new ethers.JsonRpcProvider(
			`https://${process.env.ETHEREUM_NETWORK}.infura.io/v3/${process.env.INFURA}`,
		);

		const centralWallet = new ethers.Wallet(
			process.env.ETH_CENTRAL_WALLET_PRIVATE_KEY,
			provider,
		);

		const feeData = await provider.getFeeData();
		const gasLimit = await provider.estimateGas({
			to: recipient,
			value: ethers.parseEther(ethAmount.toString()),
		});

		const maxFeePerGas = feeData.maxFeePerGas;
		const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

		const txFee = maxFeePerGas * gasLimit;
		const totalAmount = ethers.parseEther(ethAmount.toString()) + txFee;

		const centralWalletBalance = await provider.getBalance(
			centralWallet.address,
		);

		if (centralWalletBalance < totalAmount) {
			return res
				.status(400)
				.json({ error: "Insufficient funds in central wallet" });
		}

		const tx = await centralWallet.sendTransaction({
			to: recipient,
			value: ethers.parseEther(ethAmount.toString()),
			gasLimit: gasLimit,
			maxFeePerGas: maxFeePerGas,
			maxPriorityFeePerGas: maxPriorityFeePerGas,
		});

		const receipt = await tx.wait();

		await idsCollection.updateOne(
			{ identifier: identifier },
			{
				$inc: { [`balances.${fromCurrency}`]: -parseFloat(amount) },
				$push: {
					transactions: {
						type: "withdrawal",
						token: "ETH",
						fromCurrency: fromCurrency,
						amount: ethAmount,
						fee: ethers.formatEther(txFee),
						recipient: recipient,
						hash: receipt.hash,
						timestamp: new Date(),
					},
				},
			},
		);

		return res.status(200).json({
			transactionHash: receipt.hash,
			from: receipt.from,
			to: receipt.to,
			amount: ethAmount,
			fee: ethers.formatEther(txFee),
		});
	} catch (error) {
		console.error("Withdrawal error:", error);
		return res
			.status(500)
			.json({ error: "Failed to process withdrawal", details: error.message });
	}
}

export default handler;
