/* ===================== Маягтууд ===================== */
function openSheet(html){$('#sheetBody').innerHTML=html;$('#sheet').classList.remove('hidden');document.body.style.overflow='hidden'}
function closeSheet(){$('#sheet').classList.add('hidden');document.body.style.overflow=''}
function openForm(cfg){
  const fld=fl=>{const v=fl.value??'';let inp;
    if(fl.type==='textarea')inp=`<textarea id="f_${fl.k}" rows="${fl.rows||4}" placeholder="${esc(fl.ph||'')}">${esc(v)}</textarea>`;
    else if(fl.type==='select')inp=`<select id="f_${fl.k}">${fl.options.map(([val,lab])=>`<option value="${esc(val)}" ${String(val)===String(v)?'selected':''}>${esc(lab)}</option>`).join('')}</select>`;
    else if(fl.type==='check')return `<div class="fld"><label class="chk"><input type="checkbox" id="f_${fl.k}" ${v?'checked':''}> ${esc(fl.l)}</label></div>`;
    else inp=`<input id="f_${fl.k}" type="${fl.type||'text'}" value="${esc(v)}" ${fl.type==='number'?'inputmode="decimal" step="any"':''} placeholder="${esc(fl.ph||'')}">`;
    return `<div class="fld"><label for="f_${fl.k}">${esc(fl.l)}</label>${inp}</div>`};
  const body=cfg.fields.map(fl=>Array.isArray(fl)?`<div class="fld2">${fl.map(fld).join('')}</div>`:fld(fl)).join('');
  openSheet(`<h3>${esc(cfg.title)}</h3>${body}${cfg.extra||''}<div class="row-btns">${cfg.onDelete?'<button class="btn danger ghost" id="fDel">Устгах</button>':''}<span class="sp"></span><button class="btn ghost" onclick="closeSheet()">Болих</button><button class="btn primary" id="fSave">Хадгалах</button></div>`);
  const all=cfg.fields.flat();
  $('#fSave').onclick=()=>{const o={};all.forEach(fl=>{const el=$('#f_'+fl.k);o[fl.k]=fl.type==='check'?el.checked:fl.type==='number'?(el.value===''?null:Number(el.value)):el.value.trim()});
    if(cfg.onSave(o)!==false){save();closeSheet();render()}};
  if(cfg.onDelete)$('#fDel').onclick=()=>{if(confirm('Устгах уу?')){cfg.onDelete();save();closeSheet();render();toast('Устгалаа')}};
  if(cfg.onOpen)cfg.onOpen();
  if(!cfg.noFocus)setTimeout(()=>{const f=$('#sheetBody input:not([type=checkbox]),#sheetBody textarea');if(f&&!f.value)f.focus()},60);
}
function apptForm(id,preset={}){
  let i=id?D.items.find(x=>x.id===id):null;const isNew=!i;
  if(!i)i=Object.assign({appt:'doctor',title:'',place:'',date:'',time:'',remind:1440,remind2:60,prep:'',result:''},preset);
  const R=[['','Сануулахгүй'],['eve','Өмнөх орой 20:00'],[1440,'1 өдөр өмнө'],[180,'3 цаг өмнө'],[120,'2 цаг өмнө'],[60,'1 цаг өмнө'],[30,'30 мин өмнө'],[0,'Яг цагт нь']];
  const past=!isNew&&i.date&&i.date<=today();
  openForm({title:isNew?'Эмчийн цаг / шинжилгээ':'Эмчийн цаг',fields:[
    {k:'appt',l:'Төрөл',type:'select',value:i.appt,options:Object.entries(APPT).map(([k,v])=>[k,v.i+' '+v.l])},
    {k:'title',l:'Юу / хэнд',value:i.title,ph:'Жишээ: Дотрын эмч, Цусны ерөнхий шинжилгээ'},
    {k:'place',l:'Хаана',value:i.place,ph:'Эмнэлэг, өрөөний дугаар'},
    [{k:'date',l:'Огноо',type:'date',value:i.date},{k:'time',l:'Цаг',type:'time',value:i.time}],
    [{k:'remind',l:'1-р сануулга',type:'select',value:i.remind??'',options:R},{k:'remind2',l:'2-р сануулга',type:'select',value:i.remind2??'',options:R}],
    {k:'prep',l:'Бэлтгэл',type:'textarea',rows:2,value:i.prep,ph:'Өлөн элгэн дээр очих, иргэний үнэмлэх, өмнөх шинжилгээний хариу…'},
    ...(past||i.result?[{k:'result',l:'Үр дүн / эмчийн зөвлөгөө',type:'textarea',rows:3,value:i.result}]:[])],
    onSave:o=>{if(!o.title){o.title=APPT[o.appt].l}if(!o.date){toast('Огноогоо сонгоно уу');return false}
      ['remind','remind2'].forEach(k=>{o[k]=o[k]===''?null:o[k]==='eve'?'eve':Number(o[k])});
      if(!o.time&&(o.remind!==null||o.remind2!==null))toast('Цаг оруулбал сануулга ажиллана');
      Object.assign(o,{type:'event',cat:'eruul'});
      if(isNew)D.items.push(Object.assign({id:uid(),created:Date.now(),repeat:'',note:''},i,o));else Object.assign(i,o);toast('Хадгаллаа')},
    onDelete:isNew?null:()=>{D.items=D.items.filter(x=>x.id!==i.id)}});
}
function itemForm(id,preset={}){
  let i=id?D.items.find(x=>x.id===id):null;const isNew=!i;
  if((i&&i.appt)||(!i&&preset.appt))return apptForm(id,preset);
  if(!i)i=Object.assign({type:'task',cat:'huviin',title:'',date:'',time:'',remind:15,repeat:'',note:''},preset);
  openForm({title:isNew?(i.type==='event'?'Шинэ уулзалт':'Шинэ ажил'):'Засах',fields:[
    {k:'title',l:'Юу?',value:i.title,ph:'Жишээ: Батаатай уулзах'},
    [{k:'type',l:'Төрөл',type:'select',value:i.type,options:[['task','✅ Ажил'],['event','📅 Уулзалт']]},
     {k:'cat',l:'Ангилал',type:'select',value:i.cat,options:Object.entries(CATS).map(([k,v])=>[k,v.l])}],
    [{k:'date',l:'Огноо',type:'date',value:i.date},{k:'time',l:'Цаг',type:'time',value:i.time}],
    [{k:'remind',l:'Сануулах',type:'select',value:i.remind,options:[[0,'Яг цагт нь'],[5,'5 мин өмнө'],[15,'15 мин өмнө'],[30,'30 мин өмнө'],[60,'1 цаг өмнө'],[1440,'1 өдөр өмнө']]},
     {k:'repeat',l:'Давтах',type:'select',value:i.repeat||'',options:[['','Давтахгүй'],['day','Өдөр бүр'],['week','7 хоног бүр'],['month','Сар бүр'],['year','Жил бүр']]}],
    {k:'note',l:'Нэмэлт тэмдэглэл',type:'textarea',rows:3,value:i.note,ph:'Хаана, хэнтэй, юу авч очих…'}],
    onSave:o=>{if(!o.title){toast('Юу хийхээ бичнэ үү');return false}
      o.remind=Number(o.remind);if(o.repeat&&!o.date)o.date=today();
      if(isNew){D.items.push(Object.assign({id:uid(),created:Date.now()},i,o));}else Object.assign(i,o);
      toast('Хадгаллаа')},
    onDelete:isNew?null:()=>{D.items=D.items.filter(x=>x.id!==i.id)}});
}
let NF=null; // нээлттэй тэмдэглэлийн зургууд {photos:[{id,cap}], removed:[]}
function noteForm(id,preset={}){
  let n=id?D.notes.find(x=>x.id===id):null;const isNew=!n;if(!n)n=Object.assign({title:'',body:'',tags:[],pinned:false,photos:[]},preset);
  NF={photos:(n.photos||[]).map(p=>Object.assign({},p)),removed:[]};
  openForm({title:isNew?'Шинэ тэмдэглэл':'Тэмдэглэл',fields:[
    {k:'title',l:'Гарчиг',value:n.title},{k:'body',l:'Агуулга',type:'textarea',rows:6,value:n.body},
    {k:'tags',l:'Шошго (таслалаар)',value:(n.tags||[]).join(', '),ph:'ажил, санаа, жор'},{k:'pinned',l:'📌 Дээр нь тогтоох',type:'check',value:n.pinned}],
    extra:`<div class="fld"><label>Зураг</label><div id="nfPhotos"></div>
      <div class="btns" style="margin-top:8px"><button type="button" class="btn sm" onclick="$('#camIn').click()">📷 Зураг авах</button><button type="button" class="btn sm" onclick="$('#galIn').click()">🖼 Зургаас сонгох</button></div></div>`,
    onOpen:renderNF,noFocus:!!preset._photo,
    onSave:o=>{syncCaps();if(!o.title&&!o.body&&!NF.photos.length)return false;
      o.tags=o.tags.split(',').map(x=>x.trim().replace(/^#/,'')).filter(Boolean);o.updated=Date.now();
      o.photos=NF.photos.map(p=>({id:p.id,cap:(p.cap||'').trim()}));
      if(!o.title&&o.photos.length)o.title=o.photos[0].cap||'Зураг '+dayLabel(today());
      NF.removed.forEach(id=>imgDel(id).catch(()=>{}));
      if(isNew)D.notes.push(Object.assign({id:uid()},o));else Object.assign(n,o);NF=null},
    onDelete:isNew?null:()=>{(n.photos||[]).concat(NF.photos).forEach(p=>imgDel(p.id).catch(()=>{}));D.notes=D.notes.filter(x=>x.id!==n.id);NF=null}});
}
function syncCaps(){if(NF)NF.photos.forEach((p,k)=>{const el=$('#cap_'+k);if(el)p.cap=el.value})}
function renderNF(){
  const el=$('#nfPhotos');if(!el||!NF)return;
  el.innerHTML=NF.photos.length?NF.photos.map((p,k)=>`<div class="phedit"><button type="button" class="ph" onclick="viewPhoto('${p.id}')"><img data-img="${p.id}" alt="Зураг ${k+1}"></button>
      <textarea id="cap_${k}" rows="2" placeholder="Тайлбар бичих…">${esc(p.cap||'')}</textarea>
      <button type="button" class="btn sm ghost" onclick="removeNF(${k})" aria-label="Зураг хасах">✕</button></div>`).join('')
    :'<div class="small">Зураг хавсаргаагүй байна.</div>';
  hydrateImgs(el);
}
function removeNF(k){syncCaps();const [p]=NF.photos.splice(k,1);if(p)NF.removed.push(p.id);renderNF()}
// Зураг авах / сонгох → шахаж IndexedDB-д хадгална. Тэмдэглэл нээлттэй биш бол шинээр нээнэ.
async function addPhotos(ev){
  const files=[...ev.target.files];ev.target.value='';if(!files.length)return;
  if(!$('#nfPhotos'))noteForm(null,{_photo:true});
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
  toast('Зураг хадгалж байна…');
  for(const f of files){
    try{const b=await compressImage(f);const id='img'+uid();await imgPut(id,b);syncCaps();NF.photos.push({id,cap:''})}
    catch(e){toast('⚠️ '+(e.message||'Зураг хадгалж чадсангүй'))}
  }
  renderNF();toast('✓ Зураг нэмэгдлээ — тайлбараа бичээрэй');setTimeout(()=>{const c=$('#cap_'+(NF.photos.length-1));if(c)c.focus()},80);
}
function quickPhoto(){closeSheet();NF=null;$('#camIn').click()}
async function viewPhoto(id){
  const u=await imgUrl(id);if(!u)return;
  const p=(NF&&NF.photos.find(x=>x.id===id))||D.notes.flatMap(n=>n.photos||[]).find(x=>x.id===id)||{};
  syncCaps();
  $('#lightbox').innerHTML=`<img src="${u}" alt="">${p.cap?`<div class="lbcap">${esc(p.cap)}</div>`:''}<button class="lbx" aria-label="Хаах">✕</button>`;
  $('#lightbox').classList.remove('hidden');
}

/* ===================== Зургийн сан (IndexedDB) ===================== */
let _idb=null;
function idb(){return _idb||(_idb=new Promise((res,rej)=>{const r=indexedDB.open('miniiudur-img',1);r.onupgradeneeded=()=>r.result.createObjectStore('imgs');r.onsuccess=()=>res(r.result);r.onerror=()=>{_idb=null;rej(r.error)}}))}
async function idbDo(mode,fn){const db=await idb();return new Promise((res,rej)=>{const tx=db.transaction('imgs',mode);const r=fn(tx.objectStore('imgs'));tx.oncomplete=()=>res(r&&r.result);tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||new Error('Хадгалах зай хүрэлцсэнгүй'))})}
const imgPut=(id,blob)=>idbDo('readwrite',s=>s.put(blob,id));
const imgGet=id=>idbDo('readonly',s=>s.get(id));
const imgDel=id=>{const u=IMGURL.get(id);if(u){URL.revokeObjectURL(u);IMGURL.delete(id)}return idbDo('readwrite',s=>s.delete(id))};
const imgKeys=()=>idbDo('readonly',s=>s.getAllKeys());
const IMGURL=new Map();
async function imgUrl(id){if(IMGURL.has(id))return IMGURL.get(id);try{let b=await imgGet(id);if(!b)b=await cloudPhoto(id);if(!b)return '';const u=URL.createObjectURL(b);IMGURL.set(id,u);return u}catch(e){return ''}}
function hydrateImgs(root){(root||document).querySelectorAll('img[data-img]:not([src])').forEach(async el=>{const u=await imgUrl(el.dataset.img);if(u)el.src=u;else el.closest('.ph')&&el.closest('.ph').classList.add('missing')})}
function compressImage(file,max=1600,q=.8){
  return new Promise((res,rej)=>{const img=new Image();
    img.onload=()=>{let w=img.naturalWidth,h=img.naturalHeight;const k=Math.min(1,max/Math.max(w,h));w=Math.round(w*k);h=Math.round(h*k);
      const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);URL.revokeObjectURL(img.src);
      c.toBlob(b=>b?res(b):rej(new Error('Зураг хувиргаж чадсангүй')),'image/jpeg',q)};
    img.onerror=()=>{URL.revokeObjectURL(img.src);rej(new Error('Зураг уншиж чадсангүй'))};
    img.src=URL.createObjectURL(file)});
}
const blobToDataURL=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(b)});
// Ямар ч тэмдэглэлд хамааралгүй болсон зургийг цэвэрлэнэ (эхлэх үед)
async function gcImages(){try{const used=new Set(D.notes.flatMap(n=>(n.photos||[]).map(p=>p.id)));for(const k of await imgKeys())if(!used.has(k))await imgDel(k)}catch(e){}}
function txForm(id,kind,preset={}){
  let x=id?D.tx.find(t=>t.id===id):null;const isNew=!x;
  if(!x)x=Object.assign({type:kind||'out',amount:null,cat:kind==='in'?'Цалин':'Хоол',note:'',date:today()},preset);
  const cats=x.type==='in'?INC_CATS:EXP_CATS.map(c=>c[0]);
  openForm({title:x.type==='in'?'Орлого':'Зарлага',fields:[
    {k:'amount',l:'Дүн (₮)',type:'number',value:x.amount},
    [{k:'cat',l:'Ангилал',type:'select',value:x.cat,options:cats.map(c=>[c,(x.type==='in'?'💵':catIcon(c))+' '+c])},{k:'date',l:'Огноо',type:'date',value:x.date}],
    {k:'note',l:'Тайлбар',value:x.note,ph:'Юунд?'}],
    onSave:o=>{if(!o.amount||o.amount<=0){toast('Дүнгээ оруулна уу');return false}
      if(isNew)D.tx.push(Object.assign({id:uid(),type:x.type,created:Date.now()},o));else Object.assign(x,o);toast('Хадгаллаа')},
    onDelete:isNew?null:()=>{D.tx=D.tx.filter(t=>t.id!==x.id)}});
}
function budgetForm(){openForm({title:'Сарын зарлагын төсөв',fields:[{k:'b',l:'Дүн (₮) — 0 бол төсөвгүй',type:'number',value:D.budget||''}],onSave:o=>{D.budget=o.b||0}})}
function billForm(id){
  let b=id?D.bills.find(x=>x.id===id):null;const isNew=!b;if(!b)b={name:'',amount:null,day:1,cat:'Төлбөр'};
  openForm({title:'Тогтмол төлбөр',fields:[{k:'name',l:'Нэр',value:b.name,ph:'Түрээс, интернет, зээл…'},
    [{k:'amount',l:'Дүн (₮)',type:'number',value:b.amount},{k:'day',l:'Сарын хэдэнд',type:'number',value:b.day}],
    {k:'cat',l:'Ангилал',type:'select',value:b.cat,options:EXP_CATS.map(c=>[c[0],c[1]+' '+c[0]])}],
    onSave:o=>{if(!o.name||!o.amount)return false;o.day=Math.max(1,Math.min(31,Math.round(o.day||1)));if(isNew)D.bills.push(Object.assign({id:uid(),paid:[]},o));else Object.assign(b,o)},
    onDelete:isNew?null:()=>{D.bills=D.bills.filter(x=>x.id!==b.id)}});
}
function medForm(id){
  let m=id?D.meds.find(x=>x.id===id):null;const isNew=!m;if(!m)m={name:'',dose:'',times:['08:00']};
  openForm({title:'Эм',fields:[{k:'name',l:'Эмийн нэр',value:m.name},{k:'dose',l:'Тун',value:m.dose,ph:'1 шахмал, 500мг…'},
    {k:'times',l:'Уух цагууд (таслалаар)',value:(m.times||[]).join(', '),ph:'08:00, 20:00'}],
    onSave:o=>{if(!o.name)return false;o.times=o.times.split(/[,\s]+/).map(t=>{const mm=t.match(/^(\d{1,2})(?::(\d{2}))?$/);return mm&&+mm[1]<24?pad(+mm[1])+':'+(mm[2]||'00'):null}).filter(Boolean).sort();
      if(isNew)D.meds.push(Object.assign({id:uid()},o));else Object.assign(m,o)},
    onDelete:isNew?null:()=>{D.meds=D.meds.filter(x=>x.id!==m.id)}});
}
function measForm(id,type){
  let h=id?D.health.find(x=>x.id===id):null;const isNew=!h;if(!h)h={type:type||'weight',value:null,value2:null,date:today(),note:''};
  const f=[{k:'type',l:'Төрөл',type:'select',value:h.type,options:Object.entries(MEAS).map(([k,v])=>[k,v.i+' '+v.l])}];
  f.push(h.type==='bp'?[{k:'value',l:'Дээд',type:'number',value:h.value},{k:'value2',l:'Доод',type:'number',value:h.value2}]:{k:'value',l:'Утга'+(MEAS[h.type].u?' ('+MEAS[h.type].u+')':''),type:'number',value:h.value});
  f.push({k:'date',l:'Огноо',type:'date',value:h.date},{k:'note',l:'Тэмдэглэл',value:h.note});
  openForm({title:'Хэмжилт',fields:f,
    onSave:o=>{if(o.type!==h.type&&isNew){closeSheet();measForm(null,o.type);return false}if(o.value==null){toast('Утгаа оруулна уу');return false}
      if(isNew)D.health.push(Object.assign({id:uid(),created:Date.now()},o));else Object.assign(h,o)},
    onDelete:isNew?null:()=>{D.health=D.health.filter(x=>x.id!==h.id)}});
  $('#f_type').onchange=e=>{if(isNew){closeSheet();measForm(null,e.target.value)}};
}
function habitForm(id){
  let h=id?D.habits.find(x=>x.id===id):null;const isNew=!h;if(!h)h={name:'',icon:'🌱'};
  openForm({title:'Зуршил',fields:[[{k:'icon',l:'Тэмдэг',value:h.icon},{k:'name',l:'Нэр',value:h.name,ph:'Ном унших'}]],
    onSave:o=>{if(!o.name)return false;if(isNew)D.habits.push(Object.assign({id:uid()},o));else Object.assign(h,o)},
    onDelete:isNew?null:()=>{D.habits=D.habits.filter(x=>x.id!==h.id)}});
}
function choreForm(id){
  let c=id?D.chores.find(x=>x.id===id):null;const isNew=!c;if(!c)c={name:'',every:7,last:''};
  openForm({title:'Гэрийн ажил',fields:[{k:'name',l:'Нэр',value:c.name,ph:'Шүүлтүүр солих'},[{k:'every',l:'Хэдэн хоног тутам',type:'number',value:c.every},{k:'last',l:'Сүүлд хийсэн',type:'date',value:c.last}]],
    onSave:o=>{if(!o.name)return false;o.every=Math.max(1,Math.round(o.every||7));if(isNew)D.chores.push(Object.assign({id:uid()},o));else Object.assign(c,o)},
    onDelete:isNew?null:()=>{D.chores=D.chores.filter(x=>x.id!==c.id)}});
}

