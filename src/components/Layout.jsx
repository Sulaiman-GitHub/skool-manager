import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, Wallet, ClipboardList, LogOut } from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/fees', icon: Wallet, label: 'Fees' },
  { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
]

export default function Layout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🏫</div>
          <div className="sidebar-brand-text">
            <h1>Skool Manager</h1>
            <p>Admin Dashboard</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="signout-btn" onClick={async () => { await signOut(); navigate('/login') }}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}