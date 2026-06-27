<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mind Chart
## 정신건강을 기록하는 앱

## 기본 모바일 대응 화면

## 기술 스택

* **Next.js App Router**
* **React Hook Form**

* 폼 상태 관리
* `useForm`
* `useFormContext`
* `useFieldArray`
* **TanStack Query v5**

* 서버 상태 관리
* 서버 데이터 캐싱
* mutation 이후 invalidate 처리
* **Zustand**
* **React-Calendar**
* 디자인 시스템: **shadcn**

## 주요 기능
* 캘린더에 날짜를 클릭해서 정신건강관련 이벤트를 입력
* 정신과 검사 결과
* 약복용 여부
* 약 종류, 용량 변동
* 정신 건강에 영향을 주는 이벤트
* 친구와의 만남
* 공연 관람
* 인간 관계 스트레스
* 특정인과의 마찰 등
* 운동
* 취미생활
* 웨어러블 디바이스의 수면, 심박변이 정보 수집 - 추후 연동 예정
* 입력된 데이터를 시계열 차트에 표시
* 각 이벤트간의 인과 관계를 분석
* 정신과 진료 시 도움을 주는 앱

## 진입 화면
* 고양이 사진 화면 사이즈에 맞게
* 사진 API: https://pixabay.com/api/
* prameter
* key: 5516430-cfb5dd34c26991292858fee24
* q: cat
* image_type: photo
* per_page: 1000
* page: 랜덤
* 호출한 사진 중 랜덤으로 한장만 첫화면에 보여줌
* 사진 위에 comfortMessages 중 하나를 골라서 문장을 보여줌
* 상단에 네비게이션

## 네비게이션
* 입력하기
* 차트보기

## 입력하기
* 달력을 볼 수 있는 UI
* 기본 화면은 현재 월
* 앞으로가기와 뒤로가기 버튼을 만들어 월 이동
* 해당 날짜 칸을 클릭
* 팝업
* 검사, 기분, 이벤트 라디오로 선택
* 선택, 취소 버튼
* 선택을 클릭하면 검사 입력 폼 노출
* 입력폼 양식은 - 추후 입력
* 검사 결과 입력 폼

|Category|field|type|기타|
|---|--|----|----|
|Time Domain Analysis| MHR|number||
||SDNN |number||
||RMSSD |number||
|| PSI|number||
|Freequency Domain Analysis|TP |number| 입력 칸 2개 |
||VLF|number|입력 칸 2개|
||LF|number|입력 칸 2개|
||HF|number|입력 칸 2개|
||LFNorm|number||
||HFNorm|number||
||LF/HF Ratio|number||
||Ectopic Beat|number||
|Other|SRD|number||
||Result|string||

* 저장/취소 버튼

## 규칙
* 데이터 로딩중에는 반드시 로딩 중ui노출 
* error 발생시 원인을 해당 UI에 노출
