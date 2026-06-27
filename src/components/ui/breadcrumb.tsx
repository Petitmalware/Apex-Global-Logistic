import Link from "next/link";
import type { Route } from "next";
import { ChevronRight, Home } from "lucide-react";

import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  href?: Route | string;
  label: string;
};

export function Breadcrumbs({ className, items }: { className?: string; items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-2 text-sm", className)}>
      <Link
        className="text-muted-foreground hover:text-foreground inline-flex items-center transition-colors"
        href="/"
      >
        <Home aria-hidden="true" className="size-4" />
        <span className="sr-only">Home</span>
      </Link>
      {items.map((item, index) => (
        <div className="flex min-w-0 items-center gap-2" key={`${item.label}-${index}`}>
          <ChevronRight aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
          {item.href ? (
            <Link
              className="text-muted-foreground hover:text-foreground truncate transition-colors"
              href={item.href as Route}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground truncate font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