/* ===================== Хурдан нэмэх ===================== */
function openQuick(){
  openSheet(`<h3>Хурдан нэмэх</h3>
    <textarea id="qIn" rows="2" placeholder="Юу ч бичээрэй…"></textarea>
    <div id="qPrev" class="qprev"></div>
    <div class="row-btns"><button class="btn ghost" onclick="quickEdit()">✏️ Дэлгэрэнгүй</button><span class="sp"></span><button class="btn primary" onclick="quickSave()">Нэмэх</button></div>
    <div class="hint" style="margin-top:12px">Жишээ: <code>маргааш 10-д Батаатай уулзалт</code> <code>баасан гарагт ээжийнд очих</code> <code>12/05 эмчид үзүүлэх</code> <code>хоол 12000</code> <code>такси 8к</code> <code>+цалин 2сая</code> <code>авах: талх, сүү</code> <code>тэмдэглэл: санаа…</code></div>
    <div class="manual">
      <button onclick="itemForm(null,{})">✅ Ажил</button><button onclick="itemForm(null,{type:'event',date:today()})">📅 Уулзалт</button><button onclick="noteForm(null)">📝 Тэмдэглэл</button><button onclick="quickPhoto()">📷 Зураг</button>
      <button onclick="txForm(null,'out')">💸 Зарлага</button><button onclick="txForm(null,'in')">💵 Орлого</button><button onclick="measForm(null)">📈 Хэмжилт</button>
      <button onclick="apptForm(null)">🩺 Эмчийн цаг</button><button onclick="apptForm(null,{appt:'lab',remind:'eve'})">🧪 Шинжилгээ</button><button onclick="medForm(null)">💊 Эм</button>
    </div>`);
  const el=$('#qIn');el.oninput=qPreview;el.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();quickSave()}};
  setTimeout(()=>el.focus(),60);qPreview();
}
function qDescribe(p){
  if(!p)return '<span class="small">Бичихэд юу үүсгэхийг энд харуулна.</span>';
  if(p.kind==='note')return `<span class="k">📝 Тэмдэглэл</span> — ${esc(p.title)}${p.tags.length?' · '+p.tags.map(t=>'#'+esc(t)).join(' '):''}`;
  if(p.kind==='report'){const e=Object.entries(p.rooms);return `<span class="k">📋 Тайлан</span> · ${dayLabel(p.date)} · ${e.length?e.map(([k,v])=>esc(k)+(v.n!=null?' тодгүй <b>'+v.n+'</b>':'')+(v.c!=null?' тодтой <b>'+v.c+'</b>':'')).join(', '):'өрөө, тоогоо бичнэ үү (жишээ: CT 3 ce 6, MRI 4)'}`}
  if(p.kind==='ot')return `<span class="k">⏱ Илүү цаг</span> · ${dayLabel(p.date)} · ${p.hours?'<b>'+fmtH(p.hours)+' цаг</b>':'<b>цагаа оруулна</b>'}${p.start?' ('+p.start+'–'+p.end+')':''}${p.note?' — '+esc(p.note):''}`;
  if(p.kind==='shop')return `<span class="k">🛒 Худалдан авах</span> — ${p.list.map(esc).join(', ')||'…'}`;
  if(p.kind==='tx')return `<span class="k">${p.type==='in'?'💵 Орлого':'💸 Зарлага'}</span> · <b>${money(p.amount)}</b> · ${catIcon(p.cat)} ${esc(p.cat)}${p.note?' — '+esc(p.note):''}${p.date!==today()?' · '+dayLabel(p.date):''}`;
  const c=CATS[p.cat];
  if(p.appt)return `<span class="k">${APPT[p.appt].i} ${APPT[p.appt].l}</span> · ${p.date?dayLabel(p.date):'<b>огноо сонгоно</b>'}${p.time?' '+p.time:''} · 🔔 ${p.remind==='eve'?'өмнөх орой':'1 өдөр өмнө'} + 1 цаг өмнө<br>“${esc(p.title)}”`;
  return `<span class="k">${p.type==='event'?'📅 Уулзалт':'✅ Ажил'}</span> · ${p.date?dayLabel(p.date):'хугацаагүй'}${p.time?' '+p.time:''} · <span class="dot" style="background:${c.c}"></span> ${c.l}${p.repeat==='year'?' · 🔁 жил бүр':''}<br>“${esc(p.title)}”`;
}
function qPreview(){$('#qPrev').innerHTML=qDescribe(parseQuick($('#qIn').value))}
function quickSave(){
  const p=parseQuick($('#qIn').value);if(!p)return;
  if(p.kind==='note'){if(!p.body)return;D.notes.push({id:uid(),title:p.title,body:p.body,tags:p.tags,pinned:false,updated:Date.now()})}
  else if(p.kind==='shop'){p.list.forEach(x=>D.shopping.push({id:uid(),text:x,done:false}))}
  else if(p.kind==='report'){if(!Object.keys(p.rooms).length){closeSheet();UI.repDay=p.date;return setView('report')}const cur=Object.assign({},(repGet(p.date)||{}).rooms);Object.entries(p.rooms).forEach(([k,v])=>{const name=rooms().find(r=>r.toLowerCase()===k.toLowerCase())||k;const o=rv(cur[name]);if(v.n!=null)o.n=v.n;if(v.c!=null)o.c=v.c;cur[name]=o;if(!rooms().includes(name))D.settings.rooms=[...rooms(),name]});repSave(p.date,cur)}
  else if(p.kind==='ot'){if(!p.hours){closeSheet();return otForm(null,p)}(D.ot=D.ot||[]).push({id:uid(),date:p.date,start:p.start,end:p.end,hours:p.hours,note:p.note,created:Date.now()})}
  else if(p.kind==='tx'){D.tx.push({id:uid(),type:p.type,amount:p.amount,cat:p.cat,note:p.note,date:p.date,created:Date.now()})}
  else{if(p.appt&&!p.date){closeSheet();return apptForm(null,p)}
    const it={id:uid(),type:p.type,title:p.title,cat:p.cat,date:p.date,time:p.time,remind:p.remind,repeat:p.repeat,note:'',created:Date.now()};
    if(p.appt)Object.assign(it,{appt:p.appt,remind2:p.remind2,place:'',prep:''});D.items.push(it)}
  save();closeSheet();render();toast('✓ Нэмлээ');
}
function quickEdit(){
  const p=parseQuick($('#qIn').value);
  if(!p)return itemForm(null,{});
  if(p.kind==='note')return noteForm(null,{title:p.title,body:p.body,tags:p.tags});
  if(p.kind==='shop'){UI.life='home';closeSheet();return setView('life')}
  if(p.kind==='report'){closeSheet();UI.repDay=p.date;return setView('report')}
  if(p.kind==='ot')return otForm(null,{date:p.date,start:p.start,end:p.end,hours:p.hours,note:p.note});
  if(p.kind==='tx')return txForm(null,p.type,{amount:p.amount,cat:p.cat,note:p.note,date:p.date});
  if(p.appt)return apptForm(null,{appt:p.appt,title:p.title,date:p.date,time:p.time,remind:p.remind,remind2:p.remind2});
  itemForm(null,{type:p.type,title:p.title,cat:p.cat,date:p.date,time:p.time,remind:p.remind,repeat:p.repeat});
}

