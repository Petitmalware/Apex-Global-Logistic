"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";

export type ShipmentRouteCoordinate = {
  label: string;
  latitude: number;
  longitude: number;
  occurredAt: string;
};

export type ShipmentRouteMapProps = {
  coordinates: ShipmentRouteCoordinate[];
  shipmentNumber: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function RouteViewport({ position }: { position: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, 14, { animate: false });
    map.invalidateSize();
  }, [map, position]);

  return null;
}

export function ShipmentRouteMap({ coordinates, shipmentNumber }: ShipmentRouteMapProps) {
  const positions = coordinates.map(
    (coordinate): LatLngExpression => [coordinate.latitude, coordinate.longitude],
  );
  const currentIndex = coordinates.length - 1;

  return (
    <MapContainer
      aria-label={`Street map for shipment ${shipmentNumber}`}
      center={positions[currentIndex] ?? [0, 0]}
      className="shipment-route-map h-[22rem] w-full sm:h-[28rem]"
      scrollWheelZoom={false}
      zoom={14}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RouteViewport position={positions[currentIndex]!} />
      {positions.length > 1 ? <Polyline color="#c78c09" positions={positions} weight={4} /> : null}
      {coordinates.map((coordinate, index) => {
        const isCurrent = index === currentIndex;

        return (
          <CircleMarker
            center={positions[index]!}
            color={isCurrent ? "#10213b" : "#8c6308"}
            fill
            fillColor={isCurrent ? "#f7ba2b" : "#f8dc9a"}
            fillOpacity={1}
            key={`${coordinate.occurredAt}-${coordinate.latitude}-${coordinate.longitude}`}
            radius={isCurrent ? 9 : 6}
            weight={isCurrent ? 4 : 2}
          >
            <Tooltip direction="top" offset={[0, -8]} sticky>
              <span className="font-semibold">
                {isCurrent ? "Latest checkpoint" : "Checkpoint"}
              </span>
              <br />
              {coordinate.label}
              <br />
              <span className="text-xs">{formatDate(coordinate.occurredAt)}</span>
            </Tooltip>
          </CircleMarker>
        );
      })}
      <ZoomControl position="topright" />
    </MapContainer>
  );
}
