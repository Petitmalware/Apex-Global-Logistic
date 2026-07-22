import { EmailLogStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { adminEmailTestSchema } from "@/features/emails/schemas/email.schemas";
import { sendAdminTestEmail } from "@/features/emails/services/email.service";
import { AuthError } from "@/lib/auth/errors";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requirePermission(PERMISSIONS.EMAILS_CREATE);
  const parsed = adminEmailTestSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json(
      {
        fieldErrors: parsed.error.flatten().fieldErrors,
        message: "Please review the test email details.",
      },
      { status: 400 },
    );
  }

  try {
    const emailLog = await sendAdminTestEmail(parsed.data, user);

    if (emailLog?.status === EmailLogStatus.FAILED) {
      return NextResponse.json(
        {
          emailLog: {
            id: emailLog.id,
            status: emailLog.status,
          },
          message:
            emailLog.failureReason ?? "Test email delivery failed. Review Email Studio logs.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      emailLog: {
        id: emailLog?.id,
        status: emailLog?.status,
      },
      message: "Test email sent.",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Unable to send test email." }, { status: 500 });
  }
}
