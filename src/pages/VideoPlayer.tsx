import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Heart, Share2, Eye, Clock, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'
import { api } from '../utils/api'
import { useStore } from '../hooks/useStore'
import Header from '../components/Header'
import Footer from '../components/Footer'
import VideoGrid from '../components/VideoGrid'
import AdBanner from '../components/AdBanner'
import type { LongVideo } from '../types'

export default function VideoPlayer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { likedShorts, addLikedShort } = useStore()
  const [video, setVideo] = useState<LongVideo | null>(null)
  const [related, setRelated] = useState<LongVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [showAd, setShowAd] = useState(true)
  const [adCountdown, setAdCountdown] = useState(5)
  const [showIntro, setShowIntro] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!id) return
    api.getVideo(id).then(data => {
      setVideo(data)
      setLoading(false)
    }).catch(() => setLoading(false))

    api.getVideos(1).then(data => {
      setRelated(data.videos.filter(v => v.id !== id).slice(0, 12))
    })
  }, [id])

  useEffect(() => {
    if (!showAd) return
    const timer = setInterval(() => {
      setAdCountdown(c => {
        if (c <= 1) {
          clearInterval(timer)
          setShowAd(false)
          setShowIntro(true)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [showAd])

  useEffect(() => {
    if (showIntro) {
      const timer = setTimeout(() => {
        setShowIntro(false)
        setPlaying(true)
        videoRef.current?.play()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showIntro])

  const handlePlay = () => {
    if (showAd || showIntro) return
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v) return
    setProgress((v.currentTime / v.duration) * 100)
  }

  const handleLike = () => {
    if (!video || likedShorts.has(video.id)) return
    addLikedShort(video.id)
    api.likeShort(video.id)
  }

  const handleShare = () => {
    if (!video) return
    const url = `https://cumbear.in/video/${video.id}`
    navigator.clipboard.writeText(url)
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="page video-page loading">
        <div className="shorts-spinner" />
      </div>
    )
  }

  if (!video) {
    return (
      <div className="page video-page">
        <div className="error-card">
          <h3>Video not found</h3>
          <button className="retry-btn" onClick={() => navigate('/home')}>Go Home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page video-page">
      <Header />
      <main className="page-content">
        <button className="video-back" onClick={() => navigate('/home')}>
          <ChevronLeft size={24} /> Back
        </button>

        <AdBanner />

        <div className="video-player-container">
          {showAd && (
            <div className="video-ad-overlay">
              <div className="video-ad-content">
                <span className="ad-skip">Skip in {adCountdown}s</span>
                <p>Advertisement</p>
              </div>
            </div>
          )}

          {showIntro && (
            <div className="video-intro-overlay">
              <video src="/videos/cumbear.mp4" autoPlay muted loop className="intro-video" />
            </div>
          )}

          <video
            ref={videoRef}
            src={video.url}
            className="main-video"
            onClick={handlePlay}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setPlaying(false)}
            playsInline
          />

          {!playing && !showAd && !showIntro && (
            <div className="video-play-btn" onClick={handlePlay}>
              <Play size={48} fill="white" />
            </div>
          )}

          <div className="video-controls">
            <button onClick={handlePlay}>
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={() => setMuted(!muted)}>
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="video-progress-bar">
              <div className="video-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="video-time">{formatDuration(video.duration)}</span>
            <button onClick={() => videoRef.current?.requestFullscreen()}>
              <Maximize size={20} />
            </button>
          </div>
        </div>

        <div className="video-details">
          <h1 className="video-title">{video.title}</h1>
          <div className="video-stats">
            <span><Eye size={14} /> {video.views.toLocaleString()} views</span>
            <span><Clock size={14} /> {formatDuration(video.duration)}</span>
          </div>
          <div className="video-actions">
            <button className={likedShorts.has(video.id) ? 'liked' : ''} onClick={handleLike}>
              <Heart size={20} fill={likedShorts.has(video.id) ? 'currentColor' : 'none'} /> Like
            </button>
            <button onClick={handleShare}>
              <Share2 size={20} /> Share
            </button>
          </div>
        </div>

        <AdBanner width={720} height={110} label="Sponsored" />

        <div className="related-videos">
          <h3>Related Videos</h3>
          <VideoGrid videos={related} />
        </div>

        <div className="footer-copyright">
          © 2026 cumbear.in — All Rights Reserved
        </div>
      </main>
      <Footer />
    </div>
  )
}

