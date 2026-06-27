import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  category: string;
}

export default function Pagination({ currentPage, totalPages, category }: PaginationProps) {
  const getPageUrl = (page: number) => `/category/${encodeURIComponent(category)}/page/${page}`;
  
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {currentPage > 1 && (
        <Link href={getPageUrl(currentPage - 1)}>
          <a className="p-2 rounded-lg bg-cumbear-card border border-cumbear-border text-cumbear-text-muted hover:border-cumbear-red/50 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </a>
        </Link>
      )}
      
      {getVisiblePages().map((page, i) => (
        page === '...' ? (
          <span key={`dots-${i}`} className="text-cumbear-text-dim px-2">...</span>
        ) : (
          <Link key={page} href={getPageUrl(page as number)}>
            <a className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
              currentPage === page
                ? "bg-cumbear-red border-cumbear-red text-white"
                : "bg-cumbear-card border-cumbear-border text-cumbear-text-muted hover:border-cumbear-red/50 hover:text-white"
            )}>
              {page}
            </a>
          </Link>
        )
      ))}
      
      {currentPage < totalPages && (
        <Link href={getPageUrl(currentPage + 1)}>
          <a className="p-2 rounded-lg bg-cumbear-card border border-cumbear-border text-cumbear-text-muted hover:border-cumbear-red/50 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </a>
        </Link>
      )}
    </div>
  );
}

