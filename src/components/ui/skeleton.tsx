import * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-muted before:via-background/50 before:bg-linear-to-r relative overflow-hidden rounded-md before:absolute before:inset-y-0 before:left-0 before:w-1/2 before:-translate-x-full before:from-transparent before:to-transparent before:content-[''] before:[animation:shimmer_1.6s_infinite]",
        className,
      )}
      data-slot="skeleton"
      {...props}
    />
  );
}

export { Skeleton };
