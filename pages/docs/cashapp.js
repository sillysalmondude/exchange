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

const requestCreateIntent = {
	body: {
		identifier: "unique-user-identifier",
		amount: 50.0,
	},
	headers: {
		"Content-Type": "application/json",
		Authorization: "Bearer YOUR_AUTH_TOKEN",
	},
};

const responseCreateIntent = {
	body: {
		id: "cashapp-intent-id",
		ref: "1234567",
		amount: 50.0,
	},
	headers: {
		"content-type": "application/json; charset=utf-8",
	},
};

const requestCheckIntent = {
	body: {
		id: "cashapp-intent-id",
		receipt: "https://cash.app/payments/xxxxxxxxxxx/receipt",
	},
	headers: {
		"Content-Type": "application/json",
		Authorization: "Bearer YOUR_AUTH_TOKEN",
	},
};

const responseCheckIntent = {
	body: {
		id: "cashapp-intent-id",
		identifier: "unique-user-identifier",
		refSent: "1234567",
		refReceived: "1234567",
		amount: 50.0,
		status: "COMPLETED",
		message: "Payment received and processed successfully.",
	},
	headers: {
		"content-type": "application/json; charset=utf-8",
	},
};

export default function CashAppDocs() {
	return (
		<div className="min-h-screen bg-black px-3 py-12 justify-center flex">
			<div className="w-full max-w-2xl text-white">
				<Header />
				<APIRef />
				<h2 className="text-xl mt-3">CashApp API</h2>
				<Separator className="bg-neutral-700 mb-4" />

				<Popover>
					<PopoverTrigger className="px-2 bg-neutral-950 border-neutral-700 border mr-1">
						?
					</PopoverTrigger>
					<PopoverContent
						className="bg-black text-white px-2 py-0.5 text-center text-sm border-neutral-700"
						side="top"
					>
						This route creates a CashApp deposit intent and returns an ID and
						reference for the transaction. Requires authorization.
					</PopoverContent>
				</Popover>
				<a className="w-min bg-green-500 px-1 py-1 mr-1">POST</a>
				<a className="w-full bg-neutral-900 px-1 py-1">
					{url}/api/cashapp/create_intent
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
						This route checks the status of a CashApp deposit intent using the
						receipt URL. Requires authorization.
					</PopoverContent>
				</Popover>
				<a className="w-min bg-green-500 px-1 py-1 mr-1">POST</a>
				<a className="w-full bg-neutral-900 px-1 py-1">
					{url}/api/cashapp/check_intent
				</a>
				<RequestResponse
					requestJson={requestCheckIntent}
					responseJson={responseCheckIntent}
				/>
			</div>
		</div>
	);
}
