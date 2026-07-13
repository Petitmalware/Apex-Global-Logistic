import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { verifyPublicConversation } from "@/features/chat/services/chat.service";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getLocalStoragePath } from "@/lib/storage/local-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ChatAttachmentRouteContext = {
  params: Promise<{
    attachmentId: string;
    messageId: string;
  }>;
};

type StoredChatAttachment = {
  fileName: string;
  fileSizeBytes: number;
  id: string;
  mimeType: string;
  storageKey: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getStoredAttachment(
  metadata: Prisma.JsonValue | null,
  attachmentId: string,
): StoredChatAttachment | null {
  if (!isRecord(metadata) || !Array.isArray(metadata.attachments)) {
    return null;
  }

  for (const attachment of metadata.attachments) {
    if (!isRecord(attachment)) {
      continue;
    }

    if (
      attachment.id === attachmentId &&
      typeof attachment.fileName === "string" &&
      typeof attachment.fileSizeBytes === "number" &&
      typeof attachment.mimeType === "string" &&
      typeof attachment.storageKey === "string"
    ) {
      return {
        fileName: attachment.fileName,
        fileSizeBytes: attachment.fileSizeBytes,
        id: attachment.id,
        mimeType: attachment.mimeType,
        storageKey: attachment.storageKey,
      };
    }
  }

  return null;
}

async function canViewAttachment({
  accessKey,
  conversationId,
  customerId,
  organizationId,
}: {
  accessKey: string | null;
  conversationId: string;
  customerId: string | null;
  organizationId: string | null;
}) {
  if (accessKey) {
    await verifyPublicConversation(conversationId, accessKey);
    return true;
  }

  const user = await getCurrentSessionUser();

  if (!user) {
    return false;
  }

  if (customerId === user.id) {
    return true;
  }

  if (user.roles.includes(AUTH_ROLES.SUPER_ADMIN)) {
    return true;
  }

  return (
    user.roles.includes(AUTH_ROLES.ADMIN) &&
    Boolean(organizationId) &&
    organizationId === user.organizationId
  );
}

export async function GET(request: Request, { params }: ChatAttachmentRouteContext) {
  const { attachmentId, messageId } = await params;
  const message = await prisma.chatMessage.findUnique({
    include: {
      conversation: {
        select: {
          customerId: true,
          id: true,
          organizationId: true,
        },
      },
    },
    where: {
      id: messageId,
    },
  });

  if (!message || message.isInternal) {
    return NextResponse.json({ message: "Attachment not found." }, { status: 404 });
  }

  const attachment = getStoredAttachment(message.metadata, attachmentId);

  if (!attachment) {
    return NextResponse.json({ message: "Attachment not found." }, { status: 404 });
  }

  try {
    const allowed = await canViewAttachment({
      accessKey: new URL(request.url).searchParams.get("accessKey"),
      conversationId: message.conversation.id,
      customerId: message.conversation.customerId,
      organizationId: message.conversation.organizationId,
    });

    if (!allowed) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const file = await readFile(getLocalStoragePath(attachment.storageKey));

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="${attachment.fileName.replaceAll('"', "")}"`,
        "Content-Type": attachment.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ message: "Attachment not found." }, { status: 404 });
  }
}
