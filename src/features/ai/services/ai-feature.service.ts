import "server-only";

import { AUTH_ROLES } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { hasPermission, PERMISSIONS } from "@/lib/auth/rbac";
import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import {
  aiEmailDraftRequestSchema,
  aiNotificationDraftRequestSchema,
  aiSemanticSearchRequestSchema,
  aiShipmentRiskRequestSchema,
  aiShipmentSummaryRequestSchema,
  aiSupportRequestSchema,
  type AiEmailDraftRequestInput,
  type AiNotificationDraftRequestInput,
  type AiSemanticSearchRequestInput,
  type AiShipmentRiskRequestInput,
  type AiShipmentSummaryRequestInput,
  type AiSupportRequestInput,
} from "@/features/ai/schemas/ai.schemas";
import { recordAiInteraction } from "@/features/ai/services/ai-audit.service";
import { generateAiText } from "@/features/ai/services/ai-provider.service";
import type { AiSemanticSearchResult, AiTextResult, ShipmentRiskResult } from "@/features/ai/types";
import { sanitizeEmailHtml } from "@/features/emails/services/email-sanitizer";
import {
  getShipmentForUser,
  getShipmentsForUser,
} from "@/features/shipments/queries/shipment.queries";
import type { ShipmentDetail, ShipmentListItem } from "@/features/shipments/types";
import { env } from "@/config/env.server";
import { prisma } from "@/lib/db";

const APEX_SYSTEM_PROMPT =
  "You are Apex AI, a careful logistics assistant for Apex Global Logistics. Use only the provided context, avoid guessing, keep customer-facing language professional, and call out when a human operations review is needed.";

function ensureText(result: AiTextResult, fallback: string): AiTextResult {
  return {
    ...result,
    text: result.text.trim() || fallback,
  };
}

