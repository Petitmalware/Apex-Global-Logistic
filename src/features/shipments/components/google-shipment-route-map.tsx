"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";

import type { ShipmentRouteCoordinate } from "@/features/shipments/components/shipment-route-map";

type GoogleShipmentRouteMapProps = {
  apiKey: string;
  coordinates: ShipmentRouteCoordinate[];
  shipmentNumber: string;
};

let configuredApiKey: string | null = null;

function loadMapsLibrary(apiKey: string) {
  if (!configuredApiKey) {
    setOptions({
      key: apiKey,
      v: "weekly",
    });
    configuredApiKey = apiKey;
  }

  return importLibrary("maps");
}

export function GoogleShipmentRouteMap({
  apiKey,
  coordinates,
  shipmentNumber,
}: GoogleShipmentRouteMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      try {
        const maps = await loadMapsLibrary(apiKey);

        if (cancelled || !mapElement.current) {
          return;
        }

        const latest = coordinates.at(-1)!;
        const map = new maps.Map(mapElement.current, {
          center: {
            lat: latest.latitude,
            lng: latest.longitude,
          },
          clickableIcons: false,
          disableDefaultUI: true,
          fullscreenControl: true,
          gestureHandling: "cooperative",
          mapTypeControl: false,
          streetViewControl: false,
          zoom: 12,
          zoomControl: true,
        });
        const bounds = new google.maps.LatLngBounds();

        coordinates.forEach((coordinate, index) => {
          const position = {
            lat: coordinate.latitude,
            lng: coordinate.longitude,
          };
          const isLatest = index === coordinates.length - 1;

          bounds.extend(position);
          new google.maps.Marker({
            label: isLatest ? "Now" : `${index + 1}`,
            map,
            position,
            title: `${isLatest ? "Latest checkpoint" : "Checkpoint"}: ${coordinate.label}`,
          });
        });

        if (coordinates.length > 1) {
          new google.maps.Polyline({
            geodesic: true,
            map,
            path: coordinates.map((coordinate) => ({
              lat: coordinate.latitude,
              lng: coordinate.longitude,
            })),
            strokeColor: "#c78c09",
            strokeOpacity: 0.9,
            strokeWeight: 4,
          });
          map.fitBounds(bounds, 56);
        } else {
          map.setCenter(bounds.getCenter());
          map.setZoom(13);
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
        }
      }
    }

    void renderMap();

    return () => {
      cancelled = true;
    };
  }, [apiKey, coordinates]);

  if (loadError) {
    return (
      <div className="bg-surface flex h-[22rem] items-center justify-center p-6 text-center sm:h-[28rem]">
        <p className="text-muted-foreground max-w-sm text-sm leading-6">
          Google Maps could not load this checkpoint. The latest shipment location and timeline are
          still available above.
        </p>
      </div>
    );
  }

  return (
    <div
      aria-label={`Google map for shipment ${shipmentNumber}`}
      className="h-[22rem] w-full sm:h-[28rem]"
      ref={mapElement}
      role="application"
    />
  );
}
