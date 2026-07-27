# Road Route Tracking

## What this feature provides

Administrators can calculate and save a road route for an existing shipment. The application geocodes the origin and destination, asks the configured router for a road geometry, and stores the geometry, distance, duration, route position, and status timing in PostgreSQL.

The customer tracking page then displays the saved road route, route progress, remaining distance, and ETA without querying a geocoding or routing provider again. A route progresses only while the shipment status is `IN_TRANSIT`.

This is an operational route-progress estimate. It is not described as live GPS, vehicle tracking, satellite tracking, or a hardware device feed.

## Required environment variables

```dotenv
# Nominatim is the default geocoder. Use a meaningful identifying value.
MAP_GEOCODING_PROVIDER=nominatim
MAP_GEOCODING_USER_AGENT=ApexGlobalLogistics/1.0 (support@your-domain.example)
MAP_NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org

# OSRM road routing endpoint. Replace with a self-hosted compatible endpoint later if needed.
MAP_OSRM_BASE_URL=https://router.project-osrm.org
MAP_REQUEST_TIMEOUT_MS=10000

# Progress speed used only for ACCELERATED route demonstrations.
MAP_ROUTE_SIMULATION_SPEED=1

# Optional. MapTiler can provide an alternate street-map style. The map still works with
# OpenStreetMap street tiles when this is blank.
NEXT_PUBLIC_MAPTILER_API_KEY=

# Optional map styles. Do not configure an aerial, terrain, or dark option unless you have
# a valid style URL and are entitled to use that tile provider.
NEXT_PUBLIC_MAP_DARK_STYLE_URL=
NEXT_PUBLIC_MAP_TERRAIN_STYLE_URL=
NEXT_PUBLIC_MAP_AERIAL_STYLE_URL=
```

`NEXT_PUBLIC_MAPTILER_API_KEY` is intentionally public because the browser needs it to load a MapTiler style. Restrict that key to the production website origin in MapTiler. Do not put SMTP, database, AI, or other private keys in any `NEXT_PUBLIC_` variable.

## Deploying the migration

1. Pull the release onto the server.
2. Add the variables above to `.env.production`.
3. Apply the migration before starting the new app image:

```bash
npm run db:migrate:deploy
```

For the existing Docker deployment, run the checked-in deployment script from the project root. It builds the app with the public map-style variables, starts the data services, applies migrations, then starts the app:

```bash
bash deploy/scripts/deploy-docker.sh
```

4. Open an admin shipment, enter the sender/origin and recipient/destination addresses in **Road route**, and select **Calculate route**.
5. Set the shipment to **In Transit** to begin the saved schedule. Use **On Hold**, **Delayed**, **Cancelled**, or any non-transit status to pause it. **Delivered** fixes the route at 100%.

## Progress modes

- `REALTIME`: one route hour takes one real hour.
- `ACCELERATED`: the configured simulation speed reduces the elapsed real time. Use only where the customer-facing operational/simulation wording remains visible.
- `MANUAL`: an authorized administrator sets the progress percentage deliberately.

Progress is calculated server-side from stored timestamps and status. Reloading a page does not restart the shipment at the origin.

## Public service limits

The default Nominatim and OSRM hosts are shared community services, suitable only for low-volume operational use and testing. The application caches geocoding responses for 15 minutes and limits Nominatim requests in one application process to one request about every 1.1 seconds. Route geometry is saved after calculation, so marker animation never repeatedly calls a public router.

Do not bulk-geocode addresses or use public endpoints as an unlimited production dependency. Follow the applicable terms for Nominatim, OpenStreetMap tile servers, OSRM, and any configured style provider.

## Scaling later

Replace the provider URLs without changing the shipment UI:

- Host Nominatim or use a commercial, policy-compliant geocoder by changing `MAP_GEOCODING_PROVIDER` and the geocoding service configuration.
- Host OSRM, Valhalla, or another OSRM-compatible router and set `MAP_OSRM_BASE_URL` to its base URL.
- Host map tiles or configure a licensed style URL through the optional map-style variables.

For actual vehicle tracking, add a hardware or carrier telemetry provider that writes verified latitude/longitude updates to the shipment route. Keep that feed visibly distinct from scheduled route progress.
