<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mind Profiler
## 정신건강을 기록하는 앱

## 기본 모바일 대응 화면

## 기술 스택

* **Next.js 16 App Router**
* **React Hook Form**
  * 폼 상태 관리
  * `useForm`, `useFormContext`, `useFieldArray`
* **TanStack Query v5**
  * 서버 상태 관리 및 캐싱
  * mutation 이후 invalidate 처리
* **Zustand** - 추후 적용 예정
* **styled-components v6**
  * SSR 레지스트리: `lib/styled-components-registry.tsx`
  * shadcn 컴포넌트는 Tailwind 그대로 사용
  * 직접 만드는 컴포넌트는 styled-components 사용
* 디자인 시스템: **shadcn/ui** (Tailwind v4 기반)

## 프로젝트 구조

```
app/
├── api/cat-photo/route.ts     # Pixabay 프록시 API
├── calendar/page.tsx          # 입력하기 페이지
├── chart/page.tsx             # 차트보기 페이지 (추후 구현)
├── components/
│   ├── BottomSheet.tsx        # 재사용 바텀시트 (고정 헤더 + 스크롤 + 뒤로가기)
│   ├── Calendar.tsx           # 캘린더 UI
│   ├── EntryModal.tsx         # 날짜 클릭 시 입력 모달
│   ├── EntryScreen.tsx        # 진입 화면
│   ├── Navigation.tsx         # 상단 네비게이션
│   ├── QueryProvider.tsx      # TanStack Query 클라이언트 프로바이더
│   └── forms/
│       └── ExamForm.tsx       # 검사 결과 입력 폼
├── constants/
│   └── message.ts             # comfortMessages (카테고리별 위로 문구)
├── queries/
│   └── useCatPhoto.ts         # Pixabay 이미지 쿼리 훅
├── globals.css
├── layout.tsx
└── page.tsx                   # 진입 화면 (/)

components/ui/                 # shadcn 컴포넌트 (수정 금지)
lib/
└── styled-components-registry.tsx  # SSR 스타일 레지스트리
```

## 라우팅

| 경로 | 화면 |
|---|---|
| `/` | 진입 화면 (고양이 사진 + 위로 메시지) |
| `/calendar` | 입력하기 (캘린더) |
| `/chart` | 차트보기 (HRV/웨어러블/기분/커피 통합 대시보드) |
| `/hrv-analysis` | 심박변이 분석 (일 단위 / 시간 단위, 날짜 이동) |

## 환경변수

| 변수명 | 설명 |
|---|---|
| `NEXT_PUBLIC_PIXABAY_API_KEY` | Pixabay API 키 (클라이언트에서 직접 호출) |
| `AUTH_SECRET` | NextAuth(Auth.js) 세션/JWT 암호화 키 |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth Client (Google Cloud Console에서 발급, redirect URI: `http://localhost:3000/api/auth/callback/google`) |
| `BACKEND_URL` | NextAuth 서버사이드 콜백에서 백엔드 호출 시 사용 (`http://localhost:3001`) |

백엔드(`mind-chart-backend`)의 `.env`에도 프론트와 **동일한 Google Client ID**를 `GOOGLE_CLIENT_ID`로 설정해야 함 (idToken 검증 시 audience로 사용).

## 주요 기능

* 캘린더에 날짜를 클릭해서 정신건강관련 이벤트를 입력
  * 정신과 검사 결과
  * 약복용 여부
  * 약 종류, 용량 변동
  * 정신 건강에 영향을 주는 이벤트 (친구와의 만남, 공연 관람, 인간 관계 스트레스 등)
  * 운동
  * 취미생활
* 웨어러블 디바이스의 수면, 심박변이 정보 수집 - 추후 연동 예정
* 입력된 데이터를 시계열 차트에 표시
* 각 이벤트간의 인과 관계를 분석
* 정신과 진료 시 도움을 주는 앱

## 진입 화면

* 고양이 사진 화면 사이즈에 맞게 전체화면 표시
* Pixabay API 클라이언트에서 직접 호출 (`useCatPhoto` 훅)
  * `NEXT_PUBLIC_PIXABAY_API_KEY` 사용
  * `q=cat`, `image_type=photo`, `per_page=200`, `page=랜덤(1~10)`
  * 결과 중 랜덤 index로 1장 선택
