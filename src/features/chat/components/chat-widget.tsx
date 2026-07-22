"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LifeBuoy, MessageCircle, Paperclip, Send, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChatAttachmentList } from "@/features/chat/components/chat-attachment-list";
import type { PublicChatConversationView } from "@/features/chat/types";
import { secureFetch } from "@/lib/security/client-fetch";

const STORAGE_KEY = "apex-live-chat";
const PENDING_MESSAGE_KEY = "apex-live-chat-pending-message";

type ChatWidgetProps = {
  surface?: "public" | "workspace";
};

type StoredChat = {
  accessKey: string;
  conversationId: string;
};

function readStoredChat(): StoredChat | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);

    return value ? (JSON.parse(value) as StoredChat) : null;
  } catch {
    return null;
  }
}

function writeStoredChat(value: StoredChat) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function readResumeToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get("chatResume");
}

function readPendingMessage() {
  return typeof window === "undefined"
    ? ""
    : (window.localStorage.getItem(PENDING_MESSAGE_KEY) ?? "");
}

function shouldHideWidget(pathname: string) {
  const workspacePrefixes = [
    "/admin",
    "/agent",
    "/ai",
    "/analytics",
    "/api",
    "/customer",
    "/dashboard",
    "/freight-transport",
    "/invoices",
    "/notifications",
    "/pet-transport",
    "/shipments",
    "/super-admin",
    "/support",
  ];
  const authPrefixes = ["/login", "/register", "/forgot-password", "/reset-password"];

  return [...workspacePrefixes, ...authPrefixes].some((prefix) => pathname.startsWith(prefix));
}

