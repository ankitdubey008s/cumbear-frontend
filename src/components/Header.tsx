import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import SettingsMenu from './SettingsMenu'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { headerVisible, searchQuery, setSearchQuery } = useStore()
  const [showSettings, setShowSettings] = useState(false)

  const isHome = location.pathname === '/home'
  const isSearch = location.pathname === '/search'

  return (
    <>
      <header
        className="app-header"
        style={{
          transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
          opacity: headerVisible ? 1 : 0,
        }}
      >
        <div className="header-left">
          <button className="header-btn" onClick={() => setShowSettings(true)}>
            <Menu size={24} />
          </button>
        </div>
        <div className="header-center" onClick={() => navigate('/home')}>
          <img src="/cumbear.png" alt="CUMBear" className="header-logo" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }} />
          <span className="header-logo-text">CUMBear</span>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={() => navigate('/search')}>
            <Search size={22} />
          </button>
        </div>
      </header>

      {isHome && (
        <div className="category-bar">
          <div className="category-scroll">
            {['All', 'Popular', 'Trending', 'Newest', 'Amateur', 'MILF', 'Teen', 'Anal', 'Lesbian', 'Gay', 'Trans', 'Asian', 'Ebony', 'Latina', 'Blowjob', 'Hardcore', 'Threesome', 'Orgy', 'Solo', 'BDSM', 'Creampie', 'Interracial', 'POV', 'VR', '4K'].map(cat => (
              <button key={cat} className="category-pill" onClick={() => {
                setSearchQuery(cat === 'All' ? '' : cat)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {isSearch && (
        <div className="search-header-bar">
          <div className="search-input-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      <SettingsMenu isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}

