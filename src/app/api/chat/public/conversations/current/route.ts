import { NextResponse } from "next/server";

import { getPublicChatConversation } from "@/features/chat/queries/chat.queries";
import { resumeCurrentAuthenticatedChat } from "@/features/chat/services/chat.service";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getDatabaseUnavailableMessage, isDatabaseUnavailableError } from "@/lib/db-errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json({ conversation: null });
    }

    const resumed = await resumeCurrentAuthenticatedChat(user);

    if (!resumed) {
      return NextResponse.json({ conversation: null });
    }

    const conversation = await getPublicChatConversation({
      accessKey: resumed.accessKey,
      conversationId: resumed.conversationId,
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ message: getDatabaseUnavailableMessage() }, { status: 503 });
    }

    return NextResponse.json({ message: "Chat could not be loaded." }, { status: 500 });
  }
}
