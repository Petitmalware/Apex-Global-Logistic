import type { ChatConversationStatus, ChatMessageAuthorType, TicketPriority } from "@prisma/client";

export type ChatActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "error" | "idle" | "success";
};

export const initialChatActionState: ChatActionState = {
  status: "idle",
};

export type ChatAttachmentView = {
  fileName: string;
  fileSizeBytes: number;
  id: string;
  isImage: boolean;
  mimeType: string;
};

export type ChatMessageView = {
  attachments: ChatAttachmentView[];
  authorName: string | null;
  authorType: ChatMessageAuthorType;
  body: string;
  createdAt: string;
  id: string;
  isAiDraft: boolean;
  isInternal: boolean;
};

export type ChatConversationListItem = {
  assignedToName: string | null;
  customerName: string | null;
  id: string;
  lastMessageAt: string;
  latestMessage: string | null;
  priority: TicketPriority;
  shipmentNumber: string | null;
  status: ChatConversationStatus;
  subject: string;
  unreadStaffCount: number;
  visitorEmail: string | null;
  visitorName: string | null;
};

export type ChatConversationDetail = ChatConversationListItem & {
  aiSummary: string | null;
  messages: ChatMessageView[];
  trackingReference: string | null;
  visitorPhone: string | null;
};

export type PublicChatConversationView = {
  accessKey: string;
  conversationId: string;
  messages: ChatMessageView[];
  status: ChatConversationStatus;
  subject: string;
};
