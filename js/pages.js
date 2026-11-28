/* ---------- Өнөөдөр ---------- */
function vToday(){
  const t=today();
  const timed=D.items.filter(i=>i.time&&occurs(i,t)).sort(byTime);
  const tasks=D.items.filter(i=>!i.time&&occurs(i,t));
  const overdue=D.items.filter(i=>isOverdue(i)).sort((a,b)=>a.date.localeCompare(b.date));
  const undated=D.items.filter(i=>!i.date&&!i.done);
  const tomorrow=D.items.filter(i=>occurs(i,addDays(t,1))).sort(byTime);
  let out=`<button class="quickbar" onclick="openQuick()"><b>＋</b> Юу хийх вэ? “маргааш 10-д уулзалт”, “хоол 12000”…</button>`;

  const allTasks=[...overdue,...tasks];
  if(!timed.length&&!allTasks.length){
    out+=`<div class="card"><h2>Өнөөдөр</h2><div class="empty">Төлөвлөсөн зүйл алга — чөлөөтэй өдөр.</div>${undated.length?`<details><summary>Хугацаагүй ажил (${undated.length})</summary>${undated.map(i=>itemRow(i,t)).join('')}</details>`:''}</div>`;
  } else {
    if(timed.length)out+=`<div class="card"><h2>Хуваарь<span class="sp"></span><button class="lnk" onclick="itemForm(null,{type:'event',date:today()})">+ нэмэх</button></h2>${timed.map(i=>itemRow(i,t)).join('')}</div>`;
    out+=`<div class="card"><h2>Хийх ажил<span class="sp"></span><button class="lnk" onclick="itemForm(null,{date:today()})">+ нэмэх</button></h2>`;
    out+=allTasks.length?allTasks.map(i=>itemRow(i,occurs(i,t)?t:i.date,{showDate:i.date!==t})).join(''):`<div class="empty">Өнөөдөрт ажил алга.</div>`;
    if(undated.length)out+=`<details><summary>Хугацаагүй ажил (${undated.length})</summary>${undated.map(i=>itemRow(i,t)).join('')}</details>`;
    out+=`</div>`;
  }

  // Эм
  if(medDoses(t).length){
    const log=D.medLog[t]||{};const doses=[];
    medDoses(t).forEach(({m,x})=>doses.push({m,tm:x}));
    const taken=doses.filter(x=>log[x.m.id+'@'+x.tm]).length;
    out+=`<div class="card"><h2>Эм<span class="sp"></span><span class="tag ${taken===doses.length?'ok':''}">${taken}/${doses.length}</span></h2>`+
      doses.map(x=>{const k=x.m.id+'@'+x.tm;return `<div class="row ${log[k]?'st-ok':'st-no'}"><input type="checkbox" class="cb" ${log[k]?'checked':''} onchange="toggleMed('${k}')"><span class="tm">${x.tm}</span><div class="main"><div class="ttl">${esc(x.m.name)}</div><div class="meta">${[esc(x.m.dose||''),medTodayTxt(x.m,t),medCourse(x.m,t)].filter(Boolean).join(' · ')}</div></div></div>`}).join('')+`</div>`;
  }
  // Зуршил + ус
  if(D.habits.length){
    const log=D.habitLog[t]||{};
    out+=`<div class="card"><h2>Зуршил<span class="sp"></span><span class="tag">${D.habits.filter(x=>log[x.id]).length}/${D.habits.length}</span></h2>`+
      D.habits.map(x=>`<div class="row ${log[x.id]?'done':''}"><input type="checkbox" class="cb" ${log[x.id]?'checked':''} onchange="toggleHabit('${x.id}')"><div class="main"><div class="ttl">${esc(x.icon||'')} ${esc(x.name)}</div><div class="meta">🔥 ${streak(x.id)} өдөр дараалан</div></div></div>`).join('')+`</div>`;
  }

  // Санхүү
  const spent=D.tx.filter(x=>x.date===t&&x.type==='out').reduce((a,x)=>a+x.amount,0);
  const mSpent=D.tx.filter(x=>ym(x.date)===ym(t)&&x.type==='out').reduce((a,x)=>a+x.amount,0);
  const due=billsDue(5);
  if(spent||due.length)out+=`<div class="card"><h2>Мөнгө<span class="sp"></span><button class="lnk" onclick="txForm(null,'out')">+ зарлага</button></h2>
    <div class="stats"><div class="stat"><small>Өнөөдөр</small><b>${money(spent)}</b></div><div class="stat"><small>Энэ сар</small><b>${money(mSpent)}</b></div>
    <div class="stat"><small>Төсөв үлдсэн</small><b>${D.budget?money(D.budget-mSpent):'—'}</b></div></div>
    ${due.map(b=>`<div class="row"><div class="main" onclick="setView('money')"><div class="ttl">🧾 ${esc(b.name)} — ${money(b.amount)}</div><div class="meta">${b.days===0?'<span class="tag bad">өнөөдөр төлөх</span>':b.days<0?`<span class="tag bad">${-b.days} хоног хэтэрсэн</span>`:`<span class="tag warn">${b.days} хоногийн дараа</span>`}</div></div><button class="btn sm" onclick="payBill('${b.id}')">Төлсөн</button></div>`).join('')}
  </div>`;

  // Ахуй
  const shopLeft=D.shopping.filter(x=>!x.done).length;
  const choresDue=D.chores.filter(c=>choreDays(c)<=0);
  if(shopLeft||choresDue.length){
    out+=`<div class="card"><h2>Ахуй</h2>${shopLeft?`<div class="row"><div class="main" onclick="UI.life='home';setView('life')"><div class="ttl">🛒 Худалдан авах ${shopLeft} зүйл</div><div class="meta">${esc(D.shopping.filter(x=>!x.done).slice(0,4).map(x=>x.text).join(', '))}</div></div></div>`:''}
    ${choresDue.map(c=>`<div class="row"><div class="main"><div class="ttl">🧹 ${esc(c.name)}</div><div class="meta">${choreLabel(c)}</div></div><button class="btn sm" onclick="doChore('${c.id}')">Хийсэн</button></div>`).join('')}</div>`;
  }

  if(tomorrow.length){
    out+=`<div class="card"><h2>Маргааш</h2>${tomorrow.map(i=>itemRow(i,addDays(t,1))).join('')}</div>`;
  }
  if(now().getHours()>=17||D.journal[t])out+=journalCard(t);
  out+=weekCard();
  return out;
}
function journalCard(t){
  const j=D.journal[t]||{};const moods=['😞','🙁','😐','🙂','😄'];
  return `<div class="card"><h2>Оройн 2 минут</h2>
    <div class="small" style="margin-bottom:6px">Өнөөдөр ямар байв?</div>
    <div class="moods">${moods.map((e,k)=>`<button class="${j.mood===k+1?'on':''}" onclick="setJ('mood',${k+1})">${e}</button>`).join('')}</div>
    <div class="fld"><label>Өдөр ямар байсан бэ? (тэмдэглэл)</label><textarea id="jGood" rows="4" oninput="jDraft('good',this.value)" onchange="setJ('good',this.value)" placeholder="Юу болсон, юу сайн байсан, юу мэдэрсэн…">${esc(j.good||'')}</textarea></div>
    <div class="fld"><label>Маргаашийн хамгийн чухал 1 ажил</label><input id="jTop" value="${esc(j.top||'')}" oninput="jDraft('top',this.value)" onchange="setJ('top',this.value)" placeholder="Жишээ: тайлангаа дуусгах"></div>
    <button class="btn primary" style="width:100%" onclick="saveJ()">Хадгалах</button>
    ${journalPast(t)}
  </div>`;
}
function journalPast(t){
  const moods=['😞','🙁','😐','🙂','😄'];
  const days=Object.keys(D.journal).filter(d=>d<t&&D.journal[d]&&(D.journal[d].good||D.journal[d].mood)).sort().reverse().slice(0,30);
  if(!days.length)return '';
  return `<details style="margin-top:10px"><summary class="small">Өмнөх өдрүүдийн тэмдэглэл (${days.length})</summary>${days.map(d=>{const j=D.journal[d];
    return `<div class="row"><div class="main"><div class="ttl">${j.mood?moods[j.mood-1]+' ':''}${longDate(d)}</div>${j.good?`<div class="meta" style="white-space:pre-wrap">${esc(j.good)}</div>`:''}</div></div>`}).join('')}</details>`;
}
// Бичих явцад шууд локалд хадгална (апп хаагдсан ч алдагдахгүй), үүлэнд товч дарахад/талбараас гарахад
let _jT;function jDraft(k,v){const t=today();D.journal[t]=D.journal[t]||{};D.journal[t][k]=v;clearTimeout(_jT);_jT=setTimeout(saveLocal,400)}
function saveJ(){const g=$('#jGood'),tp=$('#jTop');clearTimeout(_jT);
  const t=today();D.journal[t]=D.journal[t]||{};if(g)D.journal[t].good=g.value;
  if(tp)setJ('top',tp.value,true);else save();toast('Тэмдэглэл хадгаллаа ✓');document.activeElement&&document.activeElement.blur()}
