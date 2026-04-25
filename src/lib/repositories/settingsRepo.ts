// ============================================================
// 설정 CRUD (Firestore)
// ============================================================

import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { AppSettings, DEFAULT_SETTINGS } from '@/types/domain';

const DOC_PATH = 'settings/default';

/**
 * Firestore 문서 → AppSettings 변환
 */
function docToSettings(data: DocumentData): AppSettings {
  return {
    goals: data.goals ?? DEFAULT_SETTINGS.goals,
    debts: data.debts ?? DEFAULT_SETTINGS.debts,
    updatedAt: data.updatedAt?.toMillis?.() ?? data.updatedAt ?? Date.now(),
  };
}

/**
 * AppSettings → Firestore 저장용 데이터 변환
 */
function settingsToDoc(settings: AppSettings): DocumentData {
  return {
    goals: settings.goals,
    debts: settings.debts,
    updatedAt: Timestamp.fromMillis(settings.updatedAt),
  };
}

/**
 * 설정 조회 (없으면 기본값 반환)
 */
export async function getSettings(): Promise<AppSettings> {
  const db = getFirestoreDb();
  const snap = await getDoc(doc(db, DOC_PATH));
  if (!snap.exists()) {
    return { ...DEFAULT_SETTINGS };
  }
  return docToSettings(snap.data());
}

/**
 * 설정 저장 (덮어쓰기)
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = getFirestoreDb();
  await setDoc(doc(db, DOC_PATH), settingsToDoc(settings));
}

/**
 * 목표 금액 업데이트
 */
export async function updateGoals(goals: AppSettings['goals']): Promise<void> {
  const settings = await getSettings();
  settings.goals = goals;
  settings.updatedAt = Date.now();
  await saveSettings(settings);
}

/**
 * 부채 목록 업데이트
 */
export async function updateDebts(debts: AppSettings['debts']): Promise<void> {
  const settings = await getSettings();
  settings.debts = debts;
  settings.updatedAt = Date.now();
  await saveSettings(settings);
}
