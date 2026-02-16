import Link from "next/link";
import { Separator } from "./ui/separator";
import { signOut, useSession } from "next-auth/react";

export default function Header() {
	const session = useSession();
	return (
		<div tag="header">
			<h1 className="text-white text-2xl">Exchange</h1>
			<Separator className="bg-neutral-700" />
			<div className="flex w-full justify-between">
				<div className="flex gap-2">
					<Link href="/">Home</Link>
					<Link href="/apiref">API</Link>
					{session.status != "authenticated" && (
						<>
							<Link href="/login">Login</Link>
							<Link href="/register">Register</Link>
						</>
					)}
					{session.status == "authenticated" && (
						<>
							<Link href="/dashboard">Dashboard</Link>
						</>
					)}
				</div>
				{session.status == "authenticated" && (
					<button
						onClick={() => {
							signOut({ redirect: false });
						}}
					>
						Sign Out
					</button>
				)}
			</div>
		</div>
	);
}
