import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  action?: ReactNode;
  className?: string;
  description: string;
  icon: LucideIcon;
  title: string;
};

export function EmptyState({ action, className, description, icon: Icon, title }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border bg-surface flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      <div className="bg-background text-muted-foreground grid size-12 place-items-center rounded-md shadow-sm">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <h3 className="text-foreground mt-4 text-base font-semibold tracking-normal">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
