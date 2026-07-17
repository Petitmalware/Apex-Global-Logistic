import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const optionalString = (max = 255) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalHttpUrl = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .max(500)
    .url()
    .refine((value) => /^https?:\/\//i.test(value), "Use a valid http or https URL.")
    .optional(),
);

export const companyProfileSchema = z.object({
  addressLine1: optionalString(255),
  addressLine2: optionalString(255),
  businessHours: optionalString(160),
  businessRegistryUrl: optionalHttpUrl,
  carrierLicenseNumber: optionalString(120),
  city: optionalString(120),
  country: optionalString(120),
  email: optionalString(255),
  legalName: optionalString(200),
  phone: optionalString(80),
  postalCode: optionalString(40),
  registrationAuthority: optionalString(200),
  registrationJurisdiction: optionalString(160),
  registrationNumber: optionalString(120),
  state: optionalString(120),
  taxId: optionalString(80),
  website: optionalString(255),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
