/* ===================== Өгөгдөл ===================== */
const KEY='miniiudur.v1';
const DEF={items:[],notes:[],tx:[],bills:[],budget:0,meds:[],medLog:{},health:[],water:{},habits:[],habitLog:{},shopping:[],chores:[],journal:{},
  ot:[],reports:[],settings:{name:'',theme:'auto',fs:16,notify:false,waterGoal:8,otRate:0,shiftLink:'',rooms:['CT','MRI','Рентген'],contrastRooms:['CT','MRI'],reportRemind:'20:00'},notified:{}};
const SHEET_LINK='https://docs.google.com/spreadsheets/d/1seWg1MBaKH9GCyZ6A-U-omfMONuJNxLg/edit';
const shiftLink=()=>D.settings.shiftLink||SHEET_LINK;
const RT_LINK='https://docs.google.com/spreadsheets/d/1Cydu4P2CNALnXbmuBVTrnzQDd-NcQgse_oOkfZKvgC0/edit?gid=41314390#gid=41314390';
const rtLink=()=>D.settings.rtLink||RT_LINK;
function load(){
  try{const x=JSON.parse(localStorage.getItem(KEY)||'null');const d=JSON.parse(JSON.stringify(DEF));
    if(x){Object.assign(d,x);d.settings=Object.assign({},DEF.settings,x.settings||{})}return d}
  catch(e){return JSON.parse(JSON.stringify(DEF))}
}
let D=load();
(D.reports||[]).forEach(r=>{Object.keys(r.rooms||{}).forEach(k=>{const m=k.match(/^(.+?)\s+тодосгогчтой$/i);if(!m)return;const base=m[1];const v=r.rooms[k];const o=typeof r.rooms[base]==='object'&&r.rooms[base]?r.rooms[base]:{n:+r.rooms[base]||0,c:0};o.c=(o.c||0)+(typeof v==='number'?v:(+v.n||0)+(+v.c||0));r.rooms[base]=o;delete r.rooms[k]})});
if(D.settings.rooms)D.settings.rooms=D.settings.rooms.filter(k=>!/\sтодосгогчтой$/i.test(k));
if((D.exams||[]).length){D.reports=D.reports||[];D.exams.forEach(e=>{if(!D.reports.some(r=>r.date===e.date)){const r={};if(e.ct)r['CT']=e.ct;if(e.ce)r['CT тодосгогчтой']=e.ce;D.reports.push({id:e.date,date:e.date,rooms:r,note:''})}});D.exams=[]}
['examUrl','examKey','examName','examRemind','examLink'].forEach(k=>delete D.settings[k]);try{localStorage.removeItem(KEY+'.exq')}catch(e){}
// Хасагдсан ээлжийн хуваарийн үлдэгдлийг цэвэрлэнэ
D.items=(D.items||[]).filter(i=>i.source!=='sheet');['sheetUrl','sheetKey','sheetName','sheetRemind','sheetLast'].forEach(k=>delete D.settings[k]);delete D.sheetPeople;
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){toast('⚠️ Хадгалж чадсангүй')}}
function save(){saveLocal();cloudSchedule()}

