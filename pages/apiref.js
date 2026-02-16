import APIRef from "@/components/apiref";
import Header from "@/components/header";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function Docs() {
	return (
		<div className="min-h-screen bg-black px-3 py-12 justify-center flex">
			<div className="w-full max-w-2xl text-white">
				<Header />
				<APIRef />
				The function of the API is to receieve payments via a provider and add
				them to a site wallet by providing deposit endpoints rather than being a
				direct swap with a the provider serving as a middleman authority
				temporarily. There are subsuquently endpoints to withdraw funds with a
				ledger being checked (whether that be the internal CashApp ledger or the
				blockchain) to ensure only funds that have been deposited can be
				withdrawn.
				<h2 className="text-xl mt-3">Authorization</h2>
				<Separator className="bg-neutral-700 mb-2" />
				<div>
					Authorized users can create an API key{" "}
					<Link href="/dashboard" className="underline underline-offset-1">
						here
					</Link>
					. Most requests may require this API key to interact with the API. You
					must include a bearer token header.
				</div>
			</div>
		</div>
	);
}
