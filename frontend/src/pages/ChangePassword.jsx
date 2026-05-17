import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import PasswordStrength from '../components/PasswordStrength'

export default function ChangePassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        current_password: form.current_password,
        new_password: form.new_password,
      })
      setSuccess('Contraseña actualizada correctamente.')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-container fade-in" style={{ maxWidth: 420 }}>
        <h2 className="login-title">Cambiar contraseña</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Contraseña actual</label>
            <input className="input-field" type="password" value={form.current_password}
              onChange={e => setForm({ ...form, current_password: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Nueva contraseña</label>
            <input className="input-field" type="password" value={form.new_password}
              onChange={e => setForm({ ...form, new_password: e.target.value })} required />
            <PasswordStrength password={form.new_password} />
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar nueva contraseña</label>
            <input className="input-field" type="password" value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })} required />
          </div>

          {error && <div className="login-error">{error}</div>}
          {success && <div style={{ color: '#2ecc71', fontSize: 14, textAlign: 'center', marginBottom: 8 }}>{success}</div>}

          <button className="btn-gold login-btn" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Actualizar contraseña'}
          </button>

          <button type="button" className="btn-ghost" style={{ width: '100%', marginTop: 8 }}
            onClick={() => navigate('/dashboard')}>
            Cancelar
          </button>
        </form>
      </div>
    </div>
  )
}
