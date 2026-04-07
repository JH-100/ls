export default function ReadReceipt({ readCount, totalMembers }) {
  if (readCount == null || totalMembers == null) return null;

  let text;
  let className = 'read-receipt';

  if (readCount <= 0) {
    text = '\u2713 안 읽음';
    className += ' unread';
  } else if (readCount >= totalMembers - 1) {
    text = '\u2713 모두 읽음';
    className += ' all-read';
  } else {
    text = `\u2713 ${readCount}명 읽음`;
    className += ' partial-read';
  }

  return <span className={className}>{text}</span>;
}
