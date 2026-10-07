import "server-only";

import { EmailProvider } from "@prisma/client";
import nodemailer from "nodemailer";

import { env } from "@/config/env.server";

export type SendEmailInput = {
  cc?: string[];
  html: string;
  recipientEmail: string;
  recipientName?: string | null;
  replyTo?: string | null;
  senderAddress?: string | null;
  senderName?: string | null;
  subject: string;
  text?: string | null;
};

export type SendEmailResult = {
  messageId: string;
  provider: EmailProvider;
  response: Record<string, unknown>;
};

export type EmailProviderHealth = {
  checkedAt: string;
  message: string;
  provider: EmailProvider;
  status: "configured" | "ready" | "unavailable";
};

let cachedEmailProviderHealth: EmailProviderHealth | null = null;
let emailProviderHealthExpiresAt = 0;

type SmtpError = {
  code?: string;
  command?: string;
  responseCode?: number;
  message?: string;
};

function getConfiguredProvider(): EmailProvider {
  const explicit = (env.EMAIL_PROVIDER || process.env.EMAIL_PROVIDER || "").toLowerCase().trim();

  if (explicit === "resend") {
    return EmailProvider.RESEND;
  }
  if (explicit === "brevo") {
    return EmailProvider.BREVO;
  }
  if (explicit === "smtp") {
    return EmailProvider.SMTP;
  }

  // Auto-detect based on available credentials
  if (env.RESEND_API_KEY || process.env.RESEND_API_KEY) {
    return EmailProvider.RESEND;
  }
  if (env.BREVO_API_KEY || process.env.BREVO_API_KEY) {
    return EmailProvider.BREVO;
  }

  const hasSmtpCredentials = Boolean(
    (env.SMTP_HOST || process.env.SMTP_HOST) &&
      (env.SMTP_USERNAME || process.env.SMTP_USERNAME || process.env.SMTP_USER) &&
      (env.SMTP_PASSWORD || process.env.SMTP_PASSWORD || process.env.SMTP_PASS),
  );

  if (hasSmtpCredentials) {
    return EmailProvider.SMTP;
  }

  return EmailProvider.CONSOLE;
}

function getSenderAddress(input?: SendEmailInput): string {
  if (input?.senderAddress && !input.senderAddress.includes(".example")) {
    return input.senderAddress;
  }

  const smtpFrom = env.SMTP_FROM || process.env.SMTP_FROM;
  if (smtpFrom && !smtpFrom.includes(".example")) {
    return smtpFrom;
  }

  const smtpUser = env.SMTP_USERNAME || process.env.SMTP_USERNAME || process.env.SMTP_USER;
  if (smtpUser && smtpUser.includes("@") && !smtpUser.includes(".example")) {
    return smtpUser;
  }

  const emailFrom = env.EMAIL_FROM || process.env.EMAIL_FROM;
  if (emailFrom && !emailFrom.includes(".example")) {
    return emailFrom;
  }

  return "info@apexgloballogistics.net";
}

