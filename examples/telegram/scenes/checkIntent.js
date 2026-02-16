const { Scenes } = require("telegraf");
const makeRequest = require("../makeRequest");

const checkIntentScene = new Scenes.BaseScene("checkIntent");

checkIntentScene.enter((ctx) => {
	ctx.reply(
		"Please select the deposit method you want to check (ETH/LTC/CashApp/PayPal):",
	);
	ctx.scene.state.step = "method";
});

checkIntentScene.on("text", async (ctx) => {
	const { step } = ctx.scene.state;

	if (step === "method") {
		const method = ctx.message.text.toLowerCase();
		if (["eth", "ltc", "cashapp", "paypal"].includes(method)) {
			ctx.scene.state.method = method;
			if (method === "eth" || method === "ltc") {
				ctx.reply("Please enter the deposit address:");
			} else if (method === "cashapp") {
				ctx.reply("Please enter the CashApp intent ID:");
			} else if (method === "paypal") {
				ctx.reply("Please enter the PayPal intent ID:");
			}
			ctx.scene.state.step = "check";
		} else {
			ctx.reply("Invalid method. Please choose ETH, LTC, CashApp, or PayPal.");
		}
	} else if (step === "check") {
		const { method } = ctx.scene.state;
		const value = ctx.message.text;

		try {
			let result;
			if (method === "eth" || method === "ltc") {
				result = await makeRequest("POST", `/${method}/check_intent`, {
					address: value,
				});
			} else if (method === "cashapp") {
				result = await makeRequest("POST", "/cashapp/check_intent", {
					id: value,
					receipt: "placeholder",
				});
			} else if (method === "paypal") {
				result = await makeRequest("POST", "/paypal/check_intent", {
					id: value,
				});
			}

			let responseMessage = `Intent status: ${result.status}\n`;
			if (result.amount) responseMessage += `Amount: ${result.amount}\n`;
			if (result.message) responseMessage += `Message: ${result.message}\n`;

			ctx.reply(responseMessage);

			if (method === "paypal" && result.status === "APPROVED") {
				ctx.reply(
					"The PayPal payment is approved but not yet captured. Would you like to capture it now? (Yes/No)",
				);
				ctx.scene.state.step = "capture";
				ctx.scene.state.paypalOrderId = result.paypalOrderId;
			} else {
				ctx.reply("Would you like to check another intent? (Yes/No)");
				ctx.scene.state.step = "repeat";
			}
		} catch (error) {
			ctx.reply(`Error checking intent: ${error.message}\nPlease try again.`);
			ctx.scene.leave();
		}
	} else if (step === "capture") {
		if (ctx.message.text.toLowerCase() === "yes") {
			try {
				const result = await makeRequest("POST", "/paypal/capture", {
					orderId: ctx.scene.state.paypalOrderId,
				});
				ctx.reply(`Payment captured: ${result.status}\n${result.message}`);
			} catch (error) {
				ctx.reply(
					`Error capturing payment: ${error.message}\nPlease try again later or contact support.`,
				);
			}
		}
		ctx.reply("Would you like to check another intent? (Yes/No)");
		ctx.scene.state.step = "repeat";
	} else if (step === "repeat") {
		if (ctx.message.text.toLowerCase() === "yes") {
			ctx.reply(
				"Please select the deposit method you want to check (ETH/LTC/CashApp/PayPal):",
			);
			ctx.scene.state.step = "method";
		} else {
			ctx.reply("Alright, is there anything else you would like to do?");
			ctx.scene.leave();
		}
	}
});

module.exports = checkIntentScene;
