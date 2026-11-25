/* ===================== RT exam CT хүснэгт (зөвхөн харах) ===================== */
// Ээлжийн хуваарьтай ижил Apps Script, түлхүүр; f=rt. Мөр = өдөр (11/25), багана = нэр тус бүрийн CT / CE / Нийт.
const RTS_KEY=KEY+'.rt';
let rtsBusy=false,rtsErr='',rtsLast=0;
function openRt(){UI.rtTab=null;UI.rtPos=null;setView('rt');rtFetch(false)}
async function rtFetch(force){
  if(!rosterOn()||rtsBusy||(!force&&Date.now()-rtsLast<60000))return;
  rtsBusy=true;rtsErr='';const old=lsGet(RTS_KEY),url=D.settings.rosterUrl,key=D.settings.rosterKey;
  if(VIEW==='rt')render();
  try{
    const j=await sheetGet('rt',!force&&old&&old.url===url?old.modified:'');
    if(url===D.settings.rosterUrl&&key===D.settings.rosterKey){
      if(j.same)lsSet(RTS_KEY,Object.assign({},old,{at:Date.now()}));
      else{if(!Array.isArray(j.sheets))throw new Error('Хариу буруу байна');lsSet(RTS_KEY,{url,modified:j.modified,at:Date.now(),sheets:j.sheets.map(rosterTrim)})}
      rtsLast=Date.now()}
  }catch(e){rtsErr=sheetErr(e)}
  rtsBusy=false;if(VIEW==='rt')render();
}
function rtSheets(){const c=lsGet(RTS_KEY);return c&&c.url===D.settings.rosterUrl&&Array.isArray(c.sheets)?c.sheets:[]}
function rtCur(){const S=rtSheets(),cur=ym(today());let i=S.findIndex(s=>s.name===UI.rtTab);if(i<0)i=S.findIndex(s=>rosterYm(s.name)===cur);return i<0?S.length-1:i}
// Толгой: CT/CE мөр (sub), түүний дээрх нэрсийн мөр; first = эхний өдрийн мөр
function rtLayout(V){
  const isCT=v=>/^(CT|СТ)$/i.test(String(v||'').trim());
  const sub=V.slice(0,12).findIndex(r=>r.filter(isCT).length>=2),first=V.findIndex(r=>/^\d{1,2}[\/.]\d{1,2}$/.test(String(r[0]||'').trim()));
  if(sub<1||first<=sub)return null;
  const g=[];V[sub].forEach((v,c)=>{if(isCT(v)){const n=String(V[sub-1][c]||'').trim();if(n)g.push({name:n,c})}});
  g.forEach((x,i)=>x.end=i+1<g.length?g[i+1].c:V[sub].length);
  // сүүлийн нэрийн ард «Өдөрт нийт» багана байвал тэрийг оруулахгүй
  const next=V[sub-1].findIndex((v,c)=>g.length&&c>g[g.length-1].c&&String(v||'').trim());if(next>0)g[g.length-1].end=next;
  return {sub,first,g};
}
const rtGiven=n=>rosterNorm(String(n||'').replace(/^[А-ЯӨҮЁа-яөүё]{1,2}\.\s*/,'')); // З.Энхжаргал → энхжаргал
function rtTable(s,mine){
  const V=s.values,L=rtLayout(V);const R0=L?L.sub-1:0,first=L?L.first:0;
  const C=V.reduce((a,r)=>Math.max(a,r.length),0);let cols=Array.from({length:C},(_,c)=>c);
  if(mine&&L){const me=L.g.find(x=>rtGiven(x.name)===rtGiven(D.settings.rosterName));if(!me)return null;cols=cols.filter(c=>c===0||(c>=me.c&&c<me.end))}
  const t=today(),td=rosterYm(s.name)===ym(t)?t:'';
  const isToday=r=>{if(!td||r<first)return false;const m=String(V[r][0]||'').trim().match(/^(\d{1,2})[\/.](\d{1,2})$/);return !!m&&+m[1]===+td.slice(5,7)&&+m[2]===+td.slice(8,10)};
  // нийлсэн нүднүүдийг үлдсэн баганад тааруулна
  const span={},skip=new Set(),val={};
  s.merges.forEach(([r,c,h,w])=>{const k=cols.filter(x=>x>=c&&x<c+w);if(!k.length||r<R0)return;h=Math.min(h,V.length-r);if(r<first)h=Math.min(h,first-r);
    span[r+','+k[0]]=[h,k.length];if(k[0]!==c)val[r+','+k[0]]=[(V[r]||[])[c],(s.bg[r]||[])[c]];
    for(let i=r;i<r+h;i++)k.forEach(x=>{if(i!==r||x!==k[0])skip.add(i+','+x)})});
  const row=r=>`<tr>${cols.map(c=>{const k=r+','+c;if(skip.has(k))return '';const sp=span[k]||[1,1],ov=val[k];
    const b=(ov?ov[1]:(s.bg[r]||[])[c])||'',col=/^#[0-9a-f]{6}$/i.test(b)?b:'',v=ov?ov[0]:V[r][c];
    const cls=[c===0?'nm':'',isToday(r)?'td':''].filter(Boolean).join(' ');
    return `<td${cls?` class="${cls}"`:''}${sp[0]>1?` rowspan="${sp[0]}"`:''}${sp[1]>1?` colspan="${sp[1]}"`:''}${col?` style="--c:${col};background:${col};color:${rosterInk(col)}"`:''}>${esc(v===undefined?'':v)}</td>`}).join('')}</tr>`;
  const rows=V.map((_,r)=>r);
  return `<table class="ros rtsheet"><thead>${rows.filter(r=>r>=R0&&r<first).map(row).join('')}</thead><tbody>${rows.filter(r=>r>=first).map(row).join('')}</tbody></table>`;
}
function vRt(){
  const open=`<button class="btn sm" onclick="window.open(rtLink(),'_blank')">Хүснэгт нээх ↗</button>`;
  if(!rosterOn())return `<div class="card"><div class="empty">Эхлээд Ээлжийн хуваариа холбоно уу.</div><div class="btns">${open}</div></div>`;
  const c=lsGet(RTS_KEY),S=rtSheets(),i=rtCur(),s=S[i],at=S.length&&c.at?new Date(c.at):null,me=rosterMine();
  const tb=s?rtTable(s,me):'';
  return `<div class="btns" style="margin-bottom:10px">${S.map((x,k)=>`<button class="btn sm${k===i?' primary':''}" onclick="rtTab(${k})">${esc(rosterYm(x.name).replace('-','/')||x.name)}</button>`).join('')}</div>
    ${rtsErr?`<div class="card" style="color:var(--bad)">⚠️ ${esc(rtsErr)}</div>`:''}
    ${s?`<div class="seg"><button class="${me?'on':''}" onclick="UI.rtPos=null;rosterMode('me')">Зөвхөн би</button><button class="${me?'':'on'}" onclick="UI.rtPos=null;rosterMode('all')">Бүгд</button>${D.settings.rosterName?`<button onclick="UI.rtPos=null;rosterNameForm()" aria-label="Нэрээ солих">✎ ${esc(D.settings.rosterName)}</button>`:''}</div>
      <div class="roswrap" id="rtWrap">${tb||`<div class="empty" style="padding:14px">Энэ сарын хүснэгтэд «${esc(D.settings.rosterName)}» алга.</div>`}</div>`:rtsBusy?'<div class="card"><div class="empty">Татаж байна…</div></div>':rtsErr?'':'<div class="card"><div class="empty">Сарын хуудас олдсонгүй.</div></div>'}
    <div class="small" style="margin:8px 2px">${rtsBusy?'Шинэчилж байна…':at?'Сүүлд шалгасан: '+dayLabel(ymd(at))+' '+pad(at.getHours())+':'+pad(at.getMinutes()):''}</div>
    <div class="btns"><button class="btn sm" onclick="rtFetch(true)" ${rtsBusy?'disabled':''}>Шинэчлэх</button>${open}</div>`;
}
function rtTab(k){const s=rtSheets()[k];if(!s)return;UI.rtTab=s.name;UI.rtPos=null;render()}
// Эхэнд өнөөдрийн мөр рүү гүйлгэнэ, дараа нь байрыг хадгална
function rtAfter(){
  const w=$('#rtWrap');if(!w)return;
  if(UI.rtPos){w.scrollLeft=UI.rtPos[0];w.scrollTop=UI.rtPos[1]}
  else{const t=w.querySelector('td.td'),h=w.querySelector('thead');if(t)w.scrollTop=Math.max(0,t.parentNode.offsetTop-(h?h.offsetHeight:0)-110)}
  w.onscroll=()=>{if(w.isConnected)UI.rtPos=[w.scrollLeft,w.scrollTop]};
}