function setJ(k,v,quiet){const t=today();D.journal[t]=D.journal[t]||{};D.journal[t][k]=v;
  if(k==='top'&&v.trim()){const tm=addDays(t,1);if(!D.items.some(i=>i.fromJournal===t)){D.items.push({id:uid(),type:'task',title:v.trim(),cat:'huviin',date:tm,time:'',remind:0,repeat:'',note:'',fromJournal:t,created:Date.now()})}
    else{const i=D.items.find(i=>i.fromJournal===t);i.title=v.trim()}}
  save();if(k==='mood')render();else if(!quiet)toast('Хадгаллаа')}
function weekCard(){
  const t=today();const days=[...Array(7)].map((_,k)=>addDays(t,-k));
  const doneN=D.items.filter(i=>!i.repeat&&i.done&&i.doneAt&&days.includes(i.doneAt)).length+D.items.reduce((a,i)=>a+(i.doneDates||[]).filter(d=>days.includes(d)).length,0);
  const spent=D.tx.filter(x=>x.type==='out'&&days.includes(x.date)).reduce((a,x)=>a+x.amount,0);
  const moods=days.map(d=>D.journal[d]&&D.journal[d].mood).filter(Boolean);
  const hab=D.habits.length?Math.round(100*days.reduce((a,d)=>a+D.habits.filter(h=>(D.habitLog[d]||{})[h.id]).length,0)/(7*D.habits.length)):null;
  const moodE=moods.length?['😞','🙁','😐','🙂','😄'][Math.round(moods.reduce((a,b)=>a+b,0)/moods.length)-1]:'—';
  return `<details class="card"><summary>Сүүлийн 7 хоногийн тойм</summary><div class="stats" style="margin-top:8px">
    <div class="stat"><small>Дууссан ажил</small><b>${doneN}</b></div>
    <div class="stat"><small>Зарлага</small><b>${money(spent)}</b></div>
    <div class="stat"><small>${hab!==null?'Зуршил':'Сэтгэл санаа'}</small><b>${hab!==null?hab+'%':moodE}</b></div></div>
    ${hab!==null&&moods.length?`<div class="small" style="margin-top:8px">Дундаж сэтгэл санаа: ${moodE}</div>`:''}</details>`;
}

/* ---------- Төлөвлөгөө ---------- */
function weekStart(s){const d=parseD(s);const k=(d.getDay()+6)%7;return addDays(s,-k)}
function vPlan(){
  const t=today();UI.planDay=UI.planDay||t;UI.planWeek=UI.planWeek||weekStart(UI.planDay);
  const f=i=>UI.planCat==='all'||i.cat===UI.planCat;
  const items=D.items.filter(f);
  let out=`<div class="seg">${[['all','Бүгд'],['ajil','Ажил'],['huviin','Хувийн'],['ger','Гэр бүл'],['eruul','Эрүүл мэнд']].map(([k,l])=>`<button class="${UI.planCat===k?'on':''}" onclick="UI.planCat='${k}';render()">${l}</button>`).join('')}</div>`;
  out+=`<div class="week"><button class="nav" onclick="UI.planWeek=addDays(UI.planWeek,-7);render()">‹</button>`;
  for(let k=0;k<7;k++){const d=addDays(UI.planWeek,k);const n=items.filter(i=>occurs(i,d)&&!isDone(i,d)).length;const dd=parseD(d);
    out+=`<button class="day ${d===UI.planDay?'on':''} ${d===t?'today':''}" onclick="UI.planDay='${d}';render()">${WD[dd.getDay()].slice(0,2)}<b>${dd.getDate()}</b><i>${n?'•'.repeat(Math.min(n,3)):''}</i></button>`}
  out+=`<button class="nav" onclick="UI.planWeek=addDays(UI.planWeek,7);render()">›</button></div>`;
  const day=UI.planDay;
  const list=items.filter(i=>occurs(i,day)).sort(byTime);
  out+=`<div class="card"><h2>${dayLabel(day)}${day!==t?` <span class="small">${longDate(day)}</span>`:''}<span class="sp"></span>${day!==t?`<button class="lnk" onclick="UI.planDay=today();UI.planWeek=weekStart(today());render()">Өнөөдөр</button>`:''}<button class="lnk" onclick="itemForm(null,{date:'${day}'})">+ нэмэх</button></h2>`;
  out+=list.length?list.map(i=>itemRow(i,day)).join(''):`<div class="empty">Энэ өдөр юу ч төлөвлөөгүй байна.</div>`;
  out+=`</div>`;
  const overdue=items.filter(i=>isOverdue(i));
  if(overdue.length)out+=`<div class="card"><h2>Хоцорсон</h2>${overdue.map(i=>itemRow(i,i.date,{showDate:true})).join('')}</div>`;
  const upcoming=items.filter(i=>!i.repeat&&!i.done&&i.date>addDays(UI.planWeek,6)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,10);
  if(upcoming.length)out+=`<div class="card"><h2>Цаашид</h2>${upcoming.map(i=>itemRow(i,i.date,{showDate:true})).join('')}</div>`;
  const undated=items.filter(i=>!i.date&&!i.done);
  out+=`<div class="card"><h2>Хугацаагүй ажил<span class="sp"></span><button class="lnk" onclick="itemForm(null,{})">+ нэмэх</button></h2>${undated.length?undated.map(i=>itemRow(i,t)).join(''):'<div class="empty">Алга.</div>'}</div>`;
  const rep=items.filter(i=>i.repeat);
  if(rep.length)out+=`<details class="card"><summary>Давтагддаг (${rep.length})</summary>${rep.map(i=>`<div class="row"><div class="main" onclick="itemForm('${i.id}')"><div class="ttl">${esc(i.title)}</div><div class="meta">${({day:'Өдөр бүр',week:'7 хоног бүр',month:'Сар бүр',year:'Жил бүр'})[i.repeat]} · ${dayLabel(i.date)}${i.time?' '+i.time:''}</div></div></div>`).join('')}</details>`;
  const done=items.filter(i=>!i.repeat&&i.done).sort((a,b)=>(b.doneAt||'').localeCompare(a.doneAt||''));
  if(done.length)out+=`<details class="card"><summary>Дууссан (${done.length})</summary>${done.slice(0,30).map(i=>itemRow(i,i.date||t,{showDate:true})).join('')}${done.length>5?`<div class="row-btns"><button class="btn sm danger" onclick="clearDone()">Дууссаныг цэвэрлэх</button></div>`:''}</details>`;
  return out;
}
function clearDone(){if(!confirm('Дууссан бүх ажлыг устгах уу?'))return;D.items=D.items.filter(i=>i.repeat||!i.done);save();render()}

