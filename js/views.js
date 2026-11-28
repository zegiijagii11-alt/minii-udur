/* ===================== Харагдац ===================== */
let VIEW='home';
const VIEW_TITLES={home:'Миний өдөр',today:'Өнөөдөр',plan:'Төлөвлөгөө',notes:'Тэмдэглэл',money:'Санхүү',life:'Эрүүл & Ахуй'};
const UI={planDay:null,planWeek:null,planCat:'all',noteQ:'',noteTag:'',month:null,life:'health'};
function setView(v){VIEW=v;UI.back=null;UI.sec=null;try{localStorage.setItem(KEY+'.view',v)}catch(e){}render();window.scrollTo(0,0)}
function render(){
  document.documentElement.style.setProperty('--fs',(D.settings.fs||16)+'px');
  const th=D.settings.theme;if(th==='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=th;
  applyAccent();
  if(VIEW==='grp'&&!groups()[UI.grp])VIEW='home';
  $('#title').textContent=UI.back?UI.subTitle:VIEW==='grp'?groups()[UI.grp].l:VIEW==='ot'?'Илүү цаг':VIEW==='report'?'Тайлан':VIEW==='roster'?'Ээлжийн хуваарь':VIEW==='rt'?'RT exam CT':VIEW==='life'?({health:'Эрүүл мэнд',habits:'Зуршил',home:'Ахуй'})[UI.life]:VIEW_TITLES[VIEW];
  const inGrp=VIEW==='grp'||!!UI.back;
  $('#navBtn').innerHTML=`<svg viewBox="0 0 24 24">${inGrp?TILE_ICONS.back:'<path d="M4 7h16M4 12h16M4 17h16"/>'}</svg>`;
  $('#navBtn').setAttribute('aria-label',inGrp?'Буцах':'Цэс');
  $('#navBtn').onclick=inGrp?(UI.back?goBack:()=>setView('home')):openMenu;
  const bn=bellItems().length;$('#bellN').textContent=bn>99?'99+':bn;$('#bellN').classList.toggle('hidden',!bn);
  const navOn=VIEW==='grp'||UI.back?'home':VIEW;
  $('.fab').classList.toggle('hidden',(VIEW==='money'&&!UI.sec)||VIEW==='roster'||VIEW==='rt'); // санхүүд өөрийн −/+ товч бий
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===navOn));
  $('#view').innerHTML=({home:vHome,grp:vGroup,ot:vOT,report:vReport,roster:vRoster,rt:vRt,today:vToday,plan:vPlan,notes:vNotes,money:vMoney,life:vLife})[VIEW]();
  hydrateImgs($('#view'));if(VIEW==='roster')rosterAfter();if(VIEW==='rt')rtAfter();
  if(VIEW==='notes'){const q=$('#noteQ');if(q&&UI._focusQ){q.focus();q.setSelectionRange(q.value.length,q.value.length)}}
}

/* ---------- Нүүрний цэс ---------- */
const TILE_ICONS={
  ajil:'<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18"/>',
  huviin:'<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c0-4 3.4-6 7.5-6s7.5 2 7.5 6"/>',
  ger:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9.5" r="2.3"/><path d="M3 20c0-3.4 2.7-5.5 6-5.5s6 2.1 6 5.5M15.5 14.6c3 0 5.5 1.6 5.5 4.9"/>',
  notes:'<path d="M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 20z"/><path d="M9 11h7M9 15h5"/>',
  money:'<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 15h2"/>',
  health:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8 11.5h2l1-2 2 4 1-2h2"/>',
  habits:'<path d="M12 20.5v-8"/><path d="M12 12.5c0-4 3-7 8-7 0 5-3 7-8 7zM12 14.5c0-3-2-5.5-7-5.5 0 4 2 5.5 7 5.5z"/>',
  home:'<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  today:'<rect class="f" x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4"/>',
  appt:'<path d="M6 3.5v5a4 4 0 0 0 8 0v-5"/><path d="M10 12.5v2.5a5 5 0 0 0 10 0v-2"/><circle class="f" cx="20" cy="11" r="2"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  settings:'<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  backup:'<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/>'};
