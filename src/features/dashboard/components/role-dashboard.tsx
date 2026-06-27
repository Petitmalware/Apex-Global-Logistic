import { ArrowRight, CheckCircle2, CircleAlert, CircleDot, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, MetricChartCard } from "@/components/ui/chart";
import { Notification } from "@/components/ui/notification";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type {
  DashboardConfig,
  DashboardMetric,
  DashboardTask,
} from "@/features/dashboard/data/dashboard";
import { cn } from "@/lib/utils";

const metricToneClass = {
  accent: "bg-accent/15 text-accent-foreground",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
} satisfies Record<DashboardMetric["tone"], string>;

const taskBadgeVariant = {
  Attention: "warning",
  Blocked: "danger",
  Live: "info",
  Ready: "success",
  Review: "neutral",
} as const;

const taskIcons = {
  Attention: CircleAlert,
  Blocked: CircleAlert,
  Live: CircleDot,
  Ready: CheckCircle2,
  Review: Clock3,
} satisfies Record<DashboardTask["status"], typeof CircleDot>;

function RoleHero({ config, user }: { config: DashboardConfig; user: AuthSessionUser }) {
  return (
    <section className="bg-primary text-primary-foreground shadow-panel overflow-hidden rounded-lg">
      <div className="relative grid gap-8 p-6 md:grid-cols-[1fr_280px] md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_18%,var(--accent)_0,transparent_26%)] opacity-20" />
        <div className="relative">
          <Badge className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
            {config.badge}
          </Badge>
          <h2 className="mt-5 max-w-3xl text-3xl leading-tight font-semibold tracking-normal md:text-4xl">
            {config.title}
          </h2>
          <p className="text-primary-foreground/72 mt-4 max-w-2xl text-sm leading-6 md:text-base">
            {config.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="accent">
              {config.primaryAction}
              <ArrowRight aria-hidden="true" />
            </Button>
            <Button
              className="border-primary-foreground/25 bg-primary-foreground/8"
              variant="outline"
            >
              {config.secondaryAction}
            </Button>
          </div>
        </div>
        <div className="border-primary-foreground/15 bg-primary-foreground/8 relative rounded-lg border p-5">
          <p className="text-primary-foreground/65 text-sm font-medium">Signed in as</p>
          <p className="mt-2 text-xl font-semibold">{user.name}</p>
          <p className="text-primary-foreground/65 mt-1 text-sm">{user.email}</p>
          <div className="mt-5 grid gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary-foreground/65">Role view</span>
              <span className="font-semibold">{config.roleLabel}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary-foreground/65">Permissions</span>
              <span className="font-semibold">{user.permissions.length || "Pending"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricGrid({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card className="transition-transform hover:-translate-y-1" key={metric.label}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">{metric.label}</p>
              <CardTitle className="mt-2 text-3xl">{metric.value}</CardTitle>
            </div>
            <div
              className={cn(
                "grid size-11 place-items-center rounded-md",
                metricToneClass[metric.tone],
              )}
            >
              <metric.icon aria-hidden="true" className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={metric.tone === "warning" ? "warning" : metric.tone}>
              {metric.delta}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function OperationsTable({ tasks }: { tasks: DashboardTask[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority workspace</CardTitle>
        <p className="text-muted-foreground text-sm leading-6">
          Role-specific work that needs attention before the next operating cycle.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Context</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const StatusIcon = taskIcons[task.status];

              return (
                <TableRow key={task.label}>
                  <TableCell className="font-medium">{task.label}</TableCell>
                  <TableCell className="text-muted-foreground">{task.meta}</TableCell>
                  <TableCell>
                    <Badge variant={taskBadgeVariant[task.status]}>
                      <StatusIcon aria-hidden="true" className="size-3.5" />
                      {task.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ActivityFeed({ config }: { config: DashboardConfig }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {config.activity.map((item) => (
            <div className="flex gap-3" key={`${item.label}-${item.time}`}>
              <span className="bg-accent mt-1.5 size-2.5 shrink-0 rounded-full" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-muted-foreground mt-1 text-sm leading-6">{item.description}</p>
                <p className="text-muted-foreground mt-1 text-xs">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RoleDashboard({
  config,
  user,
}: {
  config: DashboardConfig;
  user: AuthSessionUser;
}) {
  return (
    <div className="space-y-6">
      <RoleHero config={config} user={user} />
      <MetricGrid metrics={config.metrics} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <OperationsTable tasks={config.operations} />
          <MetricChartCard
            data={config.trend}
            delta="Live trend"
            label={`${config.roleLabel} throughput`}
            value="Operational pulse"
          />
        </div>
        <div className="space-y-6">
          <Notification title={`${config.roleLabel} briefing`} variant="info">
            Your dashboard is a reusable layout scaffold. Live data hooks can replace these static
            widgets when the business workflows are implemented.
          </Notification>
          <Card>
            <CardHeader>
              <CardTitle>Capacity snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={config.trend} />
            </CardContent>
          </Card>
          <ActivityFeed config={config} />
        </div>
      </div>
    </div>
  );
}