/* ---------- Тэмдэглэл ---------- */
function vNotes(){
  const q=UI.noteQ.toLowerCase();
  const tags=[...new Set(D.notes.flatMap(n=>n.tags||[]))].sort();
  const list=D.notes.filter(n=>(!UI.noteTag||(n.tags||[]).includes(UI.noteTag))&&(!q||(n.title+' '+n.body+' '+(n.tags||[]).join(' ')).toLowerCase().includes(q)))
    .sort((a,b)=>(b.pinned-a.pinned)||(b.updated-a.updated));
  let out=`<div class="inline-add"><input id="noteQ" placeholder="🔍 Тэмдэглэл хайх" value="${esc(UI.noteQ)}" oninput="UI.noteQ=this.value;UI._focusQ=true;render()"><button class="btn" onclick="quickPhoto()" aria-label="Зураг авах">📷</button><button class="btn primary" onclick="noteForm(null)">＋</button></div>`;
  if(tags.length)out+=`<div class="seg"><button class="${!UI.noteTag?'on':''}" onclick="UI.noteTag='';UI._focusQ=false;render()">Бүгд</button>${tags.map(t=>`<button class="${UI.noteTag===t?'on':''}" onclick="UI.noteTag='${esc(t).replace(/'/g,'')}';UI._focusQ=false;render()">#${esc(t)}</button>`).join('')}</div>`;
  out+=list.length?`<div class="notes">${list.map(n=>`<div class="note" onclick="noteForm('${n.id}')">${(n.photos||[]).length?`<div class="nthumbs">${n.photos.slice(0,3).map(p=>`<span class="ph"><img data-img="${p.id}" alt=""></span>`).join('')}${n.photos.length>3?`<span class="more">+${n.photos.length-3}</span>`:''}</div>`:''}<h3>${n.pinned?'📌 ':''}${esc(n.title||'Гарчиггүй')}</h3><p>${esc(n.body)}</p><div class="tags">${(n.tags||[]).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}<span class="small">${dayLabel(ymd(new Date(n.updated)))}</span></div></div>`).join('')}</div>`
    :`<div class="card empty">${D.notes.length?'Олдсонгүй.':'Тэмдэглэл алга. ＋ дарж эхлээрэй. Хурдан нэмэхэд <b>тэмдэглэл: …</b> гэж бичиж болно.'}</div>`;
  return out;
}

/* ---------- Санхүү ---------- */
// Санхүүгийн ангиллын дүрс, өнгө
const CAT_SVG={
  'Унаа':'<path class="f" d="M4 16.5V12l2-5h12l2 5v4.5z"/><path d="M4 16.5v2h2.5v-2M17.5 16.5v2H20v-2M9.5 4h5v3h-5"/><circle cx="7.8" cy="13.3" r="1"/><circle cx="16.2" cy="13.3" r="1"/>',
  'Хоол':'<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path class="f" d="M17 21V3c-2.2 1.2-3.2 4-3.2 7.5H17"/>',
  'Хүнс':'<path class="f" d="M3.5 10h17l-1.9 9.3a1.5 1.5 0 0 1-1.5 1.2H6.9a1.5 1.5 0 0 1-1.5-1.2z"/><path d="M8 10l3-6M16 10l-3-6M9 13.5v4M12 13.5v4M15 13.5v4"/>',
  'Машин':'<path class="f" d="M5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 14 5v15.5z"/><path d="M3.5 20.5h12M7.5 8h4M14 10.5h2l2 2V18a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
  'Зугаа':'<path class="f" d="M4.5 5h12l-6 8z"/><path d="M10.5 13v7.5M7 20.5h7"/><circle cx="17.5" cy="5.5" r="2.5"/>',
  'Төлбөр':'<path d="M3.5 11 12 4l8.5 7"/><path class="f" d="M5.5 9.5V20.5h13V9.5"/><path d="M10 20.5v-5h4v5"/>',
  'Гэр бүл':'<circle class="f" cx="9" cy="8" r="3"/><circle cx="17" cy="9.5" r="2.3"/><path d="M3 20c0-3.4 2.7-5.5 6-5.5s6 2.1 6 5.5M15.5 14.6c3 0 5.5 1.6 5.5 4.9"/>',
  'Спорт':'<path d="M6.5 7.5v9M17.5 7.5v9M3.5 10v4M20.5 10v4M6.5 12h11"/><rect class="f" x="5" y="7.5" width="3" height="9" rx="1"/><rect class="f" x="16" y="7.5" width="3" height="9" rx="1"/>',
  'Хувцас':'<path class="f" d="M8.5 3.5 3.5 6.5l2 4 2-1v11h9v-11l2 1 2-4-5-3a3.5 3.5 0 0 1-7 0z"/>',
  'Бэлэг':'<rect class="f" x="4" y="9" width="16" height="11.5" rx="1.5"/><path d="M3 9h18M12 9v11.5M12 9c-.8-2.8-2.3-4.8-4.3-4.8a2 2 0 0 0 0 4c2 0 4.3.8 4.3.8zm0 0c.8-2.8 2.3-4.8 4.3-4.8a2 2 0 0 1 0 4c-2 0-4.3.8-4.3.8z"/>',
  'Ариун цэвэр':'<path class="f" d="M8.5 9.5h7v10.5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1z"/><path d="M10 9.5V7h4v2.5M12 7V3.5h3.5"/>',
  'Эрүүл мэнд':'<rect class="f" x="2.8" y="8.8" width="18.4" height="6.4" rx="3.2" transform="rotate(-40 12 12)"/><path d="M9.6 9.2l4.8 5.6"/>',
  'Утас':'<path class="f" d="M7 3.5h10A1.5 1.5 0 0 1 18.5 5v14a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M10.5 17.5h3"/>',
  'Бусад':'<rect class="f" x="4" y="4" width="16" height="16" rx="4"/><circle cx="8.5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="15.5" cy="12" r="1"/>',
  'Цалин':'<rect class="f" x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 15h2"/>',
  'Бонус':'<path class="f" d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  'Нэмэлт орлого':'<circle class="f" cx="12" cy="12" r="8.5"/><path d="M8 12h8M12 8v8"/>',
  'Бусад орлого':'<circle class="f" cx="12" cy="12" r="8.5"/><path d="M14.5 9a2.5 2 0 0 0-2.5-1.5c-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2a2.5 2 0 0 1-2.5-1.5M12 6v1.5M12 16.5V18"/>'};
