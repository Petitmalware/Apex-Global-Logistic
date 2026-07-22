import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2, Inbox, MessageSquareText, ShieldCheck, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  sendStaffChatMessageAction,
  updateChatStatusAction,
} from "@/features/chat/actions/chat.actions";
import { ChatAutoRefresh } from "@/features/chat/components/chat-auto-refresh";
import { ChatAttachmentList } from "@/features/chat/components/chat-attachment-list";
import { AdminChatReplyBox } from "@/features/chat/components/admin-chat-reply-box";
import type { ChatConversationDetail, ChatConversationListItem } from "@/features/chat/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getContactName(conversation: ChatConversationListItem) {
  return (
    conversation.customerName ?? conversation.visitorName ?? conversation.visitorEmail ?? "Visitor"
  );
}

function getMessageTone(authorType: ChatConversationDetail["messages"][number]["authorType"]) {
  if (authorType === "STAFF" || authorType === "AI") {
    return "bg-primary text-primary-foreground ml-auto";
  }

  if (authorType === "SYSTEM") {
    return "bg-warning/10 text-warning-foreground mx-auto";
  }

  return "bg-secondary text-secondary-foreground";
}

export function AdminChatConsole({
  conversations,
  selectedConversation,
}: {
  conversations: ChatConversationListItem[];
  selectedConversation: ChatConversationDetail | null;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <ChatAutoRefresh />
      <aside className="border-border bg-card overflow-hidden rounded-lg border shadow-sm">
        <div className="border-border bg-surface border-b p-4">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-md">
              <Inbox aria-hidden="true" className="size-4" />
            </span>
            <div>
              <h2 className="font-semibold tracking-normal">Support desk</h2>
              <p className="text-muted-foreground mt-0.5 text-xs">Open customer conversations</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Customer and visitor messages from the public support widget.
          </p>
        </div>
        <div className="max-h-[720px] overflow-y-auto">
          {conversations.length ? (
            conversations.map((conversation) => (
              <Link
                className={
                  selectedConversation?.id === conversation.id
                    ? "bg-secondary border-accent block border-l-4 p-4 shadow-sm"
                    : "hover:bg-secondary/70 border-border block border-l-4 border-transparent p-4 transition-colors"
                }
                href={`/admin/chat?conversation=${conversation.id}` as Route}
                key={conversation.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{getContactName(conversation)}</p>
                    {conversation.visitorEmail ? (
                      <p className="text-muted-foreground mt-1 truncate text-xs">
                        {conversation.visitorEmail}
                      </p>
                    ) : null}
                    <p className="text-muted-foreground mt-1 truncate text-xs">
                      {conversation.subject}
                    </p>
                  </div>
                  {conversation.unreadStaffCount ? (
                    <Badge variant="warning">{conversation.unreadStaffCount}</Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-3 line-clamp-2 text-xs leading-5">
                  {conversation.latestMessage ?? "No message yet"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{conversation.status.replaceAll("_", " ")}</Badge>
                  {conversation.shipmentNumber ? (
                    <Badge variant="neutral">{conversation.shipmentNumber}</Badge>
                  ) : null}
                </div>
              </Link>
            ))
          ) : (
            <div className="p-4">
              <EmptyState
                description="Live chat conversations will appear here when customers send messages."
                icon={Inbox}
                title="No live chats yet"
              />
            </div>
          )}
        </div>
      </aside>

      <section className="min-w-0">
        {selectedConversation ? (
          <div className="space-y-4">
            <div className="border-border bg-card rounded-lg border p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold uppercase">
                    <ShieldCheck aria-hidden="true" className="text-success size-4" />
                    Customer support case
                  </div>
                  <p className="mt-3 text-sm font-semibold">
                    {getContactName(selectedConversation)}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-normal">
                    {selectedConversation.subject}
                  </h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {selectedConversation.visitorEmail ?? "No email"}{" "}
                    {selectedConversation.visitorPhone
                      ? ` / ${selectedConversation.visitorPhone}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {selectedConversation.status.replaceAll("_", " ")}
                  </Badge>
                  {selectedConversation.shipmentNumber ? (
                    <Badge variant="neutral">{selectedConversation.shipmentNumber}</Badge>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={updateChatStatusAction.bind(null, selectedConversation.id)}>
                  <input name="status" type="hidden" value="RESOLVED" />
                  <Button size="sm" type="submit" variant="outline">
                    <CheckCircle2 aria-hidden="true" />
                    Resolve
                  </Button>
                </form>
                <form action={updateChatStatusAction.bind(null, selectedConversation.id)}>
                  <input name="status" type="hidden" value="CLOSED" />
                  <Button size="sm" type="submit" variant="outline">
                    <XCircle aria-hidden="true" />
                    Close
                  </Button>
                </form>
              </div>
            </div>

            <div
              aria-live="polite"
              className="border-border bg-surface max-h-[560px] space-y-3 overflow-y-auto rounded-lg border p-4"
              role="log"
            >
              {selectedConversation.messages.map((message) => {
                const isStaff = message.authorType === "STAFF" || message.authorType === "AI";

                return (
                  <div className={`space-y-1 ${isStaff ? "text-right" : ""}`} key={message.id}>
                    <div
                      className={`max-w-[82%] rounded-lg px-3 py-2 text-sm ${getMessageTone(message.authorType)}`}
                    >
                      <p className="text-[11px] font-semibold opacity-75">
                        {message.authorName ?? message.authorType.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                      <ChatAttachmentList
                        attachments={message.attachments}
                        messageId={message.id}
                      />
                    </div>
                    <p
                      className={`text-muted-foreground text-[11px] ${isStaff ? "text-right" : ""}`}
                    >
                      {formatDate(message.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>

            <AdminChatReplyBox
              action={sendStaffChatMessageAction.bind(null, selectedConversation.id)}
              conversationId={selectedConversation.id}
            />
          </div>
        ) : (
          <EmptyState
            description="Choose a conversation from the inbox to review context, draft an AI-assisted reply, and respond as admin."
            icon={MessageSquareText}
            title="Select a chat"
          />
        )}
      </section>
    </div>
  );
}