/* ===================== Туслах функцүүд ===================== */
// PARSER-START
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseD=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
let _now=null; // тест хийхэд
const now=()=>_now?new Date(_now):new Date();
const today=()=>ymd(now());
const addDays=(s,n)=>{const d=parseD(s);d.setDate(d.getDate()+n);return ymd(d)};
const diffDays=(a,b)=>Math.round((parseD(b)-parseD(a))/864e5);
const WD=['Ням','Даваа','Мягмар','Лхагва','Пүрэв','Баасан','Бямба'];
const WD_RE={'даваа':1,'мягмар':2,'лхагва':3,'пүрэв':4,'баасан':5,'бямба':6,'ням':0};
const CATS={ajil:{l:'Ажил',c:'var(--work)'},huviin:{l:'Хувийн',c:'var(--me)'},ger:{l:'Гэр бүл',c:'var(--fam)'},eruul:{l:'Эрүүл мэнд',c:'var(--ok)'}};
const APPT={doctor:{l:'Эмчид үзүүлэх',i:'🩺'},lab:{l:'Шинжилгээ өгөх',i:'🧪'},hospital:{l:'Эмнэлэг / процедур',i:'🏥'},dental:{l:'Шүдний эмч',i:'🦷'},vaccine:{l:'Вакцин, тариа',i:'💉'},other:{l:'Бусад',i:'📋'}};
const HEALTH_RE=/эмчид|эмч(\s|ийн|тэй)|үзлэг|үзүүлэх|шинжилгээ|эмнэлэг|шүдний|вакцин|тариа/;
function apptKind(L){return /шинжилгээ|цус|шээс/.test(L)?'lab':/шүд/.test(L)?'dental':/вакцин|тариа/.test(L)?'vaccine':/эмнэлэг|хэвтэх|рентген|хэт авиа|мри|mri|эхо|процедур/.test(L)?'hospital':'doctor'}
const EXP_CATS=[
  ['Унаа','🚕',/такси|автобус|унаа|убкаб|метро|галт тэрэг|онгоц/],
  ['Хоол','🍜',/хоол|кофе|ресторан|цай|бууз|хуушуур|пицца|кафе|үдийн|зууш|хүргэлт/],
  ['Хүнс','🛒',/хүнс|дэлгүүр|талх|сүү|мах|ногоо|жимс|супермаркет|эмарт|номин|сангийн/],
  ['Машин','⛽',/бензин|шатахуун|машин|зогсоол|засвар|угаалга|даатгал/],
  ['Зугаа','🍸',/кино|тоглоом|аялал|концерт|баар|клуб|найз/],
  ['Төлбөр','🏠',/түрээс|цахилгаан|дулаан|сөх|төлбөр|зээл|ус төлбөр|байр/],
  ['Гэр бүл','👨‍👩‍👧',/хүүхэд|сургууль|цэцэрлэг|ээж|аав|эхнэр|нөхөр|гэр бүл/],
  ['Спорт','🏋️',/фитнес|спорт|бассейн|заал|йог/],
  ['Хувцас','👕',/хувцас|гутал|цамц|өмд|куртик|малгай/],
  ['Бэлэг','🎁',/бэлэг|цэцэг/],
  ['Ариун цэвэр','🧴',/шампунь|саван|гоо сайхан|үсчин|ариун|крем/],
  ['Эрүүл мэнд','💊',/(^|\s)эм(\s|$)|эмнэлэг|шинжилгээ|үзлэг|эмийн|шүд/],
  ['Утас','📱',/утас|нэгж|интернет|дата|юнител|мобиком|скайтел/],
  ['Бусад','📦',/$^/]];
const INC_CATS=['Цалин','Бонус','Нэмэлт орлого','Бусад орлого'];
const guessExp=t=>{for(const c of EXP_CATS)if(c[2].test(t))return c[0];return 'Бусад'};
const catIcon=c=>(EXP_CATS.find(x=>x[0]===c)||['', INC_CATS.includes(c)?'💵':'📦'])[1];
const FAM_RE=/гэр бүл|(^|\s)(ээж|аав|эхнэр|нөхөр|охин|хүүхэд|эгч|дүү|өвөө|эмээ|хадам)|(^|\s)хүү(\s|г|т|д|$)|(^|\s)ах(\s|т|ынх)|төрсөн өдөр/;
const WORK_RE=/ажил|хурал|оффис|тайлан|үйлчлүүлэгч|захирал|төсөл|имэйл|и-мэйл|гэрээ|танилцуулга|менежер|баг(\s|ийн)|ярилцлага/;
const EVENT_RE=/уулзалт|уулзах|хурал|төрсөн өдөр|үзлэг|эмчид|шинжилгээ|эмнэлэг|вакцин|зоог|найр|ярилцлага|сургалт|тэмцээн|баяр|хурим/;
const INCOME_RE=/цалин|орлого|бонус|урамшуулал|ирсэн|олсон|буцаалт/;

