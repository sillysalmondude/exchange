import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";

export default function Login() {
	const username = useRef();
	const password = useRef();
	const button = useRef();
	const router = useRouter();
	const session = useSession();
	const [error, setError] = useState("");

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const usernameParam = urlParams.get("username");
		if (usernameParam) {
			username.current.value = usernameParam;
		}
	}, []);

	const handleLogin = async (e) => {
		e.preventDefault();
		button.current.disabled = true;

		await signIn("credentials", {
			username: username.current.value,
			password: password.current.value,
			redirect: false,
		}).then((res) => {
			if (res.error) {
				button.current.disabled = false;
				setError(res.error);
			} else {
				router.push("/dashboard");
			}
		});
	};

	return (
		<div className="min-h-screen bg-black px-3 py-12 justify-center flex">
			<div className="w-full max-w-2xl text-white">
				<Header />
				<form
					className="flex flex-col gap-2 w-full text-white mt-6"
					onSubmit={handleLogin}
				>
					<Label className="text-lg">Sign In</Label>
					<Input
						placeholder="Username"
						className="border-neutral-800 placeholder:text-neutral-400"
						ref={username}
					/>
					<Input
						placeholder="Password"
						className="border-neutral-800 placeholder:text-neutral-400"
						ref={password}
						type="password"
					/>
					<Button className="bg-white text-black hover:bg-white" ref={button}>
						Login
					</Button>
				</form>
				<div className="mt-4 text-red-500">{error}</div>
			</div>
		</div>
	);
}
