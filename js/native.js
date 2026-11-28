/* ===================== Android апп (Capacitor): апп хаалттай үед ч сануулах ===================== */
// Вэб дээр энэ хэсэг юу ч хийхгүй. APK дотор сануулгыг Android-ын системд 14 хоногоор урьдчилж тавина.
(function(){
  const C=window.Capacitor;const isNative=!!(C&&C.isNativePlatform&&C.isNativePlatform());
  window.NativeApp={isNative,resync(){}};
  if(!isNative)return;
  document.documentElement.classList.add('is-native');
  const plug=n=>C.registerPlugin?C.registerPlugin(n):C.Plugins[n];
  const LN=plug('LocalNotifications'),Share=plug('Share'),FS=plug('Filesystem'),App=plug('App'),FA=plug('FirebaseAuthentication');
  const CH='reminders',MED='MED_ACTIONS',DAYS=14,MAX=420,SNOOZE_BASE=900000,SNOOZE_MIN=15;
  let ready=false,timer=null,running=false,again=false;
  const dt=(day,hm)=>{const [y,m,d]=day.split('-').map(Number);const [h,mi]=hm.split(':').map(Number);return new Date(y,m-1,d,h,mi).getTime()};
  async function granted(){try{return (await LN.checkPermissions()).display==='granted'}catch(e){return false}}
  function resync(){clearTimeout(timer);timer=setTimeout(run,800)}
  async function run(){if(!ready)return;if(running){again=true;return}running=true;try{await schedule()}catch(e){console.warn('reminder sync',e)}running=false;if(again){again=false;resync()}}
  // Бүх сануулгын жагсаалтыг одоогийн мэдээллээс бүтээнэ
  function build(){
    const nowMs=Date.now()+5000,t=today(),L=[];const add=(at,title,body,extra,med)=>{if(at>nowMs)L.push({at,title,body,extra,med})};
    for(let k=0;k<DAYS;k++){
      const day=addDays(t,k);
      // Уулзалт, ажил, эмчийн цаг
      D.items.forEach(i=>{if(!i.time||!occurs(i,day)||isDone(i,day))return;const start=dt(day,i.time);
        const title=(i.appt?(APPT[i.appt]||APPT.other).i+' ':i.type==='event'?'📅 ':'✅ ')+i.title;
        const body=dayLabel(day)+' '+i.time+(i.place?' · '+i.place:'')+(i.prep?' · '+i.prep:'');
        [i.remind,i.remind2].forEach(r=>{if(r===undefined||r===null||r===''||+r<0)return;add(r==='eve'?dt(addDays(day,-1),'20:00'):start-(+r||0)*60000,title,body)})});
      // Эм: цагт нь, дараа нь "Уусан" дарах хүртэл 5/10 мин тутам 1 цагийн турш (сэрүүлэг шиг). Ойрын 3 өдөрт давтана.
      const log=D.medLog[day]||{},snz=lsGet('mu.medSnooze')||{};
      medDoses(day).forEach(({m,x})=>{const key=m.id+'@'+x;if(log[key])return;const at=dt(day,x),ex={key,date:day};const body=m.name+(m.dose?' — '+m.dose:'')+' ('+x+')';
        const until=snz[day+key]||0,rp=medRep(m);
        if(at>=until)add(at,'💊 Эм уух цаг боллоо',body,ex,true);
        if(until>at)add(until,'⏰ Эмээ уусан уу?',body,ex,true);
        if(rp&&k<3)for(let j=1;j*rp<=60;j++){const a=at+j*rp*60000;if(a>until)add(a,'⏰ Эмээ уусан уу?',body,ex,true)}});
      // Өглөөний тойм
      const tasks=D.items.filter(i=>!i.time&&occurs(i,day)&&!isDone(i,day)).length;
      if(tasks)add(dt(day,'08:00'),'☀️ Өнөөдөр',tasks+' ажил хийх төлөвлөгөөтэй');
      // Оройн 20:00: тухайн өдөр хийгдээгүй ажил (ажил дуусгах бүрт дахин тооцно)
      const und=undoneTasks(day);if(und.length)add(dt(day,UNDONE_AT),'📝 Хийгдээгүй ажил байна',undoneBody(und)+' — хийгээрэй',{go:'today'});
      // Оройн 2 минут
      if(!(D.journal[day]&&D.journal[day].mood))add(dt(day,'21:00'),'✍️ Оройн 2 минут','Өнөөдөр ямар байв? Дарж тэмдэглэл бичээрэй',{go:'journal'});
      // Тайлан
      const rr=D.settings.reportRemind;if(rr&&repActive()&&!repGet(day))add(dt(day,rr),'📋 Тайлан','Өнөөдөр аль өрөөнд хэдэн хүн оруулснаа бичих үү?');
      // Сарын сүүлийн өдөр: илүү цаг
      if(addDays(day,1).slice(8)==='01'){const s=otMonth(ym(day));if(s.L.length)add(dt(day,'18:00'),'⏱ Энэ сарын илүү цаг',fmtH(s.tot)+' цаг · '+s.days+' өдөр')}
    }
    // Тогтмол төлбөр (энэ ба ирэх сар)
    const n=now();[0,1].forEach(off=>{const base=new Date(n.getFullYear(),n.getMonth()+off,1);const mo=base.getFullYear()+'-'+pad(base.getMonth()+1);const last=new Date(base.getFullYear(),base.getMonth()+1,0).getDate();
      D.bills.forEach(b=>{if((b.paid||[]).includes(mo))return;const day=mo+'-'+pad(Math.min(b.day,last));add(dt(day,'09:00'),'🧾 Төлбөр: '+b.name,money(b.amount)+' — өнөөдөр төлөх')})});
    return L.sort((a,b)=>a.at-b.at).slice(0,MAX);
  }
  async function schedule(){
    if(!(await granted()))return;
    const pending=(await LN.getPending()).notifications||[];
    const cancel=pending.filter(x=>x.id<SNOOZE_BASE).map(x=>({id:x.id}));
    if(cancel.length)await LN.cancel({notifications:cancel});
    await clearTaken();
    const list=build().map((x,i)=>({id:1000+i,channelId:CH,title:x.title,body:x.body,schedule:{at:new Date(x.at),allowWhileIdle:true},autoCancel:true,
      // Эм: шударч арилгахгүй (ongoing) — «Уусан ✓» эсвэл «Дараа» дарж байж алга болно
      ...(x.med?{actionTypeId:MED,group:'med-'+x.extra.date+x.extra.key,extra:x.extra,ongoing:true,autoCancel:false}:x.extra?{extra:x.extra}:{})}));
    if(list.length)await LN.schedule({notifications:list});
  }
  // Уусан эмийн мэдэгдлийг (давталтуудыг ч) самбараас арилгана
  async function clearTaken(grp){
    try{const dl=(await LN.getDeliveredNotifications()).notifications||[];
      const rm=dl.filter(x=>{const g=String(x.group||'');if(!g.startsWith('med-'))return false;if(grp)return g===grp;const d=g.slice(4,14);return d<today()||!!(D.medLog[d]||{})[g.slice(14)]}).map(x=>({id:x.id})); // уусан, эсвэл өнгөрсөн өдрийнх
      if(rm.length)await LN.removeDeliveredNotifications({notifications:rm})}catch(e){}
  }
  async function onAction(ev){
    const n=ev.notification||{},ex=n.extra||{};
    try{
      if(ev.actionId==='taken'&&ex.key){D.medLog[ex.date]=D.medLog[ex.date]||{};D.medLog[ex.date][ex.key]=true;save();render();await clearTaken('med-'+ex.date+ex.key);toast('✓ Эм уусан гэж тэмдэглэлээ')}
      else if(ev.actionId==='snooze'&&ex.key){const snz=lsGet('mu.medSnooze')||{},td=today();Object.keys(snz).forEach(k=>{if(k.slice(0,10)<addDays(td,-1))delete snz[k]});
        snz[ex.date+ex.key]=Date.now()+SNOOZE_MIN*60000;lsSet('mu.medSnooze',snz);await clearTaken('med-'+ex.date+ex.key);toast(SNOOZE_MIN+' минутын дараа дахин сануулна');try{App.minimizeApp()}catch(e){}}
      else if(ex.key){UI.life='health';setView('life')}
      else if(ex.go==='journal')goJournal();
      else if(ex.go==='today')setView('today');
    }catch(e){console.warn(e)}
    resync();
  }
  function onBack(){
    if(!$('#lightbox').classList.contains('hidden'))return $('#lightbox').classList.add('hidden');
    if(!$('#sheet').classList.contains('hidden'))return closeSheet();
    if(!$('#drawer').classList.contains('hidden'))return closeDrawer();
    if(UI.back)return goBack();
    if(VIEW==='grp'||VIEW!=='home')return setView('home');
    App.minimizeApp();
  }
  async function shareFile(name,text,mime,title){
    try{const r=await FS.writeFile({path:name,data:text,directory:'CACHE',encoding:'utf8'});await Share.share({title,dialogTitle:title,files:[r.uri]});return true}catch(e){return false}
  }
  async function shareText(text,title){try{await Share.share({title,text,dialogTitle:title});return true}catch(e){return false}}
  async function requestPermission(){
    let p;try{p=await LN.requestPermissions()}catch(e){p={display:'denied'}}
    if(p.display!=='granted')toast('Тохиргоо → Апп → Миний өдөр → Мэдэгдэл хэсгээс асаана уу');
    try{const ex=(await LN.checkExactNotificationSetting()).exact_alarm;if(ex!=='granted'&&confirm('Сануулга яг цагтаа ирэхийн тулд "Сэрүүлэг ба сануулга" зөвшөөрлийг асаах уу?'))await LN.changeExactNotificationSetting()}catch(e){}
    resync();return p.display==='granted';
  }
  async function setup(){
    try{await LN.createChannel({id:CH,name:'Сануулга',description:'Эм, уулзалт, эмчийн цаг, төлбөрийн сануулга',importance:5,visibility:1,vibration:true,lights:true,lightColor:'#5b8c7b'})}catch(e){}
    try{await LN.registerActionTypes({types:[{id:MED,actions:[{id:'taken',title:'Уусан ✓'},{id:'snooze',title:SNOOZE_MIN+' мин дараа'}]}]})}catch(e){}
    LN.addListener('localNotificationActionPerformed',onAction);
    App.addListener('backButton',onBack);
    App.addListener('resume',()=>{try{checkReminders();render()}catch(e){}resync()});
    // Гадны холбоос (Google Sheet г.м.) системийн хөтөч/апп-аар нээгдэнэ
    window.open=url=>{if(url)location.href=url;return null};
    ready=true;
    try{const p=await LN.checkPermissions();if(p.display==='granted'){if(!D.settings.notify){D.settings.notify=true;saveLocal()}}else if(p.display!=='denied'){if(await requestPermission()){D.settings.notify=true;saveLocal()}}}catch(e){}
    resync();
  }
  // Мэдээлэл өөрчлөгдөх бүрт (энэ төхөөрөмж эсвэл үүлнээс ирсэн) сануулгыг шинэчилнэ
  const _saveLocal=saveLocal;saveLocal=function(){_saveLocal();resync()};
  // Апп доторх Google нэвтрэлт (popup вэб дээр л ажилладаг)
  fbGoogle=async function(){
    if(!fbOK)return location.reload();
    try{const r=await FA.signInWithGoogle();const tok=r&&r.credential&&r.credential.idToken;if(!tok){showAuth(true,'Google нэвтрэлт амжилтгүй. Дахин оролдоно уу.');return}
      await fb.signInWithCredential(fbAuth,fb.GoogleAuthProvider.credential(tok))}
    catch(e){const m=String((e&&(e.message||e.code))||'');if(/cancel/i.test(m))return;showAuth(true,e&&e.code&&String(e.code).startsWith('auth/')?authErr(e):'Google нэвтрэлт амжилтгүй: '+m)}
  };
  const _logout=logout;logout=async function(){try{await FA.signOut()}catch(e){}return _logout()};

  /* ---- Автомат шинэчлэл: GitHub Pages-ээс шинэ хувилбарыг татаж, APK дахин суулгахгүйгээр ачаална ----
     version.json: {"version":"1.7.3","minShell":2,"files":[...]}. minShell = шаардлагатай APK versionCode.
     Шинэ хувилбар амжилттай эхэлсэн үед л байнгын болгоно (persist) — эвдэрсэн бол дараагийн нээлтэд хуучин руугаа буцна. */
  const OTA_URL='https://zegiijagii11-alt.github.io/minii-udur/';
  const WV=plug('WebView');
  const vNum=v=>String(v||'0').split('.').map(Number).reduce((a,x)=>a*1000+(x||0),0);
  let otaPath=null,otaVer='',otaLast=0;
  const otaLog=m=>{const L=lsGet('mu.otaLog')||[];L.push(new Date().toTimeString().slice(0,8)+' '+m);lsSet('mu.otaLog',L.slice(-10))};
  window.otaLogText=()=>(lsGet('mu.otaLog')||[]).join(String.fromCharCode(10));
  async function otaConfirm(){ // энэ хувилбар амжилттай ачаалагдсан
    try{const p=(await WV.getServerBasePath()).path||'';otaLog('ачаалсан v'+VERSION+' ← '+(p.includes('/ota/')?'ota':'суулгац'));if(p.includes('/ota/')){await WV.persistServerBasePath();otaLog('байнгын болгосон')}
      lsSet('mu.otaOk',VERSION);
      if(lsGet('mu.otaNew')===VERSION){lsSet('mu.otaNew',null);toast('✓ Апп шинэчлэгдлээ — v'+VERSION)}}catch(e){}
  }
  async function otaCheck(){
    if(otaPath)return 'ready';if(otaCheck.busy||Date.now()-otaLast<60000)return 'busy';otaCheck.busy=true;otaLast=Date.now();
    try{
      otaLog('шалгаж байна (v'+VERSION+')');
      const m=await (await fetch(OTA_URL+'version.json?t='+Date.now(),{cache:'no-store'})).json();
      const shell=+((await App.getInfo()).build)||0;otaLog('GitHub: v'+m.version+', APK '+shell+'/'+(m.minShell||0));
      if(m.minShell&&shell<m.minShell){otaShellBanner(m);return 'shell'}
      if(vNum(m.version)<=vNum(VERSION))return 'latest';
      const tr=lsGet('mu.otaTries')||{};if(tr.v===m.version&&tr.n>=3&&lsGet('mu.otaOk')!==m.version&&!otaCheck.force){otaLog('алгассан: 3 удаа эхэлж чадаагүй');return 'skipped'}
      const dir='ota/'+m.version;
      for(const f of (m.files||['index.html'])){
        const res=await fetch(OTA_URL+f+'?v='+m.version,{cache:'no-store'});if(!res.ok)throw new Error(f+' '+res.status);
        if(/\.(html|webmanifest|json)$/.test(f)){const txt=await res.text();
          if(f==='index.html'&&!txt.includes("const VERSION='"+m.version+"'"))throw new Error('version mismatch');
          await FS.writeFile({path:dir+'/'+f,data:txt,directory:'DATA',encoding:'utf8',recursive:true})}
        else{const data=(await blobToDataURL(await res.blob())).split(',')[1];await FS.writeFile({path:dir+'/'+f,data,directory:'DATA',recursive:true})}
      }
      otaLog('татсан '+(m.files||[]).length+' файл');
      const uri=(await FS.getUri({path:dir,directory:'DATA'})).uri;
      otaPath=decodeURIComponent(uri.replace(/^file:\/\//,''));otaVer=m.version;
      otaApply();return 'ready';
    }catch(e){console.warn('OTA',e);otaLog('АЛДАА: '+(e&&e.message||e));return 'error: '+(e&&e.message||e)}finally{otaCheck.busy=false;otaCheck.force=false}
  }
  function otaApply(){ // бичиж байх эсвэл цонх нээлттэй үед хүлээнэ
    if(!otaPath)return;const a=document.activeElement;
    if(!$('#sheet').classList.contains('hidden')||(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))){if(!otaApply.w){otaApply.w=1;otaLog('цонх хаагдахыг хүлээж байна')}setTimeout(otaApply,4000);return}
    // Зөвхөн бодитоор ачаалах үед тоолно — татаад аппыг хаасан бол дараагийн нээлтэд дахин оролдоно
    const tr=lsGet('mu.otaTries')||{};lsSet('mu.otaTries',{v:otaVer,n:tr.v===otaVer?tr.n+1:1});lsSet('mu.otaNew',otaVer);
    saveLocal();otaLog('ачаалж байна: '+otaPath);WV.setServerBasePath({path:otaPath}).catch(e=>otaLog('АЛДАА setServerBasePath: '+(e&&e.message||e)));
  }
  function otaShellBanner(m){
    if(document.getElementById('otaBan'))return;const b=document.createElement('div');b.id='otaBan';
    b.style.cssText='position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:60;background:var(--acc,#5b8c7b);color:#fff;border-radius:14px;padding:12px 14px;font-size:14px;box-shadow:0 4px 16px rgba(0,0,0,.2);display:flex;gap:10px;align-items:center';
    b.innerHTML='<span style="flex:1">Аппын шинэ суулгац гарсан (v'+esc(m.version)+'). Татаж суулгана уу.</span><button style="background:#fff;color:#2f5247;border:0;border-radius:10px;padding:8px 12px;font-weight:600">Татах</button><button aria-label="Хаах" style="background:none;border:0;color:#fff;font-size:18px">×</button>';
    b.children[1].onclick=()=>{location.href=OTA_URL+(m.apk||'apk/miniy-udur.apk')};b.children[2].onclick=()=>b.remove();document.body.appendChild(b);
  }
  App.addListener('resume',()=>otaCheck());
  window.addEventListener('load',()=>{setTimeout(otaConfirm,3000);setTimeout(otaCheck,1500)});

  window.NativeApp={isNative:true,resync,shareFile,shareText,requestPermission,otaCheck:()=>{otaLast=0;otaCheck.force=true;return otaCheck()}};
  window.addEventListener('load',setup);
})();
