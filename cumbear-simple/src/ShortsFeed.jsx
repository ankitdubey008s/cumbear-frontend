import React, { useState, useEffect, useRef } from 'react';

const VideoPlayer = ({ src, thumbnail }) => {
  const videoRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.6 } // Video plays only when 60% or more is on screen
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => { if (videoRef.current) observer.unobserve(videoRef.current); };
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isIntersecting) {
      videoRef.current.play().catch((err) => console.log("Auto-play blocked:", err));
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Rewind to save network buffer
    }
  }, [isIntersecting]);

  return (
    <div style={styles.videoContainer}>
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail}
        style={styles.videoPlayer}
        loop
        playsInline
        muted
        controls
      />
    </div>
  );
};

export default function ShortsFeed() {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetches live feeds from your newly configured backend port
    fetch('http://localhost:3000/api/shorts')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data)) setShorts(data);
        else if (data.data && Array.isArray(data.data)) setShorts(data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading shorts feed:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={styles.centerText}>Loading Shorts...</div>;
  if (shorts.length === 0) return <div style={styles.centerText}>No Shorts Available</div>;

  return (
    <div style={styles.feedScrollWrapper}>
      {shorts.map((short, index) => (
        <VideoPlayer 
          key={short.shortId || index} 
          src={short.streamUrl} 
          thumbnail={short.thumbnailUrl} 
        />
      ))}
    </div>
  );
}

const styles = {
  feedScrollWrapper: {
    width: '100vw',
    height: '100vh',
    overflowY: 'scroll',
    scrollSnapType: 'y mandatory',
    backgroundColor: '#000',
    WebkitOverflowScrolling: 'touch',
  },
  videoContainer: {
    width: '100vw',
    height: '100vh',
    scrollSnapAlign: 'start',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  centerText: {
    color: '#fff',
    backgroundColor: '#000',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'sans-serif'
  }
};