// Ажил/хувийн/гэр бүл/эрүүл мэндийн хавтангийн дүрсийг бага зэрэг дүүргэлттэй болгоно
TILE_ICONS.ajil=TILE_ICONS.ajil.replace('<rect ','<rect class="f" ');TILE_ICONS.notes=TILE_ICONS.notes.replace('<path ','<path class="f" ');
TILE_ICONS.money=TILE_ICONS.money.replace('<rect ','<rect class="f" ');TILE_ICONS.health=TILE_ICONS.health.replace('<path ','<path class="f" ');
TILE_ICONS.huviin=TILE_ICONS.huviin.replace('<circle ','<circle class="f" ');TILE_ICONS.home=TILE_ICONS.home.replace('<path d="M5.5','<path class="f" d="M5.5');
Object.assign(TILE_ICONS,{
  pill:'<rect class="f" x="2.8" y="8.8" width="18.4" height="6.4" rx="3.2" transform="rotate(-40 12 12)"/><path d="M9.6 9.2l4.8 5.6"/>',
  chart:'<path d="M4 4v16h16"/><path d="M7.5 15l3.5-4 3 3 5-6.5"/>',
  drop:'<path class="f" d="M12 3.5s6 6.4 6 10.9a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z"/>',
  receipt:'<path class="f" d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 8.5h6M9 12.5h6"/>',
  target:'<circle cx="12" cy="12" r="8.5"/><circle class="f" cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".6"/>',
  minus:'<circle class="f" cx="12" cy="12" r="8.5"/><path d="M8 12h8"/>',
  plus:'<circle class="f" cx="12" cy="12" r="8.5"/><path d="M8 12h8M12 8v8"/>',
  cart:'<path d="M3 4.5h2.2l2.2 10.3h10.2L20 7.5H6.3"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  broom:'<path d="M15 3l-3.5 8.5"/><path class="f" d="M7.5 11.5h8l1.8 8.5H5.7z"/><path d="M9.5 15.5l-.5 4.5M13.5 15.5l.5 4.5"/>',
  link:'<path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
  back:'<path d="M15 5l-7 7 7 7"/>',
  logout:'<path d="M14 4.5h4.5A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
  scan:'<circle class="f" cx="12" cy="11" r="8"/><circle cx="12" cy="11" r="3.5"/><path d="M3 20.5h18M7 17.5l-1.5 3M17 17.5l1.5 3"/>',
  clock:'<circle class="f" cx="12" cy="12.5" r="8"/><path d="M12 8v4.5l3 2M9.5 2.5h5"/>',
  camera:'<path class="f" d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.5-2h5.4l1.5 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.5"/>'});
// Нүүрний 5 бүлэг → дотор нь ангиллууд. go: очих газар, sec: зөвхөн тухайн хэсгийг харуулах, act: маягт нээх
/* ---- Өнгө: хэрэглэгчийн сонгосон үндсэн өнгө (бараан горимд автоматаар гэгээлэг болно) ---- */
const ACCENTS=[['#5b8c7b','Ногоон'],['#3f8f94','Далай'],['#5a7fa8','Цэнхэр'],['#7b74b0','Нил ягаан'],['#b8707f','Ягаан'],['#c07f4a','Улбар'],['#9a8a3c','Шар'],['#6f7a80','Саарал']];
function mixHex(a,b,t){const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const A=p(a),B=p(b);return '#'+A.map((x,i)=>Math.round(x+(B[i]-x)*t).toString(16).padStart(2,'0')).join('')}
function isDark(){const th=D.settings.theme;return th==='dark'||(th!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)}
function applyAccent(){
  const c=D.settings.accent,st=document.documentElement.style;const m=document.querySelector('meta[name="theme-color"]');
  if(!c||!/^#[0-9a-f]{6}$/i.test(c)||c.toLowerCase()==='#5b8c7b'){st.removeProperty('--pri');st.removeProperty('--pri-soft');if(m)m.content='#5b8c7b';return}
  if(isDark()){st.setProperty('--pri',mixHex(c,'#ffffff',.32));st.setProperty('--pri-soft',mixHex(c,'#1c1e1d',.78))}
  else{st.setProperty('--pri',c);st.setProperty('--pri-soft',mixHex(c,'#ffffff',.86))}
  if(m)m.content=c;
}
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>applyAccent())}catch(e){}
function pickAccent(c){D.settings.accent=c;save();applyAccent();
  document.querySelectorAll('.swatches button').forEach(b=>b.classList.toggle('on',b.dataset.c===c))}
/* ---- Нүүрний хавтангийн дараалал ---- */
function orderedGroups(){const G=groups();const o=(D.settings.tileOrder||[]).filter(k=>G[k]);
  return [...o,...Object.keys(G).filter(k=>!o.includes(k))].map(k=>[k,G[k]])}
function tileTap(k){
  if(!UI.tileEdit)return openGroup(k);
  if(!UI.tilePick){UI.tilePick=k;return render()}
  if(UI.tilePick!==k){const o=orderedGroups().map(x=>x[0]);const i=o.indexOf(UI.tilePick),j=o.indexOf(k);if(i>=0&&j>=0)[o[i],o[j]]=[o[j],o[i]];D.settings.tileOrder=o;save()}
  UI.tilePick=null;render()}
