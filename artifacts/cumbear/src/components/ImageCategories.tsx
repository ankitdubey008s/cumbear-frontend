import { IMAGE_CATEGORIES } from '../types';

interface ImageCategoriesProps {
  onCategorySelect: (category: string) => void;
}

export default function ImageCategories({ onCategorySelect }: ImageCategoriesProps) {
  const imageMap: Record<string, string> = {
    'Russian': '/russian.jpg',
    'American': '/american.jpg',
    'British': '/british.jpg',
    'Asian': '/asian.jpg',
    'European': '/european.jpg',
    'Japanese': '/japanese.jpg',
    'Colombian': '/colombian.jpg',
    'Thai': '/thai.jpg',
  };

  const rows: typeof IMAGE_CATEGORIES[] = [];
  for (let i = 0; i < IMAGE_CATEGORIES.length; i += 2) {
    rows.push(IMAGE_CATEGORIES.slice(i, i + 2));
  }

  return (
    <div className="py-4 px-3 sm:px-4">
      <div className="space-y-3">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-2 gap-3">
            {row.map((item) => (
              <div key={item.id}>
                {item.isAd ? (
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-cumbear-ad-bg border border-dashed border-cumbear-sponsor/50 flex flex-col items-center justify-center">
                    <span className="text-cumbear-sponsor text-xs font-bold uppercase tracking-wider">Sponsor</span>
                    <span className="text-cumbear-text-dim/50 text-[10px] mt-1">Ad Space</span>
                    <div className="absolute top-2 right-2 bg-cumbear-sponsor text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                      SPONSORED
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onCategorySelect(item.label)}
                    className="relative aspect-[16/9] rounded-xl overflow-hidden bg-cumbear-card border border-cumbear-border hover:border-cumbear-border-hover transition-all group w-full"
                  >
                    <img
                      src={imageMap[item.label] || ''}
                      alt={item.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-lg sm:text-xl tracking-wide group-hover:text-white transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-cumbear-text-muted text-[10px]">Hot</span>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

