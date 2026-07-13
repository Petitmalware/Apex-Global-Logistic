import { NextResponse } from "next/server";

import { draftChatReply } from "@/features/chat/services/chat.service";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdminChatDraftContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function POST(_request: Request, { params }: AdminChatDraftContext) {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const { conversationId } = await params;

  return NextResponse.json(await draftChatReply(conversationId, user));
}
