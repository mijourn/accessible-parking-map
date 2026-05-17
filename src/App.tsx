import { useEffect, useMemo, useState } from 'react';
import { DetailPanel } from './components/DetailPanel.tsx';
import { FilterBar } from './components/FilterBar.tsx';
import { Notice } from './components/Notice.tsx';
import { ParkingMap } from './components/ParkingMap.tsx';
import { formatDate } from './format.ts';
import { useLocations } from './hooks/useLocations.ts';
import type { Filters, Location } from './types/space.ts';

const INITIAL_FILTERS: Filters = { streetQuery: '', vanOnly: false };
const NOTICE_KEY = 'bpm-notice-dismissed';

export default function App() {
  const { data, loading, error } = useLocations();
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [noticeDismissed, setNoticeDismissed] = useState<boolean>(
    () =>
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(NOTICE_KEY) === '1',
  );

  const filteredLocations = useMemo<Location[]>(() => {
    if (!data) return [];
    let result = data.locations;
    if (filters.vanOnly) {
      result = result.filter((l) => l.vanAccessible);
    }
    const q = filters.streetQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (l) => l.address !== null && l.address.toLowerCase().includes(q),
      );
    }
    return result;
  }, [data, filters]);

  const totalSpaces = useMemo<number>(() => {
    if (!data) return 0;
    return data.locations.reduce((sum, l) => sum + l.spaceCount, 0);
  }, [data]);

  useEffect(() => {
    if (!selectedLocation) return;
    const stillVisible = filteredLocations.some(
      (l) => l.id === selectedLocation.id,
    );
    if (!stillVisible) setSelectedLocation(null);
  }, [filteredLocations, selectedLocation]);

  useEffect(() => {
    if (!selectedLocation) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedLocation(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [selectedLocation]);

  const dismissNotice = () => {
    sessionStorage.setItem(NOTICE_KEY, '1');
    setNoticeDismissed(true);
  };

  return (
    <div className="flex h-screen flex-col bg-white text-gray-900">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        <h1 className="text-base font-medium">Accessible Parking Map</h1>
        {data && (
          <p className="text-sm text-gray-600">
            {data.count} locations, {totalSpaces} accessible spaces
          </p>
        )}
      </header>

      <main className="relative flex flex-1 flex-col">
        {!noticeDismissed && <Notice onDismiss={dismissNotice} />}
        <div className="relative flex-1">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-600">
              Loading…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-red-600">
              Error loading data: {error}
            </div>
          )}
          {data && (
            <>
              <ParkingMap
                locations={filteredLocations}
                onLocationClick={setSelectedLocation}
              />
              <FilterBar
                filters={filters}
                onChange={setFilters}
                visibleCount={filteredLocations.length}
                totalCount={data.count}
              />
              {filteredLocations.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <p className="pointer-events-auto rounded-lg bg-white px-4 py-2 text-sm text-gray-700 shadow">
                    No locations match these filters.
                  </p>
                </div>
              )}
              {selectedLocation && (
                <DetailPanel
                  location={selectedLocation}
                  onClose={() => {
                    setSelectedLocation(null);
                  }}
                />
              )}
            </>
          )}
        </div>
      </main>

      <footer className="shrink-0 border-t border-gray-200 px-4 py-1 text-xs text-gray-600">
        {data
          ? `Snapshot taken ${formatDate(data.snapshotTakenAt)} • Data: Brookline GIS, Boston OSAP`
          : ' '}
      </footer>
    </div>
  );
}
