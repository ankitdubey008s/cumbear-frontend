import { useStore } from '../hooks/useStore'
import type { Gender, GridType, Theme } from '../types'
import { X, Grid3X3, Grid2X2, Moon, Sun, Users, Download, ExternalLink } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const genders: { value: Gender; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'lesbian', label: 'Lesbian' },
  { value: 'gay', label: 'Gay' },
  { value: 'trans', label: 'Trans' },
  { value: 'bisexual', label: 'Bisexual' },
  { value: 'asexual', label: 'Asexual' },
]

export default function SettingsMenu({ isOpen, onClose }: Props) {
  const { gender, setGender, gridType, setGridType, theme, setTheme } = useStore()

  if (!isOpen) return null

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Settings</h3>
          <button onClick={onClose}><X size={22} /></button>
        </div>

        <div className="settings-section">
          <h4><Grid3X3 size={16} /> Video Grid</h4>
          <div className="settings-options">
            <button className={gridType === '1' ? 'active' : ''} onClick={() => setGridType('1')}>
              <Grid3X3 size={18} /> 1 per row
            </button>
            <button className={gridType === '2' ? 'active' : ''} onClick={() => setGridType('2')}>
              <Grid2X2 size={18} /> 2 per row
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h4>{theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} Theme</h4>
          <div className="settings-options">
            <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>
              <Moon size={18} /> Dark
            </button>
            <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>
              <Sun size={18} /> Light
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h4><Users size={16} /> Gender Preference</h4>
          <div className="gender-grid">
            {genders.map(g => (
              <button
                key={g.value}
                className={gender === g.value ? 'active' : ''}
                onClick={() => setGender(g.value)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h4><Download size={16} /> Install App</h4>
          <button className="install-btn" onClick={() => {
            // PWA install prompt
            const deferredPrompt = (window as any).deferredPrompt
            if (deferredPrompt) deferredPrompt.prompt()
          }}>
            Add to Home Screen
          </button>
        </div>

        <div className="settings-section">
          <h4>Follow Us</h4>
          <div className="social-links">
            <a href="https://t.me/CumBear_official" target="_blank" rel="noopener noreferrer">
              <span>📱</span> Telegram
            </a>
            <a href="https://whatsapp.com/channel/0029Vb8NqveGOj9uLSWGzy01" target="_blank" rel="noopener noreferrer">
              <span>💬</span> WhatsApp
            </a>
            <a href="https://x.com/CumBear_OFF" target="_blank" rel="noopener noreferrer">
              <span>🐦</span> X (Twitter)
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

