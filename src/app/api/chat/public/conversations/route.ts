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

    return NextResponse.json({
      conversation: conversation ?? {
        accessKey: started.accessKey,
        conversationId: started.conversationId,
        messages: started.initialMessages,
        status: started.status,
        subject: started.subject,
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ message: getDatabaseUnavailableMessage() }, { status: 503 });
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    console.error("Public chat start failed", {
      errorCode: typeof error === "object" && error !== null && "code" in error ? error.code : null,
      errorMessage: error instanceof Error ? error.message : "Unknown chat error",
      errorName: error instanceof Error ? error.name : typeof error,
    });

    return NextResponse.json(
      {
        message:
          "Chat could not be started because support is temporarily unavailable. Please try again or email support@apexgloballogistics.net.",
      },
      { status: 500 },
    );
  }
}
