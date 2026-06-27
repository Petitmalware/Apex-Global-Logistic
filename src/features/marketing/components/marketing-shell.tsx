import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ArrowRight, Mail, MapPin, Menu, Phone, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { companyNavItems, marketingNavItems } from "@/features/marketing/data/marketing";

type MarketingShellProps = {
  children: ReactNode;
};

function Brand() {
  return (
    <Link className="flex items-center gap-3" href="/">
      <div className="bg-primary text-primary-foreground grid size-10 place-items-center rounded-md text-sm font-semibold">
        AG
      </div>
      <div className="min-w-0">
        <p className="text-foreground text-sm leading-none font-semibold">Apex Global Logistics</p>
        <p className="text-muted-foreground mt-1 text-xs">Global delivery network</p>
      </div>
    </Link>
  );
}

export function MarketingHeader() {
  return (
    <header className="border-border bg-background/88 sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Brand />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {[...marketingNavItems, ...companyNavItems].map((item) => (
            <Link
              className="text-muted-foreground hover:bg-secondary hover:text-foreground rounded-md px-3 py-2 text-sm font-semibold transition-colors"
              href={item.href as Route}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          <Button asChild variant="outline">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="accent">
            <Link href="/register">
              Register
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <details className="group relative sm:hidden">
          <summary className="border-border bg-background text-muted-foreground grid size-10 cursor-pointer list-none place-items-center rounded-md border">
            <Menu aria-hidden="true" className="size-5" />
            <span className="sr-only">Open menu</span>
          </summary>
          <div className="border-border bg-popover text-popover-foreground shadow-panel absolute top-12 right-0 w-72 rounded-lg border p-3">
            <nav className="grid gap-1">
              {[...marketingNavItems, ...companyNavItems].map((item) => (
                <Link
                  className="text-muted-foreground hover:bg-secondary hover:text-foreground rounded-md px-3 py-2 text-sm font-semibold"
                  href={item.href as Route}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-border mt-3 grid gap-2 border-t pt-3">
              <Button asChild variant="outline">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild variant="accent">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-border bg-card border-t">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Brand />
          <p className="text-muted-foreground mt-5 max-w-sm text-sm leading-6">
            Premium parcel, pet, and freight logistics for teams that need clarity from quote to
            delivery.
          </p>
          <div className="text-muted-foreground mt-5 grid gap-2 text-sm">
            <span className="inline-flex items-center gap-2">
              <MapPin aria-hidden="true" className="text-accent size-4" />
              Lagos, London, Dubai, Singapore
            </span>
            <span className="inline-flex items-center gap-2">
              <Phone aria-hidden="true" className="text-accent size-4" />
              +1 (555) 014-8848
            </span>
            <span className="inline-flex items-center gap-2">
              <Mail aria-hidden="true" className="text-accent size-4" />
              hello@apexgloballogistics.com
            </span>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Services</h2>
          <nav className="text-muted-foreground mt-4 grid gap-2 text-sm">
            {marketingNavItems.map((item) => (
              <Link className="hover:text-foreground" href={item.href as Route} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Company</h2>
          <nav className="text-muted-foreground mt-4 grid gap-2 text-sm">
            {companyNavItems.map((item) => (
              <Link className="hover:text-foreground" href={item.href as Route} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Platform</h2>
          <div className="border-border bg-background mt-4 rounded-lg border p-4">
            <Truck aria-hidden="true" className="text-accent size-5" />
            <p className="mt-3 text-sm font-semibold">Apex Control Tower</p>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Built for secure operations, tracking, pricing, and support workflows.
            </p>
          </div>
        </div>
      </div>
      <div className="border-border text-muted-foreground border-t px-4 py-5 text-center text-xs">
        © 2026 Apex Global Logistics. All rights reserved.
      </div>
    </footer>
  );
}

export function MarketingShell({ children }: MarketingShellProps) {
  return (
    <div className="bg-background text-foreground min-h-svh">
      <MarketingHeader />
      <main id="main-content">{children}</main>
      <MarketingFooter />
    </div>
  );
}
