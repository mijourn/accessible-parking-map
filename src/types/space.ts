export type Source = 'brookline-gis' | 'boston-osap';

export interface Location {
  id: string;                  // namespaced: "brookline-4493", "boston-1"
  source: Source;
  lat: number;
  lng: number;
  polygon?: number[][][];      // Brookline only; absent for Boston
  address: string | null;
  spaceCount: number;          // Brookline: always 1, Boston: 1-16
  vanAccessible: boolean;      // false for Boston (field doesn't exist there)
  lastConfirmed: string;       // ISO date string. Brookline: real date, Boston: YYYY-01-01
  isStale: boolean;            // true if lastConfirmed > 3 years ago, computed at snapshot time
}

export interface LocationsSnapshot {
  snapshotTakenAt: string;
  sources: SourceInfo[];
  count: number;
  locations: Location[];
}

export interface SourceInfo {
  source: Source;
  name: string;
  sourceUrl: string;
  locationCount: number;
}

export interface Filters {
  streetQuery: string;
  vanOnly: boolean;
}
