import { NextResponse } from "next/server";

import { aiImproveEmailSchema } from "@/features/emails/schemas/email.schemas";
import { htmlToPlainText } from "@/features/emails/services/email-sanitizer";
import { draftEmail } from "@/features/ai/services/ai-feature.service";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requirePermission(PERMISSIONS.EMAILS_CREATE);
  const parsed = aiImproveEmailSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Add rough text before using AI assist." },
      { status: 400 },
    );
  }
  const roughText = htmlToPlainText(parsed.data.bodyHtml);

  if (!roughText) {
    return NextResponse.json(
      { message: "Add rough text before using AI assist." },
      { status: 400 },
    );
  }

  const draft = await draftEmail(
    {
      roughText,
      tone: "professional",
    },
    user,
  );

  return NextResponse.json({
    bodyHtml: draft.bodyHtml,
    conversationId: draft.conversationId,
    mode: draft.provider,
  });
}
