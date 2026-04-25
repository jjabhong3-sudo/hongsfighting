// ============================================================
// 육로/해상 구간 진행 계산
// ============================================================

import { SegmentProgress } from '@/types/domain';
import { WAYPOINTS, TOTAL_DISTANCE_KM } from './waypoints';

/**
 * 누적 이동거리(km)를 기반으로 현재 구간 진행 정보 계산
 *
 * @param distanceKm - 현재까지 이동한 누적 거리(km)
 * @returns 구간 진행 정보
 */
export function calculateProgress(distanceKm: number): SegmentProgress {
  // 전체 진행률
  const totalProgressPercent = Math.min(
    100,
    Math.round((distanceKm / TOTAL_DISTANCE_KM) * 100)
  );

  // 현재 위치한 구간 찾기
  let currentIdx = 0;
  for (let i = WAYPOINTS.length - 1; i >= 0; i--) {
    if (distanceKm >= WAYPOINTS[i].distanceKmFromStart) {
      currentIdx = i;
      break;
    }
  }

  // 마지막 경유지 도착 시
  if (currentIdx >= WAYPOINTS.length - 1) {
    const last = WAYPOINTS[WAYPOINTS.length - 1];
    return {
      currentWaypointIndex: WAYPOINTS.length - 1,
      nextWaypointIndex: WAYPOINTS.length - 1,
      segmentTotalKm: 0,
      segmentProgressKm: 0,
      segmentProgressPercent: 100,
      remainingKmToNext: 0,
      totalProgressPercent: 100,
      totalDistanceKm: distanceKm,
    };
  }

  const current = WAYPOINTS[currentIdx];
  const next = WAYPOINTS[currentIdx + 1];
  const segmentTotalKm = next.distanceKmFromStart - current.distanceKmFromStart;
  const segmentProgressKm = distanceKm - current.distanceKmFromStart;
  const segmentProgressPercent = Math.min(
    100,
    Math.round((segmentProgressKm / segmentTotalKm) * 100)
  );
  const remainingKmToNext = Math.max(0, segmentTotalKm - segmentProgressKm);

  return {
    currentWaypointIndex: currentIdx,
    nextWaypointIndex: currentIdx + 1,
    segmentTotalKm: Math.round(segmentTotalKm * 100) / 100,
    segmentProgressKm: Math.round(segmentProgressKm * 100) / 100,
    segmentProgressPercent,
    remainingKmToNext: Math.round(remainingKmToNext * 100) / 100,
    totalProgressPercent,
    totalDistanceKm: distanceKm,
  };
}

/**
 * 하루 50km 기준 예상 도착 지점 계산
 *
 * @param currentDistanceKm - 현재 누적 거리
 * @param daysWorked - 근무일수
 * @returns 예상 도착 경유지 인덱스
 */
export function estimateArrivalWaypoint(
  currentDistanceKm: number,
  daysWorked: number
): number {
  const estimatedKm = currentDistanceKm + daysWorked * 50;
  for (let i = WAYPOINTS.length - 1; i >= 0; i--) {
    if (estimatedKm >= WAYPOINTS[i].distanceKmFromStart) {
      return i;
    }
  }
  return 0;
}

/**
 * 특정 경유지의 좌표 반환
 */
export function getWaypointCoords(index: number): { lat: number; lng: number } | null {
  if (index < 0 || index >= WAYPOINTS.length) return null;
  return { lat: WAYPOINTS[index].lat, lng: WAYPOINTS[index].lng };
}

/**
 * 현재 위치 좌표 보간 (두 경유지 사이)
 */
export function interpolatePosition(
  distanceKm: number
): { lat: number; lng: number } {
  const progress = calculateProgress(distanceKm);
  if (progress.currentWaypointIndex >= WAYPOINTS.length - 1) {
    const last = WAYPOINTS[WAYPOINTS.length - 1];
    return { lat: last.lat, lng: last.lng };
  }

  const current = WAYPOINTS[progress.currentWaypointIndex];
  const next = WAYPOINTS[progress.nextWaypointIndex];
  const ratio = progress.segmentProgressPercent / 100;

  return {
    lat: current.lat + (next.lat - current.lat) * ratio,
    lng: current.lng + (next.lng - current.lng) * ratio,
  };
}
