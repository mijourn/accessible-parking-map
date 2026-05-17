import { useEffect, useRef } from 'react';
import type { Location } from '../types/space.ts';
import { formatDate } from '../format.ts';

interface DetailPanelProps {
  location: Location;
  onClose: () => void;
}

function formatLastConfirmed(location: Location): string {
  if (location.source === 'boston-osap') {
    return new Date(location.lastConfirmed).getUTCFullYear().toString();
  }
  return formatDate(location.lastConfirmed);
}

function pluralizeSpaces(n: number): string {
  return n === 1 ? '1 accessible space' : `${n.toString()} accessible spaces`;
}

export function DetailPanel({ location, onClose }: DetailPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const prev = document.activeElement;
    if (prev instanceof HTMLElement) {
      previouslyFocusedRef.current = prev;
    }
    closeButtonRef.current?.focus();

    return () => {
      const restore = previouslyFocusedRef.current;
      if (restore && document.contains(restore)) {
        restore.focus();
      }
    };
  }, []);

  const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="detail-panel-heading"
      className="absolute inset-x-0 bottom-0 rounded-t-lg bg-white p-4 shadow-lg sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-80 sm:rounded-lg"
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded text-lg leading-none text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        ×
      </button>

      <h2
        id="detail-panel-heading"
        className={`pr-8 text-lg font-medium ${location.address === null ? 'text-gray-600' : ''}`}
      >
        {location.address ?? 'Address unavailable'}
      </h2>

      {(location.vanAccessible || location.isStale) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {location.vanAccessible && (
            <span className="inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
              Van Accessible
            </span>
          )}
          {location.isStale && (
            <span className="inline-block rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
              Data may be outdated
            </span>
          )}
        </div>
      )}

      <div className="mt-2 text-sm text-gray-600">
        <p>{pluralizeSpaces(location.spaceCount)}</p>
        <p>Last confirmed {formatLastConfirmed(location)}</p>
      </div>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm text-blue-700 underline hover:text-blue-900"
      >
        Open in Google Maps
      </a>
    </div>
  );
}
