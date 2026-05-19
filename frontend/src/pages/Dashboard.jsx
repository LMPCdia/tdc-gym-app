import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import './Dashboard.css'
import './RoutineDetail.css'

function parseItems(text) {
  return text.split('|').map(s => s.trim()).filter(Boolean)
}

function StatsPanel({ userId }) {
  const navigate = useNavigate()
  const [mediciones, setMediciones] = useState([])

  useEffect(() => {
    if (!userId) return
    api.get(`/users/${userId}/measurements`)
      .then(({ data }) => setMediciones(data))
      .catch(() => {})
  }, [userId])

  const last = mediciones[0]
  const prev = mediciones[1]

  const trend = (key) => {
    if (!last || !prev || last[key] == null || prev[key] == null) return null
    return +(last[key] - prev[key]).toFixed(1)
  }

  const TrendBadge = ({ val, invertGood = false }) => {
    if (val == null || val === 0) return null
    const isGood = invertGood ? val < 0 : val > 0
    return (
      <span className={`stat-trend ${isGood ? 'good' : 'warn'}`}>
        {val > 0 ? '▲' : '▼'} {Math.abs(val)}
      </span>
    )
  }

  return (
    <aside className="stats-panel">
      <div>
        <div className="stats-header">📊 SEGUIMIENTO</div>
        <div className="stats-subheader">Últimas mediciones</div>
      </div>

      {last ? (
        <>
          {last.peso != null && (
            <div className="stat-card">
              <span className="stat-label">Peso actual</span>
              <span className="stat-value">{last.peso} kg</span>
              <TrendBadge val={trend('peso')} invertGood />
            </div>
          )}
          {last.masa_muscular != null && (
            <div className="stat-card">
              <span className="stat-label">Masa muscular</span>
              <span className="stat-value">{last.masa_muscular}%</span>
              <TrendBadge val={trend('masa_muscular')} />
            </div>
          )}
          {last.masa_grasa != null && (
            <div className="stat-card">
              <span className="stat-label">% Grasa</span>
              <span className="stat-value">{last.masa_grasa}%</span>
              <TrendBadge val={trend('masa_grasa')} invertGood />
            </div>
          )}
          {last.imc != null && (
            <div className="stat-card">
              <span className="stat-label">I.M.C</span>
              <span className="stat-value">{last.imc}</span>
              <TrendBadge val={trend('imc')} invertGood />
            </div>
          )}
          <p className="stats-disclaimer">Última medición: {last.fecha}</p>
        </>
      ) : (
        <p className="stats-disclaimer">Sin mediciones registradas aún</p>
      )}

      <button
        className="btn-outline"
        style={{ width: '100%', marginTop: 4 }}
        onClick={() => navigate('/mis-mediciones')}
      >
        Ver mis mediciones →
      </button>
    </aside>
  )
}

