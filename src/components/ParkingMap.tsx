import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Location } from '../types/space.ts';

interface ParkingMapProps {
  locations: Location[];
  onLocationClick: (location: Location) => void;
}

interface LocationFeatureProps {
  id: string;
  address: string | null;
  vanAccessible: boolean;
  spaceCount: number;
  isStale: boolean;
}

interface PointFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: LocationFeatureProps;
}

function buildPointFC(locations: Location[]): {
  type: 'FeatureCollection';
  features: PointFeature[];
} {
  return {
    type: 'FeatureCollection',
    features: locations.map((l) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [l.lng, l.lat] },
      properties: {
        id: l.id,
        address: l.address,
        vanAccessible: l.vanAccessible,
        spaceCount: l.spaceCount,
        isStale: l.isStale,
      },
    })),
  };
}

function computeBBox(
  locations: Location[],
): [[number, number], [number, number]] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const l of locations) {
    if (l.lng < minLng) minLng = l.lng;
    if (l.lat < minLat) minLat = l.lat;
    if (l.lng > maxLng) maxLng = l.lng;
    if (l.lat > maxLat) maxLat = l.lat;
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

const LOCATION_LAYERS = ['locations-circle'];

export function ParkingMap({ locations, onLocationClick }: ParkingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const hasFitBoundsRef = useRef(false);
  const locationsRef = useRef<Location[]>(locations);
  const onLocationClickRef = useRef(onLocationClick);

  useEffect(() => {
    onLocationClickRef.current = onLocationClick;
  }, [onLocationClick]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
    });
    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false,
      }),
      'top-left',
    );

    const maybeFit = (current: Location[]) => {
      if (hasFitBoundsRef.current || current.length === 0) return;
      map.fitBounds(computeBBox(current), {
        padding: 40,
        maxZoom: 14,
        animate: false,
      });
      hasFitBoundsRef.current = true;
    };

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const feats = map.queryRenderedFeatures(e.point, {
        layers: LOCATION_LAYERS,
      });
      const first = feats[0];
      if (!first) return;
      const props = first.properties as LocationFeatureProps;
      const id = String(props.id);
      const location = locationsRef.current.find((l) => l.id === id);
      if (location) onLocationClickRef.current(location);
    };

    const onMouseMove = (e: maplibregl.MapMouseEvent) => {
      const feats = map.queryRenderedFeatures(e.point, {
        layers: LOCATION_LAYERS,
      });
      map.getCanvas().style.cursor = feats.length > 0 ? 'pointer' : '';
    };

    map.on('load', () => {
      map.addSource('locations', {
        type: 'geojson',
        data: buildPointFC(locationsRef.current),
      });

      map.addLayer({
        id: 'locations-circle',
        type: 'circle',
        source: 'locations',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            11, ['match', ['get', 'spaceCount'], 1, 5, [2, 3], 7, 9],
            14, ['match', ['get', 'spaceCount'], 1, 8, [2, 3], 10, 12],
            16, ['match', ['get', 'spaceCount'], 1, 12, [2, 3], 14, 16],
          ],
          'circle-color': [
            'case',
            ['get', 'isStale'],
            '#d97706',
            '#2563eb',
          ],
          'circle-stroke-color': [
            'case',
            ['get', 'isStale'],
            '#92400e',
            '#1e40af',
          ],
          'circle-stroke-width': 1,
        },
      });

      map.addLayer({
        id: 'locations-count',
        type: 'symbol',
        source: 'locations',
        layout: {
          'text-field': [
            'case',
            ['>', ['get', 'spaceCount'], 1],
            ['to-string', ['get', 'spaceCount']],
            '',
          ],
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            13, 10,
            16, 12,
          ],
          'text-font': ['Noto Sans Bold'],
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      map.on('click', onClick);
      map.on('mousemove', onMouseMove);

      loadedRef.current = true;
      maybeFit(locationsRef.current);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
      hasFitBoundsRef.current = false;
    };
  }, []);

  useEffect(() => {
    locationsRef.current = locations;
    if (!loadedRef.current) return;
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource('locations') as
      | maplibregl.GeoJSONSource
      | undefined;
    if (!source) return;
    source.setData(buildPointFC(locations));

    if (!hasFitBoundsRef.current && locations.length > 0) {
      map.fitBounds(computeBBox(locations), {
        padding: 40,
        maxZoom: 14,
        animate: false,
      });
      hasFitBoundsRef.current = true;
    }
  }, [locations]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Map of accessible parking locations"
      className="h-full w-full"
    />
  );
}
