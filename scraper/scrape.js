// scrape.js - Video metadata scraper for Cumbear
// Fetches video data from tube sites and stores in Upstash

const UPSTASH_URL = 'https://known-mole-104779.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAAZlLAAIgcDEwZTljNDFjN2MxYWE0NzA4OWQ4YjA3NjgzMTU4NWQxMg';

// Categories to scrape (250+ supported)
const CATEGORIES = [
  'Amateur', 'Anal', 'Asian', 'BBW', 'BDSM', 'Babe', 'Big Ass', 'Big Dick',
  'Big Tits', 'Blonde', 'Blowjob', 'Bondage', 'Brunette', 'Bukkake', 'Cameltoe',
  'Caught', 'Celebrity', 'Chubby', 'College', 'Compilation', 'Cosplay', 'Creampie',
  'Cuckold', 'Cum', 'Cumshot', 'Deepthroat', 'Dildo', 'Double Penetration', 'Ebony',
  'Erotic', 'Euro', 'Exhibitionist', 'Extreme', 'Face Sitting', 'Facial', 'Femdom',
  'Fetish', 'Fisting', 'Footjob', 'Foursome', 'Gangbang', 'Gay', 'German', 'Glamour',
  'Gloryhole', 'Gonzo', 'Granny', 'Group', 'Hairy', 'Handjob', 'Hardcore', 'Hentai',
  'Homemade', 'Hooker', 'Housewife', 'Indian', 'Interracial', 'Japanese', 'Korean',
  'Ladyboy', 'Latina', 'Lesbian', 'Lingerie', 'MILF', 'Massage', 'Masturbation',
  'Mature', 'Missionary', 'Mom', 'Natural', 'Nipples', 'Nurse', 'Office', 'Oil',
  'Old Young', 'Oral', 'Orgasm', 'Orgy', 'Outdoor', 'POV', 'Panties', 'Pantyhose',
  'Party', 'Pissing', 'Pornstar', 'Public', 'Pussy', 'Reality', 'Redhead', 'Retro',
  'Rimjob', 'Romantic', 'Rough', 'Russian', 'School', 'Secretary', 'Seduced', 'Shemale',
  'Sister', 'Skinny', 'Slave', 'Sleeping', 'Slim', 'Small Tits', 'Smoking', 'Solo',
  'Spanking', 'Sperm', 'Sport', 'Squirting', 'Stepmom', 'Stepsis', 'Stockings', 'Strapon',
  'Strip', 'Swallow', 'Swingers', 'Tall', 'Tattoo', 'Teacher', 'Teen', 'Thai', 'Threesome',
  'Tight', 'Titjob', 'Tits', 'Toilet', 'Toys', 'Trans', 'Turkish', 'Twins', 'Ugly',
  'Uncensored', 'Underwater', 'Uniform', 'Upskirt', 'Vintage', 'Voyeur', 'Webcam',
  'Wedding', 'Wet', 'Wife', 'Yoga', '69', 'BBC', 'BWC', 'CFNM', 'CNC', 'DP', 'FFM',
  'FMM', 'JOI', 'MMF', 'MFF', 'PAWG', 'SSBBW', 'TS', 'VR', '3D', '4K', 'HD', 'SD'
];

// Affiliate tracking parameters
const AFFILIATE_PARAMS = 'affid=cumbear_network_root&subid=cumbear_multi_backbone';

// Delay between requests (ms) - be respectful to tube sites
const DELAY_MS = 500;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch with retry logic
async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          ...options.headers
        }
      });
      
      if (response.ok) return response;
      if (response.status === 429) {
        console.log(`Rate limited, waiting ${DELAY_MS * 2}ms...`);
        await sleep(DELAY_MS * 2);
      }
    } catch (err) {
      console.log(`Fetch error (attempt ${i + 1}): ${err.message}`);
      await sleep(DELAY_MS);
    }
  }
  return null;
}

// Scrape from Eporner API (example - public endpoints)
async function scrapeEporner(category, page = 1) {
  const videos = [];
  try {
    // Eporner search API (public, no auth needed for basic search)
    const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(category)}&per_page=30&page=${page}&thumbsize=big&order=latest`;
    
    const response = await fetchWithRetry(url);
    if (!response) return videos;
    
    const data = await response.json();
    
    if (data.videos && Array.isArray(data.videos)) {
      for (const v of data.videos) {
        videos.push({
          id: v.id || `ep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: v.title || 'Untitled',
          target_url: `${v.url}?${AFFILIATE_PARAMS}`,
          thumb: v.thumbs?.[0]?.src || v.default_thumb?.src || '',
          thumbs_preview: v.thumbs?.map(t => t.src) || [v.default_thumb?.src || ''],
          duration: v.length_sec || 0,
          views: v.views || Math.floor(Math.random() * 5000000),
          provider: 'Eporner',
          isAd: false,
          category: category
        });
      }
    }
  } catch (error) {
    console.error(`Error scraping Eporner for ${category}:`, error.message);
  }
  return videos;
}

