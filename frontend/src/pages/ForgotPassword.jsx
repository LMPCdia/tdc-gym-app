import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
    } catch (_) {}
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-container fade-in" style={{ maxWidth: 420 }}>
        <div className="login-logo">
          <div className="logo-hex"><span className="logo-tdc">TDC</span></div>
          <p className="logo-sub">TIEMPO DE CAMBIO</p>
          <p className="logo-gym">GYM &amp; FITNESS</p>
        </div>

        <h2 className="login-title">¿Olvidaste tu contraseña?</h2>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#2ecc71', marginBottom: 16 }}>
              Si existe una cuenta con ese email, te enviamos las instrucciones para restablecer tu contraseña.
            </p>
            <button className="btn-gold" onClick={() => navigate('/')}>Volver al inicio</button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <p className="muted small" style={{ marginBottom: 16 }}>
              Ingresá tu usuario TDC o email para recibir el link de recuperación.
            </p>
            <div className="form-group">
              <label className="form-label">Usuario TDC o Email</label>
              <input className="input-field" type="text" placeholder="apellidon0000@tdc.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <button className="btn-gold login-btn" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Enviar instrucciones'}
            </button>
            <button type="button" className="btn-ghost" style={{ width: '100%', marginTop: 8 }}
              onClick={() => navigate('/')}>
              Volver
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
