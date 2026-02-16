const { Scenes } = require("telegraf");
const makeRequest = require("../makeRequest");

const createUserScene = new Scenes.BaseScene("createUser");

createUserScene.enter((ctx) => {
	ctx.reply(
		"Are you sure you want to create a new user identifier? This action cannot be undone. (Yes/No)",
	);
});

createUserScene.on("text", async (ctx) => {
	const answer = ctx.message.text.toLowerCase();
	if (answer === "yes") {
		try {
			const result = await makeRequest("POST", "/user/create_user");
			ctx.reply(
				`Your new user identifier has been created: ${result.identifier}\n\n` +
					"WARNING: Please store this identifier securely. If you lose it, you won't be able to access your funds.\n\n" +
					"What would you like to do next?",
			);
			ctx.scene.leave();
		} catch (error) {
			ctx.reply(
				`Error creating user: ${error.message}\nPlease try again later.`,
			);
			ctx.scene.leave();
		}
	} else if (answer === "no") {
		ctx.reply("User creation cancelled. What would you like to do next?");
		ctx.scene.leave();
	} else {
		ctx.reply("Please answer with Yes or No.");
	}
});

module.exports = createUserScene;
