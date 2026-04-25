// ============================================================
// 메인 탭 - 출퇴근, 거리 진행, 금주 통계
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
  dayOfWeekKst,
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
import { WAYPOINTS, TOTAL_DISTANCE_KM } from '@/lib/route/waypoints';
import {
  sessionEarnings,
  sessionTotalCount,
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
    const dt = new Date(Date.UTC(y, m - 1, d) - 9 * 60 * 60 * 1000);
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

  return (
    <div className="px-4 pb-24">
      {/* ===== 레이어0: 헤더 (메인테마) ===== */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white mb-4">
        <div className="text-sm opacity-90 mb-1">오늘 달리면?!</div>
        <div className="text-lg font-bold mb-2">
          {estimatedWaypointIdx < WAYPOINTS.length
            ? `${WAYPOINTS[estimatedWaypointIdx].name}까지 도착합니다!`
            : '모든 구간 완주!'}
        </div>

        {/* 진행 바 */}
        <div className="w-full bg-white/20 rounded-full h-2.5 mb-1">
          <div
            className="bg-white rounded-full h-2.5 transition-all duration-500"
            style={{ width: `${progress.totalProgressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs opacity-80">
          <span>서울 화곡역</span>
          <span>{progress.totalProgressPercent}%</span>
          <span>치앙마이</span>
        </div>

        {/* 현재 위치 정보 */}
        <div className="mt-2 text-xs bg-white/10 rounded-lg p-2">
          <div className="flex justify-between">
            <span>
              📍 현재:{' '}
              {currentWaypoint
                ? `${currentWaypoint.name} (${progress.currentWaypointIndex + 1}구간)`
                : '출발 전'}
            </span>
            <span>
              🎯 다음:{' '}
              {nextWaypoint
                ? `${nextWaypoint.name}까지 ${progress.remainingKmToNext.toLocaleString()}km`
                : '완주!'}
            </span>
          </div>
          {nextWaypoint && nextWaypoint.segmentType === 'sea' && (
            <div className="text-yellow-200 mt-1">
              ⛴️ 해상 구간: {currentWaypoint?.name} → {nextWaypoint.name}{' '}
              (직선거리 {progress.segmentTotalKm.toLocaleString()}km 중{' '}
              {progress.segmentProgressKm.toLocaleString()}km 진행)
            </div>
          )}
        </div>
      </div>

      {/* ===== 지도 ===== */}
      <div className="mb-4">
        <RouteMap totalDistanceKm={totalDistanceKm} />
      </div>

      {/* ===== 레이어1: 출퇴근 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm font-semibold text-gray-600">
              {shiftLabel} 근무
            </span>
            <span className="text-xs text-gray-400 ml-2">
              목표 {Math.floor(targetMin / 60)}시간
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
            <div className="text-center mb-3">
              <div className="text-3xl font-bold text-gray-800">
                {formatDuration(elapsedMin)}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {achieved
                  ? '✅ 목표 시간 달성!'
                  : `목표까지 ${formatDuration(remainingMin)} 남음`}
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
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
          <button
            onClick={onStartShift}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-bold text-sm"
          >
            출근하기
          </button>
        )}
      </div>

      {/* ===== 레이어2: 연속 출근일 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🔥</div>
          <div>
            <div className="text-xs text-gray-400">연속 출근</div>
            <div className="text-2xl font-bold text-orange-500">
              {streak}일째
            </div>
          </div>
        </div>
      </div>

      {/* ===== 레이어3: 부채상환 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-gray-800">부채 상환</h3>
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

        {/* 상위 부채 항목 */}
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
      </div>

      {/* ===== 레이어4: 금주 수익내역 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-gray-800">금주 수익</h3>
          <span className="text-xs text-gray-400">
            {weeklyStats.weekStart} ~ {weeklyStats.weekEnd}
          </span>
        </div>

        <div className="text-2xl font-bold text-blue-600 mb-2">
          {weeklyStats.totalEarnings.toLocaleString()}원
        </div>

        {/* 주간 목표 진행 + 퍼센트 */}
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>주간 목표</span>
          <span>
            {weeklyStats.totalEarnings.toLocaleString()}원 /{' '}
            {settings.goals.weekly.toLocaleString()}원
            {' '}
            <span className="font-bold text-blue-500">
              ({Math.min(100, Math.round((weeklyStats.totalEarnings / settings.goals.weekly) * 100))}%)
            </span>
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
          <div
            className="bg-blue-400 rounded-full h-2 transition-all"
            style={{
              width: `${Math.min(
                100,
                (weeklyStats.totalEarnings / settings.goals.weekly) * 100
              )}%`,
            }}
          />
        </div>

        {/* 3행 요약 - 오늘 금액은 activeSession 포함 */}
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="font-bold text-gray-700">
              {todayEarnings.toLocaleString()}원
            </div>
            <div className="text-[10px]">{todayDisplay}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="font-bold text-gray-700">
              {dailyAvg.toLocaleString()}원
            </div>
            <div>일평균</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="font-bold text-gray-700">
              {weeklyStats.totalSessions}일
            </div>
            <div>금주 근무일</div>
          </div>
        </div>
      </div>

      {/* ===== 레이어5: 금주 수익 그래프 (월~일 7일) ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <h3 className="font-bold text-gray-800 mb-3">금주 수익 그래프</h3>
        <div className="flex items-end gap-1.5 h-32 mb-2">
          {(() => {
            // 월~일 7일 생성 (KST 기준)
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
            // 기준: 18만원이 최고 높이, 18만원 이상이면 그 금액이 최고 높이
            const baseMax = 180000;
            const weekMax = Math.max(
              ...(() => {
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
                return allDays;
              })(),
              0
            );
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
                        ? 'bg-sky-400'
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
      </div>

      {/* ===== 레이어6: 금주 수익 상세기록 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <h3 className="font-bold text-gray-800 mb-3">금주 수익 상세</h3>

        {thisWeekSessions.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">
            이번 주 기록이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {thisWeekSessions.map((session) => {
              const earnings = sessionEarnings(session, sessions);
              const count = sessionTotalCount(session, sessions);
              const hr = hourlyRate(earnings, session.durationMin);
              const avg = avgPerOrder(earnings, count);
              const epk = earningsPerKm(earnings, session.distanceKmInput);
              const isMorning = session.shiftType === 'morning';

              // 플랫폼별 데이터
              const cquickEarnings = session.platforms.cquick.amount;
              const cquickCount = session.platforms.cquick.count;
              const baeminEarnings = session.platforms.baemin.amount;
              const baeminCount = session.platforms.baemin.count;

              const sessionKey = session.id || `${session.workDateKst}-${session.shiftType}-${session.startAt}`;
              return (
                <div
                  key={sessionKey}
                  className="border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                >
                  {/* 날짜 + 오전/오후 */}
                  <div className="flex justify-between items-center mb-1">
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
                      <span className="text-xs text-gray-500">
                        {session.workDateKst} ({getDayName(session.workDateKst)})
                      </span>
                    </div>
                    <span className="text-sm font-bold">
                      {earnings.toLocaleString()}원
                    </span>
                  </div>

                  {/* 통합 상세 */}
                  <div className="grid grid-cols-4 gap-1 text-[10px] text-gray-400">
                    <span>건수 {count}건</span>
                    <span>건당 {avg.toLocaleString()}원</span>
                    <span>시급 {hr.toLocaleString()}원</span>
                    <span>km당 {epk.toLocaleString()}원</span>
                  </div>

                  {/* 플랫폼별 상세 */}
                  <div className="flex gap-3 mt-1 text-[10px]">
                    {cquickCount > 0 && (
                      <span className="text-blue-500">
                        🚀 카카오퀵 {cquickCount}건 {cquickEarnings.toLocaleString()}원
                      </span>
                    )}
                    {baeminCount > 0 && (
                      <span className="text-green-500">
                        🛵 배민 {baeminCount}건 {baeminEarnings.toLocaleString()}원
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {formatDurationShort(session.durationMin)} |{' '}
                    {session.distanceKmInput}km
                  </div>
                </div>
              );
            })}
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
