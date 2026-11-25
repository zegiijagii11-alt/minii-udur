/* ===================== Ээлжийн хуваарь (зөвхөн харах) ===================== */
// Apps Script хуваарийн файлыг хэрэглэгчийн эрхээр уншаад JSON өгнө. Сүүлд татсан нь энэ төхөөрөмж дээр үлдэж, интернетгүй үед харагдана.
const ROS_KEY=KEY+'.roster';
const rosterOn=()=>!!(D.settings.rosterUrl&&D.settings.rosterKey);
const rosterUrlOk=u=>/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(u);
const rosterClear=()=>{try{localStorage.removeItem(ROS_KEY);localStorage.removeItem(KEY+'.rt')}catch(e){}};
let rosBusy=false,rosErr='',rosLast=0;
function openRoster(){UI.rosQ='';UI.rosTab=null;UI.rosPos=null;setView('roster');rosterFetch(false)}
const sheetErr=e=>e.name==='AbortError'?'Хариу ирсэнгүй':e instanceof SyntaxError?'Apps Script-ийн холбоос эсвэл «Anyone» эрх буруу байна':e instanceof TypeError?'Интернет холболт эсвэл холбоосоо шалгана уу':e.message;
// f: roster | rt. since = сүүлд татсан үеийн өөрчлөгдсөн огноо (өөрчлөгдөөгүй бол {same:true})
async function sheetGet(f,since){
  const c=new AbortController();const to=setTimeout(()=>c.abort(),120000);let j;
  try{const r=await fetch(D.settings.rosterUrl+'?key='+encodeURIComponent(D.settings.rosterKey)+'&f='+f+(since?'&since='+encodeURIComponent(since):'')+'&t='+Date.now(),{signal:c.signal,credentials:'omit',cache:'no-store'});
    j=JSON.parse(await r.text())}finally{clearTimeout(to)}
  if(j.error)throw new Error(j.error);
  return j;
}
async function rosterFetch(force){
  if(!rosterOn()||rosBusy||(!force&&Date.now()-rosLast<5*60000))return;
  rosBusy=true;rosErr='';const old=lsGet(ROS_KEY);const url=D.settings.rosterUrl,key=D.settings.rosterKey;
  if(VIEW==='roster')render();
  try{
    const j=await sheetGet('roster',!force&&old&&old.url===url?old.modified:'');
    if(url===D.settings.rosterUrl&&key===D.settings.rosterKey){
      if(j.same)lsSet(ROS_KEY,Object.assign({},old,{at:Date.now()}));
      else{if(!Array.isArray(j.sheets))throw new Error('Хариу буруу байна');lsSet(ROS_KEY,{url,modified:j.modified,at:Date.now(),sheets:j.sheets.map(rosterTrim)})}
      rosLast=Date.now()}
  }catch(e){rosErr=sheetErr(e)}
  rosBusy=false;if(VIEW==='roster')render();
}
// Хоосон сүүлийн мөр, баганыг хасна
function rosterTrim(s){
  const V=s.values||[];let R=0,C=0;V.forEach((row,r)=>row.forEach((v,c)=>{if(String(v).trim()){R=Math.max(R,r+1);C=Math.max(C,c+1)}}));
  // Сүүлийн өдрөөс баруун тийшх (хүснэгтэд нуусан) нэгтгэлийн багануудыг авахгүй
  const L=rosterLayout(V);if(L.hr>=0)C=Math.min(C,Math.max(...Object.keys(L.days).map(Number))+1);
  return {name:String(s.name),values:V.slice(0,R).map(x=>x.slice(0,C)),bg:(s.bg||[]).slice(0,R).map(x=>x.slice(0,C)),merges:(s.merges||[]).filter(m=>m[0]<R&&m[1]<C)}}
