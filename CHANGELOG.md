# 동기부여 배달기록지 - 변경 내역 (CHANGELOG)

## 프로젝트 개요
- **프로젝트명**: 동기부여 배달기록지 (hongsfighting)
- **기술 스택**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + Firebase Firestore + Mapbox GL JS
- **배포**: Netlify (GitHub main 브랜치 자동 배포)
- **저장소**: https://github.com/jjabhong3-sudo/hongsfighting

---

## 1단계: MVP 구현 (초기 설정)

### ✅ Next.js 프로젝트 초기화 및 Tailwind/App Router 구성
- `npx create-next-app@latest`로 프로젝트 생성
- TypeScript, Tailwind CSS, App Router, src 디렉토리 구조 설정
- `netlify.toml` 배포 설정 파일 생성
- `next.config.ts`에 `output: 'export'` 설정 (정적 사이트 생성)

### ✅ 타입/유틸/KST/거리 로직 작성
- `src/types/domain.ts`: WorkSession, AppSettings, Platforms, Debt 등 공통 타입 정의
- `src/lib/time/kst.ts`: KST 기준 날짜/주간 계산 유틸 (todayKst, weekStartKst, formatDateKst 등)
- `src/lib/route/waypoints.ts`: 서울 화곡역 → 치앙마이까지 12개 동선 데이터
- `src/lib/route/progress.ts`: 육로/해상 구간 진행 계산 로직
- `src/lib/work/shift.ts`: 오전/오후 판정, 목표시간 로직
- `src/lib/stats/earnings.ts`: 시급/건당/km당 계산, 주간/월간 통계
- `src/lib/utils/format.ts`: 천단위 콤마 포맷 유틸

### ✅ Firebase 연결 및 세션/설정 저장소 구현
- `src/lib/firebase/client.ts`: Firebase 초기화 (환경변수 기반)
- `src/lib/repositories/sessionsRepo.ts`: WorkSession CRUD
- `src/lib/repositories/settingsRepo.ts`: AppSettings CRUD
- `.env.local.example`: 환경변수 템플릿

### ✅ 3탭 UI + 인앱 모달 + Mapbox 경로 화면 구현
- `src/app/page.tsx`: 메인 진입 (하단 탭 컨테이너, 스와이프 지원)
- `src/components/layout/BottomTabBar.tsx`: 하단 3탭 네비게이션
- `src/components/tabs/MainTab.tsx`: 메인 탭 (출퇴근, 거리 진행, 금주 통계)
- `src/components/tabs/MonthlyTab.tsx`: 월간 탭 (달력, 월 집계, 상세기록)
- `src/components/tabs/SettingsTab.tsx`: 설정 탭 (목표 금액, 부채 목록, 전체 통계)
- `src/components/map/RouteMap.tsx`: Mapbox 경로 지도
- `src/components/work/ShiftEndModal.tsx`: 퇴근 입력 모달
- `src/components/ui/AlertModal.tsx`: 공통 알림 모달
- `src/app/globals.css`: 전역 스타일

---

## 2단계: 피드백 반영 및 버그 수정

### 1차 피드백: UI 레이어 상세화
- 메인 탭 레이어 구조 개선 (헤더/출퇴근/연속출근/부채/수익/그래프/상세)
- 스와이프 탭 전환 구현
- 경로 로직 개선 (해상 구간 표시)
- 퇴근 모달 개선 (플랫폼별 입력)
- 수정/삭제 기능 추가 (월간 탭)

### 2차 피드백: 오전/오후 판정 로직
- 오전(05:00~12:00), 오후(12:00~익일 05:00) 판정 로직 수정
- 금주 근무일 카운트 수정 (날짜 기준)
- 수익 그래프 구현 (월~일 7일)
- 삭제 기능 구현
- 천단위 콤마 표시

### 3차 피드백: 오후 목표 6시간
- 오후 목표시간 6시간으로 설정
- 1일 누적 로직: 오후가 최종값
- 인앱 알림창 구현 (AlertModal)

### 4차 피드백: 저장 버튼 위치/변경감지
- 저장 버튼 위치 개선
- 변경 감지 로직 추가
- 부채 콤마 유지
- 기록 초기화 기능

### 5차 피드백: 수익 그래프 색상
- 그래프: 목표 달성=하늘색(sky-400), 미달성=회색(gray-300)
- 플랫폼별+통합 상세 표시
- 카카오퀵 플랫폼 추가
- 로딩 그라데이션 애니메이션

### 6차 피드백: 그래프 7일 고정
- 월~일 7일 항상 표시
- 기록 없어도 빈 막대 표시

### 7차 피드백: 퍼센트 표시
- 주간/월간 목표 퍼센트 표시
- 오늘 금액 버그 수정
- KST 날짜 로직 getUTC* 사용
- 시간 수동 입력 기능

### 8차 피드백: 그래프 월요일 시작
- toISOString → formatDateKst로 변경

### 9차 피드백: 요일 표시
- 오늘/그래프/상세에 요일 표시
- 그래프 높이 기준 18만원

### 10차 버그: 기록 수정 안되는 문제
- 로컬 세션에 id 할당 로직 추가

### 11차 수정: 그래프 높이 CSS
- 퍼센트 → px 값 직접 계산

### 12차 수정: 그래프 높이 축소
- h-64 → h-32 (반으로 축소)

### 13차 수정: 하루 데이터 구조 재정의
- 날짜=부모, 오전/오후=자식 구조
- 합계=최종수익
- 작은값 저장 차단

