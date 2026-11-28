/* ===================== Ажил / уулзалт логик ===================== */
function occurs(i,day){
  if(!i.date||day<i.date)return false;
  switch(i.repeat){
    case 'day':return true;
    case 'week':return diffDays(i.date,day)%7===0;
    case 'month':return day.slice(8)===i.date.slice(8);
    case 'year':return day.slice(5)===i.date.slice(5);
    default:return day===i.date;
  }
}
const isDone=(i,day)=>i.repeat?(i.doneDates||[]).includes(day):!!i.done;
function toggleItem(id,day){
  const i=D.items.find(x=>x.id===id);if(!i)return;
  if(i.repeat){i.doneDates=i.doneDates||[];const k=i.doneDates.indexOf(day);k>=0?i.doneDates.splice(k,1):i.doneDates.push(day);
    i.doneDates=i.doneDates.filter(x=>x>=addDays(today(),-400))}
  else{i.done=!i.done;i.doneAt=i.done?today():null}
  save();render();
}
const byTime=(a,b)=>(a.time||'99').localeCompare(b.time||'99');
const isOverdue=i=>i.type!=='event'&&!i.repeat&&!i.done&&!!i.date&&i.date<today();
function itemRow(i,day,opts={}){
  const done=isDone(i,day);const c=CATS[i.cat]||CATS.huviin;
  const overdue=!done&&isOverdue(i);
  const meta=[`<span class="dot" style="background:${c.c}"></span>${c.l}`];
  if(opts.showDate&&i.date)meta.push(dayLabel(i.date));
  if(i.end)meta.push('дуусах '+i.end);
  if(i.appt){meta.push((APPT[i.appt]||APPT.other).l);if(i.place)meta.push(esc(i.place))}
  else if(i.type==='event')meta.push('уулзалт');
  if(i.repeat)meta.push('↻ давтагдана');
  if(overdue)meta.push('<span class="tag bad">хоцорсон</span>');
  if(i.note)meta.push('📎');
  const st=done?'st-ok':day<=today()?'st-no':'';
  return `<div class="row ${st}">
    <input type="checkbox" class="cb" ${done?'checked':''} onchange="toggleItem('${i.id}','${day}')" aria-label="Дууссан">
    ${i.time?`<span class="tm">${i.time}</span>`:''}
    <div class="main" onclick="itemForm('${i.id}')"><div class="ttl">${i.appt?(APPT[i.appt]||APPT.other).i+' ':''}${esc(i.title)}</div><div class="meta">${meta.join(' · ')}</div></div>
  </div>`;
}
/* ===================== Эм: давтамж, хэдэн хоног, давтан сануулга ===================== */
// m.days = хэдэн хоног уух (хоосон = тогтмол), m.start = эхэлсэн өдөр, m.rep = давтан сануулах минут (0 = давтахгүй)
const medOn=(m,day)=>!m.days||(day>=(m.start||day)&&diffDays(m.start||day,day)<m.days);
const medDayN=(m,day)=>diffDays(m.start||day,day)+1;
const medRep=m=>m.rep===undefined||m.rep===null?5:+m.rep;
function medDoses(day){const L=[];D.meds.forEach(m=>{if(medOn(m,day))(m.times||[]).forEach(x=>L.push({m,x}))});return L.sort((a,b)=>a.x.localeCompare(b.x))}
function medCourse(m,day){ // "7 хоног: 3-р өдөр" / "дууссан" / "эхлээгүй"
  if(!m.days)return '';const s=m.start||day;if(day<s)return 'эхлэх: '+dayLabel(s);const n=medDayN(m,day);
  return n>m.days?'дууссан':m.days+' хоногоос '+n+'-р өдөр'+(m.days-n?' ('+(m.days-n)+' үлдсэн)':' (сүүлийн)')}
// Өнөөдөр: "5 уухаас 2 уусан"
function medTodayTxt(m,day){if(!medOn(m,day))return '';const T=m.times||[],log=D.medLog[day]||{};const n=T.filter(x=>log[m.id+'@'+x]).length;
  return 'Өнөөдөр '+T.length+' уухаас '+n+' уусан'}
// Өдөрт n удаа → цагуудыг жигд хуваана (1: 08:00, 3: 08/14/20, 5: 07–21)
function medAutoTimes(n){if(n<=1)return ['08:00'];const a=n>=5?420:480,b=n>=5?1260:1200,st=(b-a)/(n-1);
  return [...Array(n)].map((_,i)=>{const v=Math.round((a+st*i)/15)*15;return pad(Math.floor(v/60))+':'+pad(v%60)})}

// Тухайн өдөр хийгдээгүй ажил (уулзалт, эмчийн цаг биш) — оройн 20:00-ийн сануулгад
const UNDONE_AT='20:00';
function undoneTasks(day){return D.items.filter(i=>i.type!=='event'&&!i.appt&&occurs(i,day)&&!isDone(i,day))}
function undoneBody(L){return L.length+' ажил үлдсэн: '+L.slice(0,3).map(i=>i.title).join(', ')+(L.length>3?'…':'')}