const rosterYm=n=>{const m=String(n).match(/(20\d\d)\D*(\d{1,2})/);return m?m[1]+'-'+String(+m[2]).padStart(2,'0'):''};
// Өдрийн тоотой мөр, нэрийн баганыг олно
function rosterLayout(V){
  let hr=-1,days={};
  for(let r=0;r<Math.min(V.length,20)&&hr<0;r++){const o={};(V[r]||[]).forEach((v,c)=>{v=String(v).trim();if(/^\d{1,2}$/.test(v)&&+v>=1&&+v<=31)o[c]=+v});
    const l=Object.values(o);if(l.length>=27&&l.includes(1)){hr=r;days=o}}
  if(hr<0)return {hr,days,nc:-1};
  const first=Math.min(...Object.keys(days).map(Number));let nc=-1,best=0;
  for(let c=0;c<first;c++){let n=0;for(let r=hr+1;r<V.length;r++)if(/^[А-ЯӨҮЁ]{1,2}\.\s?[А-ЯӨҮЁ]/.test(String((V[r]||[])[c]||'').trim()))n++;if(n>best){best=n;nc=c}}
  return {hr,days,nc:nc<0?first-1:nc};
}
const rosterInk=h=>{const n=i=>parseInt(h.slice(i,i+2),16);return (n(1)*299+n(3)*587+n(5)*114)/1000>140?'#000':'#fff'};
function rosterTable(s,todayD){
  const V=s.values.map(r=>r.slice()),L=rosterLayout(V);const span={},skip=new Set();
  // Толгойн нийлсэн нүд («Гариг») нэрийн баганыг дайрвал салгаж, бичгийг нь толгойн мөрөнд тавина — нэрийн багана тогтож чадна
  const merges=s.merges.filter(([r,c,h,w])=>{if(L.hr<0||r>L.hr||r+h<=L.hr||c>L.nc||c+w<=L.nc)return true;const t=V[r][c];V[r][c]='';V[L.hr][L.nc]=t;return false});
  const C=V.reduce((a,r)=>Math.max(a,r.length),0);
  merges.forEach(([r,c,h,w])=>{h=Math.min(h,V.length-r);w=Math.min(w,C-c);span[r+','+c]=[h,w];for(let i=r;i<r+h;i++)for(let k=c;k<c+w;k++)if(i!==r||k!==c)skip.add(i+','+k)});
  const cell=(row,r,c)=>{
    const k=r+','+c;if(skip.has(k))return '';
    const sp=span[k]||[1,1],b=(s.bg[r]||[])[c]||'';const col=/^#[0-9a-f]{6}$/i.test(b)?b:'';
    const cls=[c===L.nc&&sp[1]===1?'nm':'',todayD&&r>=L.hr-1&&L.days[c]===todayD&&sp[1]===1?'td':'',r===L.hr-1&&L.days[c]&&String(row[c]||'').length>2?'vt':''].filter(Boolean).join(' ');
    return `<td${cls?` class="${cls}"`:''}${sp[0]>1?` rowspan="${sp[0]}"`:''}${sp[1]>1?` colspan="${sp[1]}"`:''}${col?` style="--c:${col};background:${col};color:${rosterInk(col)}"`:''}>${esc(row[c]===undefined?'':row[c])}</td>`};
  return `<table class="ros">${V.map((row,r)=>`<tr${r===L.hr?' class="hd"':''}>${Array.from({length:C},(_,c)=>cell(row,r,c)).join('')}</tr>`).join('')}</table>`;
}
// «Зөвхөн би / Бүгд» — нэр, сонголт хоёулаа хадгалагдана
const rosterMine=()=>!!D.settings.rosterName&&D.settings.rosterMode!=='all';
function rosterNames(){const n=new Set();rosterSheets().forEach(s=>{const L=rosterLayout(s.values);if(L.hr<0)return;s.values.slice(L.hr+1).forEach(r=>{const v=String(r[L.nc]||'').trim();if(v)n.add(v)})});return [...n].sort((a,b)=>a.localeCompare(b,'mn'))}
function rosterMode(m){if(m==='me'&&!D.settings.rosterName)return rosterNameForm();D.settings.rosterMode=m;UI.rosQ='';UI.rosPos=null;save();render()}
function rosterNameForm(){const N=rosterNames();if(!N.length){toast('Эхлээд хуваариа татна уу');return}
  openForm({title:'Хуваарь дээрх миний нэр',fields:[{k:'n',l:'Нэр',type:'select',value:D.settings.rosterName||'',options:[['','— сонгох —'],...N.map(x=>[x,x])]}],
    onSave:o=>{D.settings.rosterName=o.n;D.settings.rosterMode=o.n?'me':'all';UI.rosQ='';UI.rosPos=null}})}
// Нэрээр хайх: толгой + нэр нь таарсан мөрүүд. Босоо нийлсэн нүдний (MRI, СТ…) утгыг мөр бүрт тавина.
const rosterNorm=t=>String(t||'').toLowerCase().replace(/[\s.]/g,'');
function rosterFilter(s,q,exact){
  q=rosterNorm(q);const V=s.values,L=rosterLayout(V);if(!q||L.hr<0)return s;
  const keep=[];V.forEach((row,r)=>{if(r<=L.hr||(rosterNorm(row[L.nc])&&(exact?rosterNorm(row[L.nc])===q:rosterNorm(row[L.nc]).includes(q))))keep.push(r)});
  const to={};keep.forEach((r,i)=>to[r]=i);
  const values=keep.map(r=>V[r].slice()),bg=keep.map(r=>(s.bg[r]||[]).slice()),merges=[];
  s.merges.forEach(([r,c,h,w])=>{
    if(r<=L.hr){merges.push([r,c,Math.min(h,L.hr-r+1),w]);return}
    for(let i=r;i<r+h;i++){if(to[i]===undefined)continue;
      if(i!==r){values[to[i]][c]=V[r][c];bg[to[i]][c]=(s.bg[r]||[])[c]||''}
      if(w>1)merges.push([to[i],c,1,w])}});
  return {name:s.name,values,bg,merges,none:keep.length===L.hr+1};
}
function rosterBody(s){
  const me=rosterMine(),f=rosterFilter(s,me?D.settings.rosterName:UI.rosQ,me);if(f.none)return `<div class="empty" style="padding:14px">${me?'Энэ сарын хуваарьт «'+esc(D.settings.rosterName)+'» алга.':'Ийм нэр олдсонгүй.'}</div>`;
  return rosterTable(f,rosterYm(s.name)===ym(today())?parseD(today()).getDate():0)}
