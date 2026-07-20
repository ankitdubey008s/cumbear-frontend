import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import type { ShortVideo } from '../types'

interface Props {
  shorts: ShortVideo[]
}

export default function ShortsSuggestion({ shorts }: Props) {
  const navigate = useNavigate()
  if (!shorts?.length) return null

  return (
    <div className="shorts-suggestion">
      <h4 className="shorts-suggestion-title">🔥 Trending Shorts</h4>
      <div className="shorts-suggestion-scroll">
        {shorts.map(short => (
          <div
            key={short.id}
            className="shorts-suggestion-item"
            onClick={() => navigate('/shorts')}
          >
            <div className="shorts-suggestion-thumb">
              <img
                src={short.thumbnail || '/images/placeholder.jpg'}
                alt={short.title}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder.jpg'
                }}
              />
              <div className="shorts-suggestion-play"><Play size={20} fill="white" /></div>
            </div>
            <span className="shorts-suggestion-name">{short.title.slice(0, 30)}...</span>
          </div>
        ))}
      </div>
    </div>
  )
}