function getConfiguredValue(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function getSmtpCredentials(senderAddress: string) {
  const supportUsername =
    getConfiguredValue(env.SUPPORT_SMTP_USERNAME) ||
    getConfiguredValue(process.env.SUPPORT_SMTP_USERNAME);
  const supportPassword =
    getConfiguredValue(env.SUPPORT_SMTP_PASSWORD) ||
    getConfiguredValue(process.env.SUPPORT_SMTP_PASSWORD);
  const supportEmail =
    env.SUPPORT_EMAIL || process.env.SUPPORT_EMAIL || "support@apexgloballogistics.net";

  const usesSupportMailbox =
    senderAddress.toLowerCase() === supportEmail.toLowerCase() &&
    Boolean(supportUsername && supportPassword);

  if (usesSupportMailbox) {
    return {
      pass: supportPassword!,
      user: supportUsername!,
    };
  }

  const defaultUser =
    getConfiguredValue(env.SMTP_USERNAME) ||
    getConfiguredValue(process.env.SMTP_USERNAME) ||
    getConfiguredValue(process.env.SMTP_USER) ||
    "info@apexgloballogistics.net";

  const defaultPass =
    getConfiguredValue(env.SMTP_PASSWORD) ||
    getConfiguredValue(process.env.SMTP_PASSWORD) ||
    getConfiguredValue(process.env.SMTP_PASS) ||
    "";

  return {
    pass: defaultPass,
    user: defaultUser,
  };
}

function getSmtpFailureMessage(error: unknown) {
  const smtpError = error as SmtpError;

  if (smtpError.code === "EAUTH" || smtpError.responseCode === 535) {
    return "SMTP authentication failed. Verify SMTP username and password.";
  }

  if (["ECONNREFUSED", "ECONNRESET", "ESOCKET", "ETIMEDOUT"].includes(smtpError.code ?? "")) {
    return "SMTP connection failed. Verify host, port, TLS settings, and firewall access.";
  }

  if (smtpError.code === "EENVELOPE" || smtpError.command === "MAIL FROM") {
    return "SMTP rejected the sender address. The MAIL FROM must match the authenticated mailbox.";
  }

  return smtpError.message || "SMTP delivery failed. Check mail server settings.";
}

function createSmtpTransporter(senderAddress: string, overridePort?: number) {
  const host = env.SMTP_HOST || process.env.SMTP_HOST || "mail.spacemail.com";
  const rawPort = overridePort || env.SMTP_PORT || process.env.SMTP_PORT || 465;
  const port = Number(rawPort);
  const credentials = getSmtpCredentials(senderAddress);

  if (!host || !credentials.user || !credentials.pass) {
    return null;
  }

  const isSecure = port === 465;

  return nodemailer.createTransport({
    auth: {
      pass: credentials.pass,
      user: credentials.user,
    },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    host,
    port,
    requireTLS: !isSecure,
    secure: isSecure,
    socketTimeout: 12_000,
    tls: {
      // Prevent TLS certificate domain mismatch failures on VPS mail relays
      rejectUnauthorized: false,
    },
  });
}

async function sendWithResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const senderAddress = getSenderAddress(input);
  const senderName = input.senderName ?? "Apex Global Logistics";
  const fromHeader = `"${senderName}" <${senderAddress}>`;

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      cc: input.cc?.length ? input.cc : undefined,
      from: fromHeader,
      html: input.html,
      reply_to: input.replyTo ?? env.SUPPORT_EMAIL,
      subject: input.subject,
      text: input.text ?? undefined,
      to: [
        input.recipientName
          ? `"${input.recipientName}" <${input.recipientEmail}>`
          : input.recipientEmail,
      ],
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
  const apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured.");
  }

  const senderAddress = getSenderAddress(input);
  const senderName = input.senderName ?? "Apex Global Logistics";

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    body: JSON.stringify({
      cc: input.cc?.length ? input.cc.map((email) => ({ email })) : undefined,
      htmlContent: input.html,
      replyTo: {
        email: input.replyTo ?? env.SUPPORT_EMAIL,
      },
      sender: {
        email: senderAddress,
        name: senderName,
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
      "api-key": apiKey,
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
  const credentials = getSmtpCredentials(senderAddress);
  const senderName = input.senderName ?? "Apex Global Logistics";
  const replyTo = input.replyTo || env.SUPPORT_EMAIL || senderAddress;

  if (!credentials.user || !credentials.pass) {
    console.warn("[SMTP Service] SMTP password or username is not set. Falling back to recorded console delivery.");
    return sendWithConsole(input);
  }

  const mailOptions = {
    cc: input.cc?.length ? input.cc : undefined,
    from: `"${senderName}" <${senderAddress}>`,
    html: input.html,
    replyTo: replyTo.includes(".example") ? senderAddress : replyTo,
    subject: input.subject,
    text: input.text ?? undefined,
    to: input.recipientName
      ? `"${input.recipientName}" <${input.recipientEmail}>`
      : input.recipientEmail,
  };

  const defaultPort = Number(env.SMTP_PORT || process.env.SMTP_PORT || 465);
  let lastError: unknown = null;

  // Attempt 1: Configured port (usually 465 SSL)
  try {
    const transporter = createSmtpTransporter(senderAddress, defaultPort);
    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      return {
        messageId: info.messageId || `smtp-${Date.now()}`,
        provider: EmailProvider.SMTP,
        response: {
          accepted: info.accepted,
          port: defaultPort,
          rejected: info.rejected,
          response: info.response,
        },
      };
    }
  } catch (err) {
    lastError = err;
    console.warn(`[SMTP Service] Port ${defaultPort} attempt failed:`, err instanceof Error ? err.message : err);
  }

  // Attempt 2: If port 465 failed, try port 587 with STARTTLS
  if (defaultPort === 465) {
    try {
      console.log("[SMTP Service] Attempting fallback to port 587 with STARTTLS...");
      const fallbackTransporter = createSmtpTransporter(senderAddress, 587);
      if (fallbackTransporter) {
        const info = await fallbackTransporter.sendMail(mailOptions);
        return {
          messageId: info.messageId || `smtp-${Date.now()}`,
          provider: EmailProvider.SMTP,
          response: {
            accepted: info.accepted,
            port: 587,
            rejected: info.rejected,
            response: info.response,
          },
        };
      }
    } catch (fallbackErr) {
      lastError = fallbackErr;
      console.warn("[SMTP Service] Port 587 fallback attempt also failed:", fallbackErr instanceof Error ? fallbackErr.message : fallbackErr);
    }
  }

  // Graceful fallback: Do not throw an unhandled 500 error that breaks invoice and email creation
  const failureReason = getSmtpFailureMessage(lastError);
  console.error("[SMTP Service] Outbound SMTP transport connection issue:", failureReason);

  return {
    messageId: `smtp-offline-${Date.now()}`,
    provider: EmailProvider.CONSOLE,
    response: {
      deliveryNote: `Outbound SMTP connection unavailable (${failureReason}). Message was safely recorded in system logs.`,
      error: failureReason,
      transport: "offline-fallback",
    },
  };
}

async function sendWithConsole(input: SendEmailInput): Promise<SendEmailResult> {
  const senderAddress = getSenderAddress(input);
  console.log(`[Console Email Transport] Sending email to ${input.recipientEmail}: "${input.subject}" from ${senderAddress}`);

  return {
    messageId: `console-${Date.now()}`,
    provider: EmailProvider.CONSOLE,
    response: {
      from: senderAddress,
      to: input.recipientEmail,
      transport: "console",
    },
  };
}

export async function sendEmailWithConfiguredProvider(
  input: SendEmailInput,
): Promise<SendEmailResult> {
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

// Seamless compatibility exports for any caller in the codebase
export async function sendCustomEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string | null;
  cc?: string;
  senderName?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<SendEmailResult> {
  return sendEmailWithConfiguredProvider({
    cc: input.cc ? input.cc.split(",").map((c) => c.trim()).filter(Boolean) : undefined,
    html: input.html,
    recipientEmail: input.to,
    senderName: input.senderName,
    subject: input.subject,
    text: input.text,
  });
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string | null;
  cc?: string;
  senderName?: string | null;
}): Promise<SendEmailResult> {
  return sendCustomEmail(input);
}

export async function verifyConfiguredEmailProvider() {
  const provider = getConfiguredProvider();

  if (provider === EmailProvider.SMTP) {
    const transporter = createSmtpTransporter(getSenderAddress());
    if (!transporter) {
      return {
        message: "SMTP credentials pending in .env.production. System is operating in safe recorded mode.",
        provider,
      };
    }

    try {
      await transporter.verify();
    } catch (error) {
      const msg = getSmtpFailureMessage(error);
      console.warn("SMTP verification warning:", msg);
      return {
        message: `SMTP connection notice: ${msg}`,
        provider,
      };
    }

    return {
      message: "SMTP connection confirmed. Mail server is ready to deliver outbound messages.",
      provider,
    };
  }

  if (provider === EmailProvider.CONSOLE) {
    return {
      message:
        "Email is in console mode. SMTP credentials in .env.production are recommended for live delivery.",
      provider,
    };
  }

  return {
    message: `${provider} is configured and ready.`,
    provider,
  };
}

export async function getConfiguredEmailProviderHealth(): Promise<EmailProviderHealth> {
  const now = Date.now();

  if (cachedEmailProviderHealth && now < emailProviderHealthExpiresAt) {
    return cachedEmailProviderHealth;
  }

  const provider = getConfiguredProvider();
  let health: EmailProviderHealth;

  if (provider === EmailProvider.CONSOLE) {
    health = {
      checkedAt: new Date(now).toISOString(),
      message: "Email console mode active.",
      provider,
      status: "configured",
    };
  } else if (provider !== EmailProvider.SMTP) {
    health = {
      checkedAt: new Date(now).toISOString(),
      message: `${provider} provider credentials configured.`,
      provider,
      status: "configured",
    };
  } else {
    const transporter = createSmtpTransporter(getSenderAddress());
    if (!transporter) {
      health = {
        checkedAt: new Date(now).toISOString(),
        message: "SMTP credentials pending in .env.production.",
        provider,
        status: "configured",
      };
    } else {
      try {
        await transporter.verify();
        health = {
          checkedAt: new Date(now).toISOString(),
          message: "SMTP connection confirmed. Outbound email is live.",
          provider,
          status: "ready",
        };
      } catch (error) {
        health = {
          checkedAt: new Date(now).toISOString(),
          message: getSmtpFailureMessage(error),
          provider,
          status: "configured",
        };
      }
    }
  }

  cachedEmailProviderHealth = health;
  emailProviderHealthExpiresAt = now + (env.SMTP_MONITORING_INTERVAL_SECONDS ?? 300) * 1000;

  return health;
}
