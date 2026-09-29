import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { AUTH_ROLES } from "@/lib/auth/constants";

export async function POST(request: NextRequest) {
  try {
    // Require admin or super-admin
    await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);

    const body = await request.json() as {
      to: string;
      subject: string;
      body: string;
      cc?: string;
      template?: string;
    };

    const { to, subject, body: emailBody, cc, template } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: to, subject, body" },
        { status: 400 }
      );
    }

    // Try to use existing email provider service
    let sent = false;
    let messageId = `admin-${Date.now()}`;

    try {
      // Dynamic import to avoid hard failure if service doesn't exist
      const emailService = await import("@/features/emails/services/email-provider.service");

      if (typeof emailService.sendCustomEmail === "function") {
        const result = await emailService.sendCustomEmail({
          to,
          subject,
          html: emailBody.replace(/\n/g, "<br>"),
          text: emailBody,
          cc: cc || undefined,
          metadata: { template: template || "custom", source: "admin-compose" },
        });
        messageId = result.messageId ?? messageId;
        sent = true;
      } else if (typeof emailService.sendEmail === "function") {
        await emailService.sendEmail({
          to,
          subject,
          html: emailBody.replace(/\n/g, "<br>"),
          text: emailBody,
        });
        sent = true;
      }
    } catch (_serviceError) {
      // Service not available — try nodemailer fallback
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST ?? "localhost",
          port: parseInt(process.env.SMTP_PORT ?? "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        });

        const info = await transporter.sendMail({
          from: process.env.FROM_EMAIL ?? `"Apex Global Logistics" <noreply@apexgloballogistics.com>`,
          to,
          cc: cc || undefined,
          subject,
          text: emailBody,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">${emailBody.replace(/\n/g, "<br>")}</div>`,
        });

        messageId = info.messageId ?? messageId;
        sent = true;
      } catch (nodemailerError) {
        console.error("[Admin Email] Both email service and nodemailer failed:", nodemailerError);
      }
    }

    if (!sent) {
      return NextResponse.json(
        { success: false, error: "Email service is not configured. Check SMTP settings in .env" },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error("[Admin Email API] Error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
