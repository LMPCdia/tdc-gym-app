import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'
import ExerciseAutocomplete from '../components/ExerciseAutocomplete'
import './RoutineForm.css'

const SEMANAS = [1, 2, 3, 4]
const emptyWeekSets = () => SEMANAS.map(s => ({ semana: s, series_reps: '', peso: '' }))
const emptyExercise = (num) => ({ numero: num, nombre: '', semanas: emptyWeekSets() })
const emptyDay = (num) => ({ numero: num, nombre: '', entrada_calor: '', musculatura: '', finalizar_con: '', ejercicios: [emptyExercise(1)] })

export default function RoutineForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
            finalizar_con: d.finalizar_con || '',
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
  const addDay = () => setForm(f => ({ ...f, dias: [...f.dias, emptyDay(f.dias.length + 1)] }))
  const removeDay = (di) => setForm(f => ({ ...f, dias: f.dias.filter((_, i) => i !== di) }))
  const updateDay = (di, field, val) => setForm(f => ({ ...f, dias: f.dias.map((d, i) => i === di ? { ...d, [field]: val } : d) }))
  const addExercise = (di) => setForm(f => ({ ...f, dias: f.dias.map((d, i) => i === di ? { ...d, ejercicios: [...d.ejercicios, emptyExercise(d.ejercicios.length + 1)] } : d) }))
  const removeExercise = (di, ei) => setForm(f => ({ ...f, dias: f.dias.map((d, i) => i === di ? { ...d, ejercicios: d.ejercicios.filter((_, j) => j !== ei) } : d) }))
  const updateExerciseName = (di, ei, val) => setForm(f => ({ ...f, dias: f.dias.map((d, i) => i === di ? { ...d, ejercicios: d.ejercicios.map((ej, j) => j === ei ? { ...ej, nombre: val } : ej) } : d) }))
  const updateWeekSet = (di, ei, si, field, val) => setForm(f => ({ ...f, dias: f.dias.map((d, i) => i === di ? { ...d, ejercicios: d.ejercicios.map((ej, j) => j === ei ? { ...ej, semanas: ej.semanas.map((ws, k) => k === si ? { ...ws, [field]: val } : ws) } : ej) } : d) }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (!isEdit) {
      const ok = confirm('¿Confirmar creación de la rutina?\n\nVerificá que los datos sean correctos antes de continuar.')
      if (!ok) return
    }
    setSaving(true)
    try {
      const payload = {
        ...form, alumno_id: parseInt(form.alumno_id),
        dias: form.dias.map(d => ({ ...d, ejercicios: d.ejercicios.map(ej => ({ ...ej, semanas: ej.semanas.map(ws => ({ ...ws, peso: ws.peso === '' ? null : parseFloat(ws.peso) })) })) }))
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
              <textarea className="input-field" rows={2} value={day.entrada_calor} onChange={e => updateDay(di, 'entrada_calor', e.target.value)} placeholder="Ej: Movilidad general | Plancha Frontal 3x10 | Espinales en Máquina 3x10" style={{resize:'vertical'}} />
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
              <label className="form-label">Finalizar con</label>
              <textarea className="input-field" rows={2} value={day.finalizar_con} onChange={e => updateDay(di, 'finalizar_con', e.target.value)} placeholder="Ej: Abdominales Largos 3x10 | Plancha Frontal 3x40&quot;" style={{resize:'vertical'}} />
            </div>
          </div>
        ))}

        {!isEdit && (
          <button type="button" className="btn-outline add-day-btn" onClick={addDay}>+ Agregar día</button>
        )}

        {error && <div className="login-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
          <button type="submit" className="btn-gold" disabled={saving}>
            {saving ? <span className="spinner"/> : (isEdit ? 'Guardar cambios' : 'Crear rutina')}
          </button>
        </div>
      </form>
    </div>
  )
}
