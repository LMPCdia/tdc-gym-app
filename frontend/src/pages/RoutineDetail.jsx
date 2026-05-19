import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import './RoutineDetail.css'

function parseItems(text) {
  return (text || '').split('|').map(s => s.trim()).filter(Boolean)
}

function ConfirmDeleteModal({ nombre, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
        <h3 className="modal-title">Eliminar ejercicio</h3>
        <p className="modal-desc">
          ¿Estás seguro que querés eliminar <strong>{nombre}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="modal-actions">
          <button className="btn-ghost modal-btn-cancel" onClick={onCancel}>Cancelar</button>
          <button className="modal-btn-delete" onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}

export default function RoutineDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [routine, setRoutine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingPeso, setEditingPeso] = useState(null)
  const [saving, setSaving] = useState(false)
  const [activeDay, setActiveDay] = useState(0)
  const [deleteModal, setDeleteModal] = useState({ open: false, exId: null, nombre: '' })
  const [urlMap, setUrlMap] = useState({})

  useEffect(() => {
    api.get(`/routines/${id}`)
      .then(({ data }) => { setRoutine(data); setLoading(false) })
      .catch(() => navigate('/dashboard'))
    api.get('/exercise-catalog')
      .then(({ data }) => {
        const map = {}
        data.forEach(e => { map[e.nombre.toLowerCase().trim()] = e.youtube_url || null })
        data.forEach(e => { if (e.youtube_url) map[e.nombre.toLowerCase().trim()] = e.youtube_url })
        setUrlMap(map)
      })
      .catch(() => {})
  }, [id])

  const startEdit = (ws) => setEditingPeso({ wsId: ws.id, value: ws.peso != null ? String(ws.peso) : '' })

  const saveEdit = async (wsId) => {
    if (!editingPeso || editingPeso.wsId !== wsId) return
    setSaving(true)
    try {
      const peso = editingPeso.value === '' ? null : parseFloat(editingPeso.value)
      await api.patch(`/weeksets/${wsId}/peso`, { peso })
      setRoutine(prev => ({
        ...prev,
        dias: prev.dias.map(d => ({
          ...d,
          ejercicios: d.ejercicios.map(ej => ({
            ...ej,
            semanas: ej.semanas.map(ws => ws.id === wsId ? { ...ws, peso } : ws)
          }))
        }))
      }))
    } catch (e) { console.error(e) }
    finally { setSaving(false); setEditingPeso(null) }
  }

  const deleteExercise = async (exId) => {
    try {
      await api.delete(`/exercises/${exId}`)
      setRoutine(prev => ({
        ...prev,
        dias: prev.dias.map(d => ({ ...d, ejercicios: d.ejercicios.filter(ej => ej.id !== exId) }))
      }))
    } catch { alert('Error al eliminar') }
    setDeleteModal({ open: false, exId: null, nombre: '' })
  }

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:80}}><div className="spinner" style={{width:36,height:36}}/></div>
  if (!routine) return null

  const currentDay = routine.dias[activeDay]

  return (
    <div className="routine-detail fade-in">
      {/* Header */}
      <div className="detail-header">
        <button className="btn-ghost back-btn" onClick={() => navigate('/dashboard')}>← Volver</button>
        <div className="detail-title-block">
          <div className="detail-tags">
            <span className="tag">{routine.objetivo}</span>
            {routine.inicio && <span className="muted small">Desde {routine.inicio}</span>}
            {user?.role === 'profesor' && routine.alumno_nombre && <span className="muted small">· {routine.alumno_nombre}</span>}
          </div>
          <h1 className="detail-title">{routine.nombre}</h1>
        </div>
        {user?.role === 'profesor' && (
          <button className="btn-outline" onClick={() => navigate(`/routines/${id}/edit`)}>Editar rutina</button>
        )}
      </div>

      {/* Day tabs */}
      <div className="day-tabs">
        {routine.dias.map((day, i) => (
          <button key={day.id} className={`day-tab ${activeDay === i ? 'active' : ''}`} onClick={() => setActiveDay(i)}>
            <span className="day-number">DÍA {day.numero}</span>
            {day.nombre && <span className="day-name">{day.nombre}</span>}
          </button>
        ))}
      </div>

      {currentDay && (
        <div className="day-content">
          {/* Musculatura */}
          {currentDay.musculatura && (
            <div className="musculatura-banner">
              <span className="musculatura-label">MUSCULATURA</span>
              <span className="musculatura-value">{currentDay.musculatura}</span>
            </div>
          )}

          {/* Entrada en calor */}
          {currentDay.entrada_calor && (
            <div className="entrada-calor">
              <div className="warmup-header">
                <div className="warmup-badge warmup-badge--fire">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  ENTRADA EN CALOR
                </div>
              </div>
              <ul className="warmup-list">
                {parseItems(currentDay.entrada_calor).map((item, i) => (
                  <li key={i} className="warmup-item warmup-item--fire">
                    <span className="warmup-bullet warmup-bullet--fire">{i + 1}</span>
                    <span className="warmup-text">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Scroll hint visible solo en mobile */}
          <div className="table-scroll-hint">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            deslizá la tabla
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>

          {/* Exercises table - formato Excel */}
          <div className="exercises-table-wrap">
            <table className="exercises-table">
              <thead>
                <tr>
                  <th className="col-num">#</th>
                  <th className="col-ejercicio">EJERCICIO</th>
                  <th className="col-sem">SEM 1</th>
                  <th className="col-carga">CARGA</th>
                  <th className="col-sem">SEM 2</th>
                  <th className="col-carga">CARGA</th>
                  <th className="col-sem">SEM 3</th>
                  <th className="col-carga">CARGA</th>
                  <th className="col-sem">SEM 4</th>
                  <th className="col-carga">CARGA</th>
                  {user?.role === 'profesor' && <th className="col-action"></th>}
                </tr>
              </thead>
              <tbody>
                {currentDay.ejercicios.length === 0 && (
                  <tr><td colSpan={user?.role === 'profesor' ? 11 : 10} style={{textAlign:'center',padding:'24px',color:'var(--gray)',fontStyle:'italic'}}>Sin ejercicios</td></tr>
                )}
                {currentDay.ejercicios.map((ej, idx) => {
                  const semMap = {}
                  ej.semanas.forEach(ws => { semMap[ws.semana] = ws })
                  return (
                    <tr key={ej.id} className="exercise-row">
                      <td className="cell-num">{idx + 1}</td>
                      <td className="cell-ejercicio">
                        {(() => {
                          const videoUrl = urlMap[ej.nombre.toLowerCase().trim()]
                          return videoUrl ? (
                            <a
                              className="exercise-link"
                              href={videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver video en YouTube"
                            >
                              {ej.nombre}
                              <svg className="yt-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
                              </svg>
                            </a>
                          ) : ej.nombre
                        })()}
                      </td>
                      {[1,2,3,4].map(sem => {
                        const ws = semMap[sem]
                        return [
                          <td key={`sr${sem}`} className="cell-sem">{ws?.series_reps || <span className="cell-empty">—</span>}</td>,
                          <td key={`cg${sem}`} className="cell-carga">
                            {ws ? (
                              editingPeso?.wsId === ws.id ? (
                                <input
                                  className="peso-cell-input"
                                  type="number" step="0.5" min="0"
                                  value={editingPeso.value}
                                  onChange={e => setEditingPeso({ wsId: ws.id, value: e.target.value })}
                                  onBlur={() => saveEdit(ws.id)}
                                  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingPeso(null) }}
                                  autoFocus
                                />
                              ) : (
                                <button
                                  className={`peso-cell ${ws.peso != null ? 'has-peso' : 'no-peso'}`}
                                  onClick={() => startEdit(ws)}
                                  title="Clic para editar peso"
                                >
                                  {ws.peso != null ? `${ws.peso}` : <span className="peso-dot">·</span>}
                                </button>
                              )
                            ) : <span className="cell-empty">—</span>}
                          </td>
                        ]
                      })}
                      {user?.role === 'profesor' && (
                        <td className="cell-action">
                          <button className="btn-danger" style={{padding:'3px 8px',fontSize:11}}
                            onClick={() => setDeleteModal({ open: true, exId: ej.id, nombre: ej.nombre })}>✕</button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Finalizar con */}
          {currentDay.finalizar_con && (
            <div className="finalizar-con">
              <div className="warmup-header">
                <div className="warmup-badge warmup-badge--cool">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22V12m0 0C12 7 7 4 2 6m10 6c0-5 5-8 10-6" />
                    <path d="M5 20c2-2 4.5-3 7-3s5 1 7 3" />
                  </svg>
                  ELONGACIONES / FINALIZAR
                </div>
              </div>
              <ul className="warmup-list">
                {parseItems(currentDay.finalizar_con).map((item, i) => (
                  <li key={i} className="warmup-item warmup-item--cool">
                    <span className="warmup-bullet warmup-bullet--cool">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="warmup-text warmup-text--cool">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {user?.role === 'profesor' && (
            <button className="btn-outline add-exercise-btn"
              onClick={() => navigate(`/routines/${id}/days/${currentDay.id}/add-exercise`)}>
              + Agregar ejercicio al Día {currentDay.numero}
            </button>
          )}
        </div>
      )}

      {deleteModal.open && (
        <ConfirmDeleteModal
          nombre={deleteModal.nombre}
          onConfirm={() => deleteExercise(deleteModal.exId)}
          onCancel={() => setDeleteModal({ open: false, exId: null, nombre: '' })}
        />
      )}

      {saving && (
        <div style={{position:'fixed',bottom:20,right:20,background:'var(--black-card)',border:'1px solid var(--gold-border)',borderRadius:8,padding:'8px 16px',fontSize:13,color:'var(--gold)',display:'flex',alignItems:'center',gap:8,zIndex:999}}>
          <div className="spinner" style={{width:14,height:14}}/> Guardando...
        </div>
      )}
    </div>
  )
}
