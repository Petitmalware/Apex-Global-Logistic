"use client";

import { useEffect, useRef, useState } from "react";

import type {
  ShipmentEstimatedRoute,
  ShipmentRouteCheckpoint,
} from "@/features/shipments/components/shipment-route-map.types";
import { formatShipmentStatus } from "@/features/shipments/status-labels";

type MapTilerShipmentRouteMapProps = {
  apiKey: string;
  checkpoints: ShipmentRouteCheckpoint[];
  estimatedRoute?: ShipmentEstimatedRoute | null;
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
  title.textContent = isLatest ? "Current recorded position" : "Recorded checkpoint";
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

function createEstimatedPopupContent(estimatedRoute: ShipmentEstimatedRoute) {
  const container = document.createElement("div");
  container.className = "shipment-map-popup";

  const title = document.createElement("p");
  title.className = "shipment-map-popup-title";
  title.textContent = "Estimated route progress";
  container.append(title);

  const location = document.createElement("p");
  location.className = "shipment-map-popup-location";
  location.textContent = `${estimatedRoute.progressPercent}% through the planned schedule`;
  container.append(location);

  const detail = document.createElement("p");
  detail.className = "shipment-map-popup-detail";
  detail.textContent = "Schedule-based estimate, not a live GPS position.";
  container.append(detail);

  return container;
}

export function MapTilerShipmentRouteMap({
  apiKey,
  checkpoints,
  estimatedRoute = null,
  shipmentNumber,
}: MapTilerShipmentRouteMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let hasLoaded = false;
    let map: import("maplibre-gl").Map | null = null;

    function handleMapError() {
      if (!cancelled && !hasLoaded) {
        map?.remove();
        map = null;
        setLoadError(true);
      }
    }

    async function initializeMap() {
      try {
        setLoadError(false);
        const { default: maplibregl } = await import("maplibre-gl");

        if (cancelled || !mapElement.current) {
          return;
        }

        const latestCheckpoint = checkpoints.at(-1) ?? null;
        const initialPoint = estimatedRoute?.estimatedPosition ?? latestCheckpoint;

        if (!initialPoint) {
          return;
        }

        map = new maplibregl.Map({
          center: [initialPoint.longitude, initialPoint.latitude],
          container: mapElement.current,
          maxZoom: 18,
          minZoom: 2,
          style: `https://api.maptiler.com/maps/streets-v4/style.json?key=${encodeURIComponent(apiKey)}`,
          zoom: 12,
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

        map.once("load", () => {
          if (cancelled || !map) {
            return;
          }

          hasLoaded = true;

          const bounds = new maplibregl.LngLatBounds();

          if (estimatedRoute) {
            const plannedPoints = [
              {
                className: "shipment-map-marker shipment-map-marker-planned",
                coordinates: [estimatedRoute.origin.longitude, estimatedRoute.origin.latitude] as [
                  number,
                  number,
                ],
                label: estimatedRoute.origin.label,
                text: "Start",
              },
              {
                className: "shipment-map-marker shipment-map-marker-planned",
                coordinates: [
                  estimatedRoute.destination.longitude,
                  estimatedRoute.destination.latitude,
                ] as [number, number],
                label: estimatedRoute.destination.label,
                text: "End",
              },
            ];

            plannedPoints.forEach((point) => {
              const markerElement = document.createElement("div");
              markerElement.className = point.className;
              markerElement.textContent = point.text;

              new maplibregl.Marker({ anchor: "bottom", element: markerElement })
                .setLngLat(point.coordinates)
                .setPopup(
                  new maplibregl.Popup({
                    closeButton: false,
                    closeOnClick: true,
                    offset: 22,
                  }).setText(point.label),
                )
                .addTo(map!);
              bounds.extend(point.coordinates);
            });

            const estimatedMarker = document.createElement("div");
            estimatedMarker.className = "shipment-map-marker shipment-map-marker-estimated";
            estimatedMarker.textContent = "Est";

            new maplibregl.Marker({ anchor: "bottom", element: estimatedMarker })
              .setLngLat([
                estimatedRoute.estimatedPosition.longitude,
                estimatedRoute.estimatedPosition.latitude,
              ])
              .setPopup(
                new maplibregl.Popup({
                  closeButton: false,
                  closeOnClick: true,
                  maxWidth: "280px",
                  offset: 22,
                }).setDOMContent(createEstimatedPopupContent(estimatedRoute)),
              )
              .addTo(map!);
            bounds.extend([
              estimatedRoute.estimatedPosition.longitude,
              estimatedRoute.estimatedPosition.latitude,
            ]);

            map.addSource("estimated-shipment-route", {
              data: {
                geometry: {
                  coordinates: [
                    [estimatedRoute.origin.longitude, estimatedRoute.origin.latitude],
                    [estimatedRoute.destination.longitude, estimatedRoute.destination.latitude],
                  ],
                  type: "LineString",
                },
                properties: {},
                type: "Feature",
              },
              type: "geojson",
            });
            map.addLayer({
              id: "estimated-shipment-route-line",
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
              paint: {
                "line-color": "#2563eb",
                "line-dasharray": [1.5, 1.5],
                "line-opacity": 0.8,
                "line-width": 3,
              },
              source: "estimated-shipment-route",
              type: "line",
            });
          } else {
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

              new maplibregl.Marker({ anchor: "bottom", element: markerElement })
                .setLngLat([checkpoint.longitude, checkpoint.latitude])
                .setPopup(popup)
                .addTo(map!);

              bounds.extend([checkpoint.longitude, checkpoint.latitude]);
            });
          }

          if (!estimatedRoute && checkpoints.length > 1) {
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
          } else if (bounds.isEmpty()) {
            map.setCenter([initialPoint.longitude, initialPoint.latitude]);
            map.setZoom(13);
          } else if (estimatedRoute) {
            map.fitBounds(bounds, {
              duration: 0,
              maxZoom: 10,
              padding: 56,
            });
          } else {
            map.setCenter([initialPoint.longitude, initialPoint.latitude]);
            map.setZoom(13);
          }

          map.resize();
        });

        // A single failed tile after the style has loaded should not remove a usable map.
        // Only treat startup errors as fatal to the map surface.
        map.on("error", () => {
          if (!hasLoaded) {
            handleMapError();
          }
        });
      } catch {
        handleMapError();
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [apiKey, checkpoints, estimatedRoute]);

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
