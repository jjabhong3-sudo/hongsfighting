// ============================================================
// 퇴근 모달 - 플랫폼별 건수/금액 + 메모 + 이동거리 입력
// 인앱 팝업, 위로 문구, 목표 달성/미달성 메시지
// ============================================================

'use client';

import React, { useState, useMemo } from 'react';
import { Platforms } from '@/types/domain';
import { formatInputNumber, parseFormattedNumber } from '@/lib/utils/format';
import AlertModal from '@/components/ui/AlertModal';

/** 목표시간 달성 시 위로/격려 문구 */
const ENCOURAGE_MESSAGES = [
  '고생했어!',
  '힘들었지? 수고했어!',
  '오늘도 수고 많았어!',
  '잘했어! 오늘도 최고야!',
  '대단해! 오늘 하루도 화이팅!',
  '수고했어, 내일도 힘내자!',
  '오늘 하루도 고생 많았어요!',
  '잘 쉬고 내일 또 달려보자!',
  '오늘의 너, 정말 멋졌어!',
  '한 걸음 더 가까워졌어! 계속 가보자!',
];

/** 목표시간 미달 시 더 일하게 유도하는 문구 */
const NOT_ENOUGH_MESSAGES = [
  '왜?? 벌써 퇴근할라고??',
  '어짜피 집에가서 할거 없다!',
  '한 건만 더! 딱 한 건만!',
  '지금 가면 오늘 뭐한거야?',
  '목표 시간 아직 안 됐어! 조금만 더!',
  '집에 가서 뭐하게? 여기서 더 벌자!',
  '아직 안 끝났어! 달려달려!',
  '쉬는 것도 좋지만 돈도 좋잖아?',
  '지금 가면 후회한다! 한 시간만 더!',
  '오늘 조금만 더 하면 내일 덜 힘들다!',
];

function getRandomMessage(achieved: boolean): string {
  const list = achieved ? ENCOURAGE_MESSAGES : NOT_ENOUGH_MESSAGES;
  return list[Math.floor(Math.random() * list.length)];
}

interface ShiftEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    platforms: Platforms;
    distanceKmInput: number;
    memo: string;
    durationMin?: number;
  }) => void;
  dailyGoal: number;
  durationMin: number;
  targetAchieved: boolean;
}