function tileEdit(on){UI.tileEdit=on;UI.tilePick=null;render()}
function tileReset(){D.settings.tileOrder=[];save();UI.tilePick=null;render()}
function groups(){
  const t=today();
  const pend=c=>D.items.filter(i=>i.cat===c&&((occurs(i,t)&&!isDone(i,t))||isOverdue(i))).length;
  const upA=D.items.filter(i=>i.appt&&!i.done&&i.date>=t&&diffDays(t,i.date)<=7).length;
  const medLeft=medDoses(t).filter(({m,x})=>!(D.medLog[t]||{})[m.id+'@'+x]).length;
  const shop=D.shopping.filter(x=>!x.done).length,chores=D.chores.filter(c=>choreDays(c)<=0).length,hab=D.habits.filter(h=>!(D.habitLog[t]||{})[h.id]).length;
  return {
    ajil:{l:'Ажил',ic:'ajil',subs:[
      {k:'today',l:'Ажлын төлөвлөгөө',n:pend('ajil'),go:()=>goPlan('ajil')},
      rosterOn()?{k:'scan',l:'RT exam CT',go:()=>openRt()}:{k:'scan',l:'RT exam CT ↗',act:()=>window.open(rtLink(),'_blank')},
      {k:'link',l:'Ээлжийн хуваарь',go:()=>openRoster()},
      {k:'scan',l:'Тайлан',n:reportMissing(),go:()=>{UI.repDay=null;setView('report')}},
      {k:'clock',l:'Илүү цаг',go:()=>{UI.otMonth=null;setView('ot')}},
      {k:'plus',l:'Ажил нэмэх',act:()=>itemForm(null,{cat:'ajil',date:today()})},
      {k:'today',l:'Уулзалт нэмэх',act:()=>itemForm(null,{cat:'ajil',type:'event',date:today()})}]},
    huviin:{l:'Хувийн',ic:'huviin',subs:[
      {k:'huviin',l:'Хувийн ажил',n:pend('huviin'),go:()=>goPlan('huviin')},
      {k:'ger',l:'Гэр бүл',n:pend('ger'),go:()=>goPlan('ger')},
      {k:'plus',l:'Хувийн ажил нэмэх',act:()=>itemForm(null,{cat:'huviin'})},
      {k:'plus',l:'Гэр бүлийн ажил нэмэх',act:()=>itemForm(null,{cat:'ger'})}]},
    health:{l:'Эрүүл мэнд',ic:'health',subs:[
      {k:'appt',l:'Эмчийн цаг, шинжилгээ',n:upA,go:()=>goLife('health'),sec:'appt'},
      {k:'pill',l:'Эм',n:medLeft,go:()=>goLife('health'),sec:'meds'},
      {k:'chart',l:'Хэмжилт',go:()=>goLife('health'),sec:'meas'},
      {k:'drop',l:'Ус',go:()=>goLife('health'),sec:'water'}]},
    money:{l:'Санхүү',ic:'money',subs:[
      {k:'money',l:'Орлого, зарлага',go:()=>setView('money')},
      {k:'receipt',l:'Тогтмол төлбөр',n:billsDue(3).length,go:()=>setView('money'),sec:'bills'},
      {k:'minus',l:'Зарлага нэмэх',act:()=>quickTx('out')},
      {k:'plus',l:'Орлого нэмэх',act:()=>quickTx('in')},
      {k:'target',l:'Сарын төсөв',act:()=>budgetForm()}]},
    notes:{l:'Тэмдэглэл',ic:'notes',subs:[
      {k:'notes',l:'Тэмдэглэл',go:()=>setView('notes')},
      {k:'habits',l:'Зуршил',n:hab,go:()=>goLife('habits')},
      {k:'cart',l:'Худалдан авах',n:shop,go:()=>goLife('home'),sec:'shop'},
      {k:'broom',l:'Гэрийн ажил',n:chores,go:()=>goLife('home'),sec:'chores'},
      {k:'camera',l:'Зураг авах',act:()=>quickPhoto()},
      {k:'plus',l:'Тэмдэглэл бичих',act:()=>noteForm(null)}]}};
}
const sumN=g=>g.subs.reduce((a,s)=>a+(s.n||0),0);
const badge=n=>n?`<b class="badge">${n>99?'99+':n}</b>`:'';
function vHome(){
  const h=now().getHours();
  const greet=h<5?'Сайхан амраарай':h<12?'Өглөөний мэнд':h<18?'Өдрийн мэнд':'Оройн мэнд';
  const G=orderedGroups();const E=UI.tileEdit;
  return `<div class="homehead"><div class="hello">${greet}${D.settings.name?', '+esc(D.settings.name):''}</div><div class="sub">${longDate(today())}</div></div>
    ${E?`<div class="edit-bar"><span style="flex:1">${UI.tilePick?'Одоо солих хавтангаа дарна уу':'Байрыг нь солих хавтан дээр дарна уу'}</span><button class="lnk" onclick="tileReset()">Анхны байдал</button><button class="btn primary sm" onclick="tileEdit(false)">Болсон</button></div>`:''}
    <div class="tiles${E?' edit':''}">${G.map(([k,g],idx,arr)=>`<button class="tile${idx===arr.length-1&&arr.length%2?' wide':''}${UI.tilePick===k?' pick':''}" onclick="tileTap('${k}')"><svg viewBox="0 0 24 24">${TILE_ICONS[g.ic]}</svg>${badge(sumN(g))}<span>${g.l}</span></button>`).join('')}</div>${E?'':`<div style="text-align:right;margin:-6px 2px 10px"><button class="lnk" onclick="tileEdit(true)">⇅ Дараалал засах</button></div>`}`+reportMini()+(h>=17||D.journal[today()]?journalCard(today()):'')+homeTodo();
}
// Оройн сануулга дээр дарахад: нүүр хуудас → тэмдэглэлийн талбар
function goJournal(){if(!$('#sheet').classList.contains('hidden'))closeSheet();if(VIEW!=='home')setView('home');else render();
  setTimeout(()=>{const g=$('#jGood');if(g){g.scrollIntoView({block:'center'});g.focus()}},150)}
