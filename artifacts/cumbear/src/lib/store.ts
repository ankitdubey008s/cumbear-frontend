export interface VideoMusic {
  name: string;
  artist?: string;
  url?: string;
  volume?: number;
  source?: "audius" | "jamendo" | "device";
}

export interface Comment {
  id: string;
  username: string;
  text?: string;
  gif?: string;
  timestamp: number;
  likes: number;
  replyTo?: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  caption?: string;
  duration: number;
  isShort: boolean;
  aspectRatio?: string;
  views: number;
  likes: number;
  comments: Comment[];
  telegramFileId?: string;
  tags?: string;
  category?: string;
  uploaderName?: string;
  uploaderEmail?: string;
  music?: VideoMusic;
}

export const CATEGORIES = [
  "All", "Amateur", "Stepsis", "Mom", "3some", "Big Ass",
  "Couples", "Married", "Neighbour", "Blacked", "Russian", "American"
];

// In-memory cache
let cachedVideos: Video[] = [];
let fetchingPromise: Promise<Video[]> | null = null;

async function fetchVideosFromProxy(category?: string): Promise<Video[]> {
  try {
    const query = category && category !== 'All' ? category.toLowerCase() : 'popular';
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/videos?query=${query}&per_page=48`);
    const data = await response.json();
    
    if (!data.videos || !Array.isArray(data.videos)) {
      console.warn('No videos from proxy');
      return [];
    }
    
    return data.videos.map((v: any, index: number) => ({
      id: v.id || `proxy_${Date.now()}_${index}`,
      title: v.title || 'Premium Video',
      description: `${(v.views || 0).toLocaleString()} views`,
      url: v.embed_url || v.url || '',
      thumbnailUrl: v.thumb || v.default_thumb || `https://picsum.photos/id/${index % 100}/320/180`,
      duration: v.duration || 600,
      isShort: (v.duration || 0) < 60,
      views: v.views || Math.floor(Math.random() * 5000000) + 100000,
      likes: Math.floor((v.views || 100000) * 0.05),
      comments: [],
      category: category || 'Popular',
      uploaderName: v.uploader || v.uploaderName || 'Premium Network',
      tags: query
    }));
  } catch (error) {
    console.error('Proxy fetch error:', error);
    return [];
  }
}

export async function getVideos(): Promise<Video[]> {
  if (cachedVideos.length > 0) {
    return cachedVideos;
  }
  
  if (fetchingPromise) {
    return fetchingPromise;
  }
  
  fetchingPromise = fetchVideosFromProxy('All');
  cachedVideos = await fetchingPromise;
  fetchingPromise = null;
  
  return cachedVideos;
}

export function getVideoById(id: string): Video | undefined {
  return cachedVideos.find(v => v.id === id);
}

export function hasLiked(videoId: string): boolean {
  try {
    const liked = JSON.parse(localStorage.getItem("cumbear_liked") || "[]");
    return liked.includes(videoId);
  } catch { return false; }
}

export function toggleLike(videoId: string): boolean {
  if (hasLiked(videoId)) return false;
  const liked = JSON.parse(localStorage.getItem("cumbear_liked") || "[]");
  liked.push(videoId);
  localStorage.setItem("cumbear_liked", JSON.stringify(liked));
  const video = cachedVideos.find(v => v.id === videoId);
  if (video) video.likes++;
  return true;
}

export function addComment(videoId: string, comment: Comment) {
  const video = cachedVideos.find(v => v.id === videoId);
  if (video) video.comments.unshift(comment);
}

export function incrementViews(videoId: string) {
  const video = cachedVideos.find(v => v.id === videoId);
  if (video) video.views++;
}

export function hasLikedComment(commentId: string): boolean {
  try {
    const liked = JSON.parse(localStorage.getItem("cumbear_comment_likes") || "[]");
    return liked.includes(commentId);
  } catch { return false; }
}

export function toggleCommentLike(videoId: string, commentId: string): boolean {
  if (hasLikedComment(commentId)) return false;
  const liked = JSON.parse(localStorage.getItem("cumbear_comment_likes") || "[]");
  liked.push(commentId);
  localStorage.setItem("cumbear_comment_likes", JSON.stringify(liked));
  const video = cachedVideos.find(v => v.id === videoId);
  if (video) {
    const comment = video.comments.find(c => c.id === commentId);
    if (comment) comment.likes++;
  }
  return true;
}

export function addVideo(video: Video) {
  cachedVideos.unshift(video);
  localStorage.setItem("cumbear_videos_cache", JSON.stringify(cachedVideos));
}

export function deleteVideo(id: string) {
  cachedVideos = cachedVideos.filter(v => v.id !== id);
  localStorage.setItem("cumbear_videos_cache", JSON.stringify(cachedVideos));
}

export function setOwnerMode() {
  localStorage.setItem("cumbear_owner", "true");
}

export function isOwner(): boolean {
  try { return localStorage.getItem("cumbear_owner") === "true"; } catch { return false; }
}
