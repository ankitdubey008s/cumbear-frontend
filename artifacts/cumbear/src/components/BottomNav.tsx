import { Link, useLocation } from 'wouter';
import { Home, PlaySquare, Search, Upload } from 'lucide-react';
import { cn } from '../lib/utils';

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/shorts', icon: PlaySquare, label: 'Shorts' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/upload', icon: Upload, label: 'Upload' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-cumbear-black/95 backdrop-blur-md border-t border-cumbear-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors",
                  isActive ? "text-cumbear-red" : "text-cumbear-text-dim hover:text-white"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive && "fill-current")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

