"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";

import {
  packagePhotoSchema,
  parcelBookingOptionsSchema,
  shipmentDocumentSchema,
  shipmentFormSchema,
  shipmentStatusUpdateSchema,
} from "@/features/shipments/schemas/shipment.schemas";
import {
  createParcelBooking,
  createShipment,
  updateShipment,
  updateShipmentStatus,
  uploadPackagePhoto,
  uploadShipmentDocument,
} from "@/features/shipments/services/shipment.service";
import { geocodeShipmentLocation } from "@/features/shipments/services/maptiler-geocoding.service";
import type { ShipmentActionState } from "@/features/shipments/types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { requireAuthenticatedUser, requireRole } from "@/lib/auth/session";
import { getDatabaseUnavailableMessage, isDatabaseUnavailableError } from "@/lib/db-errors";
import { poundsToKilogramsString } from "@/lib/measurements";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function hasOptionalPackageData(formData: FormData, index: number) {
  const keys = [
    "id",
    "packageNumber",
    "barcode",
    "weightLb",
    "lengthCm",
    "widthCm",
    "heightCm",
    "declaredValue",
    "description",
  ];

  return keys.some((key) => getString(formData, `packages.${index}.${key}`).trim().length > 0);
}

function parseShipmentFormData(
  formData: FormData,
  {
    customerId,
    recipientRequired = true,
    status,
  }: { customerId?: string; recipientRequired?: boolean; status?: string } = {},
) {
  const packages = [0, 1, 2, 3, 4, 5]
    .filter((index) => index === 0 || hasOptionalPackageData(formData, index))
    .map((index) => ({
      barcode: getString(formData, `packages.${index}.barcode`),
      currency: getString(formData, `packages.${index}.currency`) || "USD",
      declaredValue: getString(formData, `packages.${index}.declaredValue`),
      description: getString(formData, `packages.${index}.description`),
      fragile: getBoolean(formData, `packages.${index}.fragile`),
      hazardous: getBoolean(formData, `packages.${index}.hazardous`),
      heightCm: getString(formData, `packages.${index}.heightCm`),
      id: getString(formData, `packages.${index}.id`),
      lengthCm: getString(formData, `packages.${index}.lengthCm`),
      packageNumber: getString(formData, `packages.${index}.packageNumber`),
      status: getString(formData, `packages.${index}.status`) || "PENDING",
      type: getString(formData, `packages.${index}.type`) || "BOX",
      weightKg: poundsToKilogramsString(getString(formData, `packages.${index}.weightLb`)),
      widthCm: getString(formData, `packages.${index}.widthCm`),
    }));

  return shipmentFormSchema.safeParse({
    customerId: customerId ?? getString(formData, "customerId"),
    deliveryWindowEnd: getString(formData, "deliveryWindowEnd"),
    deliveryWindowStart: getString(formData, "deliveryWindowStart"),
    destination: {
      city: getString(formData, "destination.city"),
      countryCode: getString(formData, "destination.countryCode"),
      line1: getString(formData, "destination.line1"),
      line2: getString(formData, "destination.line2"),
      name: getString(formData, "destination.name"),
      postalCode: getString(formData, "destination.postalCode"),
      state: getString(formData, "destination.state"),
    },
    mode: getString(formData, "mode") || "ROAD",
    manualRecipient: {
      email: getString(formData, "manualRecipient.email"),
      name: getString(formData, "manualRecipient.name"),
      phone: getString(formData, "manualRecipient.phone"),
    },
    notes: getString(formData, "notes"),
    officeDetails: {
      carrier: getString(formData, "officeDetails.carrier"),
      carrierReference: getString(formData, "officeDetails.carrierReference"),
      comments: getString(formData, "officeDetails.comments"),
      courier: getString(formData, "officeDetails.courier"),
      departureTime: getString(formData, "officeDetails.departureTime"),
      paymentMode: getString(formData, "officeDetails.paymentMode"),
      pickupTime: getString(formData, "officeDetails.pickupTime"),
      productName: getString(formData, "officeDetails.productName"),
      quantity: getString(formData, "officeDetails.quantity"),
      shipperEmail: getString(formData, "officeDetails.shipperEmail"),
      shipperPhone: getString(formData, "officeDetails.shipperPhone"),
      totalFreight: getString(formData, "officeDetails.totalFreight"),
    },
    origin: {
      city: getString(formData, "origin.city"),
      countryCode: getString(formData, "origin.countryCode"),
      line1: getString(formData, "origin.line1"),
      line2: getString(formData, "origin.line2"),
      name: getString(formData, "origin.name"),
      postalCode: getString(formData, "origin.postalCode"),
      state: getString(formData, "origin.state"),
    },
    packages,
    pickupWindowEnd: getString(formData, "pickupWindowEnd"),
    pickupWindowStart: getString(formData, "pickupWindowStart"),
    priority: getString(formData, "priority") || "STANDARD",
    referenceNumber: getString(formData, "referenceNumber"),
    recipientRequired,
    serviceLevel: getString(formData, "serviceLevel"),
    status: status ?? (getString(formData, "status") || "DRAFT"),
  });
}

