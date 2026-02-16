import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import axios from "axios";

export default function Register() {
	const username = useRef();
	const password = useRef();
	const confirm = useRef();
	const button = useRef();
	const router = useRouter();
	const [error, setError] = useState("");

	const handleRegister = async (e) => {
		e.preventDefault();
		button.current.disabled = true;

		if (password.current.value !== confirm.current.value) {
			setError("Passwords do not match");
			button.current.disabled = false;
			return;
		}

		axios
			.post("/api/auth/register", {
				username: username.current.value,
				password: password.current.value,
			})
			.then((response) => {
				if (response.status === 201) {
					router.push(`/login?username=${username.current.value}`);
				} else {
					setError("Registration failed");
				}
			})
			.catch((error) => {
				setError(error.response.data.message);
			})
			.finally(() => {
				button.current.disabled = false;
			});
	};

	return (
		<div className="min-h-screen bg-black px-3 py-12 justify-center flex">
			<div className="w-full max-w-2xl text-white">
				<Header />
				<form
					className="flex flex-col gap-2 w-full text-white mt-6"
					onSubmit={handleRegister}
				>
					<Label className="text-lg">Register</Label>
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
					<Input
						placeholder="Confirm Password"
						className="border-neutral-800 placeholder:text-neutral-400"
						ref={confirm}
						type="password"
					/>
					<Button className="bg-white text-black hover:bg-white" ref={button}>
						Register
					</Button>
					<p className="text-red-500">{error}</p>
				</form>
			</div>
		</div>
	);
}
