import { Video } from '../types';

const API_BASE = 'https://cumbear-mxpk.onrender.com/api';

export interface ApiVideo {
  id: string;
  title: string;
  username: string;
  category: string;
  views: number;
  likes: number;
  comments: number;
  thumbnail: string;
  duration: string;
  sourceUrl: string;
  gender: string;
  tags: string[];
}

export async function getVideosByCategory(
  category: string, 
  page: number = 1, 
  limit: number = 20,
  gender: string = 'All'
): Promise<Video[]> {
  try {
    const url = `${API_BASE}/videos?category=${encodeURIComponent(category)}&page=${page}&limit=${limit}&gender=${gender}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: ApiVideo[] = await response.json();
    
    return data.map(v => ({
      id: v.id,
      title: v.title,
      username: v.username,
      category: v.category,
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      thumbnail: v.thumbnail,
      duration: v.duration,
      sourceUrl: v.sourceUrl,
      gender: v.gender,
      tags: v.tags,
    }));
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
}

export async function searchVideos(query: string, gender: string = 'All'): Promise<Video[]> {
  try {
    const url = `${API_BASE}/search?q=${encodeURIComponent(query)}&gender=${gender}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: ApiVideo[] = await response.json();
    
    return data.map(v => ({
      id: v.id,
      title: v.title,
      username: v.username,
      category: v.category,
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      thumbnail: v.thumbnail,
      duration: v.duration,
      sourceUrl: v.sourceUrl,
      gender: v.gender,
      tags: v.tags,
    }));
  } catch (error) {
    console.error('Error searching:', error);
    return [];
  }
}

export async function getAllCategories(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/categories`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getShorts(gender: string = 'All', limit: number = 10): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE}/shorts?gender=${gender}&limit=${limit}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching shorts:', error);
    return [];
  }
}

export async function getTotalCount(): Promise<number> {
  try {
    const response = await fetch(`${API_BASE}/stats/count`);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    return 0;
  }
}

