import "server-only";

import { env } from "@/config/env.server";
import type { AiProvider, AiTextRequest, AiTextResult } from "@/features/ai/types";

type ProviderConfig = {
  apiKey?: string;
  baseUrl?: string;
  model: string;
  provider: AiProvider;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
  usage?: {
    total_tokens?: number;
  };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
  usageMetadata?: {
    totalTokenCount?: number;
  };
};

function getProviderConfig(): ProviderConfig {
  switch (env.AI_PROVIDER) {
    case "gemini":
      return {
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
        provider: "gemini",
      };
    case "groq":
      return {
        apiKey: env.GROQ_API_KEY,
        baseUrl: env.GROQ_BASE_URL,
        model: env.GROQ_MODEL,
        provider: "groq",
      };
    case "openai":
      return {
        apiKey: env.OPENAI_API_KEY,
        baseUrl: env.OPENAI_BASE_URL,
        model: env.OPENAI_MODEL,
        provider: "openai",
      };
    case "openrouter":
      return {
        apiKey: env.OPENROUTER_API_KEY,
        baseUrl: env.OPENROUTER_BASE_URL,
        model: env.OPENROUTER_MODEL,
        provider: "openrouter",
      };
    case "local":
    default:
      return {
        model: "local-deterministic-v1",
        provider: "local",
      };
  }
}

function getLastUserMessage(input: AiTextRequest) {
  return [...input.messages].reverse().find((message) => message.role === "user")?.content ?? "";
}

function buildLocalText(input: AiTextRequest, fallbackReason?: string): AiTextResult {
  const request = getLastUserMessage(input);
  const reason = fallbackReason ? `\n\nProvider note: ${fallbackReason}` : "";

  if (input.task.includes("support")) {
    return {
      fallbackReason,
      model: "local-deterministic-v1",
      provider: "local",
      text:
        "Thanks for reaching out to Apex Global Logistics. Based on the available shipment and account context, the best next step is to verify the latest tracking milestone, confirm whether any delivery window or customs exception is present, and keep the customer updated with a clear ETA or escalation path." +
        `\n\nCustomer context: ${request.slice(0, 700)}${reason}`,
    };
  }

  if (input.task.includes("email")) {
    return {
      fallbackReason,
      model: "local-deterministic-v1",
      provider: "local",
      text:
        "Thank you for choosing Apex Global Logistics. We wanted to share a clear update regarding your logistics request and confirm that our team is actively monitoring the next handoff. We will continue to keep you informed and will follow up promptly if any action is needed from your side." +
        `\n\nOriginal note: ${request.slice(0, 700)}${reason}`,
    };
  }

  if (input.task.includes("notification")) {
    return {
      fallbackReason,
      model: "local-deterministic-v1",
      provider: "local",
      text:
        "Apex Global Logistics update: your shipment activity has changed. Please review the latest timeline details and contact support if you need help with the next step." +
        `\n\nContext: ${request.slice(0, 700)}${reason}`,
    };
  }

  return {
    fallbackReason,
    model: "local-deterministic-v1",
    provider: "local",
    text:
      "Apex AI prepared an operational summary from the available logistics context. Review the current status, latest milestone, known exceptions, route details, and recommended next action before sharing externally." +
      `\n\nContext: ${request.slice(0, 900)}${reason}`,
  };
}

function createTimeoutSignal() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AI_REQUEST_TIMEOUT_MS);

  return {
    cancel: () => clearTimeout(timeout),
    signal: controller.signal,
  };
}

function assertConfigured(config: ProviderConfig) {
  if (config.provider === "local" || config.apiKey) {
    return;
  }

  if (env.APP_ENV === "production") {
    throw new Error(`AI provider ${config.provider} is missing its API key.`);
  }
}

async function generateChatCompletion(input: AiTextRequest, config: ProviderConfig) {
  const timeout = createTimeoutSignal();

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      body: JSON.stringify({
        max_tokens: input.maxTokens ?? 900,
        messages: input.messages,
        model: config.model,
        temperature: input.temperature ?? 0.3,
      }),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(config.provider === "openrouter"
          ? {
              "HTTP-Referer": env.NEXT_PUBLIC_APP_URL,
              "X-Title": "Apex Global Logistics",
            }
          : {}),
      },
      method: "POST",
      signal: timeout.signal,
    });
    const json = (await response.json().catch(() => null)) as ChatCompletionResponse | null;

    if (!response.ok) {
      throw new Error(json?.error?.message ?? `AI provider returned ${response.status}.`);
    }

    return {
      model: config.model,
      provider: config.provider,
      text: json?.choices?.[0]?.message?.content?.trim() ?? "",
      tokensUsed: json?.usage?.total_tokens,
    } satisfies AiTextResult;
  } finally {
    timeout.cancel();
  }
}

async function generateGemini(input: AiTextRequest, config: ProviderConfig) {
  const timeout = createTimeoutSignal();
  const systemInstruction = input.messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const contents = input.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      parts: [{ text: message.content }],
      role: message.role === "assistant" ? "model" : "user",
    }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
      {
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: input.maxTokens ?? 900,
            temperature: input.temperature ?? 0.3,
          },
          ...(systemInstruction
            ? {
                systemInstruction: {
                  parts: [{ text: systemInstruction }],
                },
              }
            : {}),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: timeout.signal,
      },
    );
    const json = (await response.json().catch(() => null)) as GeminiResponse | null;

    if (!response.ok) {
      throw new Error(json?.error?.message ?? `AI provider returned ${response.status}.`);
    }

    return {
      model: config.model,
      provider: config.provider,
      text:
        json?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text)
          .filter(Boolean)
          .join("")
          .trim() ?? "",
      tokensUsed: json?.usageMetadata?.totalTokenCount,
    } satisfies AiTextResult;
  } finally {
    timeout.cancel();
  }
}

export async function generateAiText(input: AiTextRequest): Promise<AiTextResult> {
  const config = getProviderConfig();

  assertConfigured(config);

  if (config.provider === "local") {
    return buildLocalText(input);
  }

  if (!config.apiKey) {
    return buildLocalText(input, `Missing ${config.provider} API key.`);
  }

  try {
    if (config.provider === "gemini") {
      return await generateGemini(input, config);
    }

    return await generateChatCompletion(input, config);
  } catch (error) {
    if (env.APP_ENV === "production") {
      throw error;
    }

    return buildLocalText(
      input,
      error instanceof Error ? error.message : "Provider request failed.",
    );
  }
}
