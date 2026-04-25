// ============================================================
// 오전/오후 판정, 목표시간 로직
// ============================================================

import { ShiftType } from '@/types/domain';
import { getShiftType } from '@/lib/time/kst';

/** 오전 목표 시간(분) */
export const MORNING_TARGET_MIN = 240; // 4시간
/** 오후 목표 시간(분) */
export const AFTERNOON_TARGET_MIN = 360; // 6시간

/**
 * 현재 시각 기준 shiftType 반환
 */
export function getCurrentShift(): ShiftType {
  return getShiftType();
}

/**
 * shiftType에 따른 목표 시간(분) 반환
 */
export function getTargetMinutes(shiftType: ShiftType): number {
  return shiftType === 'morning' ? MORNING_TARGET_MIN : AFTERNOON_TARGET_MIN;
}

/**
 * shiftType 한글명
 */
export function getShiftLabel(shiftType: ShiftType): string {
  return shiftType === 'morning' ? '오전' : '오후';
}

/**
 * shiftType 영문 키
 */
export function getShiftKey(shiftType: ShiftType): string {
  return shiftType;
}

/**
 * 목표 시간 대비 진행률 (%)
 */
export function getProgressPercent(elapsedMin: number, shiftType: ShiftType): number {
  const target = getTargetMinutes(shiftType);
  return Math.min(100, Math.round((elapsedMin / target) * 100));
}

/**
 * 목표까지 남은 시간(분)
 * 음수면 목표 초과
 */
export function getRemainingMinutes(elapsedMin: number, shiftType: ShiftType): number {
  const target = getTargetMinutes(shiftType);
  return Math.max(0, target - elapsedMin);
}

/**
 * 목표 달성 여부
 */
export function isTargetAchieved(elapsedMin: number, shiftType: ShiftType): boolean {
  return elapsedMin >= getTargetMinutes(shiftType);
}
