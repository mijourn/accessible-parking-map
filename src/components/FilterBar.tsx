import type { Filters } from '../types/space.ts';

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  visibleCount: number;
  totalCount: number;
}

export function FilterBar({
  filters,
  onChange,
  visibleCount,
  totalCount,
}: FilterBarProps) {
  return (
    <section
      aria-label="Filters"
      className="absolute right-3 top-3 z-10 flex flex-wrap items-center gap-3 rounded-lg bg-white p-2 shadow-md"
    >
      <label htmlFor="street-search" className="sr-only">
        Search by street name
      </label>
      <input
        id="street-search"
        type="search"
        placeholder="Search street…"
        value={filters.streetQuery}
        onChange={(e) => {
          onChange({ ...filters, streetQuery: e.target.value });
        }}
        className="w-44 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <label className="flex items-center gap-1.5 text-sm">
        <input
          type="checkbox"
          checked={filters.vanOnly}
          onChange={(e) => {
            onChange({ ...filters, vanOnly: e.target.checked });
          }}
        />
        Van Accessible Only
      </label>
      <span aria-live="polite" className="text-xs text-gray-600">
        {visibleCount} of {totalCount}
      </span>
    </section>
  );
}