function errorState(error: unknown): ShipmentActionState {
  if (error instanceof AuthError) {
    return {
      message: error.message,
      status: "error",
    };
  }

  if (isDatabaseUnavailableError(error)) {
    return {
      message: getDatabaseUnavailableMessage(),
      status: "error",
    };
  }

  console.error("Shipment mutation failed", {
    code: typeof error === "object" && error !== null && "code" in error ? error.code : null,
    name: error instanceof Error ? error.name : typeof error,
  });

  return {
    message: "Shipment could not be saved. Please try again or contact support if it continues.",
    status: "error",
  };
}

export async function createShipmentAction(
  _previousState: ShipmentActionState,
  formData: FormData,
): Promise<ShipmentActionState> {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const parsed = parseShipmentFormData(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please fix the highlighted shipment details.",
      status: "error",
    };
  }

  let shipmentId = "";

  try {
    const shipment = await createShipment(parsed.data, user);
    shipmentId = shipment.id;
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/shipments");
  redirect(`/shipments/${shipmentId}` as Route);
}

export async function createParcelBookingAction(
  _previousState: ShipmentActionState,
  formData: FormData,
): Promise<ShipmentActionState> {
  const user = await requireAuthenticatedUser();
  const isAdmin =
    user.roles.includes(AUTH_ROLES.ADMIN) || user.roles.includes(AUTH_ROLES.SUPER_ADMIN);
  const isCustomer = user.roles.includes(AUTH_ROLES.CUSTOMER);

  if (!isAdmin && !isCustomer) {
    return {
      message:
        "Only customers can request parcel delivery and administrators can create parcel shipments.",
      status: "error",
    };
  }

  const parsed = parseShipmentFormData(formData, {
    customerId: isCustomer ? user.id : undefined,
    status: isCustomer ? "DRAFT" : "BOOKED",
  });
  const parsedOptions = parcelBookingOptionsSchema.safeParse({
    insuranceRequested: getBoolean(formData, "insuranceRequested"),
    receiptEmail: getString(formData, "receiptEmail"),
    signatureRequired: getBoolean(formData, "signatureRequired"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please fix the highlighted parcel details.",
      status: "error",
    };
  }

  if (!parsedOptions.success) {
    return {
      fieldErrors: parsedOptions.error.flatten().fieldErrors,
      message: "Please review the parcel service options.",
      status: "error",
    };
  }

  let shipmentId = "";

  try {
    const shipment = await createParcelBooking({
      input: parsed.data,
      options: parsedOptions.data,
      user,
      workflow: isCustomer ? "customer_booking" : "admin_creation",
    });
    shipmentId = shipment.id;
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/shipments");
  redirect(`/shipments/${shipmentId}` as Route);
}

export async function updateShipmentAction(
  shipmentId: string,
  _previousState: ShipmentActionState,
  formData: FormData,
): Promise<ShipmentActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = parseShipmentFormData(formData, { recipientRequired: false });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please fix the highlighted shipment details.",
      status: "error",
    };
  }

  try {
    await updateShipment(shipmentId, parsed.data, user);
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/shipments");
  revalidatePath(`/shipments/${shipmentId}`);
  redirect(`/shipments/${shipmentId}` as Route);
}

