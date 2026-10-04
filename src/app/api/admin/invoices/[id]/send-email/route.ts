import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

import { requireRole } from "@/lib/auth/session";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

// ─── HTML Invoice Generator ───────────────────────────────────────────────────
function buildInvoiceHtml(inv: {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string | null;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
  taxRate: number;
  notes: string | null;
  status: string;
  issuedAt: Date;
  dueAt: Date | null;
  currency: string;
}): string {
  const subtotal = inv.lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = subtotal * (inv.taxRate / 100);
  const total = subtotal + tax;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: inv.currency || "USD" }).format(n);

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const rows = inv.lineItems
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;">${item.description || "—"}</td>
      <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:center;font-size:14px;color:#6b7280;">${item.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;color:#6b7280;">${fmt(item.unitPrice)}</td>
      <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;font-weight:600;color:#1f2937;">${fmt(item.quantity * item.unitPrice)}</td>
    </tr>`,
    )
    .join("");

  const statusColor =
    inv.status === "PAID"
      ? "#16a34a"
      : inv.status === "OVERDUE"
        ? "#dc2626"
        : inv.status === "SENT"
          ? "#2563eb"
          : "#6b7280";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Invoice ${inv.invoiceNumber} – Apex Global Logistics</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0a0f1a,#1a2644);padding:36px 48px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-block;background:#f59e0b;width:36px;height:36px;border-radius:0 10px 0 10px;text-align:center;line-height:36px;font-size:18px;font-weight:800;color:#0a0f1a;vertical-align:middle;">A</div>
                  <span style="display:inline-block;vertical-align:middle;margin-left:10px;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.04em;">APEX GLOBAL LOGISTICS</span>
                </td>
                <td align="right">
                  <span style="background:${statusColor}22;color:${statusColor};padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">${inv.status}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Amount Hero -->
        <tr>
          <td style="background:#0a0f1a;padding:32px 48px 36px;text-align:center;border-bottom:3px solid #f59e0b;">
            <p style="margin:0 0 6px;color:#9ca3af;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">Amount Due</p>
            <p style="margin:0;color:#ffffff;font-size:44px;font-weight:800;letter-spacing:-0.02em;">${fmt(total)}</p>
            <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Invoice ${inv.invoiceNumber}${inv.dueAt ? ` &nbsp;·&nbsp; Due ${fmtDate(inv.dueAt)}` : ""}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 48px;">

            <!-- From / Bill To -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="width:50%;vertical-align:top;padding-right:16px;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;">From</p>
                  <p style="margin:0 0 2px;font-weight:700;color:#1f2937;">Apex Global Logistics</p>
                  <p style="margin:0 0 2px;font-size:13px;color:#6b7280;">info@apexgloballogistics.net</p>
                  <p style="margin:8px 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;">Invoice Date</p>
                  <p style="margin:0;font-size:13px;color:#374151;">${fmtDate(inv.issuedAt)}</p>
                </td>
                <td style="width:50%;vertical-align:top;padding-left:16px;border-left:2px solid #f3f4f6;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;">Bill To</p>
                  <p style="margin:0 0 2px;font-weight:700;color:#1f2937;">${inv.customerName}</p>
                  <p style="margin:0 0 2px;font-size:13px;color:#6b7280;">${inv.customerEmail}</p>
                  ${inv.billingAddress ? `<p style="margin:4px 0 0;font-size:12px;color:#9ca3af;white-space:pre-line;">${inv.billingAddress}</p>` : ""}
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;"/>

            <!-- Line Items -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <thead>
                <tr style="border-bottom:2px solid #1f2937;">
                  <th style="padding:8px 0 12px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">Description</th>
                  <th style="padding:8px 0 12px;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;width:48px;">Qty</th>
                  <th style="padding:8px 0 12px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;width:88px;">Unit Price</th>
                  <th style="padding:8px 0 12px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;width:88px;">Amount</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
              <tr>
                <td></td>
                <td style="width:200px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;">Subtotal</td>
                      <td style="padding:6px 0;font-size:13px;color:#374151;text-align:right;">${fmt(subtotal)}</td>
                    </tr>
                    ${inv.taxRate > 0 ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Tax (${inv.taxRate}%)</td><td style="padding:6px 0;font-size:13px;color:#374151;text-align:right;">${fmt(tax)}</td></tr>` : ""}
                    <tr style="border-top:2px solid #1f2937;">
                      <td style="padding:12px 0 4px;font-size:16px;font-weight:800;color:#0a0f1a;">Total</td>
                      <td style="padding:12px 0 4px;font-size:16px;font-weight:800;color:#0a0f1a;text-align:right;">${fmt(total)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            ${
              inv.notes
                ? `<!-- Notes -->
            <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-top:28px;border-left:3px solid #f59e0b;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;">Notes</p>
              <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;white-space:pre-line;">${inv.notes}</p>
            </div>`
                : ""
            }

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 48px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">Questions? Contact us at
              <a href="mailto:support@apexgloballogistics.net" style="color:#f59e0b;text-decoration:none;">support@apexgloballogistics.net</a>
            </p>
            <p style="margin:0;font-size:11px;color:#9ca3af;">Apex Global Logistics &nbsp;·&nbsp; apexgloballogistics.net &nbsp;·&nbsp; Official invoice — retain for your records.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Route ────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
    const { id } = await params;

    // Fetch invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId: user.organizationId ?? undefined,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Parse lineItems (stored as JSON in DB)
    let lineItems: Array<{ description: string; quantity: number; unitPrice: number }> = [];
    if (invoice.lineItems) {
      lineItems = typeof invoice.lineItems === "string" ? JSON.parse(invoice.lineItems) : (invoice.lineItems as typeof lineItems);
    }

    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      billingAddress: invoice.billingAddress,
      lineItems,
      taxRate: Number(invoice.taxRate ?? 0),
      notes: invoice.notes,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueAt: invoice.dueAt,
      currency: invoice.currency ?? "USD",
    };

    const html = buildInvoiceHtml(invoiceData);

    // Build transporter from env vars
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: Number(process.env.SMTP_PORT ?? 465) === 465,
      auth: {
        user: process.env.SMTP_USER ?? process.env.SUPPORT_EMAIL,
        pass: process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD,
      },
    });

    const fromAddress = `"Apex Global Logistics" <${process.env.SMTP_USER ?? process.env.SUPPORT_EMAIL ?? "info@apexgloballogistics.net"}>`;

    await transporter.sendMail({
      from: fromAddress,
      to: invoice.customerEmail,
      subject: `Invoice ${invoice.invoiceNumber} from Apex Global Logistics`,
      html,
      text: `Your invoice ${invoice.invoiceNumber} from Apex Global Logistics is attached. Please view this email in an HTML-capable email client for the full invoice details.`,
    });

    // Mark invoice as SENT if it was DRAFT
    if (invoice.status === "DRAFT") {
      await prisma.invoice.update({ where: { id }, data: { status: "SENT" } });
    }

    return NextResponse.json({ success: true, sentTo: invoice.customerEmail });
  } catch (error) {
    console.error("Invoice email send failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
