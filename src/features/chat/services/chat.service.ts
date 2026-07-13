import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  ActivityAction,
  ChatConversationStatus,
  ChatMessageAuthorType,
  type Prisma,
} from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type {
  PublicChatMessageInput,
  StaffChatMessageInput,
  StartChatConversationInput,
} from "@/features/chat/schemas/chat.schemas";
import { generateAiText } from "@/features/ai/services/ai-provider.service";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { prisma } from "@/lib/db";
import {
  DOCUMENT_EXTENSIONS,
  DOCUMENT_MIME_TYPES,
  persistValidatedUpload,
  type PersistedUpload,
} from "@/lib/security/file-validation";

function hashAccessKey(accessKey: string) {
  return createHash("sha256").update(accessKey).digest("hex");
}

function createAccessKey() {
  return randomBytes(32).toString("base64url");
}

function canManageChat(user: AuthSessionUser) {
  return (
    user.roles.includes(AUTH_ROLES.ADMIN) ||
    user.roles.includes(AUTH_ROLES.SUPER_ADMIN) ||
    user.roles.includes(AUTH_ROLES.SUPPORT)
  );
}

const CHAT_ATTACHMENT_MAX_FILES = 3;
const CHAT_ATTACHMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export type ChatAttachmentMetadata = PersistedUpload & {
  id: string;
};

export type ChatMessageAttachmentInput = {
  attachments?: File[];
};

function getAdminOrganizationFilter(user: AuthSessionUser) {
  if (user.roles.includes(AUTH_ROLES.SUPER_ADMIN)) {
    return undefined;
  }

  if (!user.organizationId) {
    throw new AuthError("Your admin account is not attached to an organization.", 403, "FORBIDDEN");
  }

  return user.organizationId;
}

async function getDefaultOrganizationId(user?: AuthSessionUser | null) {
  if (user?.organizationId) {
    return user.organizationId;
  }

  const organization = await prisma.organization.findFirst({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
    },
    where: {
      deletedAt: null,
    },
  });

  return organization?.id ?? null;
}

async function getShipmentForChat(reference?: string) {
  if (!reference?.trim()) {
    return null;
  }

  return prisma.shipment.findFirst({
    select: {
      id: true,
      organizationId: true,
      shipmentNumber: true,
    },
    where: {
      deletedAt: null,
      OR: [
        {
          shipmentNumber: reference.trim(),
        },
        {
          referenceNumber: reference.trim(),
        },
      ],
    },
  });
}

function getParticipantName(input: StartChatConversationInput, user?: AuthSessionUser | null) {
  return user?.name ?? input.name ?? input.email ?? "Visitor";
}

function getParticipantEmail(input: StartChatConversationInput, user?: AuthSessionUser | null) {
  return user?.email ?? input.email ?? null;
}

function normalizeChatBody(body: string | undefined | null, attachments: ChatAttachmentMetadata[]) {
  const trimmedBody = body?.trim() ?? "";

  if (trimmedBody) {
    return trimmedBody;
  }

  const [attachment] = attachments;

  return attachment ? `Attachment sent: ${attachment.fileName}` : "Attachments sent.";
}

function assertChatMessageHasContent(body: string | undefined | null, attachments: File[]) {
  const hasBody = Boolean(body?.trim());
  const hasAttachment = attachments.some((file) => file instanceof File && file.size > 0);

  if (!hasBody && !hasAttachment) {
    throw new AuthError("Enter a message or attach a file before sending.", 400, "CHAT_EMPTY");
  }
}

async function persistChatAttachments(conversationId: string, attachments: File[] = []) {
  const files = attachments.filter((file) => file instanceof File && file.size > 0);

  if (files.length > CHAT_ATTACHMENT_MAX_FILES) {
    throw new AuthError(
      `Attach up to ${CHAT_ATTACHMENT_MAX_FILES} files per chat message.`,
      400,
      "CHAT_ATTACHMENT_LIMIT",
    );
  }

  const persisted: ChatAttachmentMetadata[] = [];

  for (const file of files) {
    const upload = await persistValidatedUpload({
      file,
      folderSegments: ["chat", conversationId, "attachments"],
      rules: {
        acceptedMimeTypes: DOCUMENT_MIME_TYPES,
        allowedExtensions: DOCUMENT_EXTENSIONS,
        emptyFileMessage: "Choose a chat attachment to upload.",
        maxSizeBytes: CHAT_ATTACHMENT_MAX_SIZE_BYTES,
        tooLargeMessage: "Chat attachments must be 10MB or smaller.",
        unsupportedTypeMessage:
          "Chat attachments must be a PDF, image, text, Word document, or WebP file.",
      },
      storageKeyPrefix: `chat/${conversationId}/attachments`,
    });

    persisted.push({
      ...upload,
      id: randomUUID(),
    });
  }

  return persisted;
}

