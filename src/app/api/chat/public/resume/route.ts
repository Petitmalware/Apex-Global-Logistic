import { NextResponse } from "next/server";

import { getPublicChatConversation } from "@/features/chat/queries/chat.queries";
import { resumeChatConversationSchema } from "@/features/chat/schemas/chat.schemas";
import { resumePublicChatConversation } from "@/features/chat/services/chat.service";
import { AuthError } from "@/lib/auth/errors";
import { getDatabaseUnavailableMessage, isDatabaseUnavailableError } from "@/lib/db-errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const parsed = resumeChatConversationSchema.safeParse(
      await request.json().catch(() => ({})),
    );

    if (!parsed.success) {
      return NextResponse.json({ message: "The chat resume link is invalid." }, { status: 400 });
    }

    const resumed = await resumePublicChatConversation(parsed.data);
    const conversation = await getPublicChatConversation({
      accessKey: resumed.accessKey,
      conversationId: resumed.conversationId,
    });

    if (!conversation) {
      return NextResponse.json({ message: "Chat conversation not found." }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ message: getDatabaseUnavailableMessage() }, { status: 503 });
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Chat could not be resumed." }, { status: 500 });
  }
}
