import type { NextApiResponse } from "next";
import { LRUCache } from "lru-cache";

type Options = {
	uniqueTokenPerInterval?: number;
	interval?: number;
};

export default function rateLimit(options?: Options) {
	const tokenCache = new LRUCache({
		max: options?.uniqueTokenPerInterval || 500,
		ttl: options?.interval || 60000,
	});

	return {
		check: (res: NextApiResponse, limit: number, token: string) =>
			new Promise<void>((resolve, reject) => {
				const tokenCount = (tokenCache.get(token) as number[]) || [0];
				if (tokenCount[0] === 0) {
					tokenCache.set(token, tokenCount);
				}
				tokenCount[0] += 1;

				const currentUsage = tokenCount[0];
				const isRateLimited = currentUsage >= limit;
				res.setHeader("X-RateLimit-Limit", limit);
				res.setHeader(
					"X-RateLimit-Remaining",
					isRateLimited ? 0 : limit - currentUsage,
				);

				if (isRateLimited) {
					const retryAfter = Math.ceil(
						(tokenCache.ttl - (Date.now() % tokenCache.ttl)) / 1000,
					);
					res.setHeader("Retry-After", retryAfter);
					res.status(429).json({
						message: "You are rate limited",
						retryAfter: `${retryAfter} seconds`,
					});
					return reject();
				}

				resolve();
			}),
	};
}
