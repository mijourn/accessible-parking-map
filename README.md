# Accessible Parking Map

An interactive web map showing accessible (HAccessible) on-street parking spaces in Brookline, Massachusetts. Data is snapshotted at build time from the [Brookline GIS PublicParking MapServer](https://gisweb.brooklinema.gov/arcgis/rest/services/PublicParking/MapServer/2) and reverse-geocoded for street addresses via [Nominatim](https://nominatim.openstreetmap.org/). Live at <https://mijourn.github.io/accessible-parking-map/>.

The dataset reflects only the spaces Brookline has published in its public GIS layer. **Resident-requested home-address accessible spaces are not in the public dataset and therefore are not shown here.** For those, contact the Town of Brookline directly.

## Development

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and produce a production build in `dist/`
- `npm run snapshot` — fetch the latest data from Brookline's ArcGIS endpoint, reverse-geocode each centroid, and write `public/data/spaces.json` (~5 minutes; Nominatim is rate-limited to 1 req/s)

## Refreshing the data

1. Run `npm run snapshot` to regenerate `public/data/spaces.json`.
2. Commit the updated file: `git add public/data/spaces.json && git commit -m "chore: refresh spaces.json snapshot"`.
3. Push to `main`. GitHub Actions builds and deploys to Pages automatically.

## Tech

Vite, React 19, TypeScript, MapLibre GL JS, Tailwind v4, GitHub Pages.

## License

TBD.