// Нүүрний доод хэсэг: өнөөдөр хийх ажлын жагсаалт
function homeTodo(){
  const t=today();
  const overdue=D.items.filter(i=>isOverdue(i)).sort((a,b)=>a.date.localeCompare(b.date));
  const list=D.items.filter(i=>occurs(i,t)).sort((a,b)=>(isDone(a,t)-isDone(b,t))||byTime(a,b));
  const left=list.filter(i=>!isDone(i,t)).length+overdue.length;
  const rows=[...overdue.map(i=>itemRow(i,i.date,{showDate:true})),...list.map(i=>itemRow(i,t))];
  return `<div class="card"><h2>Өнөөдөр хийх${left?` <span class="tag">${left}</span>`:''}<span class="sp"></span><button class="lnk" onclick="itemForm(null,{date:today()})">+ нэмэх</button></h2>
    ${rows.length?rows.join(''):'<div class="empty">Өнөөдөр хийх ажил алга. ＋ дарж нэмээрэй.</div>'}
    ${rows.length?`<div class="row-btns" style="margin-top:8px"><span class="sp"></span><button class="lnk" onclick="setView('today')">Өдрийн бүх хуваарь →</button></div>`:''}</div>`;
}
function openGroup(k){UI.grp=k;setView('grp')}
function vGroup(){
  const g=groups()[UI.grp];if(!g)return vHome();
  return `<div class="tiles sub">${g.subs.map((s,i)=>`<button class="tile" onclick="openSub(${i})"><svg viewBox="0 0 24 24">${TILE_ICONS[s.k]}</svg>${badge(s.n)}<span>${s.l}</span></button>`).join('')}</div>`;
}
function openSub(i){
  const g=groups()[UI.grp],s=g&&g.subs[i];if(!s)return;
  if(s.act)return s.act();
  s.go();UI.back=UI.grp;UI.sec=s.sec||null;UI.subTitle=s.l;render();window.scrollTo(0,0);
}
function goBack(){const g=UI.back;UI.grp=g;setView('grp')}
function goPlan(cat){UI.planCat=cat;UI.planDay=today();UI.planWeek=weekStart(today());setView('plan')}
function goLife(sub){UI.life=sub;setView('life')}

/* ---------- Илүү цаг ---------- */
const fmtH=h=>(Math.round((h||0)*10)/10).toString().replace(/\.0$/,'');
function otMonth(mo){const L=(D.ot||[]).filter(x=>ym(x.date)===mo).sort((a,b)=>a.date.localeCompare(b.date)||(a.start||'').localeCompare(b.start||''));
  return {L,tot:L.reduce((a,x)=>a+(+x.hours||0),0),days:new Set(L.map(x=>x.date)).size}}