const CAT_COLOR={'Унаа':'#cf9a3a','Хоол':'#7fa88f','Хүнс':'#c97a92','Машин':'#6f8fb3','Зугаа':'#d58c4f','Төлбөр':'#6f9fd2','Гэр бүл':'#c48aa8',
  'Спорт':'#5fa592','Хувцас':'#9a80c6','Бэлэг':'#b39484','Ариун цэвэр':'#5f9db3','Эрүүл мэнд':'#c96b6b','Утас':'#a08cc0','Бусад':'#8d928d',
  'Цалин':'#5f9e6e','Бонус':'#c9a24a','Нэмэлт орлого':'#6aa892','Бусад орлого':'#7f9a8a'};
const catColor=c=>CAT_COLOR[c]||'#8d928d';
const normCat=c=>CAT_SVG[c]?c:'Бусад';
const catSvg=c=>`<svg viewBox="0 0 24 24" class="cico">${CAT_SVG[normCat(c)]}</svg>`;
const shortMoney=n=>n>=1e6?(Math.round(n/1e5)/10)+'сая':n>=1000?Math.round(n/1000)+'к':String(Math.round(n));
const MON_MN=['1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар','7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'];
function vMoney(){
  const mo=UI.month||ym(today());const [y,m]=mo.split('-').map(Number);
  const shift=k=>{const d=new Date(y,m-1+k,1);return d.getFullYear()+'-'+pad(d.getMonth()+1)};
  if(UI.sec==='bills')return billsCard(mo);
  const tx=D.tx.filter(x=>ym(x.date)===mo);
  const inc=tx.filter(x=>x.type==='in').reduce((a,x)=>a+x.amount,0);
  const out_=tx.filter(x=>x.type==='out').reduce((a,x)=>a+x.amount,0);
  const byCat={};tx.filter(x=>x.type==='out').forEach(x=>{const c=normCat(x.cat);byCat[c]=(byCat[c]||0)+x.amount});
  // Дугуй диаграм
  const R=40,C=2*Math.PI*R;let off=0;
  const segs=EXP_CATS.map(c=>c[0]).filter(c=>byCat[c]).map(c=>{const len=C*byCat[c]/out_;
    const s=`<circle r="${R}" cx="50" cy="50" fill="none" stroke="${catColor(c)}" stroke-width="15" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"/>`;off+=len;return s}).join('');
  const cats=EXP_CATS.map(c=>c[0]);
  const pos=[[1,1],[1,2],[1,3],[1,4],[2,1],[3,1],[4,1],[2,4],[3,4],[4,4],[5,1],[5,2],[5,3],[5,4]];
  let out=`<div class="mnav"><button class="lnk" onclick="UI.month='${shift(-1)}';render()">‹ ${MON_MN[+shift(-1).slice(5)-1]}</button><b>${y} оны ${m} сар</b><button class="lnk" onclick="UI.month='${shift(1)}';render()">${MON_MN[+shift(1).slice(5)-1]} ›</button></div>`;
  out+=`<div class="mring">${cats.map((c,i)=>`<button class="mcat" style="grid-row:${pos[i][0]};grid-column:${pos[i][1]};color:${catColor(c)}" onclick="quickTx('out','${c}')"><svg viewBox="0 0 24 24">${CAT_SVG[c]}</svg><small>${c}</small>${byCat[c]?`<b>${shortMoney(byCat[c])}</b>`:''}</button>`).join('')}
    <div class="mdonut"><svg viewBox="0 0 100 100"><circle r="${R}" cx="50" cy="50" fill="none" stroke="var(--line)" stroke-width="15"/><g transform="rotate(-90 50 50)">${segs}</g></svg>
      <div class="mc"><span class="in">${money(inc)}</span><span class="out">${money(out_)}</span></div></div></div>`;
  out+=`<button class="mbal" onclick="document.getElementById('mlist').scrollIntoView({behavior:'smooth'})">Үлдэгдэл ${money(inc-out_)}</button>
    <div class="mbtns"><button class="mbig out" onclick="quickTx('out')" aria-label="Зарлага нэмэх">−</button><button class="mbig in" onclick="quickTx('in')" aria-label="Орлого нэмэх">+</button></div>`;
  // Зарцуулалтын тайлан
  const prev={};D.tx.filter(x=>x.type==='out'&&ym(x.date)===shift(-1)).forEach(x=>{const c=normCat(x.cat);prev[c]=(prev[c]||0)+x.amount});
  const prevTot=Object.values(prev).reduce((a,b)=>a+b,0);
  const rows=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const days=mo===ym(today())?now().getDate():new Date(y,m,0).getDate();
  out+=`<div class="card"><h2>Зарцуулалтын тайлан<span class="sp"></span><button class="lnk" onclick="budgetForm()">${D.budget?'Төсөв '+shortMoney(D.budget):'+ Төсөв'}</button></h2>`;
  if(D.budget){const p=Math.min(100,Math.round(100*out_/D.budget));out+=`<div class="small">Сарын төсвийн ${Math.round(100*out_/D.budget)}% зарцуулсан · үлдсэн ${money(D.budget-out_)}</div><div class="bar ${out_>D.budget?'over':''}" style="margin-bottom:10px"><span style="width:${p}%"></span></div>`}
  out+=rows.length?`<div class="small" style="margin-bottom:6px">Өдрийн дундаж ${money(out_/days)}${prevTot?` · өмнөх сараас ${out_>=prevTot?'▲ '+Math.round(100*(out_-prevTot)/prevTot):'▼ '+Math.round(100*(prevTot-out_)/prevTot)}%`:''}</div>`+
    rows.map(([c,v])=>{const p=Math.round(100*v/out_);const pv=prev[c]||0;const ch=pv?Math.round(100*(v-pv)/pv):null;
      return `<div class="rrow"><span class="ri" style="color:${catColor(c)}">${catSvg(c)}</span><div class="rm"><div class="rt"><span>${c}</span><span class="amt">${money(v)}</span></div>
        <div class="bar"><span style="width:${p}%;background:${catColor(c)}"></span></div><div class="meta">${p}%${ch!==null?` · өмнөх сар ${money(pv)} (${ch>0?'▲ '+ch:'▼ '+(-ch)}%)`:''}</div></div></div>`}).join('')
    :'<div class="empty">Энэ сард зарлага алга. Дээрх дүрс дээр дарж бичээрэй.</div>';
  if(D.bills.length){const due=billsDue(3).length;out+=`<div class="row-btns"><button class="lnk" onclick="UI.sec='bills';UI.back='money';UI.subTitle='Тогтмол төлбөр';render()">Тогтмол төлбөр (${D.bills.length})${due?' · '+due+' ойртсон':''} →</button></div>`}
  out+=`</div>`;
  // Гүйлгээ
  const groups={};tx.slice().sort((a,b)=>b.date.localeCompare(a.date)||(b.created||0)-(a.created||0)).forEach(x=>(groups[x.date]=groups[x.date]||[]).push(x));
  out+=`<div class="card" id="mlist"><h2>Гүйлгээ</h2>`;
  out+=Object.keys(groups).length?Object.entries(groups).map(([d,arr])=>`<div class="small" style="margin:10px 0 2px">${dayLabel(d)}</div>`+arr.map(x=>`<div class="row" onclick="txForm('${x.id}')" style="cursor:pointer"><span class="ri" style="color:${catColor(x.cat)}">${catSvg(x.cat)}</span><div class="main"><div class="ttl">${esc(x.note||x.cat)}</div><div class="meta">${esc(x.cat)}</div></div><span class="amt ${x.type}">${x.type==='in'?'+':'−'}${money(x.amount)}</span></div>`).join('')).join('')
    :`<div class="empty">Энэ сард гүйлгээ алга.</div>`;
  return out+`</div>`;
}
// Тоон товчлууртай хурдан бичилт
let KP=null;
function quickTx(type,cat){
  KP={type,cat:cat||(type==='in'?'Цалин':''),amt:''};
  const cats=type==='in'?INC_CATS:EXP_CATS.map(c=>c[0]);
  openSheet(`<div class="kp-top"><span class="kp-type ${type}">${type==='in'?'Орлого':'Зарлага'}</span><input type="date" id="kpDate" value="${today()}"></div>
    <div class="kp-cats">${cats.map(c=>`<button class="kp-cat" data-c="${c}" style="color:${catColor(c)}" onclick="KP.cat='${c}';kpUpd()"><svg viewBox="0 0 24 24">${CAT_SVG[c]}</svg><span>${c}</span></button>`).join('')}</div>
    <div class="kp-amt ${type}" id="kpAmt">0₮</div>
    <input id="kpNote" placeholder="Тайлбар (заавал биш)" onkeydown="if(event.key==='Enter')kpSave()">
    <div class="kp-keys">${['1','2','3','4','5','6','7','8','9','000','0','⌫'].map(k=>`<button onclick="kpKey('${k}')">${k}</button>`).join('')}</div>
    <button class="btn primary kp-save" onclick="kpSave()">Хадгалах</button>`);
  kpUpd();
  const sel=$('.kp-cat.on');if(sel)sel.scrollIntoView({inline:'center',block:'nearest'});
}
function kpUpd(){if(!KP)return;$('#kpAmt').textContent=money(+KP.amt||0);document.querySelectorAll('.kp-cat').forEach(b=>b.classList.toggle('on',b.dataset.c===KP.cat))}
function kpKey(k){if(!KP)return;if(k==='⌫')KP.amt=KP.amt.slice(0,-1);else if(KP.amt.length<12)KP.amt=(KP.amt+k).replace(/^0+/,'');kpUpd()}
function kpSave(){
  if(!KP)return;const a=+KP.amt||0;if(a<=0){toast('Дүнгээ оруулна уу');return}if(!KP.cat){toast('Ангилал сонгоно уу');return}
  D.tx.push({id:uid(),type:KP.type,amount:a,cat:KP.cat,note:$('#kpNote').value.trim(),date:$('#kpDate').value||today(),created:Date.now()});
  const t=KP.type;KP=null;save();closeSheet();render();toast((t==='in'?'+':'−')+money(a)+' бичигдлээ');
}
document.addEventListener('keydown',e=>{if(!KP||$('#sheet').classList.contains('hidden')||(document.activeElement&&/INPUT|TEXTAREA/.test(document.activeElement.tagName)))return;
  if(/^[0-9]$/.test(e.key))kpKey(e.key);else if(e.key==='Backspace')kpKey('⌫');else if(e.key==='Enter')kpSave()});
