"use server";

import { revalidatePath } from "next/cache";

import { chatStatusSchema, staffChatMessageSchema } from "@/features/chat/schemas/chat.schemas";
import {
  addStaffChatMessage,
  updateChatConversationStatus,
} from "@/features/chat/services/chat.service";
import type { ChatActionState } from "@/features/chat/types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { requireRole } from "@/lib/auth/session";
import { getDatabaseUnavailableMessage, isDatabaseUnavailableError } from "@/lib/db-errors";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getFiles(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is File => value instanceof File);
}

function errorState(error: unknown): ChatActionState {
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

  return {
    message: "Chat action failed. Please try again.",
    status: "error",
  };
}

export async function sendStaffChatMessageAction(
  conversationId: string,
  previousState: ChatActionState,
  formData: FormData,
): Promise<ChatActionState> {
  void previousState;

  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const parsed = staffChatMessageSchema.safeParse({
    body: getString(formData, "body"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please enter a reply before sending.",
      status: "error",
    };
  }

  try {
    await addStaffChatMessage(conversationId, parsed.data, user, {
      attachments: getFiles(formData, "attachments"),
    });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/admin/chat");

  return {
    message: "Reply sent.",
    status: "success",
  };
}

export async function updateChatStatusAction(
  conversationId: string,
  formData: FormData,
): Promise<void> {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const parsed = chatStatusSchema.safeParse({
    status: getString(formData, "status"),
  });

  if (!parsed.success) {
    return;
  }

  await updateChatConversationStatus({
    conversationId,
    status: parsed.data.status,
    user,
  });
  revalidatePath("/admin/chat");
}
