"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Paperclip, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ChatActionState } from "@/features/chat/types";
import { initialChatActionState } from "@/features/chat/types";
import { secureFetch } from "@/lib/security/client-fetch";

type AdminChatReplyBoxProps = {
  action: (state: ChatActionState, formData: FormData) => Promise<ChatActionState>;
  conversationId: string;
};

export function AdminChatReplyBox({ action, conversationId }: AdminChatReplyBoxProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialChatActionState);
  const [body, setBody] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftError, setDraftError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    setBody("");
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    router.refresh();
  }, [router, state.status]);

  async function draftWithAi() {
    setDraftError("");
    setIsDrafting(true);

    try {
      const response = await secureFetch(`/api/admin/chat/${conversationId}/draft`, {
        method: "POST",
      });
      const payload = (await response.json()) as { draft?: string; message?: string };

      if (!response.ok || !payload.draft) {
        setDraftError(payload.message ?? "AI could not draft a reply.");
        return;
      }

      setBody(payload.draft);
    } finally {
      setIsDrafting(false);
    }
  }

  return (
    <form action={formAction} className="border-border bg-card rounded-lg border p-4 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold">Reply to customer</p>
        <p className="text-muted-foreground mt-1 text-xs">
          The message is saved to the support case. Email notification delivery is recorded in Email
          Studio.
        </p>
      </div>
      <Field>
        <Label htmlFor="chat-reply">Message</Label>
        <Textarea
          className="min-h-28"
          id="chat-reply"
          name="body"
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a clear, customer-safe update..."
          value={body}
        />
        <FieldHint>AI drafts are suggestions only. Review before sending.</FieldHint>
        {state.fieldErrors?.body?.[0] ? <FieldError>{state.fieldErrors.body[0]}</FieldError> : null}
        {state.fieldErrors?.attachments?.[0] ? (
          <FieldError>{state.fieldErrors.attachments[0]}</FieldError>
        ) : null}
        {draftError ? <FieldError>{draftError}</FieldError> : null}
        {state.message ? (
          <p className="text-muted-foreground text-sm" role="status">
            {state.message}
          </p>
        ) : null}
      </Field>
      <Field className="mt-3">
        <Label
          className="border-border hover:bg-secondary flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors"
          htmlFor="admin-chat-attachments"
        >
          <Paperclip aria-hidden="true" className="size-4" />
          {selectedFiles.length
            ? `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} selected`
            : "Attach images or documents"}
        </Label>
        <input
          ref={fileInputRef}
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx"
          className="sr-only"
          id="admin-chat-attachments"
          multiple
          name="attachments"
          onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
          type="file"
        />
        <FieldHint>Up to 3 files per message. PDF, image, text, or Word files.</FieldHint>
      </Field>
      <div className="mt-3 flex flex-wrap justify-between gap-2">
        <Button disabled={isDrafting} onClick={draftWithAi} type="button" variant="outline">
          <Bot aria-hidden="true" />
          {isDrafting ? "Drafting..." : "Draft with AI"}
        </Button>
        <Button
          disabled={isPending || (!body.trim() && selectedFiles.length === 0)}
          type="submit"
          variant="accent"
        >
          <Send aria-hidden="true" />
          {isPending ? "Sending..." : "Send reply"}
        </Button>
      </div>
    </form>
  );
}
