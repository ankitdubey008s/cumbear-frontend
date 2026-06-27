import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import VideoCard from '../components/VideoCard';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { Gender, Video } from '../types';
import { searchVideos } from '../data/upstashApi';
import { Search as SearchIcon, X, TrendingUp, Clock } from 'lucide-react';

export default function Search() {
  const [selectedGender, setSelectedGender] = useState<Gender>('All');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trendingSearches = [
    'Amateur', 'MILF', 'POV', 'Japanese', 'Teen', 'Anal', 'Threesome', 'Latina'
  ];

  const recentSearches = JSON.parse(localStorage.getItem('cumbear_recent_searches') || '[]');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setLoading(true);
    setSearched(true);
    
    const updated = [searchQuery, ...recentSearches.filter((s: string) => s !== searchQuery)].slice(0, 10);
    localStorage.setItem('cumbear_recent_searches', JSON.stringify(updated));
    
    try {
      const fetched = await searchVideos(searchQuery);
      setResults(fetched);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-cumbear-black pb-16">
      <Header selectedGender={selectedGender} onGenderChange={setSelectedGender} />

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4">
        <div className="relative mb-6">
          <div className="flex items-center bg-cumbear-card border border-cumbear-border rounded-full px-4 py-3 focus-within:border-cumbear-border-hover transition-colors">
            <SearchIcon className="w-5 h-5 text-cumbear-text-dim shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Search videos, categories, tags..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-cumbear-text-dim ml-3 text-sm"
            />
            {query && (
              <button onClick={clearSearch} className="p-1 text-cumbear-text-dim hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleSearch(query)}
              className="ml-2 px-4 py-1.5 rounded-full bg-cumbear-red text-white text-sm font-medium hover:bg-cumbear-red-hover transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {!searched ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-cumbear-red" />
                <h2 className="text-sm font-bold text-cumbear-text">Trending Searches</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-3 py-1.5 rounded-full bg-cumbear-card border border-cumbear-border text-cumbear-text-muted text-xs hover:border-cumbear-border-hover hover:text-white transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-cumbear-text-dim" />
                  <h2 className="text-sm font-bold text-cumbear-text">Recent Searches</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(term)}
                      className="px-3 py-1.5 rounded-full bg-cumbear-card border border-cumbear-border text-cumbear-text-muted text-xs hover:border-cumbear-border-hover hover:text-white transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-cumbear-text">
                Results for "{query}"
                <span className="text-cumbear-text-muted text-sm font-normal ml-2">
                  {results.length} videos found
                </span>
              </h2>
            </div>

            {loading ? (
              <div className="flex flex-col gap-2 sm:gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-2 sm:p-3 rounded-xl bg-cumbear-card border border-cumbear-border animate-pulse">
                    <div className="shrink-0 w-[160px] sm:w-[200px] aspect-video bg-cumbear-dark rounded-lg" />
                    <div className="flex-1 py-1 space-y-2">
                      <div className="h-4 bg-cumbear-dark rounded w-3/4" />
                      <div className="h-3 bg-cumbear-dark rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="flex flex-col gap-2 sm:gap-3">
                {results.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <SearchIcon className="w-12 h-12 text-cumbear-text-dim mx-auto mb-3" />
                <p className="text-cumbear-text-muted text-sm">No videos found for "{query}"</p>
                <p className="text-cumbear-text-dim text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}

