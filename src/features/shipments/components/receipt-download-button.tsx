"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type ReceiptDownloadButtonProps = {
  label?: string;
  reference: string;
  size?: "default" | "sm";
  variant?: "accent" | "outline";
};

export function ReceiptDownloadButton({
  label = "Download receipt",
  reference,
  size = "default",
  variant = "accent",
}: ReceiptDownloadButtonProps) {
  function downloadReceipt() {
    const url = new URL(
      `/api/tracking/${encodeURIComponent(reference)}/receipt`,
      window.location.origin,
    );
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (timeZone) {
      url.searchParams.set("timeZone", timeZone);
    }

    window.location.assign(url.toString());
  }

  return (
    <Button onClick={downloadReceipt} size={size} type="button" variant={variant}>
      <Download aria-hidden="true" />
      {label}
    </Button>
  );
}
