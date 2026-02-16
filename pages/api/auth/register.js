import { MongoClient } from "mongodb";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import rateLimit from "@/lib/limit";
import dbConnection from "../../../lib/db";

const limiter = rateLimit({
	interval: 60 * 1000, // 1 minute
	uniqueTokenPerInterval: 10,
});

async function handler(req, res) {
	try {
		await limiter.check(res, 5, "REGISTER_RATE_LIMIT");
	} catch {
		return res.status(429).json({ message: "Too many requests" });
	}

	if (req.method !== "POST") {
		return res.status(405).json({ message: "Method not allowed" });
	}

	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ message: "Missing required fields" });
	}

	if (password.length < 8) {
		return res
			.status(400)
			.json({ message: "Password must be at least 8 characters" });
	}

	if (!/\d/.test(password)) {
		return res
			.status(400)
			.json({ message: "Password must contain at least one number" });
	}

	if (username.length < 3 || username.length > 16) {
		return res
			.status(400)
			.json({ message: "Username must be between 3-16 characters" });
	}

	try {
		const users = await dbConnection.getCollection("users");

		const existingUser = await users.findOne({ username });
		if (existingUser) {
			return res.status(400).json({ message: "Username already exists" });
		}

		const hashedPassword = await hash(password, 12);
		const token = randomBytes(32).toString("hex");

		await users.insertOne({
			username,
			password: hashedPassword,
			admin: false,
			registrationDate: new Date(),
			token,
		});

		return res.status(201).json({ message: "User registered successfully" });
	} catch (error) {
		console.error("Registration error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export default handler;
