import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import PasswordStrength from '../components/PasswordStrength'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [form, setForm] = useState({ new_password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="login-container fade-in" style={{ maxWidth: 420, textAlign: 'center' }}>
          <p style={{ color: '#e74c3c' }}>Link inválido o expirado.</p>
          <button className="btn-gold" style={{ marginTop: 16 }} onClick={() => navigate('/forgot-password')}>
            Solicitar nuevo link
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/reset-password', { token, new_password: form.new_password })
      setSuccess(data.message)
      setTimeout(() => navigate('/'), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-container fade-in" style={{ maxWidth: 420 }}>
        <div className="login-logo">
          <div className="logo-hex"><span className="logo-tdc">TDC</span></div>
          <p className="logo-sub">TIEMPO DE CAMBIO</p>
          <p className="logo-gym">GYM &amp; FITNESS</p>
        </div>

        <h2 className="login-title">Nueva contraseña</h2>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#2ecc71' }}>{success}</p>
            <p className="muted small">Redirigiendo al inicio...</p>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nueva contraseña</label>
              <input className="input-field" type="password" value={form.new_password}
                onChange={e => setForm({ ...form, new_password: e.target.value })} required autoFocus />
              <PasswordStrength password={form.new_password} />
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar contraseña</label>
              <input className="input-field" type="password" value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })} required />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button className="btn-gold login-btn" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
