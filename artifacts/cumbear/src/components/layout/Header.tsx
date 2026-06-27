import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { CumbearLogo } from "./CumbearLogo";

export function Header() {
  const [visible, setVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const lastScrollY = useRef(0);
  const [, navigate] = useLocation();

  useEffect(() => {
    const onScroll = () => {
      const cur = window.scrollY;
      const delta = cur - lastScrollY.current;
      if (delta > 6 && cur > 60) { setVisible(false); setSearchOpen(false); }
      else if (delta < -4) setVisible(true);
      lastScrollY.current = cur;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false);
      setSearchQ("");
    }
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-40 h-14 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 flex items-center justify-between transition-transform duration-300 ease-in-out",
      visible ? "translate-y-0" : "-translate-y-full"
    )}>
      <Link href="/">
        <CumbearLogo size="sm" />
      </Link>

      <div className="flex items-center gap-2">
        {searchOpen ? (
          <form onSubmit={handleSearch} className="animate-in fade-in slide-in-from-right-4">
            <input
              autoFocus
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search videos..."
              className="w-44 bg-card text-white h-8 rounded-full px-4 text-sm border border-border focus:outline-none focus:border-primary"
              onBlur={() => { if (!searchQ.trim()) setSearchOpen(false); }}
            />
          </form>
        ) : (
          <button onClick={() => setSearchOpen(true)} className="p-2 text-white hover:text-primary transition-colors">
            <Search className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}
