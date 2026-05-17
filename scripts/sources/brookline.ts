import centroid from '@turf/centroid';
import type { Location } from '../../src/types/space.ts';
import type { SourceFetcher, SourceFetchResult } from './types.ts';
import { computeIsStale } from './util.ts';

const ARCGIS_URL =
  'https://gisweb.brooklinema.gov/arcgis/rest/services/PublicParking/MapServer/2/query';
const SOURCE_URL =
  'https://gisweb.brooklinema.gov/arcgis/rest/services/PublicParking/MapServer/2';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT =
  'accessible-parking-map/0.1 (https://github.com/mijourn/accessible-parking-map)';
const NOMINATIM_DELAY_MS = 1100;
const EXPECTED_COUNT = 207;

interface ArcGISFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    OBJECTID: number;
    AccessType: string | null;
    last_edited_date: number;
  };
}

interface ArcGISResponse {
  type: 'FeatureCollection';
  features: ArcGISFeature[];
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  cycleway?: string;
  path?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
  error?: string;
}

async function fetchArcGIS(): Promise<ArcGISResponse> {
  const params = new URLSearchParams({
    where: 'HAccessible=1',
    outFields: 'OBJECTID,AccessType,last_edited_date',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'geojson',
  });
  const res = await fetch(`${ARCGIS_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(
      `ArcGIS fetch failed: ${res.status.toString()} ${res.statusText}`,
    );
  }
  return (await res.json()) as ArcGISResponse;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeHouseNumber(raw: string | undefined): string | null {
  if (!raw) return null;
  const parts = Array.from(
    new Set(
      raw
        .split(';')
        .map((p) => p.trim())
        .filter((p) => p.length > 0),
    ),
  );
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]!}–${parts[parts.length - 1]!}`;
}

const ADMIN_REGIONS = new Set([
  'Brookline',
  'Boston',
  'Norfolk County',
  'Suffolk County',
  'Massachusetts',
  'United States',
]);

function isAdminComponent(component: string): boolean {
  const trimmed = component.trim();
  if (ADMIN_REGIONS.has(trimmed)) return true;
  if (/^\d{5}$/.test(trimmed)) return true;
  return false;
}

function cleanDisplayName(displayName: string): string | null {
  const components = displayName.split(',').map((c) => c.trim());
  const usable = components.filter((c) => c && !isAdminComponent(c));
  if (usable.length === 0) return null;
  const first = usable[0]!;
  if (first.length < 15 && usable.length >= 2) {
    return `${first}, ${usable[1]!}`;
  }
  return first;
}

function formatAddress(resp: NominatimResponse): string | null {
  const a = resp.address;
  if (a) {
    const road = a.road ?? a.pedestrian ?? a.footway ?? a.cycleway ?? a.path;
    const houseNumber = normalizeHouseNumber(a.house_number);
    if (road && houseNumber) return `${houseNumber} ${road}`;
    if (road) return road;
  }
  if (resp.display_name) {
    return cleanDisplayName(resp.display_name);
  }
  return null;
}

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: 'json',
    zoom: '18',
    addressdetails: '1',
  });
  try {
    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) {
      console.warn(
        `  nominatim ${res.status.toString()} for ${lat.toString()},${lng.toString()}`,
      );
      return null;
    }
    const data = (await res.json()) as NominatimResponse;
    if (data.error) {
      console.warn(`  nominatim error: ${data.error}`);
      return null;
    }
    return formatAddress(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  nominatim threw: ${msg}`);
    return null;
  }
}

export const brooklineFetcher: SourceFetcher = {
  info: {
    source: 'brookline-gis',
    name: 'Brookline GIS PublicParking layer 2',
    sourceUrl: SOURCE_URL,
    locationCount: 0,
  },

  async fetch(): Promise<SourceFetchResult> {
    console.log(`  fetching ArcGIS: HAccessible=1 ...`);
    const arcgis = await fetchArcGIS();
    const total = arcgis.features.length;
    console.log(`  got ${total.toString()} features`);
    if (total !== EXPECTED_COUNT) {
      console.warn(
        `  expected ${EXPECTED_COUNT.toString()}, got ${total.toString()} — continuing`,
      );
    }

    const locations: Location[] = [];
    for (let i = 0; i < total; i++) {
      const feat = arcgis.features[i]!;
      const c = centroid(feat.geometry);
      const [lng, lat] = c.geometry.coordinates as [number, number];
      const address = await reverseGeocode(lat, lng);
      const lastConfirmed = new Date(
        feat.properties.last_edited_date,
      ).toISOString();
      locations.push({
        id: `brookline-${feat.properties.OBJECTID.toString()}`,
        source: 'brookline-gis',
        lat,
        lng,
        polygon: feat.geometry.coordinates,
        address,
        spaceCount: 1,
        vanAccessible: feat.properties.AccessType === 'Van',
        lastConfirmed,
        isStale: computeIsStale(lastConfirmed),
      });
      const n = i + 1;
      if (n % 10 === 0 || n === total) {
        console.log(
          `  [${n.toString()}/${total.toString()}] geocoded: ${address ?? 'address unavailable'}`,
        );
      }
      if (n < total) {
        await sleep(NOMINATIM_DELAY_MS);
      }
    }

    return {
      info: {
        source: 'brookline-gis',
        name: 'Brookline GIS PublicParking layer 2',
        sourceUrl: SOURCE_URL,
        locationCount: locations.length,
      },
      locations,
    };
  },
};
