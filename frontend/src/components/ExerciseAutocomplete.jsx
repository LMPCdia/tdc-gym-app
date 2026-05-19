import { useState, useEffect, useRef } from 'react'
import api from '../api'
import './ExerciseAutocomplete.css'

export default function ExerciseAutocomplete({ value, onChange, placeholder = "Buscar ejercicio..." }) {
  const [query, setQuery] = useState(value || '')
  const [catalog, setCatalog] = useState([])
  const [filtered, setFiltered] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedGrupo, setSelectedGrupo] = useState('')
  const ref = useRef(null)
  const pillsRef = useRef(null)
  const dragRef = useRef({ dragging: false, startX: 0, scrollLeft: 0 })

  useEffect(() => {
    api.get('/exercises/catalog').then(({ data }) => setCatalog(data)).catch(() => {})
  }, [])

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    if (!query && !selectedGrupo) { setFiltered([]); return }
    const q = query.toLowerCase()
    let results = []
    for (const grupo of catalog) {
      if (selectedGrupo && grupo.grupo !== selectedGrupo) continue
      const matches = grupo.ejercicios.filter(e =>
        !q || e.toLowerCase().includes(q)
      )
      if (matches.length) results.push({ grupo: grupo.grupo, ejercicios: matches })
    }
    setFiltered(results)
  }, [query, selectedGrupo, catalog])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Drag-to-scroll en las pills (mouse)
  const onPillsMouseDown = (e) => {
    dragRef.current = { dragging: true, startX: e.pageX - pillsRef.current.offsetLeft, scrollLeft: pillsRef.current.scrollLeft }
  }
  const onPillsMouseMove = (e) => {
    if (!dragRef.current.dragging) return
    e.preventDefault()
    const x = e.pageX - pillsRef.current.offsetLeft
    pillsRef.current.scrollLeft = dragRef.current.scrollLeft - (x - dragRef.current.startX)
  }
  const onPillsMouseUp = () => { dragRef.current.dragging = false }

  // Wheel vertical → scroll horizontal en las pills
  const onPillsWheel = (e) => {
    if (pillsRef.current) {
      e.preventDefault()
      pillsRef.current.scrollLeft += e.deltaY
    }
  }

  useEffect(() => {
    const el = pillsRef.current
    if (!el) return
    el.addEventListener('wheel', onPillsWheel, { passive: false })
    return () => el.removeEventListener('wheel', onPillsWheel)
  }, [])

  const grupos = catalog.map(g => g.grupo)

  const handleSelect = (nombre) => {
    setQuery(nombre)
    onChange(nombre)
    setOpen(false)
  }

  const handleInput = (e) => {
    setQuery(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  const totalResults = filtered.reduce((a, g) => a + g.ejercicios.length, 0)

  return (
    <div className="autocomplete-wrap" ref={ref}>
      <div className="autocomplete-input-row">
        <input
          className="input-field autocomplete-input"
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {query && (
          <button type="button" className="autocomplete-clear" onClick={() => { setQuery(''); onChange(''); setOpen(false) }}>✕</button>
        )}
      </div>

      {open && (
        <div className="autocomplete-dropdown">
          {/* Grupo filter pills */}
          <div
            className="grupo-pills"
            ref={pillsRef}
            onMouseDown={onPillsMouseDown}
            onMouseMove={onPillsMouseMove}
            onMouseUp={onPillsMouseUp}
            onMouseLeave={onPillsMouseUp}
          >
            <button
              type="button"
              className={`grupo-pill ${!selectedGrupo ? 'active' : ''}`}
              onClick={() => setSelectedGrupo('')}
            >Todos</button>
            {grupos.map(g => (
              <button
                type="button"
                key={g}
                className={`grupo-pill ${selectedGrupo === g ? 'active' : ''}`}
                onClick={() => setSelectedGrupo(g === selectedGrupo ? '' : g)}
              >{g}</button>
            ))}
          </div>

          <div className="autocomplete-results">
            {filtered.length === 0 ? (
              <div className="autocomplete-empty">
                {query || selectedGrupo ? 'Sin resultados' : 'Escribí para buscar o filtrá por grupo muscular'}
              </div>
            ) : (
              filtered.map(group => (
                <div key={group.grupo} className="autocomplete-group">
                  <div className="autocomplete-group-label">{group.grupo}</div>
                  {group.ejercicios.map(ej => (
                    <button type="button" key={ej} className="autocomplete-item" onClick={() => handleSelect(ej)}>
                      {ej}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {totalResults > 0 && (
            <div className="autocomplete-footer">{totalResults} ejercicio{totalResults !== 1 ? 's' : ''}</div>
          )}
        </div>
      )}
    </div>
  )
}
