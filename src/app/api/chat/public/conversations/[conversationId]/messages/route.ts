import { NextResponse } from "next/server";

import { publicChatMessageSchema } from "@/features/chat/schemas/chat.schemas";
import { addPublicChatMessage } from "@/features/chat/services/chat.service";
import { getPublicChatConversation } from "@/features/chat/queries/chat.queries";
import { AuthError } from "@/lib/auth/errors";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getDatabaseUnavailableMessage, isDatabaseUnavailableError } from "@/lib/db-errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PublicChatMessageContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getFiles(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is File => value instanceof File);
}

async function parseRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();

    return {
      attachments: getFiles(formData, "attachments"),
      payload: {
        accessKey: getString(formData, "accessKey"),
        body: getString(formData, "body"),
      },
    };
  }

  return {
    attachments: [],
    payload: await request.json().catch(() => ({})),
  };
}

export async function POST(request: Request, { params }: PublicChatMessageContext) {
  try {
    const { conversationId } = await params;
    const { attachments, payload } = await parseRequest(request);
    const parsed = publicChatMessageSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          errors: parsed.error.flatten().fieldErrors,
          message: "Please enter a message.",
        },
        { status: 400 },
      );
    }

    const user = await getCurrentSessionUser();

    await addPublicChatMessage(conversationId, parsed.data, { attachments }, user);

    return NextResponse.json({
      conversation: await getPublicChatConversation({
        accessKey: parsed.data.accessKey,
        conversationId,
      }),
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ message: getDatabaseUnavailableMessage() }, { status: 503 });
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Message could not be sent." }, { status: 500 });
  }
}
