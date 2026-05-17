import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './DevMailbox.css'

export default function DevMailbox() {
  const [mails, setMails] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchMails = () => {
    api.get('/dev/mailbox').then(({ data }) => { setMails(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchMails() }, [])

  const openMail = async (mail) => {
    setSelected(mail)
    if (!mail.read) {
      await api.post(`/dev/mailbox/${mail.id}/read`).catch(() => {})
      setMails(prev => prev.map(m => m.id === mail.id ? { ...m, read: true } : m))
    }
  }

  // Extract verify token from link for easy click
  const extractToken = (body) => {
    const match = body?.match(/verify-email\?token=([A-Za-z0-9_-]+)/)
    return match ? match[1] : null
  }

  const handleVerifyClick = (token) => {
    navigate(`/verify-email?token=${token}`)
  }

  return (
    <div className="mailbox-page fade-in">
      <div className="mailbox-header">
        <div className="mailbox-title-row">
          <button className="btn-ghost" onClick={() => navigate('/')}>← Login</button>
          <div>
            <h1 className="page-title" style={{fontSize:28}}>📬 Buzón de prueba</h1>
            <p className="muted small">Simulador de emails — solo para desarrollo</p>
          </div>
          <button className="btn-outline" onClick={fetchMails} style={{flexShrink:0}}>↻ Actualizar</button>
        </div>
        <div className="dev-badge">🛠 MODO DESARROLLO — En producción los emails llegan a tu casilla real</div>
      </div>

      <div className="mailbox-layout">
        {/* Mail list */}
        <div className="mail-list">
          {loading && <div style={{display:'flex',justifyContent:'center',padding:40}}><div className="spinner"/></div>}
          {!loading && mails.length === 0 && (
            <div style={{padding:40,textAlign:'center',color:'var(--gray)'}}>
              <div style={{fontSize:40,marginBottom:12}}>📭</div>
              <p>No hay emails todavía</p>
              <p className="small">Registrá un usuario para ver los mails acá</p>
            </div>
          )}
          {mails.map(mail => (
            <div
              key={mail.id}
              className={`mail-item ${selected?.id === mail.id ? 'active' : ''} ${!mail.read ? 'unread' : ''}`}
              onClick={() => openMail(mail)}
            >
              {!mail.read && <div className="unread-dot"/>}
              <div className="mail-to">{mail.to}</div>
              <div className="mail-subject">{mail.subject}</div>
              <div className="mail-date">{new Date(mail.sent_at).toLocaleString('es-AR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          ))}
        </div>

        {/* Mail content */}
        <div className="mail-content">
          {!selected ? (
            <div className="mail-empty">
              <div style={{fontSize:40}}>✉️</div>
              <p className="muted">Seleccioná un email para leerlo</p>
            </div>
          ) : (
            <div className="mail-detail">
              <div className="mail-detail-header">
                <div className="mail-detail-subject">{selected.subject}</div>
                <div className="mail-detail-meta">
                  <span><strong>Para:</strong> {selected.to}</span>
                  <span><strong>Fecha:</strong> {new Date(selected.sent_at).toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* Action button if verification email */}
              {extractToken(selected.body_text) && (
                <div className="verify-action">
                  <span className="muted small">Este email contiene un link de verificación:</span>
                  <button
                    className="btn-gold"
                    onClick={() => handleVerifyClick(extractToken(selected.body_text))}
                  >
                    ✓ Verificar email ahora
                  </button>
                </div>
              )}

              <div className="mail-body">
                <pre className="mail-text">{selected.body_text}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
