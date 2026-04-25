// ============================================================
// 세션 CRUD (Firestore)
// ============================================================

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { WorkSession } from '@/types/domain';

const COLLECTION = 'sessions';

/**
 * Firestore 문서 → WorkSession 변환
 */
function docToSession(id: string, data: DocumentData): WorkSession {
  return {
    id,
    startAt: data.startAt?.toMillis?.() ?? data.startAt ?? 0,
    endAt: data.endAt?.toMillis?.() ?? data.endAt ?? null,
    workDateKst: data.workDateKst ?? '',
    shiftType: data.shiftType ?? 'morning',
    durationMin: data.durationMin ?? 0,
    distanceKmInput: data.distanceKmInput ?? 0,
    platforms: data.platforms ?? { cquick: { count: 0, amount: 0 }, baemin: { count: 0, amount: 0 } },
    memo: data.memo ?? '',
    createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? 0,
    updatedAt: data.updatedAt?.toMillis?.() ?? data.updatedAt ?? 0,
  };
}

/**
 * WorkSession → Firestore 저장용 데이터 변환
 */
function sessionToDoc(session: Partial<WorkSession>): DocumentData {
  const doc: DocumentData = { ...session };
  if (doc.startAt && typeof doc.startAt === 'number') {
    doc.startAt = Timestamp.fromMillis(doc.startAt);
  }
  if (doc.endAt && typeof doc.endAt === 'number') {
    doc.endAt = Timestamp.fromMillis(doc.endAt);
  }
  if (doc.createdAt && typeof doc.createdAt === 'number') {
    doc.createdAt = Timestamp.fromMillis(doc.createdAt);
  }
  if (doc.updatedAt && typeof doc.updatedAt === 'number') {
    doc.updatedAt = Timestamp.fromMillis(doc.updatedAt);
  }
  return doc;
}

/**
 * 새 세션 추가
 */
export async function addSession(session: WorkSession): Promise<string> {
  const db = getFirestoreDb();
  const docRef = await addDoc(collection(db, COLLECTION), sessionToDoc(session));
  return docRef.id;
}

/**
 * 세션 업데이트
 */
export async function updateSession(
  sessionId: string,
  data: Partial<WorkSession>
): Promise<void> {
  const db = getFirestoreDb();
  await updateDoc(doc(db, COLLECTION, sessionId), sessionToDoc(data));
}

/**
 * 세션 삭제
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, COLLECTION, sessionId));
}

/**
 * 단일 세션 조회
 */
export async function getSession(sessionId: string): Promise<WorkSession | null> {
  const db = getFirestoreDb();
  const snap = await getDoc(doc(db, COLLECTION, sessionId));
  if (!snap.exists()) return null;
  return docToSession(snap.id, snap.data());
}

/**
 * 모든 세션 조회 (최신순)
 */
export async function getAllSessions(): Promise<WorkSession[]> {
  const db = getFirestoreDb();
  const q = query(collection(db, COLLECTION), orderBy('startAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToSession(d.id, d.data()));
}

/**
 * 특정 날짜의 세션 조회
 */
export async function getSessionsByDate(dateKst: string): Promise<WorkSession[]> {
  const db = getFirestoreDb();
  const q = query(
    collection(db, COLLECTION),
    where('workDateKst', '==', dateKst),
    orderBy('startAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToSession(d.id, d.data()));
}

/**
 * 특정 월의 세션 조회
 */
export async function getSessionsByMonth(yearMonth: string): Promise<WorkSession[]> {
  const db = getFirestoreDb();
  const q = query(
    collection(db, COLLECTION),
    where('workDateKst', '>=', `${yearMonth}-01`),
    where('workDateKst', '<=', `${yearMonth}-31`),
    orderBy('startAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToSession(d.id, d.data()));
}

/**
 * 특정 주의 세션 조회
 */
export async function getSessionsByWeek(
  weekStart: string,
  weekEnd: string
): Promise<WorkSession[]> {
  const db = getFirestoreDb();
  const q = query(
    collection(db, COLLECTION),
    where('workDateKst', '>=', weekStart),
    where('workDateKst', '<=', weekEnd),
    orderBy('startAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToSession(d.id, d.data()));
}

/**
 * 진행 중인 세션 조회 (endAt이 null)
 */
export async function getActiveSession(): Promise<WorkSession | null> {
  const db = getFirestoreDb();
  const q = query(
    collection(db, COLLECTION),
    where('endAt', '==', null),
    orderBy('startAt', 'desc'),
    // limit 1
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return docToSession(snap.docs[0].id, snap.docs[0].data());
}
