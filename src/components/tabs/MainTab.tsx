// ============================================================
// 메인 탭 - 출퇴근, 거리 진행, 금주 통계
// 참고: https://aesthetic-gecko-51590f.netlify.app/ 상단 구성
// ============================================================

'use client';

import React, { useState, useEffect } from 'react';
import { WorkSession, AppSettings, Platforms } from '@/types/domain';
import {
  todayKst,
  nowKst,
  diffMinutes,
  formatDuration,
  formatDurationShort,
  weekStartKst,
  weekEndKst,
  formatDateKst,
} from '@/lib/time/kst';
import {
  getCurrentShift,
  getShiftLabel,
  getTargetMinutes,
  getProgressPercent,
  getRemainingMinutes,
  isTargetAchieved,
} from '@/lib/work/shift';
import { calculateProgress, interpolatePosition } from '@/lib/route/progress';
import { WAYPOINTS, TOTAL_DISTANCE_KM, COUNTRY_SEGMENTS } from '@/lib/route/waypoints';
import {
  sessionEarnings,
  sessionTotalCount,
  dailyTotalEarnings,
  calculateWeeklyStats,
  calculateDebtProgress,
  calculateStreak,
  hourlyRate,
  avgPerOrder,
  earningsPerKm,
} from '@/lib/stats/earnings';
import RouteMap from '@/components/map/RouteMap';
import ShiftEndModal from '@/components/work/ShiftEndModal';

interface MainTabProps {
  sessions: WorkSession[];
  settings: AppSettings;
  activeSession: WorkSession | null;
  onStartShift: () => void;
  onEndShift: (data: {
    platforms: Platforms;
    distanceKmInput: number;
    memo: string;
    durationMin?: number;
  }) => void;
  totalDistanceKm: number;
}

