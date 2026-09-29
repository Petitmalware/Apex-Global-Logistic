import * as React from "react";

import { cn } from "@/lib/utils";

function Kicker({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase",
        className,
      )}
      {...props}
    />
  );
}

function Display({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "text-foreground text-4xl leading-tight font-semibold tracking-normal sm:text-5xl",
        className,
      )}
      {...props}
    />
  );
}

function Heading({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-foreground text-2xl leading-8 font-semibold tracking-normal", className)}
      {...props}
    />
  );
}

function Text({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-muted-foreground text-sm leading-6", className)} {...props} />;
}

export { Display, Heading, Kicker, Text };
