export interface Video {
  id: string;
  title: string;
  username: string;
  category: string;
  views: string | number;
  likes: string | number;
  comments: string | number;
  thumbnail: string;
  duration: string;
  sourceUrl: string;
  gender: string;
  tags: string[];
}

export interface Short {
  id: string;
  title: string;
  thumbnail: string;
  views: string | number;
  duration: string;
  sourceUrl: string;
  gender: string;
}

export interface ImageCategory {
  id: string;
  label: string;
  imageUrl: string;
  isAd: boolean;
}

export type Gender = 'All' | 'Straight' | 'Gay' | 'Trans' | 'Lesbian' | 'Solo';

export const CATEGORIES = [
  'All', 'Amateur', 'Anal', 'Asian', 'Caught', 'Cum', 'Hardcore', 
  'Japanese', 'Latina', 'Milf', 'POV', 'Stepmom', 'Stepsis', 'Teen', 'Threesome'
];

export const GENDERS: Gender[] = ['All', 'Straight', 'Gay', 'Trans', 'Lesbian', 'Solo'];

export const IMAGE_CATEGORIES: ImageCategory[] = [
  { id: '1', label: 'Russian', imageUrl: '', isAd: false },
  { id: '2', label: 'American', imageUrl: '', isAd: false },
  { id: '3', label: 'Sponsor', imageUrl: '', isAd: true },
  { id: '4', label: 'British', imageUrl: '', isAd: false },
  { id: '5', label: 'Asian', imageUrl: '', isAd: false },
  { id: '6', label: 'European', imageUrl: '', isAd: false },
  { id: '7', label: 'Japanese', imageUrl: '', isAd: false },
  { id: '8', label: 'Sponsor', imageUrl: '', isAd: true },
  { id: '9', label: 'Colombian', imageUrl: '', isAd: false },
  { id: '10', label: 'Thai', imageUrl: '', isAd: false },
];

