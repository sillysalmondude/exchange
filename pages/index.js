import Header from "@/components/header";

export default function Home() {
	return (
		<div className="min-h-screen bg-black px-3 py-12 justify-center flex">
			<div className="w-full max-w-2xl text-white">
				<Header />
				<p className="mt-2">
					This website serves as an exchange API facilitating seamless
					conversions between Litecoin (LTC), Ethereum (ETH), Cashapp, and
					PayPal.
				</p>
			</div>
		</div>
	);
}
