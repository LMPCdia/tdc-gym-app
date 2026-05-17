import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => navigate('/dashboard')}>
        <div className="nav-hex">
          <span className="nav-tdc">TDC</span>
        </div>
        <div className="nav-brand">
          <span className="nav-name">TIEMPO DE CAMBIO</span>
          <span className="nav-sub">GYM &amp; FITNESS</span>
        </div>
      </div>

      <div className="navbar-right">
        {user && (
          <>
            <div className="navbar-user">
              <span className={`role-badge ${user.role}`}>
                {user.role === 'profesor' ? '👨‍🏫 Profesor' : '🏋️ Alumno'}
              </span>
              <span className="user-name">{user.name}</span>
            </div>
            <button className="btn-ghost" onClick={() => navigate('/change-password')}>Cambiar contraseña</button>
            <button className="btn-ghost" onClick={handleLogout}>Salir</button>
          </>
        )}
      </div>
    </nav>
  )
}
