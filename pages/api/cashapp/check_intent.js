import rateLimit from "@/lib/limit";
import puppeteer from "puppeteer";
import { ObjectId } from "mongodb";
import dbConnection from "../../../lib/db";
import { checkAuthorization } from "@/lib/utils";

const limiter = rateLimit({
	interval: 10 * 1000,
	uniqueTokenPerInterval: 50,
});

function isValidURL(string) {
	try {
		new URL(string);
		return true;
	} catch (_) {
		return false;
	}
}

async function handler(req, res) {
	await limiter.check(res, 5, "CHECK_INTENT_CASHAPP");
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const auth = await checkAuthorization(req, res);
	if (!auth) {
		return res.status(403).json({ error: "Unauthorized" });
	}

	const { id, receipt } = req.body;

	if (!id || !receipt) {
		return res
			.status(400)
			.json({ error: "Intent ID and Receipt are required" });
	}

	if (!isValidURL(receipt)) {
		return res.status(400).json({ error: "Invalid receipt URL provided" });
	}

	try {
		const cashappIntentsCollection =
			await dbConnection.getCollection("cashapp_intents");
		const idsCollection = await dbConnection.getCollection("ids");

		const intent = await cashappIntentsCollection.findOne({
			_id: new ObjectId(id),
		});

		if (!intent) {
			return res.status(404).json({ error: "Intent not found" });
		}

		let browser;
		try {
			browser = await puppeteer.launch({
				headless: true,
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
			});
			const page = await browser.newPage();

			await page.setUserAgent(
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
			);

			await page.goto(receipt, {
				waitUntil: "networkidle2",
				timeout: 30000, // 30 seconds timeout
			});

			try {
				await page.waitForFunction(
					() => document.body.innerText.includes("Payment"),
					{ timeout: 10000 },
				);
			} catch (error) {
				throw new Error("Payment information not found on the page");
			}

			const receiptText = await page.evaluate(() => {
				const bodyText = document.body.textContent || document.body.innerText;
				const sanitizedText = bodyText.replace(/\s+/g, " ").trim();

				const match = sanitizedText.match(/([£$€¥₹]\s?\d+(\.\d{1,2})?)/);
				const statusMatch = sanitizedText.match(
					/(Received|canceled|cancelled)/i,
				);
				const matchTwo = sanitizedText.match(/For (\w{1,10} \d{1,10})/);
				const tagMatch = sanitizedText.match(/Payment from ([£$€¥₹]?\w+)/);

				return {
					receipt: match ? match[0].trim() : null,
					status: statusMatch ? statusMatch[0] : null,
					ref: matchTwo ? matchTwo[0].substring(4) : null,
					tag: tagMatch ? tagMatch[1] : null,
				};
			});

			const isReceived = receiptText.status
				? /Received/i.test(receiptText.status)
				: false;

			const isCanceled = receiptText.status
				? /(canceled|cancelled)/i.test(receiptText.status)
				: false;

			if (isReceived && !isCanceled) {
				const receivedAmount = parseFloat(
					receiptText.receipt.replace(/[^0-9.-]+/g, ""),
				);

				if (receivedAmount >= intent.amount) {
					await cashappIntentsCollection.updateOne(
						{ _id: new ObjectId(id) },
						{ $set: { status: "COMPLETED" } },
					);

					await idsCollection.updateOne(
						{ identifier: intent.identifier },
						{
							$inc: { "balances.CashApp": intent.amount },
							$push: {
								transactions: {
									type: "deposit",
									token: "CashApp",
									amount: intent.amount,
									timestamp: new Date(),
								},
							},
						},
					);

					return res.status(200).json({
						id: intent._id,
						identifier: intent.identifier,
						refSent: intent.ref,
						refReceived: receiptText.ref,
						amount: intent.amount,
						status: "COMPLETED",
						message: "Payment received and processed successfully.",
					});
				} else {
					return res.status(200).json({
						id: intent._id,
						identifier: intent.identifier,
						refSent: intent.ref,
						refReceived: receiptText.ref,
						amountExpected: intent.amount,
						amountReceived: receivedAmount,
						status: "PARTIAL",
						message:
							"Received amount is less than expected. Please contact support.",
					});
				}
			}

			return res.status(200).json({
				id: intent._id,
				identifier: intent.identifier,
				refSent: intent.ref,
				refReceived: receiptText.ref,
				amount: receiptText.receipt,
				status: "PENDING",
				message: "Payment not yet received or confirmed.",
			});
		} catch (error) {
			console.error("Puppeteer error:", error);
			return res.status(400).json({
				error: "Failed to process the receipt URL",
				message:
					"Please make sure the URL is valid, accessible, and contains the expected payment information.",
			});
		} finally {
			if (browser) {
				await browser.close();
			}
		}
	} catch (error) {
		console.error("Error occurred:", error);
		res.status(500).json({ error: "Failed to check intent" });
	}
}

export default handler;
