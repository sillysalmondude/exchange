const { Scenes } = require("telegraf");
const makeRequest = require("../makeRequest");

const checkBalanceScene = new Scenes.BaseScene("checkBalance");

checkBalanceScene.enter((ctx) => {
	ctx.reply("Please enter your user identifier:");
});

checkBalanceScene.on("text", async (ctx) => {
	const identifier = ctx.message.text;

	try {
		const result = await makeRequest(
			"GET",
			`/user/check_balance?identifier=${identifier}`,
		);

		let balanceMessage = "Your current balances:\n\n";
		for (const [currency, amount] of Object.entries(result.balances)) {
			balanceMessage += `${currency}: ${amount}\n`;
		}
		balanceMessage += `\nTotal Balance: ${result.totalBalance}`;

		ctx.reply(balanceMessage);
		ctx.scene.leave();
	} catch (error) {
		ctx.reply(`Error checking balance: ${error.message}\nPlease try again.`);
		ctx.scene.leave();
	}
});

module.exports = checkBalanceScene;
