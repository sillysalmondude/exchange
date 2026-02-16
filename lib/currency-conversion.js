const rates = {
	ETH_TO_LTC: parseFloat(process.env.ETH_TO_LTC_RATE),
	LTC_TO_ETH: parseFloat(process.env.LTC_TO_ETH_RATE),
	ETH_TO_PAYPAL: parseFloat(process.env.ETH_TO_PAYPAL_RATE),
	LTC_TO_PAYPAL: parseFloat(process.env.LTC_TO_PAYPAL_RATE),
	PAYPAL_TO_ETH: parseFloat(process.env.PAYPAL_TO_ETH_RATE),
	PAYPAL_TO_LTC: parseFloat(process.env.PAYPAL_TO_LTC_RATE),
};

export function convertCurrency(amount, fromCurrency, toCurrency) {
	if (fromCurrency === toCurrency) {
		return amount;
	}

	const key = `${fromCurrency}_TO_${toCurrency}`;
	if (rates[key]) {
		return amount * rates[key];
	}

	const toEth =
		fromCurrency === "ETH" ? amount : amount * rates[`${fromCurrency}_TO_ETH`];
	return toEth * rates[`ETH_TO_${toCurrency}`];
}

export function getRates() {
	return rates;
}
