import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(email, password)
    if (result.ok) {
      navigate('/dashboard')
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-hex" />
      </div>

      <div className="login-container fade-in">
        <div className="login-logo">
          <div className="logo-hex">
            <span className="logo-tdc">TDC</span>
          </div>
          <p className="logo-sub">TIEMPO DE CAMBIO</p>
          <p className="logo-gym">GYM &amp; FITNESS</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-title">Ingresar</h2>

          <div className="form-group">
            <label className="form-label">Usuario TDC</label>
            <input
              className="input-field"
              type="text"
              placeholder="usuario@tdc.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
            <span className="field-hint">Usá el usuario que recibiste por email (ej: apellidon0000@tdc.com)</span>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="btn-gold login-btn" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Entrar'}
          </button>

          <div className="login-demo">
            <p className="muted small">Accesos de prueba:</p>
            <div className="demo-chips">
              <button type="button" className="demo-chip" onClick={() => { setEmail('profe@tdc.com'); setPassword('profe123') }}>
                👨‍🏫 Profesor
              </button>
              <button type="button" className="demo-chip" onClick={() => { setEmail('ivan@tdc.com'); setPassword('ivan123') }}>
                🏋️ Ivan Gamarra
              </button>
            </div>
          </div>

          <div className="login-register-link">
            <span className="muted small">¿Sos nuevo en TDC?</span>
            <a href="/tdc-gym/register" className="gold-text small" style={{fontFamily:'var(--font-cond)',fontWeight:600,letterSpacing:'0.05em'}}>Crear cuenta</a>
          </div>
        </form>
      </div>
    </div>
  )
}
