import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Alumnos() {
  const navigate = useNavigate()
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users')
      .then(({ data }) => setAlumnos(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
                  <p className="muted small">{a.tdc_email}</p>
                  {a.dni && <p className="muted small">DNI: {a.dni}</p>}
                </div>
              </div>
              <div style={{marginTop:12}}>
                <button
                  className="btn-gold"
                  style={{width:'100%',fontSize:13}}
                  onClick={() => navigate(`/alumnos/${a.id}/mediciones`)}
                >
                  Ver mediciones
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
