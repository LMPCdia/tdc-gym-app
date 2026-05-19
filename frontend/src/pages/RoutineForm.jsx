import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'
import ExerciseAutocomplete from '../components/ExerciseAutocomplete'
import './RoutineForm.css'
import './RoutineDetail.css'

const SEMANAS = [1, 2, 3, 4]
const MAX_DIAS = 6
const emptyWeekSets = () => SEMANAS.map(s => ({ semana: s, series_reps: '', peso: '' }))
const emptyExercise = (num) => ({ numero: num, nombre: '', semanas: emptyWeekSets() })
const emptyWarmupItem = () => ({ texto: '' })
const emptyDay = (num) => ({ numero: num, nombre: '', musculatura: '', entrada_calor: [emptyWarmupItem()], finalizar_con: [emptyWarmupItem()], ejercicios: [emptyExercise(1)] })

const warmupToString = (items) =>
  items.map(i => i.texto.trim()).filter(Boolean).join(' | ')

const stringToWarmup = (str) => {
  if (!str) return [emptyWarmupItem()]
  const parts = str.split('|').map(s => s.trim()).filter(Boolean)
  if (!parts.length) return [emptyWarmupItem()]
  return parts.map(p => ({ texto: p }))
}

function ConfirmRoutineModal({ onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-icon" style={{ background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', color: 'var(--gold)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h3 className="modal-title">Confirmar creación</h3>
        <p className="modal-desc">
          ¿Confirmar creación de la rutina?<br/>
          <span style={{ fontSize: 13, color: 'var(--gray)' }}>Verificá que los datos sean correctos antes de continuar.</span>
        </p>
        <div className="modal-actions">
          <button className="btn-ghost modal-btn-cancel" onClick={onCancel}>Cancelar</button>
          <button
            className="modal-btn-delete"
            style={{ background: 'var(--gold)', color: '#000' }}
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RoutineForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const [form, setForm] = useState({
    nombre: '', objetivo: 'Hipertrofia', inicio: '', alumno_id: '',
    dias: [emptyDay(1)]
  })

  useEffect(() => {
    api.get('/users').then(({ data }) => setAlumnos(data)).catch(() => {})
    if (!isEdit) {
      const hoy = new Date()
      const dia = hoy.getDate()
      const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
      const fecha = `${dia}-${meses[hoy.getMonth()]}`
      updateField('inicio', fecha)
    }
    if (isEdit) {
      setLoading(true)
      api.get(`/routines/${id}`).then(({ data }) => {
        setForm({
          nombre: data.nombre, objetivo: data.objetivo,
          inicio: data.inicio || '', alumno_id: data.alumno_id,
          dias: data.dias.map(d => ({
            ...d,
            musculatura: d.musculatura || '',
            entrada_calor: stringToWarmup(d.entrada_calor),
            finalizar_con: stringToWarmup(d.finalizar_con),
            ejercicios: d.ejercicios.map(ej => ({
              ...ej, semanas: ej.semanas.map(ws => ({ ...ws, peso: ws.peso ?? '' }))
            }))
          }))
        })
        setLoading(false)
      })
    }
  }, [id])

  const updateField = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const addDay = () => {
    if (form.dias.length >= MAX_DIAS) return
    setForm(f => ({ ...f, dias: [...f.dias, emptyDay(f.dias.length + 1)] }))
  }
  const removeDay = (di) => setForm(f => ({ ...f, dias: f.dias.filter((_, i) => i !== di) }))
  const updateDay = (di, field, val) => setForm(f => ({ ...f, dias: f.dias.map((d, i) => i === di ? { ...d, [field]: val } : d) }))
  const addExercise = (di) => setForm(f => ({ ...f, dias: f.dias.map((d, i) => i === di ? { ...d, ejercicios: [...d.ejercicios, emptyExercise(d.ejercicios.length + 1)] } : d) }))
  const removeExercise = (di, ei) => setForm(f => ({ ...f, dias: f.dias.map((d, i) => i === di ? { ...d, ejercicios: d.ejercicios.filter((_, j) => j !== ei) } : d) }))
  const updateExerciseName = (di, ei, val) => setForm(f => ({ ...f, dias: f.dias.map((d, i) => i === di ? { ...d, ejercicios: d.ejercicios.map((ej, j) => j === ei ? { ...ej, nombre: val } : ej) } : d) }))
  const updateWeekSet = (di, ei, si, field, val) => setForm(f => ({ ...f, dias: f.dias.map((d, i) => i === di ? { ...d, ejercicios: d.ejercicios.map((ej, j) => j === ei ? { ...ej, semanas: ej.semanas.map((ws, k) => k === si ? { ...ws, [field]: val } : ws) } : ej) } : d) }))

  const addWarmupItem = (di, field) => setForm(f => ({ ...f, dias: f.dias.map((d, i) => i === di ? { ...d, [field]: [...d[field], emptyWarmupItem()] } : d) }))
  const removeWarmupItem = (di, field, wi) => setForm(f => ({ ...f, dias: f.dias.map((d, i) => i === di ? { ...d, [field]: d[field].filter((_, j) => j !== wi) } : d) }))
  const updateWarmupItem = (di, field, wi, key, val) => setForm(f => ({ ...f, dias: f.dias.map((d, i) => i === di ? { ...d, [field]: d[field].map((item, j) => j === wi ? { ...item, [key]: val } : item) } : d) }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (!isEdit) {
      setShowConfirmModal(true)
      return
    }
    await doSave()
  }

  const doSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form, alumno_id: parseInt(form.alumno_id),
        dias: form.dias.map(d => ({
          ...d,
          entrada_calor: warmupToString(d.entrada_calor),
          finalizar_con: warmupToString(d.finalizar_con),
          ejercicios: d.ejercicios.map(ej => ({ ...ej, semanas: ej.semanas.map(ws => ({ ...ws, peso: ws.peso === '' ? null : parseFloat(ws.peso) })) }))
        }))
      }
      if (isEdit) {
        await api.put(`/routines/${id}`, { nombre: payload.nombre, objetivo: payload.objetivo, inicio: payload.inicio })
      } else {
        await api.post('/routines', payload)
      }
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:80}}><div className="spinner" style={{width:32,height:32}}/></div>

  return (
    <div className="routine-form-page fade-in">
      <div className="form-header">
        <button className="btn-ghost" onClick={() => navigate(-1)}>← Volver</button>
        <h1 className="page-title">{isEdit ? 'Editar rutina' : 'Nueva rutina'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="routine-form">
        {/* Info general */}
        <div className="form-section card">
          <h3 className="section-title">Información general</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre de la rutina</label>
              <input className="input-field" value={form.nombre} onChange={e => updateField('nombre', e.target.value)} required placeholder="Ej: Hipertrofia - Nimsi Sanchez" />
            </div>
            <div className="form-group">
              <label className="form-label">Objetivo</label>
              <select className="input-field" value={form.objetivo} onChange={e => {
                updateField('objetivo', e.target.value)
                const alumno = alumnos.find(a => a.id === parseInt(form.alumno_id))
                if (alumno) updateField('nombre', `${alumno.name} - ${e.target.value}`)
              }}>
                <option>Hipertrofia</option><option>Fuerza</option><option>Definición</option>
                <option>Resistencia</option><option>Rehabilitación</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha de inicio</label>
              <input className="input-field" value={form.inicio} onChange={e => updateField('inicio', e.target.value)} placeholder="Ej: 26-Feb" />
            </div>
            {!isEdit && (
              <div className="form-group">
                <label className="form-label">Alumno</label>
                <select className="input-field" value={form.alumno_id} onChange={e => {
                  const alumno = alumnos.find(a => a.id === parseInt(e.target.value))
                  updateField('alumno_id', e.target.value)
                  if (alumno) updateField('nombre', `${alumno.name} - ${form.objetivo}`)
                }} required>
                  <option value="">Seleccionar alumno...</option>
                  {alumnos.map(a => <option key={a.id} value={a.id}>{a.name} — {a.email}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Days */}
        {!isEdit && form.dias.map((day, di) => (
          <div key={di} className="day-section card">
            <div className="day-section-header">
              <h3 className="section-title">Día {day.numero}</h3>
              {form.dias.length > 1 && (
                <button type="button" className="btn-danger" onClick={() => removeDay(di)} style={{padding:'4px 10px',fontSize:12}}>Eliminar día</button>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre del día</label>
                <input className="input-field" value={day.nombre} onChange={e => updateDay(di, 'nombre', e.target.value)} placeholder="Ej: Día de piernas" />
              </div>
              <div className="form-group">
                <label className="form-label">Musculatura</label>
                <input className="input-field" value={day.musculatura} onChange={e => updateDay(di, 'musculatura', e.target.value)} placeholder="Ej: ISQUIOTIBIALES - GLÚTEOS - PECTORALES" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Entrada en calor</label>
              <div className="warmup-builder warmup-builder--fire">
                {day.entrada_calor.map((item, wi) => (
                  <div key={wi} className="warmup-item-row">
                    <span className="warmup-item-num warmup-item-num--fire">{wi + 1}</span>
                    <input
                      className="input-field warmup-texto-input"
                      value={item.texto}
                      onChange={e => updateWarmupItem(di, 'entrada_calor', wi, 'texto', e.target.value)}
                      placeholder="Ej: Movilidad articular 3x10"
                    />
                    {day.entrada_calor.length > 1 && (
                      <button type="button" className="btn-ghost" onClick={() => removeWarmupItem(di, 'entrada_calor', wi)}
                        style={{fontSize:13,padding:'6px 10px',flexShrink:0}}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-ghost warmup-add-btn" onClick={() => addWarmupItem(di, 'entrada_calor')}>
                  + Agregar ejercicio
                </button>
              </div>
            </div>

            {/* Exercises */}
            {day.ejercicios.map((ej, ei) => (
              <div key={ei} className="exercise-form-block">
                <div className="exercise-form-header">
                  <span className="exercise-form-num">{ei + 1}</span>
                  <div style={{flex:1}}>
                    <ExerciseAutocomplete
                      value={ej.nombre}
                      onChange={val => updateExerciseName(di, ei, val)}
                      placeholder="Buscar o escribir ejercicio..."
                    />
                  </div>
                  <button type="button" className="btn-ghost" onClick={() => removeExercise(di, ei)} style={{fontSize:13,padding:'6px 10px',flexShrink:0}}>✕</button>
                </div>

                {/* Week sets table */}
                <div className="weeksets-table-wrap">
                  <table className="weeksets-table">
                    <thead>
                      <tr>
                        <th>SEM</th>
                        <th>Series / Reps</th>
                        <th>Carga (kg)</th>
                        <th>SEM</th>
                        <th>Series / Reps</th>
                        <th>Carga (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[[0,1],[2,3]].map(([a, b]) => (
                        <tr key={a}>
                          {[a, b].map(si => {
                            const ws = ej.semanas[si]
                            if (!ws) return null
                            return [
                              <td key={`s${si}`} className="ws-sem-cell">{ws.semana}</td>,
                              <td key={`r${si}`}><input className="input-field ws-input" value={ws.series_reps} onChange={e => updateWeekSet(di, ei, si, 'series_reps', e.target.value)} placeholder="2X10 2X8" /></td>,
                              <td key={`c${si}`}><input className="input-field ws-input" type="number" step="0.5" min="0" value={ws.peso} onChange={e => updateWeekSet(di, ei, si, 'peso', e.target.value)} placeholder="—" /></td>
                            ]
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <button type="button" className="btn-outline" onClick={() => addExercise(di)} style={{alignSelf:'flex-start',marginTop:8}}>+ Agregar ejercicio</button>

            <div className="form-group">
              <label className="form-label">Finalizar con / Elongaciones</label>
              <div className="warmup-builder warmup-builder--cool">
                {day.finalizar_con.map((item, wi) => (
                  <div key={wi} className="warmup-item-row">
                    <span className="warmup-item-num warmup-item-num--cool">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <input
                      className="input-field warmup-texto-input"
                      value={item.texto}
                      onChange={e => updateWarmupItem(di, 'finalizar_con', wi, 'texto', e.target.value)}
                      placeholder="Ej: Plancha Frontal 3x40s"
                    />
                    {day.finalizar_con.length > 1 && (
                      <button type="button" className="btn-ghost" onClick={() => removeWarmupItem(di, 'finalizar_con', wi)}
                        style={{fontSize:13,padding:'6px 10px',flexShrink:0}}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-ghost warmup-add-btn" onClick={() => addWarmupItem(di, 'finalizar_con')}>
                  + Agregar ejercicio
                </button>
              </div>
            </div>
          </div>
        ))}

        {!isEdit && (
          <button
            type="button"
            className="btn-outline add-day-btn"
            onClick={addDay}
            disabled={form.dias.length >= MAX_DIAS}
            title={form.dias.length >= MAX_DIAS ? `Máximo ${MAX_DIAS} días por rutina` : undefined}
          >
            {form.dias.length >= MAX_DIAS ? `Límite de ${MAX_DIAS} días alcanzado` : '+ Agregar día'}
          </button>
        )}

        {error && <div className="login-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
          <button type="submit" className="btn-gold" disabled={saving}>
            {saving ? <span className="spinner"/> : (isEdit ? 'Guardar cambios' : 'Crear rutina')}
          </button>
        </div>
      </form>

      {showConfirmModal && (
        <ConfirmRoutineModal
          onConfirm={() => { setShowConfirmModal(false); doSave() }}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  )
}
