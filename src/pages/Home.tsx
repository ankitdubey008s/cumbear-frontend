import { useEffect, useState, useCallback } from 'react'
import { useStore } from '../hooks/useStore'
import { useScrollDirection } from '../hooks/useScrollDirection'
import { api } from '../utils/api'
import Header from '../components/Header'
import Footer from '../components/Footer'
import VideoGrid from '../components/VideoGrid'
import AdBanner from '../components/AdBanner'
import ShortsSuggestion from '../components/ShortsSuggestion'
import CategoryImages from '../components/CategoryImages'
import FilterBar from '../components/FilterBar'
import Pagination from '../components/Pagination'
import FooterLinks from '../components/FooterLinks'
import type { LongVideo, ShortVideo } from '../types'

export default function Home() {
  useScrollDirection()
  const { searchQuery, filter, gender, gridType } = useStore()
  const [videos, setVideos] = useState<LongVideo[]>([])
  const [shorts, setShorts] = useState<ShortVideo[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)

  const loadData = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const [videoData, shortsData] = await Promise.all([
        api.getVideos(p, filter, searchQuery || undefined, gender),
        api.getShorts(1),
      ])
      if (p === 1) setVideos(videoData.videos)
      else setVideos(prev => [...prev, ...videoData.videos])
      setHasMore(videoData.hasMore)
      setShorts(shortsData.shorts.slice(0, 3))
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }, [filter, searchQuery, gender])

  useEffect(() => {
    setPage(1)
    loadData(1)
  }, [loadData])

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loading && hasMore) {
        setPage(p => p + 1)
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [loading, hasMore])

  useEffect(() => {
    if (page > 1) loadData(page)
  }, [page, loadData])

  const buildContent = () => {
    const items: React.ReactNode[] = []
    let videoIdx = 0

    const addVideos = (count: number, key: string) => {
      const slice = videos.slice(videoIdx, videoIdx + count)
      videoIdx += count
      if (slice.length) {
        items.push(<VideoGrid key={`v-${key}`} videos={slice} gridType={gridType} />)
      }
    }

    addVideos(5, '1')
    items.push(<AdBanner key="ad-1" />)
    addVideos(5, '2')
    items.push(<ShortsSuggestion key="shorts-1" shorts={shorts} />)
    addVideos(5, '3')
    items.push(<AdBanner key="ad-2" />)
    addVideos(5, '4')
    items.push(<ShortsSuggestion key="shorts-2" shorts={shorts} />)
    addVideos(5, '5')
    items.push(<AdBanner key="ad-3" />)
    addVideos(5, '6')

    return items
  }

  return (
    <div className="page home-page">
      <Header />
      <main className="page-content">
        <AdBanner />
        <CategoryImages />
        <FilterBar />
        {buildContent()}
        {loading && <div className="loading-more">Loading more...</div>}
        <AdBanner width={720} height={420} label="Sponsored" />
        <div className="search-categories">
          {['Amateur', 'MILF', 'Teen', 'Anal', 'Lesbian', 'Gay', 'Trans', 'Asian', 'Ebony', 'Latina', 'Blowjob', 'Hardcore', 'Threesome', 'Orgy', 'Solo', 'BDSM', 'Creampie', 'Interracial', 'POV', 'VR', '4K', 'Public', 'Massage', 'Casting', 'Vintage', 'Hentai', 'Cartoon', 'Live', 'Premium', 'Free', 'HD', 'Ultra HD', '60FPS', 'Compilation', 'Step', 'Family', 'Teacher', 'Doctor', 'Yoga', 'Gym', 'Pool', 'Beach', 'Office', 'Car', 'Outdoor', 'Indoor', 'Hotel', 'Home'].map(cat => (
            <button key={cat} className="search-category-pill" onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}>
              {cat}
            </button>
          ))}
        </div>
        <Pagination currentPage={page} onPageChange={setPage} />
        <FooterLinks />
      </main>
      <Footer />
    </div>
  )
}

