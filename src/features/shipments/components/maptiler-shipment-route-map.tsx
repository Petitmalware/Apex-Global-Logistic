"use client";

import { useEffect, useRef, useState } from "react";

import type { ShipmentRouteCheckpoint } from "@/features/shipments/components/shipment-route-map.types";
import { formatShipmentStatus } from "@/features/shipments/status-labels";

type MapTilerShipmentRouteMapProps = {
  apiKey: string;
  checkpoints: ShipmentRouteCheckpoint[];
  shipmentNumber: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function createPopupContent(checkpoint: ShipmentRouteCheckpoint, isLatest: boolean) {
  const container = document.createElement("div");
  container.className = "shipment-map-popup";

  const title = document.createElement("p");
  title.className = "shipment-map-popup-title";
  title.textContent = isLatest ? "Latest recorded checkpoint" : "Recorded checkpoint";
  container.append(title);

  const location = document.createElement("p");
  location.className = "shipment-map-popup-location";
  location.textContent = checkpoint.label;
  container.append(location);

  const status = document.createElement("p");
  status.className = "shipment-map-popup-detail";
  status.textContent = `Status: ${
    checkpoint.status ? formatShipmentStatus(checkpoint.status) : "Operational update"
  }`;
  container.append(status);

  const recordedAt = document.createElement("p");
  recordedAt.className = "shipment-map-popup-detail";
  recordedAt.textContent = `Recorded: ${formatDate(checkpoint.occurredAt)}`;
  container.append(recordedAt);

  if (checkpoint.message) {
    const note = document.createElement("p");
    note.className = "shipment-map-popup-note";
    note.textContent = checkpoint.message;
    container.append(note);
  }

  return container;
}

export function MapTilerShipmentRouteMap({
  apiKey,
  checkpoints,
  shipmentNumber,
}: MapTilerShipmentRouteMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: import("maplibre-gl").Map | null = null;

    function handleMapError() {
      if (!cancelled) {
        map?.remove();
        map = null;
        setLoadError(true);
      }
    }

    async function initializeMap() {
      try {
        const { default: maplibregl } = await import("maplibre-gl");

        if (cancelled || !mapElement.current) {
          return;
        }

        const latestCheckpoint = checkpoints.at(-1)!;
        map = new maplibregl.Map({
          center: [latestCheckpoint.longitude, latestCheckpoint.latitude],
          container: mapElement.current,
          maxZoom: 18,
          minZoom: 2,
          style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(apiKey)}`,
          zoom: 12,
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

        map.once("load", () => {
          if (cancelled || !map) {
            return;
          }

          const bounds = new maplibregl.LngLatBounds();

          checkpoints.forEach((checkpoint, index) => {
            const isLatest = index === checkpoints.length - 1;
            const markerElement = document.createElement("div");
            markerElement.className = isLatest
              ? "shipment-map-marker shipment-map-marker-current"
              : "shipment-map-marker";
            markerElement.textContent = isLatest ? "Now" : `${index + 1}`;

            const popup = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: true,
              maxWidth: "280px",
              offset: 22,
            }).setDOMContent(createPopupContent(checkpoint, isLatest));

            new maplibregl.Marker({
              anchor: "bottom",
              element: markerElement,
            })
              .setLngLat([checkpoint.longitude, checkpoint.latitude])
              .setPopup(popup)
              .addTo(map!);

            bounds.extend([checkpoint.longitude, checkpoint.latitude]);
          });

          if (checkpoints.length > 1) {
            map.addSource("recorded-shipment-route", {
              data: {
                geometry: {
                  coordinates: checkpoints.map((checkpoint) => [
                    checkpoint.longitude,
                    checkpoint.latitude,
                  ]),
                  type: "LineString",
                },
                properties: {},
                type: "Feature",
              },
              type: "geojson",
            });
            map.addLayer({
              id: "recorded-shipment-route-line",
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
              paint: {
                "line-color": "#c78c09",
                "line-opacity": 0.92,
                "line-width": 4,
              },
              source: "recorded-shipment-route",
              type: "line",
            });
            map.fitBounds(bounds, {
              duration: 0,
              maxZoom: 12,
              padding: 56,
            });
          } else {
            map.setCenter([latestCheckpoint.longitude, latestCheckpoint.latitude]);
            map.setZoom(13);
          }

          map.resize();
        });

        map.on("error", handleMapError);
      } catch {
        handleMapError();
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [apiKey, checkpoints]);

  if (loadError) {
    return (
      <div className="bg-surface flex h-[22rem] items-center justify-center p-6 text-center sm:h-[28rem]">
        <p className="text-muted-foreground max-w-sm text-sm leading-6">
          The street map is temporarily unavailable. Recorded shipment updates and the delivery
          timeline remain available above.
        </p>
      </div>
    );
  }

  return (
    <div
      aria-label={`MapTiler map for shipment ${shipmentNumber}`}
      className="h-[22rem] w-full sm:h-[28rem]"
      ref={mapElement}
      role="application"
    />
  );
}
