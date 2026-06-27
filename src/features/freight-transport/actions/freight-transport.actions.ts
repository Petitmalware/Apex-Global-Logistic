"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";

import {
  freightCargoItemSchema,
  freightContainerSchema,
  freightDispatchSchema,
  freightDocumentSchema,
  freightMachineryItemSchema,
  freightRouteStopSchema,
  freightTrackingEventSchema,
  freightTransportProfileSchema,
  freightVehicleItemSchema,
} from "@/features/freight-transport/schemas/freight-transport.schemas";
import {
  addFreightCargoItem,
  addFreightContainer,
  addFreightMachineryItem,
  addFreightRouteStop,
  addFreightTrackingEvent,
  addFreightVehicleItem,
  createFreightTransportBooking,
  updateFreightDispatch,
  updateFreightTransportProfile,
  uploadFreightDocument,
} from "@/features/freight-transport/services/freight-transport.service";
import type { FreightTransportActionState } from "@/features/freight-transport/types";
import { shipmentFormSchema } from "@/features/shipments/schemas/shipment.schemas";
import { AuthError } from "@/lib/auth/errors";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requireAuthenticatedUser, requirePermission } from "@/lib/auth/session";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function getOptionalFile(formData: FormData, key: string) {
  const file = formData.get(key);

  return file instanceof File && file.size > 0 ? file : null;
}

function parseFreightProfileFormData(formData: FormData) {
  return freightTransportProfileSchema.safeParse({
    actualArrivalAt: getString(formData, "actualArrivalAt"),
    actualDepartureAt: getString(formData, "actualDepartureAt"),
    averageSpeedKph: getString(formData, "averageSpeedKph"),
    commodityCode: getString(formData, "commodityCode"),
    commodityDescription: getString(formData, "commodityDescription"),
    containerNumber: getString(formData, "containerNumber"),
    destinationTerminal: getString(formData, "destinationTerminal"),
    distanceKm: getString(formData, "distanceKm"),
    estimatedDurationHours: getString(formData, "estimatedDurationHours"),
    freightType: getString(formData, "freightType") || "FTL",
    grossWeightKg: getString(formData, "grossWeightKg"),
    hazmatClass: getString(formData, "hazmatClass"),
    incoterm: getString(formData, "incoterm"),
    originTerminal: getString(formData, "originTerminal"),
    palletCount: getString(formData, "palletCount"),
    plannedArrivalAt: getString(formData, "plannedArrivalAt"),
    plannedDepartureAt: getString(formData, "plannedDepartureAt"),
    refrigeratedRequired: getBoolean(formData, "refrigeratedRequired"),
    routeCode: getString(formData, "routeCode"),
    routeName: getString(formData, "routeName"),
    sealNumber: getString(formData, "sealNumber"),
    specialInstructions: getString(formData, "specialInstructions"),
    status: getString(formData, "status") || "REQUESTED",
    temperatureMaxC: getString(formData, "temperatureMaxC"),
    temperatureMinC: getString(formData, "temperatureMinC"),
    unNumber: getString(formData, "unNumber"),
    volumeCbm: getString(formData, "volumeCbm"),
  });
}

function parseFreightShipmentFormData(formData: FormData) {
  const freightType = getString(formData, "freightType") || "FTL";
  const commodityDescription =
    getString(formData, "commodityDescription") || "Long-haul freight consignment";

  return shipmentFormSchema.safeParse({
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
    notes: getString(formData, "notes"),
    origin: {
      city: getString(formData, "origin.city"),
      countryCode: getString(formData, "origin.countryCode"),
      line1: getString(formData, "origin.line1"),
      line2: getString(formData, "origin.line2"),
      name: getString(formData, "origin.name"),
      postalCode: getString(formData, "origin.postalCode"),
      state: getString(formData, "origin.state"),
    },
    packages: [
      {
        currency: "USD",
        declaredValue: "",
        description: commodityDescription,
        fragile: false,
        hazardous: Boolean(getString(formData, "hazmatClass") || getString(formData, "unNumber")),
        heightCm: "",
        lengthCm: "",
        status: "PENDING",
        type: freightType === "CONTAINER" ? "CONTAINER" : "PALLET",
        weightKg: getString(formData, "grossWeightKg"),
        widthCm: "",
      },
    ],
    pickupWindowEnd: getString(formData, "pickupWindowEnd"),
    pickupWindowStart: getString(formData, "pickupWindowStart"),
    priority: getString(formData, "priority") || "STANDARD",
    referenceNumber: getString(formData, "referenceNumber"),
    serviceLevel: getString(formData, "serviceLevel") || "Long-haul Freight",
    status: "BOOKED",
  });
}

function errorState(error: unknown): FreightTransportActionState {
  if (error instanceof AuthError) {
    return {
      message: error.message,
      status: "error",
    };
  }

  return {
    message: "Something went wrong. Please review the freight details and try again.",
    status: "error",
  };
}

