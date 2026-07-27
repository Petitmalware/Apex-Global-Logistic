-- Protect sensitive public tracking details with a recipient-selected PIN.
ALTER TABLE "Shipment"
ADD COLUMN "publicTrackingPinHash" VARCHAR(255),
ADD COLUMN "publicTrackingPinRequired" BOOLEAN NOT NULL DEFAULT false;
