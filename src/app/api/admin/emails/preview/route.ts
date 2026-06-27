import { NextResponse } from "next/server";

import { adminEmailComposerSchema } from "@/features/emails/schemas/email.schemas";
import { previewAdminEmail } from "@/features/emails/services/email.service";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requirePermission(PERMISSIONS.EMAILS_CREATE);
  const parsed = adminEmailComposerSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json(
      {
        fieldErrors: parsed.error.flatten().fieldErrors,
        message: "Please review the email details.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    preview: await previewAdminEmail(parsed.data, user),
  });
}
