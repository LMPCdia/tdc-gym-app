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

  // Crear profesor modal
  const [showProfeForm, setShowProfeForm] = useState(false)
  const [profeForm, setProfeForm] = useState({ nombre_completo: '', email: '' })
  const [profeLoading, setProfeLoading] = useState(false)
  const [profeError, setProfeError] = useState('')
  const [profeSuccess, setProfeSuccess] = useState('')

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

  const handleCrearProfesor = async (e) => {
    e.preventDefault()
    setProfeError(''); setProfeLoading(true); setProfeSuccess('')
    try {
      const { data } = await api.post('/auth/create-profesor', profeForm)
      setProfeSuccess(`Profesor ${data.name} creado. Se envió el email con credenciales a ${data.email}.`)
      setProfeForm({ nombre_completo: '', email: '' })
    } catch (err) {
      setProfeError(err.response?.data?.detail || 'Error al crear profesor')
    } finally {
      setProfeLoading(false)
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
        {user?.role === 'profesor' ? (
          <div style={{display:'flex',gap:10}}>
            <button className="btn-outline" onClick={() => navigate('/alumnos')}>
              Alumnos
            </button>
            <button className="btn-gold" onClick={() => navigate('/routines/new')}>
              + Nueva rutina
            </button>
          </div>
        ) : (
          <button className="btn-outline" onClick={() => navigate('/mis-mediciones')}>
            📊 Mis mediciones
          </button>
        )}
      </div>

      {/* Panel Crear Profesor — solo visible para profesores */}
      {user?.role === 'profesor' && (
        <div className="card" style={{marginBottom:24,padding:'16px 20px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontWeight:600,fontSize:14,color:'var(--gold)'}}>Gestión de profesores</span>
            <button
              className="btn-ghost"
              style={{fontSize:13}}
              onClick={() => { setShowProfeForm(v => !v); setProfeError(''); setProfeSuccess('') }}
            >
              {showProfeForm ? 'Cerrar' : '+ Agregar profesor'}
            </button>
          </div>

          {showProfeForm && (
            <form onSubmit={handleCrearProfesor} style={{marginTop:16}}>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                <div className="form-group" style={{flex:1,minWidth:160}}>
                  <label className="form-label">Nombre completo</label>
                  <input
                    className="input-field"
                    value={profeForm.nombre_completo}
                    onChange={e => setProfeForm(p => ({...p, nombre_completo: e.target.value}))}
                    required placeholder="Ej: Carlos García"
                  />
                </div>
                <div className="form-group" style={{flex:1,minWidth:160}}>
                  <label className="form-label">Email</label>
                  <input
                    className="input-field"
                    type="email"
                    value={profeForm.email}
                    onChange={e => setProfeForm(p => ({...p, email: e.target.value}))}
                    required placeholder="profe@email.com"
                  />
                </div>
                <div style={{display:'flex',alignItems:'flex-end',paddingBottom:1}}>
                  <button type="submit" className="btn-gold" disabled={profeLoading} style={{height:42}}>
                    {profeLoading ? <span className="spinner"/> : 'Crear'}
                  </button>
                </div>
              </div>
              {profeError && <div className="login-error" style={{marginTop:8}}>{profeError}</div>}
              {profeSuccess && <div style={{marginTop:8,color:'#4ade80',fontSize:13}}>{profeSuccess}</div>}
            </form>
          )}
        </div>
      )}

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
