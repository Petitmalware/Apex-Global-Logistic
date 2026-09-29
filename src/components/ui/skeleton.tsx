import * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-muted before:via-background/50 relative overflow-hidden rounded-md before:absolute before:inset-y-0 before:left-0 before:w-1/2 before:-translate-x-full before:[animation:shimmer_1.6s_infinite] before:bg-linear-to-r before:from-transparent before:to-transparent before:content-['']",
        className,
      )}
      data-slot="skeleton"
      {...props}
    />
  );
}

export { Skeleton };
