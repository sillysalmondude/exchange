import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import { randomBytes } from "crypto";
import dbConnection from "@/lib/db";

async function handler(req, res) {
	const session = await getServerSession(req, res, authOptions);

	if (!session) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const usersCollection = await dbConnection.getCollection("users");

		const user = await usersCollection.findOne({
			username: session.user.username,
		});

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const newToken = randomBytes(32).toString("hex");

		await usersCollection.updateOne(
			{ username: session.user.username },
			{ $set: { token: newToken } },
		);

		res.status(200).json({ token: newToken });
	} catch (error) {
		console.error("Error rotating token:", error);
		res.status(500).json({ error: "Internal server error" });
	}
}

export default handler;
