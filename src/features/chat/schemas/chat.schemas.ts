import { ChatConversationStatus } from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const optionalString = (max = 255) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const requiredString = (label: string, max = 2000) =>
  z.string().trim().min(1, `${label} is required.`).max(max);

const optionalMessage = (max = 2000) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().trim().email("Enter a valid email address.").max(255).optional(),
);

export const startChatConversationSchema = z.object({
  email: optionalEmail,
  message: optionalMessage(2000),
  name: optionalString(160),
  phone: optionalString(40),
  subject: optionalString(200),
  trackingReference: optionalString(120),
});

export const publicChatMessageSchema = z.object({
  accessKey: requiredString("Access key", 160),
  body: optionalMessage(2000),
});

export const staffChatMessageSchema = z.object({
  body: optionalMessage(4000),
});

export const chatStatusSchema = z.object({
  status: z.nativeEnum(ChatConversationStatus),
});

export const chatAiDraftSchema = z.object({
  context: optionalString(1000),
});

export type StartChatConversationInput = z.infer<typeof startChatConversationSchema>;
export type PublicChatMessageInput = z.infer<typeof publicChatMessageSchema>;
export type StaffChatMessageInput = z.infer<typeof staffChatMessageSchema>;
export type ChatStatusInput = z.infer<typeof chatStatusSchema>;
export type ChatAiDraftInput = z.infer<typeof chatAiDraftSchema>;
