import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ChevronDown, Menu, Search, Settings, ShieldCheck, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { SideNavigation, TopNavigation } from "@/components/ui/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { WorkspaceHistoryControls } from "@/components/layout/workspace-history-controls";
import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { SessionKeepAlive } from "@/features/auth/components/session-keep-alive";
import { ChatWidget } from "@/features/chat/components/chat-widget";
import {
  getDashboardNavItems,
  getDashboardQuickNav,
  roleHomeByRole,
} from "@/features/dashboard/data/dashboard";
import { NotificationCenter } from "@/features/notifications/components/notification-center";
import type { NotificationCenterSnapshot } from "@/features/notifications/types";
import { AUTH_ROLE_LABELS, AUTH_ROLES } from "@/lib/auth/constants";
import { cn } from "@/lib/utils";

type ProtectedShellProps = {
  activeHref?: Route | string;
  breadcrumbs?: BreadcrumbItem[];
  children: ReactNode;
  description?: string;
  title: string;
  user: AuthSessionUser;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getPrimaryRole(user: AuthSessionUser) {
  const [firstRole] = user.roles;

  return firstRole ? AUTH_ROLE_LABELS[firstRole] : "Workspace";
}

function getHomeHref(user: AuthSessionUser) {
  const [firstRole] = user.roles;

  return firstRole ? roleHomeByRole[firstRole] : "/dashboard";
}

function WorkspaceBrand() {
  return (
    <Link className="flex items-center gap-3" href="/dashboard">
      <div className="bg-primary text-primary-foreground grid size-10 place-items-center rounded-md text-sm font-semibold">
        AG
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm leading-none font-semibold">Apex Global</p>
        <p className="text-muted-foreground mt-1 text-xs">Logistics OS</p>
      </div>
    </Link>
  );
}

function getEmptyNotificationSnapshot(): NotificationCenterSnapshot {
  return {
    history: [],
    notifications: [],
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

function DashboardSearch() {
  return (
    <form className="relative hidden w-full max-w-md md:block" role="search">
      <label className="sr-only" htmlFor="dashboard-search">
        Search dashboard
      </label>
      <Search
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
      />
      <Input
        className="bg-background/80 pl-9"
        id="dashboard-search"
        placeholder="Search shipments, tickets, invoices..."
        type="search"
      />
    </form>
  );
}

function ProfileMenu({ user }: { user: AuthSessionUser }) {
  return (
    <details className="group relative">
      <summary className="border-border bg-background hover:bg-secondary flex cursor-pointer list-none items-center gap-2 rounded-md border px-2 py-1.5 transition-colors">
        <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-md text-xs font-semibold">
          {getInitials(user.name)}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-32 truncate text-sm font-semibold">{user.name}</span>
          <span className="text-muted-foreground block text-xs">{getPrimaryRole(user)}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="text-muted-foreground size-4 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-border bg-popover text-popover-foreground shadow-panel absolute top-12 right-0 z-50 w-72 rounded-lg border p-3">
        <div className="border-border border-b pb-3">
          <p className="font-semibold">{user.name}</p>
          <p className="text-muted-foreground mt-1 truncate text-sm">{user.email}</p>
        </div>
        <div className="mt-3 grid gap-2">
          <Link
            className="hover:bg-secondary flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
            href={getHomeHref(user) as Route}
          >
            <UserRound aria-hidden="true" className="text-muted-foreground size-4" />
            My workspace
          </Link>
          <Link
            className="hover:bg-secondary flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
            href={"/settings" as Route}
          >
            <Settings aria-hidden="true" className="text-muted-foreground size-4" />
            Settings
          </Link>
          <div className="border-border mt-2 border-t pt-3">
            <LogoutButton />
          </div>
        </div>
      </div>
    </details>
  );
}

function MobileNavigation({
  activeHref,
  user,
}: {
  activeHref: Route | string;
  user: AuthSessionUser;
}) {
  const navItems = getDashboardNavItems(user);

  return (
    <details className="group relative lg:hidden">
      <summary className="border-border bg-background text-muted-foreground grid size-10 cursor-pointer list-none place-items-center rounded-md border">
        <Menu aria-hidden="true" className="size-5" />
        <span className="sr-only">Open dashboard navigation</span>
      </summary>
      <div className="border-border bg-popover shadow-panel absolute top-12 left-0 z-50 w-80 rounded-lg border p-3">
        <SideNavigation
          items={navItems.map((item) => ({
            ...item,
            isActive: item.href === activeHref,
          }))}
        />
      </div>
    </details>
  );
}

export async function ProtectedShell({
  activeHref = "/dashboard",
  breadcrumbs,
  children,
  description,
  title,
  user,
}: ProtectedShellProps) {
  const sidebarItems = getDashboardNavItems(user).map((item) => ({
    ...item,
    isActive: item.href === activeHref,
  }));
  const quickNavItems = getDashboardQuickNav(user).map((item) => ({
    ...item,
    isActive: item.href === activeHref,
  }));
  const notificationSnapshot = getEmptyNotificationSnapshot();
  const homeHref = getHomeHref(user);

  return (
    <div className="bg-background text-foreground min-h-svh">
      <SessionKeepAlive />
      {user.roles.includes(AUTH_ROLES.CUSTOMER) ? <ChatWidget surface="workspace" /> : null}
      <aside className="border-border bg-card/95 shadow-soft fixed inset-y-0 left-0 hidden w-72 border-r p-4 backdrop-blur lg:block">
        <WorkspaceBrand />
        <div className="mt-6">
          <SideNavigation items={sidebarItems} />
        </div>
        <div className="border-border bg-surface absolute right-4 bottom-4 left-4 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <div className="bg-success/10 text-success grid size-10 place-items-center rounded-md">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Workspace health</p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                Secure session, live notifications, and role-based access are active.
              </p>
            </div>
          </div>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="border-border bg-background/92 sticky top-0 z-40 border-b backdrop-blur-xl">
          <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <MobileNavigation activeHref={activeHref} user={user} />
              <div className="hidden sm:block lg:hidden">
                <WorkspaceBrand />
              </div>
              <div className="min-w-0 sm:hidden">
                <p className="truncate text-sm font-semibold">Apex Global</p>
                <p className="text-muted-foreground text-xs">Logistics OS</p>
              </div>
            </div>
            <DashboardSearch />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationCenter initialSnapshot={notificationSnapshot} />
              <ProfileMenu user={user} />
            </div>
          </div>
          <TopNavigation className="min-h-14 border-b-0 px-4 sm:px-6" items={quickNavItems} />
        </header>
        <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Breadcrumbs
                items={
                  breadcrumbs ?? [{ href: "/dashboard", label: "Dashboard" }, { label: title }]
                }
              />
              <h1 className="mt-4 text-3xl font-semibold tracking-normal">{title}</h1>
              {description ? (
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                  {description}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
              <WorkspaceHistoryControls homeHref={homeHref} />
              {user.roles.map((role) => (
                <Badge key={role} variant="outline">
                  {AUTH_ROLE_LABELS[role]}
                </Badge>
              ))}
            </div>
          </div>
          <div className={cn("animate-fade-up")}>{children}</div>
        </main>
      </div>
    </div>
  );
}