function parseQuick(raw){
  const src=(raw||'').trim();
  if(!src) return null;
  let m;
  if(m=src.match(/^(тэмдэглэл|санаа|т)\s*[:：]\s*([\s\S]*)$/i)){
    const body=m[2].trim();
    return {kind:'note',title:body.split('\n')[0].slice(0,60),body,tags:(body.match(/#[^\s#]+/g)||[]).map(t=>t.slice(1))};
  }
  if(/илүү\s*цаг/i.test(src))return parseOT(src);
  if(/^\s*тайлан\s*$/i.test(src)||(/(^|\s)тайлан(\s|:|$)/i.test(src)&&/\d/.test(src))||/^(ct|mri|мри|рентген|пэт|pet|эхо|хэт авиа)\s*[:=-]?\s*\d/i.test(src)||(/тодосгогч|тодтой|тодгүй/i.test(src)&&/\d/.test(src)))return parseReport(src);
  if(m=src.match(/^(авах|дэлгүүр|худалдаж авах)\s*[:：]\s*([\s\S]*)$/i)){
    return {kind:'shop',list:m[2].split(/[,;\n]/).map(x=>x.trim()).filter(Boolean)};
  }
  let s=' '+src+' ';
  const low=()=>s.toLowerCase();
  const t0=today();
  let date=null,time=null;
  const cut=re=>{s=s.replace(re,' ')};
  // Огноо
  if(m=low().match(/\s(өнөөдөр|өнөө)(\s|$)/)){date=t0;cut(new RegExp('\\s'+m[1]+'(?=\\s)','i'))}
  else if(m=low().match(/\s(маргааш)\S*/)){date=addDays(t0,1);cut(/\sмаргааш\S*/i)}
  else if(m=low().match(/\s(нөгөөдөр)\S*/)){date=addDays(t0,2);cut(/\sнөгөөдөр\S*/i)}
  else if(m=low().match(/\s(өчигдөр)\S*/)){date=addDays(t0,-1);cut(/\sөчигдөр\S*/i)}
  if(!date && (m=low().match(/\s(ирэх\s+)?(даваа|мягмар|лхагва|пүрэв|баасан|бямба|ням)(\s*гар[иа]г\S*|-?н?д|т)(?=\s)/))){
    const idx=WD_RE[m[2]];let d=(idx-now().getDay()+7)%7;if(d===0&&m[1])d=7;
    date=addDays(t0,d);s=s.slice(0,m.index)+' '+s.slice(m.index+m[0].length);
  }
  if(!date && (m=low().match(/\s(\d{1,2})\s*(?:сарын|сар)\s*(\d{1,2})(?:-?н[ыи]|-?нд|-?д|-?т|\S*)?(?=\s)/))){
    date=mkDate(+m[1],+m[2]);if(date)s=s.slice(0,m.index)+' '+s.slice(m.index+m[0].length);
  }
  if(!date && (m=low().match(/\s(\d{1,2})[./](\d{1,2})(?:-?нд|-?д|-?т)?(?=\s)/))){
    date=mkDate(+m[1],+m[2]);if(date)s=s.slice(0,m.index)+' '+s.slice(m.index+m[0].length);
  }
  // Цаг
  let h=null,mi=0;
  if(m=low().match(/\s(\d{1,2})[:](\d{2})(?:-?д|-?т|-?аас|-?оос)?(?=\s)/)){h=+m[1];mi=+m[2];s=s.slice(0,m.index)+' '+s.slice(m.index+m[0].length)}
  else if(m=low().match(/\s(\d{1,2})\s*(?:цаг(?:т|аас|ийн)?|-д|-т|д|т)(?=\s)/)){h=+m[1];s=s.slice(0,m.index)+' '+s.slice(m.index+m[0].length)}
  if(h!==null && h<=23 && mi<=59){
    const L=low();
    if(/орой|үдээс хойш|шөнө/.test(L) && h<12) h+=12;
    else if(!/өглөө/.test(L) && h>=1 && h<=6) h+=12;
    time=pad(h)+':'+pad(mi);
    cut(/\s(өглөө|орой|үдээс хойш)(?=\s)/i);
    if(!date) date=t0;
  }
  // Мөнгө
  const L=low();
  let amount=null,income=false;
  if(!time && (m=L.match(/\s(\+)?(\d[\d,']*(?:\.\d+)?)\s*(к|k|мянга|мянган|сая|₮|төг\S*)?(?=\s)/))){
    let n=parseFloat(m[2].replace(/[,']/g,''));const suf=m[3]||'';
    if(/^(к|k|мянга|мянган)$/.test(suf))n*=1000; else if(suf==='сая')n*=1e6;
    if((suf||n>=100) && !EVENT_RE.test(L)){amount=Math.round(n);income=!!m[1]||/^\s*\+/.test(L)||INCOME_RE.test(L);s=s.slice(0,m.index)+' '+s.slice(m.index+m[0].length)}
  }
  const title=s.replace(/\s+/g,' ').replace(/^[\s,.\-–:+]+|[\s,.\-–:]+$/g,'').trim();
  if(amount!==null){
    return {kind:'tx',type:income?'in':'out',amount,note:title,cat:income?'Цалин':guessExp(L),date:date||t0};
  }
  if(HEALTH_RE.test(L)&&!/төрсөн өдөр/.test(L)){
    const k=apptKind(L);
    return {kind:'item',type:'event',appt:k,title:title||src,date:date||'',time:time||'',cat:'eruul',repeat:'',remind:k==='lab'?'eve':1440,remind2:60};
  }
  const cat=FAM_RE.test(L)?'ger':WORK_RE.test(L)?'ajil':'huviin';
  const isEvent=!!time||EVENT_RE.test(L);
  let repeat='';
  if(/төрсөн өдөр/.test(L)) repeat='year';
  return {kind:'item',type:isEvent?'event':'task',title:title||src,date:date||'',time:time||'',cat,repeat,remind:isEvent?15:0};
}
// Илүү цаг: "илүү цаг 3", "өчигдөр илүү цаг 18:00-21:00", "11/20 илүү цаг 17-20 тайлан"
const hmMin=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
function otHours(a,b){let d=hmMin(b)-hmMin(a);if(d<=0)d+=1440;return Math.round(d/6)/10}
function parseOT(src){
  let s=' '+src.replace(/илүү\s*цаг(аар|ийн)?/i,' ')+' ';let date=today(),m;const L=s.toLowerCase();
  if(/\sөчигдөр/.test(L)){date=addDays(date,-1);s=s.replace(/\sөчигдөр\S*/i,' ')}
  else if(/\sуржигдар/.test(L)){date=addDays(date,-2);s=s.replace(/\sуржигдар\S*/i,' ')}
  else s=s.replace(/\s(өнөөдөр|өнөө)\S*/i,' ');
  if(m=s.match(/\s(\d{1,2})\/(\d{1,2})(?:-?нд|-?д|-?т)?(?=\s)/)){let d=mkDate(+m[1],+m[2]);if(d){if(d>today())d=(+d.slice(0,4)-1)+d.slice(4);date=d;s=s.replace(m[0],' ')}}
  let start='',end='',hours=null;
  if(m=s.match(/\s(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?(?:\s*цаг\S*)?(?=\s)/)){
    if(+m[1]<24&&+m[3]<24){start=pad(+m[1])+':'+(m[2]||'00');end=pad(+m[3])+':'+(m[4]||'00');hours=otHours(start,end);s=s.replace(m[0],' ')}}
  else if(m=s.match(/\s(\d+(?:[.,]\d+)?)\s*(цаг\S*|ц)?(?=\s)/)){hours=parseFloat(m[1].replace(',','.'));s=s.replace(m[0],' ')}
  return {kind:'ot',date,start,end,hours,note:s.replace(/\s+/g,' ').trim()};
}
// Тайлан: "тайлан CT 3 ce 6", "CT тодосгогчгүй 3 тодосгогчтой 6", "CT 3/6", "өчигдөр тайлан MRI 4 рентген 20"
// Буцаах: rooms = {өрөө: {n?: тодосгогчгүй, c?: тодосгогчтой}}
function parseReport(src){
  let s=' '+src.replace(/(^|\s)тайлан\s*:?/i,' ')+' ';let date=today();
  if(/\sөчигдөр/i.test(s)){date=addDays(date,-1);s=s.replace(/\sөчигдөр\S*/i,' ')}
  const rooms={};let room=null,mode='n',lastWasWord=false,assigned=false;
  for(const tok of s.split(/[\s,;]+/).filter(Boolean)){
    const t=tok.toLowerCase();
    if(/^(тодосгогчгүй|тодгүй|гүй)$/.test(t)){mode='n';lastWasWord=false;continue}
    if(/^(тодосгогчтой|тодтой|тай|ce|се)$/.test(t)){if(!room)room='CT';mode='c';lastWasWord=false;continue}
    let m=t.match(/^(\d+)(?:[\/+](\d+))?$/);
    if(m){if(!room)continue;const o=rooms[room]=rooms[room]||{};if(m[2]!=null){o.n=+m[1];o.c=+m[2]}else o[mode]=+m[1];mode='n';lastWasWord=false;assigned=true;continue}
    if(lastWasWord&&room&&!assigned)room=room+' '+tok;else{room=tok;assigned=false}
    mode='n';lastWasWord=true;
  }
  Object.keys(rooms).forEach(k=>{if(!Object.keys(rooms[k]).length)delete rooms[k]});
  return {kind:'report',date,rooms};
}
function mkDate(mo,da){
  if(mo<1||mo>12||da<1||da>31)return null;
  const n=now();let y=n.getFullYear();
  let d=new Date(y,mo-1,da);if(d.getMonth()!==mo-1)return null;
  if(diffDays(ymd(d),today())>60)d=new Date(y+1,mo-1,da);
  return ymd(d);
}
// PARSER-END
const $=q=>document.querySelector(q);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Math.round(n||0).toLocaleString('en-US')+'₮';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const toMin=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
const ym=s=>s.slice(0,7);
function dayLabel(s){
  if(!s)return '';const t=today();
  if(s===t)return 'Өнөөдөр';if(s===addDays(t,1))return 'Маргааш';if(s===addDays(t,-1))return 'Өчигдөр';
  const d=parseD(s);return (d.getMonth()+1)+'/'+d.getDate()+' '+WD[d.getDay()];
}
function longDate(s){const d=parseD(s);return d.getFullYear()+' оны '+(d.getMonth()+1)+' сарын '+d.getDate()+', '+WD[d.getDay()]+' гараг'}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('on'),2200)}
