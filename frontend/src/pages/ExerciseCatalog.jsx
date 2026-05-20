import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './ExerciseCatalog.css'

/* ── Modal para asignar URL de YouTube ───────────────────── */
function YoutubeModal({ exercise, onSave, onClose }) {
  const [url, setUrl] = useState(exercise.youtube_url || '')
  const [descripcion, setDescripcion] = useState(exercise.descripcion || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const isValidYoutubeUrl = (val) =>
    !val || val.includes('youtube.com') || val.includes('youtu.be')

  const handleSave = async (forceUrl) => {
    const trimmed = (forceUrl !== undefined ? forceUrl : url).trim()
    if (trimmed && !isValidYoutubeUrl(trimmed)) {
      setError('La URL debe ser de YouTube (youtube.com o youtu.be)')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.patch(`/exercise-catalog/${exercise.id}`, {
        youtube_url: trimmed || null,
        descripcion: descripcion.trim() || null
      })
      onSave(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al guardar')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card ec-modal" onClick={e => e.stopPropagation()}>
        <div className="ec-modal-header">
          <div className="ec-modal-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--gold)">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
            </svg>
          </div>
          <div>
            <h3 className="modal-title" style={{ fontSize: 18 }}>URL de YouTube</h3>
            <p className="ec-modal-exercise">{exercise.nombre}</p>
            <span className="ec-grupo-tag">{exercise.grupo}</span>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label">URL del video</label>
          <input
            ref={inputRef}
            className="input-field"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={e => { setUrl(e.target.value); setError('') }}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') onClose()
            }}
          />
          {error && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{error}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Descripción de la postura</label>
          <textarea
            className="input-field"
            placeholder="Ej: Acostado en banco plano, agarrar la barra con agarre medio, bajar controlando hasta el pecho y empujar explosivo..."
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={3}
            style={{ resize: 'vertical', minHeight: 70, fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5 }}
          />
        </div>

        {url && isValidYoutubeUrl(url.trim()) && url.trim() && (
          <a href={url.trim()} target="_blank" rel="noopener noreferrer" className="ec-preview-link">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Previsualizar en YouTube
          </a>
        )}

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn-ghost modal-btn-cancel" onClick={onClose}>Cancelar</button>
          {exercise.youtube_url && (
            <button
              className="btn-danger"
              style={{ padding: '8px 14px', fontSize: 13 }}
              onClick={() => handleSave('')}
              disabled={saving}
            >
              Quitar URL
            </button>
          )}
          <button className="btn-gold" onClick={() => handleSave()} disabled={saving}>
            {saving ? <span className="spinner" /> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Fila de ejercicio individual ─────────────────────────── */
function ExerciseRow({ exercise, onEdit }) {
  return (
    <button className={`ec-exercise-row ${exercise.youtube_url ? 'has-url' : ''}`} onClick={() => onEdit(exercise)}>
      <span className="ec-exercise-name">{exercise.nombre}</span>
      {exercise.youtube_url ? (
        <span className="ec-url-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
          </svg>
          Video
        </span>
      ) : (
        <span className="ec-add-url">+ Video</span>
      )}
    </button>
  )
}

/* ── Grupo colapsable ─────────────────────────────────────── */
function GrupoSection({ grupo, exercises, isOpen, onToggle, onEdit }) {
  const withUrl = exercises.filter(e => e.youtube_url).length
  return (
    <div className={`ec-grupo-section ${isOpen ? 'open' : ''}`}>
      <button className="ec-grupo-header" onClick={onToggle}>
        <div className="ec-grupo-left">
          <svg
            className={`ec-chevron ${isOpen ? 'open' : ''}`}
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="ec-grupo-name">{grupo}</span>
          <span className="ec-grupo-count">{exercises.length} ejercicios</span>
        </div>
        {withUrl > 0 && (
          <span className="ec-grupo-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
            </svg>
            {withUrl} con video
          </span>
        )}
      </button>

      {isOpen && (
        <div className="ec-grupo-body">
          {exercises.map(e => (
            <ExerciseRow key={e.id} exercise={e} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Página principal ─────────────────────────────────────── */
export default function ExerciseCatalog() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openGroups, setOpenGroups] = useState(new Set())
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    api.get('/exercise-catalog')
      .then(({ data }) => { setExercises(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchingGroups = new Set(
        exercises
          .filter(e => e.nombre.toLowerCase().includes(q))
          .map(e => e.grupo)
      )
      setOpenGroups(matchingGroups)
    }
  }, [search, exercises])

  const handleSave = (updated) => {
    setExercises(prev => prev.map(e => e.id === updated.id ? updated : e))
    setEditing(null)
  }

  const toggleGroup = (grupo) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(grupo) ? next.delete(grupo) : next.add(grupo)
      return next
    })
  }

  const q = search.toLowerCase().trim()
  const filtered = exercises.filter(e => !q || e.nombre.toLowerCase().includes(q))
  const grouped = filtered.reduce((acc, e) => {
    if (!acc[e.grupo]) acc[e.grupo] = []
    acc[e.grupo].push(e)
    return acc
  }, {})
  const grupos = Object.keys(grouped)
  const totalWithUrl = exercises.filter(e => e.youtube_url).length

  return (
    <div className="ec-page fade-in">
      <div className="ec-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')}>← Volver</button>
          <div>
            <h1 className="page-title">Catálogo de ejercicios</h1>
            <p className="muted small">
              {totalWithUrl} de {exercises.length} ejercicios con video · {grupos.length} grupos musculares
            </p>
          </div>
        </div>
      </div>

      <div className="ec-search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gray)', flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="ec-search-input"
          type="text"
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="ec-search-clear" onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : grupos.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🔍</div>
          <h3>Sin resultados</h3>
          <p className="muted">No hay ejercicios que coincidan con "{search}"</p>
        </div>
      ) : (
        <div className="ec-groups-list">
          {grupos.map(grupo => (
            <GrupoSection
              key={grupo}
              grupo={grupo}
              exercises={grouped[grupo]}
              isOpen={openGroups.has(grupo)}
              onToggle={() => toggleGroup(grupo)}
              onEdit={setEditing}
            />
          ))}
        </div>
      )}

      {editing && (
        <YoutubeModal
          exercise={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
