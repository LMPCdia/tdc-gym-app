import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'
import ExerciseAutocomplete from '../components/ExerciseAutocomplete'

const SEMANAS = [1, 2, 3, 4]
const emptyWeekSets = () => SEMANAS.map(s => ({ semana: s, series_reps: '', peso: '' }))

export default function AddExercise() {
  const { routineId, dayId } = useParams()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [semanas, setSemanas] = useState(emptyWeekSets())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateWS = (si, field, val) => setSemanas(prev => prev.map((ws, i) => i === si ? { ...ws, [field]: val } : ws))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) { setError('Escribí el nombre del ejercicio'); return }
    setSaving(true); setError('')
    try {
      await api.post(`/days/${dayId}/exercises`, {
        numero: 1, nombre,
        semanas: semanas.map(ws => ({ ...ws, peso: ws.peso === '' ? null : parseFloat(ws.peso) }))
      })
      navigate(`/routines/${routineId}`)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al guardar')
      setSaving(false)
    }
  }

  return (
    <div style={{padding:'28px 24px',maxWidth:640,margin:'0 auto'}} className="fade-in">
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24}}>
        <button className="btn-ghost" onClick={() => navigate(-1)}>← Volver</button>
        <h1 className="page-title" style={{fontSize:28}}>Agregar ejercicio</h1>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{display:'flex',flexDirection:'column',gap:20}}>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          <label style={{fontFamily:'var(--font-cond)',fontSize:11,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray)'}}>
            Ejercicio
          </label>
          <ExerciseAutocomplete value={nombre} onChange={setNombre} placeholder="Buscar o escribir ejercicio..." />
        </div>

        {/* Weeksets table */}
        <div style={{overflowX:'auto',borderRadius:'var(--radius)',border:'1px solid var(--gray-border)'}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:420}}>
            <thead>
              <tr style={{background:'var(--black-soft)',borderBottom:'1px solid var(--gray-border)'}}>
                {['SEM','Series / Reps','Carga (kg)','SEM','Series / Reps','Carga (kg)'].map((h,i) => (
                  <th key={i} style={{fontFamily:'var(--font-cond)',fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold-dim)',padding:'7px 10px',textAlign:'center'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[[0,1],[2,3]].map(([a,b]) => (
                <tr key={a} style={{borderBottom:'1px solid var(--gray-border)'}}>
                  {[a,b].map(si => {
                    const ws = semanas[si]
                    return [
                      <td key={`s${si}`} style={{fontFamily:'var(--font-display)',fontSize:18,color:'var(--gold)',textAlign:'center',width:36,padding:'5px 4px'}}>{ws.semana}</td>,
                      <td key={`r${si}`} style={{padding:'5px 6px'}}><input className="input-field" style={{padding:'7px 8px',fontSize:13}} value={ws.series_reps} onChange={e => updateWS(si, 'series_reps', e.target.value)} placeholder="2X10 2X8"/></td>,
                      <td key={`c${si}`} style={{padding:'5px 6px'}}><input className="input-field" style={{padding:'7px 8px',fontSize:13}} type="number" step="0.5" min="0" value={ws.peso} onChange={e => updateWS(si, 'peso', e.target.value)} placeholder="—"/></td>
                    ]
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <div className="login-error">{error}</div>}

        <div style={{display:'flex',justifyContent:'flex-end',gap:12}}>
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
          <button type="submit" className="btn-gold" disabled={saving}>
            {saving ? <span className="spinner"/> : 'Agregar ejercicio'}
          </button>
        </div>
      </form>
    </div>
  )
}
