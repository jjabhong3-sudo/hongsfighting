// ============================================================
// 동기부여 배달기록지 - 공통 타입 정의
// ============================================================

/** 오전/오후 구분 */
export type ShiftType = 'morning' | 'afternoon';

/** 구간 유형 (육로/해상) */
export type SegmentType = 'land' | 'sea';

/** 플랫폼별 기록 */
export interface PlatformRecord {
  count: number;
  amount: number;
}

/** 플랫폼 집계 */
export interface Platforms {
  cquick: PlatformRecord;
  baemin: PlatformRecord;
}

/** 부채 항목 */
export interface Debt {
  name: string;
  amount: number;
  order: number;
}

/** 목표 설정 */
export interface Goals {
  daily: number;
  weekly: number;
  monthly: number;
}

/** 앱 설정 */
export interface AppSettings {
  goals: Goals;
  debts: Debt[];
  updatedAt: number;
}

/** 기본 설정값 */
export const DEFAULT_SETTINGS: AppSettings = {
  goals: { daily: 80000, weekly: 480000, monthly: 2000000 },
  debts: [],
  updatedAt: Date.now(),
};

/** 작업 세션 */
export interface WorkSession {
  id?: string;
  startAt: number;          // 출근 시각 (KST unix ms)
  endAt: number | null;     // 퇴근 시각 (KST unix ms)
  workDateKst: string;      // 'YYYY-MM-DD' (KST 기준)
  shiftType: ShiftType;     // 오전/오후
  durationMin: number;      // 총 근무 시간(분)
  distanceKmInput: number;  // 전기자전거 계기판 입력값
  platforms: Platforms;
  memo: string;
  createdAt: number;
  updatedAt: number;
}

/** 경유지 */
export interface Waypoint {
  name: string;
  lat: number;
  lng: number;
  segmentType: SegmentType;
  distanceKmFromStart: number; // 시작점부터 누적 거리(km)
}

/** 구간 진행 정보 */
export interface SegmentProgress {
  currentWaypointIndex: number;
  nextWaypointIndex: number;
  segmentTotalKm: number;
  segmentProgressKm: number;
  segmentProgressPercent: number;
  remainingKmToNext: number;
  totalProgressPercent: number;
  totalDistanceKm: number;
}

/** 주간 통계 */
export interface WeeklyStats {
  weekStart: string;        // 'YYYY-MM-DD'
  weekEnd: string;          // 'YYYY-MM-DD'
  totalEarnings: number;
  totalSessions: number;
  totalDurationMin: number;
  totalDistanceKm: number;
  dailyBreakdown: { date: string; earnings: number }[];
}

/** 월간 통계 */
export interface MonthlyStats {
  yearMonth: string;        // 'YYYY-MM'
  totalEarnings: number;
  totalSessions: number;
  totalDurationMin: number;
  totalDistanceKm: number;
  goalAchieved: boolean;
  dailyRecords: { date: string; earnings: number; achieved: boolean }[];
}
