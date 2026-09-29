import type { ReactNode } from "react";
import {
  Bell,
  Building2,
  ChartNoAxesCombined,
  LayoutDashboard,
  Route,
  Settings,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SideNavigation, TopNavigation, type NavigationItem } from "@/components/ui/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const primaryItems: NavigationItem[] = [
  { href: "/design-system", icon: LayoutDashboard, isActive: true, label: "Overview" },
  { href: "/dashboard", icon: Route, label: "Shipments" },
  { href: "/admin", icon: Building2, label: "Admin" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

const sectionItems = [
  { href: "/design-system", isActive: true, label: "Components" },
  { href: "/dashboard", label: "Operations" },
  { href: "/customer", label: "Customer" },
  { href: "/admin", label: "Admin" },
] satisfies Array<{ href: NavigationItem["href"]; isActive?: boolean; label: string }>;

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground min-h-svh">
      <aside className="border-border bg-card/90 shadow-soft fixed inset-y-0 left-0 hidden w-72 border-r p-4 backdrop-blur lg:block">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="bg-primary text-primary-foreground grid size-10 place-items-center rounded-md text-sm font-semibold">
            AG
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Apex Global</p>
            <p className="text-muted-foreground text-xs">Logistics OS</p>
          </div>
        </div>
        <div className="mt-5">
          <SideNavigation items={primaryItems} />
        </div>
        <div className="border-border bg-surface absolute right-4 bottom-4 left-4 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Network health</p>
              <p className="text-muted-foreground mt-1 text-xs">98.8% on-time flow</p>
            </div>
            <Badge variant="success">Live</Badge>
          </div>
        </div>
      </aside>
      <div className="lg:pl-72">
        <TopNavigation
          actions={
            <>
              <ThemeToggle />
              <button className="border-border bg-background text-muted-foreground hover:text-foreground grid size-10 place-items-center rounded-md border transition-colors">
                <Bell aria-hidden="true" className="size-4" />
                <span className="sr-only">Notifications</span>
              </button>
              <div className="border-border bg-background hidden items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold sm:flex">
                <Truck aria-hidden="true" className="text-accent size-4" />
                Lagos hub
              </div>
              <ChartNoAxesCombined
                aria-hidden="true"
                className="text-muted-foreground hidden size-5 sm:block"
              />
            </>
          }
          items={sectionItems}
        />
        {children}
      </div>
    </div>
  );
}
