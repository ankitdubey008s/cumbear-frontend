document.addEventListener('DOMContentLoaded',()=>{
if(localStorage.getItem('age')==='1'){document.getElementById('ageGate').classList.add('hidden');document.getElementById('mainApp').classList.remove('hidden');initRouter();checkURL();}
});
function verifyAge(){localStorage.setItem('age','1');var o=document.getElementById('ageGate');o.style.opacity='0';o.style.transition='opacity 0.4s';setTimeout(()=>{o.classList.add('hidden');document.getElementById('mainApp').classList.remove('hidden');initRouter();checkURL();},400);}
function checkURL(){var p=new URLSearchParams(location.search);if(p.has('v')){var vid={_id:p.get('v'),title:decodeURIComponent(p.get('t')||''),thumbnailUrl:decodeURIComponent(p.get('thumb')||''),duration:p.get('dur')||'',playableUrl:decodeURIComponent(p.get('src')||''),category:p.get('cat')||''};var t=setInterval(()=>{if(window.loadPlayerVideo){clearInterval(t);switchView('playerView',false);window.loadPlayerVideo(vid);}},50);}else if(p.has('category')){if(window.performSearch)window.performSearch(p.get('category'),true);}}
function initRouter(){if(!history.state)history.replaceState({view:'homeView'},'','/');window.addEventListener('popstate',e=>{switchView(e.state?.view||'homeView',false);});}
window.switchView=function(id,push){
var cur=document.querySelector('.view-section.active');var cid=cur?cur.id:'';
if(cid==='playerView'&&id!=='playerView'&&window.stopPlayer)window.stopPlayer();
if(cid==='shortsView'&&id!=='shortsView')document.querySelectorAll('.short-video').forEach(v=>v.pause());
document.querySelectorAll('.view-section').forEach(s=>{s.classList.add('hidden');s.classList.remove('active');});
var t=document.getElementById(id);if(t){t.classList.remove('hidden');t.classList.add('active');}
document.querySelectorAll('.nav-link[data-target]').forEach(l=>l.classList.remove('active'));
var al=document.querySelector('.nav-link[data-target="'+id+'"]');if(al)al.classList.add('active');
if(id==='categoriesView'&&window.showCategoriesView)window.showCategoriesView();
if(push)history.pushState({view:id},'','/');
window.scrollTo(0,0);
};
