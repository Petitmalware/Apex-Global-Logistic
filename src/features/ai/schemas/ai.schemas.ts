import { z } from "zod";

import { aiSearchScopeValues, aiToneValues } from "@/features/ai/constants";

const optionalUuidSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.string().uuid().optional());

export const aiSupportRequestSchema = z.object({
  context: z.string().trim().max(2000).optional(),
  conversationId: optionalUuidSchema,
  message: z.string().trim().min(3, "Add a support question.").max(4000),
  shipmentId: optionalUuidSchema,
});

export const aiShipmentSummaryRequestSchema = z.object({
  focus: z.string().trim().max(1000).optional(),
  shipmentId: z.string().trim().uuid("Choose a shipment."),
});

export const aiNotificationDraftRequestSchema = z.object({
  audience: z.string().trim().max(160).optional(),
  context: z.string().trim().min(3, "Add notification context.").max(3000),
  tone: z.enum(aiToneValues).default("operational"),
});

export const aiEmailDraftRequestSchema = z.object({
  category: z.string().trim().max(80).optional(),
  recipientName: z.string().trim().max(160).optional(),
  roughText: z.string().trim().min(3, "Add rough email text.").max(5000),
  shipmentId: optionalUuidSchema,
  subject: z.string().trim().max(255).optional(),
  tone: z.enum(aiToneValues).default("professional"),
});

export const aiSemanticSearchRequestSchema = z.object({
  limit: z.coerce.number().int().positive().max(25).optional(),
  query: z.string().trim().min(2, "Add a search query.").max(240),
  scope: z.enum(aiSearchScopeValues).default("all"),
});

export const aiShipmentRiskRequestSchema = z.object({
  shipmentId: z.string().trim().uuid("Choose a shipment."),
});

export type AiEmailDraftRequestInput = z.infer<typeof aiEmailDraftRequestSchema>;
export type AiNotificationDraftRequestInput = z.infer<typeof aiNotificationDraftRequestSchema>;
export type AiSemanticSearchRequestInput = z.infer<typeof aiSemanticSearchRequestSchema>;
export type AiShipmentRiskRequestInput = z.infer<typeof aiShipmentRiskRequestSchema>;
export type AiShipmentSummaryRequestInput = z.infer<typeof aiShipmentSummaryRequestSchema>;
export type AiSupportRequestInput = z.infer<typeof aiSupportRequestSchema>;
