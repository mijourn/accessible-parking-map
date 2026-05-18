# Accessible Parking Map

A web map of publicly published accessible on-street parking spaces in Brookline and Boston, Massachusetts.

Live: <https://mijourn.github.io/accessible-parking-map/>

![Screenshot of the map showing Brookline and Boston with blue and amber parking dots](docs/screenshot.png)

## What's here

- **347 locations** across two municipal datasets: Brookline GIS PublicParking and Boston OSAP (On-Street Accessible Parking).
- **634 accessible spaces total** — most locations have one space, but Boston multi-space locations (e.g., near hospitals) can have up to 16 at one address.
- Brookline addresses are reverse-geocoded via [Nominatim](https://nominatim.openstreetmap.org/) at snapshot time; Boston ships addresses in the source data.
- Each location has a "last confirmed" date. Locations older than 3 years are shown in amber instead of blue.

## What's not here

This is intentionally a thin map over public data, not a comprehensive inventory:

- **Resident-requested home-address spaces are not included** in either source dataset. For those, contact the relevant town directly.
- **Boston's coverage is incomplete** by the city's own admission — the dataset focuses on major commercial areas and main streets. 56% of Boston locations were last confirmed in 2017 or earlier.
- No crowdsourcing, no user submissions, no admin mode.

## Accessibility limitations

The interface is currently map-only and is not fully usable by keyboard-only or screen-reader users. The map content is rendered to a canvas and is not exposed to assistive technology. If you rely on a screen reader and need this data, the source datasets are linked below — both publish in formats designed for direct data access.

This is a known gap, not a design choice. A list view alongside the map would address it; that work is on the backlog.

## Tech

Vite, React 19, TypeScript, MapLibre GL JS, Tailwind v4. Deployed to GitHub Pages.

## Development

- `npm install` — install dependencies
- `npm run dev` — start the local dev server at http://localhost:5173/accessible-parking-map/
- `npm run build` — type-check and produce a production build in `dist/`
- `npm run snapshot` — fetch the latest data from both source datasets, normalize, reverse-geocode Brookline centroids via Nominatim, and write `public/data/spaces.json` (~5 minutes; Nominatim is rate-limited)

## Refreshing the data

1. Run `npm run snapshot` to regenerate `public/data/spaces.json`.
2. Commit the updated file: `git add public/data/spaces.json && git commit -m "chore: refresh spaces.json snapshot"`.
3. Push to `main`. GitHub Actions builds and deploys to Pages automatically.

## Data sources

- [Brookline GIS PublicParking](https://gisweb.brooklinema.gov/arcgis/rest/services/PublicParking/MapServer/2) — ArcGIS Feature Layer, public, no auth.
- [Boston OSAP](https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/On_Street_Accessible_Parking_Spaces/FeatureServer/0) — ArcGIS Feature Layer hosted by BostonGIS, public, no auth. Backing dataset for the [official Boston OSAP map](https://www.boston.gov/departments/disabilities-commission/street-accessible-parking-map).

## License

MIT — see [LICENSE](LICENSE).
