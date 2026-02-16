import Link from "next/link";
import { Separator } from "./ui/separator";

export default function APIRef() {
  return (
    <>
      <div className="w-full flex items-baseline justify-between">
        <h2 className="text-xl mt-3">API Reference </h2>
        <div className="flex gap-2">
        	<Link href="/docs/examples"> Examples </Link>
          <Link href="/docs/user"> User </Link>
          <Link href="/docs/crypto"> Crypto </Link>
          <Link href="/docs/paypal"> PayPal </Link>
          <Link href="/docs/cashapp"> CashApp </Link>
        </div>
      </div>
      <Separator className="bg-neutral-700" />
    </>
  );
}
