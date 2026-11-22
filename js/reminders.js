/* ===================== Сануулга ===================== */
function notify(title,body){
  toast('🔔 '+title+(body?' — '+body:''));
  if(window.NativeApp&&NativeApp.isNative)return; // Android апп: системийн сануулга урьдчилан тавигдсан
  if(!D.settings.notify||!('Notification' in window)||Notification.permission!=='granted')return;
  const opt={body,icon:'icon-192.png',badge:'icon-192.png',tag:title+body};
  if(navigator.serviceWorker&&navigator.serviceWorker.controller)navigator.serviceWorker.ready.then(r=>r.showNotification(title,opt)).catch(()=>{try{new Notification(title,opt)}catch(e){}});
  else{try{new Notification(title,opt)}catch(e){}}
}
function checkReminders(){
  const n=now();const t=today();const tm=addDays(t,1);let changed=false;
  const fire=(key,title,body)=>{if(D.notified[key])return;D.notified[key]=t;changed=true;notify(title,body)};
  const W=10*60000; // 10 мин цонх
  D.items.forEach(i=>{if(!i.time)return;[t,tm].forEach(day=>{if(!occurs(i,day)||isDone(i,day))return;
    const [y,mo,d]=day.split('-').map(Number);const [h,mi]=i.time.split(':').map(Number);
    const start=new Date(y,mo-1,d,h,mi).getTime();
    const title=(i.appt?(APPT[i.appt]||APPT.other).i+' ':i.type==='event'?'📅 ':'✅ ')+i.title;
    const body=(day===t?'Өнөөдөр ':'Маргааш ')+i.time+(i.place?' · '+i.place:'')+(i.prep?' · '+i.prep:'');
    [i.remind,i.remind2].forEach((r,k)=>{if(r===undefined||r===null||r===''||+r<0)return;
      const at=r==='eve'?new Date(y,mo-1,d-1,20,0).getTime():start-(+r||0)*60000;
      // апп хаалттай байсан бол ч цаг нь болохоос өмнө нээхэд нэг удаа сануулна
      if(n>=at&&n<Math.max(start,at+W))fire('i'+i.id+day+'_'+k,title,body)})})});
  const mins=n.getHours()*60+n.getMinutes();
  D.meds.forEach(m=>(m.times||[]).forEach(x=>{const k=m.id+'@'+x;if((D.medLog[t]||{})[k])return;const d=mins-toMin(x);
    if(d>=0&&d<60)fire('m'+k+t,'💊 '+m.name,'Эм уух цаг '+x+(m.dose?' · '+m.dose:''))}));
  if(mins>=8*60&&mins<12*60){
    const tasks=D.items.filter(i=>!i.time&&occurs(i,t)&&!isDone(i,t)).length;
    const bills=billsDue(1).length;
    if(tasks||bills)fire('morning'+t,'☀️ Өнөөдөр',[tasks?tasks+' ажил':'',bills?bills+' төлбөр ойртсон':''].filter(Boolean).join(', '));
  }
  // Тайлан бичих сануулга (сүүлийн 2 долоо хоногт тайлан бичсэн бол)
  const rr=D.settings.reportRemind;if(rr&&repActive()&&mins>=toMin(rr)&&mins<toMin(rr)+240&&!repGet(t))fire('rep'+t,'📋 Тайлан','Өнөөдөр аль өрөөнд хэдэн хүн оруулснаа бичих үү?');
  // Сарын сүүлийн өдөр: илүү цагийн нэгтгэл
  if(addDays(t,1).slice(8)==='01'&&mins>=18*60&&mins<23*60){const s=otMonth(ym(t));if(s.L.length)fire('otm'+ym(t),'⏱ Энэ сарын илүү цаг',fmtH(s.tot)+' цаг · '+s.days+' өдөр'+(D.settings.otRate?' · '+money(s.tot*D.settings.otRate):''))}
  if(mins>=21*60&&mins<23*60&&!(D.journal[t]&&D.journal[t].mood))fire('j'+t,'✍️ Оройн 2 минут','Өнөөдөр ямар байв?');
  Object.keys(D.notified).forEach(k=>{if(D.notified[k]<addDays(t,-2)){delete D.notified[k];changed=true}});
  if(changed)save();
}
