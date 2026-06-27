import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main id="main-content" className="bg-background grid min-h-svh place-items-center px-6 py-12">
      <section className="w-full max-w-md">
        <p className="text-muted-foreground text-sm font-semibold">Apex Global Logistics</p>
        <h1 className="text-foreground mt-2 text-3xl font-semibold tracking-normal">
          Access denied
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          Your account does not have permission to open this area.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </section>
    </main>
  );
}
