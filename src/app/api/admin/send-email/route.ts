import { EmailProvider } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendEmailWithConfiguredProvider } from "@/features/emails/services/email-provider.service";
import { requireRole } from "@/lib/auth/session";
import { AUTH_ROLES } from "@/lib/auth/constants";

const messageSchema = z.object({
  to: z.string().trim().email(),
  subject: z.string().trim().min(1).max(255),
  body: z.string().trim().min(1),
  cc: z.string().optional().transform(value =>
    (value ?? "").split(",").map(address => address.trim()).filter(Boolean)
  ).pipe(z.array(z.string().email())),
});

export async function POST(request: NextRequest) {
  await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Check the recipient, CC addresses, subject, and message." },
      { status: 400 },
    );
  }

  const { to, subject, body, cc } = parsed.data;
  const html = body.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!).replace(/\n/g, "<br>");

  try {
    const result = await sendEmailWithConfiguredProvider({
      recipientEmail: to, subject, text: body, html, cc,
    });

    if (result.provider === EmailProvider.CONSOLE) {
      return NextResponse.json(
        { success: false, error: "Email delivery is not configured. Check the email provider settings." },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error("[Admin Email API] Delivery failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { success: false, error: "Email delivery failed. Check the email provider settings." },
      { status: 502 },
    );
  }
}
