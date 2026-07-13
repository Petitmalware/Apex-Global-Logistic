import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2, Inbox, MessageSquareText, XCircle } from "lucide-react";

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
      <aside className="border-border bg-card overflow-hidden rounded-lg border">
        <div className="border-border border-b p-4">
          <h2 className="font-semibold tracking-normal">Live chat inbox</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Customer and visitor conversations from the public widget.
          </p>
        </div>
        <div className="max-h-[720px] overflow-y-auto">
          {conversations.length ? (
            conversations.map((conversation) => (
              <Link
                className={
                  selectedConversation?.id === conversation.id
                    ? "bg-secondary border-accent block border-l-4 p-4"
                    : "hover:bg-secondary/70 border-border block border-l-4 border-transparent p-4 transition-colors"
                }
                href={`/admin/chat?conversation=${conversation.id}` as Route}
                key={conversation.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{getContactName(conversation)}</p>
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
            <div className="border-border bg-card rounded-lg border p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{getContactName(selectedConversation)}</p>
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

            <div className="border-border bg-card max-h-[560px] space-y-3 overflow-y-auto rounded-lg border p-4">
              {selectedConversation.messages.map((message) => (
                <div className="space-y-1" key={message.id}>
                  <div
                    className={`max-w-[82%] rounded-lg px-3 py-2 text-sm ${getMessageTone(message.authorType)}`}
                  >
                    <p className="text-[11px] font-semibold opacity-75">
                      {message.authorName ?? message.authorType.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                    <ChatAttachmentList attachments={message.attachments} messageId={message.id} />
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    {formatDate(message.createdAt)}
                  </p>
                </div>
              ))}
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