function billsCard(mo){
  let out=`<div class="card"><h2>Тогтмол төлбөр<span class="sp"></span><button class="lnk" onclick="billForm(null)">+ нэмэх</button></h2>`;
  out+=D.bills.length?D.bills.slice().sort((a,b)=>a.day-b.day).map(b=>{const paid=(b.paid||[]).includes(mo);
    return `<div class="row ${paid?'done':''}"><input type="checkbox" class="cb" ${paid?'checked':''} onchange="payBill('${b.id}','${mo}')"><div class="main" onclick="billForm('${b.id}')"><div class="ttl">${esc(b.name)}</div><div class="meta">Сар бүрийн ${b.day}-нд</div></div><span class="amt">${money(b.amount)}</span></div>`}).join('')
    :`<div class="empty">Түрээс, интернет, зээл гэх мэт сар бүр төлдөг зүйлсээ нэмбэл хугацаа нь ойртоход сануулна.</div>`;
  return out+`</div>`;
}
function billsDue(within){
  const t=today();const n=now();const mo=ym(t);
  return D.bills.filter(b=>!(b.paid||[]).includes(mo)).map(b=>{const last=new Date(n.getFullYear(),n.getMonth()+1,0).getDate();const dd=ymd(new Date(n.getFullYear(),n.getMonth(),Math.min(b.day,last)));return Object.assign({},b,{days:diffDays(t,dd)})}).filter(b=>b.days<=within).sort((a,b)=>a.days-b.days);
}
function payBill(id,mo){
  mo=mo||ym(today());const b=D.bills.find(x=>x.id===id);if(!b)return;b.paid=b.paid||[];
  const k=b.paid.indexOf(mo);
  if(k>=0){b.paid.splice(k,1);D.tx=D.tx.filter(x=>x.billId!==b.id+mo)}
  else{b.paid.push(mo);
    const d=mo===ym(today())?today():mo+'-'+pad(Math.min(b.day,28));
    D.tx.push({id:uid(),type:'out',amount:b.amount,cat:b.cat||'Төлбөр',note:b.name,date:d,billId:b.id+mo,created:Date.now()});toast('Төлсөн гэж тэмдэглээд зарлагад нэмлээ')}
  save();render();
}