function formatAuthor(authorType: PublicChatConversationView["messages"][number]["authorType"]) {
  if (authorType === "STAFF") {
    return "Apex Support";
  }

  if (authorType === "SYSTEM") {
    return "System";
  }

  return "You";
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ChatWidget({ surface = "public" }: ChatWidgetProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<PublicChatConversationView | null>(null);
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [identity, setIdentity] = useState({
    email: "",
    name: "",
    phone: "",
    trackingReference: "",
  });
  const resumeToken = useMemo(readResumeToken, []);
  const storedChat = useMemo(() => (resumeToken ? null : readStoredChat()), [resumeToken]);

  useEffect(() => {
    if (!resumeToken) {
      return;
    }

    let cancelled = false;

    async function resumeConversation() {
      setIsOpen(true);
      setIsPending(true);
      setError("");

      try {
        const response = await secureFetch("/api/chat/public/resume", {
          body: JSON.stringify({ token: resumeToken }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });
        const payload = (await response.json().catch(() => ({}))) as {
          conversation?: PublicChatConversationView;
          message?: string;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok || !payload.conversation) {
          setError(payload.message ?? "Chat could not be resumed.");
          return;
        }

        writeStoredChat({
          accessKey: payload.conversation.accessKey,
          conversationId: payload.conversation.conversationId,
        });
        setConversation(payload.conversation);
        setMessage(readPendingMessage());
        window.localStorage.removeItem(PENDING_MESSAGE_KEY);
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete("chatResume");
        window.history.replaceState(
          null,
          "",
          `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
        );
      } finally {
        if (!cancelled) {
          setIsPending(false);
        }
      }
    }

    resumeConversation();

    return () => {
      cancelled = true;
    };
  }, [resumeToken]);

  useEffect(() => {
    if (!storedChat || conversation) {
      return;
    }

    const activeStoredChat = storedChat;
    let cancelled = false;

    async function loadConversation() {
      const response = await secureFetch(
        `/api/chat/public/conversations/${activeStoredChat.conversationId}?accessKey=${encodeURIComponent(activeStoredChat.accessKey)}`,
      );

      if (!response.ok || cancelled) {
        return;
      }

      const payload = (await response.json()) as { conversation?: PublicChatConversationView };

      if (payload.conversation) {
        setConversation(payload.conversation);
      }
    }

    loadConversation();

    return () => {
      cancelled = true;
    };
  }, [conversation, storedChat]);

  useEffect(() => {
    if (!conversation || !isOpen) {
      return;
    }

    const interval = window.setInterval(async () => {
      const response = await secureFetch(
        `/api/chat/public/conversations/${conversation.conversationId}?accessKey=${encodeURIComponent(conversation.accessKey)}`,
      );

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { conversation?: PublicChatConversationView };

      if (payload.conversation) {
        setConversation(payload.conversation);
      }
    }, 6000);

    return () => window.clearInterval(interval);
  }, [conversation, isOpen]);

  if (surface === "public" && shouldHideWidget(pathname)) {
    return null;
  }

  async function startConversation() {
    setError("");
    setNotice("");

    if (!identity.name.trim()) {
      setError("Enter your name so support can identify your conversation.");
      return;
    }

    if (!identity.email.trim()) {
      setError("Enter your email address to start or resume your support conversation.");
      return;
    }

    if (!message.trim() && selectedFiles.length === 0) {
      setError("Enter a message or attach a file so Apex support knows how to help.");
      return;
    }

    setIsPending(true);

    try {
      const formData = new FormData();

      formData.set("email", identity.email);
      formData.set("message", message);
      formData.set("name", identity.name);
      formData.set("phone", identity.phone);
      formData.set("trackingReference", identity.trackingReference);
      selectedFiles.forEach((file) => formData.append("attachments", file));

      const response = await secureFetch("/api/chat/public/conversations", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as {
        conversation?: PublicChatConversationView;
        message?: string;
        resumed?: boolean;
        resumeRequired?: boolean;
      };

      if (payload.resumeRequired) {
        window.localStorage.setItem(PENDING_MESSAGE_KEY, message);
        setNotice(
          payload.message ??
            "An active chat already exists. Check your email for a secure resume link.",
        );
        return;
      }

      if (!response.ok || !payload.conversation) {
        setError(payload.message ?? "Chat could not be started.");
        return;
      }

      writeStoredChat({
        accessKey: payload.conversation.accessKey,
        conversationId: payload.conversation.conversationId,
      });
      setConversation(payload.conversation);
      if (payload.resumed) {
        setNotice("Your existing support conversation is open. Send your message to continue.");
      } else {
        setMessage("");
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } finally {
      setIsPending(false);
    }
  }

  async function sendMessage() {
    if (!conversation || (!message.trim() && selectedFiles.length === 0)) {
      return;
    }

    setError("");
    setNotice("");
    setIsPending(true);

    try {
      const formData = new FormData();

      formData.set("accessKey", conversation.accessKey);
      formData.set("body", message);
      selectedFiles.forEach((file) => formData.append("attachments", file));

      const response = await secureFetch(
        `/api/chat/public/conversations/${conversation.conversationId}/messages`,
        {
          body: formData,
          method: "POST",
        },
      );
      const payload = (await response.json()) as {
        conversation?: PublicChatConversationView;
        message?: string;
      };

      if (!response.ok || !payload.conversation) {
        setError(payload.message ?? "Message could not be sent.");
        return;
      }

      setConversation(payload.conversation);
      setMessage("");
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {isOpen ? (
        <section className="border-border bg-popover text-popover-foreground shadow-panel flex h-[min(640px,calc(100dvh-2rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border">
          <header className="bg-primary text-primary-foreground flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <span className="bg-primary-foreground/10 grid size-9 shrink-0 place-items-center rounded-md">
                <LifeBuoy aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Apex Support Desk</p>
                <p className="text-xs opacity-80">Secure delivery assistance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded border border-white/20 px-2 py-1 text-[10px] font-semibold uppercase sm:inline-flex">
                Support case
              </span>
              <button
                className="grid size-8 place-items-center rounded-md hover:bg-white/10"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
                <span className="sr-only">Close chat</span>
              </button>
            </div>
          </header>

          <div className="bg-muted/20 flex-1 overflow-y-auto p-4">
            {conversation ? (
              <div aria-live="polite" className="space-y-3" role="log">
                <div className="border-border bg-background flex items-center gap-2 rounded-md border px-3 py-2 text-xs">
                  <ShieldCheck aria-hidden="true" className="text-success size-4 shrink-0" />
                  <span className="text-muted-foreground">
                    Your messages are saved to this support case. New replies appear here
                    automatically.
                  </span>
                </div>
                {conversation.messages.map((chatMessage) => {
                  const isCustomer = ["CUSTOMER", "VISITOR"].includes(chatMessage.authorType);

                  return (
                    <div
                      className={isCustomer ? "flex justify-end" : "flex justify-start"}
                      key={chatMessage.id}
                    >
                      <div
                        className={
                          isCustomer
                            ? "bg-primary text-primary-foreground max-w-[84%] rounded-lg px-3 py-2.5 text-sm shadow-sm"
                            : "border-border bg-background text-foreground max-w-[84%] rounded-lg border px-3 py-2.5 text-sm shadow-sm"
                        }
                      >
                        <div className="flex items-center justify-between gap-4 text-[11px] font-semibold opacity-75">
                          <p>{formatAuthor(chatMessage.authorType)}</p>
                          <time dateTime={chatMessage.createdAt}>
                            {formatMessageTime(chatMessage.createdAt)}
                          </time>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap">{chatMessage.body}</p>
                        <ChatAttachmentList
                          accessKey={conversation.accessKey}
                          attachments={chatMessage.attachments}
                          messageId={chatMessage.id}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-border bg-background rounded-md border p-3">
                  <div className="flex items-start gap-2">
                    <ShieldCheck
                      aria-hidden="true"
                      className="text-accent mt-0.5 size-4 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-semibold">Start a support case</p>
                      <p className="text-muted-foreground mt-1 text-xs leading-5">
                        Use the email connected to your delivery. One active case is kept per email
                        so your support history stays together.
                      </p>
                    </div>
                  </div>
                </div>
                <Field>
                  <Label htmlFor="chat-name">Full name</Label>
                  <Input
                    autoComplete="name"
                    id="chat-name"
                    onChange={(event) =>
                      setIdentity((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Your name"
                    required
                    value={identity.name}
                  />
                </Field>
                <Field>
                  <Label htmlFor="chat-email">Email address</Label>
                  <Input
                    autoComplete="email"
                    id="chat-email"
                    onChange={(event) =>
                      setIdentity((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={identity.email}
                  />
                  <FieldHint>
                    This email identifies your support case and prevents duplicate chats.
                  </FieldHint>
                </Field>
                <Field>
                  <Label htmlFor="chat-tracking">Tracking number</Label>
                  <Input
                    id="chat-tracking"
                    onChange={(event) =>
                      setIdentity((current) => ({
                        ...current,
                        trackingReference: event.target.value,
                      }))
                    }
                    placeholder="Optional"
                    value={identity.trackingReference}
                  />
                  <FieldHint>Attach a shipment if you have one.</FieldHint>
                </Field>
              </div>
            )}
          </div>

          <div className="border-border bg-background border-t p-4">
            <Field>
              <Label className="sr-only" htmlFor="chat-message">
                Message
              </Label>
              <Textarea
                className="min-h-20"
                id="chat-message"
                onChange={(event) => setMessage(event.target.value)}
                placeholder={
                  conversation
                    ? "Write a reply to Apex Support..."
                    : "Describe how Apex Support can help..."
                }
                value={message}
              />
              {error ? <FieldError>{error}</FieldError> : null}
              {notice ? (
                <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
                  {notice}
                </p>
              ) : null}
            </Field>
            <Field className="mt-3">
              <Label
                className="border-border bg-background hover:bg-secondary flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors"
                htmlFor="chat-attachments"
              >
                <Paperclip aria-hidden="true" className="size-4" />
                {selectedFiles.length
                  ? `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} selected`
                  : "Attach images or documents"}
              </Label>
              <Input
                ref={fileInputRef}
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx"
                className="sr-only"
                id="chat-attachments"
                multiple
                onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
                type="file"
              />
              <FieldHint>Up to 3 files per message. PDF, image, text, or Word files.</FieldHint>
            </Field>
            <Button
              className="mt-3 w-full"
              disabled={
                isPending ||
                (!conversation && (!identity.name.trim() || !identity.email.trim())) ||
                (!message.trim() && selectedFiles.length === 0)
              }
              onClick={conversation ? sendMessage : startConversation}
              type="button"
              variant="accent"
            >
              <Send aria-hidden="true" />
              {conversation ? "Send message" : "Open support case"}
            </Button>
          </div>
        </section>
      ) : (
        <Button
          className="shadow-panel"
          onClick={() => setIsOpen(true)}
          type="button"
          variant="accent"
        >
          <MessageCircle aria-hidden="true" />
          Contact support
        </Button>
      )}
    </div>
  );
}
