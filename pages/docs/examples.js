import React from "react";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/header";
import APIRef from "@/components/apiref";

const CodeBlock = ({ children }) => (
	<pre className="bg-neutral-900 p-4 rounded-md overflow-x-auto">
		<code className="text-sm text-white">{children}</code>
	</pre>
);

const ExampleSection = ({ title, children }) => (
	<div className="mb-8">
		<h3 className="text-lg font-semibold mb-2">{title}</h3>
		{children}
	</div>
);

export default function ExamplesDocs() {
	return (
		<div className="min-h-screen bg-black px-3 py-12 flex justify-center">
			<div className="w-full max-w-2xl text-white">
				<Header />
				<APIRef />
				<h2 className="text-xl mt-3">Examples</h2>
				<Separator className="bg-neutral-700 mb-4" />
				Coming Soon
			</div>
		</div>
	);
}
