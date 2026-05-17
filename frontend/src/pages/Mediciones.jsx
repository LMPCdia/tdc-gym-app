import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import './Mediciones.css'

const CAMPOS = [
  { key: 'fecha',          label: 'Fecha',            type: 'text',   placeholder: 'Ej: 01-May',  required: true },
  { key: 'edad',           label: 'Edad',             type: 'number', placeholder: 'Años' },
  { key: 'altura',         label: 'Altura (m)',       type: 'number', placeholder: '1.75',        step: '0.01' },
  { key: 'peso',           label: 'Peso (kg)',        type: 'number', placeholder: '80.0',        step: '0.1' },
  { key: 'masa_grasa',     label: 'Masa Grasa (%)',   type: 'number', placeholder: '20.5',        step: '0.1' },
  { key: 'masa_muscular',  label: 'Masa Muscular (%)',type: 'number', placeholder: '35.0',        step: '0.1' },
  { key: 'edad_biologica', label: 'Edad Biológica',   type: 'number', placeholder: 'Años' },
  { key: 'grasa_visceral', label: 'Grasa Visceral',   type: 'number', placeholder: 'Nivel 1-30' },
]

const empty = () => ({ fecha: '', edad: '', altura: '', peso: '', masa_grasa: '', masa_muscular: '', edad_biologica: '', grasa_visceral: '' })

export default function Mediciones() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [alumno, setAlumno] = useState(null)
  const [mediciones, setMediciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const hoy = new Date()
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    setForm(f => ({ ...f, fecha: `${hoy.getDate()}-${meses[hoy.getMonth()]}` }))

    Promise.all([
      api.get('/users'),
      api.get(`/users/${id}/measurements`),
    ]).then(([usersRes, measRes]) => {
      const found = usersRes.data.find(u => u.id === parseInt(id))
      setAlumno(found || null)
      setMediciones(measRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSaving(true)
    try {
      const payload = {}
      for (const c of CAMPOS) {
        const val = form[c.key]
        if (val === '' || val === null || val === undefined) continue
        payload[c.key] = c.type === 'number' ? parseFloat(val) : val
        if (c.key === 'edad' || c.key === 'edad_biologica' || c.key === 'grasa_visceral') {
          payload[c.key] = parseInt(val)
        }
      }
      const { data } = await api.post(`/users/${id}/measurements`, payload)
      setMediciones(prev => [data, ...prev])
      setForm(empty())
      setShowForm(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleDelete = async (mId) => {
    if (!confirm('¿Eliminar esta medición?')) return
    try {
      await api.delete(`/measurements/${mId}`)
      setMediciones(prev => prev.filter(m => m.id !== mId))
    } catch { alert('Error') }
  }

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:80}}><div className="spinner" style={{width:32,height:32}}/></div>

  return (
    <div className="mediciones-page fade-in">
      <div className="dashboard-header">
        <div>
          <button className="btn-ghost" onClick={() => navigate('/alumnos')} style={{marginBottom:8}}>← Volver</button>
          <h1 className="page-title">Mediciones</h1>
          {alumno && <p className="muted small">{alumno.name}</p>}
        </div>
        <button className="btn-gold" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancelar' : '+ Nueva medición'}
        </button>
      </div>

      {showForm && (
        <div className="card medicion-form-card">
          <h3 className="section-title" style={{marginBottom:16}}>Nueva medición</h3>
          <form onSubmit={handleSubmit}>
            <div className="medicion-form-grid">
              {CAMPOS.map(c => (
                <div key={c.key} className="form-group">
                  <label className="form-label">{c.label}{c.required ? ' *' : ''}</label>
                  <input
                    className="input-field"
                    type={c.type}
                    step={c.step}
                    min={c.type === 'number' ? 0 : undefined}
                    value={form[c.key]}
                    onChange={e => update(c.key, e.target.value)}
                    placeholder={c.placeholder}
                    required={c.required}
                  />
                </div>
              ))}
            </div>
            {error && <div className="login-error" style={{marginBottom:12}}>{error}</div>}
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn-gold" disabled={saving}>
                {saving ? <span className="spinner"/> : 'Guardar medición'}
              </button>
            </div>
          </form>
        </div>
      )}

      {mediciones.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">📊</div>
          <h3>Sin mediciones registradas</h3>
          <p className="muted">Agregá la primera medición con el botón de arriba</p>
        </div>
      ) : (
        <div className="mediciones-list">
          {mediciones.map(m => (
            <div key={m.id} className="medicion-card card">
              <div className="medicion-card-header">
                <div>
                  <span className="tag">{m.fecha}</span>
                  {alumno && <span className="muted small" style={{marginLeft:10}}>{alumno.name}</span>}
                </div>
                <button className="btn-danger" style={{padding:'3px 8px',fontSize:11}} onClick={() => handleDelete(m.id)}>✕</button>
              </div>

              <div className="medicion-tabla">
                <table className="med-table">
                  <tbody>
                    {m.edad != null && (
                      <tr><td className="med-label">EDAD</td><td className="med-valor">{m.edad} años</td>
                          <td className="med-label">ALTURA</td><td className="med-valor">{m.altura != null ? `${m.altura} m` : '—'}</td></tr>
                    )}
                    <tr><td className="med-label">PESO</td><td className="med-valor">{m.peso != null ? `${m.peso} kg` : '—'}</td>
                        <td className="med-label">I.M.C</td><td className="med-valor">{m.imc != null ? m.imc : '—'}</td></tr>
                    <tr><td className="med-label">MASA GRASA</td><td className="med-valor">{m.masa_grasa != null ? `${m.masa_grasa}%` : '—'}</td>
                        <td className="med-label">MASA MUSCULAR</td><td className="med-valor">{m.masa_muscular != null ? `${m.masa_muscular}%` : '—'}</td></tr>
                    <tr><td className="med-label">EDAD BIOLÓGICA</td><td className="med-valor">{m.edad_biologica != null ? m.edad_biologica : '—'}</td>
                        <td className="med-label">GRASA VISCERAL</td><td className="med-valor">{m.grasa_visceral != null ? m.grasa_visceral : '—'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
