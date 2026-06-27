import { useState, useEffect } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { Gender, Short } from '../types';
import { getShortsByGender } from '../data/mockData';
import { formatViews } from '../lib/utils';
import { Play, Eye } from 'lucide-react';

export default function Shorts() {
  const [selectedGender, setSelectedGender] = useState<Gender>('All');
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetched = getShortsByGender(selectedGender, 50);
    setShorts(fetched);
    setLoading(false);
  }, [selectedGender]);

  return (
    <div className="min-h-screen bg-cumbear-black pb-16">
      <Header selectedGender={selectedGender} onGenderChange={setSelectedGender} />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 rounded-full bg-cumbear-red" />
          <h1 className="text-xl font-bold text-white">Shorts</h1>
          <span className="text-cumbear-text-muted text-sm ml-2">Quick clips under 3 minutes</span>
        </div>

        <p className="text-sm text-cumbear-text-muted mb-4">
          Browse our collection of short-form videos. All clips are under 3 minutes and optimized for mobile viewing.
        </p>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] rounded-xl bg-cumbear-card border border-cumbear-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {shorts.map((short) => (
              <div
                key={short.id}
                onClick={() => window.open(short.sourceUrl, '_blank')}
                className="cursor-pointer group"
              >
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-cumbear-card border border-cumbear-border group-hover:border-cumbear-red/50 transition-all">
                  <img
                    src={short.thumbnail}
                    alt={short.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-cumbear-red/90 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs text-white font-medium line-clamp-2">{short.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Eye className="w-3 h-3 text-cumbear-text-muted" />
                      <span className="text-[10px] text-cumbear-text-muted">{formatViews(short.views)}</span>
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1 rounded">
                    {short.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}

