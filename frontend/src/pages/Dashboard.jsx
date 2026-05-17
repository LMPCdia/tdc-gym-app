import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  const fetchRoutines = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/routines')
      setRoutines(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRoutines() }, [])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar esta rutina?')) return
    setDeleting(id)
    try {
      await api.delete(`/routines/${id}`)
      setRoutines(prev => prev.filter(r => r.id !== id))
    } catch (e) {
      alert('Error al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">
            {user?.role === 'profesor' ? 'Rutinas de alumnos' : 'Mis rutinas'}
          </h1>
          <p className="muted small">{routines.length} rutina{routines.length !== 1 ? 's' : ''} encontrada{routines.length !== 1 ? 's' : ''}</p>
        </div>
        {user?.role === 'profesor' && (
          <button className="btn-gold" onClick={() => navigate('/routines/new')}>
            + Nueva rutina
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : routines.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">💪</div>
          <h3>No hay rutinas</h3>
          {user?.role === 'profesor' && (
            <p className="muted">Creá la primera rutina para un alumno</p>
          )}
        </div>
      ) : (
        <div className="routines-grid">
          {routines.map(r => (
            <div
              key={r.id}
              className="routine-card card"
              onClick={() => navigate(`/routines/${r.id}`)}
            >
              <div className="routine-card-top">
                <span className="tag">{r.objetivo}</span>
                {user?.role === 'profesor' && (
                  <button
                    className="btn-danger"
                    onClick={e => handleDelete(r.id, e)}
                    disabled={deleting === r.id}
                    style={{ padding: '4px 10px', fontSize: 12 }}
                  >
                    {deleting === r.id ? '...' : 'Eliminar'}
                  </button>
                )}
              </div>

              <h3 className="routine-name">{r.nombre}</h3>

              {user?.role === 'profesor' && r.alumno_nombre && (
                <p className="routine-alumno">
                  <span className="muted">Alumno:</span> {r.alumno_nombre}
                </p>
              )}

              <div className="routine-meta">
                {r.inicio && (
                  <span className="meta-chip">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {r.inicio}
                  </span>
                )}
                <span className="meta-chip arrow-chip">
                  Ver detalle →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
