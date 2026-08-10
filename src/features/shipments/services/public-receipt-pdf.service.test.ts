import assert from "node:assert/strict";
import test from "node:test";

import {
  PackageStatus,
  PackageType,
  ShipmentMode,
  ShipmentPriority,
  ShipmentStatus,
  TrackingEventType,
} from "@prisma/client";
import { PDFDocument } from "pdf-lib";

import { createPublicShipmentReceiptPdf } from "@/features/shipments/services/public-receipt-pdf.service";
import type { ShipmentTrackingSnapshot } from "@/features/shipments/types";

export const publicReceiptFixture: ShipmentTrackingSnapshot = {
  createdAt: "2026-08-10T15:00:00.000Z",
  deliveredAt: null,
  deliveryWindowEnd: null,
  deliveryWindowStart: "2026-08-12T18:00:00.000Z",
  destinationCity: "London",
  destinationCountryCode: "GB",
  dispatchedAt: "2026-08-10T18:00:00.000Z",
  id: "shipment-fixture",
  mode: ShipmentMode.AIR,
  originCity: "Halifax",
  originCountryCode: "CA",
  packageCount: 1,
  pickupWindowEnd: null,
  pickupWindowStart: "2026-08-10T18:00:00.000Z",
  priority: ShipmentPriority.EXPEDITED,
  publicDetails: {
    carrier: "Apex Air",
    carrierReference: "AIR-2026-410",
    consignment: {
      packages: [
        {
          description: "Customer parcel",
          status: PackageStatus.IN_TRANSIT,
          type: PackageType.BOX,
          weightLb: "12.5",
        },
      ],
    },
    courier: "Apex Courier",
    freight: null,
    pet: null,
    productName: "Priority parcel",
    quantity: "1",
    recipient: {
      address: {
        city: "London",
        countryCode: "GB",
        line1: "20 Customer Road",
        line2: null,
        name: "Jamie Customer",
        postalCode: "SW1A 1AA",
        state: null,
      },
      email: "customer@example.com",
      name: "Jamie Customer",
      phone: "+44 20 0000 0000",
    },
    recipientName: "Jamie Customer",
    sender: {
      address: {
        city: "Halifax",
        countryCode: "CA",
        line1: "10 Harbour Street",
        line2: null,
        name: "Apex Sender",
        postalCode: "B3H 1A1",
        state: "NS",
      },
      email: "sender@example.com",
      name: "Apex Sender",
      phone: "+1 902 555 0100",
    },
    senderName: "Apex Sender",
  },
  publicTrackingPinRequired: true,
  referenceNumber: "CUSTOMER-410",
  route: null,
  sensitiveDetailsLocked: false,
  serviceLevel: "Priority Delivery",
  shipmentNumber: "AGL-202608-ABC12345",
  status: ShipmentStatus.IN_TRANSIT,
  timeline: [
    {
      currentLocation: "Halifax Stanfield International Airport",
      eventType: TrackingEventType.IN_TRANSIT,
      id: "event-fixture",
      latitude: "44.8808",
      longitude: "-63.5086",
      message: "Shipment departed the origin facility and is moving to the destination hub.",
      occurredAt: "2026-08-10T18:15:00.000Z",
      packageNumber: "PKG-1",
      recordedBy: "Apex Operations",
      shipmentStatus: ShipmentStatus.IN_TRANSIT,
    },
  ],
  totalWeightLb: "12.5",
  updatedAt: "2026-08-10T18:15:00.000Z",
};

test("creates a readable customer shipment receipt PDF", async () => {
  const bytes = await createPublicShipmentReceiptPdf(publicReceiptFixture, "America/Halifax");
  const receipt = await PDFDocument.load(bytes);

  assert.equal(Buffer.from(bytes.subarray(0, 5)).toString("ascii"), "%PDF-");
  assert.equal(receipt.getTitle(), "Shipment Receipt - AGL-202608-ABC12345");
  assert.ok(receipt.getPageCount() >= 1);
  assert.ok(bytes.length > 2_000);
});

test("does not create a receipt while recipient details are locked", async () => {
  await assert.rejects(
    () =>
      createPublicShipmentReceiptPdf(
        { ...publicReceiptFixture, sensitiveDetailsLocked: true },
        "UTC",
      ),
    /PIN verification is required/,
  );
});
