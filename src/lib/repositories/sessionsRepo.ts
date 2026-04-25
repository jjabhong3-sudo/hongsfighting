// ============================================================
// 세션 CRUD (Firebase Realtime Database)
// ============================================================

import { ref, push, update, remove, get, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import { getRealtimeDb } from '@/lib/firebase/client';
import { WorkSession } from '@/types/domain';

const ROOT_PATH = 'sessions';

/**
 * Realtime Database 데이터 → WorkSession 변환
 */
function rtdbToSession(id: string, data: Record<string, unknown>): WorkSession {
  return {
    id,
    startAt: (data.startAt as number) ?? 0,
    endAt: (data.endAt as number) ?? null,
    workDateKst: (data.workDateKst as string) ?? '',
    shiftType: (data.shiftType as 'morning' | 'afternoon') ?? 'morning',
    durationMin: (data.durationMin as number) ?? 0,
    distanceKmInput: (data.distanceKmInput as number) ?? 0,
    platforms: (data.platforms as WorkSession['platforms']) ?? {
      cquick: { count: 0, amount: 0 },
      baemin: { count: 0, amount: 0 },
    },
    memo: (data.memo as string) ?? '',
    createdAt: (data.createdAt as number) ?? 0,
    updatedAt: (data.updatedAt as number) ?? 0,
  };
}

/**
 * 모든 세션 조회
 */
export async function getAllSessions(): Promise<WorkSession[]> {
  const db = getRealtimeDb();
  const snap = await get(ref(db, ROOT_PATH));
  if (!snap.exists()) return [];
  const data = snap.val() as Record<string, Record<string, unknown>>;
  return Object.entries(data).map(([id, val]) => rtdbToSession(id, val));
}

/**
 * 특정 날짜의 세션 조회
 */
export async function getSessionsByDate(dateKst: string): Promise<WorkSession[]> {
  const all = await getAllSessions();
  return all.filter((s) => s.workDateKst === dateKst).sort((a, b) => a.startAt - b.startAt);
}

/**
 * 특정 월의 세션 조회
 */
export async function getSessionsByMonth(yearMonth: string): Promise<WorkSession[]> {
  const all = await getAllSessions();
  return all.filter((s) => s.workDateKst.startsWith(yearMonth)).sort((a, b) => b.startAt - a.startAt);
}

/**
 * 특정 주의 세션 조회
 */
export async function getSessionsByWeek(weekStart: string, weekEnd: string): Promise<WorkSession[]> {
  const all = await getAllSessions();
  return all
    .filter((s) => s.workDateKst >= weekStart && s.workDateKst <= weekEnd)
    .sort((a, b) => b.startAt - a.startAt);
}

/**
 * 진행 중인 세션 조회 (endAt이 null)
 */
export async function getActiveSession(): Promise<WorkSession | null> {
  const all = await getAllSessions();
  const active = all.filter((s) => s.endAt === null).sort((a, b) => b.startAt - a.startAt);
  return active.length > 0 ? active[0] : null;
}

/**
 * 단일 세션 조회
 */
export async function getSession(sessionId: string): Promise<WorkSession | null> {
  const db = getRealtimeDb();
  const snap = await get(ref(db, `${ROOT_PATH}/${sessionId}`));
  if (!snap.exists()) return null;
  return rtdbToSession(sessionId, snap.val());
}

/**
 * 새 세션 추가
 */
export async function addSession(session: WorkSession): Promise<string> {
  const db = getRealtimeDb();
  const newRef = push(ref(db, ROOT_PATH));
  const data: Record<string, unknown> = { ...session };
  delete data.id;
  await update(newRef, data);
  return newRef.key!;
}

/**
 * 세션 업데이트
 */
export async function updateSession(sessionId: string, data: Partial<WorkSession>): Promise<void> {
  const db = getRealtimeDb();
  const updateData: Record<string, unknown> = { ...data };
  delete updateData.id;
  await update(ref(db, `${ROOT_PATH}/${sessionId}`), updateData);
}

/**
 * 세션 삭제
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const db = getRealtimeDb();
  await remove(ref(db, `${ROOT_PATH}/${sessionId}`));
}

/**
 * 실시간 구독: 모든 세션 변경 감지
 */
export function subscribeSessions(callback: (sessions: WorkSession[]) => void): () => void {
  const db = getRealtimeDb();
  const sessionsRef = ref(db, ROOT_PATH);
  const handler = (snap: import('firebase/database').DataSnapshot) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }
    const data = snap.val() as Record<string, Record<string, unknown>>;
    const sessions = Object.entries(data).map(([id, val]) => rtdbToSession(id, val));
    callback(sessions);
  };
  onValue(sessionsRef, handler);
  return () => off(sessionsRef, 'value', handler);
}
