import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import api from '../api'
import './Mediciones.css'

const METRICS = [
  { key: 'peso',           label: 'Peso',           unit: ' kg',   color: '#F0A500' },
  { key: 'imc',            label: 'I.M.C',          unit: '',      color: '#3b82f6' },
  { key: 'masa_grasa',     label: 'Masa Grasa',     unit: '%',     color: '#ef4444' },
  { key: 'masa_muscular',  label: 'Masa Muscular',  unit: '%',     color: '#22c55e' },
  { key: 'edad_biologica', label: 'Edad Biológica', unit: ' años', color: '#a855f7' },
  { key: 'grasa_visceral', label: 'Grasa Visceral', unit: '',      color: '#f97316' },
]

const CAMPOS = [
  { key: 'fecha',          label: 'Fecha',              type: 'text',   required: true, placeholder: 'Ej: 01-May' },
  { key: 'edad',           label: 'Edad',               type: 'number', placeholder: 'Años' },
  { key: 'altura',         label: 'Altura (m)',         type: 'number', placeholder: '1.75', step: '0.01' },
  { key: 'peso',           label: 'Peso (kg)',          type: 'number', placeholder: '80.0', step: '0.1' },
  { key: 'masa_grasa',     label: 'Masa Grasa (%)',     type: 'number', placeholder: '20.5', step: '0.1' },
  { key: 'masa_muscular',  label: 'Masa Muscular (%)',  type: 'number', placeholder: '35.0', step: '0.1' },
  { key: 'edad_biologica', label: 'Edad Biológica',     type: 'number', placeholder: 'Años' },
  { key: 'grasa_visceral', label: 'Grasa Visceral',     type: 'number', placeholder: 'Nivel 1-30' },
]

const emptyForm = () => Object.fromEntries(CAMPOS.map(c => [c.key, '']))

