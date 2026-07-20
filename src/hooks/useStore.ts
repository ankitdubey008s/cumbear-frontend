import { create } from 'zustand'
import type { Gender, VideoFilter, GridType, Theme } from '../types'

interface AppState {
  ageVerified: boolean
  setAgeVerified: (v: boolean) => void
  language: string
  setLanguage: (l: string) => void
  gender: Gender
  setGender: (g: Gender) => void
  gridType: GridType
  setGridType: (g: GridType) => void
  theme: Theme
  setTheme: (t: Theme) => void
  filter: VideoFilter
  setFilter: (f: VideoFilter) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  headerVisible: boolean
  setHeaderVisible: (v: boolean) => void
  footerVisible: boolean
  setFooterVisible: (v: boolean) => void
  likedShorts: Set<string>
  addLikedShort: (id: string) => void
}

export const useStore = create<AppState>((set) => ({
  ageVerified: localStorage.getItem('ageVerified') === 'true',
  setAgeVerified: (v) => {
    localStorage.setItem('ageVerified', String(v))
    set({ ageVerified: v })
  },
  language: localStorage.getItem('lang') || 'en',
  setLanguage: (l) => {
    localStorage.setItem('lang', l)
    set({ language: l })
  },
  gender: (localStorage.getItem('gender') as Gender) || 'all',
  setGender: (g) => {
    localStorage.setItem('gender', g)
    set({ gender: g })
  },
  gridType: (localStorage.getItem('gridType') as GridType) || '1',
  setGridType: (g) => {
    localStorage.setItem('gridType', g)
    set({ gridType: g })
  },
  theme: (localStorage.getItem('theme') as Theme) || 'dark',
  setTheme: (t) => {
    localStorage.setItem('theme', t)
    document.documentElement.setAttribute('data-theme', t)
    set({ theme: t })
  },
  filter: (localStorage.getItem('filter') as VideoFilter) || 'popularity',
  setFilter: (f) => {
    localStorage.setItem('filter', f)
    set({ filter: f })
  },
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  headerVisible: true,
  setHeaderVisible: (v) => set({ headerVisible: v }),
  footerVisible: true,
  setFooterVisible: (v) => set({ footerVisible: v }),
  likedShorts: new Set(JSON.parse(localStorage.getItem('likedShorts') || '[]')),
  addLikedShort: (id) => set((state) => {
    const newSet = new Set(state.likedShorts)
    newSet.add(id)
    localStorage.setItem('likedShorts', JSON.stringify([...newSet]))
    return { likedShorts: newSet }
  }),
}))

