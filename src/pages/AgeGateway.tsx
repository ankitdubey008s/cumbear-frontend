	import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { X, Globe, AlertTriangle } from 'lucide-react'

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'pl', name: 'Polski' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'th', name: 'ไทย' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Bahasa Melayu' },
  { code: 'fil', name: 'Filipino' },
]

function googleTranslateElementInit() {
  const el = document.getElementById('google-translate-element')
  if (el && (window as any).google) {
    new (window as any).google.translate.TranslateElement(
      { pageLanguage: 'en', includedLanguages: languages.map(l => l.code).join(','), layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE },
      'google-translate-element'
    )
  }
}

export default function AgeGateway() {
  const navigate = useNavigate()
  const { setAgeVerified, setLanguage } = useStore()
  const [showLang, setShowLang] = useState(false)
  const [langSearch, setLangSearch] = useState('')

  useEffect(() => {
    if ((window as any).google && (window as any).google.translate) {
      googleTranslateElementInit()
    } else {
      const check = setInterval(() => {
        if ((window as any).google?.translate) {
          googleTranslateElementInit()
          clearInterval(check)
        }
      }, 500)
      return () => clearInterval(check)
    }
  }, [])

  const filteredLangs = languages.filter(l =>
    l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(langSearch.toLowerCase())
  )

  const handleEnter = () => {
    setAgeVerified(true)
    navigate('/home')
  }

  const handleExit = () => {
    window.location.href = 'https://www.google.com'
  }

  const selectLang = (code: string) => {
    setLanguage(code)
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement
    if (select) {
      select.value = code
      select.dispatchEvent(new Event('change'))
    }
    setShowLang(false)
  }

  return (
    <div className="age-gateway">
      <div className="age-gateway-bg" />
      <div className="age-gateway-card">
        <button className="age-gateway-close" onClick={handleEnter}>
          <X size={20} />
        </button>

        <div className="age-gateway-lang">
          <button className="lang-select-btn" onClick={() => setShowLang(!showLang)}>
            <Globe size={16} /> Select Language
          </button>
          {showLang && (
            <div className="lang-dropdown">
              <input
                type="text"
                placeholder="Search language..."
                value={langSearch}
                onChange={e => setLangSearch(e.target.value)}
                autoFocus
              />
              <div className="lang-list">
                {filteredLangs.map(l => (
                  <button key={l.code} onClick={() => selectLang(l.code)}>
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="age-gateway-logo">
          <img src="/cumbear.png" alt="CUMBear" onError={e => {
            (e.target as HTMLImageElement).style.display = 'none'
          }} />
          <h1>CUMBear</h1>
        </div>

        <div className="age-gateway-disclaimer">
          <AlertTriangle size={20} />
          <p>
            This website contains adult content and is strictly for individuals aged 18 and older.
            By entering, you confirm that you are of legal age in your jurisdiction to view sexually explicit material.
            All content is consensual and all performers are 18+.
            This site uses cookies and collects data as per our Privacy Policy.
          </p>
        </div>

        <button className="age-gateway-enter" onClick={handleEnter}>
          I am 18+ — Enter
        </button>

        <button className="age-gateway-exit" onClick={handleExit}>
          I am not 18 — Exit
        </button>
      </div>
    </div>
  )
}

