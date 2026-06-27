interface AdBannerProps {
  label?: string;
}

export default function AdBanner(_props: AdBannerProps) {
  return (
    <div 
      className="group cursor-pointer"
      onClick={() => window.open('https://example.com/ad', '_blank')}
    >
      {/* Thumbnail - same 16:9 as videos */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-cumbear-ad-bg border border-cumbear-border">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-cumbear-red/20 flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-cumbear-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-cumbear-text-muted text-xs font-medium">Sponsored Content</span>
          </div>
        </div>
        {/* Duration badge like videos */}
        <div className="absolute bottom-2 right-2 bg-cumbear-sponsor text-white text-xs px-1.5 py-0.5 rounded font-medium">
          AD
        </div>
      </div>

      {/* Info below - same style as videos */}
      <div className="mt-2.5 flex gap-3 px-0.5">
        <div className="shrink-0 w-9 h-9 rounded-full bg-cumbear-sponsor/20 flex items-center justify-center">
          <span className="text-cumbear-sponsor text-xs font-bold">SP</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-cumbear-text line-clamp-2 leading-snug">
            Hot Singles Near You - Click to Watch Now!
          </h3>
          <div className="mt-1 text-cumbear-text-dim text-xs">
            <span className="text-cumbear-sponsor font-medium">Sponsored</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span>Promoted</span>
              <span>•</span>
              <span>Ad</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

