// xHamster-Style Native In-Feed Ad
window.renderAd = function(type) {
  if (type === 'infeed') {
    const titles = ['Featured Video','Premium Content','Exclusive HD','Trending Now','Hot Release'];
    const title = titles[Math.floor(Math.random() * titles.length)];
    return `
      <div class="ad-native-card">
        <div class="ad-native-thumb">
          <span class="ad-native-label">Sponsored</span>
          <div class="ad-native-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
        </div>
        <div class="ad-native-info">
          <div class="ad-native-title">${title}</div>
          <div class="ad-native-meta">Ad • Premium</div>
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

// Show Instant Message Ad after 10 seconds
setTimeout(() => {
  const msg = document.getElementById('instantMsgAd');
  if (msg && localStorage.getItem('age') === '1') {
    msg.style.display = 'block';
    // Auto-hide after 15 seconds
    setTimeout(() => { msg.style.display = 'none'; }, 15000);
  }
}, 10000);

console.log('✅ Premium ads loaded');
