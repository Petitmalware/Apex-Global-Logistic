import { NextResponse } from "next/server";

import { adminEmailComposerSchema } from "@/features/emails/schemas/email.schemas";
import { sendAdminEmail } from "@/features/emails/services/email.service";
import { AuthError } from "@/lib/auth/errors";
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

  try {
    const emailLog = await sendAdminEmail(parsed.data, user);

    return NextResponse.json({
      emailLog: {
        id: emailLog?.id,
        status: emailLog?.status,
      },
      message: "Email queued.",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Unable to send email." }, { status: 500 });
  }
}
