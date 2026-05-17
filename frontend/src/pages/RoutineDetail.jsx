import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import './RoutineDetail.css'

export default function RoutineDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [routine, setRoutine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingPeso, setEditingPeso] = useState(null)
  const [saving, setSaving] = useState(false)
  const [activeDay, setActiveDay] = useState(0)

  useEffect(() => {
    api.get(`/routines/${id}`)
      .then(({ data }) => { setRoutine(data); setLoading(false) })
      .catch(() => navigate('/dashboard'))
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
    if (!confirm('¿Eliminar este ejercicio?')) return
    try {
      await api.delete(`/exercises/${exId}`)
      setRoutine(prev => ({
        ...prev,
        dias: prev.dias.map(d => ({ ...d, ejercicios: d.ejercicios.filter(ej => ej.id !== exId) }))
      }))
    } catch { alert('Error') }
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
            <div className="entrada-calor card">
              <div className="entrada-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Entrada en calor
              </div>
              <p className="entrada-text">{currentDay.entrada_calor}</p>
            </div>
          )}

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
                      <td className="cell-ejercicio">{ej.nombre}</td>
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
                          <button className="btn-danger" style={{padding:'3px 8px',fontSize:11}} onClick={() => deleteExercise(ej.id)}>✕</button>
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
            <div className="finalizar-con card">
              <div className="entrada-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Finalizar con
              </div>
              <p className="entrada-text">{currentDay.finalizar_con}</p>
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

      {saving && (
        <div style={{position:'fixed',bottom:20,right:20,background:'var(--black-card)',border:'1px solid var(--gold-border)',borderRadius:8,padding:'8px 16px',fontSize:13,color:'var(--gold)',display:'flex',alignItems:'center',gap:8,zIndex:999}}>
          <div className="spinner" style={{width:14,height:14}}/> Guardando...
        </div>
      )}
    </div>
  )
}