* 사진 위에 `comfortMessages` 중 랜덤 문구 표시
* 상단에 네비게이션 (투명 모드)

## 네비게이션

* 입력하기 → `/calendar`
* 차트보기 → `/chart`
* 복용약 -> `/medicine`
* 진입 화면에서는 투명(흰 텍스트), 일반 페이지에서는 기본 스타일
* 현재 경로 활성 표시

## 입력하기

* 달력 UI, 기본 화면은 현재 월
* 앞으로/뒤로 버튼으로 월 이동
* 날짜 클릭 → `BottomSheet` 팝업
  * 검사 / 기분 / 이벤트 카드 선택 → 클릭 즉시 해당 폼으로 이동
  * 헤더에 뒤로가기 버튼 (유형 선택 화면으로 복귀)

## 복용약
* 복용중인 약을 입력한다
* 약은 `/medications` 에서 약을 검색해서 선택하ㅐ서 입력한다

### BottomSheet 컴포넌트

재사용 가능한 바텀시트. 헤더 고정, 콘텐츠만 스크롤.

```tsx
<BottomSheet
  open={open}
  onOpenChange={setOpen}
  title="제목"
  onBack={() => {}}   // 선택: 뒤로가기 버튼 표시
  maxHeight="90dvh"   // 선택: 기본값 90dvh
>
  {/* 콘텐츠 */}
</BottomSheet>
```

### 검사 결과 입력 폼

React Hook Form(`useForm`) 사용.

| Category | Field | Type |
|---|---|---|
| Time Domain Analysis | MHR | number | 
| | SDNN | number | 
| | RMSSD | number | 
| | PSI | number | 
| Frequency Domain Analysis | TP | number | 
| | VLF | number | 
| | LF | number | 
| | HF | number | 
| | LFNorm | number | 
| | HFNorm | number | 
| | LF/HF Ratio | number | 
| | Ectopic Beat | number | 
| Other | SRD | number | 
| | Result | string |

* 저장 / 취소 버튼

## 백엔드

* 위치: `/Users/oky/Desktop/mind-chart-backend`
* Base URL: `http://localhost:3001`
* API 문서: `/Users/oky/Desktop/mind-chart-backend/api-docs.html` — 이 파일이 최신 명세 기준
* API 연동 작업 전 반드시 `api-docs.html`을 먼저 확인한다

## 차트 (차트보기, 심박변이 분석 등)

* 차트 라이브러리 없이 **d3 + 순수 SVG**로 직접 구현 (`features/chart/components/charts/`, `features/hrv-analysis/components/`)
* 커스텀 컴포넌트는 styled-components 사용, 레이아웃/버튼류는 Tailwind
* 가로 스크롤 차트 공통 패턴:
  * `ScrollContainer`(`overflow-x: auto`, 스크롤바 숨김) + pointer 이벤트로 드래그 스크롤 구현 (터치는 브라우저 기본 스크롤에 맡기고 `pointerType !== "mouse"`면 드래그 핸들러는 무시)
  * **주의**: `pointerdown`에서 곧바로 `setPointerCapture`를 호출하면, 스펙상 그 뒤에 오는 `click` 이벤트가 실제 클릭 대상이 아니라 캡처한 엘리먼트로 리다이렉트됨 → 차트 안의 클릭 가능한 요소(원형 마커 등)가 클릭이 안 먹는 버그로 이어짐. 포인터가 일정 거리(예: 4px) 이상 움직였을 때만 `setPointerCapture`를 호출해서 "드래그"와 "클릭"을 구분할 것
  * y축처럼 값이 가로 스크롤과 무관한 축은 `position: sticky`로 처리해서 별도 여백을 차지하지 않으면서 항상 왼쪽에 보이게 함 (`height: 0`인 절대위치 행으로 y좌표를 잡고, 그 안의 라벨에 `position: sticky; left: Npx`)
  * x축 라벨이 겹칠 때는 자동으로 생략: `getBBox()`로 실제 렌더링된 텍스트 폭을 측정해서 겹치는지 판단. **단, `getBBox()`는 해당 `.tick`의 `<g transform="translate(x,0)">` 기준 로컬 좌표를 반환**하므로 반드시 `xScale(d)`를 더해 절대 좌표로 변환해야 함 (안 하면 모든 틱이 원점 근처 좌표라 서로 겹치는 것으로 오판되어 대부분이 숨겨짐)
  * 워치 미착용 등으로 샘플 간격이 비정상적으로 크면(예: 정상 간격의 3배 이상) `d3.line().defined()`로 그 구간의 선을 끊어서 이어붙이지 않음
  * 페이지 로드 시 최신 데이터가 보이도록 스크롤을 오른쪽 끝으로 자동 이동. 확대해서(시간 단위 등) 볼 때는 `windowDays` 같은 옵션으로 최근 구간만 필터링해서 렌더링 — 전체 기간을 다 그리면 틱/포인트 DOM 개수가 과도하게 많아짐

