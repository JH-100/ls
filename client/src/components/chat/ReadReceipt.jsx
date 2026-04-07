export default function ReadReceipt({ readCount, totalMembers }) {
  if (readCount == null || totalMembers == null) return null;

  let text;
  let className = 'message-read';

  if (readCount <= 0) {
    text = '\u2713 안 읽음';
    className += ' read-none';
  } else if (readCount >= totalMembers - 1) {
    text = '\u2713 모두 읽음';
    className += ' read-all';
  } else {
    text = `\u2713 ${readCount}명 읽음`;
  }

  return <span className={className}>{text}</span>;
}
