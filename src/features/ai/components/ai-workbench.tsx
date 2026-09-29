"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  BrainCircuit,
  Loader2,
  MailPlus,
  MessageSquareText,
  PackageSearch,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ShipmentListItem } from "@/features/shipments/types";
import { secureFetch } from "@/lib/security/client-fetch";

type ToolKey = "email" | "notification" | "risk" | "search" | "summary" | "support";

type ToolState = {
  data: Record<string, unknown> | null;
  error: string | null;
  isLoading: boolean;
};

type SearchResult = {
  description: string;
  href: string;
  id: string;
  meta: string;
  score: number;
  title: string;
  type: string;
};

type AiWorkbenchProps = {
  canDraftEmail: boolean;
  shipments: ShipmentListItem[];
};

const initialToolState: ToolState = {
  data: null,
  error: null,
  isLoading: false,
};

function getString(data: Record<string, unknown> | null, key: string) {
  const value = data?.[key];

  return typeof value === "string" ? value : "";
}

function getProviderMeta(data: Record<string, unknown> | null) {
  const provider = getString(data, "provider");
  const model = getString(data, "model");

  return [provider, model].filter(Boolean).join(" / ");
}

function ResultPanel({
  data,
  error,
  isLoading,
  primaryKey,
}: ToolState & {
  primaryKey: "answer" | "body" | "bodyText" | "summary";
}) {
  const text = getString(data, primaryKey);
  const providerMeta = getProviderMeta(data);

  return (
    <div className="border-border bg-surface min-h-32 rounded-lg border p-4">
      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Generating
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : text ? (
        <div className="space-y-3">
          {providerMeta ? <Badge variant="outline">{providerMeta}</Badge> : null}
          <p className="text-sm leading-6 whitespace-pre-wrap">{text}</p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No AI output yet.</p>
      )}
    </div>
  );
}

