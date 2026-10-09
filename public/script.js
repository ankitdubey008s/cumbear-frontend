document.addEventListener('DOMContentLoaded',()=>{
if(localStorage.getItem('age')==='1'){
  document.getElementById('ageGate').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  initRouter();
  checkURL();
}
});

function verifyAge(){
  localStorage.setItem('age','1');
  var o=document.getElementById('ageGate');
  o.style.opacity='0';
  o.style.transition='opacity 0.4s';
  setTimeout(()=>{
    o.classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initRouter();
    checkURL();
  },400);
}

async function checkURL(){
  var p=new URLSearchParams(location.search);
  if(p.has('v')){
    var vidId=p.get('v');
    try{
      var r=await fetch('https://cumbear-backend.vercel.app/api/videos/'+vidId);
      var d=await r.json();
      if(d.success && d.data){
        var vid=d.data;
        var t=setInterval(()=>{
          if(window.loadPlayerVideo){
            clearInterval(t);
            switchView('playerView',false);
            window.loadPlayerVideo(vid);
          }
        },50);
      }
    }catch(e){console.log('Video not found:',e);}
  }else if(p.has('category')){
    if(window.performSearch) window.performSearch(p.get('category'),true);
  }
}

function initRouter(){
  if(!history.state) history.replaceState({view:'homeView'},'','/');
  window.addEventListener('popstate',e=>{switchView(e.state?.view||'homeView',false);});
}

window.switchView=function(id,push){
  var cur=document.querySelector('.view-section.active');
  var cid=cur?cur.id:'';
  if(cid==='playerView' && id!=='playerView' && window.stopPlayer) window.stopPlayer();
  if(cid==='shortsView' && id!=='shortsView') document.querySelectorAll('.short-video').forEach(v=>v.pause());
  
  document.querySelectorAll('.view-section').forEach(s=>{s.classList.add('hidden');s.classList.remove('active');});
  var t=document.getElementById(id);
  if(t){t.classList.remove('hidden');t.classList.add('active');}
  
  document.querySelectorAll('.nav-link[data-target]').forEach(l=>l.classList.remove('active'));
  var al=document.querySelector('.nav-link[data-target="'+id+'"]');
  if(al) al.classList.add('active');
  
  if(id==='categoriesView' && window.showCategoriesView) window.showCategoriesView();
  if(push) history.pushState({view:id},'','/');
  window.scrollTo(0,0);
};

document.addEventListener('click',e=>{
  if(e.target.classList.contains('view-tab')){
    var view=e.target.dataset.view;
    document.querySelectorAll('.view-tab').forEach(t=>t.classList.remove('active'));
    e.target.classList.add('active');
    switchView(view,true);
    if(view==='shortsView' && window.loadShorts) window.loadShorts();
  }
});

// === PWA INSTALL LOGIC ===
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('appInstallBtn');
  if (!installBtn) return;

  installBtn.addEventListener('click', async () => {
    // Try native install prompt first (Chrome, Edge, Samsung Internet)
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        installBtn.querySelector('.app-install-subtitle').textContent = 'Installed!';
        installBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
      }
      deferredPrompt = null;
      return;
    }

    // iOS Safari - show manual instructions
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);

    if (isIOS && isSafari) {
      showInstallInstructions('ios');
    } else if (/chrome|crios|samsung/.test(ua)) {
      showInstallInstructions('android');
    } else {
      showInstallInstructions('generic');
    }
  });

  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});

function showInstallInstructions(platform) {
  const existing = document.getElementById('installModal');
  if (existing) existing.remove();

  let instructions = '';
  if (platform === 'ios') {
    instructions = `
      <h3 style="margin-bottom:1rem;color:var(--text-primary)">Install on iPhone/iPad</h3>
      <ol style="padding-left:1.25rem;color:var(--text-secondary);line-height:1.8">
        <li>Tap the <strong>Share</strong> button (square with arrow) at the bottom of Safari</li>
        <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
        <li>Tap <strong>"Add"</strong> in the top right</li>
        <li>CumBear app will appear on your home screen!</li>
      </ol>
    `;
  } else if (platform === 'android') {
    instructions = `
      <h3 style="margin-bottom:1rem;color:var(--text-primary)">Install on Android</h3>
      <ol style="padding-left:1.25rem;color:var(--text-secondary);line-height:1.8">
        <li>Tap the <strong>⋮ menu</strong> (three dots) in Chrome</li>
        <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
        <li>Confirm by tapping <strong>"Install"</strong></li>
        <li>CumBear will launch as a standalone app!</li>
      </ol>
    `;
  } else {
    instructions = `
      <h3 style="margin-bottom:1rem;color:var(--text-primary)">Install CumBear App</h3>
      <p style="color:var(--text-secondary);margin-bottom:1rem">To install CumBear as an app:</p>
      <ul style="padding-left:1.25rem;color:var(--text-secondary);line-height:1.8">
        <li><strong>Chrome:</strong> Click the install icon in the address bar</li>
        <li><strong>Safari (iOS):</strong> Share → Add to Home Screen</li>
        <li><strong>Edge:</strong> Click the install icon in the address bar</li>
      </ul>
    `;
  }

  const modal = document.createElement('div');
  modal.id = 'installModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn 0.3s';
  modal.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:2rem;max-width:400px;width:100%;position:relative">
      <button onclick="document.getElementById('installModal').remove()" style="position:absolute;top:12px;right:12px;background:var(--bg-elevated);border:1px solid var(--border-color);color:var(--text-primary);width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1.1rem">✕</button>
      <div style="text-align:center;margin-bottom:1.5rem">
        <img src="/cumb.png" style="width:64px;height:64px;border-radius:12px;border:2px solid var(--accent-burgundy);margin-bottom:1rem">
      </div>
      ${instructions}
      <button onclick="document.getElementById('installModal').remove()" style="width:100%;padding:0.85rem;background:linear-gradient(135deg,var(--accent-burgundy),var(--accent-dark));color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;margin-top:1rem;font-family:inherit">Got it</button>
    </div>
  `;
  document.body.appendChild(modal);
}
