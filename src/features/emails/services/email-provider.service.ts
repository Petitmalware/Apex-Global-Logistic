import "server-only";

import { EmailProvider } from "@prisma/client";
import nodemailer from "nodemailer";

import { env } from "@/config/env.server";

type SendEmailInput = {
  html: string;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  text?: string | null;
};

type SendEmailResult = {
  messageId: string;
  provider: EmailProvider;
  response: Record<string, unknown>;
};

function getConfiguredProvider() {
  if (env.EMAIL_PROVIDER === "resend") {
    return EmailProvider.RESEND;
  }

  if (env.EMAIL_PROVIDER === "brevo") {
    return EmailProvider.BREVO;
  }

  if (env.EMAIL_PROVIDER === "smtp") {
    return EmailProvider.SMTP;
  }

  return EmailProvider.CONSOLE;
}

function getSenderAddress() {
  return env.EMAIL_PROVIDER === "smtp" && env.SMTP_FROM ? env.SMTP_FROM : env.EMAIL_FROM;
}

async function sendWithResend(input: SendEmailInput): Promise<SendEmailResult> {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      html: input.html,
      subject: input.subject,
      text: input.text ?? undefined,
      to: [
        input.recipientName
          ? `${input.recipientName} <${input.recipientEmail}>`
          : input.recipientEmail,
      ],
    }),
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(`Resend rejected the email with status ${response.status}.`);
  }

  return {
    messageId: typeof payload.id === "string" ? payload.id : `resend-${Date.now()}`,
    provider: EmailProvider.RESEND,
    response: payload,
  };
}

async function sendWithBrevo(input: SendEmailInput): Promise<SendEmailResult> {
  if (!env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    body: JSON.stringify({
      htmlContent: input.html,
      sender: {
        email: env.EMAIL_FROM,
        name: "Apex Global Logistics",
      },
      subject: input.subject,
      textContent: input.text ?? undefined,
      to: [
        {
          email: input.recipientEmail,
          name: input.recipientName ?? undefined,
        },
      ],
    }),
    headers: {
      "Content-Type": "application/json",
      "api-key": env.BREVO_API_KEY,
    },
    method: "POST",
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(`Brevo rejected the email with status ${response.status}.`);
  }

  return {
    messageId: typeof payload.messageId === "string" ? payload.messageId : `brevo-${Date.now()}`,
    provider: EmailProvider.BREVO,
    response: payload,
  };
}

async function sendWithSmtp(input: SendEmailInput): Promise<SendEmailResult> {
  if (!env.SMTP_HOST || !env.SMTP_USERNAME || !env.SMTP_PASSWORD) {
    throw new Error("SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD must be configured.");
  }

  const port = env.SMTP_PORT ?? 587;
  const transporter = nodemailer.createTransport({
    auth: {
      pass: env.SMTP_PASSWORD,
      user: env.SMTP_USERNAME,
    },
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    socketTimeout: 60_000,
    tls: {
      rejectUnauthorized: true,
    },
  });
  const info = await transporter.sendMail({
    from: {
      address: getSenderAddress(),
      name: "Apex Global Logistics",
    },
    html: input.html,
    subject: input.subject,
    text: input.text ?? undefined,
    to: input.recipientName
      ? {
          address: input.recipientEmail,
          name: input.recipientName,
        }
      : input.recipientEmail,
  });

  return {
    messageId: info.messageId || `smtp-${Date.now()}`,
    provider: EmailProvider.SMTP,
    response: {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    },
  };
}

async function sendWithConsole(input: SendEmailInput): Promise<SendEmailResult> {
  return {
    messageId: `console-${Date.now()}`,
    provider: EmailProvider.CONSOLE,
    response: {
      from: getSenderAddress(),
      to: input.recipientEmail,
      transport: "console",
    },
  };
}

export async function sendEmailWithConfiguredProvider(input: SendEmailInput) {
  const provider = getConfiguredProvider();

  if (provider === EmailProvider.RESEND) {
    return sendWithResend(input);
  }

  if (provider === EmailProvider.BREVO) {
    return sendWithBrevo(input);
  }

  if (provider === EmailProvider.SMTP) {
    return sendWithSmtp(input);
  }

  return sendWithConsole(input);
}