/* ---------- Эрүүл мэнд & Ахуй ---------- */
const MEAS={weight:{l:'Жин',u:'кг',i:'⚖️'},bp:{l:'Даралт',u:'',i:'🩺'},sugar:{l:'Сахар',u:'ммоль/л',i:'🩸'},sleep:{l:'Нойр',u:'цаг',i:'😴'},pulse:{l:'Зүрхний цохилт',u:'/мин',i:'❤️'},steps:{l:'Алхалт',u:'алхам',i:'🚶'}};
function vLife(){
  let out='';const S=s=>!UI.sec||UI.sec===s;
  if(UI.life==='health'){
    const t=today();const ap=D.items.filter(i=>i.appt);
    const up=ap.filter(i=>!i.done&&i.date>=t).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    const pastA=ap.filter(i=>i.done||i.date<t).sort((a,b)=>b.date.localeCompare(a.date));
    if(!UI.sec)out+=healthRing();
    if(S('appt')){
    out+=`<div class="card"><h2>Эмчийн цаг, шинжилгээ<span class="sp"></span><button class="lnk" onclick="apptForm(null)">+ нэмэх</button></h2>`;
    out+=up.length?up.map(i=>{const d=diffDays(t,i.date);const R=x=>x==null||x===''?'':x==='eve'?'өмнөх орой':x>=1440?'1 өдөр өмнө':x>=60?(x/60)+' цаг өмнө':x>0?x+' мин өмнө':'цагт нь';
      const rem=[R(i.remind),R(i.remind2)].filter(Boolean);
      return `<div class="row"><span style="font-size:1.3rem">${(APPT[i.appt]||APPT.other).i}</span><div class="main" onclick="apptForm('${i.id}')"><div class="ttl">${esc(i.title)}</div>
        <div class="meta">${dayLabel(i.date)}${i.time?' '+i.time:''}${i.place?' · '+esc(i.place):''}${d>=2?` · <span class="tag">${d} хоног үлдсэн</span>`:''}</div>
        ${i.prep?`<div class="meta">Бэлтгэл: ${esc(i.prep)}</div>`:''}<div class="meta">${rem.length&&i.time?'🔔 '+rem.join(', '):'🔕 сануулгагүй'}</div></div>
        <input type="checkbox" class="cb" onchange="toggleItem('${i.id}','${i.date}')" aria-label="Очсон"></div>`}).join('')
      :`<div class="empty">Эмчид үзүүлэх, шинжилгээ өгөх, эмнэлэгт очих цагаа нэмбэл өмнөх өдөр болон цаг болохоос өмнө сануулна. Хурдан нэмэхэд “12/05 10-д дотрын эмчид үзүүлэх” гэж бичиж болно.</div>`;
    if(pastA.length)out+=`<details><summary>Өмнөх үзлэгүүд (${pastA.length})</summary>${pastA.slice(0,30).map(i=>`<div class="row" style="cursor:pointer" onclick="apptForm('${i.id}')"><span>${(APPT[i.appt]||APPT.other).i}</span><div class="main"><div class="ttl">${esc(i.title)}</div><div class="meta">${dayLabel(i.date)}${i.place?' · '+esc(i.place):''}</div>${i.result?`<div class="meta">📄 ${esc(i.result.slice(0,80))}</div>`:'<div class="meta">+ үр дүн бичих</div>'}</div></div>`).join('')}</details>`;
    out+=`</div>`;}
    if(!UI.sec)out+=healthReport();
    if(UI.sec==='meds'){
    out+=`<div class="card"><h2>Эм<span class="sp"></span><button class="lnk" onclick="medForm(null)">+ нэмэх</button></h2>`;
    out+=D.meds.length?D.meds.map(m=>`<div class="row"><div class="main" onclick="medForm('${m.id}')"><div class="ttl">${esc(m.name)}${m.dose?` <span class="small">${esc(m.dose)}</span>`:''}</div><div class="meta">⏰ ${(m.times||[]).length} удаа: ${(m.times||[]).join(', ')||'цаггүй'}</div><div class="meta"><b>${medTodayTxt(m,today())||'Өнөөдөр уухгүй'}</b> · ${medCourse(m,today())||'тогтмол'}</div><div class="meta">${medStreak(m)} өдөр бүрэн${medRep(m)?' · 🔔 '+medRep(m)+' мин тутам':''}</div></div></div>`).join('')
      :`<div class="empty">Тогтмол уудаг эмээ нэмбэл цагт нь сануулж, өнөөдрийн хуудсанд гарна.</div>`;
    out+=`</div>`;}
    if(UI.sec==='water')out+=waterCard();
    if(UI.sec==='meas'){
    out+=`<div class="card"><h2>Хэмжилт<span class="sp"></span><button class="lnk" onclick="measForm(null)">+ нэмэх</button></h2><div class="stats" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">`;
    out+=Object.entries(MEAS).map(([k,v])=>{const last=D.health.filter(h=>h.type===k).sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created)[0];
      return `<button class="stat" style="border:0;text-align:left" onclick="measForm(null,'${k}')"><small>${v.i} ${v.l}</small><b>${last?measVal(last):'—'}</b>${last?`<small>${dayLabel(last.date)}</small>`:'<small>+ нэмэх</small>'}</button>`}).join('');
    out+=`</div>`;
    const hist=D.health.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created).slice(0,15);
    if(hist.length)out+=`<details><summary>Түүх (${D.health.length})</summary>${hist.map(h=>`<div class="row" onclick="measForm('${h.id}')" style="cursor:pointer"><span>${MEAS[h.type].i}</span><div class="main"><div class="ttl">${MEAS[h.type].l}: ${measVal(h)}</div><div class="meta">${dayLabel(h.date)}${h.note?' · '+esc(h.note):''}</div></div></div>`).join('')}</details>`;
    out+=`</div>`;}
  } else if(UI.life==='habits'){
    const t=today();const days=[...Array(7)].map((_,k)=>addDays(t,k-6));
    out+=`<div class="card"><h2>Зуршил<span class="sp"></span><button class="lnk" onclick="habitForm(null)">+ нэмэх</button></h2>`;
    out+=D.habits.length?D.habits.map(h=>`<div class="row"><input type="checkbox" class="cb" ${(D.habitLog[t]||{})[h.id]?'checked':''} onchange="toggleHabit('${h.id}')"><div class="main" onclick="habitForm('${h.id}')"><div class="ttl">${esc(h.icon||'')} ${esc(h.name)}</div><div class="meta">🔥 ${streak(h.id)} өдөр</div></div><div class="hgrid">${days.map(d=>`<span class="${(D.habitLog[d]||{})[h.id]?'on':''}">${WD[parseD(d).getDay()].slice(0,1)}</span>`).join('')}</div></div>`).join('')
      :`<div class="empty">Жишээ: 📖 Ном унших, 🏃 Дасгал, 🚭 Тамхигүй өдөр, 🧘 Бясалгал.</div>`;
    out+=`</div>`;
  } else {
    if(S('shop'))out+=`<div class="card"><h2>Худалдан авах<span class="sp"></span>${D.shopping.some(x=>x.done)?`<button class="lnk" onclick="D.shopping=D.shopping.filter(x=>!x.done);save();render()">Авсныг цэвэрлэх</button>`:''}</h2>
      <div class="inline-add"><input id="shopIn" placeholder="Талх, сүү, өндөг…" onkeydown="if(event.key==='Enter')addShop()"><button class="btn primary" onclick="addShop()">＋</button></div>
      ${D.shopping.map(x=>`<div class="row ${x.done?'done':''}"><input type="checkbox" class="cb" ${x.done?'checked':''} onchange="toggleShop('${x.id}')"><div class="main"><div class="ttl">${esc(x.text)}</div></div><button class="btn sm ghost" onclick="D.shopping=D.shopping.filter(s=>s.id!=='${x.id}');save();render()" aria-label="Устгах">✕</button></div>`).join('')||'<div class="empty">Жагсаалт хоосон.</div>'}</div>`;
    if(S('chores')){
    out+=`<div class="card"><h2>Гэрийн ажил (давтагддаг)<span class="sp"></span><button class="lnk" onclick="choreForm(null)">+ нэмэх</button></h2>`;
    out+=D.chores.length?D.chores.slice().sort((a,b)=>choreDays(a)-choreDays(b)).map(c=>`<div class="row"><div class="main" onclick="choreForm('${c.id}')"><div class="ttl">${esc(c.name)}</div><div class="meta">${c.every} хоног тутам · ${choreLabel(c)}</div></div><button class="btn sm" onclick="doChore('${c.id}')">Хийсэн</button></div>`).join('')
      :`<div class="empty">Жишээ: ус шүүгчийн шүүлтүүр солих (90 хоног), цагаан хэрэглэл угаах (7 хоног), машины тос солих.</div>`;
    out+=`</div>`;}
  }
  return out;
}
function waterCard(){
  const t=today();const n=D.water[t]||0;const g=D.settings.waterGoal||8;
  return `<div class="card"><h2>Ус<span class="sp"></span><span class="tag ${n>=g?'ok':''}">${n}/${g} аяга</span></h2><div class="water">${[...Array(g)].map((_,k)=>`<button class="${k<n?'on':''}" onclick="setWater(${k<n&&k===n-1?k:k+1})" aria-label="${k+1} аяга">🥛</button>`).join('')}</div></div>`;
}
function setWater(n){D.water[today()]=n;save();render()}
/* ---------- Эрүүл мэндийн тойрог ---------- */
const H_SVG={
  doctor:'<path d="M6 3.5v5a4 4 0 0 0 8 0v-5"/><path d="M10 12.5v2.5a5 5 0 0 0 10 0v-2"/><circle class="f" cx="20" cy="11" r="2"/>',
  lab:'<path class="f" d="M10 3.5v13.5a2 2 0 0 0 4 0V3.5z"/><path d="M8.5 3.5h7M10 11h4"/>',
  meds:'<rect class="f" x="2.8" y="8.8" width="18.4" height="6.4" rx="3.2" transform="rotate(-40 12 12)"/><path d="M9.6 9.2l4.8 5.6"/>',
  water:'<path class="f" d="M6 4h12l-1.6 15.2a1.5 1.5 0 0 1-1.5 1.3H9.1a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M6.6 9.5h10.8"/>',
  weight:'<rect class="f" x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 9.5a5 5 0 0 1 7 0L12 12.5z"/>',
  bp:'<circle class="f" cx="12" cy="13" r="7.5"/><path d="M12 13l3-3M8 9.6l.7.7M16 9.6l-.7.7M12 6.5v1"/>',
  sugar:'<path class="f" d="M12 3.5s6 6.4 6 10.9a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z"/><path d="M9.5 14.5A2.5 2.5 0 0 0 12 17"/>',
  sleep:'<path class="f" d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  pulse:'<path class="f" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8 11.5h2l1-2 2 4 1-2h2"/>',
  steps:'<path class="f" d="M7 4c2 0 3 2 3 4.5S9 13 7.5 13 5 11 5 8.5 5 4 7 4z"/><path class="f" d="M16.5 9c2 0 2.5 2.5 2.5 4.5S18 18 16.5 18 14 16 14 13.5 14.5 9 16.5 9z"/><path d="M6 15.5h3M15 20.5h3"/>',
  dental:'<path class="f" d="M7.5 4c1.5 0 2.5.8 4.5.8S15 4 16.5 4C19 4 20 6 20 8.5c0 3-1.5 4.5-2 7.5-.4 2.5-1 4.5-2.2 4.5-1.6 0-1.6-5-3.8-5s-2.2 5-3.8 5C7 20.5 6.4 18.5 6 16c-.5-3-2-4.5-2-7.5C4 6 5 4 7.5 4z"/>',
  vaccine:'<path d="M18 3l3 3M19.5 4.5l-3 3"/><path class="f" d="M16.5 7.5l-9 9-2-2 9-9z"/><path d="M5.5 14.5l-2 2M7.5 16.5 4 20M10 9l1.5 1.5M12.5 6.5 14 8"/>',
  hospital:'<path class="f" d="M4 20.5V8l8-4.5L20 8v12.5z"/><path d="M12 9v6M9 12h6M3 20.5h18"/>',
  other:'<rect class="f" x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5v-1h6v1M8.5 10h7M8.5 14h5"/>'};
