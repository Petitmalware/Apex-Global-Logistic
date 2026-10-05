"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Search, Package, MapPin, CheckCircle2, AlertCircle,
  ArrowRight, PawPrint, Plane, Clock, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DeliveryTruckAnimation,
  PulsingLocationPin,
  LiveRadarPing,
  FloatingPawPrints,
} from "./animated-illustrations";

type TrackingResult = {
  shipmentNumber: string;
  status: string;
  originCity: string;
  destinationCity: string;
  estimatedDelivery: string | null;
  currentLocation: string | null;
  events: Array<{ message: string; location: string | null; timestamp: string }>;
  lat: number | null;
  lng: number | null;
};

export function UnifiedTrackingDashboard() {
  const [query, setQuery] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "error">("idle");
  const [result, setResult] = useState<TrackingResult | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLookupStatus("loading");
    setResult(null);
    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(query.trim())}`);
      if (!res.ok) { setLookupStatus("error"); return; }
      const data = await res.json();
      setResult({
        shipmentNumber: data.shipmentNumber ?? query,
        status: data.status ?? "UNKNOWN",
        originCity: data.originCity ?? "—",
        destinationCity: data.destinationCity ?? "—",
        estimatedDelivery: data.deliveryWindowEnd ?? data.deliveryWindowStart ?? null,
        currentLocation: data.timeline?.[0]?.currentLocation ?? null,
        events: (data.timeline ?? []).slice(0, 5).map((e: {message?: string; currentLocation?: string | null; happenedAt?: string | null}) => ({
          message: e.message ?? "Update",
          location: e.currentLocation ?? null,
          timestamp: e.happenedAt ?? "",
        })),
        lat: data.route?.currentPosition?.latitude ?? null,
        lng: data.route?.currentPosition?.longitude ?? null,
      });
      setLookupStatus("found");
    } catch {
      setLookupStatus("error");
    }
  }

  function statusVariant(s: string): "success"|"danger"|"warning"|"accent"|"neutral" {
    if (s === "DELIVERED") return "success";
    if (s === "CANCELLED" || s === "RETURNED") return "danger";
    if (s === "DELAYED" || s === "HELD") return "warning";
    if (s === "IN_TRANSIT" || s === "READY_FOR_DISPATCH" || s === "PROCESSING") return "accent";
    return "neutral";
  }

  function formatDate(v: string | null) {
    if (!v) return "—";
    return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v));
  }

  return (
    <div className="w-full">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 sm:py-24">
        <FloatingPawPrints />

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
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5">
                <Radio className="h-3.5 w-3.5 animate-pulse text-amber-400" />
                <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase">Live Tracking</span>
              </div>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                Track Any Shipment.<br />
                <span className="text-amber-400">Instantly.</span>
              </h1>
              <p className="mt-4 max-w-lg text-slate-300 leading-relaxed">
                Real-time GPS visibility for pet transport, air cargo, ocean freight, and parcel delivery — from booking to your door.
              </p>

              <form className="mt-8" onSubmit={handleSearch}>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      className="h-14 border-slate-600 bg-slate-800/80 pl-12 pr-4 text-base text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                      placeholder="Enter tracking number, shipment ID, or reference…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <Button
                    type="submit"
                    className="h-14 bg-amber-500 px-6 text-base font-bold text-slate-900 hover:bg-amber-400"
                    disabled={lookupStatus === "loading"}
                  >
                    {lookupStatus === "loading" ? (
                      <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" /> Searching…</span>
                    ) : (
                      "Track"
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  { icon: "\u{1F30E}", label: "150+ Countries" },
                  { icon: "\u{1F4E1}", label: "Real-time Updates" },
                  { icon: "\u{1F43E}", label: "Pet Safe Transport" },
                ].map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300"
                  >
                    <span>{chip.icon}</span>
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="hidden lg:block">
              <DeliveryTruckAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* ── ERROR STATE ── */}
      {lookupStatus === "error" && (
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="flex items-start gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-6">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-white">No shipment found</p>
              <p className="mt-1 text-sm text-slate-300">
                No record found for <strong className="text-white">{query}</strong>. Check the tracking number and try again.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── RESULTS ── */}
      {lookupStatus === "found" && result && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">

            <div className="space-y-5">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Shipment</p>
                    <Badge variant={statusVariant(result.status)}>
                      {result.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-lg font-bold text-white">{result.shipmentNumber}</p>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <div className="my-1 h-12 w-px border-l-2 border-dashed border-slate-300" />
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex flex-col gap-8">
                      <div>
                        <p className="text-xs text-slate-500">Origin</p>
                        <p className="font-semibold">{result.originCity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Destination</p>
                        <p className="font-semibold">{result.destinationCity}</p>
                      </div>
                    </div>
                    {result.status === "IN_TRANSIT" && (
                      <div className="ml-auto">
                        <PulsingLocationPin />
                      </div>
                    )}
                  </div>

                  {result.estimatedDelivery && (
                    <div className="mt-5 flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-3">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-xs text-slate-500">Estimated Delivery</p>
                        <p className="text-sm font-semibold">{formatDate(result.estimatedDelivery)}</p>
                      </div>
                    </div>
                  )}

                  {result.currentLocation && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-100/5 px-4 py-3">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Current Location</p>
                        <p className="text-sm font-semibold">{result.currentLocation}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {result.events.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-bold tracking-wider text-slate-500 uppercase">Event Timeline</h3>
                  <ol className="space-y-4">
                    {result.events.map((ev, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-amber-500" : "bg-slate-300"}`} />
                          {i < result.events.length - 1 && <div className="my-1 flex-1 w-px bg-slate-200" />}
                        </div>
                        <div className="pb-3 min-w-0">
                          <p className="text-sm font-medium">{ev.message}</p>
                          {ev.location && <p className="text-xs text-slate-500">{ev.location}</p>}
                          {ev.timestamp && (
                            <p className="mt-0.5 text-xs text-slate-400">{formatDate(ev.timestamp)}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <LiveRadarPing />
                  <span className="text-sm font-semibold">Live Route Map</span>
                </div>
                <Badge variant="accent">Route Active</Badge>
              </div>
              <div className="relative">
                {result.lat && result.lng ? (
                  <iframe
                    allow="fullscreen"
                    className="h-[480px] w-full border-0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${result.lng - 0.5},${result.lat - 0.5},${result.lng + 0.5},${result.lat + 0.5}&layer=mapnik&marker=${result.lat},${result.lng}`}
                    title={`Live map for shipment ${result.shipmentNumber}`}
                  />
                ) : (
                  <div className="flex h-[480px] flex-col items-center justify-center gap-4 bg-slate-50">
                    <div className="relative">
                      <div className="h-16 w-16 animate-ping rounded-full bg-amber-400/20" />
                      <MapPin className="absolute inset-0 m-auto h-8 w-8 text-amber-500" />
                    </div>
                    <p className="text-sm text-slate-500">Live GPS coordinates will appear once the shipment is in transit</p>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 px-5 py-3 text-xs text-slate-500">
                Map updates automatically as the shipment progresses
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ── IDLE: Feature cards ── */}
      {lookupStatus === "idle" && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: MapPin,
                color: "text-amber-500",
                bg: "bg-amber-50",
                title: "Real-Time GPS Tracking",
                description:
                  "Follow your shipment on a live map with route progress, milestone updates, and estimated arrival windows.",
              },
              {
                icon: PawPrint,
                color: "text-rose-500",
                bg: "bg-rose-50",
                title: "Pet Transport Monitoring",
                description:
                  "Purpose-built welfare check-ins for dogs, cats, birds, reptiles, and exotic animals in transit.",
              },
              {
                icon: Plane,
                color: "text-blue-500",
                bg: "bg-blue-50",
                title: "Multi-Modal Coverage",
                description:
                  "Air freight, ocean cargo, ground transport, and express parcel tracking in one unified dashboard.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <h3 className="font-bold">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{card.description}</p>
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
            <p className="mt-1 text-slate-300">Create a shipment in minutes — pets, parcels, freight, and more.</p>
          </div>
          <div className="flex flex-shrink-0 gap-3">
            <Button asChild className="bg-amber-500 font-bold text-slate-900 hover:bg-amber-400">
              <Link href={"/shipments/new" as Route}>
                <Package className="mr-2 h-4 w-4" /> Create Shipment
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
              <Link href={"/services" as Route}>
                View Services <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