function vOT(){
  const mo=UI.otMonth||ym(today());const [y,m]=mo.split('-').map(Number);
  const sh=k=>{const d=new Date(y,m-1+k,1);return d.getFullYear()+'-'+pad(d.getMonth()+1)};
  const {L,tot,days}=otMonth(mo);const rate=+D.settings.otRate||0;
  const yearTot=(D.ot||[]).filter(x=>x.date.slice(0,4)===String(y)).reduce((a,x)=>a+(+x.hours||0),0);
  let out=`<div class="card"><h2><button class="lnk" onclick="UI.otMonth='${sh(-1)}';render()">‹</button><span style="flex:1;text-align:center">${y} оны ${m} сар</span><button class="lnk" onclick="UI.otMonth='${sh(1)}';render()">›</button></h2>
    <div class="stats"><div class="stat"><small>Нийт илүү цаг</small><b class="big">${fmtH(tot)}</b></div><div class="stat"><small>Өдөр</small><b class="big">${days}</b></div>
    <div class="stat"><small>Тооцоолсон дүн</small><b>${rate?money(tot*rate):'—'}</b></div></div>
    <div class="small" style="margin-top:8px">${rate?'Цагийн хөлс '+money(rate)+' · ':''}${y} онд нийт ${fmtH(yearTot)} цаг</div>
    <div class="btns" style="margin-top:12px"><button class="btn primary" onclick="otForm(null)">+ Илүү цаг</button><button class="btn" onclick="otShare('${mo}')" ${L.length?'':'disabled'}>Нэгтгэл хуваалцах</button><button class="btn ghost" onclick="otRateForm()">Цагийн хөлс</button></div></div>`;
  out+=`<div class="card"><h2>Бүртгэл</h2>${L.length?L.map(x=>`<div class="row" style="cursor:pointer" onclick="otForm('${x.id}')"><div style="min-width:78px"><b>${dayLabel(x.date)}</b></div>
      <div class="main"><div class="ttl">${x.start?x.start+'–'+x.end:'Цаг заагаагүй'}${x.note?' · '+esc(x.note):''}</div></div><span class="amt">${fmtH(x.hours)} ц</span></div>`).join('')
    :'<div class="empty">Энэ сард илүү цаг бүртгээгүй. Хурдан нэмэхэд “илүү цаг 3” эсвэл “өчигдөр илүү цаг 18:00-21:00” гэж бичиж болно.</div>'}</div>`;
  return out;
}
function otForm(id,preset={}){
  let x=id?D.ot.find(o=>o.id===id):null;const isNew=!x;if(!x)x=Object.assign({date:today(),start:'',end:'',hours:null,note:''},preset);
  openForm({title:isNew?'Илүү цаг нэмэх':'Илүү цаг',fields:[
    {k:'date',l:'Огноо',type:'date',value:x.date},
    [{k:'start',l:'Эхэлсэн',type:'time',value:x.start},{k:'end',l:'Дууссан',type:'time',value:x.end}],
    {k:'hours',l:'Цаг (эхлэх/дуусах оруулбал өөрөө бодно)',type:'number',value:x.hours,ph:'Жишээ: 2.5'},
    {k:'note',l:'Тайлбар',value:x.note,ph:'Шалтгаан, хийсэн ажил'}],
    onSave:o=>{if(o.start&&o.end)o.hours=otHours(o.start,o.end);
      if(!o.hours||o.hours<=0){toast('Цагаа оруулна уу');return false}if(o.hours>24){toast('24-өөс их цаг байж болохгүй');return false}
      o.hours=Math.round(o.hours*10)/10;if(!o.date)o.date=today();
      if(isNew)(D.ot=D.ot||[]).push(Object.assign({id:uid(),created:Date.now()},o));else Object.assign(x,o);toast('Хадгаллаа · '+fmtH(o.hours)+' цаг')},
    onDelete:isNew?null:()=>{D.ot=D.ot.filter(o=>o.id!==x.id)}});
  const upd=()=>{const a=$('#f_start').value,b=$('#f_end').value;if(a&&b)$('#f_hours').value=otHours(a,b)};
  $('#f_start').onchange=upd;$('#f_end').onchange=upd;
}
function otRateForm(){openForm({title:'Илүү цагийн хөлс',fields:[{k:'r',l:'1 цагийн хөлс (₮) — 0 бол тооцохгүй',type:'number',value:D.settings.otRate||''}],onSave:o=>{D.settings.otRate=o.r||0}})}
function otSummary(mo){
  const [y,m]=mo.split('-').map(Number);const {L,tot,days}=otMonth(mo);const rate=+D.settings.otRate||0;
  return [`Илүү цаг — ${y} оны ${m} сар`+(D.settings.name?' · '+D.settings.name:''),'',
    ...L.map(x=>{const d=parseD(x.date);return `${m}/${d.getDate()} ${WD[d.getDay()].slice(0,3)}  ${x.start?x.start+'–'+x.end+'  ':''}${fmtH(x.hours)} цаг${x.note?' — '+x.note:''}`}),'',
    `Нийт: ${fmtH(tot)} цаг (${days} өдөр)`+(rate?`\nДүн: ${fmtH(tot)} × ${money(rate)} = ${money(tot*rate)}`:'')].join('\n');
}
async function otShare(mo){
  const text=otSummary(mo);
  try{if(window.NativeApp&&NativeApp.isNative){await NativeApp.shareText(text,'Миний өдөр');return}if(navigator.share){await navigator.share({title:'Илүү цаг',text});return}}catch(e){if(e.name==='AbortError')return}
  try{await navigator.clipboard.writeText(text);toast('Нэгтгэлийг хуулсан — чат, имэйлд буулгаарай')}
  catch(e){openSheet(`<h3>Нэгтгэл</h3><textarea rows="12" readonly>${esc(text)}</textarea><div class="row-btns"><span class="sp"></span><button class="btn primary" onclick="closeSheet()">Хаах</button></div>`)}
}

