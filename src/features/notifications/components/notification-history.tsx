import Link from "next/link";
import type { Route } from "next";
import { Bell, Check, Mail, MessageSquareText, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  markNotificationUnreadAction,
} from "@/features/notifications/actions/notification.actions";
import type { NotificationItem } from "@/features/notifications/types";
import { cn } from "@/lib/utils";

type NotificationHistoryProps = {
  notifications: NotificationItem[];
  unreadCount: number;
};

const channelLabels = {
  EMAIL: "Email",
  IN_APP: "In-app",
  PUSH: "Push",
  SMS: "SMS",
  WEBHOOK: "Webhook",
  WHATSAPP: "WhatsApp",
} as const;

function getNotificationIcon(notification: NotificationItem) {
  if (notification.channel === "EMAIL") {
    return Mail;
  }

  if (notification.channel === "SMS" || notification.channel === "WHATSAPP") {
    return MessageSquareText;
  }

  return Bell;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationHistory({ notifications, unreadCount }: NotificationHistoryProps) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        description="New shipment, support, billing, security, and system alerts will appear here."
        icon={Bell}
        title="No notification history"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">Notification history</h2>
          <p className="text-muted-foreground mt-1 text-sm">{unreadCount} unread in-app alerts</p>
        </div>
        <form action={markAllNotificationsReadAction}>
          <Button disabled={unreadCount === 0} type="submit" variant="outline">
            <Check aria-hidden="true" />
            Mark all read
          </Button>
        </form>
      </div>
      <div className="border-border bg-card overflow-hidden rounded-lg border">
        {notifications.map((notification) => {
          const Icon = getNotificationIcon(notification);

          return (
            <div
              className={cn(
                "border-border flex flex-col gap-4 border-b p-4 last:border-b-0 sm:flex-row sm:items-start",
                !notification.isRead && notification.channel === "IN_APP" && "bg-accent/5",
              )}
              key={notification.id}
            >
              <div
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-md border",
                  notification.tone === "success" && "border-success/25 bg-success/10 text-success",
                  notification.tone === "warning" &&
                    "border-warning/30 bg-warning/15 text-warning-foreground",
                  notification.tone === "danger" &&
                    "border-destructive/25 bg-destructive/10 text-destructive",
                  notification.tone === "info" && "border-info/25 bg-info/10 text-info",
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={notification.isRead ? "outline" : "accent"}>
                    {notification.isRead ? "Read" : "Unread"}
                  </Badge>
                  <Badge variant="outline">{channelLabels[notification.channel]}</Badge>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold tracking-normal">
                  {notification.title}
                </h3>
                {notification.body ? (
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    {notification.body}
                  </p>
                ) : null}
                {notification.actionUrl ? (
                  <Button asChild className="mt-3" size="sm" variant="ghost">
                    <Link href={notification.actionUrl as Route}>Open related record</Link>
                  </Button>
                ) : null}
              </div>
              {notification.channel === "IN_APP" ? (
                <form
                  action={
                    notification.isRead
                      ? markNotificationUnreadAction.bind(null, notification.id)
                      : markNotificationReadAction.bind(null, notification.id)
                  }
                >
                  <Button size="sm" type="submit" variant="outline">
                    {notification.isRead ? (
                      <RotateCcw aria-hidden="true" />
                    ) : (
                      <Check aria-hidden="true" />
                    )}
                    {notification.isRead ? "Unread" : "Read"}
                  </Button>
                </form>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
