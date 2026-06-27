import { Video } from '../types';
import { formatViews } from '../lib/utils';

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  const handleClick = () => {
    window.open(video.sourceUrl, '_blank');
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer"
    >
      {/* Thumbnail - 16:9 aspect ratio */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-cumbear-card">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
          {video.duration}
        </div>
      </div>

      {/* Info below thumbnail */}
      <div className="mt-2.5 flex gap-3 px-0.5">
        {/* Channel avatar placeholder */}
        <div className="shrink-0 w-9 h-9 rounded-full bg-cumbear-card border border-cumbear-border flex items-center justify-center">
          <span className="text-cumbear-text-muted text-xs font-bold">
            {video.username.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Title and meta */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-cumbear-text line-clamp-2 leading-snug group-hover:text-white transition-colors">
            {video.title}
          </h3>
          <div className="mt-1 text-cumbear-text-dim text-xs">
            <span>{video.username}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span>{formatViews(video.views)} views</span>
              <span>•</span>
              <span>{video.category}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

