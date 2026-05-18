# Changelog

All notable changes to this project will be documented here.

## [0.2.0] - 2026-05-17

### Changed
- Repository migration: renamed to accessible-parking-map, moved to mijourn account
- Commit signing enabled (SSH)

## [Unreleased]

### Added
- Boston OSAP (On-Street Accessible Parking) dataset integration — 140 locations, 427 total spaces
- Pluggable per-source snapshot pipeline (`scripts/sources/`)
- Per-location space count badges on map (for locations with >1 space)
- Stale data visual indicator (amber circle + detail panel badge) for locations >3 years since last confirmed
- Honesty notice expanded to mention both cities and the 2017 staleness issue
- Initial project scaffolding (Vite + React + TS + MapLibre + Tailwind)
- Snapshot script: fetches Brookline accessible parking spaces and reverse-geocodes via Nominatim
- Initial `public/data/spaces.json` snapshot (207 spaces)
- Shared `Space` type in `src/types/space.ts`
- Detail panel showing address, van-accessible badge, last-updated date, Google Maps link
- Filter bar with street search and van-only toggle
- Filtered count display
- GitHub Pages deploy workflow (`.github/workflows/deploy.yml`)
- Vite base path `/accessible-parking-map/` for GitHub Pages project-page hosting

### Changed
- Renamed `Space` type → `Location` to reflect that one feature may have N spaces (Boston model)
- Renamed `useSpaces` → `useLocations` hook
- Single point-based map rendering (dropped polygon layer); polygons retained in data for future use
- Detail panel: "Last updated" → "Last confirmed"; added space count line
- Snapshot script normalizes multi-house-number addresses with an en dash (e.g., "1862–1870 Beacon Street")
- Initial map view tuned (center [-71.122, 42.336], zoom 14)

### Accessibility and UX cleanup
- "No spaces match these filters" empty-state message
- First-load honesty notice about data completeness (dismissible, persisted in `sessionStorage`)
- Screen-reader-only label on the search input
- `aria-live="polite"` on the visible-count text
- Filters wrapped in a `<section aria-label="Filters">` landmark
- `role="application"` + `aria-label` on the map container
- Escape key closes the detail panel
- Muted text color bumped from `text-gray-500` to `text-gray-600` for WCAG AA contrast
- Removed dead deps `@esri/arcgis-rest-feature-service`, `@esri/arcgis-rest-request`
- Renamed `Map` → `ParkingMap` to avoid shadowing the global `Map` constructor
