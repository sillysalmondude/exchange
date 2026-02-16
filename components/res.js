import React, { useState } from "react";

const prettyPrintJson = (json) => {
	return JSON.stringify(json, null, 2);
};

const RequestResponse = ({ requestJson, responseJson }) => {
	const [activeTab, setActiveTab] = useState("");

	const handleTabClick = (tab) => {
		setActiveTab((prevTab) => (prevTab === tab ? "" : tab));
	};

	return (
		<div>
			<div className="flex mt-2 gap-2">
				<button
					className={`${
						activeTab === "request"
							? "text-blue-500 border-b-2 border-blue-600"
							: "text-neutral-500"
					}`}
					onClick={() => handleTabClick("request")}
				>
					Request
				</button>
				<button
					className={`px-1 ${
						activeTab === "response"
							? "text-blue-500 border-b-2 border-blue-500"
							: "text-neutral-500"
					}`}
					onClick={() => handleTabClick("response")}
				>
					Response
				</button>
			</div>

			{activeTab === "request" && (
				<div>
					<h2 className="font-bold mt-4 mb-2">Request Headers</h2>
					<pre className="p-2 bg-neutral-900 text-sm text-white overflow-auto">
						{prettyPrintJson(requestJson.headers)}
					</pre>
					<h2 className="font-bold mt-4 mb-2">Request Body</h2>
					<pre className="p-2 bg-neutral-900 text-sm text-white overflow-auto">
						{prettyPrintJson(requestJson.body)}
					</pre>
				</div>
			)}

			{activeTab === "response" && (
				<div>
					<h2 className="font-bold mt-4 mb-2">Response Headers</h2>
					<pre className="p-2 bg-neutral-900 text-sm text-white overflow-auto">
						{prettyPrintJson(responseJson.headers)}
					</pre>
					<h2 className="font-bold mt-4 mb-2">Response Body</h2>
					<pre className="p-2 bg-neutral-900 text-sm text-white overflow-auto">
						{prettyPrintJson(responseJson.body)}
					</pre>
				</div>
			)}
		</div>
	);
};

export default RequestResponse;