function rosterCur(){const S=rosterSheets(),cur=ym(today());let i=S.findIndex(s=>s.name===UI.rosTab);if(i<0)i=S.findIndex(s=>rosterYm(s.name)===cur);return i<0?S.length-1:i}
function rosterSearch(v){UI.rosQ=v;const s=rosterSheets()[rosterCur()],w=$('#rosWrap');if(!s||!w)return;const x=w.scrollLeft,had=w.querySelector('.ros');w.innerHTML=rosterBody(s);w.scrollTop=0;
  if(had)w.scrollLeft=x;else{UI.rosPos=null;UI._rosF=null;rosterAfter()}}
function rosterSheets(){const c=lsGet(ROS_KEY);return c&&c.url===D.settings.rosterUrl&&Array.isArray(c.sheets)?c.sheets:[]}
function vRoster(){
  const open=`<button class="btn sm" onclick="window.open(shiftLink(),'_blank')">Хүснэгт нээх ↗</button>`;
  if(!rosterOn())return `<div class="card"><h2>Хуваариа холбох</h2><div class="fld"><label>Холбох хаяг (Apps Script)</label><input id="rosLink" autocomplete="off" placeholder="https://script.google.com/macros/s/…/exec?key=…"></div><div class="btns"><button class="btn sm primary" onclick="rosterConnect()">Холбох</button>${open}</div></div>`;
  const c=lsGet(ROS_KEY),S=rosterSheets();
  const i=rosterCur(),s=S[i],at=S.length&&c.at?new Date(c.at):null;
  const a=document.activeElement;UI._rosF=a&&a.id==='rosQ'?a.selectionStart:null; // бичиж байхад дахин зурвал курсорыг буцаана
  return `<div class="btns" style="margin-bottom:10px">${S.map((x,k)=>`<button class="btn sm${k===i?' primary':''}" onclick="rosterTab(${k})">${esc(rosterYm(x.name).replace('-','/')||x.name)}</button>`).join('')}</div>
    ${rosErr?`<div class="card" style="color:var(--bad)">⚠️ ${esc(rosErr)}</div>`:''}
    ${s?`<div class="seg"><button class="${rosterMine()?'on':''}" onclick="rosterMode('me')">Зөвхөн би</button><button class="${rosterMine()?'':'on'}" onclick="rosterMode('all')">Бүгд</button>${D.settings.rosterName?`<button onclick="rosterNameForm()" aria-label="Нэрээ солих">✎ ${esc(D.settings.rosterName)}</button>`:''}</div>${rosterMine()?'':`<div class="fld" style="margin-bottom:10px"><input type="search" id="rosQ" value="${esc(UI.rosQ||'')}" placeholder="Нэрээр хайх" aria-label="Нэрээр хайх" autocomplete="off" oninput="rosterSearch(this.value)"></div>`}<div class="roswrap" id="rosWrap">${rosterBody(s)}</div>`:rosBusy?'<div class="card"><div class="empty">Татаж байна…</div></div>':rosErr?'':'<div class="card"><div class="empty">Сарын хуудас олдсонгүй.</div></div>'}
    <div class="small" style="margin:8px 2px">${rosBusy?'Шинэчилж байна…':at?'Сүүлд шалгасан: '+dayLabel(ymd(at))+' '+pad(at.getHours())+':'+pad(at.getMinutes()):''}</div>
    <div class="btns"><button class="btn sm" onclick="rosterFetch(true)" ${rosBusy?'disabled':''}>Шинэчлэх</button>${open}</div>`;
}
// Нэг мөр: <Apps Script URL>?key=<түлхүүр>
function rosterConnect(){const m=$('#rosLink').value.trim().match(/^(https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec)\?key=([\w-]+)$/);
  if(!m){toast('Хаяг буруу байна');return}
  D.settings.rosterUrl=m[1];D.settings.rosterKey=m[2];delete D.settings.rosterOff;rosterClear();rosLast=0;save();render();rosterFetch(true)}
function rosterTab(k){const s=rosterSheets()[k];if(!s)return;UI.rosTab=s.name;UI.rosPos=null;render()}
// Дахин зурахад гүйлгэсэн байрыг хадгална; эхэнд өнөөдрийн багана руу гүйлгэнэ
function rosterAfter(){
  const w=$('#rosWrap');if(!w)return;
  if(UI._rosF!=null){const q=$('#rosQ');if(q)q.focus();if(q)q.setSelectionRange(UI._rosF,UI._rosF)}
  if(UI.rosPos){w.scrollLeft=UI.rosPos[0];w.scrollTop=UI.rosPos[1]}
  else{const t=w.querySelector('td.td'),n=w.querySelector('tr.hd td.nm');if(t)w.scrollLeft=Math.max(0,t.offsetLeft-(n?n.offsetWidth:0)-40)}
  w.onscroll=()=>{if(w.isConnected)UI.rosPos=[w.scrollLeft,w.scrollTop]};
}
