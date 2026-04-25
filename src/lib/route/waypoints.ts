// ============================================================
// 동선 데이터 (서울 화곡역 → 동남아시아 도시 경로)
// 육로 기준 이동, 해상 구간은 직선 거리로 계산
// 추후 교체 용이하도록 단일 파일로 분리
// ============================================================

import { Waypoint } from '@/types/domain';

/**
 * 전체 경유지 배열
 * 서울 화곡역 → 삿포로(해상) → 후쿠오카(육로,일본종단) → 오키나와(해상)
 * → 타이베이(육로,대만종단) → 가오슝(해상) → 홍콩(육로) → 마카오(해상)
 * → 하노이(육로) → 호치민(육로) → 방콕(육로) → 치앙마이(육로)
 *
 * distanceKmFromStart: 시작점부터 해당 경유지까지의 누적 거리(km)
 * 육로 구간은 실제 도로 거리 근사값, 해상 구간은 직선 거리
 */
export const WAYPOINTS: Waypoint[] = [
  {
    name: '서울 화곡역',
    lat: 37.5415,
    lng: 126.8405,
    segmentType: 'land',
    distanceKmFromStart: 0,
  },
  {
    name: '삿포로',
    lat: 43.0618,
    lng: 141.3545,
    segmentType: 'sea',    // 해상: 서울→삿포로 직선
    distanceKmFromStart: 1500,
  },
  {
    name: '후쿠오카',
    lat: 33.5904,
    lng: 130.4017,
    segmentType: 'land',   // 육로: 삿포로→후쿠오카 (일본 종단)
    distanceKmFromStart: 2800,
  },
  {
    name: '오키나와',
    lat: 26.2124,
    lng: 127.6809,
    segmentType: 'sea',    // 해상: 후쿠오카→오키나와 직선
    distanceKmFromStart: 3300,
  },
  {
    name: '타이베이',
    lat: 25.0330,
    lng: 121.5654,
    segmentType: 'sea',    // 해상: 오키나와→타이베이 직선
    distanceKmFromStart: 3700,
  },
  {
    name: '가오슝',
    lat: 22.6273,
    lng: 120.3014,
    segmentType: 'land',   // 육로: 타이베이→가오슝 (대만 종단)
    distanceKmFromStart: 4100,
  },
  {
    name: '홍콩',
    lat: 22.3193,
    lng: 114.1694,
    segmentType: 'sea',    // 해상: 가오슝→홍콩 직선
    distanceKmFromStart: 4400,
  },
  {
    name: '마카오',
    lat: 22.1987,
    lng: 113.5439,
    segmentType: 'land',   // 육로: 홍콩→마카오
    distanceKmFromStart: 4500,
  },
  {
    name: '하노이',
    lat: 21.0278,
    lng: 105.8342,
    segmentType: 'sea',    // 해상: 마카오→하노이 직선
    distanceKmFromStart: 4900,
  },
  {
    name: '호치민',
    lat: 10.8231,
    lng: 106.6297,
    segmentType: 'land',   // 육로: 하노이→호치민 (베트남 종단)
    distanceKmFromStart: 5800,
  },
  {
    name: '방콕',
    lat: 13.7563,
    lng: 100.5018,
    segmentType: 'land',   // 육로: 호치민→방콕
    distanceKmFromStart: 6500,
  },
  {
    name: '치앙마이',
    lat: 18.7883,
    lng: 98.9853,
    segmentType: 'land',   // 육로: 방콕→치앙마이
    distanceKmFromStart: 7200,
  },
];

/** 전체 경로 총 거리(km) */
export const TOTAL_DISTANCE_KM = WAYPOINTS[WAYPOINTS.length - 1].distanceKmFromStart;

/** 경유지 이름 목록 */
export const WAYPOINT_NAMES = WAYPOINTS.map((w) => w.name);
