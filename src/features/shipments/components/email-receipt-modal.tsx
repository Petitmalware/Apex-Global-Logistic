"use client";

import { useState } from "react";
import { CheckCircle2, Mail, Send, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { secureFetch } from "@/lib/security/client-fetch";

type EmailReceiptModalProps = {
  shipmentId: string;
  shipmentNumber: string;
  defaultSenderEmail?: string | null;
  defaultReceiverEmail?: string | null;
  buttonVariant?: "default" | "outline" | "secondary" | "accent";
  buttonSize?: "default" | "sm" | "lg";
  className?: string;
  buttonLabel?: string;
};

export function EmailReceiptModal({
  shipmentId,
  shipmentNumber,
  defaultSenderEmail,
  defaultReceiverEmail,
  buttonVariant = "outline",
  buttonSize = "default",
  className = "",
  buttonLabel = "Email Receipt",
}: EmailReceiptModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipientChoice, setRecipientChoice] = useState<"sender" | "receiver" | "both">("both");
  const [senderEmail, setSenderEmail] = useState(defaultSenderEmail ?? "");
  const [receiverEmail, setReceiverEmail] = useState(defaultReceiverEmail ?? "");
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpen = () => {
    setSenderEmail(defaultSenderEmail ?? "");
    setReceiverEmail(defaultReceiverEmail ?? "");
    setRecipientChoice("both");
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isSending) return;
    setIsOpen(false);
  };

  const handleSend = async () => {
    setIsSending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (recipientChoice === "sender" && !senderEmail.trim()) {
      setErrorMessage("Please enter a valid sender email address.");
      setIsSending(false);
      return;
    }
    if (recipientChoice === "receiver" && !receiverEmail.trim()) {
      setErrorMessage("Please enter a valid receiver email address.");
      setIsSending(false);
      return;
    }
    if (recipientChoice === "both" && !senderEmail.trim() && !receiverEmail.trim()) {
      setErrorMessage("Please enter at least one recipient email address (sender or receiver).");
      setIsSending(false);
      return;
    }

    try {
      const res = await secureFetch(`/api/admin/shipments/${shipmentId}/send-receipt`, {
        body: JSON.stringify({
          receiverEmail: receiverEmail.trim() || undefined,
          recipientChoice,
          senderEmail: senderEmail.trim() || undefined,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        success?: boolean;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch thermal receipt email.");
      }

      setSuccessMessage(data.message || "Thermal shipping receipt sent successfully!");
      setTimeout(() => {
        setIsOpen(false);
      }, 2500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send receipt email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button
        className={className}
        onClick={handleOpen}
        size={buttonSize}
        type="button"
        variant={buttonVariant}
      >
        <Mail aria-hidden="true" className="size-4" />
        {buttonLabel}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl text-card-foreground"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-lg bg-amber-500/15 text-amber-500">
                  <Mail className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Email Thermal Shipping Receipt</h3>
                  <p className="text-xs text-muted-foreground">{shipmentNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSending}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="size-5" />
                <span className="sr-only">Close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {successMessage ? (
                <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Receipt Dispatched</p>
                    <p className="text-xs mt-0.5">{successMessage}</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Send an official 80mm-style thermal shipping receipt with real-time tracking links to the sender, receiver, or both.
                  </p>

                  {/* Recipient Selection Options */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Choose Recipient(s)
                    </Label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <label
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer text-center transition ${
                          recipientChoice === "both"
                            ? "border-amber-500 bg-amber-500/10 font-semibold text-amber-600 dark:text-amber-400"
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <input
                          type="radio"
                          name="recipientChoice"
                          value="both"
                          checked={recipientChoice === "both"}
                          onChange={() => setRecipientChoice("both")}
                          className="sr-only"
                        />
                        <span className="text-sm font-bold">Both</span>
                        <span className="text-[11px] opacity-80 mt-0.5">Sender & Receiver</span>
                      </label>

                      <label
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer text-center transition ${
                          recipientChoice === "sender"
                            ? "border-amber-500 bg-amber-500/10 font-semibold text-amber-600 dark:text-amber-400"
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <input
                          type="radio"
                          name="recipientChoice"
                          value="sender"
                          checked={recipientChoice === "sender"}
                          onChange={() => setRecipientChoice("sender")}
                          className="sr-only"
                        />
                        <span className="text-sm font-bold">Sender Only</span>
                        <span className="text-[11px] opacity-80 mt-0.5">Shipper email</span>
                      </label>

                      <label
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer text-center transition ${
                          recipientChoice === "receiver"
                            ? "border-amber-500 bg-amber-500/10 font-semibold text-amber-600 dark:text-amber-400"
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <input
                          type="radio"
                          name="recipientChoice"
                          value="receiver"
                          checked={recipientChoice === "receiver"}
                          onChange={() => setRecipientChoice("receiver")}
                          className="sr-only"
                        />
                        <span className="text-sm font-bold">Receiver Only</span>
                        <span className="text-[11px] opacity-80 mt-0.5">Consignee email</span>
                      </label>
                    </div>
                  </div>

                  {/* Email Inputs */}
                  <div className="space-y-4 pt-1">
                    {(recipientChoice === "sender" || recipientChoice === "both") && (
                      <div className="space-y-1.5">
                        <Label htmlFor="sender-email" className="text-xs font-semibold">
                          Sender Email Address
                        </Label>
                        <Input
                          id="sender-email"
                          type="email"
                          placeholder="shipper@example.com"
                          value={senderEmail}
                          onChange={(e) => setSenderEmail(e.target.value)}
                          className="h-10 text-sm"
                        />
                      </div>
                    )}

                    {(recipientChoice === "receiver" || recipientChoice === "both") && (
                      <div className="space-y-1.5">
                        <Label htmlFor="receiver-email" className="text-xs font-semibold">
                          Receiver Email Address
                        </Label>
                        <Input
                          id="receiver-email"
                          type="email"
                          placeholder="receiver@example.com"
                          value={receiverEmail}
                          onChange={(e) => setReceiverEmail(e.target.value)}
                          className="h-10 text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-600 dark:text-red-400 text-xs">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-muted/20">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSending}
                size="sm"
              >
                Cancel
              </Button>
              {!successMessage && (
                <Button
                  type="button"
                  variant="accent"
                  onClick={handleSend}
                  disabled={isSending}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold"
                >
                  {isSending ? (
                    <span className="flex items-center gap-2">
                      <span className="size-3.5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                      Sending Receipt…
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Send className="size-3.5" />
                      Send Receipt
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
