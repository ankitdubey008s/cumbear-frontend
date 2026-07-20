export interface ShortVideo {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnail?: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  userId: string;
  username: string;
  userAvatar?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  storageProvider: string;
}

export interface LongVideo {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration: number;
  views: number;
  likes: number;
  provider: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type Gender = 'all' | 'male' | 'female' | 'lesbian' | 'gay' | 'trans' | 'bisexual' | 'asexual';

export type VideoFilter = 'popularity' | 'newest' | 'most_liked' | 'relevant';

export type GridType = '1' | '2';

export type Theme = 'dark' | 'light';

