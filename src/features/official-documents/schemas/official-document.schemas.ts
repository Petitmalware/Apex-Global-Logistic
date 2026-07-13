import { z } from "zod";

import { officialDocumentCategories } from "@/features/official-documents/data/default-official-document-templates";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const optionalString = (max = 500) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

export const officialDocumentTemplateSchema = z.object({
  amountDefault: optionalString(80),
  amountLabel: optionalString(120),
  body: z.string().trim().min(40, "Document body must be at least 40 characters."),
  category: z
    .string()
    .trim()
    .min(2, "Category is required.")
    .max(80)
    .refine((value) => officialDocumentCategories.includes(value as never), {
      message: "Choose a supported document category.",
    }),
  description: z.string().trim().min(10, "Description is required.").max(240),
  id: z.string().trim().min(2).max(120),
  isActive: z.boolean().default(true),
  paymentInstructions: optionalString(300),
  refundTerms: optionalString(300),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required.")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  subject: z.string().trim().min(4, "Subject is required.").max(180),
  title: z.string().trim().min(4, "Title is required.").max(140),
  variables: z.array(z.string().trim().min(1).max(80)).default([]),
});

export const officialDocumentTemplateCollectionSchema = z.array(officialDocumentTemplateSchema);

export type OfficialDocumentTemplateInput = z.infer<typeof officialDocumentTemplateSchema>;
