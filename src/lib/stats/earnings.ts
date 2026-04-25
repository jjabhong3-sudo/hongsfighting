// ============================================================
// 시급/건당/km당 계산
// ============================================================

import { WorkSession, WeeklyStats, MonthlyStats, AppSettings } from '@/types/domain';
import { getWeekStart, getWeekEnd, toYearMonth, daysInMonth } from '@/lib/time/kst';

/**
 * 세션의 표시용 수익 계산
 * - 오전/오후 각각 독립된 기록, 입력값 그대로 반환
 */
export function sessionEarnings(session: WorkSession, _allSessions?: WorkSession[]): number {
  return session.platforms.cquick.amount + session.platforms.baemin.amount;
}

/**
 * 세션의 표시용 건수 계산
 * - 오전/오후 각각 독립된 기록, 입력값 그대로 반환
 */
export function sessionTotalCount(session: WorkSession, _allSessions?: WorkSession[]): number {
  return session.platforms.cquick.count + session.platforms.baemin.count;
}

/**
 * 특정 날짜의 최종 누적 수익 (오전+오후 합계)
 * - 하루 = 하나의 묶음 (날짜가 부모, 오전/오후가 자식)
 * - 최종 수익 = 오전 raw + 오후 raw (합계)
 */
export function dailyTotalEarnings(sessions: WorkSession[], dateKst: string): number {
  const daySessions = sessions.filter((s) => s.workDateKst === dateKst);
  if (daySessions.length === 0) return 0;
  
  // 오전+오후 합계
  return daySessions.reduce(
    (sum, s) => sum + s.platforms.cquick.amount + s.platforms.baemin.amount,
    0
  );
}

/**
 * 특정 날짜의 최종 누적 건수 (오전+오후 합계)
 */
export function dailyTotalCount(sessions: WorkSession[], dateKst: string): number {
  const daySessions = sessions.filter((s) => s.workDateKst === dateKst);
  if (daySessions.length === 0) return 0;
  
  // 오전+오후 합계
  return daySessions.reduce(
    (sum, s) => sum + s.platforms.cquick.count + s.platforms.baemin.count,
    0
  );
}

/**
 * 시급 계산
 */
export function hourlyRate(earnings: number, durationMin: number): number {
  if (durationMin <= 0) return 0;
  return Math.round((earnings / durationMin) * 60);
}

/**
 * 건당 평균 금액
 */
export function avgPerOrder(earnings: number, count: number): number {
  if (count <= 0) return 0;
  return Math.round(earnings / count);
}

/**
 * km당 수익
 */
export function earningsPerKm(earnings: number, distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  return Math.round(earnings / distanceKm);
}

/**
 * 주간 통계 계산 (현재 주 기준)
 */
export function calculateWeeklyStats(
  sessions: WorkSession[],
  settings: AppSettings
): WeeklyStats {
  const weekStart = getWeekStart(sessions.length > 0 ? sessions[0].workDateKst : '');
  const weekEnd = getWeekEnd(sessions.length > 0 ? sessions[0].workDateKst : '');

  // 현재 주에 속한 세션만 필터링
  const weekSessions = sessions.filter(
    (s) => s.workDateKst >= weekStart && s.workDateKst <= weekEnd
  );

  let totalEarnings = 0;
  let totalDurationMin = 0;
  let totalDistanceKm = 0;
  const dailyMap = new Map<string, number>();
  const uniqueDates = new Set<string>();

  for (const s of weekSessions) {
    // 일일 누적 수익은 오후 세션 기준
    const earnings = dailyTotalEarnings(weekSessions, s.workDateKst);
    totalDurationMin += s.durationMin;
    totalDistanceKm += s.distanceKmInput;
    uniqueDates.add(s.workDateKst);

    // 각 날짜별로 한 번만 계산
    if (!dailyMap.has(s.workDateKst)) {
      dailyMap.set(s.workDateKst, earnings);
    }
  }

  // 총 수익은 각 날짜의 누적 수익 합계
  totalEarnings = Array.from(dailyMap.values()).reduce((sum, v) => sum + v, 0);

  const dailyBreakdown = Array.from(dailyMap.entries())
    .map(([date, earnings]) => ({ date, earnings }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    weekStart,
    weekEnd,
    totalEarnings,
    totalSessions: uniqueDates.size,
    totalDurationMin,
    totalDistanceKm,
    dailyBreakdown,
  };
}

/**
 * 월간 통계 계산
 */
export function calculateMonthlyStats(
  sessions: WorkSession[],
  settings: AppSettings
): MonthlyStats {
  const yearMonth = sessions.length > 0
    ? toYearMonth(sessions[0].workDateKst)
    : '';

  let totalEarnings = 0;
  let totalDurationMin = 0;
  let totalDistanceKm = 0;
  const dailyMap = new Map<string, number>();

  // 각 날짜의 최종 누적 데이터로 계산
  const uniqueDates = new Set(sessions.map((s) => s.workDateKst));
  for (const dateKst of uniqueDates) {
    const earnings = dailyTotalEarnings(sessions, dateKst);
    totalEarnings += earnings;
    
    // 해당 날짜의 모든 세션 duration 합산
    const daySessions = sessions.filter((s) => s.workDateKst === dateKst);
    for (const s of daySessions) {
      totalDurationMin += s.durationMin;
      totalDistanceKm += s.distanceKmInput;
    }
    
    dailyMap.set(dateKst, earnings);
  }

  const dailyRecords = Array.from(dailyMap.entries())
    .map(([date, earnings]) => ({
      date,
      earnings,
      achieved: earnings >= settings.goals.daily,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    yearMonth,
    totalEarnings,
    totalSessions: uniqueDates.size,
    totalDurationMin,
    totalDistanceKm,
    goalAchieved: totalEarnings >= settings.goals.monthly,
    dailyRecords,
  };
}

/**
 * 부채 진행률 계산
 */
export function calculateDebtProgress(
  totalEarnings: number,
  debts: { name: string; amount: number }[]
): { totalDebt: number; paidPercent: number; remainingDebt: number } {
  const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);
  if (totalDebt <= 0) return { totalDebt: 0, paidPercent: 100, remainingDebt: 0 };

  const paidPercent = Math.min(100, Math.round((totalEarnings / totalDebt) * 100));
  const remainingDebt = Math.max(0, totalDebt - totalEarnings);

  return { totalDebt, paidPercent, remainingDebt };
}

/**
 * 연속 출근일 계산 (최근 세션 기준)
 */
export function calculateStreak(sessions: WorkSession[]): number {
  if (sessions.length === 0) return 0;

  const uniqueDates = new Set(sessions.map((s) => s.workDateKst));
  const sortedDates = Array.from(uniqueDates).sort().reverse();

  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round(
      (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
