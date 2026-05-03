import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Fees from './pages/Fees'
import Attendance from './pages/Attendance'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8'}}>Loading...</div>
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="fees" element={<Fees />} />
            <Route path="attendance" element={<Attendance />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}