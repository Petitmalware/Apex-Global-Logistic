const KILOGRAMS_PER_POUND = 0.45359237;

function formatMeasurement(value: number) {
  return value.toFixed(3).replace(/\.?(?:0+)$/, "");
}

export function kilogramsToPounds(value: number) {
  return value / KILOGRAMS_PER_POUND;
}

export function poundsToKilograms(value: number) {
  return value * KILOGRAMS_PER_POUND;
}

export function kilogramsToPoundsString(value: string | null | undefined) {
  if (!value?.trim()) {
    return "";
  }

  const number = Number(value);
  return Number.isFinite(number) ? formatMeasurement(kilogramsToPounds(number)) : value;
}

export function poundsToKilogramsString(value: string | null | undefined) {
  if (!value?.trim()) {
    return "";
  }

  const number = Number(value);
  return Number.isFinite(number) ? formatMeasurement(poundsToKilograms(number)) : value;
}
