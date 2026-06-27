import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import Header from '../components/Header';
import CategoriesBar from '../components/CategoriesBar';
import VideoCard from '../components/VideoCard';
import ShortsRow from '../components/ShortsRow';
import ImageCategories from '../components/ImageCategories';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { Gender, Video, Short } from '../types';
import { getVideosByCategory, getShorts } from '../data/upstashApi';

export default function Home() {
  const [selectedGender, setSelectedGender] = useState<Gender>('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    const loadData = async () => {
      try {
        const fetchedVideos = await getVideosByCategory('Amateur', 1, 20, selectedGender);
        const fetchedShorts = await getShorts(selectedGender, 10);
        setVideos(fetchedVideos);
        setShorts(fetchedShorts);
      } catch (error) {
        console.error('Failed to load videos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [selectedGender, selectedCategory]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    if (category !== 'All') {
      window.location.href = `/category/${encodeURIComponent(category)}`;
    }
  };

  const buildFeed = () => {
    const feed: (Video | { type: 'shorts'; shorts: Short[] })[] = [];
    let videoCount = 0;
    let shortInsertCount = 0;

    for (let i = 0; i < videos.length; i++) {
      feed.push(videos[i]);
      videoCount++;

      if (videoCount % 10 === 0 && shortInsertCount < 2) {
        feed.push({ type: 'shorts', shorts: shorts.slice(shortInsertCount * 5, (shortInsertCount + 1) * 5) });
        shortInsertCount++;
      }
    }
    return feed;
  };

  const feed = buildFeed();

  const renderFeed = () => {
    const elements: JSX.Element[] = [];
    let currentRow: Video[] = [];

    for (const item of feed) {
      if ('type' in item && item.type === 'shorts') {
        if (currentRow.length > 0) {
          elements.push(
            <div key={`row-${elements.length}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentRow.map((v) => <VideoCard key={v.id} video={v} />)}
            </div>
          );
          currentRow = [];
        }
        elements.push(<ShortsRow key={`shorts-${elements.length}`} shorts={item.shorts} />);
      } else {
        currentRow.push(item as Video);
        if (currentRow.length === 3) {
          elements.push(
            <div key={`row-${elements.length}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentRow.map((v) => <VideoCard key={v.id} video={v} />)}
            </div>
          );
          currentRow = [];
        }
      }
    }

    if (currentRow.length > 0) {
      elements.push(
        <div key={`row-${elements.length}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentRow.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      );
    }

    return elements;
  };

  return (
    <div className="min-h-screen bg-cumbear-black pb-16">
      <Header selectedGender={selectedGender} onGenderChange={setSelectedGender} />
      <CategoriesBar selectedCategory={selectedCategory} onCategoryChange={handleCategorySelect} />

      <main className="max-w-7xl mx-auto">
        <div className="px-3 sm:px-4 py-3">
          <div className="w-full h-[120px] max-w-[720px] mx-auto bg-cumbear-ad-bg border border-dashed border-cumbear-border rounded-lg flex flex-col items-center justify-center">
            <span className="text-cumbear-text-dim text-xs font-medium uppercase tracking-wider">Advertisement</span>
            <span className="text-cumbear-text-dim/50 text-[10px]">720 x 120</span>
          </div>
        </div>

        {selectedCategory === 'All' && (
          <ImageCategories onCategorySelect={handleCategorySelect} />
        )}

        <div className="px-3 sm:px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-white" />
            <h2 className="text-base font-bold text-cumbear-text">
              {selectedCategory === 'All' ? 'Trending Videos' : `${selectedCategory} Videos`}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full aspect-video bg-cumbear-card rounded-xl" />
                  <div className="mt-2.5 flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-cumbear-card" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-cumbear-card rounded w-3/4" />
                      <div className="h-3 bg-cumbear-card rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {renderFeed()}

              <div className="flex justify-center py-6">
                <Link href="/category/All/page/2">
                  <a className="px-6 py-2.5 rounded-full bg-cumbear-card border border-cumbear-border text-cumbear-text-muted text-sm font-medium hover:border-cumbear-border-hover hover:text-white transition-all">
                    View More Videos
                  </a>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}

