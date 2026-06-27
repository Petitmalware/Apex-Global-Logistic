import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full appearance-none rounded-md border px-3 py-2 pr-9 text-sm transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        data-slot="select"
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </div>
  );
}

export { Select };
