import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleLogout = () => {
    setMenuOpen(false)
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
          <div className="user-menu-wrap" ref={menuRef}>
            <button
              className={`user-menu-btn ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(prev => !prev)}
            >
              <span className={`role-badge ${user.role}`}>
                {user.role === 'profesor' ? '👨‍🏫 Profesor' : '🏋️ Alumno'}
              </span>
              <span className="user-name">{user.name}</span>
              <svg
                className={`user-chevron ${menuOpen ? 'open' : ''}`}
                width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {menuOpen && (
              <div className="user-dropdown">
                {user.role === 'profesor' && (
                  <>
                    <button
                      className="dropdown-item"
                      onClick={() => { setMenuOpen(false); navigate('/exercise-catalog') }}
                    >
                      🎬 Catálogo de ejercicios
                    </button>
                    <div className="dropdown-separator" />
                  </>
                )}
                <button
                  className="dropdown-item"
                  onClick={() => { setMenuOpen(false); navigate('/change-password') }}
                >
                  🔑 Cambiar contraseña
                </button>
                <div className="dropdown-separator" />
                <button
                  className="dropdown-item dropdown-item--danger"
                  onClick={handleLogout}
                >
                  🚪 Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
