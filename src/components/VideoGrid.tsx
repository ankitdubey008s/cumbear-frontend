import { useNavigate } from 'react-router-dom'
import { Play, Eye, Clock } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import type { LongVideo } from '../types'

interface Props {
  videos: LongVideo[]
  gridType?: string
}

export default function VideoGrid({ videos, gridType }: Props) {
  const navigate = useNavigate()
  const storeGrid = useStore(s => s.gridType)
  const grid = gridType || storeGrid

  const formatViews = (n: number) => {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
    return String(n)
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days < 1) return 'Today'
    if (days === 1) return '1 day ago'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  }

  return (
    <div className={`video-grid grid-${grid}`}>
      {videos.map(video => (
        <div
          key={video.id}
          className="video-card"
          onClick={() => navigate(`/video/${video.id}`)}
        >
          <div className="video-thumbnail">
            <img
              src={video.thumbnail || '/images/placeholder.jpg'}
              alt={video.title}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/placeholder.jpg'
              }}
            />
            <span className="video-duration"><Clock size={12} /> {formatDuration(video.duration)}</span>
            <div className="video-play-overlay"><Play size={32} fill="white" /></div>
          </div>
          <div className="video-info-card">
            <h4 className="video-title">{video.title}</h4>
            <div className="video-meta">
              <span><Eye size={12} /> {formatViews(video.views)}</span>
              <span>{timeAgo(video.createdAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

