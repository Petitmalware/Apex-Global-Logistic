import "server-only";

import { env } from "@/config/env.server";

type GoogleGeocodingResponse = {
  results?: Array<{
    formatted_address?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  }>;
  status?: string;
};

export type ShipmentLocationGeocode =
  | {
      coordinates: {
        latitude: number;
        longitude: number;
      };
      formattedAddress: string | null;
      reason: null;
    }
  | {
      coordinates: null;
      formattedAddress: null;
      reason: "not_configured" | "not_found" | "unavailable";
    };

export async function geocodeShipmentLocation(query: string): Promise<ShipmentLocationGeocode> {
  const apiKey = env.GOOGLE_MAPS_GEOCODING_API_KEY?.trim();
  const normalizedQuery = query.trim();

  if (!apiKey) {
    return {
      coordinates: null,
      formattedAddress: null,
      reason: "not_configured",
    };
  }

  if (!normalizedQuery) {
    return {
      coordinates: null,
      formattedAddress: null,
      reason: "not_found",
    };
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        normalizedQuery,
      )}&key=${encodeURIComponent(apiKey)}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) {
      return {
        coordinates: null,
        formattedAddress: null,
        reason: "unavailable",
      };
    }

    const payload = (await response.json()) as GoogleGeocodingResponse;
    const result = payload.status === "OK" ? payload.results?.[0] : null;
    const latitude = result?.geometry?.location?.lat;
    const longitude = result?.geometry?.location?.lng;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return {
        coordinates: null,
        formattedAddress: null,
        reason: "not_found",
      };
    }

    return {
      coordinates: {
        latitude: latitude as number,
        longitude: longitude as number,
      },
      formattedAddress: result?.formatted_address ?? null,
      reason: null,
    };
  } catch {
    return {
      coordinates: null,
      formattedAddress: null,
      reason: "unavailable",
    };
  }
}
