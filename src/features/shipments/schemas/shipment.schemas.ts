import {
  PackageStatus,
  PackageType,
  ShipmentMode,
  ShipmentPriority,
  ShipmentStatus,
  TrackingEventType,
} from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const optionalString = (max = 255) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const requiredString = (label: string, max = 255) =>
  z.string().trim().min(1, `${label} is required.`).max(max);

const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());
const optionalUuid = z.preprocess(
  emptyToUndefined,
  z.string().uuid("Select a valid customer account.").optional(),
);

const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().trim().email("Enter a valid recipient email.").max(255).optional(),
);

const optionalDecimal = z.preprocess(
  emptyToUndefined,
  z.coerce.number().nonnegative("Value cannot be negative.").optional(),
);

const optionalLatitude = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(-90, "Latitude must be at least -90.").max(90).optional(),
);

const optionalLongitude = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(-180, "Longitude must be at least -180.").max(180).optional(),
);

export const shipmentAddressSchema = z.object({
  city: requiredString("City", 120),
  countryCode: z
    .string()
    .trim()
    .length(2, "Use a 2-letter country code.")
    .transform((value) => value.toUpperCase()),
  line1: requiredString("Address line 1", 255),
  line2: optionalString(255),
  name: optionalString(120),
  postalCode: optionalString(32),
  state: optionalString(120),
});

const shipmentOriginAddressSchema = z.object({
  city: optionalString(120),
  countryCode: z
    .preprocess(
      emptyToUndefined,
      z.string().trim().length(2, "Use a 2-letter country code.").optional(),
    )
    .transform((value) => value?.toUpperCase()),
  line1: optionalString(255),
  line2: optionalString(255),
  name: optionalString(120),
  postalCode: optionalString(32),
  state: optionalString(120),
});

export const shipmentPackageSchema = z.object({
  barcode: optionalString(120),
  currency: z
    .preprocess(emptyToUndefined, z.string().trim().length(3).optional())
    .transform((value) => value?.toUpperCase() ?? "USD"),
  declaredValue: optionalDecimal,
  description: optionalString(500),
  fragile: z.coerce.boolean().default(false),
  hazardous: z.coerce.boolean().default(false),
  heightCm: optionalDecimal,
  id: optionalString(80),
  lengthCm: optionalDecimal,
  packageNumber: optionalString(80),
  status: z.nativeEnum(PackageStatus).default(PackageStatus.PENDING),
  type: z.nativeEnum(PackageType).default(PackageType.BOX),
  weightKg: optionalDecimal,
  widthCm: optionalDecimal,
});

export const shipmentOfficeDetailsSchema = z
  .object({
    carrier: optionalString(160),
    carrierReference: optionalString(120),
    comments: optionalString(2000),
    courier: optionalString(160),
    departureTime: optionalString(40),
    paymentMode: optionalString(80),
    pickupTime: optionalString(40),
    productName: optionalString(160),
    quantity: optionalString(80),
    shipperEmail: optionalEmail,
    shipperPhone: optionalString(80),
    totalFreight: optionalString(80),
  })
  .default({});

export const shipmentFormSchema = z
  .object({
    customerId: optionalUuid,
    deliveryWindowEnd: optionalDate,
    deliveryWindowStart: optionalDate,
    destination: shipmentAddressSchema,
    mode: z.nativeEnum(ShipmentMode).default(ShipmentMode.ROAD),
    manualRecipient: z
      .object({
        email: optionalEmail,
        name: optionalString(160),
        phone: optionalString(80),
      })
      .default({}),
    notes: optionalString(2000),
    officeDetails: shipmentOfficeDetailsSchema,
    origin: shipmentOriginAddressSchema,
    packages: z.array(shipmentPackageSchema).min(1, "Add at least one package."),
    pickupWindowEnd: optionalDate,
    pickupWindowStart: optionalDate,
    priority: z.nativeEnum(ShipmentPriority).default(ShipmentPriority.STANDARD),
    publicTracking: z
      .object({
        shareParties: z.boolean().optional(),
        sharePetDetails: z.boolean().optional(),
      })
      .default({}),
    referenceNumber: optionalString(120),
    recipientRequired: z.boolean().default(true),
    serviceLevel: optionalString(80),
    status: z.nativeEnum(ShipmentStatus).default(ShipmentStatus.DRAFT),
  })
  .superRefine((value, context) => {
    if (
      value.pickupWindowStart &&
      value.pickupWindowEnd &&
      value.pickupWindowEnd < value.pickupWindowStart
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pickup end must be after pickup start.",
        path: ["pickupWindowEnd"],
      });
    }

    if (
      value.deliveryWindowStart &&
      value.deliveryWindowEnd &&
      value.deliveryWindowEnd < value.deliveryWindowStart
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Delivery end must be after delivery start.",
        path: ["deliveryWindowEnd"],
      });
    }

    if (value.recipientRequired && !value.customerId && !value.manualRecipient.name) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a registered customer or enter the manual recipient name.",
        path: ["manualRecipient", "name"],
      });
    }

    if (value.recipientRequired && !value.customerId && !value.manualRecipient.email) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a registered customer or enter the manual recipient email.",
        path: ["manualRecipient", "email"],
      });
    }
  });

export const shipmentStatusUpdateSchema = z.object({
  eventType: z.nativeEnum(TrackingEventType),
  latitude: optionalLatitude,
  longitude: optionalLongitude,
  location: optionalString(160),
  message: requiredString("Timeline note", 1000),
  occurredAt: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  status: z.nativeEnum(ShipmentStatus),
});

export const shipmentDocumentSchema = z.object({
  documentType: requiredString("Document type", 80),
  notes: optionalString(1000),
});

export const packagePhotoSchema = z.object({
  caption: optionalString(255),
  packageId: requiredString("Package", 80),
});

export const parcelBookingOptionsSchema = z.object({
  insuranceRequested: z.coerce.boolean().default(false),
  receiptEmail: optionalString(255),
  signatureRequired: z.coerce.boolean().default(false),
});

export type ShipmentFormInput = z.infer<typeof shipmentFormSchema>;
export type ShipmentStatusUpdateInput = z.infer<typeof shipmentStatusUpdateSchema>;
export type ShipmentDocumentInput = z.infer<typeof shipmentDocumentSchema>;
export type PackagePhotoInput = z.infer<typeof packagePhotoSchema>;
export type ParcelBookingOptionsInput = z.infer<typeof parcelBookingOptionsSchema>;
