import { getRates } from "@/lib/currency-conversion";
import { checkAuthorization } from "@/lib/utils";

export default async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const auth = await checkAuthorization(req, res);
	if (!auth) {
		return res.status(403).json({ error: "Unauthorized" });
	}

	const rates = getRates();
	res.status(200).json(rates);
}
