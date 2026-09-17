import { useEffect, useState } from 'react';

const API_BASE = 'https://cumbear-backend.vercel.app/api/videos';

export default function App() {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVideos(page);
  }, [page]);

  const fetchVideos = async (pageNum) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?page=${pageNum}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setVideos(data.data);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 bg-neutral-900 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-wide text-red-500 uppercase">
          Cum<span className="text-white">Bear</span>
        </h1>
        <span className="text-xs text-neutral-400">Page {page} of {totalPages}</span>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
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
              <iframe
                src={selectedVideo.embedUrl}
                className="w-full h-full border-0"
                allowFullScreen
                title={selectedVideo.title}
              ></iframe>
            </div>
          </section>
        )}

        {loading ? (
          <div className="text-center py-20 text-neutral-500">Loading videos...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((vid) => (
              <div
                key={vid._id}
                onClick={() => setSelectedVideo(vid)}
                className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden cursor-pointer hover:border-red-500 transition-all group"
              >
                <div className="aspect-video bg-neutral-800 relative overflow-hidden">
                  <img
                    src={vid.thumbnailUrl}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium line-clamp-2 text-neutral-200 group-hover:text-red-400 transition-colors">
                    {vid.title}
                  </p>
                  <span className="text-xs text-neutral-500 mt-2 block">
                    {vid.sourceSite || 'External'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

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

