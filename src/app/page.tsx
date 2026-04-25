// ============================================================
// 메인 진입 - 하단 탭 컨테이너 (스와이프 지원)
// ============================================================

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WorkSession, AppSettings, Platforms, DEFAULT_SETTINGS } from '@/types/domain';
import { todayKst, nowKst, diffMinutes } from '@/lib/time/kst';
import { getCurrentShift } from '@/lib/work/shift';
import { sessionEarnings, dailyTotalEarnings } from '@/lib/stats/earnings';
import { isFirebaseConfigured } from '@/lib/firebase/client';
import {
  getAllSessions,
  addSession,
  updateSession,
  deleteSession,
  getActiveSession,
} from '@/lib/repositories/sessionsRepo';
import { getSettings, saveSettings } from '@/lib/repositories/settingsRepo';
import BottomTabBar, { TabType } from '@/components/layout/BottomTabBar';
import MainTab from '@/components/tabs/MainTab';
import MonthlyTab from '@/components/tabs/MonthlyTab';
import SettingsTab from '@/components/tabs/SettingsTab';

const TAB_ORDER: TabType[] = ['main', 'monthly', 'settings'];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // 스와이프 제스처
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) < threshold) return;

    const currentIndex = TAB_ORDER.indexOf(activeTab);

    if (diff > 0) {
      // 왼쪽 스와이프 → 다음 탭
      if (currentIndex < TAB_ORDER.length - 1) {
        setActiveTab(TAB_ORDER[currentIndex + 1]);
      }
    } else {
      // 오른쪽 스와이프 → 이전 탭
      if (currentIndex > 0) {
        setActiveTab(TAB_ORDER[currentIndex - 1]);
      }
    }
  }, [activeTab]);

  // 초기 데이터 로드
  useEffect(() => {
    async function loadData() {
      // 1. 먼저 로컬 스토리지에서 데이터 복원 (즉시 표시)
      const savedSessions = localStorage.getItem('okapp_sessions');
      const savedSettings = localStorage.getItem('okapp_settings');
      const savedActive = localStorage.getItem('okapp_activeSession');
      if (savedSessions) {
        try { setSessions(JSON.parse(savedSessions)); } catch {}
      }
      if (savedSettings) {
        try { setSettings(JSON.parse(savedSettings)); } catch {}
      }
      if (savedActive && savedActive !== 'null') {
        try { setActiveSession(JSON.parse(savedActive)); } catch {}
      }

      // 2. Firebase 설정 확인
      if (!isFirebaseConfigured()) {
        console.warn('Firebase가 설정되지 않았습니다. 로컬 스토리지 모드로 동작합니다.');
        setLoading(false);
        return;
      }

      // 3. localStorage 데이터로 즉시 로딩 해제
      setLoading(false);

      // 4. Firebase에서 데이터 로드 시도 (백그라운드, 로딩 차단 없음)
      try {
        setFirebaseReady(true);
        const [loadedSessions, loadedSettings, active] = await Promise.all([
          getAllSessions(),
          getSettings(),
          getActiveSession(),
        ]);
        setSessions(loadedSessions);
        setSettings(loadedSettings);
        setActiveSession(active);
      } catch (err) {
        console.error('Firebase 데이터 로드 실패, 로컬 스토리지 데이터 유지:', err);
        setFirebaseReady(false);
      }
    }

    loadData();
  }, []);

  // 전체 누적 이동거리 계산
  const totalDistanceKm = sessions.reduce(
    (sum, s) => sum + (s.distanceKmInput || 0),
    0
  );

  // 출근
  const handleStartShift = useCallback(async () => {
    const now = Date.now();
    const today = todayKst();
    const shift = getCurrentShift();

    const newSession: WorkSession = {
      startAt: now,
      endAt: null,
      workDateKst: today,
      shiftType: shift,
      durationMin: 0,
      distanceKmInput: 0,
      platforms: {
        cquick: { count: 0, amount: 0 },
        baemin: { count: 0, amount: 0 },
      },
      memo: '',
      createdAt: now,
      updatedAt: now,
    };

    // 로컬 ID 생성 (Firebase 미연결 시에도 ID 필요)
    if (!newSession.id) {
      newSession.id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    try {
      if (firebaseReady) {
        const id = await addSession(newSession);
        newSession.id = id;
      }
      setActiveSession(newSession);
      if (!firebaseReady) localStorage.setItem('okapp_activeSession', JSON.stringify(newSession));
    } catch (err) {
      console.error('출근 기록 실패:', err);
      setActiveSession(newSession);
      if (!firebaseReady) localStorage.setItem('okapp_activeSession', JSON.stringify(newSession));
    }
  }, [firebaseReady]);

  // 퇴근
  const handleEndShift = useCallback(
    async (data: { platforms: Platforms; distanceKmInput: number; memo: string; durationMin?: number }) => {
      if (!activeSession) return;

      const now = Date.now();
      const durationMin = data.durationMin ?? diffMinutes(activeSession.startAt, now);

      // 오후 세션 저장 시 검증: 새 오후 raw 값이 기존 일일 합계보다 작으면 저장 차단
      if (activeSession.shiftType === 'afternoon') {
        const existingDailyTotal = dailyTotalEarnings(sessions, activeSession.workDateKst);
        const newAfternoonRaw = data.platforms.cquick.amount + data.platforms.baemin.amount;
        if (newAfternoonRaw < existingDailyTotal) {
          alert(`오후 입력값(${newAfternoonRaw.toLocaleString()}원)이 기존 일일 합계(${existingDailyTotal.toLocaleString()}원)보다 작아 저장할 수 없습니다.\n오후 입력값은 오전+추가분을 포함한 최종 누적값이어야 합니다.`);
          return;
        }
      }

      const updatedSession: WorkSession = {
        ...activeSession,
        endAt: now,
        durationMin,
        platforms: data.platforms,
        distanceKmInput: data.distanceKmInput,
        memo: data.memo,
        updatedAt: now,
      };

      // 로컬 ID 생성 (Firebase 미연결 시)
      if (!updatedSession.id) {
        updatedSession.id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      }

      try {
        if (firebaseReady && activeSession.id) {
          await updateSession(activeSession.id, updatedSession);
        }
        setSessions((prev) => {
          const next = [updatedSession, ...prev];
          if (!firebaseReady) localStorage.setItem('okapp_sessions', JSON.stringify(next));
          return next;
        });
        setActiveSession(null);
        if (!firebaseReady) localStorage.removeItem('okapp_activeSession');
      } catch (err) {
        console.error('퇴근 기록 실패:', err);
        setSessions((prev) => {
          const next = [updatedSession, ...prev];
          if (!firebaseReady) localStorage.setItem('okapp_sessions', JSON.stringify(next));
          return next;
        });
        setActiveSession(null);
        if (!firebaseReady) localStorage.removeItem('okapp_activeSession');
      }
    },
    [activeSession, firebaseReady, sessions]
  );

  // 세션 수정
  const handleUpdateSession = useCallback(
    async (sessionId: string, data: Partial<WorkSession>) => {
      setSessions((prev) => {
        const next = prev.map((s) => (s.id === sessionId ? { ...s, ...data } : s));
        if (!firebaseReady) localStorage.setItem('okapp_sessions', JSON.stringify(next));
        return next;
      });
      try {
        if (firebaseReady) {
          await updateSession(sessionId, data);
        }
      } catch (err) {
        console.error('세션 수정 실패:', err);
      }
    },
    [firebaseReady]
  );

  // 세션 삭제
  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== sessionId);
        if (!firebaseReady) localStorage.setItem('okapp_sessions', JSON.stringify(next));
        return next;
      });
      try {
        if (firebaseReady) {
          await deleteSession(sessionId);
        }
      } catch (err) {
        console.error('세션 삭제 실패:', err);
      }
    },
    [firebaseReady]
  );

  // 기록 초기화
  const handleResetSessions = useCallback(async () => {
    setSessions([]);
    setActiveSession(null);
    if (!firebaseReady) {
      localStorage.removeItem('okapp_sessions');
      localStorage.removeItem('okapp_activeSession');
    }
    try {
      if (firebaseReady) {
        // 모든 세션 삭제
        const allSessions = await getAllSessions();
        await Promise.all(
          allSessions.map((s) => s.id && deleteSession(s.id))
        );
      }
    } catch (err) {
      console.error('기록 초기화 실패:', err);
    }
  }, [firebaseReady]);

  // 설정 저장
  const handleSaveSettings = useCallback(
    async (newSettings: AppSettings) => {
      setSettings(newSettings);
      if (!firebaseReady) localStorage.setItem('okapp_settings', JSON.stringify(newSettings));
      try {
        if (firebaseReady) {
          await saveSettings(newSettings);
        }
      } catch (err) {
        console.error('설정 저장 실패:', err);
      }
    },
    [firebaseReady]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🚴</div>
          <div className="text-gray-400 font-medium">로딩 중...</div>
          <div className="mt-3 w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden mx-auto">
            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-800 text-center">
          🚴 동기부여 배달기록지
        </h1>
      </header>

      {/* 탭 컨텐츠 (스와이프 영역) */}
      <main
        className="pt-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {activeTab === 'main' && (
          <MainTab
            sessions={sessions}
            settings={settings}
            activeSession={activeSession}
            onStartShift={handleStartShift}
            onEndShift={handleEndShift}
            totalDistanceKm={totalDistanceKm}
          />
        )}
        {activeTab === 'monthly' && (
          <MonthlyTab
            sessions={sessions}
            settings={settings}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            sessions={sessions}
            onSaveSettings={handleSaveSettings}
            onResetSessions={handleResetSessions}
          />
        )}
      </main>

      {/* 하단 탭 */}
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
