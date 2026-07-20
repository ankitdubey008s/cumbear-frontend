import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { api } from '../utils/api'

interface Props {
  onSelect: (query: string) => void
}

export default function SearchSuggestions({ onSelect }: Props) {
  const { searchQuery } = useStore()
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setSuggestions([])
      return
    }
    setLoading(true)
    try {
      const data = await api.getSuggestions(q)
      setSuggestions(data.slice(0, 8))
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, fetchSuggestions])

  if (!suggestions.length || !searchQuery.trim()) return null

  return (
    <div className="search-suggestions">
      {suggestions.map((s, i) => (
        <button key={i} className="suggestion-item" onClick={() => onSelect(s)}>
          <Search size={14} />
          <span>{s}</span>
        </button>
      ))}
      {loading && <div className="suggestion-loading">Loading...</div>}
    </div>
  )
}

