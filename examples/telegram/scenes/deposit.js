const { Scenes } = require("telegraf");
const makeRequest = require("../makeRequest");

const depositScene = new Scenes.BaseScene("deposit");

depositScene.enter((ctx) => {
	ctx.reply("Please enter your user identifier:");
	ctx.scene.state.step = "identifier";
});

depositScene.on("text", async (ctx) => {
	const { step } = ctx.scene.state;

	if (step === "identifier") {
		ctx.scene.state.identifier = ctx.message.text;
		ctx.reply("Select the deposit method (ETH/LTC/CashApp/PayPal):");
		ctx.scene.state.step = "method";
	} else if (step === "method") {
		const method = ctx.message.text.toLowerCase();
		ctx.scene.state.method = method;

		if (["eth", "ltc"].includes(method)) {
			try {
				const result = await makeRequest("POST", `/${method}/create_intent`, {
					identifier: ctx.scene.state.identifier,
				});
				ctx.reply(
					`Deposit address created:\n${result.address}\n\n` +
						"Please send your funds to this address. Once the transaction is confirmed, your balance will be updated.\n\n" +
						"You can check the status of your deposit later using the /check_intent command.",
				);
				ctx.scene.state.step = "check_status";
				ctx.scene.state.address = result.address;
			} catch (error) {
				ctx.reply(
					`Error creating deposit address: ${error.message}\nPlease try again.`,
				);
				ctx.scene.leave();
			}
		} else if (method === "cashapp") {
			try {
				const result = await makeRequest("POST", "/cashapp/create_intent", {
					identifier: ctx.scene.state.identifier,
					amount: 0,
				});
				ctx.reply(
					`CashApp deposit reference created:\n${result.ref}\n` +
						`Intent ID: ${result.id}\n\n` +
						"Please send your payment via CashApp and use this reference as the note.\n" +
						"After sending the payment, please provide the receipt URL.\n\n" +
						"You can check the status of your deposit later using the /check_intent command.",
				);
				ctx.scene.state.step = "cashapp_receipt";
				ctx.scene.state.intentId = result.id;
			} catch (error) {
				ctx.reply(
					`Error creating CashApp intent: ${error.message}\nPlease try again.`,
				);
				ctx.scene.leave();
			}
		} else if (method === "paypal") {
			ctx.reply("Please enter the amount you want to deposit (in USD):");
			ctx.scene.state.step = "paypal_amount";
		} else {
			ctx.reply(
				"Invalid deposit method. Please choose ETH, LTC, CashApp, or PayPal.",
			);
		}
	} else if (step === "paypal_amount") {
		const amount = parseFloat(ctx.message.text);
		if (isNaN(amount) || amount <= 0) {
			ctx.reply("Please enter a valid amount greater than 0.");
			return;
		}

		try {
			const result = await makeRequest("POST", "/paypal/create_intent", {
				identifier: ctx.scene.state.identifier,
				amount: amount,
			});
			ctx.reply(
				`PayPal deposit intent created.\n` +
					`Intent ID: ${result.id}\n\n` +
					`Please complete the payment using this link:\n${result.approvalLink}\n\n` +
					'After completing the payment, type "done" to check the status.\n\n' +
					"You can also check the status of your deposit later using the /check_intent command.",
			);
			ctx.scene.state.step = "paypal_check";
			ctx.scene.state.paypalIntentId = result.id;
		} catch (error) {
			ctx.reply(
				`Error creating PayPal intent: ${error.message}\nPlease try again.`,
			);
			ctx.scene.leave();
		}
	} else if (step === "cashapp_receipt") {
		const receiptUrl = ctx.message.text;
		try {
			const result = await makeRequest("POST", "/cashapp/check_intent", {
				id: ctx.scene.state.intentId,
				receipt: receiptUrl,
			});
			ctx.reply(`CashApp deposit status: ${result.status}\n${result.message}`);
			ctx.scene.leave();
		} catch (error) {
			ctx.reply(
				`Error checking CashApp intent: ${error.message}\nPlease try again.`,
			);
			ctx.scene.leave();
		}
	} else if (step === "paypal_check") {
		if (ctx.message.text.toLowerCase() === "done") {
			try {
				const result = await makeRequest("POST", "/paypal/check_intent", {
					id: ctx.scene.state.paypalIntentId,
				});
				ctx.reply(`PayPal deposit status: ${result.status}\n${result.message}`);
				if (result.status === "COMPLETED") {
					ctx.scene.leave();
				} else if (result.status === "APPROVED") {
					ctx.reply(
						"The payment is approved but not yet captured. Capturing payment now...",
					);
					try {
						const captureResult = await makeRequest("POST", "/paypal/capture", {
							orderId: result.paypalOrderId,
						});
						ctx.reply(
							`Payment captured: ${captureResult.status}\n${captureResult.message}`,
						);
						ctx.scene.leave();
					} catch (error) {
						ctx.reply(
							`Error capturing payment: ${error.message}\nPlease contact support.`,
						);
						ctx.scene.leave();
					}
				} else {
					ctx.reply(
						"Payment not yet completed. Please try checking again later.",
					);
				}
			} catch (error) {
				ctx.reply(
					`Error checking PayPal intent: ${error.message}\nPlease try again.`,
				);
				ctx.scene.leave();
			}
		} else {
			ctx.reply('Please complete the payment and type "done" when finished.');
		}
	} else if (step === "check_status") {
		if (ctx.message.text.toLowerCase() === "yes") {
			try {
				const result = await makeRequest(
					"POST",
					`/${ctx.scene.state.method}/check_intent`,
					{
						address: ctx.scene.state.address,
					},
				);
				ctx.reply(
					`Deposit status: ${result.status}\nAmount: ${result.amount} ${ctx.scene.state.method.toUpperCase()}`,
				);
				ctx.scene.leave();
			} catch (error) {
				ctx.reply(
					`Error checking deposit status: ${error.message}\nPlease try again later.`,
				);
				ctx.scene.leave();
			}
		} else {
			ctx.reply(
				"Okay. Your deposit will be processed once confirmed. What would you like to do next?",
			);
			ctx.scene.leave();
		}
	}
});

module.exports = depositScene;
