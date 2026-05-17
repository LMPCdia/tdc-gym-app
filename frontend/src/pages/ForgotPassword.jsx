import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './Login.css'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setError('Error al procesar la solicitud')
    } finally {
      setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-bg"><div className="login-bg-hex"/></div>
      <div className="login-container fade-in">
        <div className="login-logo">
          <div className="logo-hex"><span className="logo-tdc">TDC</span></div>
          <p className="logo-sub">TIEMPO DE CAMBIO</p>
          <p className="logo-gym">GYM &amp; FITNESS</p>
        </div>

        {sent ? (
          <div className="success-card card">
            <div className="success-icon">📧</div>
            <h3>Revisá tu email</h3>
            <p className="muted">Si el usuario existe, te enviamos un link para restablecer tu contraseña.</p>
            <p className="muted small">Chequeá también la carpeta de spam.</p>
            <div className="success-actions">
              <button className="btn-gold" onClick={() => navigate('/')}>Ir al login</button>
            </div>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <h2 className="login-title">Recuperar contraseña</h2>
            <p className="muted small" style={{marginBottom:16}}>
              Ingresá tu email personal o tu usuario TDC y te mandamos un link para crear una nueva contraseña.
            </p>

            <div className="form-group">
              <label className="form-label">Email o usuario TDC</label>
              <input className="input-field" type="text" value={email}
                onChange={e => setEmail(e.target.value)}
                required placeholder="tu@email.com o usuario@tdc.com" autoFocus />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button className="btn-gold login-btn" type="submit" disabled={loading}>
              {loading ? <span className="spinner"/> : 'Enviar link'}
            </button>

            <button type="button" className="btn-ghost login-btn" onClick={() => navigate('/')}>
              Volver al login
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
