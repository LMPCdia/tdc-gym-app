import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import './Login.css'
import './Register.css'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ apellido: '', nombre: '', dni: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      setSuccess(data.message)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al registrarse')
    } finally { setLoading(false) }
  }

  const tdcPreview = () => {
    if (!form.apellido || !form.nombre || form.dni.length < 4) return null
    const ap = form.apellido.toLowerCase().replace(/\s/g, '')
    const ini = form.nombre[0].toLowerCase()
    const d = form.dni.replace(/\D/g, '')
    if (d.length < 4) return null
    return `${ap}${ini}${d.slice(0,2)}${d.slice(-2)}@tdc.com`
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

        {success ? (
          <div className="success-card card">
            <div className="success-icon">📧</div>
            <h3>¡Revisá tu email!</h3>
            <p className="muted">{success}</p>
            <p className="muted small">Chequeá también la carpeta de spam.</p>
            <div className="success-actions">
              <button className="btn-gold" onClick={() => navigate('/')}>Ir al login</button>
            </div>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <h2 className="login-title">Crear cuenta</h2>

            <div className="register-name-row form-row" style={{display:'flex',gap:12}}>
              <div className="form-group" style={{flex:1}}>
                <label className="form-label">Apellido</label>
                <input className="input-field" value={form.apellido}
                  onChange={e => update('apellido', e.target.value)}
                  required placeholder="Ej: Morel Penco" autoFocus />
              </div>
              <div className="form-group" style={{flex:1}}>
                <label className="form-label">Nombre</label>
                <input className="input-field" value={form.nombre}
                  onChange={e => update('nombre', e.target.value)}
                  required placeholder="Ej: Lautaro" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">DNI</label>
              <input className="input-field" value={form.dni}
                onChange={e => update('dni', e.target.value.replace(/\D/g, ''))}
                required placeholder="Sin puntos ni guiones" maxLength={9}
                inputMode="numeric" />
              {tdcPreview() && (
                <span className="field-hint">
                  Tu usuario TDC será: <strong style={{color:'var(--gold)'}}>{tdcPreview()}</strong>
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Email personal</label>
              <input className="input-field" type="email" value={form.email}
                onChange={e => update('email', e.target.value)}
                required placeholder="tu@email.com" />
              <span className="field-hint">Recibirás el link de verificación acá</span>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button className="btn-gold login-btn" type="submit" disabled={loading}>
              {loading ? <span className="spinner"/> : 'Crear cuenta'}
            </button>

            <div className="register-link">
              <span className="muted small">¿Ya tenés cuenta?</span>
              <Link to="/" className="gold-text small">Iniciar sesión</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