async function logChatActivity({
  action,
  conversationId,
  metadata,
  organizationId,
  user,
}: {
  action: ActivityAction;
  conversationId: string;
  metadata?: Prisma.InputJsonValue;
  organizationId?: string | null;
  user?: AuthSessionUser | null;
}) {
  await prisma.activityLog
    .create({
      data: {
        action,
        actorId: user?.id,
        entityId: conversationId,
        entityType: "chat_conversation",
        metadata,
        organizationId,
      },
    })
    .catch(() => null);
}

export async function startChatConversation(
  input: StartChatConversationInput,
  user?: AuthSessionUser | null,
  options: ChatMessageAttachmentInput = {},
) {
  const shipment = await getShipmentForChat(input.trackingReference);
  const organizationId = shipment?.organizationId ?? (await getDefaultOrganizationId(user));
  const accessKey = createAccessKey();
  const conversationId = randomUUID();
  const participantName = getParticipantName(input, user);
  const participantEmail = getParticipantEmail(input, user);
  const attachmentFiles = options.attachments ?? [];
  assertChatMessageHasContent(input.message, attachmentFiles);
  const attachments = await persistChatAttachments(conversationId, attachmentFiles);
  const subject =
    input.subject?.trim() ||
    (shipment ? `Shipment ${shipment.shipmentNumber} support` : "Live chat support");

  const conversation = await prisma.$transaction(async (transaction) => {
    const createdConversation = await transaction.chatConversation.create({
      data: {
        accessKeyHash: hashAccessKey(accessKey),
        customerId: user?.id,
        id: conversationId,
        metadata: {
          source: user ? "authenticated_widget" : "public_widget",
        },
        organizationId,
        shipmentId: shipment?.id,
        subject,
        trackingReference: input.trackingReference,
        visitorEmail: participantEmail,
        visitorName: participantName,
        visitorPhone: input.phone,
      },
      select: {
        id: true,
        organizationId: true,
        status: true,
        subject: true,
      },
    });

    await transaction.chatMessage.create({
      data: {
        authorId: user?.id,
        authorType: user ? ChatMessageAuthorType.CUSTOMER : ChatMessageAuthorType.VISITOR,
        body: normalizeChatBody(input.message, attachments),
        conversationId: createdConversation.id,
        metadata: {
          attachments,
          email: participantEmail,
          name: participantName,
        },
      },
    });

    await transaction.chatMessage.create({
      data: {
        authorType: ChatMessageAuthorType.SYSTEM,
        body: "Apex support received this live chat request. An admin can reply from the chat inbox.",
        conversationId: createdConversation.id,
      },
    });

    return createdConversation;
  });

  await logChatActivity({
    action: ActivityAction.CREATE,
    conversationId: conversation.id,
    metadata: { subject },
    organizationId: conversation.organizationId,
    user,
  });

  return {
    accessKey,
    conversationId: conversation.id,
    status: conversation.status,
    subject: conversation.subject,
  };
}

export async function verifyPublicConversation(conversationId: string, accessKey: string) {
  const conversation = await prisma.chatConversation.findFirst({
    select: {
      accessKeyHash: true,
      id: true,
    },
    where: {
      id: conversationId,
    },
  });

  if (!conversation?.accessKeyHash || conversation.accessKeyHash !== hashAccessKey(accessKey)) {
    throw new AuthError("Chat conversation was not found.", 404, "CHAT_NOT_FOUND");
  }

  return conversation.id;
}

export async function addPublicChatMessage(
  conversationId: string,
  input: PublicChatMessageInput,
  options: ChatMessageAttachmentInput = {},
  user?: AuthSessionUser | null,
) {
  const verifiedConversationId = await verifyPublicConversation(conversationId, input.accessKey);
  const attachmentFiles = options.attachments ?? [];
  assertChatMessageHasContent(input.body, attachmentFiles);
  const attachments = await persistChatAttachments(verifiedConversationId, attachmentFiles);

  await prisma.$transaction(async (transaction) => {
    await transaction.chatMessage.create({
      data: {
        authorId: user?.id,
        authorType: user ? ChatMessageAuthorType.CUSTOMER : ChatMessageAuthorType.VISITOR,
        body: normalizeChatBody(input.body, attachments),
        conversationId: verifiedConversationId,
        metadata: {
          attachments,
        },
      },
    });

    await transaction.chatConversation.update({
      data: {
        lastMessageAt: new Date(),
        status: ChatConversationStatus.PENDING_STAFF,
      },
      where: {
        id: verifiedConversationId,
      },
    });
  });
}

