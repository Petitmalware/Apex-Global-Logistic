import type { aiProviderValues, aiSearchScopeValues, aiToneValues } from "@/features/ai/constants";

export type AiProvider = (typeof aiProviderValues)[number];
export type AiTone = (typeof aiToneValues)[number];
export type AiSearchScope = (typeof aiSearchScopeValues)[number];

export type AiMessageRole = "assistant" | "system" | "user";

export type AiTextMessage = {
  content: string;
  role: AiMessageRole;
};

export type AiTextRequest = {
  maxTokens?: number;
  messages: AiTextMessage[];
  task: string;
  temperature?: number;
};

export type AiTextResult = {
  fallbackReason?: string;
  model: string;
  provider: AiProvider;
  text: string;
  tokensUsed?: number;
};

export type AiLoggedResult = AiTextResult & {
  conversationId: string | null;
};

export type AiSemanticSearchResult = {
  description: string;
  href: string;
  id: string;
  meta: string;
  score: number;
  title: string;
  type: "shipment" | "support_ticket";
};

export type ShipmentRiskLevel = "critical" | "high" | "low" | "medium";

export type ShipmentRiskResult = {
  conversationId: string | null;
  factors: string[];
  lastEventAt: string | null;
  level: ShipmentRiskLevel;
  model: string;
  provider: AiProvider;
  recommendations: string[];
  score: number;
  summary: string;
};
