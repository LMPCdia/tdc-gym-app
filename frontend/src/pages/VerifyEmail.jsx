import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import './Login.css'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')
  const [status, setStatus] = useState('loading') // loading | success | error
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setError('Token no encontrado en la URL'); return }
    api.post('/auth/verify-email', { token })
      .then(({ data }) => { setData(data); setStatus('success') })
      .catch(e => { setError(e.response?.data?.detail || 'Error al verificar'); setStatus('error') })
  }, [token])

  return (
    <div className="login-page">
      <div className="login-bg"><div className="login-bg-hex"/></div>
      <div className="login-container fade-in">
        <div className="login-logo">
          <div className="logo-hex"><span className="logo-tdc">TDC</span></div>
          <p className="logo-sub">TIEMPO DE CAMBIO</p>
          <p className="logo-gym">GYM &amp; FITNESS</p>
        </div>

        <div className="login-form" style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
          {status === 'loading' && (
            <>
              <div className="spinner" style={{width:40,height:40}}/>
              <p className="muted">Verificando tu email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{fontSize:52}}>✅</div>
              <h2 className="login-title" style={{fontSize:26}}>¡Email verificado!</h2>
              <p className="muted">Tu cuenta fue activada exitosamente.</p>
              <div style={{background:'var(--gold-pale)',border:'1px solid var(--gold-border)',borderRadius:10,padding:16,width:'100%'}}>
                <p style={{fontFamily:'var(--font-cond)',fontSize:11,fontWeight:700,letterSpacing:'0.1em',color:'var(--gold)',marginBottom:6}}>TU USUARIO TDC</p>
                <p style={{fontFamily:'var(--font-display)',fontSize:20,color:'var(--white)',letterSpacing:'0.05em',margin:0}}>{data?.tdc_email}</p>
              </div>
              <p className="muted small">Te enviamos un email con tu contraseña. Revisá tu bandeja.</p>
              <div style={{display:'flex',gap:10,flexDirection:'column',width:'100%'}}>
                <button className="btn-gold login-btn" onClick={() => navigate('/')}>Iniciar sesión</button>
                <button className="btn-ghost" style={{width:'100%'}} onClick={() => navigate('/dev/mailbox')}>
                  Ver buzón de prueba →
                </button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{fontSize:52}}>❌</div>
              <h2 className="login-title" style={{fontSize:26}}>Error de verificación</h2>
              <div className="login-error" style={{width:'100%'}}>{error}</div>
              <Link to="/register" className="btn-outline" style={{display:'block',textAlign:'center',padding:'10px 20px'}}>
                Volver al registro
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
