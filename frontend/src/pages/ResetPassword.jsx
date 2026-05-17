import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import './Login.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [form, setForm] = useState({ new_password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (form.new_password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: form.new_password })
      setSuccess(true)
    } catch (e) {
      setError(e.response?.data?.detail || 'El link expiró o ya fue usado')
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <div className="login-page">
      <div className="login-bg"><div className="login-bg-hex"/></div>
      <div className="login-container fade-in">
        <div className="success-card card">
          <div className="success-icon">❌</div>
          <h3>Link inválido</h3>
          <p className="muted">Este link de recuperación no es válido.</p>
          <button className="btn-gold" onClick={() => navigate('/')}>Ir al login</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="login-page">
      <div className="login-bg"><div className="login-bg-hex"/></div>
      <div className="login-container fade-in">
        <div className="login-logo">
          <div className="logo-hex"><span className="logo-tdc">TDC</span></div>
          <p className="logo-sub">TIEMPO DE CAMBIO</p>
          <p className="logo-gym">GYM &amp; FITNESS</p>
        </div>

        {success ? (
          <div className="success-card card">
            <div className="success-icon">✅</div>
            <h3>Contraseña restablecida</h3>
            <p className="muted">Ya podés iniciar sesión con tu nueva contraseña.</p>
            <div className="success-actions">
              <button className="btn-gold" onClick={() => navigate('/')}>Ir al login</button>
            </div>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <h2 className="login-title">Nueva contraseña</h2>

            <div className="form-group">
              <label className="form-label">Nueva contraseña</label>
              <input className="input-field" type="password" value={form.new_password}
                onChange={e => update('new_password', e.target.value)}
                required placeholder="Mínimo 6 caracteres" autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar contraseña</label>
              <input className="input-field" type="password" value={form.confirm}
                onChange={e => update('confirm', e.target.value)}
                required placeholder="Repetí la contraseña" />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button className="btn-gold login-btn" type="submit" disabled={loading}>
              {loading ? <span className="spinner"/> : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
