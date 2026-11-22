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
  return `<div class="row ${done?'done':''}">
    <input type="checkbox" class="cb" ${done?'checked':''} onchange="toggleItem('${i.id}','${day}')" aria-label="Дууссан">
    ${i.time?`<span class="tm">${i.time}</span>`:''}
    <div class="main" onclick="itemForm('${i.id}')"><div class="ttl">${i.appt?(APPT[i.appt]||APPT.other).i+' ':''}${esc(i.title)}</div><div class="meta">${meta.join(' · ')}</div></div>
  </div>`;
}
