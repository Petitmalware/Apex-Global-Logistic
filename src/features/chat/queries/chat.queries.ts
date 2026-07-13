import "server-only";

import { ChatMessageAuthorType, type Prisma } from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type {
  ChatAttachmentView,
  ChatConversationDetail,
  ChatConversationListItem,
  ChatMessageView,
  PublicChatConversationView,
} from "@/features/chat/types";
import { verifyPublicConversation } from "@/features/chat/services/chat.service";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

function formatDate(value: Date) {
  return value.toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatAttachment(metadata: unknown): ChatAttachmentView | null {
  if (!isRecord(metadata)) {
    return null;
  }

  const { fileName, fileSizeBytes, id, mimeType } = metadata;

  if (
    typeof fileName !== "string" ||
    typeof fileSizeBytes !== "number" ||
    typeof id !== "string" ||
    typeof mimeType !== "string"
  ) {
    return null;
  }

  return {
    fileName,
    fileSizeBytes,
    id,
    isImage: mimeType.startsWith("image/"),
    mimeType,
  };
}

function getMessageAttachments(metadata: Prisma.JsonValue | null): ChatAttachmentView[] {
  if (!isRecord(metadata) || !Array.isArray(metadata.attachments)) {
    return [];
  }

  return metadata.attachments.map(formatAttachment).filter((item) => item !== null);
}

function canManageChat(user: AuthSessionUser) {
  return (
    user.roles.includes(AUTH_ROLES.ADMIN) ||
    user.roles.includes(AUTH_ROLES.SUPER_ADMIN) ||
    user.roles.includes(AUTH_ROLES.SUPPORT)
  );
}

function chatWhereForAdmin(user: AuthSessionUser): Prisma.ChatConversationWhereInput {
  if (!canManageChat(user)) {
    return {
      id: "__forbidden__",
    };
  }

  if (user.roles.includes(AUTH_ROLES.SUPER_ADMIN)) {
    return {};
  }

  return {
    organizationId: user.organizationId ?? "__none__",
  };
}

function mapMessage(message: {
  author: {
    name: string;
  } | null;
  authorType: ChatMessageAuthorType;
  body: string;
  createdAt: Date;
  id: string;
  isAiDraft: boolean;
  isInternal: boolean;
  metadata: Prisma.JsonValue | null;
}): ChatMessageView {
  return {
    attachments: getMessageAttachments(message.metadata),
    authorName: message.author?.name ?? null,
    authorType: message.authorType,
    body: message.body,
    createdAt: formatDate(message.createdAt),
    id: message.id,
    isAiDraft: message.isAiDraft,
    isInternal: message.isInternal,
  };
}

function getLatestMessage(
  messages: Array<{
    body: string;
  }>,
) {
  return messages[0]?.body ?? null;
}

function mapConversationListItem(conversation: {
  assignedTo: {
    name: string;
  } | null;
  customer: {
    name: string;
  } | null;
  id: string;
  lastMessageAt: Date;
  messages: Array<{
    body: string;
  }>;
  priority: ChatConversationListItem["priority"];
  shipment: {
    shipmentNumber: string;
  } | null;
  status: ChatConversationListItem["status"];
  subject: string;
  visitorEmail: string | null;
  visitorName: string | null;
  _count: {
    messages: number;
  };
}): ChatConversationListItem {
  return {
    assignedToName: conversation.assignedTo?.name ?? null,
    customerName: conversation.customer?.name ?? null,
    id: conversation.id,
    lastMessageAt: formatDate(conversation.lastMessageAt),
    latestMessage: getLatestMessage(conversation.messages),
    priority: conversation.priority,
    shipmentNumber: conversation.shipment?.shipmentNumber ?? null,
    status: conversation.status,
    subject: conversation.subject,
    unreadStaffCount: conversation._count.messages,
    visitorEmail: conversation.visitorEmail,
    visitorName: conversation.visitorName,
  };
}

export async function markAdminChatConversationRead(
  conversationId: string | undefined,
  user: AuthSessionUser,
) {
  if (!conversationId || !canManageChat(user)) {
    return;
  }

  try {
    await prisma.chatMessage.updateMany({
      data: {
        readAt: new Date(),
      },
      where: {
        authorType: {
          in: [ChatMessageAuthorType.CUSTOMER, ChatMessageAuthorType.VISITOR],
        },
        conversation: chatWhereForAdmin(user),
        conversationId,
        readAt: null,
      },
    });
  } catch {
    return;
  }
}

export async function getAdminChatConversations(
  user: AuthSessionUser,
): Promise<ChatConversationListItem[]> {
  try {
    const conversations = await prisma.chatConversation.findMany({
      include: {
        _count: {
          select: {
            messages: {
              where: {
                authorType: {
                  in: [ChatMessageAuthorType.CUSTOMER, ChatMessageAuthorType.VISITOR],
                },
                readAt: null,
              },
            },
          },
        },
        assignedTo: {
          select: {
            name: true,
          },
        },
        customer: {
          select: {
            name: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            body: true,
          },
          take: 1,
        },
        shipment: {
          select: {
            shipmentNumber: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
      take: 100,
      where: chatWhereForAdmin(user),
    });

    return conversations.map(mapConversationListItem);
  } catch {
    return [];
  }
}

export async function getAdminChatConversation(
  conversationId: string | undefined,
  user: AuthSessionUser,
): Promise<ChatConversationDetail | null> {
  if (!conversationId) {
    return null;
  }

  try {
    const conversation = await prisma.chatConversation.findFirst({
      include: {
        _count: {
          select: {
            messages: {
              where: {
                authorType: {
                  in: [ChatMessageAuthorType.CUSTOMER, ChatMessageAuthorType.VISITOR],
                },
                readAt: null,
              },
            },
          },
        },
        assignedTo: {
          select: {
            name: true,
          },
        },
        customer: {
          select: {
            name: true,
          },
        },
        messages: {
          include: {
            author: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        shipment: {
          select: {
            shipmentNumber: true,
          },
        },
      },
      where: {
        ...chatWhereForAdmin(user),
        id: conversationId,
      },
    });

    if (!conversation) {
      return null;
    }

    return {
      ...mapConversationListItem({
        ...conversation,
        messages: conversation.messages.slice(-1).map((message) => ({ body: message.body })),
      }),
      aiSummary: conversation.aiSummary,
      messages: conversation.messages.map(mapMessage),
      trackingReference: conversation.trackingReference,
      visitorPhone: conversation.visitorPhone,
    };
  } catch {
    return null;
  }
}

export async function getPublicChatConversation({
  accessKey,
  conversationId,
}: {
  accessKey: string;
  conversationId: string;
}): Promise<PublicChatConversationView | null> {
  try {
    await verifyPublicConversation(conversationId, accessKey);
    await prisma.chatMessage.updateMany({
      data: {
        readAt: new Date(),
      },
      where: {
        authorType: ChatMessageAuthorType.STAFF,
        conversationId,
        readAt: null,
      },
    });

    const conversation = await prisma.chatConversation.findUnique({
      include: {
        messages: {
          include: {
            author: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          where: {
            isInternal: false,
          },
        },
      },
      where: {
        id: conversationId,
      },
    });

    if (!conversation) {
      return null;
    }

    return {
      accessKey,
      conversationId: conversation.id,
      messages: conversation.messages.map(mapMessage),
      status: conversation.status,
      subject: conversation.subject,
    };
  } catch {
    return null;
  }
}
