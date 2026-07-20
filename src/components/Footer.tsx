import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, PlusSquare, User } from 'lucide-react'
import { useStore } from '../hooks/useStore'

export default function Footer() {
  const navigate = useNavigate()
  const location = useLocation()
  const { footerVisible } = useStore()

  const tabs = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/shorts', icon: PlusSquare, label: 'Shorts' },
    { path: '/home', icon: User, label: 'Profile' },
  ]

  return (
    <nav
      className="app-footer"
      style={{
        transform: footerVisible ? 'translateY(0)' : 'translateY(100%)',
        opacity: footerVisible ? 1 : 0,
      }}
    >
      {tabs.map(tab => {
        const isActive = location.pathname === tab.path || (tab.path === '/home' && location.pathname === '/')
        const Icon = tab.icon
        return (
          <button
            key={tab.path + tab.label}
            className={`footer-tab ${isActive ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

