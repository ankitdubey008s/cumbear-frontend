document.addEventListener('DOMContentLoaded', () => {
  // 1. Instant Message Ad (Show 5s, hide, repeat every 60s)
  const instantAd = document.getElementById('instant-msg-ad');
  function showInstantAd() {
    if (instantAd && localStorage.getItem('age') === '1') {
      instantAd.style.display = 'block';
      setTimeout(() => { instantAd.style.display = 'none'; }, 5000);
    }
  }
  setTimeout(showInstantAd, 5000);
  setInterval(showInstantAd, 60000);

  // 2. Sticky Banner (Close & reappear after 30s of activity)
  const stickyContainer = document.getElementById('sticky-ad-container');
  const stickyCloseBtn = document.getElementById('sticky-close-btn');
  let stickyHidden = false;
  let stickyTimer;

  if (stickyCloseBtn && stickyContainer) {
    stickyCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stickyContainer.style.display = 'none';
      stickyHidden = true;
    });
  }

  document.addEventListener('click', () => {
    if (stickyHidden) {
      clearTimeout(stickyTimer);
      stickyTimer = setTimeout(() => {
        stickyContainer.style.display = 'flex';
        stickyHidden = false;
      }, 30000);
    }
  });
});