function AlumnoInlineRoutine({ detail, activeDay, setActiveDay, editingPeso, setEditingPeso, saving, setSaving, setDetail }) {
  const currentDay = detail.dias[activeDay]

  const startEdit = (ws) => setEditingPeso({ wsId: ws.id, value: ws.peso != null ? String(ws.peso) : '' })

  const saveEdit = async (wsId) => {
    if (!editingPeso || editingPeso.wsId !== wsId) return
    setSaving(true)
    try {
      const peso = editingPeso.value === '' ? null : parseFloat(editingPeso.value)
      await api.patch(`/weeksets/${wsId}/peso`, { peso })
      setDetail(prev => ({
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

  return (
    <div className="day-content">
      <div className="inline-routine-header">
        <div className="inline-routine-tags">
          <span className="tag">{detail.objetivo}</span>
          {detail.inicio && <span className="muted small">Desde {detail.inicio}</span>}
        </div>
        <h2 className="inline-routine-title">{detail.nombre}</h2>
      </div>

      <div className="day-tabs">
        {detail.dias.map((day, i) => (
          <button
            key={day.id}
            className={`day-tab ${activeDay === i ? 'active' : ''}`}
            onClick={() => setActiveDay(i)}
          >
            <span className="day-number">DÍA {day.numero}</span>
            {day.nombre && <span className="day-name">{day.nombre}</span>}
          </button>
        ))}
      </div>

      {currentDay && (
        <>
          {currentDay.musculatura && (
            <div className="musculatura-banner">
              <span className="musculatura-label">MUSCULATURA</span>
              <span className="musculatura-value">{currentDay.musculatura}</span>
            </div>
          )}

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

          <div className="table-scroll-hint">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            deslizá la tabla
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>

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
                </tr>
              </thead>
              <tbody>
                {currentDay.ejercicios.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: 'var(--gray)', fontStyle: 'italic' }}>
                      Sin ejercicios
                    </td>
                  </tr>
                )}
                {currentDay.ejercicios.map((ej, idx) => {
                  const semMap = {}
                  ej.semanas.forEach(ws => { semMap[ws.semana] = ws })
                  return (
                    <tr key={ej.id} className="exercise-row">
                      <td className="cell-num">{idx + 1}</td>
                      <td className="cell-ejercicio">{ej.nombre}</td>
                      {[1, 2, 3, 4].map(sem => {
                        const ws = semMap[sem]
                        return [
                          <td key={`sr${sem}`} className="cell-sem">
                            {ws?.series_reps || <span className="cell-empty">—</span>}
                          </td>,
                          <td key={`cg${sem}`} className="cell-carga">
                            {ws ? (
                              editingPeso?.wsId === ws.id ? (
                                <input
                                  className="peso-cell-input"
                                  type="number" step="0.5" min="0"
                                  value={editingPeso.value}
                                  onChange={e => setEditingPeso({ wsId: ws.id, value: e.target.value })}
                                  onBlur={() => saveEdit(ws.id)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') e.target.blur()
                                    if (e.key === 'Escape') setEditingPeso(null)
                                  }}
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
                            ) : (
                              <span className="cell-empty">—</span>
                            )}
                          </td>
                        ]
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

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
        </>
      )}

      {saving && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'var(--black-card)', border: '1px solid var(--gold-border)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 999 }}>
          <div className="spinner" style={{ width: 14, height: 14 }} /> Guardando...
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  // Profesor: crear profesor panel
  const [showProfeForm, setShowProfeForm] = useState(false)
  const [profeForm, setProfeForm] = useState({ nombre_completo: '', email: '' })
  const [profeLoading, setProfeLoading] = useState(false)
  const [profeError, setProfeError] = useState('')
  const [profeSuccess, setProfeSuccess] = useState('')

  // Alumno: inline routine view
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activeDay, setActiveDay] = useState(0)
  const [editingPeso, setEditingPeso] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchRoutines() }, [])

  useEffect(() => {
    if (user?.role === 'alumno' && routines.length > 0 && !selectedId) {
      selectRoutine(routines[0].id)
    }
  }, [routines])

  const fetchRoutines = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/routines')
      setRoutines(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const selectRoutine = async (id) => {
    setSelectedId(id)
    setActiveDay(0)
    setEditingPeso(null)
    setLoadingDetail(true)
    try {
      const { data } = await api.get(`/routines/${id}`)
      setDetail(data)
    } catch (e) { console.error(e) }
    finally { setLoadingDetail(false) }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar esta rutina?')) return
    setDeleting(id)
    try {
      await api.delete(`/routines/${id}`)
      setRoutines(prev => prev.filter(r => r.id !== id))
    } catch { alert('Error al eliminar') }
    finally { setDeleting(null) }
  }

  const handleCrearProfesor = async (e) => {
    e.preventDefault()
    setProfeError(''); setProfeLoading(true); setProfeSuccess('')
    try {
      const { data } = await api.post('/auth/create-profesor', profeForm)
      setProfeSuccess(`Profesor ${data.name} creado. Se envió el email a ${data.email}.`)
      setProfeForm({ nombre_completo: '', email: '' })
    } catch (err) {
      setProfeError(err.response?.data?.detail || 'Error al crear profesor')
    } finally { setProfeLoading(false) }
  }

  // ── PROFESOR VIEW ────────────────────────────────────────
  if (user?.role === 'profesor') {
    return (
      <div className="dashboard fade-in">
        <div className="dashboard-header">
          <div>
            <h1 className="page-title">Rutinas de alumnos</h1>
            <p className="muted small">{routines.length} rutina{routines.length !== 1 ? 's' : ''} encontrada{routines.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-outline" onClick={() => navigate('/alumnos')}>Alumnos</button>
            <button className="btn-gold" onClick={() => navigate('/routines/new')}>+ Nueva rutina</button>
          </div>
        </div>

        {/* Crear profesor */}
        <div className="card" style={{ marginBottom: 8, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--gold)' }}>Gestión de profesores</span>
            <button className="btn-ghost" style={{ fontSize: 13 }}
              onClick={() => { setShowProfeForm(v => !v); setProfeError(''); setProfeSuccess('') }}>
              {showProfeForm ? 'Cerrar' : '+ Agregar profesor'}
            </button>
          </div>
          {showProfeForm && (
            <form onSubmit={handleCrearProfesor} style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                  <label className="form-label">Nombre completo</label>
                  <input className="input-field" value={profeForm.nombre_completo}
                    onChange={e => setProfeForm(p => ({ ...p, nombre_completo: e.target.value }))}
                    required placeholder="Ej: Carlos García" />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                  <label className="form-label">Email</label>
                  <input className="input-field" type="email" value={profeForm.email}
                    onChange={e => setProfeForm(p => ({ ...p, email: e.target.value }))}
                    required placeholder="profe@email.com" />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 1 }}>
                  <button type="submit" className="btn-gold" disabled={profeLoading} style={{ height: 42 }}>
                    {profeLoading ? <span className="spinner" /> : 'Crear'}
                  </button>
                </div>
              </div>
              {profeError && <div className="login-error" style={{ marginTop: 8 }}>{profeError}</div>}
              {profeSuccess && <div style={{ marginTop: 8, color: 'var(--success)', fontSize: 13 }}>{profeSuccess}</div>}
            </form>
          )}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
        ) : routines.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">💪</div>
            <h3>No hay rutinas</h3>
            <p className="muted">Creá la primera rutina para un alumno</p>
          </div>
        ) : (
          <div className="routines-grid">
            {routines.map(r => (
              <div key={r.id} className="routine-card card" onClick={() => navigate(`/routines/${r.id}`)}>
                <div className="routine-card-top">
                  <span className="tag">{r.objetivo}</span>
                  <button className="btn-danger" onClick={e => handleDelete(r.id, e)}
                    disabled={deleting === r.id} style={{ padding: '4px 10px', fontSize: 12 }}>
                    {deleting === r.id ? '...' : 'Eliminar'}
                  </button>
                </div>
                <h3 className="routine-name">{r.nombre}</h3>
                {r.alumno_nombre && (
                  <p className="routine-alumno"><span className="muted">Alumno:</span> {r.alumno_nombre}</p>
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
                  <span className="meta-chip arrow-chip">Ver detalle →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── ALUMNO VIEW — 3-column layout ────────────────────────
  return (
    <div className="alumno-layout">
      {/* LEFT: sidebar */}
      <aside className="routine-sidebar">
        <div className="sidebar-header">MIS RUTINAS</div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <div className="spinner" style={{ width: 24, height: 24 }} />
          </div>
        ) : routines.length === 0 ? (
          <div style={{ padding: '20px 14px', color: 'var(--gray)', fontSize: 12, fontFamily: 'var(--font-cond)' }}>
            Sin rutinas asignadas
          </div>
        ) : (
          routines.map(r => (
            <div key={r.id}
              className={`sidebar-item ${selectedId === r.id ? 'active' : ''}`}
              onClick={() => selectRoutine(r.id)}
            >
              <span className="sidebar-item-name">{r.nombre}</span>
              <div className="sidebar-item-meta">
                <span className="tag" style={{ fontSize: 10 }}>{r.objetivo}</span>
                {r.inicio && <span>{r.inicio}</span>}
              </div>
            </div>
          ))
        )}
      </aside>

      {/* CENTER: inline routine detail */}
      <main className="routine-main">
        {/* Mobile: selector de rutina (reemplaza el sidebar) */}
        {routines.length > 0 && (
          <div className="mobile-routine-picker">
            <span className="mobile-routine-label">Mis rutinas</span>
            <select
              className="mobile-routine-select"
              value={selectedId || ''}
              onChange={e => selectRoutine(parseInt(e.target.value))}
            >
              {routines.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {loadingDetail ? (
          <div className="loading-center">
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : detail ? (
          <AlumnoInlineRoutine
            detail={detail}
            activeDay={activeDay}
            setActiveDay={setActiveDay}
            editingPeso={editingPeso}
            setEditingPeso={setEditingPeso}
            saving={saving}
            setSaving={setSaving}
            setDetail={setDetail}
          />
        ) : (
          <div className="inline-empty">
            <div className="inline-empty-icon">💪</div>
            <p>Seleccioná una rutina del panel izquierdo para verla aquí.</p>
          </div>
        )}
      </main>

      {/* RIGHT: stats panel with real data */}
      <StatsPanel userId={user?.id} />
    </div>
  )
}
