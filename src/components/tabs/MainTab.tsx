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

  // 주간 목표 달성 여부
  const weeklyGoalAchieved = weeklyStats.totalEarnings >= settings.goals.weekly;

  // 모토
  const MOTTOS = [
    '오늘도 파이팅!',
    '한 건 더!',
    '목표를 향해 달려요!',
    '오늘도 힘내자!',
    '할 수 있다!',
    '오늘 목표 채우고 고기 먹자!',
    '힘들어 뒈질 것 같지?? 돈 없어서 뒈지는 것보단 낫잖아??!!',
    '오늘 달린 만큼 내일의 내가 쉴 수 있다!',
    '지금 땀 흘리면 나중에 웃는다!',
    '오늘의 배달이 내일의 여행 자본이다!',
    '움직여야 돈이 벌린다! 쉬면 녹슨다!',
    '목표를 향해 달려라! 멈추지 마!',
    '오늘도 한 걸음! 여행지가 가까워진다!',
    '불타오르는 오늘, 후회 없는 내일!',
    '꾸준함이 곧 무기다! 오늘도 파이팅!',
    '바퀴 굴러가는 소리가 돈 소리다!',
    '지금 힘들다고? 여행갈 때 생각해!',
    '오늘 목표 달성하면 내일은 반차다!',
    '쉬고 싶다? 돈 벌고 쉬자! 빈털터리로 쉬면 개같다!',
    '결승점은 파타야! 달려라!',
  ];
  const motto = MOTTOS[Math.floor(Math.random() * MOTTOS.length)];

  // 부채 총액
  const totalDebtAmount = settings.debts.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="px-3 pb-24">
      {/* ===== 헤더: 타이틀 + 날짜 ===== */}
      <div className="flex items-center justify-between py-2 mb-1">
        <div className="text-xl font-extrabold text-[#ef4444]">
          돈벌어서 여행가자!
        </div>
        <div className="text-sm text-[#2d334a]">{todayDisplay}</div>
      </div>

      {/* ===== 트래블 카드 (지도 + 상태 + 접기) ===== */}
      <div className="bg-[#fffffe] rounded-xl shadow-sm border border-[#e3f6f5] overflow-hidden mb-2">
        {/* 헤더: 운행일차 + 접기 버튼 */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span className="text-base font-bold text-[#0f172a]">
              운행 <span className="text-[#ef4444] font-extrabold">{streak}</span>일차. 어디까지 왔니?
            </span>
          </div>
          <button
            onClick={() => setMapCollapsed(!mapCollapsed)}
            className="text-xs text-[#2d334a] bg-[#e3f6f5] px-3 py-1 rounded-full hover:bg-[#bae8e8] transition-colors"
          >
            {mapCollapsed ? '지도 펼치기' : '지도 접기'}
          </button>
        </div>

        {/* 지도 (애니메이션) */}
        <div
          className={`px-3 pb-1 overflow-hidden transition-all duration-500 ease-in-out ${
            mapCollapsed ? 'max-h-0 opacity-0 pb-0' : 'max-h-[500px] opacity-100'
          }`}
        >
          <RouteMap totalDistanceKm={totalDistanceKm} />
        </div>

        {/* 상태 정보 - 3개의 로딩바 */}
        <div className="px-3 pb-2">
          <div className="bg-slate-50 rounded-lg p-2 space-y-2">
            {/* 로딩바 1: 하루 동안 갈 수 있는 거리에 있는 도시의 진행률 */}
            <div>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-[#0f172a] font-bold">오늘의 목표 도시: {estimatedWaypointIdx < WAYPOINTS.length ? WAYPOINTS[estimatedWaypointIdx].name : '완주!'}</span>
                <span className="text-[#64748b]">{progress.segmentProgressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div
                  className="gradient-bar-red rounded-full h-2.5"
                  style={{ width: `${progress.segmentProgressPercent}%` }}
                />
              </div>
            </div>

            {/* 로딩바 2: 다음 나라까지 남은 날수 */}
            {nextCountry && (
              <div>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-[#0f172a] font-bold">다음 나라({nextCountry.name})까지</span>
                  <span className="text-[#64748b]">{remainingDaysToNextCountry}일 남음</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div
                    className="gradient-bar-amber rounded-full h-2.5"
                    style={{ width: `${Math.min(100, (totalDistanceKm / WAYPOINTS[nextCountry.startIndex].distanceKmFromStart) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* 로딩바 3: 최종 목표까지 남은 거리 */}
            <div>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-[#0f172a] font-bold">최종 목표(파타야)까지</span>
                <span className="text-[#64748b]">{remainingKmToFinal.toLocaleString()}km ({remainingDaysToFinal}일)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div
                  className="gradient-bar-red-strong rounded-full h-2.5"
                  style={{ width: `${progress.totalProgressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 출퇴근 카드 ===== */}
      <div className="bg-[#fffffe] rounded-xl shadow-sm border border-[#e3f6f5] p-3 mb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                activeSession ? 'bg-[#10b981] animate-pulse' : 'bg-[#bae8e8]'
              }`}
            />
            <span className="text-base font-bold text-[#272343]">
              {activeSession ? `${shiftLabel} 근무중` : '출근 준비'}
            </span>
          </div>
          {activeSession && (
            <span className="text-sm text-[#2d334a]">
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
            <div className="text-center mb-1">
              <div className="text-4xl font-bold text-[#ef4444]">
                {formatDuration(elapsedMin)}
              </div>
              <div className="text-sm text-[#64748b] mt-0.5">
                {achieved
                  ? '✅ 목표 시간 달성!'
                  : `목표까지 ${formatDuration(remainingMin)} 남음`}
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
              <div
                className={`rounded-full h-2.5 transition-all duration-500 ${
                  achieved ? 'gradient-bar-green' : 'gradient-bar-red'
                }`}
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
            <button
              onClick={() => setShowEndModal(true)}
              className="w-full bg-[#ef4444] text-white rounded-xl py-3 font-bold text-base shadow-sm hover:bg-[#dc2626] transition-colors"
            >
              퇴근하기
            </button>
          </>
        ) : (
          <>
            <div className="text-center text-base font-extrabold text-[#ef4444] mb-2 animate-pulse">
              {motto}
            </div>
            <button
              onClick={onStartShift}
              className="w-full bg-[#ef4444] text-white text-xl font-extrabold py-4 rounded-xl shadow-sm hover:bg-[#dc2626] active:scale-[0.98] transition-all tracking-wide"
            >
              출근하자!
            </button>
          </>
        )}
      </div>

      {/* ===== 부채 동기부여 카드 ===== */}
      {settings.debts.length > 0 && (
        <div className="bg-[#fffffe] rounded-xl shadow-sm border border-[#e3f6f5] p-3 mb-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-[#272343]">갚아야 할 빚</h3>
            <span className="text-base font-bold text-[#ef4444]">
              {debtProgress.paidPercent}%
            </span>
          </div>

          {/* 전체 부채 진행 막대 - 내부에 금액 표시 */}
          <div className="w-full bg-slate-100 rounded-full h-10 mb-2 overflow-hidden relative">
            <div
              className={`rounded-full h-10 transition-all duration-500 absolute top-0 left-0 ${
                debtProgress.remainingPercent <= 25
                  ? 'gradient-bar-green'
                  : debtProgress.remainingPercent <= 50
                  ? 'gradient-bar-red'
                  : debtProgress.remainingPercent <= 75
                  ? 'gradient-bar-amber'
                  : 'gradient-bar-red-strong'
              }`}
              style={{ width: `${debtProgress.paidPercent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              <span>{Math.min(totalAllEarnings, totalDebtAmount).toLocaleString()}원</span>
              <span className="mx-1 text-white/70">/</span>
              <span className="text-[#fbbf24]">{totalDebtAmount.toLocaleString()}원</span>
              <span className="ml-2 text-xs text-white/80">({debtProgress.remainingPercent}% 남음)</span>
            </div>
          </div>

          {/* 부채 항목 리스트 (접기 가능, 기본 접힘) */}
          <button
            onClick={() => setDebtExpanded(!debtExpanded)}
            className="w-full flex items-center justify-between text-sm text-[#64748b] bg-slate-50 rounded-lg px-3 py-2 hover:text-[#0f172a] transition-colors"
          >
            <span>부채 내역 보기 ({settings.debts.length}개)</span>
            <svg
              className={`w-4 h-4 transition-transform ${debtExpanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {debtExpanded && (
            <div className="space-y-1.5 mt-2">
              {settings.debts.map((debt, i) => {
                const cumulative = settings.debts
                  .slice(0, i + 1)
                  .reduce((sum, x) => sum + x.amount, 0);
                const prevCumulative = settings.debts
                  .slice(0, i)
                  .reduce((sum, x) => sum + x.amount, 0);
                const paid = Math.min(cumulative, Math.max(0, totalAllEarnings));
                const debtPaid = Math.max(0, Math.min(debt.amount, paid - prevCumulative));
                const isCompleted = debtPaid >= debt.amount;

                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${
                      isCompleted
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <span className="text-[#10b981] text-sm">✅</span>
                      )}
                      <span className={`text-sm font-medium ${isCompleted ? 'text-[#10b981]' : 'text-[#64748b]'}`}>
                        {debt.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isCompleted ? 'text-[#10b981]' : 'text-[#0f172a]'}`}>
                        {debtPaid.toLocaleString()}원
                      </span>
                      <span className="text-sm text-[#94a3b8]">/</span>
                      <span className="text-sm text-[#ef4444]">
                        {debt.amount.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== 금주 수익 ===== */}
      <div className="bg-[#fffffe] rounded-xl shadow-sm border border-[#e3f6f5] p-3 mb-2">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-base font-bold text-[#272343]">이번 주 수익</h3>
          <span className="text-sm text-[#2d334a]">
            {weeklyStats.weekStart.slice(5)} ~ {weeklyStats.weekEnd.slice(5)}
          </span>
        </div>

        <div className="text-4xl font-bold text-[#ef4444] mb-1">
          {weeklyStats.totalEarnings.toLocaleString()}
          <small className="text-base font-normal text-[#64748b] ml-1">원</small>
        </div>

        {/* 주간 목표 진행 */}
        <div className="w-full bg-slate-100 rounded-full h-3 mb-1">
          <div
            className={`rounded-full h-3 transition-all ${
              weeklyGoalAchieved
                ? 'gradient-bar-amber'
                : 'gradient-bar-red'
            }`}
            style={{
              width: `${Math.min(
                100,
                (weeklyStats.totalEarnings / settings.goals.weekly) * 100
              )}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-sm text-[#64748b] mb-2">
          <span>주간 목표 {settings.goals.weekly.toLocaleString()}원</span>
          <span className="font-bold text-[#ef4444]">
            {Math.min(100, Math.round((weeklyStats.totalEarnings / settings.goals.weekly) * 100))}%
          </span>
        </div>

        {/* 주간 목표 달성 */}
        {weeklyGoalAchieved && (
          <div className="text-center mb-2">
            <span className="inline-block gradient-bar-amber text-white text-base font-bold px-4 py-1.5 rounded-full animate-bounce shadow-sm">
              주간 목표 COMPLETE!
            </span>
          </div>
        )}

        {/* 3행 통계 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-200">
            <div className="text-sm text-[#64748b] mb-0.5">오늘</div>
            <div className="text-xl font-bold text-[#ef4444]">
              {todayEarnings.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-200">
            <div className="text-sm text-[#64748b] mb-0.5">일 평균</div>
            <div className="text-xl font-bold text-[#0f172a]">
              {dailyAvg.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-200">
            <div className="text-sm text-[#64748b] mb-0.5">근무일</div>
            <div className="text-xl font-bold text-[#10b981]">
              {weeklyStats.totalSessions}일
            </div>
          </div>
        </div>
      </div>

      {/* ===== 금주 수익 그래프 (월~일 7일) ===== */}
      <div className="bg-[#fffffe] rounded-xl shadow-sm border border-[#e3f6f5] p-3 mb-2">
        <h3 className="text-base font-bold text-[#272343] mb-2">금주 수익 그래프</h3>
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
                <div className="text-xs text-[#64748b] mb-0.5">
                  {hasData ? day.earnings.toLocaleString() : ''}
                </div>
                <div
                  className={`w-full rounded-t transition-all ${
                    hasData
                      ? day.achieved
                        ? 'bg-gradient-to-t from-[#ef4444] to-[#fca5a5]'
                        : 'bg-slate-300'
                      : 'bg-slate-100'
                  }`}
                  style={{ height: `${Math.max(hasData ? 24 : 4, (heightPercent / 100) * 128)}px` }}
                />
                <span className="text-xs text-[#64748b] mt-1">
                  {dayName}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-3 text-xs text-[#64748b]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-slate-300 inline-block" />
            수익
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-gradient-to-r from-[#ef4444] to-[#fca5a5] inline-block" />
            목표달성
          </span>
        </div>
      </div>

      {/* ===== 금주 수익 상세기록 ===== */}
      <div className="bg-[#fffffe] rounded-xl shadow-sm border border-[#e3f6f5] p-3 mb-4">
        <h3 className="text-base font-bold text-[#272343] mb-2">이번 주 기록</h3>

        {thisWeekSessions.length === 0 ? (
          <div className="text-center text-[#64748b] text-base py-4">
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
                  <div key={dateKst} className="border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base font-bold text-[#0f172a]">
                        {dateKst}
                      </span>
                      <div className="flex items-center gap-2">
                        {dailyGoalAchieved && (
                          <span className="text-xs gradient-bar-amber text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                            COMPLETE
                          </span>
                        )}
                        <span className="text-sm font-bold text-[#ef4444]">
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
                          className="ml-2 pl-3 border-l-2 border-slate-200 py-1"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm px-2 py-0.5 rounded-full ${
                                  isMorning
                                    ? 'bg-red-50 text-[#ef4444]'
                                    : 'bg-slate-100 text-[#64748b]'
                                }`}
                              >
                                {isMorning ? '오전' : '오후'}
                              </span>
                              <span className="text-base font-bold text-[#0f172a]">
                                {earnings.toLocaleString()}원
                              </span>
                              <span className="text-sm text-[#64748b]">
                                {count}건 | {formatDurationShort(session.durationMin)} | {session.distanceKmInput}km
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1 text-sm text-[#64748b] mb-1">
                            <span>건당 {avg.toLocaleString()}원</span>
                            <span>시급 {hr.toLocaleString()}원</span>
                            <span>km당 {epk.toLocaleString()}원</span>
                          </div>

                          <div className="space-y-0.5">
                            {cquickCount > 0 && (
                              <div className="text-sm text-[#ef4444] font-medium">
                                카카오퀵: {cquickCount}건 {cquickAmount.toLocaleString()}원 (건당 {cquickAvg.toLocaleString()}원)
                              </div>
                            )}
                            {baeminCount > 0 && (
                              <div className="text-sm text-[#0f172a] font-medium">
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
        targetAchieved={achieved}
      />
    </div>
  );
}
