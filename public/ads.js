// Premium Native In-Feed Ad (looks like a video card = higher viewability = higher CPM)
window.renderAd = function(type) {
  if (type === 'infeed') {
    const titles = [
      'Premium Content - Watch Now',
      'Exclusive HD Video',
      'Trending This Week',
      'Must-Watch Featured Video',
      'Hot New Release'
    ];
    const title = titles[Math.floor(Math.random() * titles.length)];
    return `
      <div class="ad-native-card" onclick="window.open('https://cumbear.in','_blank')">
        <div class="ad-native-thumb">
          <span class="ad-native-label">Sponsored</span>
          <div class="ad-native-play">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="ad-native-info">
          <div class="ad-native-title">${title}</div>
          <div class="ad-native-meta">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Ad</span>
          </div>
        </div>
        <div style="padding:0 0.75rem 0.75rem;">
          <script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"><\/script>
          <ins class="eas6a97888e2" data-zoneid="6045616"><\/ins>
          <script>(AdProvider=window.AdProvider||[]).push({"serve":{}});<\/script>
        </div>
      </div>
    `;
  }
  return '';
};
console.log('✅ Premium ads.js loaded');
