# Production Optimization

This document captures the current production-readiness optimization baseline for Apex Global Logistics.

## Performance

- `next.config.ts` enables standalone output, compression, AVIF/WebP image formats, long-lived static image caching, and `lucide-react` package import optimization.
- Public images under `/images/*` and `/brand-mark.svg` are served with immutable cache headers.
- The home hero keeps `priority` because it is the primary visual/LCP candidate. Desktop-only auth imagery no longer preloads on mobile.
- Shared loading UI in `src/app/loading.tsx` improves perceived latency while dynamic routes resolve.
- Analytics dashboard aggregation is cached for 60 seconds with `unstable_cache` to avoid regenerating expensive database and AI insight work on every request.

## Database

- Shipment, pet transport, freight transport, notification, email template, and email log list queries use focused `select` shapes.
- Shipment list package counts use Prisma `_count` instead of loading package rows.
- Email log lists avoid loading stored HTML bodies and provider payloads unless a detail/editor view actually needs them.

## SEO

- `src/config/site.ts` centralizes site name, public URL, OG image, keywords, support contact data, and absolute URL generation.
- Root metadata includes Open Graph, Twitter cards, robots policy, manifest, mobile app metadata, and deployment-aware `metadataBase`.
- `sitemap.ts`, `robots.ts`, and home JSON-LD use the configured `NEXT_PUBLIC_APP_URL` instead of localhost.

## Accessibility And Mobile

- A visible-on-focus skip link targets real page `<main>` elements.
- Reduced-motion preferences disable non-essential animation and transition timing.
- Dashboard top navigation scrolls horizontally on narrow viewports instead of increasing header height.
- Tables already wrap in an overflow container for mobile scanning.

## Follow-Up Profiling

- Run Lighthouse against a production build served from the deployment domain, not the development server.
- Capture database query plans with real production-volume data before adding indexes beyond the current Prisma schema.
- Replace the single large hero source image with pre-compressed AVIF/WebP source assets when final brand imagery is approved.