export async function createFreightTransportBookingAction(
  _previousState: FreightTransportActionState,
  formData: FormData,
): Promise<FreightTransportActionState> {
  const user = await requirePermission(PERMISSIONS.FREIGHT_TRANSPORT_CREATE);
  const parsedFreight = parseFreightProfileFormData(formData);
  const parsedShipment = parseFreightShipmentFormData(formData);

  if (!parsedFreight.success) {
    return {
      fieldErrors: parsedFreight.error.flatten().fieldErrors,
      message: "Please fix the highlighted freight transport details.",
      status: "error",
    };
  }

  if (!parsedShipment.success) {
    return {
      fieldErrors: parsedShipment.error.flatten().fieldErrors,
      message: "Please fix the pickup and delivery details.",
      status: "error",
    };
  }

  let freightTransportId = "";

  try {
    const freightTransport = await createFreightTransportBooking({
      freight: parsedFreight.data,
      shipmentInput: parsedShipment.data,
      user,
    });
    freightTransportId = freightTransport.id;
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/freight-transport");
  redirect(`/freight-transport/${freightTransportId}` as Route);
}

export async function updateFreightTransportProfileAction(
  freightTransportId: string,
  _previousState: FreightTransportActionState,
  formData: FormData,
): Promise<FreightTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = parseFreightProfileFormData(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please fix the highlighted freight transport details.",
      status: "error",
    };
  }

  try {
    await updateFreightTransportProfile(freightTransportId, parsed.data, user);
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/freight-transport");
  revalidatePath(`/freight-transport/${freightTransportId}`);
  redirect(`/freight-transport/${freightTransportId}` as Route);
}

export async function updateFreightDispatchAction(
  freightTransportId: string,
  _previousState: FreightTransportActionState,
  formData: FormData,
): Promise<FreightTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = freightDispatchSchema.safeParse({
    driverId: getString(formData, "driverId"),
    message: getString(formData, "message"),
    status: getString(formData, "status") || "ASSIGNED",
    vehicleId: getString(formData, "vehicleId"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please choose a valid dispatch assignment.",
      status: "error",
    };
  }

  try {
    await updateFreightDispatch({ freightTransportId, input: parsed.data, user });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/freight-transport/${freightTransportId}`);

  return {
    message: "Dispatch assignment updated.",
    status: "success",
  };
}

export async function addFreightCargoItemAction(
  freightTransportId: string,
  _previousState: FreightTransportActionState,
  formData: FormData,
): Promise<FreightTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = freightCargoItemSchema.safeParse({
    cargoType: getString(formData, "cargoType"),
    commodityCode: getString(formData, "commodityCode"),
    containerId: getString(formData, "containerId"),
    currency: getString(formData, "currency"),
    declaredValue: getString(formData, "declaredValue"),
    description: getString(formData, "description"),
    hazardous: getBoolean(formData, "hazardous"),
    heightCm: getString(formData, "heightCm"),
    lengthCm: getString(formData, "lengthCm"),
    notes: getString(formData, "notes"),
    quantity: getString(formData, "quantity") || "1",
    stackable: getBoolean(formData, "stackable"),
    status: getString(formData, "status") || "PLANNED",
    temperatureControlled: getBoolean(formData, "temperatureControlled"),
    temperatureMaxC: getString(formData, "temperatureMaxC"),
    temperatureMinC: getString(formData, "temperatureMinC"),
    unit: getString(formData, "unit") || "pieces",
    volumeCbm: getString(formData, "volumeCbm"),
    weightKg: getString(formData, "weightKg"),
    widthCm: getString(formData, "widthCm"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add valid cargo details.",
      status: "error",
    };
  }

  try {
    await addFreightCargoItem({ freightTransportId, input: parsed.data, user });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/freight-transport/${freightTransportId}`);

  return {
    message: "Cargo item added.",
    status: "success",
  };
}

