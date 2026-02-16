const { Scenes } = require("telegraf");
const makeRequest = require("../makeRequest");

const withdrawScene = new Scenes.BaseScene("withdraw");

withdrawScene.enter((ctx) => {
	ctx.reply("Please enter your user identifier:");
	ctx.scene.state.step = "identifier";
});

withdrawScene.on("text", async (ctx) => {
	const { step } = ctx.scene.state;

	if (step === "identifier") {
		ctx.scene.state.identifier = ctx.message.text;
		ctx.reply("Select the withdrawal method (ETH/LTC/PayPal):");
		ctx.scene.state.step = "method";
	} else if (step === "method") {
		const method = ctx.message.text.toLowerCase();
		ctx.scene.state.method = method;

		if (["eth", "ltc", "paypal"].includes(method)) {
			ctx.reply("Enter the amount you want to withdraw:");
			ctx.scene.state.step = "amount";
		} else {
			ctx.reply(
				"Invalid withdrawal method. Please choose ETH, LTC, or PayPal.",
			);
		}
	} else if (step === "amount") {
		const amount = parseFloat(ctx.message.text);
		if (isNaN(amount) || amount <= 0) {
			ctx.reply("Please enter a valid amount greater than 0.");
			return;
		}
		ctx.scene.state.amount = amount;

		if (ctx.scene.state.method === "paypal") {
			ctx.reply("Please enter your PayPal email address:");
			ctx.scene.state.step = "paypal_email";
		} else {
			ctx.reply("Please enter the recipient address:");
			ctx.scene.state.step = "recipient";
		}
	} else if (step === "paypal_email") {
		ctx.scene.state.recipient = ctx.message.text;
		ctx.scene.state.step = "confirm";
		ctx.reply(
			`Please confirm the following withdrawal:\n` +
				`Method: PayPal\n` +
				`Amount: $${ctx.scene.state.amount}\n` +
				`Recipient: ${ctx.scene.state.recipient}\n\n` +
				`Type 'confirm' to proceed or 'cancel' to abort.`,
		);
	} else if (step === "recipient") {
		ctx.scene.state.recipient = ctx.message.text;
		ctx.scene.state.step = "confirm";
		ctx.reply(
			`Please confirm the following withdrawal:\n` +
				`Method: ${ctx.scene.state.method.toUpperCase()}\n` +
				`Amount: ${ctx.scene.state.amount} ${ctx.scene.state.method.toUpperCase()}\n` +
				`Recipient: ${ctx.scene.state.recipient}\n\n` +
				`Type 'confirm' to proceed or 'cancel' to abort.`,
		);
	} else if (step === "confirm") {
		if (ctx.message.text.toLowerCase() === "confirm") {
			try {
				const result = await makeRequest(
					"POST",
					`/${ctx.scene.state.method}/withdraw`,
					{
						identifier: ctx.scene.state.identifier,
						amount: ctx.scene.state.amount,
						recipient: ctx.scene.state.recipient,
						fromCurrency: ctx.scene.state.method.toUpperCase(),
					},
				);

				if (ctx.scene.state.method === "paypal") {
					ctx.reply(
						`PayPal withdrawal initiated:\nStatus: ${result.status}\nAmount: $${result.amount}\nPayPal Payout ID: ${result.paypalPayoutId}`,
					);
				} else {
					ctx.reply(
						`${ctx.scene.state.method.toUpperCase()} withdrawal successful:\nTransaction Hash: ${result.transactionHash}\nAmount: ${result.amount} ${ctx.scene.state.method.toUpperCase()}\nFee: ${result.fee} ${ctx.scene.state.method.toUpperCase()}`,
					);
				}
				ctx.scene.leave();
			} catch (error) {
				ctx.reply(
					`Error processing withdrawal: ${error.message}\nPlease try again.`,
				);
				ctx.scene.leave();
			}
		} else if (ctx.message.text.toLowerCase() === "cancel") {
			ctx.reply("Withdrawal cancelled. What would you like to do next?");
			ctx.scene.leave();
		} else {
			ctx.reply(
				"Please type 'confirm' to proceed with the withdrawal or 'cancel' to abort.",
			);
		}
	}
});

module.exports = withdrawScene;