export default function ShiftEndModal({
  isOpen,
  onClose,
  onSubmit,
  dailyGoal,
  durationMin,
  targetAchieved,
}: ShiftEndModalProps) {
  const [cquickCount, setCquickCount] = useState('');
  const [cquickAmount, setCquickAmount] = useState('');
  const [baeminCount, setBaeminCount] = useState('');
  const [baeminAmount, setBaeminAmount] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [manualDurationMin, setManualDurationMin] = useState('');
  const [useManualDuration, setUseManualDuration] = useState(false);

  // 인앱 알림 상태
  const [alertState, setAlertState] = useState<{
    title: string;
    message: string;
    type: 'warning' | 'success' | 'info';
    onConfirm: () => void;
  } | null>(null);

  const encourageMsg = useMemo(() => getRandomMessage(targetAchieved), [isOpen, targetAchieved]);

  if (!isOpen) return null;

  const totalAmount =
    parseFormattedNumber(cquickAmount) + parseFormattedNumber(baeminAmount);
  const totalCount =
    parseFormattedNumber(cquickCount) + parseFormattedNumber(baeminCount);
  const avgPerOrderVal = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
  const remainingForGoal = Math.max(0, dailyGoal - totalAmount);
  const goalAchieved = totalAmount >= dailyGoal;

  const neededOrders =
    avgPerOrderVal > 0 ? Math.ceil(remainingForGoal / avgPerOrderVal) : 0;

  const doSubmit = () => {
    const dist = parseFloat(distanceKm);
    const manualMin = parseInt(manualDurationMin, 10);
    onSubmit({
      platforms: {
        cquick: {
          count: parseFormattedNumber(cquickCount),
          amount: parseFormattedNumber(cquickAmount),
        },
        baemin: {
          count: parseFormattedNumber(baeminCount),
          amount: parseFormattedNumber(baeminAmount),
        },
      },
      distanceKmInput: dist,
      memo,
      durationMin: useManualDuration && !isNaN(manualMin) && manualMin > 0 ? manualMin : undefined,
    });
  };

  const handleSubmitClick = () => {
    setError('');

    const dist = parseFloat(distanceKm);
    if (isNaN(dist) || dist <= 0) {
      setError('이동거리를 입력해주세요.');
      return;
    }

    // 수익 0원 확인
    if (totalAmount === 0) {
      setAlertState({
        title: '수익 0원',
        message: '수익이 0원입니다.\n그래도 퇴근하시겠어요?',
        type: 'warning',
        onConfirm: doSubmit,
      });
      return;
    }

    // 목표 미달 시 확인
    if (!goalAchieved && totalAmount > 0) {
      const msg =
        neededOrders > 0
          ? `목표까지 ${remainingForGoal.toLocaleString()}원 남았어요.\n(평균 ${avgPerOrderVal.toLocaleString()}원 × ${neededOrders}건)\n정말 퇴근하시겠어요?`
          : `목표까지 ${remainingForGoal.toLocaleString()}원 남았어요.\n정말 퇴근하시겠어요?`;
      setAlertState({
        title: '목표 미달',
        message: msg,
        type: 'warning',
        onConfirm: doSubmit,
      });
      return;
    }

    doSubmit();
  };

  const formatMin = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h}시간 ${min}분`;
  };

  return (
    <>
      {/* 배경 오버레이 (fade in) */}
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 animate-fadeIn">
        {/* 모달 본체 (slide up) */}
        <div className="bg-[#faf3e0] w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-4 max-h-[90vh] overflow-y-auto animate-slideUp border border-[#e8dcc8]">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-[#0f172a]">퇴근 기록</h2>
            <button
              onClick={onClose}
              className="text-[#64748b] text-xl leading-none p-1"
            >
              ✕
            </button>
          </div>

          {/* 위로 문구 */}
          <div className="text-center text-xl font-bold text-[#06b6d4] mb-3">
            {encourageMsg}
          </div>

          {/* 근무 시간 (수동 입력 가능) */}
          <div className="bg-[#0f172a] rounded-lg p-2 mb-3 border border-[#334155]">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-[#64748b]">오늘 근무 시간</div>
              <label className="flex items-center gap-1 text-sm text-[#64748b]">
                <input
                  type="checkbox"
                  checked={useManualDuration}
                  onChange={(e) => setUseManualDuration(e.target.checked)}
                  className="w-3 h-3"
                />
                수동 입력
              </label>
            </div>
            {useManualDuration ? (
              <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={manualDurationMin}
                  onChange={(e) => setManualDurationMin(e.target.value)}
                  className="w-24 text-center bg-[#0f172a] border border-[#06b6d4] rounded-lg px-3 py-2 text-xl font-bold text-[#06b6d4]"
                  placeholder={String(durationMin)}
                />
                <span className="text-sm text-[#64748b]">분</span>
              </div>
            ) : (
              <div className="text-3xl font-bold text-[#06b6d4] text-center">
                {formatMin(durationMin)}
              </div>
            )}
          </div>

          {/* 카카오퀵 */}
          <div className="mb-3">
            <h3 className="text-base font-semibold text-[#94a3b8] mb-1">카카오퀵</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm text-[#64748b]">건수</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cquickCount}
                  onChange={(e) => setCquickCount(formatInputNumber(e.target.value))}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-base text-[#f1f5f9]"
                  placeholder="0"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-[#64748b]">금액</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cquickAmount}
                  onChange={(e) => setCquickAmount(formatInputNumber(e.target.value))}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-base text-[#f1f5f9]"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* 배민 */}
          <div className="mb-3">
            <h3 className="text-base font-semibold text-[#94a3b8] mb-1">배민</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm text-[#64748b]">건수</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={baeminCount}
                  onChange={(e) => setBaeminCount(formatInputNumber(e.target.value))}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-base text-[#f1f5f9]"
                  placeholder="0"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-[#64748b]">금액</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={baeminAmount}
                  onChange={(e) => setBaeminAmount(formatInputNumber(e.target.value))}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-base text-[#f1f5f9]"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* 이동거리 */}
          <div className="mb-3">
            <label className="text-base font-semibold text-[#94a3b8] mb-1 block">
              이동거리 (km)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-base text-[#f1f5f9]"
              placeholder="전기자전거 계기판 거리 입력"
            />
          </div>

          {/* 메모 */}
          <div className="mb-3">
            <label className="text-base font-semibold text-[#94a3b8] mb-1 block">
              메모
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-base text-[#f1f5f9] resize-none"
              rows={2}
              placeholder="오늘 하루는 어땠나요? (선택)"
            />
          </div>

          {/* 요약 */}
          <div className="bg-[#0f172a] rounded-lg p-2 mb-3 text-base border border-[#334155]">
            <div className="flex justify-between mb-1">
              <span className="text-[#64748b]">총 수익</span>
              <span className="font-bold text-[#f1f5f9]">{totalAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-[#64748b]">총 건수</span>
              <span className="font-bold text-[#f1f5f9]">{totalCount}건</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-[#64748b]">건당 평균</span>
              <span className="font-bold text-[#f1f5f9]">{avgPerOrderVal.toLocaleString()}원</span>
            </div>

            {goalAchieved && (
              <div className="text-center text-[#10b981] font-bold mt-1 py-1.5 bg-[#064e3b] rounded-lg border border-[#10b981]/30">
                목표 달성! 오늘도 최고였어요!
              </div>
            )}

            {!goalAchieved && totalAmount > 0 && (
              <div className="mt-1 pt-1 border-t border-[#334155]">
                <div className="flex justify-between text-[#f59e0b] mb-1">
                  <span>목표까지</span>
                  <span className="font-bold">
                    {remainingForGoal.toLocaleString()}원
                  </span>
                </div>
                {neededOrders > 0 && (
                  <div className="text-sm text-[#64748b] text-center mt-1">
                    평균 {avgPerOrderVal.toLocaleString()}원 기준 {neededOrders}건 더
                    배달하면 목표 달성!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 에러 */}
          {error && (
            <div className="text-[#ef4444] text-base mb-2 text-center">{error}</div>
          )}

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmitClick}
            className="w-full gradient-bar-blue text-white rounded-lg py-3 font-bold text-base"
          >
            저장하기
          </button>
        </div>
      </div>

      {/* 인앱 알림 */}
      {alertState && (
        <AlertModal
          isOpen={true}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          onConfirm={() => {
            alertState.onConfirm();
            setAlertState(null);
          }}
          onCancel={() => setAlertState(null)}
        />
      )}
    </>
  );
}
