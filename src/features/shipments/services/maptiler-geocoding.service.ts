import "server-only";

import { env } from "@/config/env.server";

type MapTilerGeocodingResponse = {
  features?: Array<{
    center?: [number, number];
    place_name?: string;
    text?: string;
  }>;
};

type NominatimGeocodingResponse = Array<{
  display_name?: string;
  lat?: string;
  lon?: string;
}>;

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

const geocodeCache = new Map<
  string,
  {
    expiresAt: number;
    value: ShipmentLocationGeocode;
  }
>();
const GEOCODE_CACHE_TTL_MS = 15 * 60 * 1000;
const NOMINATIM_MINIMUM_REQUEST_INTERVAL_MS = 1_100;
let nextNominatimRequestAt = 0;

async function waitForNominatimRequestSlot() {
  const now = Date.now();
  const requestAt = Math.max(now, nextNominatimRequestAt);
  nextNominatimRequestAt = requestAt + NOMINATIM_MINIMUM_REQUEST_INTERVAL_MS;

  if (requestAt > now) {
    await new Promise((resolve) => setTimeout(resolve, requestAt - now));
  }
}

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
  const cacheKey = `${env.MAP_GEOCODING_PROVIDER}:${normalizedQuery.toLowerCase()}`;

  const cached = geocodeCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  if (!normalizedQuery) {
    return {
      coordinates: null,
      formattedAddress: null,
      reason: "not_found",
    };
  }

  try {
    if (env.MAP_GEOCODING_PROVIDER === "maptiler") {
      if (!apiKey) {
        return {
          coordinates: null,
          formattedAddress: null,
          reason: "not_configured",
        };
      }

      const applicationOrigin = new URL(env.NEXT_PUBLIC_APP_URL).origin;
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(normalizedQuery)}.json?key=${encodeURIComponent(apiKey)}&limit=1`,
        {
          cache: "no-store",
          headers: {
            Referer: `${applicationOrigin}/`,
          },
          signal: AbortSignal.timeout(env.MAP_REQUEST_TIMEOUT_MS),
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
      const feature = payload.features?.[0];
      const [longitude, latitude] = feature?.center ?? [];

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

      const geocode = {
        coordinates: {
          latitude,
          longitude,
        },
        formattedAddress: feature?.place_name ?? feature?.text ?? null,
        reason: null,
      };

      geocodeCache.set(cacheKey, { expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS, value: geocode });

      return geocode;
    }

    await waitForNominatimRequestSlot();

    const requestUrl = new URL("/search", env.MAP_NOMINATIM_BASE_URL);
    requestUrl.searchParams.set("format", "jsonv2");
    requestUrl.searchParams.set("limit", "1");
    requestUrl.searchParams.set("q", normalizedQuery);
    const response = await fetch(requestUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": env.MAP_GEOCODING_USER_AGENT,
      },
      signal: AbortSignal.timeout(env.MAP_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        coordinates: null,
        formattedAddress: null,
        reason: "unavailable",
      };
    }

    const payload = (await response.json()) as NominatimGeocodingResponse;
    const place = payload[0];
    const latitude = Number(place?.lat);
    const longitude = Number(place?.lon);

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

    const geocode = {
      coordinates: {
        latitude,
        longitude,
      },
      formattedAddress: place?.display_name ?? null,
      reason: null,
    };

    geocodeCache.set(cacheKey, { expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS, value: geocode });

    return geocode;
  } catch {
    return {
      coordinates: null,
      formattedAddress: null,
      reason: "unavailable",
    };
  }
}
