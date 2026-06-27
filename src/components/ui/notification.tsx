import * as React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const notificationIcons = {
  danger: AlertCircle,
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
};

const notificationStyles = {
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
  info: "border-info/25 bg-info/10 text-info",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/15 text-warning-foreground",
};

type NotificationProps = {
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
  title: string;
  variant?: keyof typeof notificationStyles;
};

export function Notification({
  action,
  children,
  className,
  onDismiss,
  title,
  variant = "info",
}: NotificationProps) {
  const Icon = notificationIcons[variant];

  return (
    <div
      className={cn(
        "animate-fade-up flex items-start gap-3 rounded-lg border p-4 shadow-sm",
        notificationStyles[variant],
        className,
      )}
      role="status"
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-1 text-sm leading-6 opacity-90">{children}</div>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
      {onDismiss ? (
        <Button onClick={onDismiss} size="icon" type="button" variant="ghost">
          <X aria-hidden="true" />
          <span className="sr-only">Dismiss</span>
        </Button>
      ) : null}
    </div>
  );
}
