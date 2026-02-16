import { ObjectId } from "mongodb";
import rateLimit from "@/lib/limit";
import { ethers } from "ethers";
import dbConnection from "../../../lib/db";

const limiter = rateLimit({
	interval: 60 * 1000,
	uniqueTokenPerInterval: 50,
});

async function handler(req, res) {
	try {
		await limiter.check(res, 5, "CHECK_ETH_INTENT");
	} catch {
		return res.status(429).json({ error: "Too many requests" });
	}

	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { address } = req.body;

	if (!address) {
		return res.status(400).json({ error: "Deposit address is required" });
	}

	try {
		const intentsCollection =
			await dbConnection.getCollection("ethereum_intents");
		const idsCollection = await dbConnection.getCollection("ids");

		const intent = await intentsCollection.findOne({ address });

		if (!intent) {
			return res.status(404).json({ error: "Address not found" });
		}

		const provider = new ethers.JsonRpcProvider(
			`https://${process.env.ETHEREUM_NETWORK}.infura.io/v3/${process.env.INFURA}`,
		);

		const balance = await provider.getBalance(intent.address);
		const balanceEth = ethers.formatEther(balance);

		if (balance > 0n && intent.status !== "COMPLETED") {
			// Estimate gas cost for the transfer
			const wallet = new ethers.Wallet(intent.privateKey, provider);
			const centralWalletAddress = process.env.ETH_CENTRAL_WALLET_ADDRESS;

			const feeData = await provider.getFeeData();
			const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;
			const gasLimit = 21000; // standard gas limit for ETH transfer
			const estimatedGasCost = gasPrice * BigInt(gasLimit);

			if (balance > estimatedGasCost) {
				// If there's enough balance to cover gas, transfer to central wallet
				const value = balance - estimatedGasCost;

				const tx = await wallet.sendTransaction({
					to: centralWalletAddress,
					value: value,
					gasLimit: gasLimit,
					gasPrice: gasPrice,
				});

				await tx.wait();

				// Update the intent status and user balance
				await intentsCollection.updateOne(
					{ address, status: { $ne: "COMPLETED" } },
					{ $set: { status: "COMPLETED", amount: ethers.formatEther(value) } },
				);

				await idsCollection.updateOne(
					{ identifier: intent.identifier },
					{
						$inc: { "balances.ETH": parseFloat(ethers.formatEther(value)) },
						$push: {
							transactions: {
								type: "deposit",
								token: "ETH",
								amount: ethers.formatEther(value),
								fee: ethers.formatEther(estimatedGasCost),
								timestamp: new Date(),
							},
						},
					},
				);

				return res.status(200).json({
					id: intent._id,
					identifier: intent.identifier,
					address: intent.address,
					amount: ethers.formatEther(value),
					fee: ethers.formatEther(estimatedGasCost),
					status: "COMPLETED",
				});
			} else {
				// If there's not enough balance to cover gas, just mark as completed without transfer
				await intentsCollection.updateOne(
					{ address, status: { $ne: "COMPLETED" } },
					{ $set: { status: "COMPLETED", amount: balanceEth } },
				);

				await idsCollection.updateOne(
					{ identifier: intent.identifier },
					{
						$inc: { "balances.ETH": parseFloat(balanceEth) },
						$push: {
							transactions: {
								type: "deposit",
								token: "ETH",
								amount: balanceEth,
								fee: "0",
								timestamp: new Date(),
							},
						},
					},
				);

				return res.status(200).json({
					id: intent._id,
					identifier: intent.identifier,
					address: intent.address,
					amount: balanceEth,
					fee: "0",
					status: "COMPLETED",
					message:
						"Balance too low to cover gas costs. Funds credited without transfer.",
				});
			}
		}

		return res.status(200).json({
			id: intent._id,
			identifier: intent.identifier,
			address: intent.address,
			amount: balanceEth,
			status: intent.status || "PENDING",
		});
	} catch (error) {
		console.error("Ethereum intent check error:", error);
		res
			.status(500)
			.json({
				error: "Failed to check Ethereum intent",
				details: error.message,
			});
	}
}

export default handler;