/* ===================== Хайлт ===================== */
function openSearch(){
  openSheet(`<h3>🔍 Хайх</h3><input id="sIn" placeholder="Ажил, тэмдэглэл, гүйлгээ…"><div id="sRes" style="margin-top:10px"></div>`);
  const el=$('#sIn');el.oninput=()=>{const q=el.value.trim().toLowerCase();if(q.length<2){$('#sRes').innerHTML='';return}
    const r=[];
    D.items.filter(i=>(i.title+' '+(i.note||'')).toLowerCase().includes(q)).forEach(i=>r.push(`<div class="row"><div class="main" onclick="itemForm('${i.id}')"><div class="ttl">${i.type==='event'?'📅':'✅'} ${esc(i.title)}</div><div class="meta">${i.date?dayLabel(i.date):'хугацаагүй'}${isDone(i,i.date)?' · дууссан':''}</div></div></div>`));
    D.notes.filter(n=>(n.title+' '+n.body+' '+(n.photos||[]).map(p=>p.cap).join(' ')).toLowerCase().includes(q)).forEach(n=>r.push(`<div class="row"><div class="main" onclick="noteForm('${n.id}')"><div class="ttl">📝 ${esc(n.title||'Гарчиггүй')}</div><div class="meta">${esc(n.body.slice(0,60))}</div></div></div>`));
    D.tx.filter(x=>(x.note+' '+x.cat).toLowerCase().includes(q)).slice(0,20).forEach(x=>r.push(`<div class="row"><div class="main" onclick="txForm('${x.id}')"><div class="ttl">${catIcon(x.cat)} ${esc(x.note||x.cat)}</div><div class="meta">${dayLabel(x.date)}</div></div><span class="amt ${x.type}">${money(x.amount)}</span></div>`));
    $('#sRes').innerHTML=r.join('')||'<div class="empty">Олдсонгүй.</div>'};
  setTimeout(()=>el.focus(),60);
}
