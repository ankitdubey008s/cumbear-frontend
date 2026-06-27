import { cn } from '../lib/utils';
import { CATEGORIES } from '../types';

interface CategoriesBarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoriesBar({ selectedCategory, onCategoryChange }: CategoriesBarProps) {
  return (
    <div className="sticky top-14 sm:top-16 z-40 bg-cumbear-black/95 backdrop-blur-md border-b border-cumbear-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex gap-2 py-3 overflow-x-auto hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                selectedCategory === cat
                  ? "bg-white text-black shadow-lg"
                  : "bg-cumbear-card text-cumbear-text-muted border border-cumbear-border hover:border-cumbear-border-hover hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