export async function addFreightContainerAction(
  freightTransportId: string,
  _previousState: FreightTransportActionState,
  formData: FormData,
): Promise<FreightTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = freightContainerSchema.safeParse({
    containerNumber: getString(formData, "containerNumber"),
    containerType: getString(formData, "containerType"),
    currentWeightKg: getString(formData, "currentWeightKg"),
    loadedAt: getString(formData, "loadedAt"),
    maxGrossWeightKg: getString(formData, "maxGrossWeightKg"),
    notes: getString(formData, "notes"),
    releasedAt: getString(formData, "releasedAt"),
    sealNumber: getString(formData, "sealNumber"),
    status: getString(formData, "status") || "ASSIGNED",
    tareWeightKg: getString(formData, "tareWeightKg"),
    temperatureSetC: getString(formData, "temperatureSetC"),
    volumeCbm: getString(formData, "volumeCbm"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add valid container details.",
      status: "error",
    };
  }

  try {
    await addFreightContainer({ freightTransportId, input: parsed.data, user });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/freight-transport/${freightTransportId}`);

  return {
    message: "Container added.",
    status: "success",
  };
}

export async function addFreightMachineryItemAction(
  freightTransportId: string,
  _previousState: FreightTransportActionState,
  formData: FormData,
): Promise<FreightTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = freightMachineryItemSchema.safeParse({
    category: getString(formData, "category"),
    condition: getString(formData, "condition"),
    heightCm: getString(formData, "heightCm"),
    lengthCm: getString(formData, "lengthCm"),
    loadingInstructions: getString(formData, "loadingInstructions"),
    manufacturer: getString(formData, "manufacturer"),
    model: getString(formData, "model"),
    name: getString(formData, "name"),
    notes: getString(formData, "notes"),
    operatingWeightKg: getString(formData, "operatingWeightKg"),
    oversizePermitRequired: getBoolean(formData, "oversizePermitRequired"),
    serialNumber: getString(formData, "serialNumber"),
    status: getString(formData, "status") || "PLANNED",
    widthCm: getString(formData, "widthCm"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add valid machinery details.",
      status: "error",
    };
  }

  try {
    await addFreightMachineryItem({ freightTransportId, input: parsed.data, user });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/freight-transport/${freightTransportId}`);

  return {
    message: "Machinery item added.",
    status: "success",
  };
}

export async function addFreightVehicleItemAction(
  freightTransportId: string,
  _previousState: FreightTransportActionState,
  formData: FormData,
): Promise<FreightTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = freightVehicleItemSchema.safeParse({
    color: getString(formData, "color"),
    condition: getString(formData, "condition"),
    keysAvailable: getBoolean(formData, "keysAvailable"),
    make: getString(formData, "make"),
    model: getString(formData, "model"),
    notes: getString(formData, "notes"),
    odometerKm: getString(formData, "odometerKm"),
    operable: getBoolean(formData, "operable"),
    plateNumber: getString(formData, "plateNumber"),
    status: getString(formData, "status") || "PLANNED",
    vin: getString(formData, "vin"),
    year: getString(formData, "year"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add valid vehicle cargo details.",
      status: "error",
    };
  }

  try {
    await addFreightVehicleItem({ freightTransportId, input: parsed.data, user });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/freight-transport/${freightTransportId}`);

  return {
    message: "Vehicle cargo added.",
    status: "success",
  };
}

export async function addFreightRouteStopAction(
  freightTransportId: string,
  _previousState: FreightTransportActionState,
  formData: FormData,
): Promise<FreightTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = freightRouteStopSchema.safeParse({
    actualArrivalAt: getString(formData, "actualArrivalAt"),
    actualDepartureAt: getString(formData, "actualDepartureAt"),
    addressLine1: getString(formData, "addressLine1"),
    city: getString(formData, "city"),
    contactName: getString(formData, "contactName"),
    contactPhone: getString(formData, "contactPhone"),
    countryCode: getString(formData, "countryCode"),
    latitude: getString(formData, "latitude"),
    longitude: getString(formData, "longitude"),
    name: getString(formData, "name"),
    notes: getString(formData, "notes"),
    plannedArrivalAt: getString(formData, "plannedArrivalAt"),
    plannedDepartureAt: getString(formData, "plannedDepartureAt"),
    sequence: getString(formData, "sequence"),
    stopType: getString(formData, "stopType") || "WAREHOUSE",
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add valid route stop details.",
      status: "error",
    };
  }

  try {
    await addFreightRouteStop({ freightTransportId, input: parsed.data, user });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/freight-transport/${freightTransportId}`);

  return {
    message: "Route stop added.",
    status: "success",
  };
}

export async function uploadFreightDocumentAction(
  freightTransportId: string,
  _previousState: FreightTransportActionState,
  formData: FormData,
): Promise<FreightTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = freightDocumentSchema.safeParse({
    documentType: getString(formData, "documentType") || "BILL_OF_LADING",
    expiresAt: getString(formData, "expiresAt"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add valid document details.",
      status: "error",
    };
  }

  try {
    await uploadFreightDocument({
      file: getOptionalFile(formData, "file"),
      freightTransportId,
      input: parsed.data,
      user,
    });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/freight-transport/${freightTransportId}`);

  return {
    message: "Freight document uploaded.",
    status: "success",
  };
}

export async function addFreightTrackingEventAction(
  freightTransportId: string,
  _previousState: FreightTransportActionState,
  formData: FormData,
): Promise<FreightTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = freightTrackingEventSchema.safeParse({
    etaAt: getString(formData, "etaAt"),
    eventType: getString(formData, "eventType") || "CHECKPOINT_ARRIVED",
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
      message: "Please add valid tracking details.",
      status: "error",
    };
  }

  try {
    await addFreightTrackingEvent({ freightTransportId, input: parsed.data, user });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/freight-transport/${freightTransportId}`);

  return {
    message: "Tracking event added.",
    status: "success",
  };
}
