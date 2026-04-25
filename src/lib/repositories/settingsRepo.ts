// ============================================================
// 설정 CRUD (Firebase Realtime Database)
// ============================================================

import { ref, get, set, update } from 'firebase/database';
import { getRealtimeDb } from '@/lib/firebase/client';
import { AppSettings, DEFAULT_SETTINGS } from '@/types/domain';

const ROOT_PATH = 'settings/default';

/**
 * Realtime Database 데이터 → AppSettings 변환
 */
function rtdbToSettings(data: Record<string, unknown>): AppSettings {
  return {
    goals: (data.goals as AppSettings['goals']) ?? DEFAULT_SETTINGS.goals,
    debts: (data.debts as AppSettings['debts']) ?? DEFAULT_SETTINGS.debts,
    updatedAt: (data.updatedAt as number) ?? Date.now(),
  };
}

/**
 * 설정 조회 (없으면 기본값 반환)
 */
export async function getSettings(): Promise<AppSettings> {
  const db = getRealtimeDb();
  const snap = await get(ref(db, ROOT_PATH));
  if (!snap.exists()) {
    return { ...DEFAULT_SETTINGS };
  }
  return rtdbToSettings(snap.val());
}

/**
 * 설정 저장 (덮어쓰기)
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = getRealtimeDb();
  await set(ref(db, ROOT_PATH), settings);
}

/**
 * 목표 금액 업데이트
 */
export async function updateGoals(goals: AppSettings['goals']): Promise<void> {
  const db = getRealtimeDb();
  await update(ref(db, ROOT_PATH), { goals, updatedAt: Date.now() });
}

/**
 * 부채 목록 업데이트
 */
export async function updateDebts(debts: AppSettings['debts']): Promise<void> {
  const db = getRealtimeDb();
  await update(ref(db, ROOT_PATH), { debts, updatedAt: Date.now() });
}
