import "server-only";
import { AiMessageRole, Prisma } from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type { AiTextResult } from "@/features/ai/types";
import { prisma } from "@/lib/db";

type RecordAiInteractionInput = {
  input: string;
  metadata?: Record<string, unknown>;
  output: AiTextResult;
  shipmentId?: string;
  task: string;
  user: AuthSessionUser;
};

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

export async function recordAiInteraction({
  input,
  metadata,
  output,
  shipmentId,
  task,
  user,
}: RecordAiInteractionInput) {
  try {
    const conversation = await prisma.aiConversation.create({
      data: {
        messages: {
          create: [
            {
              content: input,
              metadata: toJson({ task }),
              role: AiMessageRole.USER,
            },
            {
              content: output.text,
              metadata: toJson({
                fallbackReason: output.fallbackReason,
                model: output.model,
                provider: output.provider,
                task,
              }),
              role: AiMessageRole.ASSISTANT,
              tokensUsed: output.tokensUsed,
            },
          ],
        },
        metadata: toJson({
          ...metadata,
          provider: output.provider,
          task,
        }),
        modelName: output.model,
        organizationId: user.organizationId,
        shipmentId,
        title: task,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    return conversation.id;
  } catch (error) {
    console.error("AI audit log failed", error);
    return null;
  }
}
