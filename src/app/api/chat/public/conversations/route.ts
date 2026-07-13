import { NextResponse } from "next/server";

import { startChatConversationSchema } from "@/features/chat/schemas/chat.schemas";
import { getPublicChatConversation } from "@/features/chat/queries/chat.queries";
import { startChatConversation } from "@/features/chat/services/chat.service";
import { AuthError } from "@/lib/auth/errors";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getDatabaseUnavailableMessage, isDatabaseUnavailableError } from "@/lib/db-errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
        email: getString(formData, "email"),
        message: getString(formData, "message"),
        name: getString(formData, "name"),
        phone: getString(formData, "phone"),
        subject: getString(formData, "subject"),
        trackingReference: getString(formData, "trackingReference"),
      },
    };
  }

  return {
    attachments: [],
    payload: await request.json().catch(() => ({})),
  };
}

export async function POST(request: Request) {
  try {
    const { attachments, payload } = await parseRequest(request);
    const parsed = startChatConversationSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          errors: parsed.error.flatten().fieldErrors,
          message: "Please complete the chat details.",
        },
        { status: 400 },
      );
    }

    const user = await getCurrentSessionUser();
    const started = await startChatConversation(parsed.data, user, { attachments });
    const conversation = await getPublicChatConversation({
      accessKey: started.accessKey,
      conversationId: started.conversationId,
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ message: getDatabaseUnavailableMessage() }, { status: 503 });
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Chat could not be started." }, { status: 500 });
  }
}
