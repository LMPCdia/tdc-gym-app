import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Alumnos() {
  const navigate = useNavigate()
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [resending, setResending] = useState(null)

  useEffect(() => {
    api.get('/users')
      .then(({ data }) => setAlumnos(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleResend = async (a) => {
    if (!confirm(`¿Reenviar credenciales a ${a.email}?\nSe generará una nueva contraseña.`)) return
    setResending(a.id)
    try {
      await api.post(`/auth/resend-credentials/${a.id}`)
      alert(`Credenciales reenviadas a ${a.email}`)
    } catch {
      alert('Error al reenviar')
    } finally {
      setResending(null)
    }
  }

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <div>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{marginBottom:8}}>← Volver</button>
          <h1 className="page-title">Alumnos</h1>
          <p className="muted small">{alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" style={{width:32,height:32}}/></div>
      ) : alumnos.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">👤</div>
          <h3>No hay alumnos registrados</h3>
        </div>
      ) : (
        <div className="routines-grid">
          {alumnos.map(a => (
            <div key={a.id} className="routine-card card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <h3 className="routine-name" style={{marginBottom:4}}>{a.name}</h3>
                  <p className="muted small" style={{color:'var(--gold)'}}>{a.tdc_email}</p>
                  {a.dni && <p className="muted small">DNI: {a.dni}</p>}
                  <p className="muted small">{a.email}</p>
                </div>
              </div>
              <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
                <button
                  className="btn-gold"
                  style={{width:'100%',fontSize:13}}
                  onClick={() => navigate(`/alumnos/${a.id}/mediciones`)}
                >
                  Ver mediciones
                </button>
                <button
                  className="btn-outline"
                  style={{width:'100%',fontSize:12}}
                  disabled={resending === a.id}
                  onClick={() => handleResend(a)}
                >
                  {resending === a.id ? 'Enviando...' : 'Reenviar credenciales'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
