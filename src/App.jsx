import { useEffect, useState } from 'react';

const API_BASE = 'https://cumbear-backend.vercel.app/api/videos';

export default function App() {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos(page);
  }, [page]);

  const fetchVideos = async (pageNum) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?page=${pageNum}&limit=20`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setVideos(data.data);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Resolves thumbnail from multiple potential database key names
  const getThumbnail = (vid) => {
    const url = vid.thumbnailUrl || vid.thumbnail || vid.poster || vid.image_url || vid.thumb;
    if (!url) return null;
    return url.startsWith('http://') ? url.replace('http://', 'https://') : url;
  };

  // Resolves embed/play URL from multiple potential database key names
  const getEmbedUrl = (vid) => {
    const url = vid.embedUrl || vid.embed_url || vid.iframeUrl || vid.url || vid.link;
    if (!url) return null;
    return url.startsWith('http://') ? url.replace('http://', 'https://') : url;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      <header className="border-b border-neutral-800 bg-neutral-900 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-wide text-red-500 uppercase">
          Cum<span className="text-white">Bear</span>
        </h1>
        <span className="text-xs text-neutral-400">Page {page} of {totalPages}</span>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Selected Video Player */}
        {selectedVideo && (
          <section className="mb-8 bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold truncate pr-4">{selectedVideo.title}</h2>
              <button 
                onClick={() => setSelectedVideo(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-sm px-3 py-1 rounded text-white"
              >
                Close Player ✕
              </button>
            </div>
            <div className="relative aspect-video w-full rounded overflow-hidden bg-black">
              {getEmbedUrl(selectedVideo) ? (
                <iframe
                  src={getEmbedUrl(selectedVideo)}
                  className="w-full h-full border-0"
                  allowFullScreen
                  title={selectedVideo.title}
                ></iframe>
              ) : (
                <div className="flex items-center justify-center h-full text-neutral-500">
                  Embed URL unavailable for this item
                </div>
              )}
            </div>
          </section>
        )}

        {/* Video Grid */}
        {loading ? (
          <div className="text-center py-20 text-neutral-500">Loading videos...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((vid, idx) => {
              const thumb = getThumbnail(vid);
              return (
                <div
                  key={vid._id || idx}
                  onClick={() => setSelectedVideo(vid)}
                  className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden cursor-pointer hover:border-red-500 transition-all group"
                >
                  <div className="aspect-video bg-neutral-800 relative overflow-hidden flex items-center justify-center">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/320x180/171717/ef4444?text=No+Thumbnail';
                        }}
                      />
                    ) : (
                      <span className="text-xs text-neutral-600">No Image</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium line-clamp-2 text-neutral-200 group-hover:text-red-400 transition-colors">
                      {vid.title || 'Untitled Video'}
                    </p>
                    <span className="text-xs text-neutral-500 mt-2 block">
                      {vid.sourceSite || vid.site || 'External'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-4 my-8">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="px-4 py-2 bg-neutral-800 rounded disabled:opacity-50 hover:bg-neutral-700 text-sm font-semibold"
          >
            Previous
          </button>
          <span className="text-sm font-medium">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-neutral-800 rounded disabled:opacity-50 hover:bg-neutral-700 text-sm font-semibold"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}

