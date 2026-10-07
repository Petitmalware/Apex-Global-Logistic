import { siteConfig } from "@/config/site";
import { formatShipmentStatus } from "@/features/shipments/status-labels";
import type { ShipmentStatus } from "@prisma/client";

export type ThermalReceiptEmailData = {
  shipmentNumber: string;
  referenceNumber?: string | null;
  status: string;
  serviceLevel?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
  packageCount?: number;
  totalWeightLb?: string | number | null;
  currentLocation?: string | null;
  origin: {
    name?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    countryCode?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  destination: {
    name?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    countryCode?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  packages?: Array<{
    packageNumber?: string | null;
    type?: string | null;
    description?: string | null;
    weightLb?: string | number | null;
  }>;
  notes?: string | null;
  companyName?: string;
  companyAddress?: string[];
  companyEmail?: string;
  companyPhone?: string;
  trackingUrl?: string;
};

export function buildThermalReceiptHtml(data: ThermalReceiptEmailData): string {
  const companyName = data.companyName || siteConfig.name;
  const companyEmail = data.companyEmail || siteConfig.emails.support;
  const companyPhone = data.companyPhone || siteConfig.phone || "";
  const companyAddress = data.companyAddress || [
    "World Cargo Center, Suite 400",
    "New York, NY 10001, USA",
  ];

  const trackingUrl =
    data.trackingUrl ||
    `${siteConfig.url || "https://apexgloballogistics.net"}/tracking?q=${encodeURIComponent(data.shipmentNumber)}`;

  const fmtDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formattedStatus = formatShipmentStatus(data.status as ShipmentStatus);

  const statusBg =
    data.status === "DELIVERED"
      ? "#15803d"
      : data.status === "CANCELLED" || data.status === "RETURNED"
        ? "#b91c1c"
        : data.status === "HELD" || data.status === "DELAYED"
          ? "#b45309"
          : "#0f172a";

  const originLocality = [data.origin.city, data.origin.state, data.origin.postalCode]
    .filter(Boolean)
    .join(", ");

  const destLocality = [data.destination.city, data.destination.state, data.destination.postalCode]
    .filter(Boolean)
    .join(", ");

  const packageRows = (data.packages || []).map((pkg, idx) => `
    <tr>
      <td style="padding:4px 0;font-size:12px;color:#1e293b;border-bottom:1px dashed #e2e8f0;">
        <strong>#${pkg.packageNumber || idx + 1}</strong> &ndash; ${pkg.description || pkg.type || "Parcel Piece"}
      </td>
      <td style="padding:4px 0;text-align:right;font-size:12px;color:#475569;border-bottom:1px dashed #e2e8f0;">
        ${pkg.weightLb ? `${pkg.weightLb} lb` : "Standard"}
      </td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Shipping Receipt &ndash; ${data.shipmentNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Courier New',Courier,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;-webkit-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Thermal Receipt Container -->
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.35);border:1px solid #cbd5e1;">

          <!-- Top Decorative Header Bar -->
          <tr>
            <td style="background-color:#0f172a;padding:12px 24px;text-align:center;">
              <span style="display:inline-block;background-color:#f59e0b;color:#0f172a;font-weight:900;font-size:13px;padding:3px 10px;border-radius:4px;letter-spacing:0.1em;text-transform:uppercase;">
                APEX GLOBAL LOGISTICS
              </span>
            </td>
          </tr>

          <!-- Receipt Sheet Body -->
          <tr>
            <td style="padding:28px 28px 20px 28px;">

              <!-- Header Info -->
              <div style="text-align:center;margin-bottom:16px;">
                <p style="margin:0;font-size:16px;font-weight:900;color:#0f172a;letter-spacing:0.04em;text-transform:uppercase;">
                  ${companyName}
                </p>
                ${companyAddress.map((a) => `<p style="margin:2px 0 0;font-size:11px;color:#64748b;">${a}</p>`).join("")}
                <p style="margin:3px 0 0;font-size:11px;color:#64748b;">
                  ${companyEmail}${companyPhone ? ` &bull; ${companyPhone}` : ""}
                </p>
              </div>

              <!-- Perforated Line -->
              <div style="border-top:2px dashed #94a3b8;margin:14px 0;"></div>

              <!-- Receipt Title & Status -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;font-weight:900;color:#0f172a;letter-spacing:0.06em;text-transform:uppercase;">
                      OFFICIAL SHIPPING RECEIPT
                    </p>
                    <p style="margin:2px 0 0;font-size:11px;color:#64748b;">
                      RCT-${data.shipmentNumber}
                    </p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background-color:${statusBg};color:#ffffff;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                      ${formattedStatus}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Stylized Barcode Block -->
              <div style="text-align:center;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 8px;margin:16px 0;">
                <div style="font-family:'Courier New',Courier,monospace;font-size:16px;letter-spacing:3px;font-weight:bold;color:#0f172a;line-height:1;user-select:none;">
                  ||||&nbsp;|&nbsp;|||||&nbsp;||&nbsp;||||||&nbsp;|&nbsp;|||&nbsp;|||||||&nbsp;||
                </div>
                <div style="margin-top:6px;font-size:14px;font-weight:900;letter-spacing:0.12em;color:#0f172a;">
                  ${data.shipmentNumber}
                </div>
              </div>

              <!-- Metadata Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;font-size:12px;line-height:1.6;">
                <tr>
                  <td style="color:#64748b;width:40%;">Date Issued:</td>
                  <td style="color:#0f172a;font-weight:600;text-align:right;">${fmtDate(data.createdAt)}</td>
                </tr>
                ${data.referenceNumber ? `
                <tr>
                  <td style="color:#64748b;">Customer Ref:</td>
                  <td style="color:#0f172a;font-weight:600;text-align:right;">${data.referenceNumber}</td>
                </tr>` : ""}
                <tr>
                  <td style="color:#64748b;">Service Level:</td>
                  <td style="color:#0f172a;font-weight:600;text-align:right;">${data.serviceLevel || "Express Priority"}</td>
                </tr>
                <tr>
                  <td style="color:#64748b;">Total Pieces:</td>
                  <td style="color:#0f172a;font-weight:600;text-align:right;">${data.packageCount || 1} piece(s)</td>
                </tr>
                <tr>
                  <td style="color:#64748b;">Chargeable Weight:</td>
                  <td style="color:#0f172a;font-weight:600;text-align:right;">${data.totalWeightLb ? `${data.totalWeightLb} lb` : "Calculated"}</td>
                </tr>
                ${data.currentLocation ? `
                <tr>
                  <td style="color:#64748b;">Current Location:</td>
                  <td style="color:#0f172a;font-weight:600;text-align:right;">${data.currentLocation}</td>
                </tr>` : ""}
              </table>

              <!-- Perforated Line -->
              <div style="border-top:2px dashed #94a3b8;margin:14px 0;"></div>

              <!-- Shipper Section -->
              <div style="margin-bottom:12px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:900;color:#0f172a;letter-spacing:0.08em;text-transform:uppercase;">
                  [SENDER / ORIGIN]
                </p>
                <div style="font-size:12px;color:#334155;line-height:1.5;">
                  ${data.origin.name ? `<strong>${data.origin.name}</strong><br/>` : ""}
                  ${data.origin.line1 ? `${data.origin.line1}<br/>` : ""}
                  ${data.origin.line2 ? `${data.origin.line2}<br/>` : ""}
                  ${originLocality ? `${originLocality}<br/>` : ""}
                  ${data.origin.countryCode ? `${data.origin.countryCode}<br/>` : ""}
                  ${data.origin.phone ? `Tel: ${data.origin.phone}<br/>` : ""}
                  ${data.origin.email ? `Email: ${data.origin.email}` : ""}
                </div>
              </div>

              <!-- Perforated Line -->
              <div style="border-top:2px dashed #94a3b8;margin:14px 0;"></div>

              <!-- Recipient Section -->
              <div style="margin-bottom:12px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:900;color:#0f172a;letter-spacing:0.08em;text-transform:uppercase;">
                  [RECIPIENT / DESTINATION]
                </p>
                <div style="font-size:12px;color:#334155;line-height:1.5;">
                  ${data.destination.name ? `<strong>${data.destination.name}</strong><br/>` : ""}
                  ${data.destination.line1 ? `${data.destination.line1}<br/>` : ""}
                  ${data.destination.line2 ? `${data.destination.line2}<br/>` : ""}
                  ${destLocality ? `${destLocality}<br/>` : ""}
                  ${data.destination.countryCode ? `${data.destination.countryCode}<br/>` : ""}
                  ${data.destination.phone ? `Tel: ${data.destination.phone}<br/>` : ""}
                  ${data.destination.email ? `Email: ${data.destination.email}` : ""}
                </div>
              </div>

              <!-- Package Breakdown if present -->
              ${packageRows ? `
              <div style="border-top:2px dashed #94a3b8;margin:14px 0;"></div>
              <div>
                <p style="margin:0 0 6px;font-size:11px;font-weight:900;color:#0f172a;letter-spacing:0.08em;text-transform:uppercase;">
                  [PACKAGE MANIFEST]
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${packageRows}
                </table>
              </div>
              ` : ""}

              <!-- Notes if present -->
              ${data.notes ? `
              <div style="border-top:2px dashed #94a3b8;margin:14px 0;"></div>
              <div>
                <p style="margin:0 0 4px;font-size:11px;font-weight:900;color:#0f172a;letter-spacing:0.08em;text-transform:uppercase;">
                  [SPECIAL INSTRUCTIONS]
                </p>
                <p style="margin:0;font-size:11px;color:#475569;line-height:1.4;white-space:pre-wrap;">
                  ${data.notes}
                </p>
              </div>
              ` : ""}

              <!-- Perforated Line -->
              <div style="border-top:2px dashed #94a3b8;margin:18px 0 16px;"></div>

              <!-- Real-time Tracking Button -->
              <div style="text-align:center;margin:18px 0 8px;">
                <a href="${trackingUrl}" target="_blank" style="display:inline-block;background-color:#f59e0b;color:#0f172a;padding:12px 24px;border-radius:6px;font-weight:800;font-size:13px;text-decoration:none;letter-spacing:0.04em;text-transform:uppercase;box-shadow:0 2px 6px rgba(245,158,11,0.3);">
                  &rarr; Track Shipment in Real Time
                </a>
              </div>

              <!-- Perforated Line -->
              <div style="border-top:2px dashed #94a3b8;margin:16px 0 14px;"></div>

              <!-- Footer -->
              <div style="text-align:center;font-size:10px;color:#64748b;line-height:1.5;">
                <p style="margin:0;font-weight:700;color:#0f172a;">THANK YOU FOR CHOOSING APEX GLOBAL LOGISTICS</p>
                <p style="margin:4px 0 0;">This electronic shipping receipt is valid proof of consignment dispatch.</p>
                <p style="margin:2px 0 0;">For live GPS telemetry &amp; support, quote tracking reference: <strong>${data.shipmentNumber}</strong></p>
              </div>

            </td>
          </tr>

          <!-- Bottom Decorative Strip -->
          <tr>
            <td style="background-color:#f1f5f9;padding:8px;text-align:center;border-top:1px solid #e2e8f0;">
              <span style="font-size:10px;color:#94a3b8;letter-spacing:0.1em;">
                *** END OF RECEIPT ***
              </span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
