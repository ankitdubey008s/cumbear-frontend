import { Request, Response } from 'express';
import axios from 'axios';

interface Video {
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

function formatDuration(seconds: any): string {
  const numSecs = parseInt(seconds as string) || 0;
  if (numSecs <= 0) return "05:00";
  const mins = Math.floor(numSecs / 60);
  const secs = numSecs % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const getLiveVideos = async (req: Request, res: Response) => {
  try {
    const category = (req.query.category as string) || 'Amateur';
    const page = parseInt(req.query.page as string) || 1;
    const gender = (req.query.gender as string) || 'Straight';
    const limitPerSource = 15;

    let aggregatedVideos: Video[] = [];

    const epornerPromise = axios.get('https://www.eporner.com/api/v2/video/search/', {
      params: { query: category, per_page: limitPerSource, page: page, thumbsize: 'big' }
    }).then(res => res.data?.videos || []).catch(() => []);

    const pornhubPromise = axios.get('https://www.pornhub.com/webmasters/search', {
      params: { search: category, page: page, thumbsize: 'medium' }
    }).then(res => res.data?.videos || []).catch(() => []);

    const [epornerRaw, pornhubRaw] = await Promise.all([epornerPromise, pornhubPromise]);

    const epornerProcessed: Video[] = epornerRaw.map((vid: any) => {
      const viewsCount = vid.views || Math.floor(Math.random() * 50000) + 10000;
      return {
        id: `ep_${vid.id}`,
        title: vid.title,
        username: 'Eporner',
        category: category,
        views: viewsCount,
        likes: Math.floor(viewsCount * 0.05),
        comments: Math.floor(viewsCount * 0.001),
        thumbnail: vid.default_thumb?.src || vid.thumbs?.[0]?.src || '',
        duration: formatDuration(vid.length_sec),
        sourceUrl: `${vid.url}?affid=${process.env.EPORNER_AFFILIATE_ID || 'cumbear_network_root'}&subid=cumbear_multi_backbone`,
        gender: gender,
        tags: vid.keywords ? vid.keywords.split(',').map((k: string) => k.trim()) : [category]
      };
    });

    const pornhubProcessed: Video[] = pornhubRaw.map((vid: any) => {
      const viewsCount = parseInt(vid.views) || Math.floor(Math.random() * 80000) + 20000;
      return {
        id: `ph_${vid.video_id}`,
        title: vid.title,
        username: 'Pornhub',
        category: category,
        views: viewsCount,
        likes: Math.floor(viewsCount * 0.05),
        comments: Math.floor(viewsCount * 0.001),
        thumbnail: vid.default_thumb || vid.thumbs?.[0]?.src || '',
        duration: vid.duration || "00:00",
        sourceUrl: `${vid.url}`,
        gender: gender,
        tags: vid.tags ? vid.tags.map((t: any) => t.tag_name) : [category]
      };
    });

    aggregatedVideos = [...epornerProcessed, ...pornhubProcessed];
    aggregatedVideos.sort(() => Math.random() - 0.5);

    return res.json(aggregatedVideos);

  } catch (error) {
    console.error('Error in Dynamic Aggregation Pipeline:', error);
    return res.status(500).json({ error: 'Failed to aggregate target records' });
  }
};

