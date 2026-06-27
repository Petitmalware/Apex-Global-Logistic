export const aiProviderValues = ["gemini", "groq", "local", "openai", "openrouter"] as const;

export const aiToneValues = [
  "concise",
  "empathetic",
  "executive",
  "operational",
  "professional",
] as const;

export const aiSearchScopeValues = ["all", "shipments", "tickets"] as const;

export const aiTaskLabels = {
  customerSupport: "AI customer support",
  emailDraft: "Email drafting",
  notificationDraft: "Notification writing",
  semanticSearch: "Semantic search",
  shipmentRisk: "Shipment risk detection",
  shipmentSummary: "Shipment summary",
} as const;