export async function updateShipmentStatusAction(
  shipmentId: string,
  _previousState: ShipmentActionState,
  formData: FormData,
): Promise<ShipmentActionState> {
  const user = await requireAuthenticatedUser();
  const suppliedLatitude = getString(formData, "latitude").trim();
  const suppliedLongitude = getString(formData, "longitude").trim();
  const location = getString(formData, "location").trim();
  let mappingMessage = "";

  if (!suppliedLatitude && !suppliedLongitude && location) {
    const geocode = await geocodeShipmentLocation(location);

    if (geocode.coordinates) {
      formData.set("latitude", String(geocode.coordinates.latitude));
      formData.set("longitude", String(geocode.coordinates.longitude));
      formData.set("location", geocode.formattedAddress ?? location);
      mappingMessage = " Map coordinates were added from the location provided.";
    } else if (geocode.reason === "not_configured") {
      mappingMessage =
        " The location was saved without a map pin because MapTiler is not configured.";
    } else if (geocode.reason === "not_found") {
      mappingMessage = " The location was saved, but MapTiler could not find a map pin for it.";
    } else {
      mappingMessage = " The location was saved, but MapTiler was temporarily unavailable.";
    }
  }

  const parsed = shipmentStatusUpdateSchema.safeParse({
    eventType: getString(formData, "eventType"),
    latitude: getString(formData, "latitude"),
    location: getString(formData, "location"),
    longitude: getString(formData, "longitude"),
    message: getString(formData, "message"),
    occurredAt: getString(formData, "occurredAt"),
    status: getString(formData, "status"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add a valid status update.",
      status: "error",
    };
  }

  if (parsed.data.status === "IN_TRANSIT" && !parsed.data.location) {
    return {
      fieldErrors: {
        location: ["Enter the current location before publishing an in-transit update."],
      },
      message: "Add the current location for an in-transit update.",
      status: "error",
    };
  }

  try {
    await updateShipmentStatus(shipmentId, parsed.data, user);
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/shipments");
  revalidatePath(`/shipments/${shipmentId}`);
  revalidatePath(`/shipments/${shipmentId}/receipt`);
  revalidatePath("/invoices/[invoiceId]", "page");
  revalidatePath("/admin/invoices");

  return {
    message: `Shipment status updated.${mappingMessage}`,
    status: "success",
  };
}

export async function uploadShipmentDocumentAction(
  shipmentId: string,
  _previousState: ShipmentActionState,
  formData: FormData,
): Promise<ShipmentActionState> {
  const user = await requireAuthenticatedUser();
  const file = formData.get("file");
  const parsed = shipmentDocumentSchema.safeParse({
    documentType: getString(formData, "documentType"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add valid document metadata.",
      status: "error",
    };
  }

  if (!(file instanceof File) || file.size === 0) {
    return {
      fieldErrors: {
        file: ["Choose a document to upload."],
      },
      message: "Choose a document to upload.",
      status: "error",
    };
  }

  try {
    await uploadShipmentDocument({
      document: parsed.data,
      file,
      shipmentId,
      user,
    });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/shipments/${shipmentId}`);

  return {
    message: "Document uploaded.",
    status: "success",
  };
}

export async function uploadPackagePhotoAction(
  shipmentId: string,
  _previousState: ShipmentActionState,
  formData: FormData,
): Promise<ShipmentActionState> {
  const user = await requireAuthenticatedUser();
  const file = formData.get("file");
  const parsed = packagePhotoSchema.safeParse({
    caption: getString(formData, "caption"),
    packageId: getString(formData, "packageId"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please choose a package and add valid photo metadata.",
      status: "error",
    };
  }

  if (!(file instanceof File) || file.size === 0) {
    return {
      fieldErrors: {
        file: ["Choose a package photo to upload."],
      },
      message: "Choose a package photo to upload.",
      status: "error",
    };
  }

  try {
    await uploadPackagePhoto({
      file,
      photo: parsed.data,
      shipmentId,
      user,
    });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/shipments/${shipmentId}`);

  return {
    message: "Package photo uploaded.",
    status: "success",
  };
}
