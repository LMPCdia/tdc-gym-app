import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import RoutineDetail from './pages/RoutineDetail'
import RoutineForm from './pages/RoutineForm'
import AddExercise from './pages/AddExercise'
import DevMailbox from './pages/DevMailbox'
import Alumnos from './pages/Alumnos'
import Mediciones from './pages/Mediciones'
import ChangePassword from './pages/ChangePassword'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ExerciseCatalog from './pages/ExerciseCatalog'

function PrivateRoute({ children, profesorOnly = false }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (profesorOnly && user.role !== 'profesor') return <Navigate to="/dashboard" replace />
  return children
}

function AppLayout() {
  const { user } = useAuth()
  return (
    <>
      {user && <Navbar />}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dev/mailbox" element={<DevMailbox />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/routines/new" element={<PrivateRoute profesorOnly><RoutineForm /></PrivateRoute>} />
          <Route path="/routines/:id" element={<PrivateRoute><RoutineDetail /></PrivateRoute>} />
          <Route path="/routines/:id/edit" element={<PrivateRoute profesorOnly><RoutineForm /></PrivateRoute>} />
          <Route path="/routines/:routineId/days/:dayId/add-exercise" element={<PrivateRoute profesorOnly><AddExercise /></PrivateRoute>} />
          <Route path="/exercise-catalog" element={<PrivateRoute profesorOnly><ExerciseCatalog /></PrivateRoute>} />
          <Route path="/alumnos" element={<PrivateRoute profesorOnly><Alumnos /></PrivateRoute>} />
          <Route path="/alumnos/:id/mediciones" element={<PrivateRoute profesorOnly><Mediciones /></PrivateRoute>} />
          <Route path="/mis-mediciones" element={<PrivateRoute><Mediciones /></PrivateRoute>} />
          <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/tdc-gym">
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}
