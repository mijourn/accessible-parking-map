# Accessible Parking Map

## What this is
A static web app that displays Brookline, MA's publicly published accessible
on-street parking spaces on a map. Read-only, data sourced from Brookline's
public ArcGIS PublicParking MapServer.

Live URL: https://mijourn.github.io/accessible-parking-map/
Source dataset: https://gisweb.brooklinema.gov/arcgis/rest/services/PublicParking/MapServer/2

## Scope (v1)
- Brookline only. Boston is a v2 candidate.
- 207 accessible spaces as of the most recent snapshot.
- No user accounts, no backend, no crowdsourcing, no admin mode, no export.

## Stack
- Vite + React + TypeScript
- MapLibre GL JS (no API key, no Mapbox)
- Raw `fetch` against the ArcGIS REST endpoint (snapshot script only)
- Nominatim (reverse-geocoding, build-time only, must include polite User-Agent)
- Deployed to GitHub Pages via GitHub Actions

## Architecture
Build-time snapshot pipeline → committed JSON → static React app reads JSON.

- `scripts/snapshot.ts` — fetches Brookline ArcGIS data, reverse-geocodes
  centroids, writes `public/data/spaces.json`. Run manually with `npm run snapshot`.
- `public/data/spaces.json` — the committed data file the app loads at runtime.
- `src/` — the React app. Loads spaces.json once on mount.

The app never calls ArcGIS or Nominatim at runtime. All data is static.

## Data model (spaces.json)
Each space:
- `id`: number (OBJECTID from ArcGIS)
- `lat`, `lng`: centroid in EPSG:4326
- `polygon`: GeoJSON Polygon coordinates (for map rendering)
- `vanAccessible`: boolean (true if AccessType === "Van")
- `address`: string | null (from Nominatim, null if geocoding failed)
- `lastUpdated`: ISO date string (from last_edited_date)

## Filters (v1)
- Street search: case-insensitive substring match on `address`
- Van-only toggle

Filters from ChatGPT's original spec that were cut because the data does not
support them: town filter (single town), lot filter (this layer is on-street
only), access-type filter (only "Van" is meaningfully populated — collapsed
into the van-only toggle).

## Detail panel (on polygon click)
- Address (or "Address unavailable" if geocoding failed)
- Van-accessible badge (if applicable)
- Last updated date
- "Open in Google Maps" link → opens the lat/lng in Maps in a new tab

## Honesty / data caveats
- Footer: "Data: Brookline GIS, snapshot taken {date}"
- Brief notice on first load: data may be incomplete or out of date; for
  resident-requested home-address spaces, check with the Town of Brookline.

## Conventions
- TypeScript strict mode on.
- All clickable UI text capitalized as proper labels ("Open in Google Maps",
  not "open in google maps") except text that's part of a complete sentence.
- No explicit `any`. Implicit `any` from third-party type holes (e.g.,
  MapLibre's `GeoJsonProperties`) is acceptable when narrowed via a typed
  cast at the boundary.
- Components in PascalCase, hooks in camelCase prefixed with `use`.
- Tailwind for styling. No CSS modules, no styled-components.
- One component per file.

## Git
Per-repo identity (not global):
- user.name: mijourn
- user.email: 285515159+mijourn@users.noreply.github.com

## Commits
Conventional Commits format. Examples:
- feat: add van-only filter
- fix: handle null address in detail panel
- chore: refresh spaces.json snapshot
- docs: update CHANGELOG

## Deployment
GitHub Pages via Actions. Build runs on push to `main`. Repo must be public
or use GitHub Pages with a Pro account.

## What's NOT in v1 (deferred)
- Boston OSAP data
- GeoJSON/CSV export
- Admin mode / manual corrections
- Crowdsourcing
- Mobile app
- Live ArcGIS queries (we use snapshot model instead)

## Files Code should keep updated as work progresses
- `CHANGELOG.md` — running log of what changed and when
- `CLAUDE.md` (this file) — when scope or architecture decisions change