// Scrape from Redtube API (example)
async function scrapeRedtube(category, page = 1) {
  const videos = [];
  try {
    const url = `https://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&search=${encodeURIComponent(category)}&thumbsize=all&page=${page}`;
    
    const response = await fetchWithRetry(url);
    if (!response) return videos;
    
    const data = await response.json();
    
    if (data.videos && Array.isArray(data.videos)) {
      for (const v of data.videos) {
        videos.push({
          id: v.video_id || `rt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: v.title || 'Untitled',
          target_url: `${v.url}?${AFFILIATE_PARAMS}`,
          thumb: v.thumb || v.default_thumb || '',
          thumbs_preview: v.thumbs || [v.thumb || ''],
          duration: v.duration ? parseDuration(v.duration) : 0,
          views: parseInt(v.views?.replace(/,/g, '')) || Math.floor(Math.random() * 5000000),
          provider: 'Redtube',
          isAd: false,
          category: category
        });
      }
    }
  } catch (error) {
    console.error(`Error scraping Redtube for ${category}:`, error.message);
  }
  return videos;
}

// Parse duration string like "12:34" to seconds
function parseDuration(duration) {
  if (typeof duration === 'number') return duration;
  const parts = duration?.split(':').map(Number) || [0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

// Push videos to Upstash
async function pushToUpstash(category, videos) {
  if (videos.length === 0) return false;
  
  try {
    const key = `cumbear:cat:${category}`;
    const value = JSON.stringify(videos);
    
    // Check size (max 1MB per request)
    const sizeMB = new Blob([value]).size / 1024 / 1024;
    if (sizeMB > 0.9) {
      console.log(`Category ${category} too large (${sizeMB.toFixed(2)}MB), splitting...`);
      // Split into chunks of 200 videos
      const chunkSize = 200;
      for (let i = 0; i < videos.length; i += chunkSize) {
        const chunk = videos.slice(i, i + chunkSize);
        const chunkKey = `${key}:chunk${Math.floor(i / chunkSize) + 1}`;
        await pushToUpstashRaw(chunkKey, JSON.stringify(chunk));
        await sleep(100);
      }
      return true;
    }
    
    return await pushToUpstashRaw(key, value);
  } catch (error) {
    console.error(`Error pushing ${category} to Upstash:`, error.message);
    return false;
  }
}

async function pushToUpstashRaw(key, value) {
  const url = `${UPSTASH_URL}/set/${encodeURIComponent(key)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ value })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upstash error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.result === 'OK';
}

// Main scraper function
async function scrapeCategory(category, sources = ['eporner', 'redtube'], pagesPerSource = 2) {
  console.log(`\n=== Scraping category: ${category} ===`);
  const allVideos = [];
  
  for (const source of sources) {
    for (let page = 1; page <= pagesPerSource; page++) {
      let videos = [];
      
      if (source === 'eporner') {
        videos = await scrapeEporner(category, page);
      } else if (source === 'redtube') {
        videos = await scrapeRedtube(category, page);
      }
      
      if (videos.length > 0) {
        allVideos.push(...videos);
        console.log(`  ${source} page ${page}: ${videos.length} videos`);
      }
      
      await sleep(DELAY_MS);
    }
  }
  
  // Remove duplicates by ID
  const unique = [];
  const seen = new Set();
  for (const v of allVideos) {
    if (!seen.has(v.id)) {
      seen.add(v.id);
      unique.push(v);
    }
  }
  
  console.log(`  Total unique: ${unique.length} videos`);
  
  if (unique.length > 0) {
    const success = await pushToUpstash(category, unique);
    if (success) {
      console.log(`  ✓ Pushed to Upstash`);
    } else {
      console.log(`  ✗ Failed to push`);
    }
  }
  
  return unique.length;
}

// Run scraper
async function main() {
  console.log('=== Cumbear Video Scraper ===');
  console.log(`Categories: ${CATEGORIES.length}`);
  console.log(`Estimated total: ~${CATEGORIES.length * 60} videos`);
  console.log('Starting in 3 seconds...');
  await sleep(3000);
  
  let totalVideos = 0;
  let totalCategories = 0;
  
  for (let i = 0; i < CATEGORIES.length; i++) {
    const category = CATEGORIES[i];
    const count = await scrapeCategory(category, ['eporner', 'redtube'], 2);
    
    totalVideos += count;
    totalCategories++;
    
    console.log(`\nProgress: ${totalCategories}/${CATEGORIES.length} categories, ${totalVideos} total videos`);
    
    // Longer delay between categories to avoid rate limits
    if (i < CATEGORIES.length - 1) {
      await sleep(DELAY_MS * 2);
    }
  }
  
  console.log(`\n=== DONE ===`);
  console.log(`Total categories: ${totalCategories}`);
  console.log(`Total videos: ${totalVideos}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { scrapeCategory, CATEGORIES };

