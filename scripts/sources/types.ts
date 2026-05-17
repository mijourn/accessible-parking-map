import type { Location, SourceInfo } from '../../src/types/space.ts';

export interface SourceFetchResult {
  info: SourceInfo;
  locations: Location[];
}

export interface SourceFetcher {
  readonly info: SourceInfo;
  fetch(): Promise<SourceFetchResult>;
}
