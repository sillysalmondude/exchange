/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	api: {
		bodyParser: true,
	},
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: "/api/:path*",
			},
		];
	},
};

export default nextConfig;
