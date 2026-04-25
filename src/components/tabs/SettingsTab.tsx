// ============================================================
// 설정 탭 - 목표 금액, 부채 목록, 전체 누적 통계
// ============================================================

'use client';

import React, { useState, useMemo } from 'react';
import { AppSettings, Debt, DEFAULT_SETTINGS } from '@/types/domain';
import { formatDuration } from '@/lib/time/kst';
import {
  sessionEarnings,
  sessionTotalCount,
  calculateStreak,
} from '@/lib/stats/earnings';
import { WorkSession } from '@/types/domain';
import { formatInputNumber, parseFormattedNumber } from '@/lib/utils/format';
import AlertModal from '@/components/ui/AlertModal';

interface SettingsTabProps {
  settings: AppSettings;
  sessions: WorkSession[];
  onSaveSettings: (settings: AppSettings) => void;
  onResetSessions?: () => void;
}

export default function SettingsTab({
  settings,
  sessions,
  onSaveSettings,
  onResetSessions,
}: SettingsTabProps) {
  const [dailyGoal, setDailyGoal] = useState(
    settings.goals.daily.toLocaleString('ko-KR')
  );
  const [weeklyGoal, setWeeklyGoal] = useState(
    settings.goals.weekly.toLocaleString('ko-KR')
  );
  const [monthlyGoal, setMonthlyGoal] = useState(
    settings.goals.monthly.toLocaleString('ko-KR')
  );
  const [debts, setDebts] = useState<Debt[]>(settings.debts);
  const [saved, setSaved] = useState(false);
  const [showResetAlert, setShowResetAlert] = useState(false);

  // 변경 감지
  const hasChanges = useMemo(() => {
    const currentDaily = parseFormattedNumber(dailyGoal);
    const currentWeekly = parseFormattedNumber(weeklyGoal);
    const currentMonthly = parseFormattedNumber(monthlyGoal);
    const goalsChanged =
      currentDaily !== settings.goals.daily ||
      currentWeekly !== settings.goals.weekly ||
      currentMonthly !== settings.goals.monthly;
    const debtsChanged =
      JSON.stringify(debts) !== JSON.stringify(settings.debts);
    return goalsChanged || debtsChanged;
  }, [dailyGoal, weeklyGoal, monthlyGoal, debts, settings]);

  // 전체 통계
  const totalEarnings = sessions.reduce(
    (sum, s) => sum + sessionEarnings(s, sessions),
    0
  );
  const totalCount = sessions.reduce(
    (sum, s) => sum + sessionTotalCount(s, sessions),
    0
  );
  const totalDurationMin = sessions.reduce(
    (sum, s) => sum + s.durationMin,
    0
  );
  const totalDistance = sessions.reduce(
    (sum, s) => sum + (s.distanceKmInput || 0),
    0
  );
  const streak = calculateStreak(sessions);

  // 플랫폼별 통계
  const cquickTotal = sessions.reduce(
    (sum, s) => sum + s.platforms.cquick.amount,
    0
  );
  const cquickCount = sessions.reduce(
    (sum, s) => sum + s.platforms.cquick.count,
    0
  );
  const baeminTotal = sessions.reduce(
    (sum, s) => sum + s.platforms.baemin.amount,
    0
  );
  const baeminCount = sessions.reduce(
    (sum, s) => sum + s.platforms.baemin.count,
    0
  );

  const handleSave = () => {
    const newSettings: AppSettings = {
      goals: {
        daily: parseFormattedNumber(dailyGoal),
        weekly: parseFormattedNumber(weeklyGoal),
        monthly: parseFormattedNumber(monthlyGoal),
      },
      debts,
      updatedAt: Date.now(),
    };
    onSaveSettings(newSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addDebt = () => {
    setDebts([...debts, { name: '', amount: 0, order: debts.length }]);
  };

  const updateDebt = (index: number, field: keyof Debt, value: string) => {
    const updated = [...debts];
    if (field === 'name') {
      updated[index] = { ...updated[index], name: value };
    } else if (field === 'amount') {
      updated[index] = {
        ...updated[index],
        amount: parseFormattedNumber(value),
      };
    }
    setDebts(updated);
  };

  const removeDebt = (index: number) => {
    setDebts(debts.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    if (onResetSessions) {
      onResetSessions();
    }
    setShowResetAlert(false);
  };

  return (
    <div className="px-4 pb-24">
      {/* ===== 레이어1: 금액 목표 설정 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <h3 className="font-bold text-gray-800 mb-3">금액 목표 설정</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              일일 목표 금액
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(formatInputNumber(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="50,000"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              주간 목표 금액
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(formatInputNumber(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="300,000"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              월간 목표 금액
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(formatInputNumber(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="1,200,000"
            />
          </div>
        </div>
      </div>

      {/* ===== 레이어2: 부채 목록 설정 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">부채 목록</h3>
          <button
            onClick={addDebt}
            className="text-blue-500 text-sm font-medium"
          >
            + 추가
          </button>
        </div>

        {debts.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">
            부채를 추가해주세요.
          </div>
        ) : (
          <div className="space-y-2">
            {debts.map((debt, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={debt.name}
                  onChange={(e) => updateDebt(index, 'name', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="부채명"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={debt.amount > 0 ? debt.amount.toLocaleString('ko-KR') : ''}
                  onChange={(e) =>
                    updateDebt(index, 'amount', e.target.value)
                  }
                  className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm text-right"
                  placeholder="금액"
                />
                <button
                  onClick={() => removeDebt(index)}
                  className="text-red-400 text-sm px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== 저장 버튼 (변경 감지) ===== */}
      <button
        onClick={handleSave}
        disabled={!hasChanges}
        className={`w-full rounded-lg py-3 font-bold text-sm transition-colors mb-4 ${
          saved
            ? 'bg-green-500 text-white'
            : hasChanges
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {saved ? '저장 완료!' : hasChanges ? '설정 저장' : '변경사항 없음'}
      </button>

      {/* ===== 레이어3: 전체 기록 ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">전체 기록</h3>
          {sessions.length > 0 && (
            <button
              onClick={() => setShowResetAlert(true)}
              className="text-red-400 text-xs font-medium"
            >
              기록 초기화
            </button>
          )}
        </div>

        <div className="space-y-3">
          {/* 근무일 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">총 근무일</div>
            <div className="text-lg font-bold text-gray-800">
              {sessions.length}일
            </div>
            <div className="text-[10px] text-gray-400">
              {formatDuration(totalDurationMin)}
            </div>
          </div>

          {/* 연속 출근 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">최대 연속 출근</div>
            <div className="text-lg font-bold text-orange-500">
              {streak}일째
            </div>
          </div>

          {/* 누적 건수 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">누적 건수</div>
            <div className="text-lg font-bold text-gray-800">
              {totalCount}건
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="text-[10px] text-gray-400">
                카카오퀵: {cquickCount}건
              </div>
              <div className="text-[10px] text-gray-400">
                배민: {baeminCount}건
              </div>
            </div>
          </div>

          {/* 누적 수익 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">누적 수익</div>
            <div className="text-lg font-bold text-blue-600">
              {totalEarnings.toLocaleString()}원
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="text-[10px] text-gray-400">
                카카오퀵: {cquickTotal.toLocaleString()}원
              </div>
              <div className="text-[10px] text-gray-400">
                배민: {baeminTotal.toLocaleString()}원
              </div>
            </div>
          </div>

          {/* 누적 이동거리 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">누적 이동거리</div>
            <div className="text-lg font-bold text-gray-800">
              {totalDistance.toLocaleString()}km
            </div>
          </div>
        </div>
      </div>

      {/* 기록 초기화 확인 알림 */}
      <AlertModal
        isOpen={showResetAlert}
        title="기록 초기화"
        message="모든 기록이 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.\n정말 초기화하시겠어요?"
        type="warning"
        confirmText="초기화"
        cancelText="취소"
        onConfirm={handleReset}
        onCancel={() => setShowResetAlert(false)}
      />
    </div>
  );
}
