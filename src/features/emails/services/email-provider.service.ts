import "server-only";

import { EmailProvider } from "@prisma/client";
import nodemailer from "nodemailer";

import { env } from "@/config/env.server";

type SendEmailInput = {
  html: string;
  recipientEmail: string;
  recipientName?: string | null;
  replyTo?: string | null;
  senderAddress?: string | null;
  senderName?: string | null;
  subject: string;
  text?: string | null;
};

type SendEmailResult = {
  messageId: string;
  provider: EmailProvider;
  response: Record<string, unknown>;
};

type SmtpError = {
  code?: string;
  command?: string;
  responseCode?: number;
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

function getSenderAddress(input?: SendEmailInput) {
  return (
    input?.senderAddress ||
    (env.EMAIL_PROVIDER === "smtp" && env.SMTP_FROM ? env.SMTP_FROM : env.EMAIL_FROM)
  );
}

function getConfiguredValue(value?: string) {
  const normalized = value?.trim();

  return normalized || undefined;
}

function getSmtpCredentials(senderAddress: string) {
  const supportUsername = getConfiguredValue(env.SUPPORT_SMTP_USERNAME);
  const supportPassword = getConfiguredValue(env.SUPPORT_SMTP_PASSWORD);
  const usesSupportMailbox =
    senderAddress.toLowerCase() === env.SUPPORT_EMAIL.toLowerCase() &&
    Boolean(supportUsername && supportPassword);

  return {
    pass: usesSupportMailbox ? supportPassword! : env.SMTP_PASSWORD!,
    user: usesSupportMailbox ? supportUsername! : env.SMTP_USERNAME!,
  };
}

function getSmtpFailureMessage(error: unknown) {
  const smtpError = error as SmtpError;

  if (smtpError.code === "EAUTH" || smtpError.responseCode === 535) {
    return "SMTP authentication failed. Confirm the configured mailbox username and password.";
  }

  if (["ECONNREFUSED", "ECONNRESET", "ESOCKET", "ETIMEDOUT"].includes(smtpError.code ?? "")) {
    return "SMTP connection failed. Confirm the SMTP host, port, TLS setting, and VPS network access.";
  }

  if (smtpError.code === "EENVELOPE" || smtpError.command === "MAIL FROM") {
    return "SMTP rejected the sender address. Use the configured mailbox or configure matching support mailbox credentials.";
  }

  return "SMTP delivery failed. Review the Email Studio log for the delivery status and try again.";
}

function createSmtpTransporter(senderAddress: string) {
  if (!env.SMTP_HOST || !env.SMTP_USERNAME || !env.SMTP_PASSWORD) {
    throw new Error("SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD must be configured.");
  }

  const port = env.SMTP_PORT ?? 587;

  return nodemailer.createTransport({
    auth: getSmtpCredentials(senderAddress),
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
}

async function sendWithResend(input: SendEmailInput): Promise<SendEmailResult> {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: getSenderAddress(input),
      html: input.html,
      reply_to: input.replyTo ?? env.SUPPORT_EMAIL,
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
      replyTo: {
        email: input.replyTo ?? env.SUPPORT_EMAIL,
      },
      sender: {
        email: getSenderAddress(input),
        name: input.senderName ?? "Apex Global Logistics",
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
  const senderAddress = getSenderAddress(input);
  const transporter = createSmtpTransporter(senderAddress);
  let info: Awaited<ReturnType<typeof transporter.sendMail>>;

  try {
    info = await transporter.sendMail({
      from: {
        address: senderAddress,
        name: input.senderName ?? "Apex Global Logistics",
      },
      html: input.html,
      replyTo: input.replyTo ?? env.SUPPORT_EMAIL,
      subject: input.subject,
      text: input.text ?? undefined,
      to: input.recipientName
        ? {
            address: input.recipientEmail,
            name: input.recipientName,
          }
        : input.recipientEmail,
    });
  } catch (error) {
    const smtpError = error as SmtpError;

    console.error("SMTP delivery failed", {
      code: smtpError.code ?? null,
      command: smtpError.command ?? null,
      responseCode: smtpError.responseCode ?? null,
    });
    throw new Error(getSmtpFailureMessage(error));
  }

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
      from: getSenderAddress(input),
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

export async function verifyConfiguredEmailProvider() {
  const provider = getConfiguredProvider();

  if (provider === EmailProvider.SMTP) {
    try {
      await createSmtpTransporter(getSenderAddress()).verify();
    } catch (error) {
      const smtpError = error as SmtpError;

      console.error("SMTP connection check failed", {
        code: smtpError.code ?? null,
        command: smtpError.command ?? null,
        responseCode: smtpError.responseCode ?? null,
      });
      throw new Error(getSmtpFailureMessage(error));
    }

    return {
      message: "SMTP connection confirmed. Send a test email to verify inbox delivery.",
      provider,
    };
  }

  if (provider === EmailProvider.CONSOLE) {
    return {
      message:
        "Email is in console mode. Configure SMTP, Resend, or Brevo before sending real email.",
      provider,
    };
  }

  return {
    message: `${provider} is configured. Send a test email to verify delivery.`,
    provider,
  };
}
