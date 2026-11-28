/* ===================== Нэвтрэлт, үүлэн хадгалалт (Firebase) ===================== */
// Миний өдрийн тусдаа Firebase төсөл (2026-11-28-нд epilyse--2026-оос салгасан); мэдээлэл users/{uid}/mu_<хэсэг>/{id} доор.
const FB_CFG={apiKey:"AIzaSyDTwVGQvMOcaWdPyoUv15m8QmI96C9Wo7U",authDomain:"minii-udur.firebaseapp.com",projectId:"minii-udur",
  storageBucket:"minii-udur.firebasestorage.app",messagingSenderId:"358636659499",appId:"1:358636659499:web:24742281a844ea6d1f1b6e"};
const FB_SDK='https://www.gstatic.com/firebasejs/10.12.2/';
const OWNER_KEY=KEY+'.owner',SY_KEY=KEY+'.sync',UP_KEY=KEY+'.up',PROJ_KEY=KEY+'.proj';
const SYNC_COLS=['items','notes','tx','bills','meds','health','habits','shopping','chores','ot','reports'];
const META_SET=['name','avatar','waterGoal','otRate','shiftLink','rtLink','rooms','contrastRooms','reportRemind'];
// Хүснэгтийн холболт: тусдаа баримт. mu_meta-д байвал v1.8.1 ба түүнээс өмнөх хувилбар (энэ түлхүүрүүдийг мэдэхгүй) буцааж бичихдээ арилгадаг.
const SHEET_SET=['rosterUrl','rosterKey','rosterName','rosterMode'];
const fb={};let fbMovedMsg='',fbAuth=null,fbDb=null,fbUser=null,fbOK=false,fbUnsubs=[],fbReconciled=false,fbState='',fbErrMsg='',fbSignUp=false;
function lsGet(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
// SYNC-START
// Түлхүүрийн дарааллаас үл хамааран ижил объектод ижил мөр өгнө (өөрчлөлт илрүүлэх)
function stable(v){if(Array.isArray(v))return '['+v.map(stable).join(',')+']';
  if(v&&typeof v==='object')return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
  return JSON.stringify(v===undefined?null:v)}
const clean=o=>JSON.parse(JSON.stringify(o));
// 3 талын нэгтгэл: L=энэ төхөөрөмж, C=үүл, s=сүүлд синк хийсэн төлөв. Буцаах: үүл рүү бичих үйлдлүүд.
function reconcileSpace(sp,cloud,sy){
  const loc=sp.local();const ops=[];
  new Set([...loc.keys(),...cloud.keys(),...Object.keys(sy)]).forEach(id=>{
    const L=loc.get(id),C=cloud.get(id),s=sy[id];const lj=L&&stable(clean(L)),cj=C&&stable(C);
    if(L&&C){if(lj===cj){sy[id]=cj}
      else if(s===undefined||lj===s){sp.apply(id,C);sy[id]=cj}     // зөвхөн үүл өөрчлөгдсөн (эсвэл анх удаа) → үүлийнх
      else{ops.push(['set',id,L]);sy[id]=lj}}                         // энд өөрчилсөн → энэ төхөөрөмжийнх
    else if(L){if(s!==undefined&&lj===s){sp.apply(id,null);delete sy[id]}   // өөр төхөөрөмж дээр устгасан
      else{ops.push(['set',id,L]);sy[id]=lj}}                         // шинээр нэмсэн
    else if(C){if(s!==undefined&&cj===s&&!sp.keep){ops.push(['del',id]);delete sy[id]} // энд устгасан
      else{sp.apply(id,C);sy[id]=cj}}                                  // өөр төхөөрөмж дээр нэмсэн
    else delete sy[id];
  });
  return ops;
}
// Тухайн мөчийн өөрчлөлтүүд (сүүлийн синктэй харьцуулж)
function diffSpace(sp,sy){
  const loc=sp.local(),ops=[];
  loc.forEach((L,id)=>{const lj=stable(clean(L));if(sy[id]!==lj){ops.push(['set',id,L]);sy[id]=lj}});
  Object.keys(sy).forEach(id=>{if(!loc.has(id)&&!sp.keep){ops.push(['del',id]);delete sy[id]}});
  return ops;
}
// SYNC-END
let SY=lsGet(SY_KEY)||{};
function spaces(){
  const S=SYNC_COLS.map(c=>({name:c,
    local:()=>new Map((D[c]||[]).filter(x=>x&&x.id!=null).map(x=>[String(x.id),x])),
    apply:(id,o)=>{const a=D[c]=D[c]||[];const k=a.findIndex(x=>String(x.id)===id);if(o==null){if(k>=0)a.splice(k,1)}else if(k>=0)a[k]=o;else a.push(o)}}));
  const DM=['medLog','habitLog','water','journal'];
  S.push({name:'days',
    local:()=>{const m=new Map();new Set(DM.flatMap(k=>Object.keys(D[k]||{}))).forEach(d=>{const o={id:d};
      DM.forEach(k=>{const v=(D[k]||{})[d];if(v&&(typeof v!=='object'||Object.keys(v).length))o[k]=v});if(Object.keys(o).length>1)m.set(d,o)});return m},
    apply:(id,o)=>{DM.forEach(k=>{D[k]=D[k]||{};if(o&&o[k]!=null)D[k][id]=o[k];else delete D[k][id]})}});
  S.push({name:'meta',
    local:()=>{const s={};META_SET.forEach(k=>{const v=D.settings[k];if(v!==undefined&&v!==''&&v!==null)s[k]=v});return new Map([['main',{id:'main',budget:D.budget||0,s}]])},
    apply:(id,o)=>{if(!o)return;D.budget=o.budget||0;META_SET.forEach(k=>{D.settings[k]=o.s&&o.s[k]!==undefined?o.s[k]:DEF.settings[k]})}});
  // keep: энэ төхөөрөмж дээр алга болсон нь «устгасан» гэсэн үг биш (хуучин хувилбартай таб дарж бичсэн байж болно) → үүлнээс сэргээнэ. Салгахад rosterOff тэмдэглэнэ.
  S.push({name:'sheet',keep:true,
    local:()=>{const s={};SHEET_SET.forEach(k=>{if(D.settings[k])s[k]=D.settings[k]});if(D.settings.rosterOff)s.off=1;return new Map(s.off||s.rosterUrl?[['main',{id:'main',s}]]:[])},
    apply:(id,o)=>{SHEET_SET.forEach(k=>{if(o&&o.s&&o.s[k])D.settings[k]=o.s[k];else delete D.settings[k]});if(o&&o.s&&o.s.off)D.settings.rosterOff=true;else delete D.settings.rosterOff}});
  return S;
}
const docRef=(sp,id)=>fb.doc(fbDb,'users',fbUser.uid,'mu_'+sp,String(id).replace(/\//g,'_'));
let _rT=null;
function scheduleRender(){clearTimeout(_rT);_rT=setTimeout(()=>{
  const a=document.activeElement;
  // Хэрэглэгч ямар нэг талбарт бичиж байвал дахин зурахгүй — бичсэн текст арилна. Талбараас гармагц зурна.
  if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&!a.closest('#sheet')){a.addEventListener('blur',()=>setTimeout(scheduleRender,50),{once:true});return}
  render()},120)}
function setFbState(s){fbState=s}
function syncLabel(){
  if(!fbUser)return 'Мэдээлэл зөвхөн энэ төхөөрөмж дээр.';
  return ({loading:'Үүлтэй тулгаж байна…',saving:navigator.onLine?'Хадгалж байна…':'Интернет хүлээж байна — өөрчлөлт утсанд хадгалагдсан, холбогдмогц илгээнэ.',
    ok:'☁️ Үүлэнд хадгалагдсан, бүх төхөөрөмж дээр шинэчлэгдэнэ.',error:'⚠️ '+fbErrMsg})[fbState]||'';
}
function cloudError(e){
  const c=(e&&e.code)||'';
  fbErrMsg=c==='permission-denied'?'Үүлэн сан зөвшөөрөхгүй байна — Firebase-ийн Firestore Rules-ийг шинэчлэх хэрэгтэй.':'Үүлэнд хадгалж чадсангүй ('+(c||e&&e.message||'алдаа')+')';
  if(fbState!=='error')toast('⚠️ '+fbErrMsg);setFbState('error');
}
let _pushT=null;
function cloudSchedule(){if(!fbUser||!fbReconciled)return;clearTimeout(_pushT);_pushT=setTimeout(cloudPush,600)}
function cloudPush(){
  if(!fbUser||!fbReconciled)return;clearTimeout(_pushT);
  const ops=[];spaces().forEach(sp=>diffSpace(sp,SY[sp.name]=SY[sp.name]||{}).forEach(op=>ops.push([sp.name,...op])));
  lsSet(SY_KEY,SY);if(ops.length)commitOps(ops);syncPhotos();
}
async function commitOps(ops){
  setFbState('saving');
  try{for(let i=0;i<ops.length;i+=400){const b=fb.writeBatch(fbDb);
      ops.slice(i,i+400).forEach(([sp,op,id,o])=>op==='set'?b.set(docRef(sp,id),clean(o)):b.delete(docRef(sp,id)));await b.commit()}
    if(fbState!=='error')setFbState('ok')}
  catch(e){cloudError(e);SY={};lsSet(SY_KEY,SY)} // дараагийн удаа бүгдийг дахин тулгана
}
function cloudUnsub(){fbUnsubs.forEach(u=>{try{u()}catch(e){}});fbUnsubs=[]}
function cloudSubscribe(){
  cloudUnsub();fbReconciled=false;setFbState('loading');const latest={};const S=spaces();
  S.forEach(sp=>{
    fbUnsubs.push(fb.onSnapshot(fb.collection(fbDb,'users',fbUser.uid,'mu_'+sp.name),{includeMetadataChanges:true},snap=>{
      if(!fbReconciled){
        if(snap.metadata.fromCache)return; // серверийн бүтэн хариуг хүлээнэ
        latest[sp.name]=new Map(snap.docs.map(d=>{const o=d.data();return [String(o.id!=null?o.id:d.id),o]}));
        if(!S.every(x=>latest[x.name]))return;
        const ops=[];S.forEach(x=>reconcileSpace(x,latest[x.name],SY[x.name]=SY[x.name]||{}).forEach(op=>ops.push([x.name,...op])));
        fbReconciled=true;lsSet(SY_KEY,SY);saveLocal();scheduleRender();
        if(ops.length)commitOps(ops);else setFbState('ok');syncPhotos();return;
      }
      const sy=SY[sp.name]=SY[sp.name]||{};let ch=false;
      snap.docChanges().forEach(c=>{
        if(c.doc.metadata.hasPendingWrites)return; // өөрийн бичилт
        const o=c.doc.data();const id=String(o&&o.id!=null?o.id:c.doc.id);
        if(c.type==='removed'){const L=sp.local().get(id);if(!sp.keep&&L&&stable(clean(L))===sy[id]){sp.apply(id,null);ch=true}delete sy[id];return}
        const j=stable(o);if(sy[id]===j)return;sp.apply(id,o);sy[id]=j;ch=true;
      });
      if(ch){lsSet(SY_KEY,SY);saveLocal();scheduleRender()}
    },e=>cloudError(e)));
  });
}
// Зураг: тэмдэглэлд хавсаргасан зургийг тусдаа баримт болгож (base64) хадгална
async function photoForCloud(b){
  if(b.size>600000){try{const bm=await createImageBitmap(b);const k=Math.min(1,1280/Math.max(bm.width,bm.height));const c=document.createElement('canvas');
    c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);
    b=await new Promise(r=>c.toBlob(r,'image/jpeg',.72))||b}catch(e){}}
  return (await blobToDataURL(b)).split(',')[1];
}
async function syncPhotos(){
  if(!fbUser||!fbReconciled||syncPhotos.busy)return;syncPhotos.busy=true;
  try{const up=new Set(lsGet(UP_KEY)||[]);const used=new Set(D.notes.flatMap(n=>(n.photos||[]).map(p=>p.id)));
    for(const id of used){if(up.has(id))continue;const b=await imgGet(id).catch(()=>null);if(!b)continue;
      await fb.setDoc(docRef('photos',id),{d:await photoForCloud(b),t:'image/jpeg'});up.add(id);lsSet(UP_KEY,[...up])}
    for(const id of [...up])if(!used.has(id)){await fb.deleteDoc(docRef('photos',id)).catch(()=>{});up.delete(id);lsSet(UP_KEY,[...up])}
  }catch(e){cloudError(e)}finally{syncPhotos.busy=false}
}
async function cloudPhoto(id){
  if(!fbUser||!fbDb)return null;
  try{const s=await fb.getDoc(docRef('photos',id));if(!s.exists())return null;const x=s.data();
    const blob=await (await fetch('data:'+(x.t||'image/jpeg')+';base64,'+x.d)).blob();await imgPut(id,blob);
    const up=new Set(lsGet(UP_KEY)||[]);up.add(id);lsSet(UP_KEY,[...up]);return blob}catch(e){return null}
}
// ---- Нэвтрэлт ----
function showAuth(on,msg,ok){$('#auth').classList.toggle('hidden',!on);if(msg!==undefined){$('#aMsg').textContent=msg;$('#aMsg').classList.toggle('ok',!!ok)}}
// Firebase төсөл солигдсон бол: утсан дээрх мэдээллийг ҮЛДЭЭЖ, нэвтрэлт ба синкийн төлөвийг л цэвэрлэнэ.
// Дахин нэвтрэхэд энэ төхөөрөмжийн бүх мэдээлэл шинэ төсөл рүү «шинээр нэмсэн» гэж илгээгдэнэ (устгалгүй, хуучин хэрэглэгчийн шалгалтгүй).
function cloudMigrate(){
  if(lsGet(PROJ_KEY)===FB_CFG.projectId)return false;
  const had=!!lsGet(OWNER_KEY);
  if(had){try{localStorage.removeItem(OWNER_KEY);localStorage.removeItem(UP_KEY)}catch(e){}SY={};lsSet(SY_KEY,SY)}
  lsSet(PROJ_KEY,FB_CFG.projectId);return had;
}
async function cloudInit(){
  const moved=cloudMigrate();
  const owner=lsGet(OWNER_KEY);
  if(moved){fbMovedMsg='Апп шинэ сервер рүү шилжлээ. Мэдээлэл тань энэ төхөөрөмжид хадгалагдсан байгаа — дахин нэг удаа нэвтэрнэ үү.';showAuth(true,fbMovedMsg,true)}
  if(!owner)showAuth(true,'Ачаалж байна…',true);
  try{
    const mods=await Promise.race([Promise.all(['firebase-app.js','firebase-auth.js','firebase-firestore.js'].map(f=>import(FB_SDK+f))),
      new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),15000))]);
    mods.forEach(m=>Object.assign(fb,m));
    const app=fb.initializeApp(FB_CFG);fbAuth=fb.getAuth(app);fbAuth.languageCode='mn';
    try{fbDb=fb.initializeFirestore(app,{localCache:fb.persistentLocalCache({tabManager:fb.persistentMultipleTabManager()})})}catch(e){fbDb=fb.getFirestore(app)}
    fbOK=true;if(!owner&&!moved)showAuth(true,'');
    fb.getRedirectResult(fbAuth).catch(e=>showAuth(true,authErr(e)));
    fb.onAuthStateChanged(fbAuth,onUser);
  }catch(e){
    fbOK=false; // интернетгүй: өмнө нэвтэрсэн бол утсан дээрх хуулбараар үргэлжилнэ
    if(!owner)showAuth(true,'Интернетэд холбогдож чадсангүй. Анх нэвтрэхэд интернет хэрэгтэй — холбогдоод дахин нээнэ үү.');
  }
}
function onUser(u){
  fbUser=u;
  if(!u){cloudUnsub();fbReconciled=false;showAuth(true,fbMovedMsg,!!fbMovedMsg);return}
  fbMovedMsg='';
  const owner=lsGet(OWNER_KEY);
  if(owner&&owner!==u.uid)wipeLocal(); // өөр хүний мэдээллийг холихгүй
  lsSet(OWNER_KEY,u.uid);
  if(!D.settings.name&&u.displayName){D.settings.name=u.displayName.split(' ')[0];saveLocal()}
  showAuth(false);cloudSubscribe();render();
}
function wipeLocal(){
  D=JSON.parse(JSON.stringify(DEF));SY={};saveLocal();
  [SY_KEY,UP_KEY,KEY+'.view',KEY+'.roster',KEY+'.rt'].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});
  IMGURL.forEach(u=>URL.revokeObjectURL(u));IMGURL.clear();idbDo('readwrite',s=>s.clear()).catch(()=>{});
}
function fbToggle(){fbSignUp=!fbSignUp;$('#aSubmit').textContent=fbSignUp?'Бүртгүүлэх':'Нэвтрэх';$('#aToggle').textContent=fbSignUp?'Бүртгэлтэй юу? Нэвтрэх':'Бүртгэл үүсгэх';
  $('#aPass').autocomplete=fbSignUp?'new-password':'current-password';showAuth(true,'')}