function SearchResults({ state }: { state: ToolState }) {
  const results = Array.isArray(state.data?.results) ? (state.data.results as SearchResult[]) : [];

  if (state.isLoading || state.error || !results.length) {
    return <ResultPanel {...state} primaryKey="summary" />;
  }

  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{getProviderMeta(state.data)}</Badge>
        <span className="text-muted-foreground text-xs">{results.length} matches</span>
      </div>
      <div className="grid gap-3">
        {results.map((result) => (
          <a
            className="border-border hover:bg-secondary/60 bg-background block rounded-md border p-3 transition-colors"
            href={result.href}
            key={result.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{result.title}</p>
              <Badge variant={result.type === "shipment" ? "info" : "accent"}>
                {result.type.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm leading-5">{result.description}</p>
            <p className="text-muted-foreground mt-2 text-xs">{result.meta}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

function RiskResults({ state }: { state: ToolState }) {
  const factors = Array.isArray(state.data?.factors) ? (state.data.factors as string[]) : [];
  const recommendations = Array.isArray(state.data?.recommendations)
    ? (state.data.recommendations as string[])
    : [];
  const score = typeof state.data?.score === "number" ? state.data.score : null;
  const level = getString(state.data, "level");
  const summary = getString(state.data, "summary");

  if (state.isLoading || state.error || !summary) {
    return <ResultPanel {...state} primaryKey="summary" />;
  }

  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant={level === "critical" || level === "high" ? "danger" : "success"}>
          {level || "risk"}
        </Badge>
        {score !== null ? <Badge variant="outline">{score}/100</Badge> : null}
        <Badge variant="outline">{getProviderMeta(state.data)}</Badge>
      </div>
      <p className="text-sm leading-6 whitespace-pre-wrap">{summary}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">Risk factors</p>
          <ul className="text-muted-foreground mt-2 grid gap-2 text-sm leading-5">
            {factors.map((factor) => (
              <li key={factor}>{factor}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Recommended actions</p>
          <ul className="text-muted-foreground mt-2 grid gap-2 text-sm leading-5">
            {recommendations.map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function EmailResult({ state }: { state: ToolState }) {
  const bodyHtml = getString(state.data, "bodyHtml");

  if (state.isLoading || state.error || !bodyHtml) {
    return <ResultPanel {...state} primaryKey="bodyText" />;
  }

  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{getProviderMeta(state.data)}</Badge>
        <Badge variant="accent">{getString(state.data, "subject")}</Badge>
      </div>
      <div
        className="prose prose-sm dark:prose-invert max-w-none text-sm leading-6"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </div>
  );
}

export function AiWorkbench({ canDraftEmail, shipments }: AiWorkbenchProps) {
  const [toolState, setToolState] = useState<Record<ToolKey, ToolState>>({
    email: initialToolState,
    notification: initialToolState,
    risk: initialToolState,
    search: initialToolState,
    summary: initialToolState,
    support: initialToolState,
  });
  const [supportMessage, setSupportMessage] = useState(
    "A customer wants to know why their delivery has not moved today.",
  );
  const [selectedShipmentId, setSelectedShipmentId] = useState(shipments[0]?.id ?? "");
  const [summaryFocus, setSummaryFocus] = useState("Summarize customer impact and next action.");
  const [notificationContext, setNotificationContext] = useState(
    "Shipment reached the destination facility and is being prepared for final delivery.",
  );
  const [emailRoughText, setEmailRoughText] = useState(
    "Tell the customer their package is delayed because customs requested extra review. Apologize and say we are monitoring it.",
  );
  const [searchQuery, setSearchQuery] = useState("delayed customs shipment");
  const [riskShipmentId, setRiskShipmentId] = useState(shipments[0]?.id ?? "");

  const shipmentOptions = useMemo(
    () =>
      shipments.map((shipment) => ({
        label: `${shipment.shipmentNumber} / ${shipment.status} / ${shipment.originCity} to ${shipment.destinationCity}`,
        value: shipment.id,
      })),
    [shipments],
  );

  function updateToolState(tool: ToolKey, nextState: Partial<ToolState>) {
    setToolState((current) => ({
      ...current,
      [tool]: {
        ...current[tool],
        ...nextState,
      },
    }));
  }

  async function runTool(tool: ToolKey, url: string, payload: Record<string, unknown>) {
    updateToolState(tool, { error: null, isLoading: true });

    try {
      const response = await secureFetch(url, {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;

      if (!response.ok) {
        throw new Error(typeof json.message === "string" ? json.message : "AI request failed.");
      }

      updateToolState(tool, { data: json, error: null, isLoading: false });
    } catch (error) {
      updateToolState(tool, {
        error: error instanceof Error ? error.message : "AI request failed.",
        isLoading: false,
      });
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: BrainCircuit,
            label: "Provider abstraction",
            value: "OpenAI / Gemini / Groq / OpenRouter",
          },
          {
            icon: PackageSearch,
            label: "Shipment context",
            value: `${shipments.length} visible shipments`,
          },
          { icon: Sparkles, label: "Audit trail", value: "AI conversations logged" },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="flex items-center gap-3 pt-5">
              <div className="bg-primary/10 text-primary grid size-10 place-items-center rounded-md">
                <metric.icon aria-hidden="true" className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{metric.label}</p>
                <p className="text-muted-foreground mt-1 text-xs">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!shipments.length ? (
        <EmptyState
          description="AI shipment summaries and risk detection will activate when this workspace has visible shipments."
          icon={PackageSearch}
          title="No shipments available"
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquareText aria-hidden="true" className="text-primary size-5" />
              <CardTitle>Customer Support</CardTitle>
            </div>
            <CardDescription>
              Draft customer-safe support answers from shipment context.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void runTool("support", "/api/ai/support", {
                  message: supportMessage,
                  shipmentId: selectedShipmentId || undefined,
                });
              }}
            >
              <Select
                onChange={(event) => setSelectedShipmentId(event.target.value)}
                value={selectedShipmentId}
              >
                <option value="">No shipment attached</option>
                {shipmentOptions.map((shipment) => (
                  <option key={shipment.value} value={shipment.value}>
                    {shipment.label}
                  </option>
                ))}
              </Select>
              <Textarea
                onChange={(event) => setSupportMessage(event.target.value)}
                rows={5}
                value={supportMessage}
              />
              <Button disabled={toolState.support.isLoading} type="submit">
                <Sparkles aria-hidden="true" className="size-4" />
                Draft answer
              </Button>
              <ResultPanel {...toolState.support} primaryKey="answer" />
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PackageSearch aria-hidden="true" className="text-primary size-5" />
              <CardTitle>Shipment Summary</CardTitle>
            </div>
            <CardDescription>
              Generate operations summaries from package and timeline data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void runTool("summary", "/api/ai/shipments/summary", {
                  focus: summaryFocus,
                  shipmentId: selectedShipmentId,
                });
              }}
            >
              <Select
                onChange={(event) => setSelectedShipmentId(event.target.value)}
                required
                value={selectedShipmentId}
              >
                {shipmentOptions.map((shipment) => (
                  <option key={shipment.value} value={shipment.value}>
                    {shipment.label}
                  </option>
                ))}
              </Select>
              <Input
                onChange={(event) => setSummaryFocus(event.target.value)}
                value={summaryFocus}
              />
              <Button disabled={!selectedShipmentId || toolState.summary.isLoading} type="submit">
                <Sparkles aria-hidden="true" className="size-4" />
                Summarize shipment
              </Button>
              <ResultPanel {...toolState.summary} primaryKey="summary" />
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BellRing aria-hidden="true" className="text-primary size-5" />
              <CardTitle>Notification Writing</CardTitle>
            </div>
            <CardDescription>
              Turn operational context into short notification copy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void runTool("notification", "/api/ai/notifications/draft", {
                  context: notificationContext,
                  tone: "operational",
                });
              }}
            >
              <Textarea
                onChange={(event) => setNotificationContext(event.target.value)}
                rows={5}
                value={notificationContext}
              />
              <Button disabled={toolState.notification.isLoading} type="submit">
                <Sparkles aria-hidden="true" className="size-4" />
                Draft notification
              </Button>
              <ResultPanel {...toolState.notification} primaryKey="body" />
            </form>
          </CardContent>
        </Card>

        {canDraftEmail ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MailPlus aria-hidden="true" className="text-primary size-5" />
                <CardTitle>Email Drafting</CardTitle>
              </div>
              <CardDescription>
                Improve admin email text with the shared AI email service.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void runTool("email", "/api/ai/emails/draft", {
                    roughText: emailRoughText,
                    shipmentId: selectedShipmentId || undefined,
                    tone: "professional",
                  });
                }}
              >
                <Textarea
                  onChange={(event) => setEmailRoughText(event.target.value)}
                  rows={5}
                  value={emailRoughText}
                />
                <Button disabled={toolState.email.isLoading} type="submit">
                  <Sparkles aria-hidden="true" className="size-4" />
                  Draft email
                </Button>
                <EmailResult state={toolState.email} />
              </form>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search aria-hidden="true" className="text-primary size-5" />
              <CardTitle>Semantic Search</CardTitle>
            </div>
            <CardDescription>
              Search scoped shipments and support tickets by operational meaning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void runTool("search", "/api/ai/search", {
                  query: searchQuery,
                  scope: "all",
                });
              }}
            >
              <Input onChange={(event) => setSearchQuery(event.target.value)} value={searchQuery} />
              <Button disabled={toolState.search.isLoading} type="submit">
                <Search aria-hidden="true" className="size-4" />
                Search
              </Button>
              <SearchResults state={toolState.search} />
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert aria-hidden="true" className="text-primary size-5" />
              <CardTitle>Shipment Risk</CardTitle>
            </div>
            <CardDescription>
              Detect schedule, exception, document, and handling risk.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void runTool("risk", "/api/ai/shipments/risk", {
                  shipmentId: riskShipmentId,
                });
              }}
            >
              <Select
                onChange={(event) => setRiskShipmentId(event.target.value)}
                required
                value={riskShipmentId}
              >
                {shipmentOptions.map((shipment) => (
                  <option key={shipment.value} value={shipment.value}>
                    {shipment.label}
                  </option>
                ))}
              </Select>
              <Button disabled={!riskShipmentId || toolState.risk.isLoading} type="submit">
                <ShieldAlert aria-hidden="true" className="size-4" />
                Detect risk
              </Button>
              <RiskResults state={toolState.risk} />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
