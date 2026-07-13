import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const optionalString = (max = 255) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

export const companyProfileSchema = z.object({
  addressLine1: optionalString(255),
  addressLine2: optionalString(255),
  businessHours: optionalString(160),
  city: optionalString(120),
  country: optionalString(120),
  email: optionalString(255),
  phone: optionalString(80),
  postalCode: optionalString(40),
  state: optionalString(120),
  taxId: optionalString(80),
  website: optionalString(255),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
