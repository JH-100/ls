export function formatMessageContent(content) {
  let f = content;
  f = f.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  f = f.replace(/(?<!\w)_([^_]+)_(?!\w)/g, '<em>$1</em>');
  f = f.replace(/`([^`]+)`/g, '<code>$1</code>');
  f = f.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  return f;
}
