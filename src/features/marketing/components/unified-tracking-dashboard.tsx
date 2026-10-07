"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Route as NextRoute } from "next";
import {
  AlertCircle,
  ArrowRight,
  ChevronRight,
  FileText,
  LockKeyhole,
  Package,
  Radio,
  Search,
  KeyRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReceiptDownloadButton } from "@/features/shipments/components/receipt-download-button";
import { ShipmentLiveMap } from "@/features/shipments/components/shipment-live-map";
import { formatShipmentStatus } from "@/features/shipments/status-labels";
import type { ShipmentTrackingSnapshot } from "@/features/shipments/types";
import {
  DeliveryTruckAnimation,
  FloatingPawPrints,
  LiveRadarPing,
} from "./animated-illustrations";
import {
  ShipmentParties,
  ShipmentTimeline,
  TrackingStatusIcon,
  formatDate,
  formatDeliveryWindow,
  formatEnum,
  getStatusMessage,
  statusVariant,
} from "./tracking-lookup";

export function UnifiedTrackingDashboard() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => {
    return (
      searchParams.get("q") ||
      searchParams.get("ref") ||
      searchParams.get("tracking") ||
      ""
    );
  });
  const [recipientPin, setRecipientPin] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<ShipmentTrackingSnapshot | null>(null);
  const [connectionState, setConnectionState] = useState<"idle" | "live" | "reconnecting">("idle");
  const [showPinInput, setShowPinInput] = useState(false);

  async function performLookup(referenceToFind: string, pinToSubmit?: string) {
    const cleanRef = referenceToFind.trim();
    if (!cleanRef) return;

    setLookupStatus("loading");
    setErrorMessage(null);
    setPinError(null);
    setConnectionState("idle");

    const pinParam = (pinToSubmit !== undefined ? pinToSubmit : recipientPin).trim();
    const queryStr = pinParam ? `?pin=${encodeURIComponent(pinParam)}` : "";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(cleanRef)}${queryStr}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { message?: string } | null;
        setSnapshot(null);
        setLookupStatus("error");
        setErrorMessage(payload?.message ?? "We could not find a shipment matching that tracking number.");
        return;
      }

      const payload = (await res.json()) as {
        pinError?: string | null;
        snapshot: ShipmentTrackingSnapshot;
      };

      if (!payload.snapshot) {
        setSnapshot(null);
        setLookupStatus("error");
        setErrorMessage("We could not find a shipment matching that tracking number.");
        return;
      }

      setSnapshot(payload.snapshot);
      setPinError(payload.pinError ?? null);
      if (payload.pinError) {
        setShowPinInput(true);
      } else if (pinParam) {
        setRecipientPin("");
        setShowPinInput(false);
      }
      setLookupStatus("found");
    } catch (err) {
      clearTimeout(timeoutId);
      setSnapshot(null);
      setLookupStatus("error");
      setErrorMessage(
        err instanceof Error && err.name === "AbortError"
          ? "Tracking lookup timed out. Please check your connection and try again."
          : "An error occurred while tracking the shipment. Please try again."
      );
    }
  }

  // Auto-search on initial load if query parameter was supplied
  useEffect(() => {
    const initialQuery =
      searchParams.get("q") ||
      searchParams.get("ref") ||
      searchParams.get("tracking");
    if (initialQuery && initialQuery.trim()) {
      void performLookup(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SSE stream for real-time tracking updates
  useEffect(() => {
    if (!snapshot?.shipmentNumber) {
      return undefined;
    }

    const source = new EventSource(`/api/tracking/${encodeURIComponent(snapshot.shipmentNumber)}/stream`);

    source.addEventListener("open", () => setConnectionState("live"));
    source.addEventListener("snapshot", (event) => {
      try {
        const nextSnapshot = JSON.parse((event as MessageEvent).data) as ShipmentTrackingSnapshot;
        setSnapshot(nextSnapshot);
        setConnectionState("live");
      } catch {
        // Ignore json parse error in sse
      }
    });
    source.addEventListener("error", () => setConnectionState("reconnecting"));

    return () => source.close();
  }, [snapshot?.shipmentNumber]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    void performLookup(query);
  }

  function handleUnlockPin(e: FormEvent) {
    e.preventDefault();
    if (!snapshot || !recipientPin.trim()) return;
    void performLookup(snapshot.shipmentNumber, recipientPin.trim());
  }

  const latestEvent = snapshot?.timeline[0] ?? null;

  return (
    <div className="w-full">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-14 sm:py-20">
        <FloatingPawPrints />

        {/* Subtle grid pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,158,11,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5">
                <Radio className="h-3.5 w-3.5 animate-pulse text-amber-400" />
                <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
                  Live Global GPS
                </span>
              </div>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                Track Any Shipment.<br />
                <span className="text-amber-400">In Real Time.</span>
              </h1>
              <p className="mt-4 max-w-lg text-slate-300 leading-relaxed">
                Live GPS route visibility for pets, express parcels, air freight, ocean cargo, and overland transport.
              </p>

              {/* Search Form */}
              <form className="mt-8 space-y-3" onSubmit={handleSearch}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Input
                      autoCapitalize="characters"
                      autoComplete="off"
                      className="h-14 border-slate-600 bg-slate-800/90 pl-12 pr-4 text-base font-medium text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                      placeholder="Enter tracking number (e.g. AGL-202610-5B2F71BB)"
                      spellCheck={false}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <Button
                    type="submit"
                    className="h-14 bg-amber-500 px-7 text-base font-bold text-slate-900 transition hover:bg-amber-400 shrink-0"
                    disabled={lookupStatus === "loading"}
                  >
                    {lookupStatus === "loading" ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                        Searching…
                      </span>
                    ) : (
                      "Track Now"
                    )}
                  </Button>
                </div>

                {/* Optional PIN toggler */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowPinInput(!showPinInput)}
                    className="inline-flex items-center gap-1.5 hover:text-amber-400 transition"
                  >
                    <KeyRound className="size-3.5" />
                    <span>{showPinInput ? "Hide recipient PIN field" : "Have a recipient PIN? Click here"}</span>
                  </button>
                  <span>Real-time GPS telemetry</span>
                </div>

                {showPinInput && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      autoComplete="off"
                      className="h-10 border-slate-700 bg-slate-800/80 text-sm text-white placeholder:text-slate-500 max-w-xs"
                      maxLength={12}
                      placeholder="Enter recipient PIN (optional)"
                      type="password"
                      value={recipientPin}
                      onChange={(e) => setRecipientPin(e.target.value)}
                    />
                  </div>
                )}
              </form>

              {/* Stat Chips */}
              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  { icon: "🌍", label: "150+ Countries" },
                  { icon: "📡", label: "Real-time Updates" },
                  { icon: "🐾", label: "Pet Safe Transport" },
                ].map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/90 px-3 py-1 text-xs font-medium text-slate-300"
                  >
                    <span>{chip.icon}</span>
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: animated illustration */}
            <div className="hidden lg:block">
              <DeliveryTruckAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* ── ERROR STATE ── */}
      {lookupStatus === "error" && (
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="flex items-start gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-white">Tracking Reference Not Found</p>
              <p className="mt-1 text-sm text-slate-300">
                {errorMessage || `No record found for "${query}". Please check the tracking number and try again.`}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── RESULTS: RICH COMPLETE TRACKING ── */}
      {lookupStatus === "found" && snapshot && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 space-y-6">
          {/* Header Card */}
          <div className="border-border bg-card shadow-panel rounded-xl border p-5 sm:p-7">
            <div className="border-border flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  Tracking Number
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-normal break-all sm:text-3xl">
                  {snapshot.shipmentNumber}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Last updated {formatDate(snapshot.updatedAt)}
                </p>
              </div>

              {/* Action Badges & Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(snapshot.status)}>
                  {formatShipmentStatus(snapshot.status)}
                </Badge>

                <Badge variant={connectionState === "live" ? "success" : "outline"}>
                  {connectionState === "live" ? (
                    <Radio aria-hidden="true" className="size-3.5 animate-pulse" />
                  ) : null}
                  {connectionState === "live"
                    ? "Updates connected"
                    : connectionState === "reconnecting"
                      ? "Reconnecting"
                      : "Connecting"}
                </Badge>

                {snapshot.sensitiveDetailsLocked ? (
                  <Badge variant="outline">
                    <LockKeyhole aria-hidden="true" className="size-3.5 mr-1" />
                    PIN required for receipt
                  </Badge>
                ) : (
                  <>
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={
                          `/tracking/${encodeURIComponent(snapshot.shipmentNumber)}/receipt` as NextRoute
                        }
                      >
                        <FileText aria-hidden="true" className="size-4 mr-1" />
                        View receipt
                      </Link>
                    </Button>
                    <ReceiptDownloadButton
                      reference={snapshot.shipmentNumber}
                      size="sm"
                      variant="outline"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Status explanation alert */}
            <div className="bg-secondary text-secondary-foreground mt-5 flex items-start gap-3 rounded-lg p-4">
              <TrackingStatusIcon status={snapshot.status} />
              <div>
                <p className="font-bold">{formatShipmentStatus(snapshot.status)}</p>
                <p className="mt-1 text-sm leading-relaxed">{getStatusMessage(snapshot.status)}</p>
              </div>
            </div>

            {/* PIN unlock form if locked */}
            {snapshot.sensitiveDetailsLocked && (
              <form
                onSubmit={handleUnlockPin}
                className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                      <LockKeyhole className="size-4" />
                      Recipient Details Protected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enter the recipient PIN to view full contact details, pet profile, and download the printable receipt.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      autoComplete="off"
                      className="h-9 w-40 text-sm"
                      maxLength={12}
                      placeholder="Recipient PIN"
                      type="password"
                      value={recipientPin}
                      onChange={(e) => setRecipientPin(e.target.value)}
                    />
                    <Button size="sm" type="submit" variant="accent">
                      Unlock
                    </Button>
                  </div>
                </div>
                {pinError && (
                  <p className="mt-2 text-xs font-medium text-red-500">{pinError}</p>
                )}
              </form>
            )}

            {/* Quick Metrics Bar */}
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="border-border rounded-lg border p-4">
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  Estimated Delivery
                </p>
                <p className="mt-2 text-base font-bold">{formatDeliveryWindow(snapshot)}</p>
              </div>
              <div className="border-border rounded-lg border p-4">
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  Current Location
                </p>
                <p className="mt-2 text-base font-bold">
                  {latestEvent?.currentLocation ?? "Awaiting checkpoint scan"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {latestEvent ? formatDate(latestEvent.occurredAt) : "No location logged yet"}
                </p>
              </div>
              <div className="border-border rounded-lg border p-4">
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  Latest Milestone
                </p>
                <p className="mt-2 text-base font-bold">
                  {latestEvent ? formatShipmentStatus(snapshot.status) : "Shipment Created"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs truncate">
                  {latestEvent?.message ?? getStatusMessage(snapshot.status)}
                </p>
              </div>
            </div>
          </div>

          {/* ── Interactive Live Map with Real Route & GPS Simulation ── */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <LiveRadarPing />
                <span className="text-sm font-bold">Interactive Route GPS Map</span>
              </div>
              <Badge variant="accent">Live Network</Badge>
            </div>
            <ShipmentLiveMap connectionState={connectionState} snapshot={snapshot} />
          </div>

          {/* ── Route and Shipment Record ── */}
          <section className="border-border bg-card shadow-panel rounded-xl border p-5 sm:p-6">
            <div className="border-border flex flex-wrap items-end justify-between gap-3 border-b pb-4">
              <div>
                <h3 className="text-lg font-bold">Route and Manifest Details</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Origin terminal, current position, and destination.
                </p>
              </div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                {snapshot.timeline.length} Checkpoint{snapshot.timeline.length === 1 ? "" : "s"} Recorded
              </p>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
              <div className="border-border rounded-lg border p-4">
                <p className="text-muted-foreground text-xs font-bold uppercase">Origin</p>
                <p className="mt-2 font-semibold">
                  {snapshot.originCity}, {snapshot.originCountryCode}
                </p>
              </div>
              <ChevronRight
                aria-hidden="true"
                className="text-amber-500 mx-auto hidden size-5 lg:block"
              />
              <div className="border-amber-500/40 bg-amber-500/10 rounded-lg border p-4">
                <p className="text-xs font-bold uppercase text-amber-500">Current Checkpoint</p>
                <p className="mt-2 font-semibold">
                  {latestEvent?.currentLocation ?? "Awaiting transit scan"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {latestEvent ? formatDate(latestEvent.occurredAt) : "Pending"}
                </p>
              </div>
              <ChevronRight
                aria-hidden="true"
                className="text-amber-500 mx-auto hidden size-5 lg:block"
              />
              <div className="border-border rounded-lg border p-4">
                <p className="text-muted-foreground text-xs font-bold uppercase">Destination</p>
                <p className="mt-2 font-semibold">
                  {snapshot.destinationCity}, {snapshot.destinationCountryCode}
                </p>
              </div>
            </div>

            <dl className="border-border bg-border mt-5 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Service Level", value: snapshot.serviceLevel ?? "Standard Managed Logistics" },
                { label: "Transport Mode", value: formatEnum(snapshot.mode) },
                {
                  label: "Consignment Pieces",
                  value: snapshot.packageCount
                    ? `${snapshot.packageCount} piece${snapshot.packageCount === 1 ? "" : "s"}`
                    : "Standard parcel",
                },
                {
                  label: "Chargeable Weight",
                  value: snapshot.totalWeightLb ? `${snapshot.totalWeightLb} lb` : "Calculated at facility",
                },
              ].map((item) => (
                <div className="bg-background p-4" key={item.label}>
                  <dt className="text-muted-foreground text-xs font-bold uppercase">{item.label}</dt>
                  <dd className="mt-1 text-sm font-semibold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ── Shipment Parties & Protected Details ── */}
          <ShipmentParties snapshot={snapshot} />

          {/* ── Checkpoints & Event Timeline ── */}
          <ShipmentTimeline snapshot={snapshot} />
        </section>
      )}

      {/* ── IDLE: Feature Cards ── */}
      {lookupStatus === "idle" && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: "📍",
                title: "Real-Time GPS Tracking",
                description:
                  "Follow your shipment on an interactive map with vehicle simulation, route milestones, and live ETA windows.",
              },
              {
                icon: "🐾",
                title: "Pet Transport Monitoring",
                description:
                  "Specialized welfare updates, climate logs, hydration schedules, and live status for pets in travel.",
              },
              {
                icon: "✈️",
                title: "Multi-Modal Freight Coverage",
                description:
                  "Track ocean containers, air waybills, cross-border freight, and door-to-door express parcels in one unified screen.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-2xl">
                  {card.icon}
                </div>
                <h3 className="font-bold text-lg">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Quick Booking CTA ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-10 sm:flex-row">
          <div>
            <h3 className="text-xl font-bold text-white">Ready to ship with Apex?</h3>
            <p className="mt-1 text-slate-300">
              Create a shipment in minutes — pets, parcels, freight, and more.
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-3">
            <Button asChild className="bg-amber-500 font-bold text-slate-900 hover:bg-amber-400">
              <Link href={"/shipments/new" as NextRoute}>
                <Package className="mr-2 h-4 w-4" /> Create Shipment
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              <Link href={"/services" as NextRoute}>
                View Services <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