## 웨어러블 데이터 모델 (백엔드)

* `WearableData`: 하루 1건, 일별 요약값 (평균 심박수, HRV, 수면시간 등) — `@@unique([userId, date])`
* `WearableSample`: 타임스탬프별 다건 기록용 (예: 애플워치 HRV는 하루 약 2시간 간격으로 여러 번 측정됨) — `type` + `timestamp` + `value`, `POST /wearable-samples/bulk`로 일괄 저장, `GET /wearable-samples?type=...`으로 조회
* 두 모델 다 `userId`는 nullable이지만, 인증 도입 이후로는 로그인한 사용자의 실제 id가 항상 채워짐

## 인증 (Google 로그인)

* **프론트**: NextAuth.js(Auth.js v5) — `auth.ts`(루트)에 Google Provider 설정. 로그인 안 한 상태로 접근하면 `middleware.ts`가 `/login`으로 리다이렉트 (`/login`, `/api/auth/*`는 예외)
* **브릿지**: NextAuth의 `jwt` 콜백에서 최초 로그인 시 Google이 내려준 `account.id_token`을 백엔드 `POST /auth/google`에 전달 → 백엔드가 `google-auth-library`로 idToken을 직접 검증하고(공유 비밀키 방식이 아님), 기존 `AuthService`가 이메일/비밀번호 로그인 때 쓰던 것과 동일한 형식의 JWT(`{ sub, email }`)를 발급 → 이 토큰을 `session.backendToken`에 실어 프론트로 전달
* **API 호출**: 프론트의 모든 쿼리 훅은 `features/shared/lib/authFetch.ts`의 `useAuthedFetch()`로 `Authorization: Bearer <backendToken>` 헤더를 붙여서 호출 (새 쿼리 파일을 추가할 때도 반드시 이 훅을 통해서 fetch할 것). `useQuery`는 `enabled: isReady && !!token`으로 토큰이 준비되기 전에는 요청하지 않도록 함
* **백엔드**: `JwtAuthGuard`가 `APP_GUARD`로 전역 등록되어 있어 기본적으로 모든 라우트가 인증 필요. 예외는 `@Public()` 데코레이터로 표시 (`auth/register`, `auth/login`, `auth/google`, 그리고 공용 참조 데이터인 `DrugController` 전체). 컨트롤러에서 로그인한 사용자 정보는 `@CurrentUser() user: CurrentUserPayload`로 꺼내 씀 (`src/auth/current-user.decorator.ts`)
* 새 리소스(모델)를 추가할 때는 반드시 `userId` 필드를 넣고, 서비스의 조회/생성 로직에 `@CurrentUser()`로 받은 `user.id`를 스코프로 사용할 것 — 이걸 빠뜨리면 다른 사용자의 데이터가 섞여 보임

## 규칙

* 데이터 로딩 중에는 반드시 로딩 UI 노출
* 에러 발생 시 원인을 해당 UI에 노출
* 클라이언트 컴포넌트 상단에 반드시 `"use client"` 선언
* shadcn 컴포넌트(`components/ui/`)는 직접 수정하지 않음
* styled-components는 `"use client"` 컴포넌트에서만 사용