function MetricChart({ label, unit, dataKey, color, data }) {
  const chartData = [...data]
    .reverse()
    .map(m => ({ fecha: m.fecha, value: m[dataKey] }))
    .filter(d => d.value != null)

  const last = chartData[chartData.length - 1]
  const prev = chartData[chartData.length - 2]
  const diff = last && prev && last.value != null && prev.value != null
    ? +(last.value - prev.value).toFixed(1)
    : null

  return (
    <div className="metric-chart-card card">
      <div className="metric-chart-header">
        <span className="metric-chart-title">{label}</span>
        <div style={{ textAlign: 'right' }}>
          {last && (
            <span className="metric-chart-last" style={{ color }}>
              {last.value}{unit}
            </span>
          )}
          {diff != null && diff !== 0 && (
            <span className={`metric-trend ${diff > 0 ? 'trend-up' : 'trend-down'}`}>
              {diff > 0 ? '▲' : '▼'} {Math.abs(diff)}
            </span>
          )}
        </div>
      </div>

      {chartData.length < 2 ? (
        <div className="metric-chart-empty">Se necesitan al menos 2 registros</div>
      ) : (
        <ResponsiveContainer width="100%" height={110}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -14 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
            <XAxis
              dataKey="fecha"
              tick={{ fill: '#555', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#555', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: '#111',
                border: `1px solid ${color}`,
                borderRadius: 6,
                fontSize: 12,
                padding: '6px 10px',
              }}
              labelStyle={{ color: '#888', marginBottom: 2 }}
              itemStyle={{ color }}
              formatter={v => [`${v}${unit}`, label]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function FichaCard({ latest, alumnoName }) {
  const row = (label, val, label2, val2) => (
    <tr>
      <td className="ficha-th">{label}</td>
      <td className="ficha-td">{val ?? '—'}</td>
      {label2 !== undefined && <><td className="ficha-th">{label2}</td><td className="ficha-td">{val2 ?? '—'}</td></>}
    </tr>
  )

  return (
    <div className="ficha-card card">
      <div className="ficha-logo-bar">
        <div className="ficha-hex">TDC</div>
        <div className="ficha-gym-info">
          <span className="ficha-gym-name">GIMNASIO TIEMPO DE CAMBIO</span>
        </div>
      </div>
      <table className="ficha-table">
        <tbody>
          <tr><td className="ficha-section-label" colSpan={4}>NOMBRE Y APELLIDO</td></tr>
          <tr><td className="ficha-name-val" colSpan={4}>{alumnoName?.toUpperCase()}</td></tr>
          <tr>
            <td className="ficha-th" colSpan={2}>FECHA</td>
            <td className="ficha-td" colSpan={2}>{latest.fecha}</td>
          </tr>
          {row('EDAD', latest.edad != null ? `${latest.edad} años` : null, 'ALTURA', latest.altura != null ? `${latest.altura} m` : null)}
          <tr>
            <td className="ficha-th" colSpan={2}>PESO</td>
            <td className="ficha-td" colSpan={2}>{latest.peso != null ? `${latest.peso} kg` : '—'}</td>
          </tr>
          <tr>
            <td className="ficha-th" colSpan={2}>I.M.C</td>
            <td className="ficha-td" colSpan={2}>{latest.imc ?? '—'}</td>
          </tr>
          <tr>
            <td className="ficha-th" colSpan={2}>MASA GRASA</td>
            <td className="ficha-td" colSpan={2}>{latest.masa_grasa != null ? `${latest.masa_grasa}%` : '—'}</td>
          </tr>
          <tr>
            <td className="ficha-th" colSpan={2}>MASA MUSCULAR</td>
            <td className="ficha-td" colSpan={2}>{latest.masa_muscular != null ? `${latest.masa_muscular}%` : '—'}</td>
          </tr>
          <tr>
            <td className="ficha-th" colSpan={2}>EDAD BIOLÓGICA</td>
            <td className="ficha-td" colSpan={2}>{latest.edad_biologica ?? '—'}</td>
          </tr>
          <tr>
            <td className="ficha-th" colSpan={2}>GRASA VISCERAL</td>
            <td className="ficha-td" colSpan={2}>{latest.grasa_visceral ?? '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default function Mediciones() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()

  const userId = id ? parseInt(id) : currentUser?.id
  const isProfesor = currentUser?.role === 'profesor'

  const [alumnoName, setAlumnoName] = useState('')
  const [mediciones, setMediciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const hoy = new Date()
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    setForm(f => ({ ...f, fecha: `${hoy.getDate()}-${meses[hoy.getMonth()]}` }))

    if (isProfesor && id) {
      Promise.all([
        api.get('/users'),
        api.get(`/users/${userId}/measurements`),
      ]).then(([usersRes, measRes]) => {
        const found = usersRes.data.find(u => u.id === userId)
        setAlumnoName(found?.name || '')
        setMediciones(measRes.data)
      }).catch(() => {}).finally(() => setLoading(false))
    } else {
      setAlumnoName(currentUser?.name || '')
      api.get(`/users/${userId}/measurements`)
        .then(({ data }) => setMediciones(data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [userId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSaving(true)
    try {
      const payload = {}
      for (const c of CAMPOS) {
        const val = form[c.key]
        if (val === '' || val == null) continue
        payload[c.key] = ['edad', 'edad_biologica', 'grasa_visceral'].includes(c.key)
          ? parseInt(val)
          : c.type === 'number' ? parseFloat(val) : val
      }
      const { data } = await api.post(`/users/${userId}/measurements`, payload)
      setMediciones(prev => [data, ...prev])
      setForm(emptyForm())
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
    } catch { alert('Error al eliminar') }
  }

  const latest = mediciones[0]

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  return (
    <div className="mediciones-page fade-in">
      <div className="dashboard-header">
        <div>
          <button className="btn-ghost"
            onClick={() => navigate(isProfesor && id ? '/alumnos' : '/dashboard')}
            style={{ marginBottom: 8 }}>
            ← Volver
          </button>
          <h1 className="page-title">Mediciones corporales</h1>
          {alumnoName && <p className="muted small">{alumnoName}</p>}
        </div>
        {isProfesor && (
          <button className="btn-gold" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancelar' : '+ Nueva medición'}
          </button>
        )}
      </div>

      {/* Form – professor only */}
      {isProfesor && showForm && (
        <div className="card medicion-form-card">
          <h3 className="section-title" style={{ marginBottom: 16 }}>Nueva medición</h3>
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
                    onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))}
                    placeholder={c.placeholder}
                    required={c.required}
                  />
                </div>
              ))}
            </div>
            {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn-gold" disabled={saving}>
                {saving ? <span className="spinner" /> : 'Guardar medición'}
              </button>
            </div>
          </form>
        </div>
      )}

      {mediciones.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">📊</div>
          <h3>Sin mediciones registradas</h3>
          {isProfesor
            ? <p className="muted">Agregá la primera medición con el botón de arriba</p>
            : <p className="muted">El profesor aún no cargó mediciones para vos</p>
          }
        </div>
      ) : (
        <>
          {/* Ficha última medición */}
          {latest && (
            <div className="ficha-wrapper">
              <div className="ficha-section-heading">Última medición</div>
              <FichaCard latest={latest} alumnoName={alumnoName} />
            </div>
          )}

          {/* Gráficos históricos */}
          {mediciones.length >= 2 && (
            <div className="charts-section">
              <div className="ficha-section-heading">Evolución histórica</div>
              <div className="charts-grid">
                {METRICS.map(m => (
                  <MetricChart key={m.key} {...m} data={mediciones} />
                ))}
              </div>
            </div>
          )}

          {/* Historial */}
          <div className="ficha-section-heading">Historial completo</div>
          <div className="mediciones-list">
            {mediciones.map(m => (
              <div key={m.id} className="medicion-card card">
                <div className="medicion-card-header">
                  <div>
                    <span className="tag">{m.fecha}</span>
                    {alumnoName && (
                      <span className="muted small" style={{ marginLeft: 10 }}>{alumnoName}</span>
                    )}
                  </div>
                  {isProfesor && (
                    <button className="btn-danger" style={{ padding: '3px 8px', fontSize: 11 }}
                      onClick={() => handleDelete(m.id)}>✕</button>
                  )}
                </div>
                <div className="medicion-tabla">
                  <table className="med-table">
                    <tbody>
                      {(m.edad != null || m.altura != null) && (
                        <tr>
                          <td className="med-label">EDAD</td>
                          <td className="med-valor">{m.edad != null ? `${m.edad} años` : '—'}</td>
                          <td className="med-label">ALTURA</td>
                          <td className="med-valor">{m.altura != null ? `${m.altura} m` : '—'}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="med-label">PESO</td>
                        <td className="med-valor">{m.peso != null ? `${m.peso} kg` : '—'}</td>
                        <td className="med-label">I.M.C</td>
                        <td className="med-valor">{m.imc ?? '—'}</td>
                      </tr>
                      <tr>
                        <td className="med-label">MASA GRASA</td>
                        <td className="med-valor">{m.masa_grasa != null ? `${m.masa_grasa}%` : '—'}</td>
                        <td className="med-label">MASA MUSCULAR</td>
                        <td className="med-valor">{m.masa_muscular != null ? `${m.masa_muscular}%` : '—'}</td>
                      </tr>
                      <tr>
                        <td className="med-label">EDAD BIOLÓGICA</td>
                        <td className="med-valor">{m.edad_biologica ?? '—'}</td>
                        <td className="med-label">GRASA VISCERAL</td>
                        <td className="med-valor">{m.grasa_visceral ?? '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