/* ---------- Ажлын тайлан: өрөө бүрт хэдэн хүн (тодосгогчгүй / тодосгогчтой) ---------- */
const rooms=()=>(D.settings.rooms&&D.settings.rooms.length?D.settings.rooms:['CT','MRI','Рентген']);
const contrastRooms=()=>D.settings.contrastRooms||['CT','MRI'];
const isSplit=k=>contrastRooms().some(r=>r.toLowerCase()===String(k).toLowerCase());
// өрөөний утга: тоо (хуваагдаагүй) эсвэл {n: тодосгогчгүй, c: тодосгогчтой}
const rv=v=>v==null?{n:0,c:0}:typeof v==='number'?{n:v,c:0}:{n:+v.n||0,c:+v.c||0};
const rsum=v=>{const x=rv(v);return x.n+x.c};
const repGet=d=>(D.reports||[]).find(x=>x.date===d);
const repTotal=r=>r?Object.values(r.rooms||{}).reduce((a,v)=>a+rsum(v),0):0;
function repSave(d,roomsObj,note){
  D.reports=D.reports||[];let x=repGet(d);const out={};
  Object.entries(roomsObj||{}).forEach(([k,v])=>{const o=rv(v);o.n=Math.max(0,Math.round(o.n));o.c=Math.max(0,Math.round(o.c));
    if(o.n+o.c)out[k]=(isSplit(k)||o.c)?o:o.n});
  const nt=note!==undefined?note:(x&&x.note)||'';
  if(!Object.keys(out).length&&!nt){D.reports=D.reports.filter(r=>r.date!==d)}
  else{if(!x){x={id:d,date:d};D.reports.push(x)}x.rooms=out;x.note=nt;x.updated=Date.now()}
  save();
}
function repAdd(d,room,mode,delta){const r=Object.assign({},(repGet(d)||{}).rooms);const o=rv(r[room]);o[mode]=Math.max(0,o[mode]+delta);r[room]=o;repSave(d,r);render()}
function repActive(){const t=today();return (D.reports||[]).some(r=>r.date>=addDays(t,-14))}
function reportMissing(){const n=now();return repActive()&&n.getHours()>=17&&!repGet(today())?1:0}
const q_=k=>esc(k).replace(/'/g,'');
function reportMini(){
  if(!repActive())return '';const t=today();const r=(repGet(t)||{}).rooms||{};
  const cell=(k,mode,label)=>`<div class="exm"><span>${label}</span><button onclick="repAdd(today(),'${q_(k)}','${mode}',-1)" aria-label="${esc(label)} хасах">−</button><b>${rv(r[k])[mode]}</b><button onclick="repAdd(today(),'${q_(k)}','${mode}',1)" aria-label="${esc(label)} нэмэх">+</button></div>`;
  return `<div class="card"><h2>Тайлан — өнөөдөр${repTotal(repGet(t))?` <span class="tag">${repTotal(repGet(t))} хүн</span>`:''}<span class="sp"></span><button class="lnk" onclick="UI.repDay=null;setView('report')">Дэлгэрэнгүй →</button></h2>
    <div class="exmini">${rooms().map(k=>isSplit(k)?cell(k,'n',esc(k)+' тодгүй')+cell(k,'c',esc(k)+' тодтой'):cell(k,'n',esc(k))).join('')}</div></div>`;
}
function vReport(){
  const t=today();const d=UI.repDay||t;const rep=repGet(d)||{};const r=rep.rooms||{};
  const mo=ym(d);const [y,m]=mo.split('-').map(Number);
  const L=(D.reports||[]).filter(x=>ym(x.date)===mo).sort((a,b)=>a.date.localeCompare(b.date));
  const keys=[...new Set([...rooms(),...L.flatMap(x=>Object.keys(x.rooms||{}))])];
  // хүснэгтийн багана: хуваалттай өрөө 2 багана
  const cols=keys.flatMap(k=>isSplit(k)||L.some(x=>rv((x.rooms||{})[k]).c)?[[k,'n','тодгүй'],[k,'c','тодтой']]:[[k,'n','']]);
  const colTot=([k,mode])=>L.reduce((a,x)=>a+rv((x.rooms||{})[k])[mode],0);const all=L.reduce((a,x)=>a+repTotal(x),0);
  const btns=(k,mode)=>`<div class="exbtns"><button class="exb minus" onclick="repAdd('${d}','${q_(k)}','${mode}',-1)" aria-label="хасах">−</button><button class="exb plus" onclick="repAdd('${d}','${q_(k)}','${mode}',1)" aria-label="нэмэх">+</button></div>`;
  const box=k=>{const o=rv(r[k]);
    if(!isSplit(k))return `<div class="exbox"><div class="exl">${esc(k)}<small>өрөө</small></div><div class="exnum">${o.n}</div>${btns(k,'n')}</div>`;
    return `<div class="exbox split"><div class="exl">${esc(k)}<small>нийт ${o.n+o.c}</small></div>
      <div class="exsplit"><div><small>Тодосгогчгүй</small><div class="exnum">${o.n}</div>${btns(k,'n')}</div><div><small>Тодосгогчтой</small><div class="exnum c">${o.c}</div>${btns(k,'c')}</div></div></div>`};
  let out=`<div class="mnav"><button class="lnk" onclick="UI.repDay='${addDays(d,-1)}';render()">‹ Өмнөх</button><b>${dayLabel(d)}${d===t?' · '+m+'/'+parseD(d).getDate():''}</b><button class="lnk" onclick="UI.repDay='${addDays(d,1)}';render()" ${d>=t?'disabled style="opacity:.3"':''}>Дараах ›</button></div>
    <div class="exgrid">${rooms().map(box).join('')}</div>
    <div class="extot">Нийт <b>${repTotal(rep)}</b> хүн <button class="lnk" onclick="repEdit('${d}')">✎ Тоогоор засах</button></div>
    <div class="fld" style="margin:6px 0 14px"><input placeholder="Тэмдэглэл (заавал биш): онцлог тохиолдол, ээлж…" value="${esc(rep.note||'')}" onchange="repSave('${d}',(repGet('${d}')||{}).rooms,this.value.trim());toast('Хадгаллаа')"></div>`;
  out+=`<div class="card"><h2>${y} оны ${m} сар<span class="sp"></span><span class="small">нийт ${all} хүн · ${L.length} өдөр</span></h2>
    ${L.length?`<div style="overflow-x:auto"><table class="extab"><tr><th>Өдөр</th>${cols.map(([k,,s])=>`<th>${esc(k)}${s?`<br><small>${s}</small>`:''}</th>`).join('')}<th>Нийт</th></tr>
      ${L.slice().reverse().map(x=>`<tr onclick="UI.repDay='${x.date}';render();window.scrollTo(0,0)" class="${x.date===d?'on':''}"><td>${dayLabel(x.date)}${x.note?' 📝':''}</td>${cols.map(([k,mode])=>`<td>${rv((x.rooms||{})[k])[mode]||''}</td>`).join('')}<td><b>${repTotal(x)}</b></td></tr>`).join('')}
      <tr class="sum"><td>Нийт</td>${cols.map(c=>`<td>${colTot(c)}</td>`).join('')}<td>${all}</td></tr></table></div>`:'<div class="empty">Энэ сард тайлан бичээгүй байна. Дээрх + товчоор хүн бүрийг нэмээрэй.</div>'}
    <div class="btns" style="margin-top:12px"><button class="btn sm" onclick="repShare('${mo}')" ${L.length?'':'disabled'}>Нэгтгэл хуваалцах</button><button class="btn sm" onclick="window.open(rtLink(),'_blank')">RT exam CT ↗</button><button class="btn sm ghost" onclick="roomsForm()">Өрөөнүүд / сануулга</button></div></div>`;
  return out;
}
function repEdit(d){const r=(repGet(d)||{}).rooms||{};
  const f=rooms().map(k=>isSplit(k)?[{k:'n_'+k,l:k+' — тодосгогчгүй',type:'number',value:rv(r[k]).n},{k:'c_'+k,l:k+' — тодосгогчтой',type:'number',value:rv(r[k]).c}]:{k:'n_'+k,l:k,type:'number',value:rv(r[k]).n});
  openForm({title:'Тайлан · '+dayLabel(d),fields:f,onSave:o=>{const n=Object.assign({},r);rooms().forEach(k=>{n[k]={n:o['n_'+k]||0,c:o['c_'+k]||0}});repSave(d,n)}})}
function roomsForm(){openForm({title:'Өрөөнүүд',fields:[
  {k:'rooms',l:'Өрөөнүүд (таслалаар)',value:rooms().join(', '),ph:'CT, MRI, Рентген'},
  {k:'cr',l:'Тодосгогчтой / тодосгогчгүй гэж салгах өрөөнүүд',value:contrastRooms().join(', '),ph:'CT, MRI'},
  {k:'rem',l:'Орой сануулах цаг (хоосон бол сануулахгүй)',type:'time',value:D.settings.reportRemind||''}],
  onSave:o=>{const list=o.rooms.split(',').map(s=>s.trim()).filter(Boolean);if(!list.length){toast('Дор хаяж нэг өрөө');return false}
    D.settings.rooms=[...new Set(list)];D.settings.contrastRooms=[...new Set(o.cr.split(',').map(s=>s.trim()).filter(Boolean))];D.settings.reportRemind=o.rem}})}
function repSummary(mo){
  const [y,m]=mo.split('-').map(Number);const L=(D.reports||[]).filter(x=>ym(x.date)===mo).sort((a,b)=>a.date.localeCompare(b.date));
  const keys=[...new Set([...rooms(),...L.flatMap(x=>Object.keys(x.rooms||{}))])];
  const fmt=(k,o)=>(isSplit(k)||o.c)?`${k} ${o.n}+${o.c}т`:`${k} ${o.n}`;
  const tot=k=>L.reduce((a,x)=>{const o=rv((x.rooms||{})[k]);return {n:a.n+o.n,c:a.c+o.c}},{n:0,c:0});
  return [`Тайлан — ${y} оны ${m} сар`+(D.settings.name?' · '+D.settings.name:''),'(тоо = тодосгогчгүй+тодосгогчтой)','',
    ...L.map(x=>{const dd=parseD(x.date);return `${m}/${dd.getDate()} ${WD[dd.getDay()].slice(0,3)}  `+keys.filter(k=>rsum((x.rooms||{})[k])).map(k=>fmt(k,rv(x.rooms[k]))).join(', ')+`  = ${repTotal(x)}`+(x.note?' — '+x.note:'')}),'',
    'Нийт:',...keys.filter(k=>{const o=tot(k);return o.n+o.c}).map(k=>{const o=tot(k);return (isSplit(k)||o.c)?`  ${k}: тодосгогчгүй ${o.n}, тодосгогчтой ${o.c} (нийт ${o.n+o.c})`:`  ${k}: ${o.n}`}),
    `  Бүгд ${L.reduce((a,x)=>a+repTotal(x),0)} хүн (${L.length} өдөр)`].join('\n');
}
async function repShare(mo){
  const text=repSummary(mo);
  try{if(window.NativeApp&&NativeApp.isNative){await NativeApp.shareText(text,'Миний өдөр');return}if(navigator.share){await navigator.share({title:'Тайлан',text});return}}catch(e){if(e.name==='AbortError')return}
  try{await navigator.clipboard.writeText(text);toast('Нэгтгэлийг хуулсан')}
  catch(e){openSheet(`<h3>Нэгтгэл</h3><textarea rows="12" readonly>${esc(text)}</textarea><div class="row-btns"><span class="sp"></span><button class="btn primary" onclick="closeSheet()">Хаах</button></div>`)}
}

/* ---------- Хажуугийн цэс, хонх ---------- */
function openMenu(){
  const s=D.settings;const ini=(s.name||'?').trim().slice(0,1).toUpperCase();
  const row=(k,l,fn,n)=>`<button class="menu-row" onclick="closeDrawer();${fn}"><svg viewBox="0 0 24 24">${TILE_ICONS[k]}</svg><span style="flex:1">${l}</span>${n?`<span class="tag">${n}</span>`:''}</button>`;
  $('#drawerBody').innerHTML=`<div class="dr-head"><div class="dr-app">Миний өдөр, v${VERSION}</div>
      <button class="avatar" onclick="$('#avatarInput').click()" aria-label="Профайл зураг солих">${s.avatar?`<img src="${s.avatar}" alt="">`:`<span>${esc(ini)}</span>`}</button>
      <div class="dr-name">${esc((s.name||'Нэрээ оруулах').toUpperCase())}</div>${fbUser?`<div class="small" style="margin-top:4px">${esc(fbUser.email||'')} · ${fbState==='error'?'⚠️':'☁️'}</div>`:''}</div>
    <div class="dr-list"><div class="dr-sec">Үндсэн цэс</div>
      ${row('grid','Нүүр',"setView('home')")}
      ${row('today','Өнөөдөр',"setView('today')")}
      ${Object.entries(groups()).map(([k,g])=>row(g.ic,g.l,`openGroup('${k}')`,sumN(g))).join('')}
      <div class="dr-sec">Бусад</div>
      ${row('search','Хайх','openSearch()')}${rosterOn()?row('scan','RT exam CT','openRt()'):row('scan','RT exam CT ↗',"window.open(rtLink(),'_blank')")}${row('link','Ээлжийн хуваарь','openRoster()')}${row('clock','Илүү цаг',"UI.otMonth=null;setView('ot')")}${row('backup','Нөөц хуулбар авах','exportBackup()')}${row('settings','Тохиргоо','openSettings()')}${fbUser?row('logout','Гарах','logout()'):''}
    </div>`;
  $('#drawer').classList.remove('hidden');
}
TILE_ICONS.grid='<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>';
function closeDrawer(){$('#drawer').classList.add('hidden')}
function setAvatar(ev){
  const f=ev.target.files[0];ev.target.value='';if(!f)return;
  const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=256;const k=Math.min(img.width,img.height);
    c.getContext('2d').drawImage(img,(img.width-k)/2,(img.height-k)/2,k,k,0,0,256,256);URL.revokeObjectURL(img.src);
    D.settings.avatar=c.toDataURL('image/jpeg',.85);save();openMenu();toast('Зураг солигдлоо')};
  img.src=URL.createObjectURL(f);
}
// Хонх: ойрын сануулгууд
function bellItems(){
  const n=now(),t=today(),tm=addDays(t,1),mins=n.getHours()*60+n.getMinutes(),out=[];
  D.items.forEach(i=>{if(!i.time)return;[t,tm].forEach(day=>{if(!occurs(i,day)||isDone(i,day))return;if(day===t&&toMin(i.time)<mins-30)return;
    out.push({at:day+' '+i.time,ic:i.appt?(APPT[i.appt]||APPT.other).i:'📅',t:i.title,s:dayLabel(day)+' '+i.time+(i.place?' · '+i.place:''),fn:`itemForm('${i.id}')`})})});
  medDoses(t).forEach(({m,x})=>{if(!(D.medLog[t]||{})[m.id+'@'+x])out.push({at:t+' '+x,ic:'💊',t:m.name,s:'Өнөөдөр '+x+(toMin(x)<mins?' · уугаагүй':''),fn:"goLife('health')"})});
  D.items.filter(i=>i.appt&&!i.done&&i.date>tm&&diffDays(t,i.date)<=7).forEach(i=>out.push({at:i.date+' '+(i.time||''),ic:(APPT[i.appt]||APPT.other).i,t:i.title,s:dayLabel(i.date)+(i.time?' '+i.time:''),fn:`itemForm('${i.id}')`}));
  billsDue(3).forEach(b=>out.push({at:t+' 00',ic:'🧾',t:b.name+' — '+money(b.amount),s:b.days<0?(-b.days)+' хоног хэтэрсэн':b.days===0?'Өнөөдөр төлөх':b.days+' хоногийн дараа',fn:"setView('money')"}));
  return out.sort((a,b)=>a.at.localeCompare(b.at));
}
function openBell(){
  const L=bellItems();
  openSheet(`<h3>Сануулгууд</h3>${L.length?L.map(x=>`<div class="row" style="cursor:pointer" onclick="closeSheet();${x.fn}"><span style="font-size:1.3rem">${x.ic}</span><div class="main"><div class="ttl">${esc(x.t)}</div><div class="meta">${esc(x.s)}</div></div></div>`).join(''):'<div class="empty">Ойрын хугацаанд сануулах зүйл алга.</div>'}
    ${D.settings.notify?'':'<div class="row-btns"><span class="small" style="flex:1">Утсанд сануулга ирүүлэх үү?</span><button class="btn sm primary" onclick="closeSheet();enableNotify()">Асаах</button></div>'}`);
}