export async function addStaffChatMessage(
  conversationId: string,
  input: StaffChatMessageInput,
  user: AuthSessionUser,
  options: ChatMessageAttachmentInput = {},
) {
  if (!canManageChat(user)) {
    throw new AuthError("You do not have permission to reply to live chat.", 403, "FORBIDDEN");
  }

  const conversation = await prisma.chatConversation.findFirst({
    select: {
      id: true,
      organizationId: true,
    },
    where: {
      id: conversationId,
      organizationId: getAdminOrganizationFilter(user),
    },
  });

  if (!conversation) {
    throw new AuthError("Chat conversation was not found.", 404, "CHAT_NOT_FOUND");
  }

  const attachmentFiles = options.attachments ?? [];
  assertChatMessageHasContent(input.body, attachmentFiles);
  const attachments = await persistChatAttachments(conversationId, attachmentFiles);

  await prisma.$transaction(async (transaction) => {
    await transaction.chatMessage.create({
      data: {
        authorId: user.id,
        authorType: ChatMessageAuthorType.STAFF,
        body: normalizeChatBody(input.body, attachments),
        conversationId,
        metadata: {
          attachments,
        },
      },
    });

    await transaction.chatConversation.update({
      data: {
        assignedToId: user.id,
        lastMessageAt: new Date(),
        status: ChatConversationStatus.PENDING_CUSTOMER,
      },
      where: {
        id: conversationId,
      },
    });
  });

  await logChatActivity({
    action: ActivityAction.UPDATE,
    conversationId,
    metadata: { event: "staff_reply" },
    organizationId: conversation.organizationId,
    user,
  });
}

export async function updateChatConversationStatus({
  conversationId,
  status,
  user,
}: {
  conversationId: string;
  status: ChatConversationStatus;
  user: AuthSessionUser;
}) {
  if (!canManageChat(user)) {
    throw new AuthError("You do not have permission to manage live chat.", 403, "FORBIDDEN");
  }

  const now = new Date();
  const conversation = await prisma.chatConversation.findFirst({
    select: {
      id: true,
    },
    where: {
      id: conversationId,
      organizationId: getAdminOrganizationFilter(user),
    },
  });

  if (!conversation) {
    throw new AuthError("Chat conversation was not found.", 404, "CHAT_NOT_FOUND");
  }

  await prisma.chatConversation.update({
    data: {
      closedAt: status === ChatConversationStatus.CLOSED ? now : undefined,
      resolvedAt: status === ChatConversationStatus.RESOLVED ? now : undefined,
      status,
    },
    where: {
      id: conversationId,
    },
  });
}

export async function draftChatReply(conversationId: string, user: AuthSessionUser) {
  if (!canManageChat(user)) {
    throw new AuthError("You do not have permission to use chat AI assist.", 403, "FORBIDDEN");
  }

  const conversation = await prisma.chatConversation.findFirst({
    include: {
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
      },
      shipment: {
        select: {
          destinationAddress: {
            select: {
              city: true,
            },
          },
          originAddress: {
            select: {
              city: true,
            },
          },
          shipmentNumber: true,
          status: true,
        },
      },
    },
    where: {
      id: conversationId,
      organizationId: getAdminOrganizationFilter(user),
    },
  });

  if (!conversation) {
    throw new AuthError("Chat conversation was not found.", 404, "CHAT_NOT_FOUND");
  }

  const transcript = [...conversation.messages]
    .reverse()
    .map((message) => `${message.authorType}: ${message.body}`)
    .join("\n");
  const shipmentContext = conversation.shipment
    ? `Shipment ${conversation.shipment.shipmentNumber} is ${conversation.shipment.status} from ${conversation.shipment.originAddress.city} to ${conversation.shipment.destinationAddress.city}.`
    : "No shipment is linked.";
  const output = await generateAiText({
    maxTokens: 500,
    messages: [
      {
        content:
          "You draft concise, professional logistics chat replies for Apex Global Logistics. Never promise refunds, delivery guarantees, or legal outcomes unless they are in the provided context. The admin will review before sending.",
        role: "system",
      },
      {
        content: `Subject: ${conversation.subject}\nVisitor: ${conversation.visitorName ?? "Customer"} <${conversation.visitorEmail ?? "unknown"}>\n${shipmentContext}\n\nTranscript:\n${transcript}\n\nDraft the next admin reply.`,
        role: "user",
      },
    ],
    task: "chat-reply-draft",
    temperature: 0.25,
  });

  return {
    draft: output.text.trim(),
    fallbackReason: output.fallbackReason,
    model: output.model,
    provider: output.provider,
  };
}
