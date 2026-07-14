import "server-only";

import { env } from "@/config/env.server";

export type RenderBrandedEmailInput = {
  contentHtml: string;
  preheader?: string | null;
  shipment?: {
    destinationCity?: string | null;
    estimatedDeliveryDate?: string | null;
    originCity?: string | null;
    shipmentNumber?: string | null;
    shipmentStatus?: string | null;
  } | null;
  subject: string;
  trackingNumber?: string | null;
};

export function getTrackingUrl(trackingNumber?: string | null) {
  return trackingNumber
    ? `${env.NEXT_PUBLIC_APP_URL}/tracking?reference=${encodeURIComponent(trackingNumber)}`
    : null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderShipmentCard(shipment: RenderBrandedEmailInput["shipment"]) {
  if (!shipment) {
    return "";
  }

  return `
    <div style="background:#f8fafc;border:1px solid #dce3ee;border-radius:8px;margin-top:24px;padding:18px;">
      <p style="color:#10243f;font-size:13px;font-weight:700;margin:0 0 10px;text-transform:uppercase;">Shipment information</p>
      <p style="color:#111827;font-size:14px;margin:0 0 6px;">Tracking: ${escapeHtml(shipment.shipmentNumber || "Not assigned")}</p>
      <p style="color:#111827;font-size:14px;margin:0 0 6px;">Status: ${escapeHtml(shipment.shipmentStatus || "Pending")}</p>
      <p style="color:#111827;font-size:14px;margin:0 0 6px;">Route: ${escapeHtml(shipment.originCity || "Origin")} to ${escapeHtml(shipment.destinationCity || "Destination")}</p>
      ${
        shipment.estimatedDeliveryDate
          ? `<p style="color:#111827;font-size:14px;margin:0;">Estimated delivery: ${escapeHtml(shipment.estimatedDeliveryDate)}</p>`
          : ""
      }
    </div>
  `;
}

function renderTrackingButton(trackingUrl: string | null) {
  if (!trackingUrl) {
    return "";
  }

  return `
    <a href="${escapeHtml(trackingUrl)}" style="background:#f59e0b;border-radius:6px;color:#111827;display:inline-block;font-size:14px;font-weight:700;margin-top:22px;padding:12px 18px;text-decoration:none;">
      Track shipment
    </a>
  `;
}

export function renderBrandedEmail(input: RenderBrandedEmailInput) {
  const subject = escapeHtml(input.subject);
  const preheader = escapeHtml(input.preheader || input.subject);
  const supportEmail = escapeHtml(env.SUPPORT_EMAIL);
  const supportPhone = escapeHtml(env.SUPPORT_PHONE);
  const supportContact = supportPhone ? `${supportEmail} or ${supportPhone}` : supportEmail;
  const trackingUrl = getTrackingUrl(input.trackingNumber);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;padding:32px 16px;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid #dce3ee;border-collapse:collapse;border-radius:10px;max-width:640px;overflow:hidden;">
            <tr>
              <td style="background:#10243f;padding:28px 32px;">
                <p style="color:#ffffff;font-size:14px;font-weight:700;letter-spacing:0;margin:0;">AG</p>
                <h1 style="color:#ffffff;font-size:24px;line-height:32px;margin:10px 0 0;">Apex Global Logistics</h1>
                <p style="color:#cbd5e1;font-size:14px;line-height:22px;margin:8px 0 0;">Premium logistics updates for parcel, pet, freight, and support operations.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <h2 style="color:#111827;font-size:20px;line-height:28px;margin:0 0 18px;">${subject}</h2>
                <div style="color:#111827;font-size:15px;line-height:25px;">${input.contentHtml}</div>
                ${renderShipmentCard(input.shipment)}
                ${renderTrackingButton(trackingUrl)}
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #dce3ee;padding:22px 32px;">
                <p style="color:#111827;font-size:14px;font-weight:700;margin:0 0 8px;">Need help?</p>
                <p style="color:#64748b;font-size:13px;line-height:21px;margin:0;">Contact Apex Global Logistics support at ${supportContact}. Our team is available for shipment, billing, freight, and pet transportation questions.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:18px 32px 24px;">
                <p style="color:#64748b;font-size:12px;line-height:19px;margin:0;">This message may contain confidential logistics, shipment, customer, or billing information. If you received it in error, please delete it and contact Apex Global Logistics support.</p>
                <p style="color:#64748b;font-size:12px;line-height:19px;margin:12px 0 0;">&copy; ${new Date().getFullYear()} Apex Global Logistics. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