### 14차 수정: 새로고침 리셋 문제
- `.env.local` 생성
- localStorage 백업 구현

### 15차 수정: Firebase 오프라인 에러 처리
- localStorage 우선 로드
- Firebase 시도 → 실패 시 localStorage 유지

### 16차 수정: 로딩 속도 개선
- localStorage 즉시 표시
- Firebase 백그라운드 로드

### 17차 수정: Firestore Database 미생성
- Firebase Console에서 DB 생성 안내

### 18차 수정: 오전/오후 데이터 구조 최종
- 오전=첫입력고정
- 오후=오전+추가분
- 일일합계=오후raw
- 상세=날짜별그룹핑

### 19차 수정: 상세수익 표시 형식
- 날짜별 그룹핑
- 플랫폼별(카카오퀵/배민) 건수/금액 표시
- 오후는 추가분 계산

### 20차 수정: 오후 건수 리셋
- 기존 오후 세션 삭제 후 새로 저장
- 금주 수익 상세 날짜별 그룹핑

### 21차 수정: 상세수익 표시 순서
- 건수/시간/거리 → 건당/시급/km당 → 플랫폼별(색상구분)
- 일일합계 파란색 두꺼운 글씨
- 플랫폼별 색상 구분 (카카오퀵=파랑, 배민=초록)

### 31차 수정: 다크모드 UI 통일 (2026-04-25)
- 전체 UI를 다크모드(slate-900 계열)로 통일
- **page.tsx**: 배경 `bg-gray-50` → `bg-[#0f172a]`, 로딩 화면 다크모드 적용
- **BottomTabBar.tsx**: 배경 `bg-white` → `bg-[#1e293b]`, 테두리 `border-gray-200` → `border-[#334155]`, 텍스트 색상 변경
- **ShiftEndModal.tsx**: 모달 배경 `bg-white` → `bg-[#1e293b]`, 입력 필드 `bg-[#0f172a]`, 요약/시간 카드 다크모드 적용
- **AlertModal.tsx**: 모달 배경 `bg-white` → `bg-[#1e293b]`, 취소 버튼 `bg-[#334155]`, 텍스트 색상 변경
- **SettingsTab.tsx**: 모든 카드 `bg-white` → `bg-[#1e293b]`, 입력 필드 `bg-[#0f172a]`, 통계 카드 `bg-[#0f172a]` + `border-[#334155]`, 저장 버튼 gradient-bar 적용
- **globals.css**: 이미 다크모드 CSS 변수 정의되어 있어 변경 불필요
- **layout.tsx**: 이미 `bg-[#0f172a] text-[#f1f5f9]` 적용되어 있어 변경 불필요
- **MainTab.tsx**: 이미 다크모드 스타일 적용되어 있어 변경 불필요
- **MonthlyTab.tsx**: 이미 다크모드 스타일 적용되어 있어 변경 불필요
- 빌드 검증 완료 (TypeScript + Next.js 컴파일 에러 없음)

---

### 22차 수정: 폰트 크기 + 레이아웃 + COMPLETE
- 폰트 크기 증가 (text-xs 12px)
- 건수/시간/거리 오전/오후 금액과 같은 줄
- 목표 달성 시 스타일리시한 COMPLETE 표시
  - 일일: 노랑→주황 그라데이션 배지
  - 주간/월간: 진행바 그라데이션 + 애니메이션 배지
  - 달력: 목표 달성일 노랑→초록 그라데이션

---

## 현재 파일 구조

```
okapp/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 메인 진입 (하단 탭 컨테이너)
│   │   ├── layout.tsx            # 루트 레이아웃
│   │   └── globals.css           # 전역 스타일
│   ├── components/
│   │   ├── layout/
│   │   │   └── BottomTabBar.tsx  # 하단 3탭 네비게이션
│   │   ├── tabs/
│   │   │   ├── MainTab.tsx       # 메인 탭
│   │   │   ├── MonthlyTab.tsx    # 월간 탭
│   │   │   └── SettingsTab.tsx   # 설정 탭
│   │   ├── map/
│   │   │   └── RouteMap.tsx      # Mapbox 경로 지도
│   │   ├── work/
│   │   │   └── ShiftEndModal.tsx # 퇴근 입력 모달
│   │   └── ui/
│   │       └── AlertModal.tsx    # 공통 알림 모달
│   ├── lib/
│   │   ├── time/
│   │   │   └── kst.ts            # KST 날짜/주간 계산
│   │   ├── route/
│   │   │   ├── waypoints.ts      # 동선 데이터
│   │   │   └── progress.ts       # 진행 계산
│   │   ├── work/
│   │   │   └── shift.ts          # 오전/오후 판정
│   │   ├── stats/
│   │   │   └── earnings.ts       # 수익 통계 계산
│   │   ├── utils/
│   │   │   └── format.ts         # 포맷 유틸
│   │   ├── firebase/
│   │   │   └── client.ts         # Firebase 초기화
│   │   └── repositories/
│   │       ├── sessionsRepo.ts   # 세션 CRUD
│   │       └── settingsRepo.ts   # 설정 CRUD
│   └── types/
│       └── domain.ts             # 공통 타입 정의
├── .env.local.example            # 환경변수 템플릿
├── netlify.toml                  # Netlify 배포 설정
├── next.config.ts                # Next.js 설정
└── CHANGELOG.md                  # 변경 내역 (이 파일)
```
