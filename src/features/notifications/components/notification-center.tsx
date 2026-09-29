"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  CheckCheck,
  Circle,
  ExternalLink,
  Loader2,
  Mail,
  MessageSquareText,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NotificationCenterSnapshot, NotificationItem } from "@/features/notifications/types";
import { secureFetch } from "@/lib/security/client-fetch";
import { cn } from "@/lib/utils";

type NotificationCenterProps = {
  initialSnapshot: NotificationCenterSnapshot;
};

const channelLabels = {
  EMAIL: "Email",
  IN_APP: "In-app",
  PUSH: "Push",
  SMS: "SMS",
  WEBHOOK: "Webhook",
  WHATSAPP: "WhatsApp",
} as const;

function formatRelativeTime(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ] as const;
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const [unit, unitSeconds] of units) {
    if (Math.abs(seconds) >= unitSeconds) {
      return formatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }

  return formatter.format(seconds, "second");
}

function getNotificationIcon(notification: NotificationItem) {
  if (notification.channel === "EMAIL") {
    return Mail;
  }

  if (notification.channel === "SMS" || notification.channel === "WHATSAPP") {
    return MessageSquareText;
  }

  return Bell;
}

function NotificationPreviewItem({
  notification,
  onReadChange,
}: {
  notification: NotificationItem;
  onReadChange: (notificationId: string, read: boolean) => void;
}) {
  const Icon = getNotificationIcon(notification);
  const content = (
    <>
      <div
        className={cn(
          "mt-1 grid size-9 place-items-center rounded-md border",
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
        <div className="flex items-start justify-between gap-3">
          <p className="line-clamp-2 text-sm leading-5 font-semibold">{notification.title}</p>
          {!notification.isRead ? (
            <Circle aria-hidden="true" className="text-accent mt-1 size-2.5 fill-current" />
          ) : null}
        </div>
        {notification.body ? (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5">
            {notification.body}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{channelLabels[notification.channel]}</Badge>
          <span className="text-muted-foreground text-xs">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
      </div>
    </>
  );

  if (notification.actionUrl) {
    return (
      <Link
        className="hover:bg-secondary flex gap-3 rounded-md p-3 transition-colors"
        href={notification.actionUrl as Route}
        onClick={() => {
          if (!notification.isRead) {
            onReadChange(notification.id, true);
          }
        }}
      >
        {content}
      </Link>
    );
  }

  return <div className="flex gap-3 rounded-md p-3">{content}</div>;
}

export function NotificationCenter({ initialSnapshot }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [streamState, setStreamState] = useState<"live" | "reconnecting">("live");
  const [browserPermission, setBrowserPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const knownNotificationIds = useRef(new Set(initialSnapshot.notifications.map(({ id }) => id)));
  const hasNotifications = snapshot.notifications.length > 0;
  const unreadLabel = useMemo(() => {
    if (snapshot.unreadCount > 99) {
      return "99+";
    }

    return String(snapshot.unreadCount);
  }, [snapshot.unreadCount]);

  useEffect(() => {
    setBrowserPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.addEventListener("open", () => {
      setStreamState("live");
    });
    eventSource.addEventListener("error", () => {
      setStreamState("reconnecting");
    });
    eventSource.addEventListener("snapshot", (event) => {
      const nextSnapshot = JSON.parse((event as MessageEvent).data) as NotificationCenterSnapshot;

      if ("Notification" in window && Notification.permission === "granted") {
        const newNotifications = nextSnapshot.notifications.filter(
          ({ id, isRead }) => !isRead && !knownNotificationIds.current.has(id),
        );

        for (const notification of newNotifications) {
          const browserNotification = new Notification(notification.title, {
            body: notification.body ?? "You have a new Apex Global Logistics update.",
            tag: notification.id,
          });

          browserNotification.onclick = () => {
            window.focus();
            if (notification.actionUrl) {
              window.location.assign(notification.actionUrl);
            }
            browserNotification.close();
          };
        }
      }

      knownNotificationIds.current = new Set(nextSnapshot.notifications.map(({ id }) => id));
      setSnapshot(nextSnapshot);
      setStreamState("live");
    });

    return () => {
      eventSource.close();
    };
  }, []);

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) {
      setBrowserPermission("unsupported");
      return;
    }

    setBrowserPermission(await Notification.requestPermission());
  }

  async function updateReadState(notificationId: string, read: boolean) {
    setIsMutating(true);

    try {
      const response = await secureFetch(`/api/notifications/${notificationId}/read`, {
        body: JSON.stringify({ read }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      if (response.ok) {
        const data = (await response.json()) as { snapshot: NotificationCenterSnapshot };
        setSnapshot(data.snapshot);
      }
    } finally {
      setIsMutating(false);
    }
  }

  async function markAllRead() {
    setIsMutating(true);

    try {
      const response = await secureFetch("/api/notifications/read-all", {
        method: "POST",
      });

      if (response.ok) {
        const data = (await response.json()) as { snapshot: NotificationCenterSnapshot };
        setSnapshot(data.snapshot);
      }
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        className="border-border bg-background text-muted-foreground hover:text-foreground relative grid size-10 place-items-center rounded-md border transition-colors"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <Bell aria-hidden="true" className="size-4" />
        {snapshot.unreadCount > 0 ? (
          <span className="bg-accent text-accent-foreground absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full px-1 text-[10px] leading-5 font-bold">
            {unreadLabel}
          </span>
        ) : null}
        <span className="sr-only">Open notifications</span>
      </button>
      {isOpen ? (
        <div className="border-border bg-popover text-popover-foreground shadow-panel absolute top-12 right-0 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-lg border">
          <div className="border-border flex items-start justify-between gap-3 border-b p-4">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {snapshot.unreadCount} unread, {streamState}
              </p>
            </div>
            <Button
              disabled={snapshot.unreadCount === 0 || isMutating}
              onClick={markAllRead}
              size="sm"
              type="button"
              variant="outline"
            >
              {isMutating ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <CheckCheck aria-hidden="true" />
              )}
              Read all
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {hasNotifications ? (
              snapshot.notifications.map((notification) => (
                <NotificationPreviewItem
                  key={notification.id}
                  notification={notification}
                  onReadChange={updateReadState}
                />
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-semibold">No notifications</p>
                <p className="text-muted-foreground mt-1 text-xs">Everything is clear.</p>
              </div>
            )}
          </div>
          <div className="border-border flex items-center justify-between gap-3 border-t p-3">
            <Badge variant={streamState === "live" ? "success" : "warning"}>
              {streamState === "live" ? "Live" : "Reconnecting"}
            </Badge>
            {browserPermission !== "granted" && browserPermission !== "denied" ? (
              <Button onClick={enableBrowserNotifications} size="sm" type="button" variant="ghost">
                <BellRing aria-hidden="true" />
                Browser alerts
              </Button>
            ) : null}
            <Button asChild size="sm" variant="ghost">
              <Link href={"/notifications" as Route}>
                View history
                <ExternalLink aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
