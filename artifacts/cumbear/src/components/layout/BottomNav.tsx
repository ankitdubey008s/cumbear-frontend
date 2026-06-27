import { useLocation } from "wouter";
import { Home, Film, Search, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location, navigate] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Film, label: "Shorts", path: "/shorts" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Upload, label: "Upload", path: "/upload" }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#121214] border-t border-zinc-800 px-2 py-2 flex items-center justify-around shadow-xl backdrop-blur-md bg-opacity-95">
      {navItems.map((item) => {
        const isActive = location === item.path;
        const IconComponent = item.icon;

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 text-center transition-all duration-200 rounded-xl relative active:scale-95",
              isActive ? "text-red-500 font-bold" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <IconComponent size={20} className={cn("transition-transform duration-200", isActive && "scale-110")} />
            <span className="text-[10px] uppercase font-mono tracking-widest mt-1">{item.label}</span>
            {isActive && (
              <span className="absolute bottom-0 w-5 h-0.5 bg-red-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