export default function MainTab({
  sessions,
  settings,
  activeSession,
  onStartShift,
  onEndShift,
  totalDistanceKm,
}: MainTabProps) {
  const [showEndModal, setShowEndModal] = useState(false);
  const [elapsedMin, setElapsedMin] = useState(0);
  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [debtExpanded, setDebtExpanded] = useState(false);

  // 실시간 경과 시간
  useEffect(() => {
    if (!activeSession) {
      setElapsedMin(0);
      return;
    }
    const update = () =>
      setElapsedMin(diffMinutes(activeSession.startAt, nowKst()));
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // 통계
  const weeklyStats = calculateWeeklyStats(sessions, settings);
  const streak = calculateStreak(sessions);
  const totalAllEarnings = sessions.reduce(
    (sum, s) => sum + sessionEarnings(s, sessions),
    0
  );
  const debtProgress = calculateDebtProgress(totalAllEarnings, settings.debts);
  const progress = calculateProgress(totalDistanceKm);

  // 현재 shift
  const currentShift = getCurrentShift();
  const shiftLabel = getShiftLabel(currentShift);
  const targetMin = getTargetMinutes(currentShift);
  const progressPercent = getProgressPercent(elapsedMin, currentShift);
  const remainingMin = getRemainingMinutes(elapsedMin, currentShift);
  const achieved = isTargetAchieved(elapsedMin, currentShift);

  // 현재 위치 정보
  const currentWaypoint =
    progress.currentWaypointIndex < WAYPOINTS.length
      ? WAYPOINTS[progress.currentWaypointIndex]
      : null;
  const nextWaypoint =
    progress.nextWaypointIndex < WAYPOINTS.length
      ? WAYPOINTS[progress.nextWaypointIndex]
      : null;

  // 예상 도착지 (하루 50km 기준)
  const estimatedKm = totalDistanceKm + 50;
  const estimatedWaypointIdx = (() => {
    for (let i = WAYPOINTS.length - 1; i >= 0; i--) {
      if (estimatedKm >= WAYPOINTS[i].distanceKmFromStart) return i;
    }
    return 0;
  })();

  // 현재 국가 찾기
  const currentCountryIdx = (() => {
    for (let i = COUNTRY_SEGMENTS.length - 1; i >= 0; i--) {
      const seg = COUNTRY_SEGMENTS[i];
      if (progress.currentWaypointIndex >= seg.startIndex) return i;
    }
    return 0;
  })();
  const currentCountry = COUNTRY_SEGMENTS[currentCountryIdx];
  const nextCountry = currentCountryIdx < COUNTRY_SEGMENTS.length - 1
    ? COUNTRY_SEGMENTS[currentCountryIdx + 1]
    : null;

  // 현재 국가 내 진행률
  const countryStartKm = WAYPOINTS[currentCountry.startIndex].distanceKmFromStart;
  const countryEndKm = WAYPOINTS[currentCountry.endIndex].distanceKmFromStart;
  const countryTotalKm = countryEndKm - countryStartKm;
  const countryProgressKm = Math.max(0, totalDistanceKm - countryStartKm);
  const countryProgressPercent = countryTotalKm > 0
    ? Math.min(100, Math.round((countryProgressKm / countryTotalKm) * 100))
    : 100;

  // 다음 나라까지 남은 거리
  const remainingKmToNextCountry = nextCountry
    ? Math.max(0, WAYPOINTS[nextCountry.startIndex].distanceKmFromStart - totalDistanceKm)
    : 0;
  const remainingDaysToNextCountry = Math.ceil(remainingKmToNextCountry / 50);

  // 최종 목표까지 남은 거리
  const remainingKmToFinal = Math.max(0, TOTAL_DISTANCE_KM - totalDistanceKm);
  const remainingDaysToFinal = Math.ceil(remainingKmToFinal / 50);

  // 금주 상세 (오전/오후 분리)
  const thisWeekSessions = sessions.filter((s) => {
    const ws = weeklyStats.weekStart;
    const we = weeklyStats.weekEnd;
    return s.workDateKst >= ws && s.workDateKst <= we;
  });

  // 오늘 세션
  const todaySessions = sessions.filter((s) => s.workDateKst === todayKst());
  const todayEarnings = todaySessions.reduce(
    (sum, s) => sum + sessionEarnings(s, sessions),
    0
  );
  const todayCount = todaySessions.reduce(
    (sum, s) => sum + sessionTotalCount(s, sessions),
    0
  );

  // 일평균 (금주 기준)
  const dailyAvg =
    weeklyStats.dailyBreakdown.length > 0
      ? Math.round(
          weeklyStats.totalEarnings / weeklyStats.dailyBreakdown.length
        )
      : 0;

  // 요일 이름
  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

  // 날짜 → 요일 이름
  const getDayName = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return DAY_NAMES[dt.getUTCDay()];
  };

  // 오늘 날짜+요일
  const todayStr = todayKst();
  const todayDayName = getDayName(todayStr);
  const todayDisplay = `${todayStr.slice(5)} (${todayDayName})`;

  // 완료된 부채 항목
  const completedDebts = settings.debts.filter(
    (d) => totalAllEarnings >=
      settings.debts
        .filter((_, i) => settings.debts.indexOf(d) >= i)
        .reduce((sum, x) => sum + x.amount, 0)
  );
  const nextDebt = settings.debts.find(
    (d) => !completedDebts.includes(d)
  );

  // 주간 목표 달성 여부
  const weeklyGoalAchieved = weeklyStats.totalEarnings >= settings.goals.weekly;

  // 모토
  const MOTTOS = [
    '오늘도 파이팅!',
    '한 건 더!',
    '목표를 향해 달려요!',
    '오늘도 힘내자!',
    '할 수 있다!',
  ];
  const motto = MOTTOS[Math.floor(Math.random() * MOTTOS.length)];

  return (
    <div className="px-6 pb-24">
      {/* ===== 헤더: 타이틀 + 날짜 ===== */}
      <div className="flex items-center justify-between py-3 mb-2">
        <div className="text-lg font-bold text-gray-800">
          돈벌어서 여행가자!
        </div>
        <div className="text-xs text-gray-400">{todayDisplay}</div>
      </div>

      {/* ===== 트래블 카드 (지도 + 상태 + 접기) ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3">
        {/* 헤더: 운행일차 + 접기 버튼 */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span className="text-sm font-bold text-gray-700">
              운행 {streak}일차. 어디까지 왔니?
            </span>
          </div>
          <button
            onClick={() => setMapCollapsed(!mapCollapsed)}
            className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            {mapCollapsed ? '지도 펼치기' : '지도 접기'}
          </button>
        </div>

        {/* 지도 */}
        {!mapCollapsed && (
          <div className="px-4 pb-2">
            <RouteMap totalDistanceKm={totalDistanceKm} />
          </div>
        )}

        {/* 상태 정보 - 3개의 로딩바 */}
        <div className="px-4 pb-3">
          <div className="bg-gray-50 rounded-lg p-3 space-y-3">
            {/* 로딩바 1: 하루 동안 갈 수 있는 거리에 있는 도시의 진행률 */}
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>오늘의 목표 도시: {estimatedWaypointIdx < WAYPOINTS.length ? WAYPOINTS[estimatedWaypointIdx].name : '완주!'}</span>
                <span>{progress.segmentProgressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${progress.segmentProgressPercent}%` }}
                />
              </div>
            </div>

            {/* 로딩바 2: 다음 나라까지 남은 날수 */}
            {nextCountry && (
              <div>
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                  <span>다음 나라({nextCountry.name})까지</span>
                  <span>{remainingDaysToNextCountry}일 남음</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 rounded-full h-2 transition-all duration-500"
                    style={{ width: `${Math.min(100, (totalDistanceKm / WAYPOINTS[nextCountry.startIndex].distanceKmFromStart) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* 로딩바 3: 최종 목표까지 남은 거리 */}
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>최종 목표(파타야)까지</span>
                <span>{remainingKmToFinal.toLocaleString()}km ({remainingDaysToFinal}일)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${progress.totalProgressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 출퇴근 카드 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                activeSession ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm font-semibold text-gray-600">
              {activeSession ? `${shiftLabel} 근무중` : '출근 준비'}
            </span>
          </div>
          {activeSession && (
            <span className="text-xs text-gray-400">
              {new Date(activeSession.startAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              출근
            </span>
          )}
        </div>

        {activeSession ? (
          <>
            <div className="text-center mb-2">
              <div className="text-3xl font-bold text-gray-800">
                {formatDuration(elapsedMin)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {achieved
                  ? '목표 시간 달성!'
                  : `목표까지 ${formatDuration(remainingMin)} 남음`}
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
              <div
                className={`rounded-full h-2 transition-all duration-500 ${
                  achieved ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
            <button
              onClick={() => setShowEndModal(true)}
              className="w-full bg-red-500 text-white rounded-lg py-3 font-bold text-sm"
            >
              퇴근하기
            </button>
          </>
        ) : (
          <>
            <div className="text-center text-xs text-gray-400 mb-3">
              {motto}
            </div>
            <button
              onClick={onStartShift}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-lg font-extrabold py-4 rounded-xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all tracking-wide"
            >
              출근하자!
            </button>
          </>
        )}
      </div>

      {/* ===== 부채 동기부여 카드 ===== */}
      {settings.debts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-800">갚아야 할 빚</h3>
            <span className="text-sm font-bold text-orange-500">
              {debtProgress.paidPercent}%
            </span>
          </div>

          {/* 진행 막대 */}
          <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
            <div
              className="bg-orange-400 rounded-full h-3 transition-all"
              style={{ width: `${debtProgress.paidPercent}%` }}
            />
          </div>

          {/* 다음 부채 */}
          {nextDebt && (
            <div className="bg-orange-50 rounded-lg p-2 mb-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">{nextDebt.name}</span>
                <span className="font-medium">
                  {Math.min(
                    nextDebt.amount,
                    Math.max(0, totalAllEarnings)
                  ).toLocaleString()}
                  원 / {nextDebt.amount.toLocaleString()}원
                </span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-1.5 mt-1">
                <div
                  className="bg-orange-500 rounded-full h-1.5"
                  style={{
                    width: `${Math.min(
                      100,
                      (totalAllEarnings / nextDebt.amount) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* 완료된 항목 */}
          {completedDebts.length > 0 && (
            <div className="text-xs text-green-600 mt-1">
              {completedDebts.map((d) => d.name).join(', ')}{' '}
              <span className="font-bold">COMPLETE</span>
            </div>
          )}

          {/* 부채 내역 보기 */}
          {settings.debts.length > 1 && (
            <>
              {debtExpanded && (
                <div className="mt-2 space-y-1">
                  {settings.debts.map((d, i) => {
                    const cumulative = settings.debts
                      .slice(0, i + 1)
                      .reduce((sum, x) => sum + x.amount, 0);
                    const paid = Math.min(cumulative, Math.max(0, totalAllEarnings));
                    const prevCumulative = settings.debts
                      .slice(0, i)
                      .reduce((sum, x) => sum + x.amount, 0);
                    const debtPaid = Math.max(0, Math.min(d.amount, paid - prevCumulative));
                    return (
                      <div key={i} className="flex justify-between text-xs text-gray-500">
                        <span>{d.name}</span>
                        <span>
                          {debtPaid.toLocaleString()}원 / {d.amount.toLocaleString()}원
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <button
                onClick={() => setDebtExpanded(!debtExpanded)}
                className="text-xs text-gray-400 mt-2 hover:text-gray-600"
              >
                {debtExpanded ? '부채내역 접기' : '부채내역 보기'}
              </button>
            </>
          )}
        </div>
      )}

      {/* ===== 금주 수익 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-gray-800">이번 주 수익</h3>
          <span className="text-xs text-gray-400">
            {weeklyStats.weekStart.slice(5)} ~ {weeklyStats.weekEnd.slice(5)}
          </span>
        </div>

        <div className="text-3xl font-bold text-blue-600 mb-2">
          {weeklyStats.totalEarnings.toLocaleString()}
          <small className="text-sm font-normal text-gray-400 ml-1">원</small>
        </div>

        {/* 주간 목표 진행 */}
        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
          <div
            className={`rounded-full h-2.5 transition-all ${
              weeklyGoalAchieved
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse'
                : 'bg-blue-400'
            }`}
            style={{
              width: `${Math.min(
                100,
                (weeklyStats.totalEarnings / settings.goals.weekly) * 100
              )}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <span>주간 목표 {settings.goals.weekly.toLocaleString()}원</span>
          <span className="font-bold text-blue-500">
            {Math.min(100, Math.round((weeklyStats.totalEarnings / settings.goals.weekly) * 100))}%
          </span>
        </div>

        {/* 주간 목표 달성 */}
        {weeklyGoalAchieved && (
          <div className="text-center mb-3">
            <span className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold px-4 py-1.5 rounded-full animate-bounce shadow-lg">
              주간 목표 COMPLETE!
            </span>
          </div>
        )}

        {/* 3행 통계 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-lg p-2.5 text-center">
            <div className="text-xs text-gray-400 mb-0.5">오늘</div>
            <div className="text-lg font-bold text-blue-600">
              {todayEarnings.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 text-center">
            <div className="text-xs text-gray-400 mb-0.5">일 평균</div>
            <div className="text-lg font-bold text-gray-700">
              {dailyAvg.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 text-center">
            <div className="text-xs text-gray-400 mb-0.5">근무일</div>
            <div className="text-lg font-bold text-green-600">
              {weeklyStats.totalSessions}일
            </div>
          </div>
        </div>
      </div>

      {/* ===== 금주 수익 그래프 (월~일 7일) ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <h3 className="font-bold text-gray-800 mb-3">금주 수익 그래프</h3>
        <div className="flex items-end gap-1.5 h-32 mb-2">
          {(() => {
            const ws = weekStartKst();
            const [y, m, d] = ws.split('-').map(Number);
            const wsDate = new Date(Date.UTC(y, m - 1, d) - 9 * 60 * 60 * 1000);
            const days: { date: string; earnings: number; achieved: boolean }[] = [];
            for (let i = 0; i < 7; i++) {
              const d = new Date(wsDate.getTime() + i * 86400000 + 9 * 60 * 60 * 1000);
              const dateStr = formatDateKst(d);
              const found = weeklyStats.dailyBreakdown.find((b) => b.date === dateStr);
              days.push({
                date: dateStr,
                earnings: found ? found.earnings : 0,
                achieved: found ? found.earnings >= settings.goals.daily : false,
              });
            }
            return days;
          })().map((day) => {
            const baseMax = 180000;
            const ws = weekStartKst();
            const [y, m, d] = ws.split('-').map(Number);
            const wsDate = new Date(Date.UTC(y, m - 1, d) - 9 * 60 * 60 * 1000);
            const allDays: number[] = [];
            for (let i = 0; i < 7; i++) {
              const d = new Date(wsDate.getTime() + i * 86400000 + 9 * 60 * 60 * 1000);
              const dateStr = formatDateKst(d);
              const found = weeklyStats.dailyBreakdown.find((b) => b.date === dateStr);
              allDays.push(found ? found.earnings : 0);
            }
            const weekMax = Math.max(...allDays, 0);
            const maxForHeight = Math.max(baseMax, weekMax);
            const heightPercent = maxForHeight > 0 ? (day.earnings / maxForHeight) * 100 : 0;
            const hasData = day.earnings > 0;
            const dayName = getDayName(day.date);
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div className="text-[9px] text-gray-400 mb-0.5">
                  {hasData ? day.earnings.toLocaleString() : ''}
                </div>
                <div
                  className={`w-full rounded-t transition-all ${
                    hasData
                      ? day.achieved
                        ? 'bg-gradient-to-t from-yellow-400 to-orange-400'
                        : 'bg-gray-300'
                      : 'bg-gray-100'
                  }`}
                  style={{ height: `${Math.max(hasData ? 24 : 4, (heightPercent / 100) * 128)}px` }}
                />
                <span className="text-[10px] text-gray-400 mt-1">
                  {dayName}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-blue-400 inline-block" />
            수익
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-green-500 inline-block" />
            목표달성
          </span>
        </div>
      </div>

      {/* ===== 금주 수익 상세기록 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <h3 className="font-bold text-gray-800 mb-3">이번 주 기록</h3>

        {thisWeekSessions.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">
            이번 주 기록이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const dateGroups = new Map<string, WorkSession[]>();
              for (const s of thisWeekSessions) {
                const existing = dateGroups.get(s.workDateKst) || [];
                existing.push(s);
                dateGroups.set(s.workDateKst, existing);
              }
              const sortedDates = Array.from(dateGroups.keys()).sort().reverse();

              return sortedDates.map((dateKst) => {
                const daySessions = dateGroups.get(dateKst)!;
                const sorted = [...daySessions].sort((a, b) =>
                  a.shiftType === 'morning' ? -1 : 1
                );
                const dailyTotal = dailyTotalEarnings(thisWeekSessions, dateKst);
                const dailyGoalAchieved = dailyTotal >= settings.goals.daily;

                return (
                  <div key={dateKst} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-700">
                        {dateKst}
                      </span>
                      <div className="flex items-center gap-2">
                        {dailyGoalAchieved && (
                          <span className="text-[10px] bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                            COMPLETE
                          </span>
                        )}
                        <span className="text-xs font-bold text-blue-600">
                          일일 합계 {dailyTotal.toLocaleString()}원
                        </span>
                      </div>
                    </div>

                    {sorted.map((session) => {
                      const earnings = sessionEarnings(session, sessions);
                      const count = sessionTotalCount(session, sessions);
                      const hr = hourlyRate(earnings, session.durationMin);
                      const avg = avgPerOrder(earnings, count);
                      const epk = earningsPerKm(earnings, session.distanceKmInput);
                      const isMorning = session.shiftType === 'morning';
                      const sessionKey = session.id || `${session.workDateKst}-${session.shiftType}-${session.startAt}`;

                      const morningSession = !isMorning
                        ? sessions.find(
                            (s) => s.workDateKst === session.workDateKst && s.shiftType === 'morning'
                          )
                        : null;
                      const cquickCount = isMorning
                        ? session.platforms.cquick.count
                        : Math.max(0, session.platforms.cquick.count - (morningSession?.platforms.cquick.count || 0));
                      const cquickAmount = isMorning
                        ? session.platforms.cquick.amount
                        : Math.max(0, session.platforms.cquick.amount - (morningSession?.platforms.cquick.amount || 0));
                      const baeminCount = isMorning
                        ? session.platforms.baemin.count
                        : Math.max(0, session.platforms.baemin.count - (morningSession?.platforms.baemin.count || 0));
                      const baeminAmount = isMorning
                        ? session.platforms.baemin.amount
                        : Math.max(0, session.platforms.baemin.amount - (morningSession?.platforms.baemin.amount || 0));

                      const cquickAvg = cquickCount > 0 ? Math.round(cquickAmount / cquickCount) : 0;
                      const baeminAvg = baeminCount > 0 ? Math.round(baeminAmount / baeminCount) : 0;

                      return (
                        <div
                          key={sessionKey}
                          className="ml-2 pl-3 border-l-2 border-gray-100 py-2"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  isMorning
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}
                              >
                                {isMorning ? '오전' : '오후'}
                              </span>
                              <span className="text-sm font-bold">
                                {earnings.toLocaleString()}원
                              </span>
                              <span className="text-xs text-gray-500">
                                {count}건 | {formatDurationShort(session.durationMin)} | {session.distanceKmInput}km
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1 text-xs text-gray-400 mb-1">
                            <span>건당 {avg.toLocaleString()}원</span>
                            <span>시급 {hr.toLocaleString()}원</span>
                            <span>km당 {epk.toLocaleString()}원</span>
                          </div>

                          <div className="space-y-0.5">
                            {cquickCount > 0 && (
                              <div className="text-xs text-blue-600 font-medium">
                                카카오퀵: {cquickCount}건 {cquickAmount.toLocaleString()}원 (건당 {cquickAvg.toLocaleString()}원)
                              </div>
                            )}
                            {baeminCount > 0 && (
                              <div className="text-xs text-emerald-600 font-medium">
                                배민: {baeminCount}건 {baeminAmount.toLocaleString()}원 (건당 {baeminAvg.toLocaleString()}원)
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* 퇴근 모달 */}
      <ShiftEndModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onSubmit={(data) => {
          onEndShift(data);
          setShowEndModal(false);
        }}
        dailyGoal={settings.goals.daily}
        durationMin={elapsedMin}
      />
    </div>
  );
}
