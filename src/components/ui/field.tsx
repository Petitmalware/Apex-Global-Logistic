import * as React from "react";

import { cn } from "@/lib/utils";

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-2", className)} data-slot="field" {...props} />;
}

function FieldHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-muted-foreground text-xs leading-5", className)}
      data-slot="field-hint"
      {...props}
    />
  );
}

function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-destructive text-xs leading-5", className)}
      data-slot="field-error"
      {...props}
    />
  );
}

export { Field, FieldError, FieldHint };
