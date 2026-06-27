import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Share2, Heart, Download } from "lucide-react";

export function VideoDetail() {
  const [, navigate] = useLocation();
  const [similar, setSimilar] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const embedUrl = params.get('url') || "";
  const title = params.get('title') || "Cumbear Premium Feature";
  const views = parseInt(params.get('views') || "1200000");

  const playerUrl = `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`;

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // नए बैकएंड के होम फ़ीड से 'Up Next' वीडियोज़ उठाना
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:10000";
    fetch(`${apiUrl}/api/v1/feed/home`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === "success" && resData.layoutTree) {
          // लेआउट ट्री से सिर्फ वीडियोस को फ़िल्टर करके निकालना (विज्ञापनों को छोड़कर)
          const extractedVideos = resData.layoutTree
            .filter((node: any) => node.type === "video")
            .map((node: any) => node.data);
          
          setSimilar(extractedVideos);
        }
      })
      .catch((err) => console.error("Error fetching similar videos:", err));
  }, [embedUrl]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col pb-20">
      <header className="h-14 px-4 flex items-center bg-[#0a0a0a]/90 backdrop-blur-lg sticky top-0 z-50 border-b border-white/10">
        <button onClick={() => navigate("/")} className="mr-4 p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-200" />
        </button>
        <span className="font-black tracking-widest text-sm text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
          CUMBEAR
        </span>
      </header>

      {/* Modern Player Container */}
      <div className="relative w-full aspect-video bg-black overflow-hidden shadow-2xl">
        <iframe
          src={playerUrl}
          className="absolute inset-0 w-full h-full border-none scale-[1.05]"
          allow="autoplay; fullscreen"
        />
        {!isPlaying && (
          <div
            className="absolute inset-0 z-30 bg-transparent cursor-pointer"
            onClick={() => setIsPlaying(true)}
          />
        )}
      </div>

      <div className="p-5 border-b border-white/10">
        <h1 className="text-lg font-bold leading-tight text-gray-100">{title}</h1>
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm font-medium text-gray-400">
            {views >= 1000000 ? (views / 1000000).toFixed(1) + "M" : (views / 1000).toFixed(0) + "K"} views
          </p>
          <div className="flex gap-4">
            <button className="flex flex-col items-center text-gray-400 hover:text-red-500 transition-colors">
              <Heart className="w-5 h-5 mb-1" />
              <span className="text-[10px] uppercase font-bold">Like</span>
            </button>
            <button className="flex flex-col items-center text-gray-400 hover:text-white transition-colors">
              <Share2 className="w-5 h-5 mb-1" />
              <span className="text-[10px] uppercase font-bold">Share</span>
            </button>
            <button className="flex flex-col items-center text-gray-400 hover:text-white transition-colors">
              <Download className="w-5 h-5 mb-1" />
              <span className="text-[10px] uppercase font-bold">Save</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1">
        <h2 className="text-sm font-black tracking-widest text-gray-500 uppercase mb-4">Up Next on Cumbear</h2>
        {similar.length === 0 ? (
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto my-10" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {similar.map((v) => (
              <SimilarVideoCard key={v.id} video={v} navigate={navigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SimilarVideoCard({ video, navigate }: { video: any; navigate: any }) {
  const handleClick = () => {
    // बिना पेज रीलोड किए स्मूथ नेविगेशन
    navigate(`/video/${video.id}?url=${encodeURIComponent(video.embed_url)}&title=${encodeURIComponent(video.title)}&views=${video.views}`);
    // नए वीडियो पर स्विच होने पर पेज को ऊपर स्क्रॉल करना
    window.scrollTo(0, 0);
  };

  return (
    <div onClick={handleClick} className="flex flex-col gap-2 cursor-pointer group">
      <div className="relative aspect-video bg-[#1a1a1a] rounded-lg overflow-hidden border border-white/5">
        <img
          src={video.thumbnail_url}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
          HD
        </div>
      </div>
      <h3 className="text-xs font-bold text-gray-200 line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">
        {video.title}
      </h3>
    </div>
  );
}
