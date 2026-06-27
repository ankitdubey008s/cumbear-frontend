import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import Header from '../components/Header';
import CategoriesBar from '../components/CategoriesBar';
import VideoCard from '../components/VideoCard';
import ShortsRow from '../components/ShortsRow';
import AdBanner from '../components/AdBanner';
import Pagination from '../components/Pagination';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { Gender, Video, Short } from '../types';
import { getVideosByCategory } from '../data/upstashApi';
import { getShortsByGender } from '../data/mockData';

export default function CategoryPage() {
  const [, params] = useRoute('/category/:category/page/:page');
  useRoute('/category/:category');
  
  const category = params?.category || 'All';
  const page = parseInt(params?.page || '1');
  
  const [selectedGender, setSelectedGender] = useState<Gender>('All');
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Short[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedCategory(category);
    setLoading(true);
    
    const loadData = async () => {
      try {
        const fetchedVideos = await getVideosByCategory(category, page, 30);
        const fetchedShorts = getShortsByGender(selectedGender, 10);
        setVideos(fetchedVideos);
        setShorts(fetchedShorts);
        setTotalPages(10);
      } catch (error) {
        console.error('Failed to load category:', error);
      } finally {
        setLoading(false);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    loadData();
  }, [category, page, selectedGender]);

  const handleCategoryChange = (cat: string) => {
    if (cat === 'All') {
      window.location.href = '/';
    } else {
      window.location.href = `/category/${encodeURIComponent(cat)}`;
    }
  };

  // Pattern: 5 videos → ad → 5 videos → shorts → 5 videos → ad → 5 videos → shorts
  const buildFeed = () => {
    const feed: (Video | { type: 'ad' } | { type: 'shorts'; shorts: Short[] })[] = [];
    let videoIndex = 0;
    let cycleCount = 0;

    while (videoIndex < videos.length) {
      const cycle = cycleCount % 2;
      
      for (let i = 0; i < 5 && videoIndex < videos.length; i++) {
        feed.push(videos[videoIndex]);
        videoIndex++;
      }
      
      if (videoIndex >= videos.length) break;
      
      if (cycle === 0) {
        feed.push({ type: 'ad' });
      } else {
        feed.push({ type: 'shorts', shorts: shorts.slice(0, 4) });
      }
      
      cycleCount++;
    }
    
    return feed;
  };

  const feed = buildFeed();

  const renderFeed = () => {
    const elements: JSX.Element[] = [];
    let currentGrid: Video[] = [];

    for (const item of feed) {
      if ('type' in item && item.type === 'ad') {
        if (currentGrid.length > 0) {
          elements.push(
            <div key={`grid-${elements.length}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentGrid.map((v) => <VideoCard key={v.id} video={v} />)}
            </div>
          );
          currentGrid = [];
        }
        elements.push(
          <div key={`ad-${elements.length}`} className="px-0 sm:px-0">
            <AdBanner />
          </div>
        );
      } else if ('type' in item && item.type === 'shorts') {
        if (currentGrid.length > 0) {
          elements.push(
            <div key={`grid-${elements.length}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentGrid.map((v) => <VideoCard key={v.id} video={v} />)}
            </div>
          );
          currentGrid = [];
        }
        elements.push(<ShortsRow key={`shorts-${elements.length}`} shorts={item.shorts} />);
      } else {
        currentGrid.push(item as Video);
        if (currentGrid.length === 3) {
          elements.push(
            <div key={`grid-${elements.length}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentGrid.map((v) => <VideoCard key={v.id} video={v} />)}
            </div>
          );
          currentGrid = [];
        }
      }
    }

    if (currentGrid.length > 0) {
      elements.push(
        <div key={`grid-${elements.length}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentGrid.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      );
    }

    return elements;
  };

  return (
    <div className="min-h-screen bg-cumbear-black pb-16">
      <Header selectedGender={selectedGender} onGenderChange={setSelectedGender} />
      <CategoriesBar selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />

      <main className="max-w-7xl mx-auto">
        {/* Ad banner below categories */}
        <div className="px-3 sm:px-4 py-3">
          <div className="w-full h-[120px] max-w-[720px] mx-auto bg-cumbear-ad-bg border border-dashed border-cumbear-border rounded-lg flex flex-col items-center justify-center">
            <span className="text-cumbear-text-dim text-xs font-medium uppercase tracking-wider">Advertisement</span>
            <span className="text-cumbear-text-dim/50 text-[10px]">720 x 120</span>
          </div>
        </div>

        <div className="px-3 sm:px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-cumbear-red" />
            <h1 className="text-lg font-bold text-cumbear-text">
              {category} Videos
              <span className="text-cumbear-text-muted text-sm font-normal ml-2">
                Page {page} of {totalPages}
              </span>
            </h1>
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

              {/* Pagination - after all videos */}
              <Pagination currentPage={page} totalPages={totalPages} category={category} />

              {/* Pros & Cons - at bottom after pagination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-cumbear-border">
                <div className="bg-cumbear-card border border-cumbear-border rounded-xl p-3">
                  <h3 className="text-sm font-bold text-cumbear-text mb-2">Pros</h3>
                  <ul className="text-xs text-cumbear-text-muted space-y-1">
                    <li>Free access to thousands of videos</li>
                    <li>High-quality thumbnails and metadata</li>
                    <li>Regular updates with fresh content</li>
                    <li>Fast loading and mobile optimized</li>
                  </ul>
                </div>
                <div className="bg-cumbear-card border border-cumbear-border rounded-xl p-3">
                  <h3 className="text-sm font-bold text-cumbear-text mb-2">Cons</h3>
                  <ul className="text-xs text-cumbear-text-muted space-y-1">
                    <li>Videos redirect to external sites</li>
                    <li>Some links may become inactive</li>
                    <li>Ads on external platforms</li>
                    <li>Content availability varies by region</li>
                  </ul>
                </div>
              </div>

              {/* Disclaimer - very bottom */}
              <div className="bg-cumbear-card/50 border border-cumbear-border rounded-xl p-3">
                <p className="text-xs text-cumbear-text-dim leading-relaxed">
                  <strong className="text-cumbear-text-muted">Disclaimer:</strong> Cumbear is a video aggregator platform.
                  We do not host, produce, or own any of the content displayed. All videos are linked from third-party sources.
                  If you believe any content violates your rights, please contact us for immediate removal under DMCA guidelines.
                </p>
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

