import type { ShortVideo, LongVideo, ApiResponse } from '../types'

const API_BASE = 'https://cumbear-mxpk.onrender.com/api/v1'

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    ...options,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: ApiResponse<T> = await res.json()
  if (!data.success) throw new Error(data.message || 'API Error')
  return data.data
}

export const api = {
  getShorts: (page = 1) => fetchApi<{ shorts: ShortVideo[]; hasMore: boolean }>(`/shorts?page=${page}`),
  getShort: (id: string) => fetchApi<ShortVideo>(`/shorts/${id}`),
  likeShort: (id: string) => fetchApi<null>(`/shorts/${id}/like`, { method: 'POST' }),
  commentShort: (id: string, text: string) => fetchApi<null>(`/shorts/${id}/comment`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  }),
  shareShort: (id: string, platform: string) => fetchApi<null>(`/shorts/${id}/share`, {
    method: 'POST',
    body: JSON.stringify({ platform }),
  }),
  repostShort: (id: string, caption: string) => fetchApi<null>(`/shorts/${id}/repost`, {
    method: 'POST',
    body: JSON.stringify({ caption }),
  }),
  getVideos: (page = 1, filter?: string, category?: string, gender?: string) => {
    const params = new URLSearchParams({ page: String(page) })
    if (filter) params.append('filter', filter)
    if (category) params.append('category', category)
    if (gender && gender !== 'all') params.append('gender', gender)
    return fetchApi<{ videos: LongVideo[]; hasMore: boolean }>(`/videos/feed?${params}`)
  },
  getVideo: (id: string) => fetchApi<LongVideo>(`/videos/${id}`),
  search: (q: string, page = 1) => fetchApi<{ videos: LongVideo[]; shorts: ShortVideo[]; hasMore: boolean }>(
    `/search?q=${encodeURIComponent(q)}&page=${page}`
  ),
  getSuggestions: (q: string) => fetchApi<string[]>(`/search/suggestions?q=${encodeURIComponent(q)}`),
  getTrending: () => fetchApi<LongVideo[]>('/videos/trending'),
  getStats: () => fetchApi<Record<string, unknown>>('/stats/databases'),
}

