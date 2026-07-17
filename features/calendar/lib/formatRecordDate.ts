export function formatDateLabel(date: Date): string {
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
}

export function formatTimeLabel(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
