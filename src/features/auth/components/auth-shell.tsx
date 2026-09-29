import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { ThemeToggle } from "@/components/ui/theme-toggle";

type AuthShellProps = {
  children: ReactNode;
  subtitle?: string;
  title: string;
};

export function AuthShell({ children, subtitle, title }: AuthShellProps) {
  return (
    <main id="main-content" className="bg-background grid min-h-svh lg:grid-cols-[0.94fr_1.06fr]">
      <section className="flex min-h-svh items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link
            className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors"
            href="/"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to website
          </Link>
          <div className="mb-8 flex items-start justify-between gap-4">
            <Link className="flex items-center gap-3" href="/">
              <div className="bg-primary text-primary-foreground grid size-12 place-items-center rounded-md text-sm font-semibold">
                AG
              </div>
              <div>
                <p className="text-foreground text-sm font-semibold">Apex Global Logistics</p>
                <p className="text-muted-foreground mt-1 text-xs">Secure customer access</p>
              </div>
            </Link>
            <ThemeToggle />
          </div>
          <h1 className="text-foreground text-3xl font-semibold tracking-normal">{title}</h1>
          {subtitle ? (
            <p className="text-muted-foreground mt-2 text-sm leading-6">{subtitle}</p>
          ) : null}
          <div className="mt-8">{children}</div>
        </div>
      </section>
      <section className="relative hidden min-h-svh overflow-hidden lg:block">
        <Image
          alt="Apex Global Logistics warehouse, delivery vehicle, cargo aircraft, and global route overlays"
          className="absolute inset-0 size-full object-cover"
          fill
          sizes="50vw"
          src="/images/global-logistics-hero.png"
        />
        <div className="from-background via-background/15 absolute inset-0 bg-linear-to-r to-transparent" />
        <div className="shadow-panel absolute right-8 bottom-8 left-8 rounded-lg border border-white/15 bg-black/35 p-5 text-white backdrop-blur">
          <p className="text-sm font-semibold tracking-[0.14em] text-white/65 uppercase">
            Apex Network
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">
            Parcel, pet, and freight logistics in one secure platform.
          </p>
        </div>
      </section>
    </main>
  );
}
