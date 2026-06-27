import { z } from "zod";

import { emailCategoryValues, emailVariableKeys } from "@/features/emails/constants";

const optionalUuidSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.string().uuid().optional());

const optionalEmailSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value.toLowerCase() : undefined))
  .pipe(z.string().email().optional());

export const emailCategorySchema = z.enum(emailCategoryValues);

export const emailVariablesSchema = z.object(
  Object.fromEntries(emailVariableKeys.map((key) => [key, z.string().trim().optional()])) as Record<
    (typeof emailVariableKeys)[number],
    z.ZodOptional<z.ZodString>
  >,
);

const adminEmailComposerBaseSchema = z.object({
  bodyHtml: z.string().trim().min(1, "Write an email body."),
  category: emailCategorySchema.default("MANUAL"),
  recipientEmail: optionalEmailSchema,
  recipientName: z.string().trim().max(160).optional(),
  recipientUserId: optionalUuidSchema,
  shipmentId: optionalUuidSchema,
  subject: z.string().trim().min(3, "Add a subject.").max(255),
  templateId: optionalUuidSchema,
  trackingNumber: z.string().trim().max(120).optional(),
  variables: emailVariablesSchema.partial().default({}),
});

export const adminEmailComposerSchema = adminEmailComposerBaseSchema.refine(
  (value) => value.recipientEmail || value.recipientUserId,
  {
    message: "Choose a recipient or enter an email address.",
    path: ["recipientEmail"],
  },
);

export const adminEmailTestSchema = adminEmailComposerBaseSchema
  .extend({
    testRecipientEmail: z.string().trim().email("Enter a test recipient email."),
  })
  .refine((value) => value.recipientEmail || value.recipientUserId || value.testRecipientEmail, {
    message: "Choose a recipient or enter an email address.",
    path: ["recipientEmail"],
  });

export const emailTemplateFormSchema = z.object({
  bodyHtml: z.string().trim().min(1, "Template body is required."),
  category: emailCategorySchema,
  isActive: z.boolean().default(false),
  name: z.string().trim().min(2, "Template name is required.").max(160),
  preheader: z.string().trim().max(255).optional(),
  subject: z.string().trim().min(3, "Template subject is required.").max(255),
  variables: z.array(z.string().trim()).default([]),
});

export const aiImproveEmailSchema = z.object({
  bodyHtml: z.string().trim().min(1),
});

export type AdminEmailComposerInput = z.infer<typeof adminEmailComposerSchema>;
export type AdminEmailTestInput = z.infer<typeof adminEmailTestSchema>;
export type EmailTemplateFormInput = z.infer<typeof emailTemplateFormSchema>;
