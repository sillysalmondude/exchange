import APIRef from "@/components/apiref";
import Header from "@/components/header";
import RequestResponse from "@/components/res";
import { Separator } from "@/components/ui/separator";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

const url = "http://localhost:3000";

const requestCreateUser = {
	body: {},
	headers: {
		"Content-Type": "application/json",
		Authorization: "Bearer YOUR_AUTH_TOKEN",
	},
};

const responseCreateUser = {
	body: {
		identifier: "unique-user-identifier",
	},
	headers: {
		"content-type": "application/json",
	},
};

const requestCheckBalance = {
	headers: {
		Authorization: "Bearer YOUR_AUTH_TOKEN",
	},
};

const responseCheckBalance = {
	body: {
		identifier: "unique-user-identifier",
		balances: {
			ETH: 0.5,
			LTC: 1.2,
			PayPal: 100,
			CashApp: 50,
		},
		totalBalance: 151.7,
	},
	headers: {
		"content-type": "application/json",
	},
};

export default function UserDocs() {
	return (
		<div className="min-h-screen bg-black px-3 py-12 justify-center flex">
			<div className="w-full max-w-2xl text-white">
				<Header />
				<APIRef />
				<h2 className="text-xl mt-3">User API</h2>
				<Separator className="bg-neutral-700 mb-4" />

				<Popover>
					<PopoverTrigger className="px-2 bg-neutral-950 border-neutral-700 border mr-1">
						?
					</PopoverTrigger>
					<PopoverContent
						className="bg-black text-white px-2 py-0.5 text-center text-sm border-neutral-700"
						side="top"
					>
						This route creates a unique user identifier. Treat this like a
						password as it's used to authenticate transactions. Requires
						authorization.
					</PopoverContent>
				</Popover>
				<a className="w-min bg-green-500 px-1 py-1 mr-1">POST</a>
				<a className="w-full bg-neutral-900 px-1 py-1">
					{url}/api/user/create_user
				</a>
				<RequestResponse
					requestJson={requestCreateUser}
					responseJson={responseCreateUser}
				/>

				<Separator className="bg-neutral-700 my-4" />

				<Popover>
					<PopoverTrigger className="px-2 bg-neutral-950 border-neutral-700 border mr-1">
						?
					</PopoverTrigger>
					<PopoverContent
						className="bg-black text-white px-2 py-0.5 text-center text-sm border-neutral-700"
						side="top"
					>
						This route checks the balance for a given user identifier. Requires
						authorization.
					</PopoverContent>
				</Popover>
				<a className="w-min bg-blue-500 px-1 py-1 mr-1">GET</a>
				<a className="w-full bg-neutral-900 px-1 py-1">
					{url}/api/user/check_balance?identifier=unique-user-identifier
				</a>
				<RequestResponse
					requestJson={requestCheckBalance}
					responseJson={responseCheckBalance}
				/>
			</div>
		</div>
	);
}
