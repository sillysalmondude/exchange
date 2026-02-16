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
		id: "paypal-intent-id",
		paypalOrderId: "PAYPAL-ORDER-ID",
		approvalLink:
			"https://www.sandbox.paypal.com/checkoutnow?token=APPROVAL-TOKEN",
		captureUrl: "http://localhost:3000/api/paypal/capture",
	},
	headers: {
		"content-type": "application/json",
	},
};

const requestCheckIntent = {
	body: {
		id: "paypal-intent-id",
	},
	headers: {
		"Content-Type": "application/json",
		Authorization: "Bearer YOUR_AUTH_TOKEN",
	},
};

const responseCheckIntent = {
	body: {
		id: "paypal-intent-id",
		identifier: "unique-user-identifier",
		amount: 50.0,
		status: "APPROVED",
		message:
			"Payment approved but not yet completed. Please complete the capture process.",
		nextStep: "capture",
		captureUrl: "http://localhost:3000/api/paypal/capture",
		paypalOrderId: "PAYPAL-ORDER-ID",
	},
	headers: {
		"content-type": "application/json",
	},
};

const requestCapture = {
	body: {
		orderId: "PAYPAL-ORDER-ID",
	},
	headers: {
		"Content-Type": "application/json",
		Authorization: "Bearer YOUR_AUTH_TOKEN",
	},
};

const responseCapture = {
	body: {
		status: "COMPLETED",
		message:
			"Payment captured successfully. Funds have been added to your account.",
	},
	headers: {
		"content-type": "application/json",
	},
};

const requestWithdraw = {
	body: {
		identifier: "unique-user-identifier",
		amount: 25.0,
		email: "user@example.com",
		fromCurrency: "PayPal",
	},
	headers: {
		"Content-Type": "application/json",
		Authorization: "Bearer YOUR_AUTH_TOKEN",
	},
};

const responseWithdraw = {
	body: {
		id: "paypal-withdrawal-id",
		amount: 25.0,
		email: "user@example.com",
		status: "PENDING",
		paypalPayoutId: "PAYOUT-BATCH-ID",
	},
	headers: {
		"content-type": "application/json",
	},
};

export default function PayPalDocs() {
	return (
		<div className="min-h-screen bg-black px-3 py-12 justify-center flex">
			<div className="w-full max-w-2xl text-white">
				<Header />
				<APIRef />
				<h2 className="text-xl mt-3">PayPal API</h2>
				<Separator className="bg-neutral-700 mb-4" />

				<Popover>
					<PopoverTrigger className="px-2 bg-neutral-950 border-neutral-700 border mr-1">
						?
					</PopoverTrigger>
					<PopoverContent
						className="bg-black text-white px-2 py-0.5 text-center text-sm border-neutral-700"
						side="top"
					>
						This route creates a PayPal payment intent and returns a payment
						link and capture URL. Requires authorization.
					</PopoverContent>
				</Popover>
				<a className="w-min bg-green-500 px-1 py-1 mr-1">POST</a>
				<a className="w-full bg-neutral-900 px-1 py-1">
					{url}/api/paypal/create_intent
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
						This route checks the status of a PayPal payment intent. If
						approved, it returns a capture URL. Requires authorization.
					</PopoverContent>
				</Popover>
				<a className="w-min bg-green-500 px-1 py-1 mr-1">POST</a>
				<a className="w-full bg-neutral-900 px-1 py-1">
					{url}/api/paypal/check_intent
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
						This route captures an approved PayPal payment. Call this after
						receiving an "APPROVED" status. Requires authorization.
					</PopoverContent>
				</Popover>
				<a className="w-min bg-green-500 px-1 py-1 mr-1">POST</a>
				<a className="w-full bg-neutral-900 px-1 py-1">
					{url}/api/paypal/capture
				</a>
				<RequestResponse
					requestJson={requestCapture}
					responseJson={responseCapture}
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
						This route initiates a PayPal withdrawal to the specified email
						address. The fromCurrency can be ETH, LTC, PayPal, or CashApp.
						Requires authorization.
					</PopoverContent>
				</Popover>
				<a className="w-min bg-green-500 px-1 py-1 mr-1">POST</a>
				<a className="w-full bg-neutral-900 px-1 py-1">
					{url}/api/paypal/withdraw
				</a>
				<RequestResponse
					requestJson={requestWithdraw}
					responseJson={responseWithdraw}
				/>
			</div>
		</div>
	);
}
