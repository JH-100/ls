export function formatTime(dateStr) {
  const date = new Date(dateStr + 'Z');
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return '방금';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
