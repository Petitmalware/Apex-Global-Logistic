import { type NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";
import { sendEmailWithConfiguredProvider } from "@/features/emails/services/email-provider.service";
import { EmailLogStatus, EmailTemplateCategory } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentSessionUser();
    if (
      !user ||
      (!user.roles.includes(AUTH_ROLES.ADMIN) && !user.roles.includes(AUTH_ROLES.SUPER_ADMIN))
    ) {
      return NextResponse.json(
        { success: false, error: "Session expired or unauthorized. Please re-login." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      to?: string;
      subject?: string;
      body?: string;
      cc?: string;
      template?: string;
    };

    if (!body || !body.to || !body.subject || !body.body) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: to, subject, body" },
        { status: 400 },
      );
    }

    const recipientEmail = body.to.trim();
    const cleanSubject = body.subject.trim();
    const emailBody = body.body.trim();

    const formattedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${cleanSubject}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#0a0f1a,#1a2644);padding:28px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-block;background:#f59e0b;width:32px;height:32px;border-radius:0 8px 0 8px;text-align:center;line-height:32px;font-size:16px;font-weight:800;color:#0a0f1a;vertical-align:middle;">A</div>
                  <span style="display:inline-block;vertical-align:middle;margin-left:10px;color:#ffffff;font-size:16px;font-weight:700;letter-spacing:0.04em;">APEX GLOBAL LOGISTICS</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:36px;font-size:15px;line-height:1.7;color:#334155;">
            <h2 style="margin:0 0 16px;color:#0f172a;font-size:18px;font-weight:700;">${cleanSubject}</h2>
            <div style="white-space:pre-line;color:#334155;font-size:15px;line-height:1.7;">${emailBody}</div>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 36px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#64748b;">Apex Global Logistics · Premium Global Freight & Pet Transport</p>
            <p style="margin:0;font-size:11px;color:#94a3b8;">Official customer correspondence. For assistance, contact support@apexgloballogistics.net.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const parsedCc = body.cc
      ? body.cc
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : undefined;

    // Send using configured provider (SMTP, Resend, Brevo, etc.)
    const sendResult = await sendEmailWithConfiguredProvider({
      cc: parsedCc,
      html: formattedHtml,
      recipientEmail,
      senderName: "Apex Global Logistics",
      subject: cleanSubject,
      text: emailBody,
    });

    // Record in database email logs
    try {
      await prisma.emailLog.create({
        data: {
          bodyHtml: formattedHtml,
          bodyText: emailBody,
          category: EmailTemplateCategory.MANUAL,
          metadata: {
            cc: body.cc || null,
            source: "email-studio-quick-compose",
            template: body.template || "custom",
          },
          organizationId: user.organizationId,
          provider: sendResult.provider,
          providerMessageId: sendResult.messageId,
          recipientEmail,
          sentAt: new Date(),
          sentById: user.id,
          status: EmailLogStatus.SENT,
          subject: cleanSubject,
        },
      });
    } catch (logError) {
      console.warn("Could not log email to database:", logError);
    }

    return NextResponse.json({
      messageId: sendResult.messageId,
      provider: sendResult.provider,
      success: true,
    });
  } catch (error) {
    console.error("[Admin Send Email API] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
