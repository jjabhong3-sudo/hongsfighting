// ============================================================
// Mapbox GL JS 경로 지도
// ============================================================

'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { WAYPOINTS, TOTAL_DISTANCE_KM } from '@/lib/route/waypoints';
import { calculateProgress, interpolatePosition } from '@/lib/route/progress';

interface RouteMapProps {
  totalDistanceKm: number; // 현재까지 누적 이동거리
}

export default function RouteMap({ totalDistanceKm }: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapToken) {
      setMapError('Mapbox 토큰이 설정되지 않았습니다.');
      return;
    }

    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = mapToken;

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [120, 25],
        zoom: 3,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on('load', () => {
        if (!map) return;

        // 전체 경로 라인
        const coordinates = WAYPOINTS.map((w) => [w.lng, w.lat] as [number, number]);

        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates,
            },
          },
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#d1d5db',
            'line-width': 3,
          },
        });

        // 지나온 구간 (굵게 표시)
        const progress = calculateProgress(totalDistanceKm);
        const passedCoords = coordinates.slice(
          0,
          progress.currentWaypointIndex + 1
        );

        if (passedCoords.length > 1) {
          map.addSource('passed-route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: passedCoords,
              },
            },
          });

          map.addLayer({
            id: 'passed-route-line',
            type: 'line',
            source: 'passed-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 5,
            },
          });
        }

        // 경유지 마커
        WAYPOINTS.forEach((wp, i) => {
          const el = document.createElement('div');
          el.className = 'waypoint-marker';
          el.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${i === 0 ? '#22c55e' : i === WAYPOINTS.length - 1 ? '#ef4444' : '#6b7280'};
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          `;

          const popup = new mapboxgl.Popup({ offset: 10 }).setText(
            `${wp.name} (${wp.distanceKmFromStart.toLocaleString()}km)`
          );

          new mapboxgl.Marker({ element: el })
            .setLngLat([wp.lng, wp.lat])
            .setPopup(popup)
            .addTo(map);
        });

        // 현재 위치 마커 (자전거)
        if (totalDistanceKm > 0) {
          const pos = interpolatePosition(totalDistanceKm);
          const bikeEl = document.createElement('div');
          bikeEl.textContent = '🚴';
          bikeEl.style.cssText = `
            font-size: 24px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          `;

          new mapboxgl.Marker({ element: bikeEl })
            .setLngLat([pos.lng, pos.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 10 }).setText(
                `현재 위치 (${totalDistanceKm.toLocaleString()}km)`
              )
            )
            .addTo(map);
        }

        // 예상 도착 지점 (하루 50km 기준)
        const estimatedKm = totalDistanceKm + 50;
        if (estimatedKm < TOTAL_DISTANCE_KM) {
          const estPos = interpolatePosition(estimatedKm);
          const estEl = document.createElement('div');
          estEl.textContent = '📍';
          estEl.style.cssText = `
            font-size: 20px;
            opacity: 0.7;
          `;

          new mapboxgl.Marker({ element: estEl })
            .setLngLat([estPos.lng, estPos.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 10 }).setText(
                `예상 도착 (${estimatedKm.toLocaleString()}km)`
              )
            )
            .addTo(map);
        }
      });
    } catch {
      setMapError('지도를 불러올 수 없습니다.');
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mapToken, totalDistanceKm]);

  if (mapError) {
    return (
      <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center text-gray-400 text-sm">
        {mapError}
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-68 rounded-lg overflow-hidden"
      style={{ minHeight: '17rem' }}
    />
  );
}