async function fbEmail(){
  if(!fbOK)return location.reload();
  const e=$('#aEmail').value.trim(),p=$('#aPass').value;if(!e||!p)return showAuth(true,'Имэйл, нууц үгээ бичнэ үү.');
  $('#aSubmit').disabled=true;showAuth(true,'');
  try{if(fbSignUp)await fb.createUserWithEmailAndPassword(fbAuth,e,p);else await fb.signInWithEmailAndPassword(fbAuth,e,p);$('#aPass').value=''}
  catch(x){showAuth(true,authErr(x))}
  $('#aSubmit').disabled=false;
}
async function fbGoogle(){
  if(!fbOK)return location.reload();
  const pr=new fb.GoogleAuthProvider();pr.setCustomParameters({prompt:'select_account'});
  try{await fb.signInWithPopup(fbAuth,pr)}
  catch(e){const c=(e&&e.code)||'';
    if(c==='auth/popup-blocked'||c==='auth/operation-not-supported-in-this-environment'){try{await fb.signInWithRedirect(fbAuth,pr)}catch(e2){showAuth(true,authErr(e2))}}
    else if(!/cancelled-popup|popup-closed/.test(c))showAuth(true,authErr(e))}
}
async function fbReset(){
  if(!fbOK)return;const e=$('#aEmail').value.trim();if(!e)return showAuth(true,'Эхлээд имэйлээ бичнэ үү.');
  try{await fb.sendPasswordResetEmail(fbAuth,e);showAuth(true,'Нууц үг сэргээх холбоос имэйл рүү илгээгдлээ.',true)}catch(x){showAuth(true,authErr(x))}
}
function authErr(e){const c=(e&&e.code)||'';return ({'auth/invalid-email':'Имэйл буруу байна.','auth/user-not-found':'Ийм бүртгэл алга.','auth/wrong-password':'Нууц үг буруу.',
  'auth/invalid-credential':'Имэйл эсвэл нууц үг буруу.','auth/email-already-in-use':'Энэ имэйлээр бүртгэл үүссэн байна — “Нэвтрэх” дарна уу.',
  'auth/weak-password':'Нууц үг хамгийн багадаа 6 тэмдэгт.','auth/too-many-requests':'Олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу.',
  'auth/network-request-failed':'Интернет холболтоо шалгана уу.','auth/unauthorized-domain':'Энэ хаягаас нэвтрэх зөвшөөрөлгүй (Firebase → Authentication → Authorized domains).',
  'auth/operation-not-allowed':'Энэ нэвтрэх арга Firebase дээр идэвхжээгүй байна.'})[c]||('Алдаа: '+((e&&e.message)||c))}
async function logout(){
  if(!fbUser)return;
  if(!confirm('Гарах уу?\n\nМэдээлэл тань үүлэнд хадгалагдсан хэвээр, дахин нэвтрэхэд сэргэнэ. Энэ төхөөрөмж дээрх хуулбар устна.'))return;
  closeSheet();closeDrawer();cloudPush();
  const done=await Promise.race([fb.waitForPendingWrites(fbDb).then(()=>true).catch(()=>true),new Promise(r=>setTimeout(()=>r(false),6000))]);
  if(!done&&!confirm('Сүүлийн өөрчлөлтүүд үүлэнд хараахан хүрээгүй байна (интернетээ шалгана уу). Тэгсэн ч гарах уу?'))return;
  cloudUnsub();try{await fb.signOut(fbAuth)}catch(e){}
  wipeLocal();try{localStorage.removeItem(OWNER_KEY)}catch(e){}
  try{await fb.terminate(fbDb);await fb.clearIndexedDbPersistence(fbDb)}catch(e){}
  location.reload();
}
window.addEventListener('online',()=>{if(fbReconciled)cloudPush()});
