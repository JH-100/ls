export default function Badge({ count }) {
  if (!count || count <= 0) return null;
  return <span className="badge">{count}</span>;
}
