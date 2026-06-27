import { Short } from '../types';
import { formatViews } from '../lib/utils';
import { Play } from 'lucide-react';

interface ShortsRowProps {
  shorts: Short[];
}

export default function ShortsRow({ shorts }: ShortsRowProps) {
  // Build slots: 4 shorts + 1 ad pattern
  const buildSlots = () => {
    const slots: (Short | { type: 'ad' })[] = [];
    let shortIndex = 0;
    
    for (let i = 0; i < 5; i++) {
      if ((i + 1) % 3 === 0) {
        // Every 3rd slot is an ad
        slots.push({ type: 'ad' });
      } else if (shortIndex < shorts.length) {
        slots.push(shorts[shortIndex]);
        shortIndex++;
      }
    }
    return slots;
  };

  const slots = buildSlots();

  return (
    <div className="py-4 border-y border-cumbear-border">
      <div className="flex items-center gap-2 px-3 sm:px-4 mb-3">
        <div className="w-6 h-6 rounded bg-cumbear-red flex items-center justify-center">
          <Play className="w-3 h-3 text-white fill-white" />
        </div>
        <h2 className="text-base font-bold text-cumbear-text">Shorts</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar px-3 sm:px-4 pb-2">
        {slots.map((slot, index) => {
          if ('type' in slot && slot.type === 'ad') {
            return (
              <div
                key={`ad-${index}`}
                onClick={() => window.open('https://example.com/ad', '_blank')}
                className="shrink-0 w-[140px] sm:w-[160px] cursor-pointer group"
              >
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-cumbear-ad-bg border border-cumbear-border group-hover:border-cumbear-sponsor/50 transition-all">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full bg-cumbear-sponsor/20 flex items-center justify-center mx-auto mb-1">
                        <span className="text-cumbear-sponsor text-xs font-bold">AD</span>
                      </div>
                      <span className="text-cumbear-text-muted text-[10px]">Sponsored</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[10px] text-cumbear-sponsor font-medium">Sponsored</p>
                  </div>
                  <div className="absolute top-2 right-2 bg-cumbear-sponsor text-white text-[10px] px-1 rounded">
                    AD
                  </div>
                </div>
              </div>
            );
          }

          const short = slot as Short;
          return (
            <div
              key={short.id}
              onClick={() => window.open(short.sourceUrl, '_blank')}
              className="shrink-0 w-[140px] sm:w-[160px] cursor-pointer group"
            >
              <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-cumbear-card border border-cumbear-border group-hover:border-cumbear-border-hover transition-all">
                <img
                  src={short.thumbnail}
                  alt={short.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs text-white line-clamp-2 font-medium">{short.title}</p>
                  <p className="text-[10px] text-cumbear-text-muted mt-0.5">{formatViews(short.views)} views</p>
                </div>
                <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1 rounded">
                  {short.duration}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

