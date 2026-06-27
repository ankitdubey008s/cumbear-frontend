import { Video, Short } from '../types';

export function generateMockVideos(): Video[] {
  const categories = [
    'Amateur', 'POV', 'Mom', 'Stepsister', 'Russian', 'Tall', 'Curvy',
    'Slim', 'MILF', 'Chubby', 'Anal', 'Blowjob', 'Threesome', 'Gangbang',
    'Interracial', 'Latina', 'Ebony', 'Asian', 'Blonde', 'Brunette', 'Redhead',
    'Teen', 'Mature', 'Creampie', 'Public'
  ];
  
  const genders = ['Straight', 'Gay', 'Trans', 'Lesbian', 'Solo'];
  const titles = [
    'Hot Amateur Couple Having Fun in Bedroom',
    'Stunning POV Action with Beautiful Babe',
    'MILF Next Door Gets What She Wants',
    'Step Sister Caught Watching Porn',
    'Russian Beauty Takes It Deep',
    'Tall Goddess Rides Like a Pro',
    'Curvy Latina Shows Off Her Assets',
    'Slim Teen Gets Her First Experience',
    'Experienced MILF Teaches Young Stud',
    'Chubby Girl Knows How to Please',
    'Intense Anal Session with Oil',
    'Best Blowjob You Will Ever See',
    'Wild Threesome with Two Hot Girls',
    'Gangbang Party Gets Out of Control',
    'Interracial Couple Passionate Love Making',
    'Latina Firecracker Goes Wild',
    'Ebony Goddess Worshipped Properly',
    'Asian Cutie Moans Loudly',
    'Blonde Bombshell Gets Pounded',
    'Brunette Beauty Takes It All',
    'Redhead Firecracker Wild Ride',
    'Innocent Teen Discovers Pleasure',
    'Mature Woman Seduces Young Man',
    'Creampie Finish After Intense Session',
    'Public Flashing and Risky Fun',
    'Secret Affair in Hotel Room',
    'Neighbor Comes Over for Sugar',
    'College Party Turns Into Orgy',
    'Boss Fucks Secretary on Desk',
    'Massage Turns Into Happy Ending',
  ];

  const videos: Video[] = [];
  let id = 1;

  for (const category of categories) {
    for (let page = 1; page <= 10; page++) {
      for (let i = 0; i < 30; i++) {
        const titleIndex = (id + i) % titles.length;
        const gender = genders[Math.floor(Math.random() * genders.length)];
        const views = Math.floor(Math.random() * 5000000) + 1000;
        const likes = Math.floor(views * (0.05 + Math.random() * 0.15));
        const comments = Math.floor(views * (0.001 + Math.random() * 0.01));
        const duration = `${Math.floor(Math.random() * 40) + 5}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
        
        videos.push({
          id: `vid_${id}`,
          title: `${titles[titleIndex]} - ${category} ${page}`,
          username: `user_${Math.floor(Math.random() * 10000)}`,
          category,
          views,
          likes,
          comments,
          thumbnail: `https://picsum.photos/400/225?random=${id}`,
          duration,
          sourceUrl: `https://example.com/video/${id}`,
          gender,
          tags: [category, gender, 'hot', 'new'],
        });
        id++;
      }
    }
  }
  return videos;
}

export function generateMockShorts(): Short[] {
  const genders = ['Straight', 'Gay', 'Trans', 'Lesbian', 'Solo'];
  const shorts: Short[] = [];
  
  for (let i = 1; i <= 200; i++) {
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const views = Math.floor(Math.random() * 2000000) + 500;
    const duration = `${Math.floor(Math.random() * 2) + 0}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
    
    shorts.push({
      id: `short_${i}`,
      title: `Short Clip ${i} - Quick Fun`,
      thumbnail: `https://picsum.photos/225/400?random=${i + 10000}`,
      views,
      duration,
      sourceUrl: `https://example.com/short/${i}`,
      gender,
    });
  }
  return shorts;
}

export const ALL_VIDEOS = generateMockVideos();
export const ALL_SHORTS = generateMockShorts();

export function getVideosByFilter(gender: string, category: string, page: number = 1): Video[] {
  let filtered = ALL_VIDEOS;
  
  if (gender !== 'All') {
    filtered = filtered.filter(v => v.gender === gender);
  }
  
  if (category !== 'All') {
    filtered = filtered.filter(v => v.category === category);
  }
  
  const start = (page - 1) * 30;
  return filtered.slice(start, start + 30);
}

export function getTotalPages(gender: string, category: string): number {
  let filtered = ALL_VIDEOS;
  if (gender !== 'All') filtered = filtered.filter(v => v.gender === gender);
  if (category !== 'All') filtered = filtered.filter(v => v.category === category);
  return Math.ceil(filtered.length / 30);
}

export function getShortsByGender(gender: string, count: number = 10): Short[] {
  let filtered = ALL_SHORTS;
  if (gender !== 'All') filtered = filtered.filter(s => s.gender === gender);
  return filtered.slice(0, count);
}

export function searchVideos(query: string, gender: string): Video[] {
  let filtered = ALL_VIDEOS;
  if (gender !== 'All') filtered = filtered.filter(v => v.gender === gender);
  
  const lowerQuery = query.toLowerCase();
  return filtered.filter(v => 
    v.title.toLowerCase().includes(lowerQuery) ||
    v.category.toLowerCase().includes(lowerQuery) ||
    v.tags.some(t => t.toLowerCase().includes(lowerQuery))
  ).slice(0, 30);
}

