import { useState } from 'react';
import { Link } from 'wouter';
import { Search, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { GENDERS, Gender } from '../types';

interface HeaderProps {
  selectedGender: Gender;
  onGenderChange: (gender: Gender) => void;
}

export default function Header({ selectedGender, onGenderChange }: HeaderProps) {
  const [showGenderMenu, setShowGenderMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cumbear-black/95 backdrop-blur-md border-b border-cumbear-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          <Link href="/">
            <a className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white flex items-center justify-center">
                <span className="text-black font-black text-sm sm:text-base">CB</span>
              </div>
              <span className="text-white font-bold text-lg sm:text-xl tracking-tight hidden sm:block">
                Cumbear
              </span>
            </a>
          </Link>

          <Link href="/search">
            <a className="flex-1 max-w-md mx-2 sm:mx-4">
              <div className="flex items-center bg-cumbear-card border border-cumbear-border rounded-full px-4 py-2 hover:border-cumbear-border-hover transition-colors">
                <Search className="w-4 h-4 text-cumbear-text-dim shrink-0" />
                <span className="ml-2 text-cumbear-text-dim text-sm truncate">Search videos...</span>
              </div>
            </a>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowGenderMenu(!showGenderMenu)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all border",
                  selectedGender !== 'All'
                    ? "bg-white border-white text-black"
                    : "bg-cumbear-card border-cumbear-border text-cumbear-text-muted hover:border-cumbear-border-hover"
                )}
              >
                {selectedGender === 'All' ? 'Gender' : selectedGender}
              </button>
              
              {showGenderMenu && (
                <div className="absolute right-0 top-full mt-2 bg-cumbear-card border border-cumbear-border rounded-xl shadow-2xl overflow-hidden min-w-[140px] z-50">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        onGenderChange(g);
                        setShowGenderMenu(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-cumbear-card-hover",
                        selectedGender === g ? "text-white font-semibold" : "text-cumbear-text-muted"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden p-2 text-cumbear-text-muted hover:text-white"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="sm:hidden border-t border-cumbear-border py-3 space-y-1">
            {GENDERS.map((g) => (
              <button
                key={g}
                onClick={() => {
                  onGenderChange(g);
                  setShowMobileMenu(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors",
                  selectedGender === g
                    ? "bg-white/10 text-white font-semibold"
                    : "text-cumbear-text-muted hover:bg-cumbear-card"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

