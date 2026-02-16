import { clsx } from "clsx";
import dbConnection from "./db";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
	return twMerge(clsx(inputs));
}

async function checkAuthorization(req, res) {
	if (typeof window !== "undefined") {
		throw new Error(
			"Authorization check cannot be performed on the client-side",
		);
	}

	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
		return null;
	}

	const token = authHeader.split(" ")[1];
	const usersCollection = await dbConnection.getCollection("users");
	const user = await usersCollection.findOne({ token });

	if (!user) {
		res.status(401).json({ error: "Unauthorized: Invalid token" });
		return null;
	}

	return user;
}

export { cn, checkAuthorization };
