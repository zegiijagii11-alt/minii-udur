/* ===================== Тохиргоо, нөөц ===================== */
function openSettings(){
  const s=D.settings;const NAT=window.NativeApp&&NativeApp.isNative;const perm=NAT?(s.notify?'granted':'default'):('Notification' in window)?Notification.permission:'unsupported';
  openSheet(`<h3>⚙️ Тохиргоо</h3>
    <div class="fld"><label>Таны нэр</label><input id="sName" value="${esc(s.name)}" placeholder="Мэндчилгээнд гарна"></div>
    <div class="fld2"><div class="fld"><label>Цайвар / бараан</label><select id="sTheme"><option value="auto">Автомат</option><option value="light">Цайвар</option><option value="dark">Бараан</option></select></div>
    <div class="fld"><label>Үсгийн хэмжээ</label><select id="sFs"><option value="15">Жижиг</option><option value="16">Дунд</option><option value="18">Том</option><option value="20">Маш том</option></select></div></div>
    <div class="fld"><label>Аппын өнгө</label><div class="swatches">${ACCENTS.map(([c,n])=>`<button type="button" title="${n}" aria-label="${n}" data-c="${c}" class="${(s.accent||'#5b8c7b').toLowerCase()===c?'on':''}" style="background:${c}" onclick="pickAccent('${c}')"></button>`).join('')}<label class="cust" title="Өөр өнгө"><input type="color" value="${esc(s.accent||'#5b8c7b')}" oninput="pickAccent(this.value)"></label></div></div>
    <div class="fld"><label>Өдрийн усны зорилго (аяга)</label><input id="sWater" type="number" value="${s.waterGoal||8}"></div>
    <div class="fld"><label>Ээлжийн хуваарийн холбоос</label><input id="sShift" value="${esc(s.shiftLink||'')}" placeholder="${esc(SHEET_LINK)}"></div>
    <div class="fld"><label>Хуваарь: Apps Script холбоос</label><input id="sRosUrl" value="${esc(s.rosterUrl||'')}" placeholder="https://script.google.com/macros/s/…/exec"></div>
    <div class="fld"><label>Хуваарь: түлхүүр</label><input id="sRosKey" value="${esc(s.rosterKey||'')}" autocomplete="off"></div>
    <div class="fld"><label>RT exam CT хүснэгтийн холбоос</label><input id="sRt" value="${esc(s.rtLink||'')}" placeholder="${esc(RT_LINK)}"></div>
    <div class="card" style="margin-top:6px"><h2>Сануулга</h2><div class="small">${perm==='granted'&&s.notify?(NAT?'Асаалттай. Апп хаалттай, утас түгжээтэй үед ч цагтаа ирнэ.':'Асаалттай. Одоогоор апп нээлттэй (эсвэл ард нь ажиллаж) байхад сануулна.'):perm==='denied'?'Хөтөч дээр сануулга хаагдсан байна — хөтчийн тохиргооноос зөвшөөрнө үү.':'Унтраалттай.'}</div>
      <div class="btns" style="margin-top:8px"><button class="btn sm" onclick="enableNotify()">${s.notify?'Дахин шалгах':'Асаах'}</button>${s.notify?'<button class="btn sm ghost" onclick="D.settings.notify=false;save();openSettings()">Унтраах</button>':''}</div></div>
    <div class="card"><h2>Бүртгэл</h2><div class="small">${fbUser?'<b style="color:var(--ok)">✓ Нэвтэрсэн</b> · '+esc(fbUser.email||fbUser.displayName||''):'Нэвтрээгүй'}<br>${syncLabel()}</div>
      <div class="btns" style="margin-top:8px">${fbUser?'<button class="btn sm" onclick="cloudPush();toast(\'Синк хийлээ\')">Одоо синк хийх</button><button class="btn sm danger ghost" onclick="logout()">Гарах</button>':'<button class="btn sm primary" onclick="closeSheet();showAuth(true,\'\')">Нэвтрэх</button>'}</div></div>
    <div class="card"><h2>Нөөц хуулбар</h2><div class="small">Мэдээлэл тань үүлэнд автоматаар хадгалагдана. Нэмэлт хамгаалалт болгож файлаар хуулбар авч болно.</div>
      <div class="btns" style="margin-top:8px"><button class="btn sm primary" onclick="exportBackup()">Нөөц авах</button><button class="btn sm" onclick="$('#restoreInput').click()">Сэргээх</button></div>
      <div class="small" style="margin-top:6px">Сүүлд нөөц авсан: ${s.lastBackup?dayLabel(s.lastBackup):'хэзээ ч'}</div></div>
    <div class="row-btns"><button class="btn sm danger ghost" onclick="wipeAll()">Бүгдийг устгах</button><span class="sp"></span><button class="btn primary" id="sSave">Хадгалах</button></div>
    <div class="small" style="text-align:center;margin-top:10px">Миний өдөр v${VERSION}${NAT?` · <button class="lnk" onclick="toast('Шалгаж байна…');NativeApp.otaCheck().then(r=>{if(r==='ready')closeSheet();toast(r==='ready'?'Шинэ хувилбар татлаа — одоо шинэчлэгдэнэ':r==='latest'?'Хамгийн сүүлийн хувилбар байна':r==='shell'?'Шинэ APK суулгах шаардлагатай':'Шинэчилж чадсангүй: '+r)})">Шинэчлэл шалгах</button><details style="margin-top:6px;text-align:left"><summary>Шинэчлэлийн бүртгэл</summary><pre style="white-space:pre-wrap;font-size:11px;margin:6px 0 0">${esc(window.otaLogText?otaLogText():'')}</pre></details>`:''}</div>`);
  $('#sTheme').value=s.theme;$('#sFs').value=String(s.fs||16);
  $('#sSave').onclick=()=>{const ru=$('#sRosUrl').value.trim(),rk=$('#sRosKey').value.trim();if(ru&&!rosterUrlOk(ru)){toast('Apps Script холбоос /exec гэж төгсөх ёстой');return}if(ru!==(s.rosterUrl||'')||rk!==(s.rosterKey||'')){s.rosterUrl=ru;s.rosterKey=rk;rosLast=0;rosterClear()}s.name=$('#sName').value.trim();s.theme=$('#sTheme').value;s.fs=+$('#sFs').value;s.waterGoal=Math.max(1,Math.min(20,+$('#sWater').value||8));s.shiftLink=/^https?:\/\//.test($('#sShift').value.trim())?$('#sShift').value.trim():'';s.rtLink=/^https?:\/\//.test($('#sRt').value.trim())?$('#sRt').value.trim():'';save();closeSheet();render()};
}
async function enableNotify(){
  if(window.NativeApp&&NativeApp.isNative){const g=await NativeApp.requestPermission();D.settings.notify=g;save();if(g)toast('✓ Сануулга асаалттай — апп хаалттай үед ч ирнэ');openSettings();return}
  if(!('Notification' in window)){toast('Энэ хөтөч сануулга дэмжихгүй');return}
  const p=await Notification.requestPermission();D.settings.notify=p==='granted';save();
  if(p==='granted')notify('Миний өдөр','Сануулга ажиллаж байна ✓');else toast('Зөвшөөрөл өгөөгүй');
  openSettings();
}
async function backupText(){
  const images={};
  for(const n of D.notes)for(const p of n.photos||[]){try{const b=await imgGet(p.id);if(b)images[p.id]=await blobToDataURL(b)}catch(e){}}
  return JSON.stringify({app:'minii-udur',version:VERSION,exported:new Date().toISOString(),data:D,images});
}
async function exportBackup(){
  const name='minii-udur-'+today()+'.txt';const txt=await backupText();
  D.settings.lastBackup=today();save();
  if(window.NativeApp&&NativeApp.isNative){await NativeApp.shareFile(name,txt,'text/plain','Миний өдөр — нөөц');return}
  try{const f=new File([txt],name,{type:'text/plain'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'Миний өдөр — нөөц'});return}}catch(e){if(e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast('Татаж авлаа: '+name);
}
function importBackup(ev){
  const f=ev.target.files[0];ev.target.value='';if(!f)return;
  const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);const d=j.data||j;if(!d.items&&!d.notes&&!d.tx)throw 0;
    if(!confirm('Одоогийн мэдээллийг нөөц хуулбараар солих уу?'))return;
    D=Object.assign(JSON.parse(JSON.stringify(DEF)),d);D.settings=Object.assign({},DEF.settings,d.settings||{});save();closeSheet();
    (async()=>{for(const [id,url] of Object.entries(j.images||{})){try{await imgPut(id,await (await fetch(url)).blob())}catch(e){}}render();toast('✓ Сэргээлээ')})()}
    catch(e){alert('Энэ файл “Миний өдөр”-ийн нөөц биш байна.')}};
  r.readAsText(f);
}
function wipeAll(){if(!confirm('Бүх мэдээллийг устгах уу? Буцаах боломжгүй.'))return;if(!confirm('Үнэхээр итгэлтэй байна уу?'))return;D=JSON.parse(JSON.stringify(DEF));rosterClear();save();closeSheet();render()}
