export default function Avatar({ name, color, size = 38 }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div
      className="avatar"
      style={{
        background: color || '#4A90D9',
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </div>
  );
}
