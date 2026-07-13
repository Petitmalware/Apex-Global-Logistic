import { NextResponse } from "next/server";

import { getPublicChatConversation } from "@/features/chat/queries/chat.queries";
import { getDatabaseUnavailableMessage, isDatabaseUnavailableError } from "@/lib/db-errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PublicChatConversationContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(request: Request, { params }: PublicChatConversationContext) {
  try {
    const { conversationId } = await params;
    const accessKey = new URL(request.url).searchParams.get("accessKey") ?? "";
    const conversation = await getPublicChatConversation({
      accessKey,
      conversationId,
    });

    if (!conversation) {
      return NextResponse.json({ message: "Chat conversation not found." }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ message: getDatabaseUnavailableMessage() }, { status: 503 });
    }

    return NextResponse.json({ message: "Chat could not be loaded." }, { status: 500 });
  }
}