function formatAddress(address: ShipmentDetail["origin"]) {
  return [
    address.name,
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.countryCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatShipmentContext(shipment: ShipmentDetail) {
  const latestEvents = shipment.timeline
    .slice(0, 6)
    .map((event) =>
      [
        event.occurredAt,
        event.eventType,
        event.shipmentStatus ? `status ${event.shipmentStatus}` : null,
        event.packageNumber ? `package ${event.packageNumber}` : null,
        event.message,
      ]
        .filter(Boolean)
        .join(" | "),
    )
    .join("\n");
  const packageSummary = shipment.packages
    .map((shipmentPackage) =>
      [
        shipmentPackage.packageNumber,
        shipmentPackage.type,
        shipmentPackage.status,
        shipmentPackage.weightKg ? `${shipmentPackage.weightKg}kg` : null,
        shipmentPackage.fragile ? "fragile" : null,
        shipmentPackage.hazardous ? "hazardous" : null,
      ]
        .filter(Boolean)
        .join(" "),
    )
    .join("; ");

  return [
    `Shipment: ${shipment.shipmentNumber}`,
    shipment.referenceNumber ? `Reference: ${shipment.referenceNumber}` : null,
    `Status: ${shipment.status}`,
    `Priority: ${shipment.priority}`,
    `Mode: ${shipment.mode}`,
    shipment.serviceLevel ? `Service level: ${shipment.serviceLevel}` : null,
    `Route: ${shipment.originCity} to ${shipment.destinationCity}`,
    `Origin address: ${formatAddress(shipment.origin)}`,
    `Destination address: ${formatAddress(shipment.destination)}`,
    shipment.pickupWindowStart || shipment.pickupWindowEnd
      ? `Pickup window: ${shipment.pickupWindowStart ?? "unknown"} to ${shipment.pickupWindowEnd ?? "unknown"}`
      : null,
    shipment.deliveryWindowStart || shipment.deliveryWindowEnd
      ? `Delivery window: ${shipment.deliveryWindowStart ?? "unknown"} to ${shipment.deliveryWindowEnd ?? "unknown"}`
      : null,
    shipment.notes ? `Internal notes: ${shipment.notes}` : null,
    `Packages: ${packageSummary || "No package detail recorded."}`,
    `Weight summary: actual ${shipment.weightSummary.actualWeightKg}kg, dimensional ${shipment.weightSummary.dimensionalWeightKg}kg, chargeable ${shipment.weightSummary.chargeableWeightKg}kg`,
    shipment.invoice
      ? `Invoice: ${shipment.invoice.invoiceNumber} ${shipment.invoice.status}`
      : null,
    `Documents: ${shipment.documents.length}`,
    latestEvents ? `Latest timeline:\n${latestEvents}` : "Latest timeline: No events recorded.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function getRequiredShipment(shipmentId: string, user: AuthSessionUser) {
  const shipment = await getShipmentForUser(shipmentId, user);

  if (!shipment) {
    throw new AuthError("Shipment not found or unavailable.", 404, "SHIPMENT_NOT_FOUND");
  }

  return shipment;
}

function buildPrompt(title: string, context: string, request: string) {
  return `${title}\n\nContext:\n${context}\n\nRequest:\n${request}`;
}

export async function answerCustomerSupport(input: AiSupportRequestInput, user: AuthSessionUser) {
  const data = aiSupportRequestSchema.parse(input);
  const shipment = data.shipmentId ? await getRequiredShipment(data.shipmentId, user) : null;
  const context = [
    data.context ? `Extra context: ${data.context}` : null,
    shipment ? formatShipmentContext(shipment) : "No shipment was attached.",
  ]
    .filter(Boolean)
    .join("\n\n");
  const prompt = buildPrompt(
    "Prepare a helpful customer support answer. Include next steps and any needed escalation.",
    context,
    data.message,
  );
  const output = ensureText(
    await generateAiText({
      maxTokens: 800,
      messages: [
        { content: APEX_SYSTEM_PROMPT, role: "system" },
        { content: prompt, role: "user" },
      ],
      task: "customer-support",
      temperature: 0.25,
    }),
    "Apex support should review the latest shipment timeline and respond with the confirmed next step.",
  );
  const conversationId = await recordAiInteraction({
    input: prompt,
    metadata: { conversationId: data.conversationId },
    output,
    shipmentId: data.shipmentId,
    task: "customer-support",
    user,
  });

  return {
    answer: output.text,
    conversationId,
    fallbackReason: output.fallbackReason,
    model: output.model,
    provider: output.provider,
  };
}

export async function summarizeShipment(
  input: AiShipmentSummaryRequestInput,
  user: AuthSessionUser,
) {
  const data = aiShipmentSummaryRequestSchema.parse(input);
  const shipment = await getRequiredShipment(data.shipmentId, user);
  const context = formatShipmentContext(shipment);
  const prompt = buildPrompt(
    "Summarize this shipment for a logistics dashboard. Include status, route, package profile, latest milestone, exceptions, and next action.",
    context,
    data.focus ?? "Create a concise operations summary.",
  );
  const output = ensureText(
    await generateAiText({
      maxTokens: 800,
      messages: [
        { content: APEX_SYSTEM_PROMPT, role: "system" },
        { content: prompt, role: "user" },
      ],
      task: "shipment-summary",
      temperature: 0.2,
    }),
    `${shipment.shipmentNumber} is ${shipment.status} from ${shipment.originCity} to ${shipment.destinationCity}. Review the timeline for the latest operational milestone.`,
  );
  const conversationId = await recordAiInteraction({
    input: prompt,
    output,
    shipmentId: data.shipmentId,
    task: "shipment-summary",
    user,
  });

  return {
    conversationId,
    fallbackReason: output.fallbackReason,
    model: output.model,
    provider: output.provider,
    summary: output.text,
  };
}

export async function draftNotification(
  input: AiNotificationDraftRequestInput,
  user: AuthSessionUser,
) {
  const data = aiNotificationDraftRequestSchema.parse(input);
  const prompt = buildPrompt(
    "Write a short logistics notification. Return a polished customer-safe message, not JSON.",
    `Audience: ${data.audience ?? "Apex logistics user"}\nTone: ${data.tone}`,
    data.context,
  );
  const output = ensureText(
    await generateAiText({
      maxTokens: 350,
      messages: [
        { content: APEX_SYSTEM_PROMPT, role: "system" },
        { content: prompt, role: "user" },
      ],
      task: "notification-draft",
      temperature: 0.35,
    }),
    "Your Apex Global Logistics shipment has a new update. Please review the latest timeline for details.",
  );
  const conversationId = await recordAiInteraction({
    input: prompt,
    output,
    task: "notification-draft",
    user,
  });

  return {
    body: output.text,
    conversationId,
    fallbackReason: output.fallbackReason,
    model: output.model,
    provider: output.provider,
    title: "Apex logistics update",
  };
}

function textToEmailHtml(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return sanitizeEmailHtml(
    paragraphs.length
      ? paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")
      : "<p>Thank you for choosing Apex Global Logistics.</p>",
  );
}

function buildSubject(text: string, fallback?: string) {
  if (fallback?.trim()) {
    return fallback.trim();
  }

  const firstSentence = text.replace(/\s+/g, " ").split(/[.!?]/)[0]?.trim();

  return firstSentence && firstSentence.length >= 8
    ? firstSentence.slice(0, 90)
    : "Apex Global Logistics update";
}

export async function draftEmail(input: AiEmailDraftRequestInput, user: AuthSessionUser) {
  const data = aiEmailDraftRequestSchema.parse(input);
  const shipment = data.shipmentId ? await getRequiredShipment(data.shipmentId, user) : null;
  const prompt = buildPrompt(
    "Improve this rough admin email for a branded Apex Global Logistics email. Keep the meaning, make it professional, and do not add promises that are not in the context.",
    [
      `Tone: ${data.tone}`,
      data.category ? `Category: ${data.category}` : null,
      data.recipientName ? `Recipient: ${data.recipientName}` : null,
      shipment ? formatShipmentContext(shipment) : null,
    ]
      .filter(Boolean)
      .join("\n"),
    data.roughText,
  );
  const output = ensureText(
    await generateAiText({
      maxTokens: 900,
      messages: [
        { content: APEX_SYSTEM_PROMPT, role: "system" },
        { content: prompt, role: "user" },
      ],
      task: "email-draft",
      temperature: 0.35,
    }),
    data.roughText,
  );
  const conversationId = await recordAiInteraction({
    input: prompt,
    output,
    shipmentId: data.shipmentId,
    task: "email-draft",
    user,
  });

  return {
    bodyHtml: textToEmailHtml(output.text),
    bodyText: output.text,
    conversationId,
    fallbackReason: output.fallbackReason,
    model: output.model,
    provider: output.provider,
    subject: buildSubject(output.text, data.subject),
  };
}

function tokenize(value: string) {
  const synonymGroups: Record<string, string[]> = {
    customs: ["hold", "held", "clearance", "border"],
    delay: ["delayed", "late", "behind", "exception", "held"],
    delivery: ["delivered", "out", "dropoff", "destination"],
    freight: ["cargo", "container", "pallet", "machinery"],
    invoice: ["payment", "billing", "paid", "due"],
    pet: ["animal", "crate", "vaccine", "health"],
    pickup: ["collection", "origin", "booked"],
  };
  const baseTokens = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
  const tokens = new Set(baseTokens);

  for (const token of baseTokens) {
    for (const [key, synonyms] of Object.entries(synonymGroups)) {
      if (token === key || synonyms.includes(token)) {
        tokens.add(key);
        synonyms.forEach((synonym) => tokens.add(synonym));
      }
    }
  }

  return [...tokens];
}

function scoreText(text: string, tokens: string[]) {
  const normalized = text.toLowerCase();
  return tokens.reduce((score, token) => {
    if (normalized.includes(token)) {
      return score + (token.length > 5 ? 2 : 1);
    }

    return score;
  }, 0);
}

function shipmentSearchText(shipment: ShipmentListItem) {
  return [
    shipment.shipmentNumber,
    shipment.referenceNumber,
    shipment.status,
    shipment.priority,
    shipment.mode,
    shipment.originCity,
    shipment.destinationCity,
    shipment.recipientName,
    shipment.recipientEmail,
    `${shipment.packageCount} packages`,
  ]
    .filter(Boolean)
    .join(" ");
}

function canReadOrganizationSupport(user: AuthSessionUser) {
  return (
    user.roles.includes(AUTH_ROLES.SUPER_ADMIN) ||
    user.roles.includes(AUTH_ROLES.ADMIN) ||
    user.roles.includes(AUTH_ROLES.SUPPORT) ||
    hasPermission(user, PERMISSIONS.SUPPORT_MANAGE)
  );
}

function supportTicketWhere(user: AuthSessionUser) {
  if (user.roles.includes(AUTH_ROLES.SUPER_ADMIN)) {
    return {};
  }

  if (canReadOrganizationSupport(user) && user.organizationId) {
    return {
      organizationId: user.organizationId,
    };
  }

  return {
    requesterId: user.id,
  };
}

export async function semanticSearch(input: AiSemanticSearchRequestInput, user: AuthSessionUser) {
  const data = aiSemanticSearchRequestSchema.parse(input);
  const expansion = await generateAiText({
    maxTokens: 120,
    messages: [
      {
        content:
          "Expand this logistics search query with concise related terms only. Do not answer the query.",
        role: "system",
      },
      { content: data.query, role: "user" },
    ],
    task: "semantic-search-expansion",
    temperature: 0.1,
  });
  const tokens = tokenize(`${data.query} ${expansion.text}`);
  const limit = data.limit ?? env.AI_SEMANTIC_SEARCH_LIMIT;
  const results: AiSemanticSearchResult[] = [];

  if (data.scope === "all" || data.scope === "shipments") {
    const shipments = await getShipmentsForUser(user);

    for (const shipment of shipments) {
      const text = shipmentSearchText(shipment);
      const score = scoreText(text, tokens);

      if (score > 0) {
        results.push({
          description: `${shipment.originCity} to ${shipment.destinationCity}. ${shipment.packageCount} package${shipment.packageCount === 1 ? "" : "s"}.`,
          href: `/shipments/${shipment.id}`,
          id: shipment.id,
          meta: `${shipment.status} / ${shipment.priority} / ${shipment.mode}`,
          score,
          title: shipment.shipmentNumber,
          type: "shipment",
        });
      }
    }
  }

  if (data.scope === "all" || data.scope === "tickets") {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            body: true,
          },
          take: 3,
          where: {
            isInternal: false,
          },
        },
        shipment: {
          select: {
            shipmentNumber: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 50,
      where: supportTicketWhere(user),
    });

    for (const ticket of tickets) {
      const text = [
        ticket.ticketNumber,
        ticket.subject,
        ticket.description,
        ticket.priority,
        ticket.status,
        ticket.shipment?.shipmentNumber,
        ...ticket.messages.map((message) => message.body),
      ]
        .filter(Boolean)
        .join(" ");
      const score = scoreText(text, tokens);

      if (score > 0) {
        results.push({
          description: ticket.description ?? "Support ticket conversation",
          href: "/support",
          id: ticket.id,
          meta: `${ticket.status} / ${ticket.priority}`,
          score,
          title: ticket.ticketNumber,
          type: "support_ticket",
        });
      }
    }
  }

  const rankedResults = results.sort((a, b) => b.score - a.score).slice(0, limit);
  const output = ensureText(
    {
      ...expansion,
      text: `Semantic search for "${data.query}" returned ${rankedResults.length} result${rankedResults.length === 1 ? "" : "s"}.`,
    },
    "Semantic search completed.",
  );
  const conversationId = await recordAiInteraction({
    input: data.query,
    metadata: { resultCount: rankedResults.length, scope: data.scope },
    output,
    task: "semantic-search",
    user,
  });

  return {
    conversationId,
    fallbackReason: expansion.fallbackReason,
    model: expansion.model,
    provider: expansion.provider,
    results: rankedResults,
  };
}

function addRisk(
  factors: string[],
  recommendations: string[],
  amount: number,
  factor: string,
  recommendation: string,
) {
  factors.push(factor);
  recommendations.push(recommendation);
  return amount;
}

function getRiskLevel(score: number): ShipmentRiskResult["level"] {
  if (score >= 80) {
    return "critical";
  }

  if (score >= 55) {
    return "high";
  }

  if (score >= 25) {
    return "medium";
  }

  return "low";
}

function calculateShipmentRisk(shipment: ShipmentDetail) {
  const factors: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  const latestEvent = shipment.timeline[0];
  const latestEventAt = latestEvent?.occurredAt ? new Date(latestEvent.occurredAt) : null;
  const now = new Date();

  if (shipment.status === "CANCELLED" || shipment.status === "RETURNED") {
    score += addRisk(
      factors,
      recommendations,
      85,
      `Shipment status is ${shipment.status}.`,
      "Escalate to operations and notify the customer with the recovery or refund path.",
    );
  } else if (shipment.status === "HELD") {
    score += addRisk(
      factors,
      recommendations,
      40,
      "Shipment is currently held.",
      "Review hold reason, required documents, and owner assignment.",
    );
  }

  if (latestEvent && ["CUSTOMS_HOLD", "DELAYED", "EXCEPTION"].includes(latestEvent.eventType)) {
    score += addRisk(
      factors,
      recommendations,
      25,
      `Latest event is ${latestEvent.eventType}.`,
      "Create a customer-safe update and assign an exception owner.",
    );
  }

  if (shipment.deliveryWindowEnd && shipment.status !== "DELIVERED") {
    const deliveryDeadline = new Date(shipment.deliveryWindowEnd);

    if (deliveryDeadline < now) {
      score += addRisk(
        factors,
        recommendations,
        30,
        "Delivery window has passed without delivery.",
        "Recalculate ETA and alert support before the customer follows up.",
      );
    }
  }

  if (shipment.pickupWindowEnd && ["BOOKED", "DRAFT", "PENDING_PICKUP"].includes(shipment.status)) {
    const pickupDeadline = new Date(shipment.pickupWindowEnd);

    if (pickupDeadline < now) {
      score += addRisk(
        factors,
        recommendations,
        20,
        "Pickup window has passed without an in-transit scan.",
        "Confirm pickup completion with the assigned station or driver.",
      );
    }
  }

  if (latestEventAt && shipment.status !== "DELIVERED") {
    const hoursSinceLastEvent = (now.getTime() - latestEventAt.getTime()) / 36e5;

    if (hoursSinceLastEvent > 48) {
      score += addRisk(
        factors,
        recommendations,
        18,
        "No shipment milestone has been recorded in over 48 hours.",
        "Request a warehouse or carrier check-in and refresh the public timeline.",
      );
    }
  }

  if (shipment.priority === "URGENT" && shipment.status !== "DELIVERED") {
    score += addRisk(
      factors,
      recommendations,
      12,
      "Urgent shipment is still active.",
      "Keep dispatch and support aligned on the next milestone.",
    );
  }

  if (shipment.packages.some((shipmentPackage) => shipmentPackage.hazardous)) {
    score += addRisk(
      factors,
      recommendations,
      10,
      "One or more packages are marked hazardous.",
      "Verify handling documents and carrier restrictions before the next handoff.",
    );
  }

  if (!shipment.documents.length && shipment.mode !== "ROAD") {
    score += addRisk(
      factors,
      recommendations,
      8,
      "No shipment documents are attached for a non-road move.",
      "Attach airway, sea, rail, customs, or compliance documents as applicable.",
    );
  }

  if (!factors.length) {
    factors.push("No major operational risk signals detected from the available data.");
    recommendations.push("Continue monitoring the next scheduled tracking milestone.");
  }

  const boundedScore = Math.min(100, score);

  return {
    factors,
    lastEventAt: latestEvent?.occurredAt ?? null,
    level: getRiskLevel(boundedScore),
    recommendations: [...new Set(recommendations)].slice(0, 5),
    score: boundedScore,
  };
}

export async function detectShipmentRisk(
  input: AiShipmentRiskRequestInput,
  user: AuthSessionUser,
): Promise<ShipmentRiskResult> {
  const data = aiShipmentRiskRequestSchema.parse(input);
  const shipment = await getRequiredShipment(data.shipmentId, user);
  const calculated = calculateShipmentRisk(shipment);
  const prompt = buildPrompt(
    "Explain the shipment risk assessment for an operations dashboard. Keep it concise and action oriented.",
    formatShipmentContext(shipment),
    `Calculated risk level: ${calculated.level}. Score: ${calculated.score}. Factors: ${calculated.factors.join(" ")}`,
  );
  const output = ensureText(
    await generateAiText({
      maxTokens: 500,
      messages: [
        { content: APEX_SYSTEM_PROMPT, role: "system" },
        { content: prompt, role: "user" },
      ],
      task: "shipment-risk",
      temperature: 0.2,
    }),
    `${shipment.shipmentNumber} has ${calculated.level} risk based on its current status, latest event, schedule windows, package profile, and document state.`,
  );
  const conversationId = await recordAiInteraction({
    input: prompt,
    output,
    shipmentId: data.shipmentId,
    task: "shipment-risk",
    user,
  });

  return {
    ...calculated,
    conversationId,
    model: output.model,
    provider: output.provider,
    summary: output.text,
  };
}
