import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, TrendingUp } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { api } from '../utils/api'
import Header from '../components/Header'
import Footer from '../components/Footer'
import VideoGrid from '../components/VideoGrid'
import type { LongVideo } from '../types'

const trendingSearches = [
  'Amateur', 'MILF', 'Teen', 'Anal', 'Lesbian', 'Gay', 'Trans',
  'Asian', 'Ebony', 'Latina', 'Blowjob', 'Hardcore', 'Threesome',
  'POV', 'VR', '4K', 'Massage', 'Casting', 'Step', 'Creampie',
  'Interracial', 'Solo', 'BDSM', 'Public', 'Vintage', 'Hentai',
]

const imageCategories = [
  'Russian', 'American', 'British', 'Asian', 'Japanese', 'Indian',
  'Desi', 'Thai', 'Korean', 'Chinese', 'Brazilian', 'Mexican',
  'German', 'French', 'Italian', 'Spanish', 'Arab', 'African',
  'Filipino', 'Indonesian', 'Vietnamese', 'Turkish', 'Polish',
  'Dutch', 'Swedish', 'Norwegian', 'Canadian', 'Australian',
  'Colombian', 'Argentinian',
]

export default function SearchPage() {
  const navigate = useNavigate()
  const { searchQuery, setSearchQuery } = useStore()
  const [query, setQuery] = useState(searchQuery)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [results, setResults] = useState<LongVideo[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setSuggestions([]); return }
    try {
      const data = await api.getSuggestions(q)
      setSuggestions(data.slice(0, 8))
    } catch { setSuggestions([]) }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(query), 300)
    return () => clearTimeout(timer)
  }, [query, fetchSuggestions])

  const handleSearch = async (q: string) => {
    if (!q.trim()) return
    setQuery(q)
    setSearchQuery(q)
    setSuggestions([])
    setLoading(true)
    setSearched(true)
    try {
      const data = await api.search(q)
      setResults(data.videos)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  return (
    <div className="page search-page">
      <Header />
      <main className="page-content">
        {!searched ? (
          <>
            <form className="search-form" onSubmit={handleSubmit}>
              <div className="search-input-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoFocus
                />
                {query && (
                  <button type="button" onClick={() => { setQuery(''); setSuggestions([]) }}>
                    <X size={18} />
                  </button>
                )}
              </div>
              {suggestions.length > 0 && (
                <div className="search-suggestions-list">
                  {suggestions.map((s, i) => (
                    <button key={i} type="button" onClick={() => handleSearch(s)}>
                      <Search size={14} /> {s}
                    </button>
                  ))}
                </div>
              )}
            </form>

            <div className="image-categories-section">
              <h3>Regions</h3>
              <div className="image-categories-grid">
                {imageCategories.map(cat => (
                  <div key={cat} className="image-category-card" onClick={() => handleSearch(cat)}>
                    <img src={`/images/${cat.toLowerCase()}.jpg`} alt={cat} onError={e => {
                      (e.target as HTMLImageElement).src = '/images/placeholder.jpg'
                    }} />
                    <span>{cat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-categories-section">
              <h3><TrendingUp size={16} /> Trending Searches</h3>
              <div className="text-categories-cloud">
                {trendingSearches.map(cat => (
                  <button key={cat} onClick={() => handleSearch(cat)}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="search-results-header">
              <h2>Results for "{query}"</h2>
              <button onClick={() => { setSearched(false); setQuery(''); setResults([]) }}>
                <X size={20} /> Clear
              </button>
            </div>
            {loading ? (
              <div className="loading-more">Searching...</div>
            ) : results.length > 0 ? (
              <VideoGrid videos={results} />
            ) : (
              <div className="no-results">
                <p>No results found for "{query}"</p>
                <p>Try different keywords or browse trending searches</p>
              </div>
            )}
          </>
        )}

        <div className="footer-copyright" style={{ marginTop: 40 }}>
          © 2026 cumbear.in — All Rights Reserved
        </div>
      </main>
      <Footer />
    </div>
  )
}

