export default function Avatar({ name, color, url, size = 38 }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  if (url) {
    return (
      <div className="avatar" style={{ width: size, height: size, padding: 0, overflow: 'hidden' }}>
        <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  return (
    <div className="avatar" style={{ background: color || '#4A90D9', width: size, height: size, fontSize: size * 0.4 }}>
      {initial}
    </div>
  );
}
