// ============================================================
// 월간 탭 - 달력, 월 집계, 월 상세기록 (수정/삭제 포함)
// ============================================================

'use client';

import React, { useState, useMemo } from 'react';
import { WorkSession, AppSettings, Platforms } from '@/types/domain';
import {
  currentYearMonth,
  daysInMonth,
  firstDayOfMonth,
  toYearMonth,
  formatDuration,
  formatDurationShort,
} from '@/lib/time/kst';
import { formatInputNumber, parseFormattedNumber } from '@/lib/utils/format';
import AlertModal from '@/components/ui/AlertModal';
import {
  sessionEarnings,
  sessionTotalCount,
  dailyTotalEarnings,
  dailyTotalCount,
  calculateMonthlyStats,
  hourlyRate,
  avgPerOrder,
  earningsPerKm,
} from '@/lib/stats/earnings';

interface MonthlyTabProps {
  sessions: WorkSession[];
  settings: AppSettings;
  onUpdateSession?: (sessionId: string, data: Partial<WorkSession>) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export default function MonthlyTab({
  sessions,
  settings,
  onUpdateSession,
  onDeleteSession,
}: MonthlyTabProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth());
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    cquickCount: '',
    cquickAmount: '',
    baeminCount: '',
    baeminAmount: '',
    distanceKm: '',
    memo: '',
  });

  // 월별 세션
  const monthSessions = useMemo(
    () =>
      sessions.filter((s) => toYearMonth(s.workDateKst) === selectedMonth),
    [sessions, selectedMonth]
  );

  const stats = useMemo(
    () => calculateMonthlyStats(monthSessions, settings),
    [monthSessions, settings]
  );

  // 달력
  const calendarDays = useMemo(() => {
    const totalDays = daysInMonth(selectedMonth);
    const firstDay = firstDayOfMonth(selectedMonth);
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  }, [selectedMonth]);

  // 날짜별 데이터 맵 (dailyTotalEarnings 사용)
  const dayDataMap = useMemo(() => {
    const map = new Map<
      string,
      { earnings: number; count: number; achieved: boolean }
    >();
    const uniqueDates = new Set(monthSessions.map((s) => s.workDateKst));
    for (const dateKst of uniqueDates) {
      const earnings = dailyTotalEarnings(monthSessions, dateKst);
      const count = dailyTotalCount(monthSessions, dateKst);
      map.set(dateKst, {
        earnings,
        count,
        achieved: earnings >= settings.goals.daily,
      });
    }
    return map;
  }, [monthSessions, settings.goals.daily]);

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  // 목표 달성일 수
  const achievedDays = Array.from(dayDataMap.values()).filter(
    (d) => d.achieved
  ).length;

  // 월간 목표 달성 여부
  const monthlyGoalAchieved = stats.totalEarnings >= settings.goals.monthly;

  // 수정 시작
  const startEdit = (session: WorkSession) => {
    setEditingSession(session);
    setEditForm({
      cquickCount: String(session.platforms.cquick.count),
      cquickAmount: String(session.platforms.cquick.amount),
      baeminCount: String(session.platforms.baemin.count),
      baeminAmount: String(session.platforms.baemin.amount),
      distanceKm: String(session.distanceKmInput),
      memo: session.memo,
    });
  };

  // 수정 저장
  const saveEdit = () => {
    if (!editingSession?.id || !onUpdateSession) return;
    onUpdateSession(editingSession.id, {
      platforms: {
        cquick: {
          count: parseFormattedNumber(editForm.cquickCount),
          amount: parseFormattedNumber(editForm.cquickAmount),
        },
        baemin: {
          count: parseFormattedNumber(editForm.baeminCount),
          amount: parseFormattedNumber(editForm.baeminAmount),
        },
      },
      distanceKmInput: parseFloat(editForm.distanceKm) || 0,
      memo: editForm.memo,
      updatedAt: Date.now(),
    });
    setEditingSession(null);
  };

  // 삭제
  const handleDelete = (sessionId: string) => {
    if (!onDeleteSession) return;
    setDeleteTargetId(sessionId);
  };

  const confirmDelete = () => {
    if (deleteTargetId && onDeleteSession) {
      onDeleteSession(deleteTargetId);
    }
    setDeleteTargetId(null);
  };

  return (
    <div className="px-4 pb-24">
      {/* 월 선택 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            const [y, m] = selectedMonth.split('-').map(Number);
            const d = new Date(y, m - 2, 1);
            setSelectedMonth(
              `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            );
          }}
          className="text-gray-400 px-2 py-1"
        >
          ◀
        </button>
        <h2 className="text-lg font-bold text-gray-800">{selectedMonth}</h2>
        <button
          onClick={() => {
            const [y, m] = selectedMonth.split('-').map(Number);
            const d = new Date(y, m, 1);
            setSelectedMonth(
              `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            );
          }}
          className="text-gray-400 px-2 py-1"
        >
          ▶
        </button>
      </div>

      {/* ===== 레이어1: 달력 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4">
        <div className="grid grid-cols-7 mb-2">
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className={`text-center text-xs font-medium py-1 ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null)
              return <div key={`empty-${i}`} className="aspect-square" />;

            const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
            const data = dayDataMap.get(dateStr);

            return (
              <div
                key={dateStr}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs ${
                  data
                    ? data.achieved
                      ? 'bg-gradient-to-b from-yellow-100 to-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-600'
                    : 'text-gray-300'
                }`}
              >
                <span className="font-medium">{day}</span>
                {data && (
                  <>
                    <span className="text-[9px] leading-tight">
                      {data.earnings.toLocaleString()}원
                    </span>
                    <span className="text-[8px] leading-tight">
                      {data.count}건
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== 레이어2: 간단 내역 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <h3 className="font-bold text-gray-800 mb-3">월간 요약</h3>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400">월 수익</div>
            <div className="text-lg font-bold text-blue-600">
              {stats.totalEarnings.toLocaleString()}원
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400">근무일</div>
            <div className="text-lg font-bold text-gray-800">
              {stats.totalSessions}일
            </div>
            <div className="text-[10px] text-gray-400">
              {formatDuration(stats.totalDurationMin)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400">목표 달성</div>
            <div className="text-lg font-bold text-green-600">
              {achievedDays}일
            </div>
          </div>
        </div>

        {/* 목표 진행 */}
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>월간 목표</span>
          <span>
            {stats.totalEarnings.toLocaleString()}원 /{' '}
            {settings.goals.monthly.toLocaleString()}원
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`rounded-full h-3 transition-all ${
              monthlyGoalAchieved ? 'bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse' : 'bg-blue-500'
            }`}
            style={{
              width: `${Math.min(
                100,
                (stats.totalEarnings / settings.goals.monthly) * 100
              )}%`,
            }}
          />
        </div>

        {/* 월간 목표 달성 시 스타일리시한 COMPLETE */}
        {monthlyGoalAchieved && (
          <div className="text-center mt-3">
            <span className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold px-4 py-1.5 rounded-full animate-bounce shadow-lg">
              🎉 월간 목표 COMPLETE! 🎉
            </span>
          </div>
        )}
      </div>

      {/* ===== 레이어3: 월간 상세내역 (수정/삭제 포함) ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-gray-800 mb-3">월간 상세 기록</h3>

        {monthSessions.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">
            이번 달 기록이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              // 날짜별로 그룹핑
              const dateGroups = new Map<string, WorkSession[]>();
              for (const s of monthSessions) {
                const existing = dateGroups.get(s.workDateKst) || [];
                existing.push(s);
                dateGroups.set(s.workDateKst, existing);
              }
              // 날짜 내림차순 정렬
              const sortedDates = Array.from(dateGroups.keys()).sort().reverse();

              return sortedDates.map((dateKst) => {
                const daySessions = dateGroups.get(dateKst)!;
                // 오전/오후 순서로 정렬
                const sorted = [...daySessions].sort((a, b) =>
                  a.shiftType === 'morning' ? -1 : 1
                );
                const dailyTotal = dailyTotalEarnings(monthSessions, dateKst);
                const dailyGoalAchieved = dailyTotal >= settings.goals.daily;

                return (
                  <div key={dateKst} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    {/* 날짜 헤더 */}
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

                    {/* 오전/오후 각각 표시 */}
                    {sorted.map((session) => {
                      const earnings = sessionEarnings(session, sessions);
                      const count = sessionTotalCount(session, sessions);
                      const hr = hourlyRate(earnings, session.durationMin);
                      const avg = avgPerOrder(earnings, count);
                      const epk = earningsPerKm(earnings, session.distanceKmInput);
                      const isMorning = session.shiftType === 'morning';
                      const sessionKey = session.id || `${session.workDateKst}-${session.shiftType}-${session.startAt}`;

                      // 오전이면 입력값 그대로, 오후면 오전값을 빼서 추가분 계산
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

                      // 플랫폼별 건당 금액
                      const cquickAvg = cquickCount > 0 ? Math.round(cquickAmount / cquickCount) : 0;
                      const baeminAvg = baeminCount > 0 ? Math.round(baeminAmount / baeminCount) : 0;

                      return (
                        <div
                          key={sessionKey}
                          className="ml-2 pl-3 border-l-2 border-gray-100 py-2"
                        >
                          {/* 오전/오후 + 금액 + 건수/시간/거리 (같은 줄) */}
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
                              <button
                                onClick={() => startEdit(session)}
                                className="text-blue-400 text-xs ml-1"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => {
                                  const id = session.id || sessionKey;
                                  handleDelete(id);
                                }}
                                className="text-red-400 text-xs"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          {/* 건당 | 시급 | km당 */}
                          <div className="grid grid-cols-3 gap-1 text-xs text-gray-400 mb-1">
                            <span>건당 {avg.toLocaleString()}원</span>
                            <span>시급 {hr.toLocaleString()}원</span>
                            <span>km당 {epk.toLocaleString()}원</span>
                          </div>

                          {/* 플랫폼별 상세 (색상 구분) */}
                          <div className="space-y-0.5">
                            {cquickCount > 0 && (
                              <div className="text-xs text-blue-600 font-medium">
                                🚀 카카오퀵: {cquickCount}건 {cquickAmount.toLocaleString()}원 (건당 {cquickAvg.toLocaleString()}원)
                              </div>
                            )}
                            {baeminCount > 0 && (
                              <div className="text-xs text-emerald-600 font-medium">
                                🛵 배민: {baeminCount}건 {baeminAmount.toLocaleString()}원 (건당 {baeminAvg.toLocaleString()}원)
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

      {/* 삭제 확인 알림 */}
      <AlertModal
        isOpen={deleteTargetId !== null}
        title="기록 삭제"
        message="정말 삭제하시겠어요?\n삭제된 데이터는 복구할 수 없습니다."
        type="warning"
        confirmText="삭제"
        cancelText="취소"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* 수정 모달 */}
      {editingSession && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">기록 수정</h2>
              <button
                onClick={() => setEditingSession(null)}
                className="text-gray-400 text-xl leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="mb-3 text-xs text-gray-400">
              {editingSession.workDateKst}{' '}
              {editingSession.shiftType === 'morning' ? '오전' : '오후'}
            </div>

            {/* 카카오퀵 */}
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                카카오퀵
              </h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-400">건수</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editForm.cquickCount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, cquickCount: formatInputNumber(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400">금액</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editForm.cquickAmount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, cquickAmount: formatInputNumber(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 배민 */}
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">배민</h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-400">건수</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editForm.baeminCount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, baeminCount: formatInputNumber(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400">금액</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editForm.baeminAmount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, baeminAmount: formatInputNumber(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 거리 */}
            <div className="mb-3">
              <label className="text-sm font-semibold text-gray-600 mb-1 block">
                이동거리 (km)
              </label>
              <input
                type="number"
                value={editForm.distanceKm}
                onChange={(e) =>
                  setEditForm({ ...editForm, distanceKm: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* 메모 */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-600 mb-1 block">
                메모
              </label>
              <textarea
                value={editForm.memo}
                onChange={(e) =>
                  setEditForm({ ...editForm, memo: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                rows={2}
              />
            </div>

            <button
              onClick={saveEdit}
              className="w-full bg-blue-600 text-white rounded-lg py-3 font-bold text-sm"
            >
              수정 저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
