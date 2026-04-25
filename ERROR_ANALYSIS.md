# 오류 분석 및 교훈

## 1. 가장 오류가 많았던 부분

### 1.1 날짜/시간 처리 (KST)
**오류 빈도: ★★★★★ (가장 높음)**

| 오류 | 원인 | 해결 |
|------|------|------|
| `toISOString()` 사용 시 UTC 날짜로 잘못 계산됨 | `toISOString()`은 항상 UTC 기준. 한국 오후 11시 = UTC 오후 2시(다음날) | `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()` 사용 |
| 오늘 날짜가 자정에 바뀌지 않음 | `new Date()`는 로컬 시간이지만 KST 변환 누락 | `formatDateKst()` 함수로 KST 날짜 문자열 생성 |
| 요일 계산 오류 (월요일=1, 일요일=0) | `getUTCDay()` 반환값 혼동 | `(getUTCDay() + 6) % 7`로 월요일 시작 변환 |
| 주간 범위 계산 오류 | `toISOString().split('T')[0]` 사용 시 UTC 날짜 기준 | `formatDateKst()`로 통일 |

**교훈:**
- `toISOString()`은 **절대** 날짜 비교/표시에 사용하지 말 것
- KST 기준 날짜는 `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`로 직접 계산
- 날짜 관련 함수는 `lib/time/kst.ts`에 모아두고 재사용

### 1.2 오전/오후 데이터 구조
**오류 빈도: ★★★★☆**

| 오류 | 원인 | 해결 |
|------|------|------|
| 오후 저장 시 오전 데이터 덮어쓰기 | 같은 날짜에 오전/오후를 별도 문서로 저장하지 않음 | shiftType 필드로 구분 |
| 오후 건수가 오전+오후 합계로 중복 계산 | 오후에 오전값을 포함한 누적값 저장 | 오후는 오전값을 빼서 추가분만 표시 |
| 일일 합계가 오전+오후 중복 | `dailyTotalEarnings()`가 모든 세션 합산 | 오후 세션의 raw값 = 일일 합계로 사용 |
| 수정 시 오전/오후 구분 없이 동일 폼 사용 | 수정 모달에서 shiftType 구분 누락 | shiftType 표시 및 오후는 추가분만 수정 가능 |

**교훈:**
- 오전/오후는 **별도 문서**로 저장 (같은 날짜, 다른 shiftType)
- 오후 저장 시 오전값을 포함한 **누적값**을 저장 (Firestore에는 raw 데이터)
- UI 표시 시에만 오전값을 빼서 **추가분** 계산
- 일일 합계 = 오후 세션의 raw 금액

### 1.3 Firebase 연동
**오류 빈도: ★★★☆☆**

| 오류 | 원인 | 해결 |
|------|------|------|
| Firestore Database 미생성 | Firebase Console에서 DB를 생성하지 않음 | Console > Firestore Database > 만들기 |
| 오프라인 시 데이터 손실 | Firebase 실패 시 localStorage도 업데이트 안 됨 | localStorage를 우선 로드, Firebase는 백그라운드 |
| 새로고침 시 데이터 리셋 | `.env.local`에 Firebase 키 미설정 | `.env.local` 생성 및 키 입력 |
| 로딩 속도 느림 | Firebase 응답까지 기다림 | localStorage 즉시 표시 후 Firebase 백그라운드 로드 |

**교훈:**
- Firebase Console에서 **먼저** Database를 생성해야 함
- `.env.local`에 모든 Firebase 키를 설정
- localStorage를 **캐시**로 사용 (읽기: localStorage → Firebase, 쓰기: Firebase + localStorage)
- 로딩 상태를 항상 표시 (Skeleton UI)

### 1.4 UI/스타일링
**오류 빈도: ★★★☆☆**

| 오류 | 원인 | 해결 |
|------|------|------|
| 모달 z-index 겹침 | 여러 모달이 같은 z-index 사용 | AlertModal: z-[70], ShiftEndModal: z-[60], 수정모달: z-[60] |
| `missing key prop` | map() 사용 시 key 누락 | session.id 또는 고유 키 생성 |
| `Hydration mismatch` | 서버/클라이언트 시간 불일치 | `useEffect`로 마운트 후 렌더링 |
| CSS 퍼센트 높이 계산 오류 | 부모 컨테이너 높이가 auto | px 값 직접 계산 |
| 폰트 색상 변경 누락 | `#2C3E50`가 여러 파일에 분산 | 모든 파일에서 `#2C3E50` → `#0B3954`로 일괄 변경 |

**교훈:**
- z-index는 **계층 구조**로 관리 (모달 > 오버레이 > 컨텐츠)
- map() 사용 시 **항상** 고유 key 제공
- 시간/날짜 표시는 `useEffect` + `useState`로 **클라이언트 사이드**에서만 렌더링
- CSS 높이는 **px**로 직접 계산 (퍼센트는 부모 높이 필요)
- 색상 변경 시 **전체 파일 검색** (`findstr /S /N "#2C3E50"`) 후 일괄 변경

### 1.5 상태 관리
**오류 빈도: ★★☆☆☆**

| 오류 | 원인 | 해결 |
|------|------|------|
| 출근 시 목표시간 달성 버그 | durationMin이 0일 때 목표 달성으로 판단 | durationMin > 0 조건 추가 |
| 기록 수정 안 됨 | 로컬 세션에 id가 없음 | `crypto.randomUUID()`로 id 생성 |
| 저장 버튼 비활성화 문제 | 변경 감지 로직 누락 | `useMemo`로 hasChanges 계산 |
| 부채 콤마 유지 안 됨 | 입력값을 숫자로 변환 후 다시 문자열로 | `toLocaleString('ko-KR')`으로 표시 |

**교훈:**
- **초기값**을 항상 확인 (0, null, undefined)
- 로컬 데이터에는 **고유 ID**를 할당
- 변경 감지는 `useMemo`로 **자동 계산**
- 금액 표시는 항상 `toLocaleString('ko-KR')` 사용

---

## 2. 오류 예방 체크리스트

### 구현 전
- [ ] 타입/인터페이스 먼저 정의
- [ ] 날짜/시간 함수는 `lib/time/kst.ts`에 통일
- [ ] Firebase Console에서 DB 생성 확인
- [ ] `.env.local`에 모든 키 설정

### 구현 중
- [ ] `toISOString()` 사용 금지 (KST 함수 사용)
- [ ] map()에 key prop 제공
- [ ] 모달 z-index 중복 확인
- [ ] 오전/오후 데이터 구조 확인 (별도 문서, 오후=누적값)
- [ ] localStorage + Firebase 이중 저장

### 구현 후
- [ ] `findstr /S /N "#2C3E50"`로 색상 누락 확인
- [ ] `npx next build`로 빌드 테스트
- [ ] 모바일 뷰포트에서 UI 확인
- [ ] 오프라인 상태에서 데이터 유지 확인
- [ ] 새로고침 후 데이터 유지 확인

---

## 3. 자주 하는 실수 TOP 5

1. **날짜 처리**: `toISOString()` 사용 → KST 함수로 대체
2. **오전/오후 구조**: 오후에 오전값 포함 저장 → UI에서만 추가분 계산
3. **Firebase 설정**: Console에서 DB 생성 안 함 → 생성 후 `.env.local` 설정
4. **CSS z-index**: 모달 z-index 겹침 → 계층별로 구분 (70/60/50)
5. **색상 일관성**: `#2C3E50` 누락 → `findstr`로 전체 검색 후 변경
