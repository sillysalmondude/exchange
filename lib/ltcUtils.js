import axios from "axios";
import litecore from "litecore-lib";

const LITECOIN_API_BASE =
	process.env.LITECOIN_API_BASE || "https://litecoinspace.org/api";

export async function getAddressBalance(address) {
	try {
		const response = await axios.get(`${LITECOIN_API_BASE}/address/${address}`);
		const data = response.data;
		const funded = data.chain_stats.funded_txo_sum;
		const spent = data.chain_stats.spent_txo_sum;
		return (funded - spent) / 1e8;
	} catch (error) {
		console.error("Error fetching LTC balance:", error);
		throw error;
	}
}

export function createLitecoinAddress() {
	const privateKey = new litecore.PrivateKey();
	const address = privateKey.toAddress();
	return {
		address: address.toString(),
		privateKey: privateKey.toString(),
	};
}

export async function getUTXOs(address) {
	try {
		const response = await axios.get(
			`${LITECOIN_API_BASE}/address/${address}/utxo`,
		);
		return response.data.map((utxo) => ({
			txid: utxo.txid,
			vout: utxo.vout,
			amount: utxo.value / 1e8,
			satoshis: utxo.value,
			scriptPubKey: litecore.Script.buildPublicKeyHashOut(address).toHex(),
		}));
	} catch (error) {
		console.error("Error fetching UTXOs:", error);
		throw error;
	}
}

export async function sendLitecoin(fromPrivateKey, toAddress, amount) {
	const privateKey = new litecore.PrivateKey(fromPrivateKey);
	const fromAddress = privateKey.toAddress().toString();

	const utxos = await getUTXOs(fromAddress);
	const fee = 0.001;
	const totalAmount = amount + fee;

	const transaction = new litecore.Transaction()
		.from(utxos)
		.to(toAddress, Math.floor(amount * 1e8))
		.fee(Math.floor(fee * 1e8))
		.change(fromAddress)
		.sign(privateKey);

	return broadcastTransaction(transaction.serialize());
}

async function broadcastTransaction(serializedTx) {
	try {
		const response = await axios.post(`${LITECOIN_API_BASE}/tx`, serializedTx, {
			headers: { "Content-Type": "text/plain" },
		});
		return { txid: response.data };
	} catch (error) {
		console.error("Error broadcasting transaction:", error);
		throw error;
	}
}