const H_COLOR={doctor:'#6f9fd2',lab:'#9a80c6',meds:'#c96b6b',water:'#5f9db3',weight:'#6aa892',bp:'#c97a92',sugar:'#cf9a3a',
  sleep:'#7d86c4',pulse:'#d0706a',steps:'#7fa88f',dental:'#5f9db3',vaccine:'#b39484',hospital:'#6f8fb3',other:'#8d928d'};
function lastMeas(k){return D.health.filter(h=>h.type===k).sort((a,b)=>b.date.localeCompare(a.date)||(b.created||0)-(a.created||0))}
function nextAppt(k){const t=today();const i=D.items.filter(x=>x.appt===k&&!x.done&&x.date>=t).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];return i?dayLabel(i.date).replace(/ .*/,''):''}
function medToday(){const t=today(),log=D.medLog[t]||{};let tot=0,tk=0;medDoses(t).forEach(({m,x})=>{tot++;if(log[m.id+'@'+x])tk++});return {tot,tk}}
function healthRing(){
  const t=today();const md=medToday();const w=D.water[t]||0,g=D.settings.waterGoal||8;
  const mv=k=>{const h=lastMeas(k)[0];return h?(k==='bp'?h.value+'/'+(h.value2||'?'):fmtH(h.value)+(k==='weight'?'кг':k==='sleep'?'ц':'')):''};
  const I=[
    ['doctor','Эмчид үзүүлэх',"apptForm(null,{appt:'doctor'})",nextAppt('doctor')],['lab','Шинжилгээ',"apptForm(null,{appt:'lab',remind:'eve'})",nextAppt('lab')],
    ['meds','Эм','medsSheet()',md.tot?md.tk+'/'+md.tot:''],['water','Ус +1','addWater()',w+'/'+g],
    ['weight','Жин',"measForm(null,'weight')",mv('weight')],['bp','Даралт',"measForm(null,'bp')",mv('bp')],['sugar','Сахар',"measForm(null,'sugar')",mv('sugar')],
    ['sleep','Нойр',"measForm(null,'sleep')",mv('sleep')],['pulse','Зүрх',"measForm(null,'pulse')",mv('pulse')],['steps','Алхалт',"measForm(null,'steps')",mv('steps')],
    ['dental','Шүдний эмч',"apptForm(null,{appt:'dental'})",nextAppt('dental')],['vaccine','Вакцин',"apptForm(null,{appt:'vaccine'})",nextAppt('vaccine')],
    ['hospital','Эмнэлэг',"apptForm(null,{appt:'hospital'})",nextAppt('hospital')],['other','Бусад цаг',"apptForm(null,{appt:'other'})",nextAppt('other')]];
  const pos=[[1,1],[1,2],[1,3],[1,4],[2,1],[3,1],[4,1],[2,4],[3,4],[4,4],[5,1],[5,2],[5,3],[5,4]];
  const arc=(r,frac,col,sw)=>{const C=2*Math.PI*r,len=C*Math.min(1,frac);return `<circle r="${r}" cx="50" cy="50" fill="none" stroke="var(--line)" stroke-width="${sw}"/>`+(len>0?`<circle r="${r}" cx="50" cy="50" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}"/>`:'')};
  return `<div class="mnav"><span></span><b>${longDate(t).replace(/^\d+ оны /,'')}</b><span></span></div>
    <div class="mring">${I.map(([k,l,fn,sub],i)=>`<button class="mcat" style="grid-row:${pos[i][0]};grid-column:${pos[i][1]};color:${H_COLOR[k]}" onclick="${fn}"><svg viewBox="0 0 24 24">${H_SVG[k]}</svg><small>${l}</small>${sub?`<b>${esc(sub)}</b>`:''}</button>`).join('')}
    <div class="mdonut"><svg viewBox="0 0 100 100"><g transform="rotate(-90 50 50)">${arc(40,md.tot?md.tk/md.tot:0,H_COLOR.meds,10)}${arc(27,w/g,H_COLOR.water,10)}</g></svg>
      <div class="mc"><span style="color:${H_COLOR.meds};font-weight:700">Эм ${md.tot?md.tk+'/'+md.tot:'—'}</span><span style="color:${H_COLOR.water};font-weight:700">Ус ${w}/${g}</span></div></div></div>`;
}
function addWater(){const t=today();D.water[t]=(D.water[t]||0)+1;save();render();const g=D.settings.waterGoal||8;toast('💧 '+D.water[t]+'/'+g+' аяга'+(D.water[t]===g?' — зорилгоо биелүүллээ!':''))}
function medsSheet(){
  const t=today(),log=D.medLog[t]||{};const doses=medDoses(t);
  openSheet(`<h3>Өнөөдрийн эм</h3>${doses.length?doses.map(({m,x})=>{const k=m.id+'@'+x;return `<div class="row ${log[k]?'st-ok':'st-no'}"><input type="checkbox" class="cb" ${log[k]?'checked':''} onchange="toggleMed('${k}');medsSheet()"><span class="tm">${x}</span><div class="main"><div class="ttl">${esc(m.name)}</div><div class="meta">${[esc(m.dose||''),medTodayTxt(m,t),medCourse(m,t)].filter(Boolean).join(' · ')}</div></div></div>`}).join(''):'<div class="empty">Өнөөдөр уух эм алга.</div>'}
    <div class="row-btns"><button class="btn sm ghost" onclick="closeSheet();UI.sec='meds';UI.back='health';UI.subTitle='Эм';render()">Эмийн жагсаалт</button><span class="sp"></span><button class="btn sm primary" onclick="medForm(null)">+ Эм нэмэх</button></div>`);
}
function spark(vals,col){
  if(vals.length<2)return '';const mn=Math.min(...vals),mx=Math.max(...vals),rg=mx-mn||1;
  const pts=vals.map((v,i)=>`${(i*100/(vals.length-1)).toFixed(1)},${(26-(v-mn)*22/rg).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="-2 0 104 30" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}
function healthReport(){
  const t=today();const days=[...Array(7)].map((_,k)=>addDays(t,-k));
  const first=Object.keys(D.medLog).filter(d=>Object.keys(D.medLog[d]||{}).length).sort()[0]||t; // бүртгэж эхэлсэн өдрөөс
  let sch=0,tk=0;days.filter(d=>d>=first).forEach(d=>{const log=D.medLog[d]||{};medDoses(d).forEach(({m,x})=>{sch++;if(log[m.id+'@'+x])tk++})});
  const wAvg=days.reduce((a,d)=>a+(D.water[d]||0),0)/7;
  const rows=Object.keys(MEAS).map(k=>{const L=lastMeas(k);if(!L.length)return '';const last=L[0],prev=L[1];
    const unit=MEAS[k].u;let ch='';if(prev){const dv=Math.round(((+last.value)-(+prev.value))*10)/10;ch=dv===0?'өөрчлөлтгүй':(dv>0?'▲ ':'▼ ')+Math.abs(dv)+(k==='bp'?'':' '+unit)}
    const vals=L.slice(0,10).reverse().map(h=>+h.value);
    return `<div class="rrow" style="cursor:pointer" onclick="measForm(null,'${k}')"><span class="ri" style="color:${H_COLOR[k]}"><svg viewBox="0 0 24 24" class="cico">${H_SVG[k]}</svg></span>
      <div class="rm"><div class="rt"><span>${MEAS[k].l}</span><span class="amt">${measVal(last)}</span></div>${spark(vals,H_COLOR[k])}<div class="meta">${dayLabel(last.date)}${ch?' · '+ch:''}${L.length>1?' · '+L.length+' хэмжилт':''}</div></div></div>`}).join('');
  return `<div class="card"><h2>Эрүүл мэндийн тайлан</h2>
    <div class="stats" style="margin-bottom:8px"><div class="stat"><small>Эм (7 хоног)</small><b>${sch?Math.round(100*tk/sch)+'%':'—'}</b></div>
    <div class="stat"><small>Ус (дундаж)</small><b>${fmtH(wAvg)} аяга</b></div><div class="stat"><small>Ирэх үзлэг</small><b>${(()=>{const i=D.items.filter(x=>x.appt&&!x.done&&x.date>=t).sort((a,b)=>a.date.localeCompare(b.date))[0];return i?dayLabel(i.date).replace(/ .*/,''):'—'})()}</b></div></div>
    ${rows||'<div class="empty">Дээрх дүрс дээр дарж жин, даралт, сахар зэргээ бичвэл энд өөрчлөлт, график нь гарна.</div>'}
    ${D.health.length?`<div class="row-btns"><span class="sp"></span><button class="lnk" onclick="UI.sec='meas';UI.back='health';UI.subTitle='Хэмжилт';render()">Бүх хэмжилт →</button></div>`:''}</div>`;
}
const measVal=h=>h.type==='bp'?`${h.value}/${h.value2||'?'}`:`${h.value} ${MEAS[h.type].u}`;
function toggleMed(k){const t=today();D.medLog[t]=D.medLog[t]||{};D.medLog[t][k]=!D.medLog[t][k];if(!D.medLog[t][k])delete D.medLog[t][k];save();render()}
function medStreak(m){let n=0,d=today();const full=day=>medOn(m,day)&&(m.times||[]).every(tm=>(D.medLog[day]||{})[m.id+'@'+tm]);if(!full(d))d=addDays(d,-1);while(full(d)&&n<999){n++;d=addDays(d,-1)}return n}
function toggleHabit(id){const t=today();D.habitLog[t]=D.habitLog[t]||{};D.habitLog[t][id]=!D.habitLog[t][id];if(!D.habitLog[t][id])delete D.habitLog[t][id];save();render()}
function streak(id){let n=0,d=today();if(!(D.habitLog[d]||{})[id])d=addDays(d,-1);while((D.habitLog[d]||{})[id]&&n<9999){n++;d=addDays(d,-1)}return n}
function addShop(){const el=$('#shopIn');const v=el.value.trim();if(!v)return;v.split(/[,;]/).map(x=>x.trim()).filter(Boolean).forEach(x=>D.shopping.push({id:uid(),text:x,done:false}));save();render();setTimeout(()=>$('#shopIn')&&$('#shopIn').focus(),0)}
function toggleShop(id){const x=D.shopping.find(s=>s.id===id);if(x){x.done=!x.done;save();render()}}
const choreDays=c=>c.last?diffDays(today(),addDays(c.last,c.every)):0;
const choreLabel=c=>{const d=choreDays(c);return !c.last?'хараахан хийгээгүй':d<0?`<span class="tag bad">${-d} хоног хэтэрсэн</span>`:d===0?'<span class="tag warn">өнөөдөр</span>':`${d} хоногийн дараа`};
function doChore(id){const c=D.chores.find(x=>x.id===id);if(c){c.last=today();save();render();toast('👍 Тэмдэглэлээ')}}
