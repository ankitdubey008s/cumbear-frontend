const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors({ origin: '*' }));

// Randomized browser fingerprints to bypass bot detection
const AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
];

const getAgent = () => AGENTS[Math.floor(Math.random() * AGENTS.length)];

app.get('/api/videos', async (req, res) => {
  const { q = 'hot' } = req.query;
  const search = (!q || q.toLowerCase() === 'all') ? 'hot' : q;

  console.log(`[Cumbear] Searching for: ${search}`);

  // Using Eporner as the primary reliable engine, with a broader search filter
  const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(search)}&per_page=50&order=latest&thumbsize=big&format=json`;

  try {
    const response = await axios.get(url, {
      headers: { 
        'User-Agent': getAgent(),
        'Accept': 'application/json',
        'Referer': 'https://www.eporner.com/'
      },
      timeout: 5000
    });

    if (response.data && response.data.videos) {
      const formatted = response.data.videos.map(v => ({
        id: v.id,
        title: v.title,
        thumb: v.default_thumb.src,
        embed_url: `https://www.eporner.com/embed/${v.id}/`,
        raw_views: v.views,
        duration: v.length_sec
      }));
      
      console.log(`[Cumbear] Successfully found ${formatted.length} items.`);
      return res.json({ success: true, videos: formatted });
    } else {
      console.log(`[Cumbear] API returned empty structure. Possibly blocked.`);
      return res.json({ success: true, videos: [] });
    }
  } catch (err) {
    console.error(`[Cumbear] Fetch Error: ${err.message}`);
    return res.status(500).json({ error: "Fetch failed" });
  }
});

app.listen(PORT, () => console.log(`✅ Proxy Browser Engine Active on Port ${PORT}`));
