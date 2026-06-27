import Link from "next/link";
import type { Route } from "next";
import { FileText, MailPlus, Send, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmailLogListItem } from "@/features/emails/types";

type EmailStudioDashboardProps = {
  overview: {
    failedCount: number;
    queuedCount: number;
    recentLogs: EmailLogListItem[];
    sentCount: number;
    templateCount: number;
  };
};

export function EmailStudioDashboard({ overview }: EmailStudioDashboardProps) {
  const metrics = [
    { icon: FileText, label: "Templates", value: overview.templateCount },
    { icon: Send, label: "Sent emails", value: overview.sentCount },
    { icon: MailPlus, label: "Queued", value: overview.queuedCount },
    { icon: TriangleAlert, label: "Failed", value: overview.failedCount },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">{metric.label}</CardTitle>
              <metric.icon aria-hidden="true" className="text-accent size-4" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-normal">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Compose</CardTitle>
            <CardDescription>
              Create a manual branded email with variables and preview.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="accent">
              <Link href={"/admin/emails/compose" as Route}>Open composer</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>
              Edit built-in logistics, pet, freight, invoice, and auth templates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={"/admin/emails/templates" as Route}>Manage templates</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
            <CardDescription>Audit queued, sent, and failed email activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={"/admin/emails/logs" as Route}>View logs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent email activity</CardTitle>
          <CardDescription>
            The latest email log entries across manual and system messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overview.recentLogs.length ? (
              overview.recentLogs.map((log) => (
                <div
                  className="border-border flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                  key={log.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{log.subject}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{log.recipientEmail}</p>
                  </div>
                  <Badge
                    variant={
                      log.status === "SENT"
                        ? "success"
                        : log.status === "FAILED"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {log.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No email activity yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
