import type { Location } from '../../src/types/space.ts';
import type { SourceFetcher, SourceFetchResult } from './types.ts';
import { computeIsStale } from './util.ts';

const ARCGIS_URL =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/On_Street_Accessible_Parking_Spaces/FeatureServer/0/query';
const SOURCE_URL =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/On_Street_Accessible_Parking_Spaces/FeatureServer/0';

interface BostonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  } | null;
  properties: {
    ObjectId: number;
    address_full: string | null;
    address_street_number: string | null;
    address_street_name: string | null;
    commercial_area: string | null;
    zipcode: number | null;
    number_of_ap_spaces: number | null;
    year_space_last_confirmed: number | null;
    latitude: number | null;
    longitude: number | null;
  };
}

interface BostonResponse {
  type: 'FeatureCollection';
  features: BostonFeature[];
}

const STREET_SUFFIX_MAP: Record<string, string> = {
  st: 'Street',
  street: 'Street',
  ave: 'Avenue',
  avenue: 'Avenue',
  rd: 'Road',
  road: 'Road',
  blvd: 'Boulevard',
  boulevard: 'Boulevard',
  dr: 'Drive',
  drive: 'Drive',
  ln: 'Lane',
  lane: 'Lane',
  pl: 'Place',
  place: 'Place',
  sq: 'Square',
  square: 'Square',
};

function normalizeStreetSuffix(streetPart: string): string {
  const match = /^(.*\s)(\S+)$/.exec(streetPart);
  if (!match) return streetPart;
  const prefix = match[1]!;
  const lastWord = match[2]!;
  const normalized = STREET_SUFFIX_MAP[lastWord.toLowerCase()];
  return normalized ? `${prefix}${normalized}` : streetPart;
}

function normalizeBostonAddress(
  addressFull: string | null | undefined,
): string | null {
  if (!addressFull) return null;
  const trimmed = addressFull.trim();
  if (!trimmed) return null;

  const zipMatch = /^(.*?),\s*(\d{1,5})\s*$/.exec(trimmed);
  let streetPart: string;
  let zipPart: string | null;
  if (zipMatch) {
    streetPart = zipMatch[1]!.trim();
    zipPart = zipMatch[2]!.padStart(5, '0');
  } else {
    streetPart = trimmed;
    zipPart = null;
  }

  const normalizedStreet = normalizeStreetSuffix(streetPart);
  return zipPart ? `${normalizedStreet}, ${zipPart}` : normalizedStreet;
}

async function fetchBoston(): Promise<BostonResponse> {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'geojson',
  });
  const res = await fetch(`${ARCGIS_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(
      `Boston ArcGIS fetch failed: ${res.status.toString()} ${res.statusText}`,
    );
  }
  return (await res.json()) as BostonResponse;
}

export const bostonFetcher: SourceFetcher = {
  info: {
    source: 'boston-osap',
    name: 'Boston OSAP (On-Street Accessible Parking)',
    sourceUrl: SOURCE_URL,
    locationCount: 0,
  },

  async fetch(): Promise<SourceFetchResult> {
    console.log(`  fetching Boston OSAP ...`);
    const data = await fetchBoston();
    const total = data.features.length;
    console.log(`  got ${total.toString()} features`);

    const locations: Location[] = data.features.map((feat) => {
      const p = feat.properties;
      const lat = p.latitude ?? feat.geometry?.coordinates[1] ?? 0;
      const lng = p.longitude ?? feat.geometry?.coordinates[0] ?? 0;
      const year = p.year_space_last_confirmed ?? 1970;
      const lastConfirmed = `${year.toString().padStart(4, '0')}-01-01T00:00:00.000Z`;
      return {
        id: `boston-${p.ObjectId.toString()}`,
        source: 'boston-osap',
        lat,
        lng,
        address: normalizeBostonAddress(p.address_full),
        spaceCount: p.number_of_ap_spaces ?? 1,
        vanAccessible: false,
        lastConfirmed,
        isStale: computeIsStale(lastConfirmed),
      };
    });

    return {
      info: {
        source: 'boston-osap',
        name: 'Boston OSAP (On-Street Accessible Parking)',
        sourceUrl: SOURCE_URL,
        locationCount: locations.length,
      },
      locations,
    };
  },
};
