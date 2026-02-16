import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

// Import the database connection
import dbConnection from "@/lib/db";

export const authOptions = {
	providers: [
		CredentialsProvider({
			name: "credentials",
			credentials: {
				username: { label: "Username", type: "text" },
				password: { label: "Password", type: "password" },
			},
			authorize: async (credentials) => {
				if (!credentials) {
					throw new Error("No credentials provided");
				}

				const { username, password } = credentials;

				try {
					const usersCollection = await dbConnection.getCollection("users");
					const user = await usersCollection.findOne({ username });

					if (!user) {
						throw new Error("User not found");
					}

					const isValid = await compare(password, user.password);

					if (!isValid) {
						throw new Error("Invalid password");
					}

					return { id: user._id.toString(), username: user.username };
				} catch (error) {
					console.error("Authentication error:", error);
					throw error;
				}
			},
		}),
	],
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.username = user.username;
			}
			return token;
		},
		async session({ session, token }) {
			session.user = { id: token.id, username: token.username };
			return session;
		},
	},
	pages: {
		signIn: "/login",
	},
	secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
