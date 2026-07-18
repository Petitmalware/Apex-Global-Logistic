import "server-only";

import { env } from "@/config/env.server";

type MapTilerGeocodingResponse = {
  features?: Array<{
    center?: [number, number];
    place_name?: string;
    text?: string;
  }>;
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

function isValidCoordinates(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export async function geocodeShipmentLocation(query: string): Promise<ShipmentLocationGeocode> {
  const apiKey = env.MAPTILER_API_KEY?.trim();
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
    const applicationOrigin = new URL(env.NEXT_PUBLIC_APP_URL).origin;
    const response = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(normalizedQuery)}.json?key=${encodeURIComponent(apiKey)}&limit=1`,
      {
        cache: "no-store",
        headers: {
          Referer: `${applicationOrigin}/`,
        },
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

    const payload = (await response.json()) as MapTilerGeocodingResponse;
    const result = payload.features?.[0];
    const [longitude, latitude] = result?.center ?? [];

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !isValidCoordinates(latitude, longitude)
    ) {
      return {
        coordinates: null,
        formattedAddress: null,
        reason: "not_found",
      };
    }

    return {
      coordinates: {
        latitude,
        longitude,
      },
      formattedAddress: result?.place_name ?? result?.text ?? null,
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
