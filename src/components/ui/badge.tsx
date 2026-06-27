import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold",
  {
    defaultVariants: {
      variant: "neutral",
    },
    variants: {
      variant: {
        accent: "border-accent/35 bg-accent/15 text-accent-foreground",
        danger: "border-destructive/25 bg-destructive/10 text-destructive",
        info: "border-info/25 bg-info/10 text-info",
        neutral: "border-border bg-secondary text-secondary-foreground",
        outline: "border-border bg-background text-muted-foreground",
        success: "border-success/25 bg-success/10 text-success",
        warning: "border-warning/30 bg-warning/14 text-warning-foreground",
      },
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ className, variant }))} data-slot="badge" {...props} />
  );
}

export { Badge, badgeVariants };
