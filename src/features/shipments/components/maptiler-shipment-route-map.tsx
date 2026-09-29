"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { clientEnv } from "@/config/env.client";
import type { ShipmentRouteTrackingView } from "@/features/shipments/types";

type MapTilerShipmentRouteMapProps = {
  route: ShipmentRouteTrackingView;
  shipmentNumber: string;
};

type MapStyleOption = {
  label: string;
  value: string;
};

function getOpenStreetMapStyle() {
  return {
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    layers: [
      {
        id: "osm-raster",
        source: "openstreetmap",
        type: "raster" as const,
      },
    ],
    sources: {
      openstreetmap: {
        attribution: "(c) OpenStreetMap contributors",
        tileSize: 256,
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        type: "raster" as const,
      },
    },
    version: 8 as const,
  };
}

function getMapStyleOptions() {
  const mapTilerKey = clientEnv.NEXT_PUBLIC_MAPTILER_API_KEY?.trim();
  const options: MapStyleOption[] = [
    {
      label: "Street",
      value: "openstreetmap",
    },
  ];

  if (mapTilerKey) {
    options.push({
      label: "MapTiler street",
      value: `https://api.maptiler.com/maps/streets-v4/style.json?key=${encodeURIComponent(mapTilerKey)}`,
    });
  }

  if (clientEnv.NEXT_PUBLIC_MAP_DARK_STYLE_URL?.trim()) {
    options.push({ label: "Dark", value: clientEnv.NEXT_PUBLIC_MAP_DARK_STYLE_URL.trim() });
  }

  if (clientEnv.NEXT_PUBLIC_MAP_TERRAIN_STYLE_URL?.trim()) {
    options.push({ label: "Terrain", value: clientEnv.NEXT_PUBLIC_MAP_TERRAIN_STYLE_URL.trim() });
  }

  if (clientEnv.NEXT_PUBLIC_MAP_AERIAL_STYLE_URL?.trim()) {
    options.push({ label: "Aerial", value: clientEnv.NEXT_PUBLIC_MAP_AERIAL_STYLE_URL.trim() });
  }

  return options;
}

function formatDistance(distanceMeters: number) {
  return distanceMeters >= 1_000
    ? `${(distanceMeters / 1_000).toFixed(1)} km`
    : `${distanceMeters} m`;
}

