import { writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brooklineFetcher } from './sources/brookline.ts';
import { bostonFetcher } from './sources/boston.ts';
import type { LocationsSnapshot } from '../src/types/space.ts';
import type { SourceFetchResult } from './sources/types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(HERE, '..', 'public', 'data', 'spaces.json');
const TMP_PATH = `${OUT_PATH}.tmp`;

const fetchers = [brooklineFetcher, bostonFetcher];

const startTime = Date.now();

const results: SourceFetchResult[] = [];
for (const fetcher of fetchers) {
  console.log(`\n=== ${fetcher.info.source} ===`);
  const res = await fetcher.fetch();
  console.log(`  ${res.locations.length.toString()} locations`);
  results.push(res);
}

const allLocations = results.flatMap((r) => r.locations);
const snapshot: LocationsSnapshot = {
  snapshotTakenAt: new Date().toISOString(),
  sources: results.map((r) => r.info),
  count: allLocations.length,
  locations: allLocations,
};

await mkdir(dirname(OUT_PATH), { recursive: true });
await writeFile(TMP_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
await rename(TMP_PATH, OUT_PATH);

const elapsedSec = Math.round((Date.now() - startTime) / 1000);
console.log(
  `\nWrote ${allLocations.length.toString()} locations from ${results.length.toString()} sources in ${elapsedSec.toString()}s`,
);
