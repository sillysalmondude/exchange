const { Telegraf, Scenes, session } = require("telegraf");
const { message } = require("telegraf/filters");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";
const AUTH_TOKEN = process.env.AUTH_TOKEN;

const createUserScene = require("./scenes/createUser");
const depositScene = require("./scenes/deposit");
const withdrawScene = require("./scenes/withdraw");
const checkBalanceScene = require("./scenes/checkBalance");
const checkIntentScene = require("./scenes/checkIntent");
const stage = new Scenes.Stage([
	createUserScene,
	depositScene,
	withdrawScene,
	checkBalanceScene,
	checkIntentScene,
]);

bot.use(session());
bot.use(stage.middleware());

function showMainMenu(ctx) {
	ctx.reply(
		"What would you like to do?\n\n" +
			"/create_user - Create a new user identifier\n" +
			"/deposit - Initiate a deposit\n" +
			"/withdraw - Initiate a withdrawal\n" +
			"/balance - Check your balance\n" +
			"/check_intent - Check status of a deposit\n" +
			"/cancel - Cancel the current operation",
	);
}

bot.command("start", (ctx) => {
	ctx.reply("Welcome to the Exchange Bot! Here are the available commands:");
	showMainMenu(ctx);
});

bot.command("create_user", (ctx) => ctx.scene.enter("createUser"));

bot.command("deposit", (ctx) => ctx.scene.enter("deposit"));

bot.command("withdraw", (ctx) => ctx.scene.enter("withdraw"));

bot.command("balance", (ctx) => ctx.scene.enter("checkBalance"));

bot.command("check_intent", (ctx) => ctx.scene.enter("checkIntent"));

bot.command("cancel", (ctx) => {
	ctx.reply("Operation cancelled. What would you like to do next?");
	ctx.scene.leave();
	showMainMenu(ctx);
});

bot.on("text", (ctx) => {
	if (!ctx.message.text.startsWith("/")) {
		ctx.reply(
			"I'm sorry, I didn't understand that command. Here are the available options:",
		);
		showMainMenu(ctx);
	}
});

const scenes = [
	createUserScene,
	depositScene,
	withdrawScene,
	checkBalanceScene,
];

scenes.forEach((scene) => {
	scene.command("cancel", (ctx) => {
		ctx.reply("Operation cancelled. What would you like to do next?");
		ctx.scene.leave();
		showMainMenu(ctx);
	});

	scene.on("scene_leave", (ctx) => {
		showMainMenu(ctx);
	});
});

bot.catch((err, ctx) => {
	console.error(`Error for ${ctx.updateType}`, err);
	ctx.reply("An unexpected error occurred. Please try again later.");
	showMainMenu(ctx);
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

module.exports = bot;