export function MapTilerShipmentRouteMap({ route, shipmentNumber }: MapTilerShipmentRouteMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapReference = useRef<import("maplibre-gl").Map | null>(null);
  const currentMarkerReference = useRef<import("maplibre-gl").Marker | null>(null);
  const routeReference = useRef(route);
  routeReference.current = route;
  const [loadError, setLoadError] = useState(false);
  const styleOptions = useMemo(() => getMapStyleOptions(), []);
  const [selectedStyle, setSelectedStyle] = useState(styleOptions[0]!.value);
  const routeKey = useMemo(
    () =>
      JSON.stringify({
        destination: route.destination,
        geometry: route.geometry,
        origin: route.origin,
      }),
    [route.destination, route.geometry, route.origin],
  );

  useEffect(() => {
    let cancelled = false;
    let map: import("maplibre-gl").Map | null = null;
    const routeForMap = routeReference.current;

    async function initializeMap() {
      try {
        setLoadError(false);
        const { default: maplibregl } = await import("maplibre-gl");

        if (cancelled || !mapElement.current) {
          return;
        }

        map = new maplibregl.Map({
          center: [routeForMap.currentPosition.longitude, routeForMap.currentPosition.latitude],
          container: mapElement.current,
          maxZoom: 18,
          minZoom: 2,
          style: selectedStyle === "openstreetmap" ? getOpenStreetMapStyle() : selectedStyle,
          zoom: 7,
        });
        mapReference.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

        map.once("load", () => {
          if (cancelled || !map) {
            return;
          }

          const bounds = new maplibregl.LngLatBounds();
          const origin: [number, number] = [
            routeForMap.origin.longitude,
            routeForMap.origin.latitude,
          ];
          const destination: [number, number] = [
            routeForMap.destination.longitude,
            routeForMap.destination.latitude,
          ];
          const current: [number, number] = [
            routeForMap.currentPosition.longitude,
            routeForMap.currentPosition.latitude,
          ];

          map.addSource("shipment-road-route", {
            data: {
              geometry: {
                coordinates: routeForMap.geometry,
                type: "LineString",
              },
              properties: {},
              type: "Feature",
            },
            type: "geojson",
          });
          map.addLayer({
            id: "shipment-road-route-casing",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#ffffff", "line-opacity": 0.85, "line-width": 7 },
            source: "shipment-road-route",
            type: "line",
          });
          map.addLayer({
            id: "shipment-road-route-line",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#0b63ce", "line-opacity": 0.94, "line-width": 4 },
            source: "shipment-road-route",
            type: "line",
          });

          [
            {
              className: "shipment-map-marker shipment-map-marker-planned",
              coordinate: origin,
              label: routeForMap.origin.label,
              text: "Start",
            },
            {
              className: "shipment-map-marker shipment-map-marker-planned",
              coordinate: destination,
              label: routeForMap.destination.label,
              text: "End",
            },
            {
              className: "shipment-map-marker shipment-map-marker-current",
              coordinate: current,
              isCurrent: true,
              label: `${routeForMap.progressPercent}% through the scheduled road route`,
              text: "Now",
            },
          ].forEach((point) => {
            const element = document.createElement("div");
            element.className = point.className;
            element.textContent = point.text;

            const marker = new maplibregl.Marker({ anchor: "bottom", element })
              .setLngLat(point.coordinate)
              .setPopup(
                new maplibregl.Popup({
                  closeButton: false,
                  closeOnClick: true,
                  offset: 22,
                }).setText(point.label),
              )
              .addTo(map!);

            if (point.isCurrent) {
              currentMarkerReference.current = marker;
            }
            bounds.extend(point.coordinate);
          });

          map.fitBounds(bounds, { duration: 0, maxZoom: 10, padding: 56 });
          map.resize();
        });

        map.on("error", () => {
          if (cancelled) {
            return;
          }

          if (selectedStyle !== "openstreetmap") {
            setSelectedStyle("openstreetmap");
            return;
          }

          setLoadError(true);
        });
      } catch {
        if (!cancelled) {
          setLoadError(true);
        }
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;
      mapReference.current = null;
      currentMarkerReference.current = null;
      map?.remove();
    };
  }, [routeKey, selectedStyle]);

  useEffect(() => {
    currentMarkerReference.current?.setLngLat([
      route.currentPosition.longitude,
      route.currentPosition.latitude,
    ]);
  }, [route.currentPosition.latitude, route.currentPosition.longitude]);

  function recenterMap() {
    mapReference.current?.flyTo({
      center: [route.currentPosition.longitude, route.currentPosition.latitude],
      duration: 700,
      zoom: Math.max(mapReference.current.getZoom(), 9),
    });
  }

  if (loadError) {
    return (
      <div className="bg-surface flex min-h-[22rem] items-center p-5 sm:min-h-[30rem] sm:p-8">
        <div className="border-border bg-background mx-auto w-full max-w-xl rounded-lg border p-5 shadow-sm sm:p-6">
          <p className="text-sm font-semibold">Road map temporarily unavailable</p>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            The calculated road route is saved. Use the route distance, ETA, and timeline while map
            tiles reconnect.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="border-border rounded-md border p-3">
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Route distance
              </p>
              <p className="mt-2 text-sm font-semibold">
                {formatDistance(route.totalDistanceMeters)}
              </p>
            </div>
            <div className="border-border rounded-md border p-3">
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Scheduled progress
              </p>
              <p className="mt-2 text-sm font-semibold">{route.progressPercent}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        aria-label={`Road route map for shipment ${shipmentNumber}`}
        className="h-[22rem] w-full sm:h-[30rem]"
        ref={mapElement}
        role="application"
      />
      <div className="absolute top-3 left-3 z-10 flex max-w-[calc(100%-6rem)] items-center gap-2">
        {styleOptions.length > 1 ? (
          <Select
            aria-label="Map style"
            className="bg-background/95 h-9 w-auto text-xs shadow-sm"
            onChange={(event) => setSelectedStyle(event.target.value)}
            value={selectedStyle}
          >
            {styleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ) : null}
        <Button
          aria-label="Recenter route map"
          className="bg-background/95 h-9 w-9 shadow-sm"
          onClick={recenterMap}
          size="icon"
          title="Recenter route map"
          type="button"
          variant="outline"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
        </Button>
        <Button
          aria-label="Open map in fullscreen"
          className="bg-background/95 h-9 w-9 shadow-sm"
          onClick={() => mapReference.current?.getContainer().requestFullscreen?.()}
          size="icon"
          title="Open map in fullscreen"
          type="button"
          variant="outline"
        >
          <Maximize2 aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );
}
