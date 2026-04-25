// ============================================================
// Mapbox GL JS 경로 지도 (네온모드 + 국가별 이모지 마커)
// ============================================================

'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { WAYPOINTS, TOTAL_DISTANCE_KM, COUNTRY_SEGMENTS } from '@/lib/route/waypoints';
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
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [126.83, 37.56],
        zoom: 10,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on('load', () => {
        if (!map) return;

        const coordinates = WAYPOINTS.map((w) => [w.lng, w.lat] as [number, number]);

        // ===== 국가별 구간 라인 =====
        COUNTRY_SEGMENTS.forEach((seg) => {
          const segCoords = coordinates.slice(seg.startIndex, seg.endIndex + 1);
          if (segCoords.length < 2) return;

          const sourceId = `segment-${seg.startIndex}`;
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: segCoords,
              },
            },
          });

          map.addLayer({
            id: `segment-line-${seg.startIndex}`,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': seg.color,
              'line-width': 2,
              'line-opacity': 0.35,
            },
          });
        });

        // ===== 지나온 구간 (네온 굵게) =====
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

          // 네온 글로우 효과 (바깥)
          map.addLayer({
            id: 'passed-route-glow',
            type: 'line',
            source: 'passed-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#00e5ff',
              'line-width': 10,
              'line-opacity': 0.3,
              'line-blur': 6,
            },
          });

          // 네온 라인 (안쪽)
          map.addLayer({
            id: 'passed-route-line',
            type: 'line',
            source: 'passed-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#00e5ff',
              'line-width': 4,
              'line-opacity': 0.9,
            },
          });
        }

        // ===== 경유지 마커 (국가별 이모지) =====
        WAYPOINTS.forEach((wp, i) => {
          const isStart = i === 0;
          const isEnd = i === WAYPOINTS.length - 1;

          // 주요 도시(시작/종료/수도/랜드마크)는 큰 이모지, 나머지는 작은 점
          const isMajor =
            isStart ||
            isEnd ||
            ['도쿄', '오사카', '베이징', '상하이', '타이베이', '홍콩', '하노이', '호치민', '방콕', '싱가포르', '치앙마이', '비엔티안', '파타야'].includes(
              wp.name
            );

          if (isMajor) {
            // 주요 도시: 큰 이모지 마커
            const el = document.createElement('div');
            el.textContent = wp.emoji;
            el.style.cssText = `
              font-size: ${isStart || isEnd ? '28px' : '22px'};
              filter: drop-shadow(0 0 8px rgba(0,229,255,0.6));
              cursor: pointer;
              transition: transform 0.2s;
            `;

            const popup = new mapboxgl.Popup({
              offset: 10,
              className: 'neon-popup',
            }).setHTML(
              `<div style="color:#00e5ff;font-weight:bold;font-size:13px;">${wp.emoji} ${wp.name}</div>
               <div style="color:#aaa;font-size:11px;">${wp.country} · ${wp.distanceKmFromStart.toLocaleString()}km</div>`
            );

            new mapboxgl.Marker({ element: el })
              .setLngLat([wp.lng, wp.lat])
              .setPopup(popup)
              .addTo(map);
          } else {
            // 일반 도시: 작은 네온 점
            const el = document.createElement('div');
            el.style.cssText = `
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: #00e5ff;
              border: 1px solid rgba(255,255,255,0.5);
              box-shadow: 0 0 6px #00e5ff;
              opacity: 0.6;
              cursor: pointer;
            `;

            const popup = new mapboxgl.Popup({
              offset: 10,
              className: 'neon-popup',
            }).setHTML(
              `<div style="color:#00e5ff;font-weight:bold;font-size:12px;">${wp.name}</div>
               <div style="color:#aaa;font-size:10px;">${wp.country} · ${wp.distanceKmFromStart.toLocaleString()}km</div>`
            );

            new mapboxgl.Marker({ element: el })
              .setLngLat([wp.lng, wp.lat])
              .setPopup(popup)
              .addTo(map);
          }
        });

        // ===== 현재 위치 마커 (자전거 + 네온 링) =====
        if (totalDistanceKm > 0) {
          const pos = interpolatePosition(totalDistanceKm);

          const ringEl = document.createElement('div');
          ringEl.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid #00e5ff;
            box-shadow: 0 0 16px #00e5ff, 0 0 32px #00e5ff40;
            animation: pulse-ring 2s infinite;
            position: absolute;
            top: -20px;
            left: -20px;
          `;

          const bikeEl = document.createElement('div');
          bikeEl.textContent = '🚴';
          bikeEl.style.cssText = `
            font-size: 24px;
            filter: drop-shadow(0 0 8px #00e5ff);
            position: absolute;
            top: -12px;
            left: -12px;
          `;

          const container = document.createElement('div');
          container.style.cssText = 'position:relative;width:40px;height:40px;';
          container.appendChild(ringEl);
          container.appendChild(bikeEl);

          new mapboxgl.Marker({ element: container })
            .setLngLat([pos.lng, pos.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 10, className: 'neon-popup' }).setHTML(
                `<div style="color:#00e5ff;font-weight:bold;font-size:12px;">🚴 현재 위치</div>
                 <div style="color:#aaa;font-size:10px;">${totalDistanceKm.toLocaleString()}km</div>`
              )
            )
            .addTo(map);
        }

        // ===== 예상 도착 지점 (하루 50km 기준) =====
        const estimatedKm = totalDistanceKm + 50;
        if (estimatedKm < TOTAL_DISTANCE_KM) {
          const estPos = interpolatePosition(estimatedKm);
          const estEl = document.createElement('div');
          estEl.textContent = '📍';
          estEl.style.cssText = `
            font-size: 20px;
            opacity: 0.8;
            filter: drop-shadow(0 0 6px #ffab00);
          `;

          new mapboxgl.Marker({ element: estEl })
            .setLngLat([estPos.lng, estPos.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 10, className: 'neon-popup' }).setHTML(
                `<div style="color:#ffab00;font-weight:bold;font-size:12px;">📍 예상 도착 (+50km)</div>
                 <div style="color:#aaa;font-size:10px;">${estimatedKm.toLocaleString()}km</div>`
              )
            )
            .addTo(map);
        }

        // ===== 초기 로드: 현재 위치 기준 반경 50km =====
        if (totalDistanceKm > 0) {
          const pos = interpolatePosition(totalDistanceKm);
          map.fitBounds(
            [
              [pos.lng - 0.45, pos.lat - 0.45],
              [pos.lng + 0.45, pos.lat + 0.45],
            ],
            { padding: 50, maxZoom: 12 }
          );
        } else {
          map.fitBounds(
            [
              [126.38, 37.11],
              [127.28, 38.01],
            ],
            { padding: 50, maxZoom: 12 }
          );
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
      <div className="bg-gray-900 rounded-lg h-68 flex items-center justify-center text-gray-400 text-sm">
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
