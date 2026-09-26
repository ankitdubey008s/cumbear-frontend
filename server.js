require('dotenv').config();
const express = require('express');
const app = express();

const API_BASE = 'https://cumbear-backend.vercel.app/api';

app.use(express.static('public'));
app.use(express.static('Public'));

app.get('/v/:id', async (req, res) => {
  const videoId = req.params.id;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Watch Free HD Video | CumBear</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body class="dark-theme">
  <header class="navbar">
    <a href="/" class="logo">Cum<span>Bear</span></a>
    <input type="text" id="searchInput" placeholder="Search 14,000+ videos...">
  </header>

  <div class="container">
    <main class="main-content">
      <div id="playerContainer" class="player-wrapper">
        <p class="loading">Loading Video Stream...</p>
      </div>

      <div class="ad-slot banner-300x250">
        <!-- ExoClick / JuicyAds 300x250 Banner Code -->
      </div>

      <h1 id="videoTitle" class="video-title"></h1>
      <div class="video-stats">
        <span id="videoCategory" class="badge"></span>
        <span id="videoViews"></span>
      </div>

      <h2 class="section-title">Recommended Videos</h2>
      <div id="relatedGrid" class="video-grid"></div>
    </main>
  </div>

  <script>
    const API_BASE = '${API_BASE}';
    const videoId = '${videoId}';

    async function loadVideo() {
      try {
        const res = await fetch(\`\${API_BASE}/videos/\${videoId}\`);
        const json = await res.json();
        if (!json.success) return;

        const video = json.data;
        document.title = video.title + ' | CumBear';
        document.getElementById('videoTitle').innerText = video.title;
        document.getElementById('videoCategory').innerText = video.category || 'General';
        document.getElementById('videoViews').innerText = (video.views || 1) + ' views';

        document.getElementById('playerContainer').innerHTML = \`
          <video controls autoplay poster="\${video.thumbnailUrl}" style="width:100%; max-height:500px;">
            <source src="\${video.playableUrl}" type="video/mp4">
            Your browser does not support HTML5 video.
          </video>
        \`;

        loadRelated(video.category);
      } catch (e) {
        console.error(e);
      }
    }

    async function loadRelated(cat) {
      try {
        const res = await fetch(\`\${API_BASE}/videos/related/\${cat || 'MILF'}?limit=12\`);
        const json = await res.json();
        const grid = document.getElementById('relatedGrid');
        
        grid.innerHTML = json.data.map(v => \`
          <div class="video-card" onclick="location.href='/v/\${v._id}'">
            <div class="thumb-box">
              <img src="\${v.thumbnailUrl}" alt="\${v.title}" loading="lazy">
              <span class="duration">\${v.duration || ''}</span>
            </div>
            <div class="card-title">\${v.title}</div>
          </div>
        \`).join('');
      } catch (e) {}
    }

    loadVideo();
  </script>
</body>
</html>`;

  res.send(html);
});

app.get('*', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CumBear - Free HD Adult Videos & Tube Streams</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body class="dark-theme">
  <header class="navbar">
    <a href="/" class="logo">Cum<span>Bear</span></a>
    <div class="search-bar">
      <input type="text" id="searchInput" placeholder="Search 14,000+ videos..." onkeyup="if(event.key==='Enter') triggerSearch()">
      <button onclick="triggerSearch()">Search</button>
    </div>
  </header>

  <div class="container">
    <nav id="categoryBar" class="category-bar"></nav>

    <div class="ad-slot leaderboard">
      <!-- ExoClick / JuicyAds Leaderboard Banner -->
    </div>

    <h2 class="section-title" id="feedTitle">Latest HD Videos</h2>
    <div id="videoGrid" class="video-grid"></div>

    <div class="pagination">
      <button id="prevBtn" onclick="changePage(-1)">Previous</button>
      <span id="pageIndicator">Page 1</span>
      <button id="nextBtn" onclick="changePage(1)">Next</button>
    </div>
  </div>

  <script>
    const API_BASE = '${API_BASE}';
    let currentPage = 1;
    let totalPages = 1;
    let currentCategory = '';
    let searchQuery = '';

    async function fetchVideos() {
      const grid = document.getElementById('videoGrid');
      grid.innerHTML = '<p class="loading">Loading videos from database...</p>';

      let url = \`\${API_BASE}/videos?page=\${currentPage}&limit=24\`;
      if (currentCategory) url += \`&category=\${encodeURIComponent(currentCategory)}\`;
      if (searchQuery) url += \`&search=\${encodeURIComponent(searchQuery)}\`;

      try {
        const res = await fetch(url);
        const json = await res.json();
        
        if (!json.success || !json.data || json.data.length === 0) {
          grid.innerHTML = '<p class="empty">No videos found.</p>';
          return;
        }

        totalPages = json.pagination.totalPages;

        grid.innerHTML = json.data.map(v => \`
          <div class="video-card" onclick="location.href='/v/\${v._id}'">
            <div class="thumb-box">
              <img src="\${v.thumbnailUrl}" alt="\${v.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/320x180?text=No+Thumbnail'">
              <span class="duration">\${v.duration || ''}</span>
            </div>
            <div class="card-title">\${v.title}</div>
            <div class="card-meta">
              <span class="category">\${v.category || 'HD'}</span>
            </div>
          </div>
        \`).join('');

        document.getElementById('pageIndicator').innerText = \`Page \${currentPage} of \${totalPages} (\${json.pagination.total.toLocaleString()} Videos)\`;
      } catch (e) {
        grid.innerHTML = '<p class="error">Failed to load content.</p>';
      }
    }

    async function fetchCategories() {
      try {
        const res = await fetch(\`\${API_BASE}/categories\`);
        const json = await res.json();
        const bar = document.getElementById('categoryBar');

        bar.innerHTML = \`<button class="cat-chip active" onclick="filterCategory('')">All</button>\` + 
          json.data.map(c => \`
            <button class="cat-chip" onclick="filterCategory('\${c._id}')">\${c._id || 'Uncategorized'} (\${c.count})</button>
          \`).join('');
      } catch (e) {}
    }

    function filterCategory(cat) {
      currentCategory = cat;
      searchQuery = '';
      currentPage = 1;
      document.getElementById('feedTitle').innerText = cat ? \`Category: \${cat}\` : 'Latest HD Videos';
      fetchVideos();
    }

    function triggerSearch() {
      searchQuery = document.getElementById('searchInput').value;
      currentCategory = '';
      currentPage = 1;
      document.getElementById('feedTitle').innerText = searchQuery ? \`Search Results for: "\${searchQuery}"\` : 'Latest HD Videos';
      fetchVideos();
    }

    function changePage(delta) {
      if (currentPage + delta < 1 || currentPage + delta > totalPages) return;
      currentPage += delta;
      fetchVideos();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    fetchCategories();
    fetchVideos();
  </script>
</body>
</html>`;

  res.send(html);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Frontend running on port ${PORT}`));
