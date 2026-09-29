"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Dialog({
  children,
  className,
  onOpenChange,
  open,
}: {
  children: React.ReactNode;
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      className={cn(
        "animate-scale-in border-border bg-popover text-popover-foreground shadow-panel backdrop:bg-foreground/30 dark:backdrop:bg-background/70 m-auto w-[min(92vw,520px)] rounded-lg border p-0",
        className,
      )}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      ref={dialogRef}
    >
      {children}
    </dialog>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-1.5 px-5 pt-5", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-lg font-semibold tracking-normal", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-muted-foreground text-sm leading-6", className)} {...props} />;
}

function DialogContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-5 py-5", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("border-border flex justify-end gap-3 border-t px-5 py-4", className)}
      {...props}
    />
  );
}

function DialogCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      className="absolute top-3 right-3"
      onClick={onClick}
      size="icon"
      type="button"
      variant="ghost"
    >
      <X aria-hidden="true" />
      <span className="sr-only">Close</span>
    </Button>
  );
}

export {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
};
