"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <Button onClick={() => window.print()} type="button" variant="accent">
      <Printer aria-hidden="true" />
      {label}
    </Button>
  );
}
