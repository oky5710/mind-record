---
name: d3-svg-charts
description: Implementation patterns and known gotchas for this app's scrollable D3 + raw SVG charts (no charting library). Covers drag-vs-click pointer handling, sticky y-axis, x-axis label collision detection, gap-threshold line breaks, and auto-scroll-to-latest. Use when creating a new chart, fixing chart scroll/drag/click bugs, or touching axis/tick rendering in features/chart/components/charts/ or features/hrv-analysis/components/.
---

# D3 + SVG 차트 구현 패턴

이 앱은 차트 라이브러리 없이 **d3 + 순수 SVG**로 직접 구현한다 (`features/chart/components/charts/`, `features/hrv-analysis/components/`). 커스텀 컴포넌트는 styled-components, 레이아웃/버튼류는 Tailwind.

## 가로 스크롤 + 드래그

`ScrollContainer`(`overflow-x: auto`, 스크롤바 숨김) + pointer 이벤트로 드래그 스크롤 구현. 터치는 브라우저 기본 스크롤에 맡기고 `pointerType !== "mouse"`면 드래그 핸들러는 무시.

**주의**: `pointerdown`에서 곧바로 `setPointerCapture`를 호출하면, 스펙상 그 뒤에 오는 `click` 이벤트가 실제 클릭 대상이 아니라 캡처한 엘리먼트로 리다이렉트됨 → 차트 안의 클릭 가능한 요소(원형 마커 등)가 클릭이 안 먹는 버그로 이어짐. 포인터가 일정 거리(예: 4px) 이상 움직였을 때만 `setPointerCapture`를 호출해서 "드래그"와 "클릭"을 구분할 것.

## sticky y축

값이 가로 스크롤과 무관한 축(y축 등)은 `position: sticky`로 처리해서 별도 여백을 차지하지 않으면서 항상 왼쪽에 보이게 함. `height: 0`인 절대위치 행으로 y좌표를 잡고, 그 안의 라벨에 `position: sticky; left: Npx`.

## x축 라벨 겹침 처리

`getBBox()`로 실제 렌더링된 텍스트 폭을 측정해서 겹치는지 판단, 겹치면 자동으로 숨김.

**주의**: `getBBox()`는 해당 `.tick`의 `<g transform="translate(x,0)">` 기준 **로컬 좌표**를 반환하므로 반드시 `xScale(d)`를 더해 절대 좌표로 변환해야 함. 안 하면 모든 틱이 원점 근처 좌표라 서로 겹치는 것으로 오판되어 대부분이 숨겨짐.

## 데이터 끊김 처리

워치 미착용 등으로 샘플 간격이 비정상적으로 크면(예: 정상 간격의 3배 이상) `d3.line().defined()`로 그 구간의 선을 끊어서 이어붙이지 않음.

## 초기 스크롤 위치 / 확대 뷰

페이지 로드 시 최신 데이터가 보이도록 스크롤을 오른쪽 끝으로 자동 이동. 확대해서(시간 단위 등) 볼 때는 `windowDays` 같은 옵션으로 최근 구간만 필터링해서 렌더링 — 전체 기간을 다 그리면 틱/포인트 DOM 개수가 과도하게 많아짐.

## 오버레이 마커에 흰 테두리 줄 때

`fill`과 `stroke`를 같이 쓰면 기본적으로 테두리가 도형 절반 안쪽으로 겹쳐 그려짐. 테두리가 도형 바깥쪽으로 온전히 보이게 하려면 `paintOrder="stroke"`(채우기를 테두리 위에 그림)를 추가할 것.

## 같은 시각에 여러 항목이 겹칠 때

레인 안에서 y좌표를 완전히 고정하면 겹쳐서 하나만 보임. 시드 문자열 기반 결정론적 난수로 y를 살짝 흩뿌리되(`jitteredLaneY` 패턴), 매 렌더마다 위치가 바뀌면 안 되므로 `Math.random()`이 아니라 데이터 자체(타임스탬프 등)에서 파생된 시드를 써야 함.
