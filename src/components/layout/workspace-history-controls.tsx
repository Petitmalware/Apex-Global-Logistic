"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";

import { Button } from "@/components/ui/button";

type WorkspaceHistoryControlsProps = {
  homeHref: Route | string;
};

export function WorkspaceHistoryControls({ homeHref }: WorkspaceHistoryControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        aria-label="Go back"
        onClick={() => window.history.back()}
        size="sm"
        type="button"
        variant="outline"
      >
        <ArrowLeft aria-hidden="true" />
        Back
      </Button>
      <Button
        aria-label="Go forward"
        onClick={() => window.history.forward()}
        size="sm"
        type="button"
        variant="outline"
      >
        <ArrowRight aria-hidden="true" />
        Forward
      </Button>
      <Button asChild aria-label="Go to workspace home" size="sm" variant="outline">
        <Link href={homeHref as Route}>
          <Home aria-hidden="true" />
          Home
        </Link>
      </Button>
    </div>
  );
}
