export function formatDate(dateStr) {
  const date = new Date(dateStr + 'Z');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = today - msgDate;
  if (diff === 0) return '오늘';
  if (diff === 86400000) return '어제';
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  if (year === now.getFullYear()) return `${month}월 ${day}일`;
  return `${year}년 ${month}월 ${day}일`;
}
