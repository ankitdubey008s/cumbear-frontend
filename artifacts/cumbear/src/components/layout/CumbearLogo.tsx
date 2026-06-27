import { cn } from "@/lib/utils";

interface CumbearLogoProps {
  className?: string;
  size?: "sm" | "md";
}

export function CumbearLogo({ className, size = "md" }: CumbearLogoProps) {
  const h = size === "sm" ? "h-7" : "h-9";
  const iconSize = size === "sm" ? 18 : 22;
  const textSize = size === "sm" ? "text-[14px]" : "text-[16px]";
  const px = size === "sm" ? "px-2" : "px-3";

  return (
    <div className={cn("inline-flex items-center rounded-xl bg-[#FF6B81] overflow-hidden flex-shrink-0", h, className)}>
      {/* Icon box */}
      <div
        className="flex items-center justify-center flex-shrink-0 bg-[#1e2028] rounded-[9px] m-[3px]"
        style={{ width: iconSize + 6, height: iconSize + 6 }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 22 22" fill="none">
          {/* Ears */}
          <circle cx="4.5" cy="5" r="2.8" fill="#FF6B81"/>
          <circle cx="17.5" cy="5" r="2.8" fill="#FF6B81"/>
          {/* Face */}
          <ellipse cx="11" cy="13" rx="7.5" ry="7" fill="#FF6B81"/>
          {/* Angry brow marks */}
          <path d="M7 10L8.8 11.2" stroke="#1e2028" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M15 10L13.2 11.2" stroke="#1e2028" strokeWidth="1.4" strokeLinecap="round"/>
          {/* Eyes */}
          <circle cx="8.5" cy="12" r="0.9" fill="#1e2028"/>
          <circle cx="13.5" cy="12" r="0.9" fill="#1e2028"/>
          {/* Snout */}
          <ellipse cx="11" cy="15" rx="2.2" ry="1.6" fill="#f5a0b0"/>
          {/* Nose */}
          <ellipse cx="11" cy="14.2" rx="1.3" ry="0.9" fill="#1e2028"/>
          {/* Smug smile */}
          <path d="M9.2 16.5 Q11 17.8 12.8 16.5" stroke="#1e2028" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
          {/* Lightning bolt (on right ear side) */}
          <path d="M17.5 1.5 L16 5 H18 L16.5 8.5" stroke="#1e2028" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {/* Text */}
      <span className={cn("font-bold text-[#1e2028] tracking-tight leading-none", px, textSize)}>
        Cumbear
      </span>
    </div>
  );
}
