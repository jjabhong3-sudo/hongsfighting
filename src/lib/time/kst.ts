// ============================================================
// KST 기준 날짜/주간 계산 유틸리티
// ============================================================

/** KST 오프셋 (UTC+9) */
const KST_OFFSET = 9 * 60 * 60 * 1000;

/**
 * 현재 시각을 unix ms로 반환 (UTC 기준)
 */
export function nowKst(): number {
  return Date.now();
}

/**
 * KST 기준 현재 시각의 Date 객체 반환
 * nowKstDate()는 KST 오프셋이 적용된 timestamp로 Date를 생성하므로,
 * getUTCFullYear/getUTCMonth/getUTCDate/getUTCHours/getUTCDay를 사용해야 함
 */
function nowKstDate(): Date {
  return new Date(Date.now() + KST_OFFSET);
}

/**
 * KST 기준 오늘 날짜 문자열 'YYYY-MM-DD'
 */
export function todayKst(): string {
  const d = nowKstDate();
  return formatDateKst(d);
}

/**
 * Date 객체를 'YYYY-MM-DD' 문자열로 변환 (KST 기준)
 * nowKstDate()로 생성된 Date는 이미 KST 오프셋이 적용되어 있으므로
 * getUTC* 메서드를 사용해야 함
 */
export function formatDateKst(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 'YYYY-MM-DD' 문자열을 KST 기준 Date 객체로 변환
 */
export function parseDateKst(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  // KST 기준으로 Date 생성 (UTC+9)
  return new Date(Date.UTC(y, m - 1, d) - KST_OFFSET);
}

/**
 * KST 기준 현재 요일 (0=일, 1=월, ..., 6=토)
 */
export function dayOfWeekKst(): number {
  const d = nowKstDate();
  return d.getUTCDay();
}

/**
 * KST 기준 주 시작일(월요일) 'YYYY-MM-DD'
 */
export function weekStartKst(): string {
  const d = nowKstDate();
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // 월요일로
  d.setUTCDate(d.getUTCDate() + diff);
  return formatDateKst(d);
}

/**
 * KST 기준 주 종료일(일요일) 'YYYY-MM-DD'
 */
export function weekEndKst(): string {
  const d = nowKstDate();
  const day = d.getUTCDay();
  const diff = day === 0 ? 0 : 7 - day; // 일요일로
  d.setUTCDate(d.getUTCDate() + diff);
  return formatDateKst(d);
}

/**
 * 특정 날짜가 속한 주의 월요일 'YYYY-MM-DD'
 */
export function getWeekStart(dateStr: string): string {
  const d = parseDateKst(dateStr);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return formatDateKst(d);
}

/**
 * 특정 날짜가 속한 주의 일요일 'YYYY-MM-DD'
 */
export function getWeekEnd(dateStr: string): string {
  const d = parseDateKst(dateStr);
  const day = d.getUTCDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return formatDateKst(d);
}

/**
 * 'YYYY-MM-DD' → 'YYYY-MM' (월)
 */
export function toYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/**
 * KST 기준 현재 월 'YYYY-MM'
 */
export function currentYearMonth(): string {
  return todayKst().slice(0, 7);
}

/**
 * 특정 월의 일수
 */
export function daysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * 특정 월의 1일 요일 (0=일, 1=월, ..., 6=토)
 */
export function firstDayOfMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.getUTCDay();
}

/**
 * 오전/오후 판정 (KST 기준)
 * 05:00~13:59 KST = 오전, 14:00~04:59 KST = 오후
 */
export function getShiftType(): 'morning' | 'afternoon' {
  const d = nowKstDate();
  const hour = d.getUTCHours(); // nowKstDate()는 KST 오프셋이 적용되어 있음
  if (hour >= 5 && hour < 14) return 'morning';
  return 'afternoon';
}

/**
 * 두 시각의 차이(분) 계산
 */
export function diffMinutes(startMs: number, endMs: number): number {
  return Math.round((endMs - startMs) / 60000);
}

/**
 * ms를 "HH:MM" 형식으로 변환
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}시간 ${m}분`;
}

/**
 * ms를 "HH:MM" 짧은 형식으로 변환
 */
export function formatDurationShort(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}
