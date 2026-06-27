import type { ShipmentFormInput } from "@/features/shipments/schemas/shipment.schemas";

const DIMENSIONAL_DIVISOR = 5000;
const MINIMUM_CHARGEABLE_KG = 1;
const ROAD_RATE_PER_KG = 4.8;
const AIR_RATE_PER_KG = 7.5;
const SEA_RATE_PER_KG = 3.4;
const RAIL_RATE_PER_KG = 3.9;
const MULTIMODAL_RATE_PER_KG = 6.2;
const BASE_PARCEL_FEE = 12;
const FRAGILE_HANDLING_FEE = 6;
const HAZARDOUS_HANDLING_FEE = 28;
const SIGNATURE_FEE = 4.5;
const INSURANCE_RATE = 0.0125;
const FUEL_SURCHARGE_RATE = 0.08;
const TAX_RATE = 0.075;

const priorityMultiplier = {
  EXPEDITED: 1.35,
  STANDARD: 1,
  URGENT: 1.75,
} satisfies Record<ShipmentFormInput["priority"], number>;

const modeRate = {
  AIR: AIR_RATE_PER_KG,
  MULTIMODAL: MULTIMODAL_RATE_PER_KG,
  RAIL: RAIL_RATE_PER_KG,
  ROAD: ROAD_RATE_PER_KG,
  SEA: SEA_RATE_PER_KG,
} satisfies Record<ShipmentFormInput["mode"], number>;

export type ParcelQuote = {
  actualWeightKg: number;
  chargeableWeightKg: number;
  currency: string;
  dimensionalWeightKg: number;
  fragileFee: number;
  fuelSurcharge: number;
  hazardousFee: number;
  insuranceFee: number;
  lineHaul: number;
  packageCount: number;
  signatureFee: number;
  subtotal: number;
  taxTotal: number;
  total: number;
};

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function weight(value: number) {
  return Math.round(value * 1000) / 1000;
}

function getDimensionalWeight(shipmentPackage: ShipmentFormInput["packages"][number]) {
  if (!shipmentPackage.lengthCm || !shipmentPackage.widthCm || !shipmentPackage.heightCm) {
    return 0;
  }

  return (
    (shipmentPackage.lengthCm * shipmentPackage.widthCm * shipmentPackage.heightCm) /
    DIMENSIONAL_DIVISOR
  );
}

export function calculateParcelQuote(
  input: ShipmentFormInput,
  options: {
    insuranceRequested?: boolean;
    signatureRequired?: boolean;
  } = {},
): ParcelQuote {
  const actualWeightKg = input.packages.reduce(
    (sum, shipmentPackage) => sum + (shipmentPackage.weightKg ?? 0),
    0,
  );
  const dimensionalWeightKg = input.packages.reduce(
    (sum, shipmentPackage) => sum + getDimensionalWeight(shipmentPackage),
    0,
  );
  const chargeableWeightKg = Math.max(MINIMUM_CHARGEABLE_KG, actualWeightKg, dimensionalWeightKg);
  const packageValue = input.packages.reduce(
    (sum, shipmentPackage) => sum + (shipmentPackage.declaredValue ?? 0),
    0,
  );
  const rate = modeRate[input.mode] * priorityMultiplier[input.priority];
  const lineHaul = money(BASE_PARCEL_FEE + chargeableWeightKg * rate);
  const fragileFee = money(
    input.packages.filter((shipmentPackage) => shipmentPackage.fragile).length *
      FRAGILE_HANDLING_FEE,
  );
  const hazardousFee = money(
    input.packages.filter((shipmentPackage) => shipmentPackage.hazardous).length *
      HAZARDOUS_HANDLING_FEE,
  );
  const signatureFee = options.signatureRequired ? SIGNATURE_FEE : 0;
  const insuranceFee = options.insuranceRequested ? money(packageValue * INSURANCE_RATE) : 0;
  const fuelSurcharge = money(lineHaul * FUEL_SURCHARGE_RATE);
  const subtotal = money(
    lineHaul + fragileFee + hazardousFee + signatureFee + insuranceFee + fuelSurcharge,
  );
  const taxTotal = money(subtotal * TAX_RATE);
  const total = money(subtotal + taxTotal);

  return {
    actualWeightKg: weight(actualWeightKg),
    chargeableWeightKg: weight(chargeableWeightKg),
    currency: input.packages[0]?.currency ?? "USD",
    dimensionalWeightKg: weight(dimensionalWeightKg),
    fragileFee,
    fuelSurcharge,
    hazardousFee,
    insuranceFee,
    lineHaul,
    packageCount: input.packages.length,
    signatureFee,
    subtotal,
    taxTotal,
    total,
  };
}
