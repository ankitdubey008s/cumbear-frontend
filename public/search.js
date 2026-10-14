document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchForm = document.getElementById('searchForm');
  const categoriesGrid = document.getElementById('categoriesGrid');
  const searchResultsHeader = document.getElementById('searchResultsHeader');
  const currentSearchTerm = document.getElementById('currentSearchTerm');
  const backToCategoriesBtn = document.getElementById('backToCategoriesBtn');
  const categoriesHub = document.getElementById('categoriesHub');
  const videoGrid = document.getElementById('videoGrid');

  if (searchForm) searchForm.addEventListener('submit', (e) => { e.preventDefault(); if (searchInput.value.trim()) performSearch(searchInput.value.trim()); });
  if (backToCategoriesBtn) backToCategoriesBtn.addEventListener('click', () => { searchInput.value = ''; showCategoriesView(); });

  window.showCategoriesView = function() {
    if (searchResultsHeader) searchResultsHeader.classList.add('hidden');
    if (categoriesHub) categoriesHub.classList.remove('hidden');
    if (videoGrid) videoGrid.innerHTML = '';
    if (window.switchView) window.switchView('categoriesView', false);
    setTimeout(() => { if (searchInput) { searchInput.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }, 300);
  };

  window.performSearch = async function(term, isCategory = false) {
    if (categoriesHub) categoriesHub.classList.add('hidden');
    if (searchResultsHeader) searchResultsHeader.classList.remove('hidden');
    if (currentSearchTerm) currentSearchTerm.textContent = isCategory ? `Category: ${term}` : `Results for: "${term}"`;
    if (window.switchView) window.switchView('homeView', true);
    if (videoGrid) videoGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">Loading...</div>';
    try {
      const queryParam = isCategory ? `category=${encodeURIComponent(term)}` : `search=${encodeURIComponent(term)}`;
      const res = await fetch(`https://cumbear-backend.vercel.app/api/videos?${queryParam}&limit=50`);
      const data = await res.json();
      if (data.success && data.data && videoGrid) {
        if (data.data.length === 0) videoGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">No videos found.</div>';
        else renderSearchResults(data.data);
      }
    } catch (err) { if (videoGrid) videoGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem; color:red;">Error loading results.</div>'; }
  };

  async function loadCategories() {
    if (!categoriesGrid) return;
    try {
      const res = await fetch('https://cumbear-backend.vercel.app/api/categories');
      const data = await res.json();
      if (data.success && data.data) renderCategories(data.data.sort((a, b) => b.count - a.count).slice(0, 20));
    } catch (err) { console.error('Cat load error', err); }
  }

  function renderCategories(categories) {
    categoriesGrid.innerHTML = categories.map((cat, index) => `
      <div class="category-card" data-category="${cat._id}">
        <div class="category-thumb"><img src="/categories/${(index % 20) + 1}.jpg" alt="${cat._id}" loading="lazy" onerror="this.style.opacity='0'"></div>
        <div class="category-info"><div class="category-name">${cat._id}</div><div class="category-count">${cat.count} videos</div></div>
      </div>
    `).join('');
    document.querySelectorAll('.category-card').forEach(card => card.addEventListener('click', () => performSearch(card.getAttribute('data-category'), true)));
  }

  function renderSearchResults(videos) {
    videoGrid.innerHTML = '';
    videos.forEach(video => {
      const card = document.createElement('div');
      card.className = 'video-card';
      const duration = video.duration ? video.duration.replace('HD ', '') : '00:00';
      card.innerHTML = `
        <div class="video-thumb" onclick="window.openPlayer('${video._id}')"><img src="${video.thumbnailUrl}" loading="lazy"><span class="duration-badge">${duration}</span></div>
        <div class="video-info" onclick="window.openPlayer('${video._id}')"><div class="video-title">${video.title}</div><div class="video-stats"><span>${video.category || 'Premium'}</span></div></div>
      `;
      videoGrid.appendChild(card);
    });
  }
  loadCategories();
});
