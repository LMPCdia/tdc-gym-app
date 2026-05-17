export default function PasswordStrength({ password }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Al menos 1 mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Al menos 1 número', ok: /[0-9]/.test(password) },
    { label: 'Al menos 1 símbolo (!@#$...)', ok: /[!@#$%^&*()\-_+=\[\]{};:'",./<>?]/.test(password) },
  ]

  if (!password) return null

  const passed = checks.filter(c => c.ok).length
  const color = passed <= 1 ? '#e74c3c' : passed <= 2 ? '#e67e22' : passed === 3 ? '#f0a500' : '#2ecc71'

  return (
    <div style={{ marginTop: 8, marginBottom: 4 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {checks.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < passed ? color : '#2a2a2a',
            transition: 'background 0.3s'
          }} />
        ))}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {checks.map(c => (
          <li key={c.label} style={{
            fontSize: 12, color: c.ok ? '#2ecc71' : '#888',
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2
          }}>
            <span>{c.ok ? '✓' : '○'}</span> {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
