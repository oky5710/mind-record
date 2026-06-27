<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mind Chart
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
| `/chart` | 차트보기 (추후 구현) |

## 환경변수

| 변수명 | 설명 |
|---|---|
| `NEXT_PUBLIC_PIXABAY_API_KEY` | Pixabay API 키 (클라이언트에서 직접 호출) |

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

## 규칙

* 데이터 로딩 중에는 반드시 로딩 UI 노출
* 에러 발생 시 원인을 해당 UI에 노출
* 클라이언트 컴포넌트 상단에 반드시 `"use client"` 선언
* shadcn 컴포넌트(`components/ui/`)는 직접 수정하지 않음
* styled-components는 `"use client"` 컴포넌트에서만 사용
