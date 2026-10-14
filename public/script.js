document.addEventListener('DOMContentLoaded', function () {
  if (localStorage.getItem('age') === '1') {
    var g = document.getElementById('ageGate');
    var m = document.getElementById('mainApp');
    if (g) g.classList.add('hidden');
    if (m) m.classList.remove('hidden');
    initRouter();
    checkURL();
  }
});

function verifyAge() {
  localStorage.setItem('age', '1');
  var g = document.getElementById('ageGate');
  var m = document.getElementById('mainApp');
  if (g) g.classList.add('hidden');
  if (m) m.classList.remove('hidden');
  initRouter();
  checkURL();
}

async function checkURL() {
  var p = new URLSearchParams(location.search);
  if (p.has('v')) {
    var vidId = p.get('v');
    try {
      var r = await fetch('https://cumbear-backend.vercel.app/api/videos/' + vidId);
      var d = await r.json();
      if (d.success && d.data) {
        var t = setInterval(function () {
          if (window.loadPlayerVideoById) {
            clearInterval(t);
            window.switchView('playerView', false);
            window.loadPlayerVideoById(vidId);
          }
        }, 50);
      }
    } catch (e) { console.log('Video not found'); }
  }
}

function initRouter() {
  if (!history.state) history.replaceState({ view: 'homeView' }, '', '/');
  window.addEventListener('popstate', function (e) { window.switchView((e.state && e.state.view) || 'homeView', false); });
}

window.switchView = function (id, push) {
  if (id !== 'shortsView' && window.stopShorts) window.stopShorts();

  // Ads ONLY on content pages
  var adViews = ['homeView', 'shortsView', 'playerView', 'searchView'];
  if (adViews.indexOf(id) > -1) document.body.classList.remove('ads-hidden');
  else document.body.classList.add('ads-hidden');

  document.querySelectorAll('.view-section').forEach(function (s) { s.classList.add('hidden'); s.classList.remove('active'); });
  var t = document.getElementById(id);
  if (t) { t.classList.remove('hidden'); t.classList.add('active'); }

  document.querySelectorAll('.view-tab').forEach(function (l) { l.classList.remove('active'); });
  var al = document.querySelector('.view-tab[data-view="' + id + '"]');
  if (al) al.classList.add('active');

  if (push) history.pushState({ view: id }, '', '/');
  window.scrollTo(0, 0);
};

document.addEventListener('click', function (e) {
  var tab = e.target.closest('.view-tab');
  if (tab) window.switchView(tab.dataset.view, true);
});
