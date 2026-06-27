import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type NavigationItem = {
  badge?: string;
  href: Route | string;
  icon: LucideIcon;
  isActive?: boolean;
  label: string;
};

export function SideNavigation({
  className,
  items,
}: {
  className?: string;
  items: NavigationItem[];
}) {
  return (
    <nav className={cn("space-y-1", className)} aria-label="Primary navigation">
      {items.map((item) => (
        <Link
          className={cn(
            "group text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
            item.isActive &&
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm",
          )}
          href={item.href as Route}
          key={item.href}
        >
          <item.icon aria-hidden="true" className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge ? (
            <Badge variant={item.isActive ? "outline" : "neutral"}>{item.badge}</Badge>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

export function TopNavigation({
  actions,
  className,
  items,
}: {
  actions?: ReactNode;
  className?: string;
  items: Array<Pick<NavigationItem, "href" | "isActive" | "label">>;
}) {
  return (
    <div
      className={cn(
        "border-border bg-background/95 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b px-4 backdrop-blur",
        className,
      )}
    >
      <nav
        aria-label="Section navigation"
        className="-mx-1 flex min-w-0 flex-nowrap items-center gap-1 overflow-x-auto px-1"
      >
        {items.map((item) => (
          <Link
            className={cn(
              "text-muted-foreground hover:bg-secondary hover:text-foreground rounded-md px-3 py-2 text-sm font-semibold transition-colors",
              item.isActive && "bg-secondary text-foreground",
            )}
            href={item.href as Route}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
