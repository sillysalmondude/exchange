import APIRef from "@/components/apiref";
import Header from "@/components/header";
import RequestResponse from "@/components/res";
import { Separator } from "@/components/ui/separator";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const url = "http://localhost:3000";

const requestCreateIntent = {
	body: {
		identifier: "unique-user-identifier",
	},
	headers: {
		"Content-Type": "application/json",
		Authorization: "Bearer YOUR_AUTH_TOKEN",
	},
};

const responseCreateIntent = {
	body: {
		address: "0x7283282187c350f4cbf58037DBF65f48B0f4BcF9",
		created: "2024-09-06T20:37:44.003Z",
	},
	headers: {
		"content-type": "application/json; charset=utf-8",
	},
};

const requestCheckIntent = {
	body: {
		address: "0x7283282187c350f4cbf58037DBF65f48B0f4BcF9",
	},
	headers: {
		"Content-Type": "application/json",
		Authorization: "Bearer YOUR_AUTH_TOKEN",
	},
};

const responseCheckIntent = {
	body: {
		id: "intent-id",
		identifier: "unique-user-identifier",
		address: "0x7283282187c350f4cbf58037DBF65f48B0f4BcF9",
		amount: "0.01",
		status: "COMPLETED",
	},
	headers: {
		"content-type": "application/json; charset=utf-8",
	},
};

const requestWithdraw = {
	body: {
		identifier: "unique-user-identifier",
		amount: "0.001",
		recipient: "0x8b281e06f84e083ce8d3a4f7000986ffc2215d3b",
		fromCurrency: "ETH",
	},
	headers: {
		Authorization: "Bearer YOUR_AUTH_TOKEN",
		"Content-Type": "application/json",
	},
};

const responseWithdraw = {
	body: {
		transactionHash:
			"0xde49c21d8a17e826e546ddb4f5ef2034c629cb8c2ecbef9b0217cbcdf75c9dac",
		from: "0x7283282187c350f4cbf58037DBF65f48B0f4BcF9",
		to: "0x8b281e06f84e083ce8d3a4f7000986ffc2215d3b",
		amount: "0.001",
		fee: "0.000021",
	},
	headers: {
		"content-type": "application/json; charset=utf-8",
	},
};

export default function CryptoDocs() {
	const [token, setToken] = useState("eth");

	return (
		<div className="min-h-screen bg-black px-3 py-12 justify-center flex">
			<div className="w-full max-w-2xl text-white">
				<Header />
				<APIRef />
				<h2 className="text-xl mt-3">Crypto API</h2>
				<Separator className="bg-neutral-700 mb-4" />
				<Select onValueChange={(val) => setToken(val)}>
					<SelectTrigger>
						<SelectValue placeholder="Select a token" />
					</SelectTrigger>
					<SelectContent className="bg-black text-white">
						<SelectGroup>
							<SelectLabel>Available tokens</SelectLabel>
							<SelectItem value="eth" className="cursor-pointer">
								ETH
							</SelectItem>
							<SelectItem value="ltc" className="cursor-pointer">
								LTC
							</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
				<Separator className="bg-neutral-700 my-4" />

				<Popover>
					<PopoverTrigger className="px-2 bg-neutral-950 border-neutral-700 border mr-1">
						?
					</PopoverTrigger>
					<PopoverContent
						className="bg-black text-white px-2 py-0.5 text-center text-sm border-neutral-700"
						side="top"
					>
						This route creates a deposit address for the selected
						cryptocurrency. Requires authorization.
					</PopoverContent>
				</Popover>
				<a className="w-min bg-green-500 px-1 py-1 mr-1">POST</a>
				<a className="w-full bg-neutral-900 px-1 py-1">
					{url}/api/{token}/create_intent
				</a>
				<RequestResponse
					requestJson={requestCreateIntent}
					responseJson={responseCreateIntent}
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
						This route checks the status of a deposit intent for the selected
						cryptocurrency. Requires authorization.
					</PopoverContent>
				</Popover>
				<a className="w-min bg-green-500 px-1 py-1 mr-1">POST</a>
				<a className="w-full bg-neutral-900 px-1 py-1">
					{url}/api/{token}/check_intent
				</a>
				<RequestResponse
					requestJson={requestCheckIntent}
					responseJson={responseCheckIntent}
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
						This route initiates a withdrawal for the selected cryptocurrency.
						The fromCurrency can be ETH, LTC, PayPal, or CashApp. Requires
						authorization.
					</PopoverContent>
				</Popover>
				<a className="w-min bg-green-500 px-1 py-1 mr-1">POST</a>
				<a className="w-full bg-neutral-900 px-1 py-1">
					{url}/api/{token}/withdraw
				</a>
				<RequestResponse
					requestJson={requestWithdraw}
					responseJson={responseWithdraw}
				/>
			</div>
		</div>
	);
}
