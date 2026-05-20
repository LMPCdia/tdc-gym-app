import { useState, useEffect } from 'react'

function getYoutubeId(url) {
  if (!url) return null
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (short) return short[1]
  const shorts = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/)
  if (shorts) return shorts[1]
  const long = url.match(/(?:[?&]v=|\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (long) return long[1]
  return null
}

function getEmbedUrl(url) {
  const id = getYoutubeId(url)
  if (!id) return null
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`
}

export default function VideoModal({ nombre, descripcion, videoUrl, onClose }) {
  const embedUrl = getEmbedUrl(videoUrl)
  const [embedError, setEmbedError] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay video-modal-overlay" onClick={onClose}>
      <div className="video-modal-card" onClick={e => e.stopPropagation()}>

        <div className="video-modal-header">
          <div className="video-modal-yt-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
            </svg>
            VIDEO
          </div>
          <h2 className="video-modal-title">{nombre}</h2>
        </div>

        {descripcion ? (
          <p className="video-modal-desc">{descripcion}</p>
        ) : (
          <p className="video-modal-desc video-modal-desc--empty">Sin descripción de postura cargada</p>
        )}

        <div className="video-modal-divider" />

        {!embedError ? (
          <div className="video-modal-player">
            <iframe
              src={embedUrl}
              title={nombre}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onError={() => setEmbedError(true)}
            />
            <div className="video-modal-player-glow" />
          </div>
        ) : (
          <div className="video-modal-error">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>No se pudo cargar el video embebido</p>
          </div>
        )}

        <div className="video-modal-actions">
          <a className="video-modal-yt-link" href={videoUrl} target="_blank" rel="noopener noreferrer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Abrir en YouTube
          </a>
          <button className="video-modal-close-btn" onClick={onClose}>Cerrar</button>
        </div>

      </div>
    </div>
  )
}
