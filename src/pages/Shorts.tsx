import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { useStore } from '../hooks/useStore'
import { Heart, MessageCircle, Share2, RotateCcw, Flag, ChevronLeft, Volume2, VolumeX, Play } from 'lucide-react'
import type { ShortVideo } from '../types'

export default function Shorts() {
  const navigate = useNavigate()
  const { likedShorts, addLikedShort } = useStore()
  const [shorts, setShorts] = useState<ShortVideo[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(false)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    api.getShorts(1).then(data => {
      setShorts(data.shorts)
      setLoading(false)
    })
  }, [])

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const scrollTop = container.scrollTop
    const cardHeight = window.innerHeight
    const newIndex = Math.round(scrollTop / cardHeight)
    if (newIndex !== currentIndex) setCurrentIndex(newIndex)
  }, [currentIndex])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return
      if (i === currentIndex) {
        video.play().catch(() => {})
        video.muted = muted
      } else {
        video.pause()
        video.currentTime = 0
      }
    })
  }, [currentIndex, muted])

  const handleLike = async (short: ShortVideo, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (likedShorts.has(short.id)) return
    addLikedShort(short.id)
    try { await api.likeShort(short.id) } catch {}
  }

  const handleDoubleTap = (short: ShortVideo, e: React.MouseEvent) => {
    const heart = document.createElement('div')
    heart.innerHTML = '❤️'
    heart.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;font-size:60px;pointer-events:none;z-index:9999;animation:heartFloat 0.8s ease forwards;`
    document.body.appendChild(heart)
    setTimeout(() => heart.remove(), 800)
    handleLike(short)
  }

  const handleShare = (short: ShortVideo) => {
    const url = `https://cumbear.in/s/${short.id}`
    if (navigator.share) {
      navigator.share({ title: short.title, url })
    } else {
      navigator.clipboard.writeText(url)
    }
    api.shareShort(short.id, 'native')
  }

  const handleReport = () => {
    navigate('/info/report')
  }

  const loadMore = useCallback(async () => {
    const nextPage = page + 1
    try {
      const data = await api.getShorts(nextPage)
      if (data.shorts.length) {
        setShorts(prev => [...prev, ...data.shorts])
        setPage(nextPage)
      }
    } catch {}
  }, [page])

  useEffect(() => {
    if (currentIndex >= shorts.length - 3) loadMore()
  }, [currentIndex, shorts.length, loadMore])

  if (loading) {
    return (
      <div className="shorts-page loading">
        <div className="shorts-spinner" />
        <p>Loading shorts...</p>
      </div>
    )
  }

  return (
    <div className="shorts-page" ref={containerRef}>
      <button className="shorts-back" onClick={() => navigate('/home')}>
        <ChevronLeft size={28} />
      </button>

      <button className="shorts-mute" onClick={() => setMuted(!muted)}>
        {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>

      {shorts.map((short, i) => (
        <div
          key={short.id}
          className="shorts-item"
          onDoubleClick={e => handleDoubleTap(short, e)}
          onClick={() => {
            const video = videoRefs.current[i]
            if (video) {
              if (video.paused) { video.play(); setPaused(false) }
              else { video.pause(); setPaused(true) }
            }
          }}
        >
          <video
            ref={el => videoRefs.current[i] = el}
            src={short.videoUrl}
            loop
            playsInline
            muted
            preload={Math.abs(i - currentIndex) < 3 ? 'auto' : 'metadata'}
            poster={short.thumbnail || ''}
          />

          {paused && i === currentIndex && (
            <div className="shorts-play-overlay">
              <Play size={64} fill="white" />
            </div>
          )}

          <div className="shorts-overlay" />

          <div className="shorts-actions">
            <button className={`shorts-action ${likedShorts.has(short.id) ? 'liked' : ''}`} onClick={e => handleLike(short, e)}>
              <Heart size={28} fill={likedShorts.has(short.id) ? 'currentColor' : 'none'} />
              <span>{short.likes > 1000 ? (short.likes / 1000).toFixed(1) + 'K' : short.likes}</span>
            </button>
            <button className="shorts-action" onClick={e => { e?.stopPropagation(); }}>
              <MessageCircle size={28} />
              <span>{short.comments > 1000 ? (short.comments / 1000).toFixed(1) + 'K' : short.comments}</span>
            </button>
            <button className="shorts-action" onClick={e => { e?.stopPropagation(); handleShare(short) }}>
              <Share2 size={28} />
              <span>{short.shares > 1000 ? (short.shares / 1000).toFixed(1) + 'K' : short.shares}</span>
            </button>
            <button className="shorts-action" onClick={e => { e?.stopPropagation(); }}>
              <RotateCcw size={28} />
              <span>{short.reposts > 1000 ? (short.reposts / 1000).toFixed(1) + 'K' : short.reposts}</span>
            </button>
            <button className="shorts-action report" onClick={e => { e?.stopPropagation(); handleReport() }}>
              <Flag size={28} />
              <span>Report</span>
            </button>
          </div>

          <div className="shorts-info">
            <div className="shorts-user">
              <span className="shorts-avatar">CB</span>
              <span className="shorts-username">@{short.username}</span>
            </div>
            <p className="shorts-caption">{short.title}</p>
            <div className="shorts-tags">
              {short.tags?.slice(0, 3).map(t => <span key={t}>#{t}</span>)}
            </div>
            <div className="shorts-music">
              <span>🎵 Original sound — {formatViews(short.views)} views</span>
            </div>
          </div>

          <div className="shorts-progress">
            <div className="shorts-progress-bar" style={{ width: `${((videoRefs.current[i]?.currentTime || 0) / (videoRefs.current[i]?.duration || 1)) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function formatViews(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

