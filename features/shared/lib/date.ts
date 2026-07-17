// 서버가 시각까지 포함해서 저장한 값(커피 시간, 검사 시각, 이벤트 시각 등)에서
// "그 날짜"를 뽑을 때는 UTC 문자열을 그대로 자르면 안 됨 — 자정~아침 사이(KST)에는
// 로컬 날짜보다 하루 이른 날짜가 나옴. 로컬 기준으로 날짜만 뽑아야 함.
export function toLocalDateKey(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
