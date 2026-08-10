import { PDFDocument, type PDFFont, type PDFPage, StandardFonts, rgb } from "pdf-lib";

import { formatShipmentStatus } from "@/features/shipments/status-labels";
import type {
  PublicTrackingParty,
  ShipmentAddressView,
  ShipmentTrackingSnapshot,
} from "@/features/shipments/types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = 24;

const colors = {
  accent: rgb(0.05, 0.55, 0.65),
  border: rgb(0.82, 0.85, 0.88),
  muted: rgb(0.35, 0.4, 0.46),
  navy: rgb(0.04, 0.12, 0.22),
  pale: rgb(0.95, 0.97, 0.98),
  white: rgb(1, 1, 1),
};

function cleanText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatEnum(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (character) => character.toUpperCase());
}

function formatDate(value: string | null, timeZone: string) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone,
    timeZoneName: "short",
    year: "numeric",
  }).format(date);
}

function formatAddress(address: ShipmentAddressView) {
  const locality = [address.city, address.state, address.postalCode].filter(Boolean).join(", ");

  return [address.line1, address.line2, locality, address.countryCode].filter(Boolean).join(", ");
}

function formatParty(party: PublicTrackingParty | null) {
  if (!party) {
    return "Not recorded";
  }

  return [
    party.name,
    formatAddress(party.address),
    party.email ? `Email: ${party.email}` : null,
    party.phone ? `Phone: ${party.phone}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const normalized = cleanText(text) || "Not recorded";
  const words = normalized.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;

    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      line = candidate;
      continue;
    }

    if (line) {
      lines.push(line);
      line = "";
    }

    if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
      line = word;
      continue;
    }

    let fragment = "";

    for (const character of word) {
      const nextFragment = `${fragment}${character}`;

      if (font.widthOfTextAtSize(nextFragment, fontSize) > maxWidth && fragment) {
        lines.push(fragment);
        fragment = character;
      } else {
        fragment = nextFragment;
      }
    }

    line = fragment;
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}

export async function createPublicShipmentReceiptPdf(
  snapshot: ShipmentTrackingSnapshot,
  timeZone: string,
) {
  if (snapshot.sensitiveDetailsLocked) {
    throw new Error("Recipient PIN verification is required before downloading this receipt.");
  }

  const document = await PDFDocument.create();
  const regularFont = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);
  const firstPage = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const pages: PDFPage[] = [firstPage];
  let page = firstPage;
  let y = PAGE_HEIGHT - MARGIN;

  document.setAuthor("Apex Global Logistics");
  document.setCreator("Apex Global Logistics customer tracking");
  document.setSubject(`Shipment receipt ${snapshot.shipmentNumber}`);
  document.setTitle(`Shipment Receipt - ${snapshot.shipmentNumber}`);

  function addPage() {
    page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    y = PAGE_HEIGHT - MARGIN;

    if (pages.length > 1) {
      page.drawText("APEX GLOBAL LOGISTICS - SHIPMENT RECEIPT", {
        color: colors.muted,
        font: boldFont,
        size: 8,
        x: MARGIN,
        y,
      });
      y -= 25;
    }
  }

  function ensureSpace(height: number) {
    if (y - height < MARGIN + 10) {
      addPage();
    }
  }

  function drawLines(
    lines: string[],
    {
      color = colors.navy,
      font = regularFont,
      fontSize = 10,
      lineHeight = 14,
      x = MARGIN,
    }: {
      color?: ReturnType<typeof rgb>;
      font?: PDFFont;
      fontSize?: number;
      lineHeight?: number;
      x?: number;
    } = {},
  ) {
    ensureSpace(lines.length * lineHeight);

    for (const line of lines) {
      page.drawText(line, { color, font, size: fontSize, x, y });
      y -= lineHeight;
    }
  }

  function drawParagraph(text: string, options: { color?: ReturnType<typeof rgb> } = {}) {
    const lines = wrapText(text, regularFont, 10, CONTENT_WIDTH);
    drawLines(lines, { color: options.color, lineHeight: 14 });
  }

  function drawSectionTitle(title: string) {
    ensureSpace(32);
    y -= 8;
    page.drawLine({
      color: colors.border,
      end: { x: PAGE_WIDTH - MARGIN, y: y + 4 },
      start: { x: MARGIN, y: y + 4 },
      thickness: 0.8,
    });
    y -= 14;
    page.drawText(cleanText(title).toUpperCase(), {
      color: colors.accent,
      font: boldFont,
      size: 9,
      x: MARGIN,
      y,
    });
    y -= 20;
  }

  function drawFieldGrid(fields: Array<{ label: string; value: string | null | undefined }>) {
    const columnGap = 20;
    const columnWidth = (CONTENT_WIDTH - columnGap) / 2;

    for (let index = 0; index < fields.length; index += 2) {
      const row = fields.slice(index, index + 2);
      const rowLines = row.map((field) =>
        wrapText(cleanText(field.value) || "Not recorded", regularFont, 10, columnWidth),
      );
      const rowHeight = 15 + Math.max(...rowLines.map((lines) => lines.length)) * 13 + 7;
      ensureSpace(rowHeight);
      const rowTop = y;

      row.forEach((field, columnIndex) => {
        const x = MARGIN + columnIndex * (columnWidth + columnGap);
        page.drawText(cleanText(field.label).toUpperCase(), {
          color: colors.muted,
          font: boldFont,
          size: 7.5,
          x,
          y: rowTop,
        });

        rowLines[columnIndex]?.forEach((line, lineIndex) => {
          page.drawText(line, {
            color: colors.navy,
            font: regularFont,
            size: 10,
            x,
            y: rowTop - 15 - lineIndex * 13,
          });
        });
      });

      y -= rowHeight;
    }
  }

  page.drawRectangle({
    color: colors.navy,
    height: 54,
    width: 54,
    x: MARGIN,
    y: y - 54,
  });
  page.drawText("AG", {
    color: colors.white,
    font: boldFont,
    size: 18,
    x: MARGIN + 14,
    y: y - 35,
  });
  page.drawText("APEX GLOBAL LOGISTICS", {
    color: colors.navy,
    font: boldFont,
    size: 17,
    x: MARGIN + 70,
    y: y - 18,
  });
  page.drawText("CUSTOMER SHIPMENT RECEIPT", {
    color: colors.accent,
    font: boldFont,
    size: 9,
    x: MARGIN + 70,
    y: y - 38,
  });
  y -= 82;

  page.drawRectangle({
    borderColor: colors.border,
    borderWidth: 0.8,
    color: colors.pale,
    height: 86,
    width: CONTENT_WIDTH,
    x: MARGIN,
    y: y - 76,
  });
  page.drawText("TRACKING NUMBER", {
    color: colors.muted,
    font: boldFont,
    size: 8,
    x: MARGIN + 16,
    y: y - 18,
  });
  page.drawText(cleanText(snapshot.shipmentNumber), {
    color: colors.navy,
    font: boldFont,
    size: 20,
    x: MARGIN + 16,
    y: y - 43,
  });
  page.drawText(formatShipmentStatus(snapshot.status).toUpperCase(), {
    color: colors.accent,
    font: boldFont,
    size: 10,
    x: MARGIN + 16,
    y: y - 63,
  });
  page.drawText(`Generated ${formatDate(new Date().toISOString(), timeZone)}`, {
    color: colors.muted,
    font: regularFont,
    size: 8,
    x: PAGE_WIDTH - MARGIN - 205,
    y: y - 63,
  });
  y -= 94;

  drawSectionTitle("Shipment summary");
  drawFieldGrid([
    { label: "Status", value: formatShipmentStatus(snapshot.status) },
    { label: "Service", value: snapshot.serviceLevel ?? "Standard managed service" },
    { label: "Transport mode", value: formatEnum(snapshot.mode) },
    { label: "Priority", value: formatEnum(snapshot.priority) },
    { label: "Pieces", value: String(snapshot.packageCount) },
    {
      label: "Recorded weight",
      value: snapshot.totalWeightLb ? `${snapshot.totalWeightLb} lb` : "Not recorded",
    },
    { label: "Planned departure", value: formatDate(snapshot.pickupWindowStart, timeZone) },
    { label: "Expected delivery", value: formatDate(snapshot.deliveryWindowStart, timeZone) },
  ]);

  drawSectionTitle("Route");
  drawFieldGrid([
    {
      label: "Origin",
      value: `${snapshot.originCity}, ${snapshot.originCountryCode}`,
    },
    {
      label: "Destination",
      value: `${snapshot.destinationCity}, ${snapshot.destinationCountryCode}`,
    },
  ]);

  const details = snapshot.publicDetails;

  if (details) {
    drawSectionTitle("Shipment parties");
    drawFieldGrid([
      { label: "Sender", value: formatParty(details.sender) },
      { label: "Receiver", value: formatParty(details.recipient) },
    ]);

    if (
      details.carrier ||
      details.courier ||
      details.carrierReference ||
      details.productName ||
      details.quantity
    ) {
      drawSectionTitle("Transport record");
      drawFieldGrid([
        { label: "Carrier", value: details.carrier },
        { label: "Courier", value: details.courier },
        { label: "Carrier reference", value: details.carrierReference },
        { label: "Shipment item", value: details.productName },
        { label: "Quantity", value: details.quantity },
      ]);
    }

    if (details.consignment?.packages.length) {
      drawSectionTitle("Consignment");
      details.consignment.packages.forEach((shipmentPackage, index) => {
        drawParagraph(
          `Piece ${index + 1}: ${shipmentPackage.description ?? formatEnum(shipmentPackage.type)} | ${formatEnum(shipmentPackage.status)} | ${shipmentPackage.weightLb ? `${shipmentPackage.weightLb} lb` : "Weight not recorded"}`,
        );
        y -= 3;
      });
    }

    if (details.pet) {
      drawSectionTitle("Pet profile");
      drawFieldGrid([
        { label: "Pet", value: details.pet.name },
        { label: "Species", value: formatEnum(details.pet.species) },
        { label: "Breed", value: details.pet.breed },
        { label: "Color", value: details.pet.color },
        { label: "Sex", value: details.pet.sex },
        {
          label: "Weight",
          value: details.pet.weightLb ? `${details.pet.weightLb} lb` : null,
        },
      ]);
    }
  }

  drawSectionTitle("Latest shipment update");
  const latestEvent = snapshot.timeline[0];

  if (latestEvent) {
    drawFieldGrid([
      {
        label: "Update",
        value: latestEvent.shipmentStatus
          ? formatShipmentStatus(latestEvent.shipmentStatus)
          : formatEnum(latestEvent.eventType),
      },
      { label: "Recorded", value: formatDate(latestEvent.occurredAt, timeZone) },
      { label: "Location", value: latestEvent.currentLocation },
      { label: "Message", value: latestEvent.message },
    ]);
  } else {
    drawParagraph("No shipment milestones have been published yet.", { color: colors.muted });
  }

  drawSectionTitle("Customer notice");
  drawParagraph(
    "This receipt is a customer copy of the shipment record available through Apex public tracking. Keep the tracking number and any recipient PIN private. Contact Apex Global Logistics if any shipment detail needs correction.",
    { color: colors.muted },
  );

  pages.forEach((receiptPage, index) => {
    receiptPage.drawLine({
      color: colors.border,
      end: { x: PAGE_WIDTH - MARGIN, y: FOOTER_Y + 12 },
      start: { x: MARGIN, y: FOOTER_Y + 12 },
      thickness: 0.6,
    });
    receiptPage.drawText(`Apex Global Logistics | ${cleanText(snapshot.shipmentNumber)}`, {
      color: colors.muted,
      font: regularFont,
      size: 7.5,
      x: MARGIN,
      y: FOOTER_Y,
    });
    receiptPage.drawText(`Page ${index + 1} of ${pages.length}`, {
      color: colors.muted,
      font: regularFont,
      size: 7.5,
      x: PAGE_WIDTH - MARGIN - 52,
      y: FOOTER_Y,
    });
  });

  return document.save();
}
