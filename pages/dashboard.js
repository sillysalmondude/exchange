import Header from "@/components/header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";

export default function Dashboard({ initialAccount }) {
	const [user, setUser] = useState(initialAccount);
	const [tooltipVisible, setTooltipVisible] = useState(false);
	const session = useSession();
	const router = useRouter();

	useEffect(() => {
		if (session.status === "unauthenticated") {
			router.push("/login");
		}
	}, [session, router]);

	const handleCopy = () => {
		navigator.clipboard.writeText(user.token);
		setTooltipVisible(true);
		setTimeout(() => {
			setTooltipVisible(false);
		}, 2000);
	};

	const handleRotate = async () => {
		try {
			const response = await fetch("/api/auth/rotate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			if (data.token) {
				setUser({ ...user, token: data.token });
			}
		} catch (error) {
			console.error("Failed to rotate token:", error);
		}
	};

	if (session.status === "loading") {
		return <div>Loading...</div>;
	}

	return (
		<div className="min-h-screen bg-black px-3 py-12 justify-center flex">
			<div className="w-full max-w-2xl text-white">
				<Header />
				<Separator className="bg-neutral-700 my-4" />
				<Label className="mr-2">API Key</Label>
				<div className="flex items-center">
					<Input
						placeholder="API Key"
						className="border-neutral-800 placeholder:text-neutral-400"
						value={user.token}
						disabled
					/>
					<div className="relative ml-2 flex items-center">
						<button
							onClick={handleCopy}
							className="py-1 px-3 border border-neutral-500 hover:bg-neutral-700 transition-colors"
						>
							Copy
						</button>
						{tooltipVisible && (
							<div className="absolute -top-6 px-3 text-xs text-white bg-black">
								Copied!
							</div>
						)}
					</div>
				</div>
				<button
					onClick={handleRotate}
					className="py-1 w-full lg:w-auto px-12 mt-2 border border-red-500 text-red-500 hover:border-red-700 transition-colors"
				>
					Rotate API Key
				</button>
			</div>
		</div>
	);
}

export async function getServerSideProps(context) {
	const { req, res } = context;
	const session = await getSession({ req });

	if (!session) {
		return {
			redirect: {
				destination: "/login",
				permanent: false,
			},
		};
	}

	// Import database connection and MongoClient only on the server side
	const { default: dbConnection } = await import("@/lib/db");

	const usersCollection = await dbConnection.getCollection("users");
	const user = await usersCollection.findOne({
		username: session.user.username,
	});

	if (!user) {
		return {
			redirect: {
				destination: "/login",
				permanent: false,
			},
		};
	}

	// Ensure the user object is serializable
	const serializableUser = {
		...user,
		_id: user._id.toString(), // Convert ObjectId to string
		registrationDate: user.registrationDate.toISOString(), // Convert Date to ISO string
	};

	return {
		props: {
			initialAccount: serializableUser,
		},
	};
}
