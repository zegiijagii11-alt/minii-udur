/* ===================== Эхлүүлэх ===================== */
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{if(b.dataset.v==='life')UI.life='health';if(b.dataset.v==='plan')UI.planCat='all';setView(b.dataset.v)});
try{const v=localStorage.getItem(KEY+'.view');if(v&&['home','today','plan','notes','money','life'].includes(v))VIEW=v}catch(e){}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSheet();closeDrawer()}});
let _lastDay=today();
setInterval(()=>{checkReminders();if(today()!==_lastDay){_lastDay=today();if($('#sheet').classList.contains('hidden'))render()}},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkReminders();if($('#sheet').classList.contains('hidden'))render()}});
render();checkReminders();setTimeout(gcImages,3000);cloudInit();
if('serviceWorker' in navigator&&location.protocol.startsWith('http')&&!(window.NativeApp&&NativeApp.isNative))navigator.serviceWorker.register('sw.js').catch(()=>{});
