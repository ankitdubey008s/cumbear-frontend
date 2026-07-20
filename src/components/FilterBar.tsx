import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import type { VideoFilter } from '../types'
import { ChevronDown } from 'lucide-react'

const filters: { value: VideoFilter; label: string }[] = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'most_liked', label: 'Most Liked' },
  { value: 'relevant', label: 'Relevant' },
]

export default function FilterBar() {
  const { filter, setFilter } = useStore()
  const [open, setOpen] = useState(false)
  const current = filters.find(f => f.value === filter)

  return (
    <div className="filter-bar">
      <span className="filter-brand">CUMBear_OFF</span>
      <div className="filter-dropdown">
        <button className="filter-trigger" onClick={() => setOpen(!open)}>
          {current?.label} <ChevronDown size={14} />
        </button>
        {open && (
          <div className="filter-menu">
            {filters.map(f => (
              <button
                key={f.value}
                className={filter === f.value ? 'active' : ''}
                onClick={() => { setFilter(f.value); setOpen(false) }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

