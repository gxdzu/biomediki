// ══════════════════════════════════════════════
// DIRECT MESSAGES (личные чаты)
// ══════════════════════════════════════════════
let curDmPartner = null; // имя собеседника
let dmMessages   = {};   // {dmKey: [messages]}
let dmLastSeen   = {};   // {dmKey: lastTs} — для непрочитанных
let dmPolling    = null;

function dmKey(a, b){
  // стабильный ключ из двух имён
  return [a,b].sort().join('__');
}

function loadDmSeen(){
  try{ dmLastSeen = JSON.parse(localStorage.getItem('sg_dm_seen')||'{}'); }catch(e){ dmLastSeen={}; }
}
function saveDmSeen(){ localStorage.setItem('sg_dm_seen', JSON.stringify(dmLastSeen)); }

// ── OPEN DM ──
function openDm(partnerName){
  curDmPartner = partnerName;
  const c = avatarColor(partnerName);

  const avEl = document.getElementById('dm-hdr-av');
  if(avEl){ avEl.textContent=partnerName[0].toUpperCase(); avEl.style.background=c.bg; avEl.style.border=`.5px solid ${c.bd}`; avEl.style.color=c.tx; }

  const nameEl = document.getElementById('dm-hdr-name');
  if(nameEl) nameEl.textContent = partnerName;

  document.getElementById('member-profile-modal')?.classList.add('hidden');
  navigate('dm');
  loadDmMessages();

  // start polling for this DM
  if(dmPolling) clearInterval(dmPolling);
  dmPolling = setInterval(loadDmMessages, 2000);
}

function openDmFromSheet(){
  const name = document.getElementById('msheet-name')?.textContent;
  if(name) openDm(name);
}

// ── LOAD & RENDER ──
async function loadDmMessages(){
  const myName = D.currentUser?.name; if(!myName||!curDmPartner) return;
  const key = dmKey(myName, curDmPartner);
  try{
    const data = await fbGet(`dms/${key}`);
    const arr = data ? Object.values(data).sort((a,b)=>a.ts-b.ts) : [];
    dmMessages[key] = arr;
    renderDmMsgs(arr);
    // mark as read
    if(arr.length){ dmLastSeen[key]=arr[arr.length-1].ts; saveDmSeen(); updateDmBadge(); }
  }catch(e){}
}

function renderDmMsgs(msgs){
  const el = document.getElementById('dm-msgs'); if(!el) return;
  if(!msgs.length){ el.innerHTML='<div class="chat-empty">начните диалог...</div>'; return; }
  const wasAtBottom = el.scrollHeight-el.scrollTop-el.clientHeight<80;
  const myName = D.currentUser?.name;
  let lastDate=null;
  el.innerHTML = msgs.map(m=>{
    const me = m.author===myName;
    let dateSep='';
    if(m.ts){
      const d=new Date(m.ts);
      const ds=`${d.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][d.getMonth()]}`;
      if(ds!==lastDate){ dateSep=`<div class="chat-day-sep">${ds}</div>`; lastDate=ds; }
    }
    return `${dateSep}<div class="msg-row ${me?'me':''}">
      ${!me?`<div style="width:28px;flex-shrink:0"></div>`:''}
      <div class="msg-col">
        <div class="msg-bbl">${esc(m.text)}</div>
        <div class="msg-footer"><span class="msg-time">${m.time||''}</span></div>
      </div>
    </div>`;
  }).join('');
  if(wasAtBottom) el.scrollTop=el.scrollHeight;
}

async function sendDm(){
  const inp = document.getElementById('dm-inp');
  const txt = inp?.value.trim(); if(!txt||!curDmPartner) return;
  const myName = D.currentUser?.name; if(!myName) return;
  inp.value='';
  const key = dmKey(myName, curDmPartner);
  const msg = { author:myName, text:txt, ts:Date.now(), time:nowTime() };
  // optimistic
  if(!dmMessages[key]) dmMessages[key]=[];
  dmMessages[key].push(msg);
  renderDmMsgs(dmMessages[key]);
  try{
    await fbPost(`dms/${key}`, msg);
    notifyIfNeeded(`💬 ${myName}`, txt);
  }catch(e){ toast('ошибка отправки'); }
}

// ── DM LIST ──
async function renderDmList(){
  const el = document.getElementById('dm-list'); if(!el) return;
  const myName = D.currentUser?.name; if(!myName) return;
  loadDmSeen();

  // Get all members except self
  const members = (fbMembers.length?fbMembers:D.members).filter(m=>m.name!==myName);

  if(!members.length){
    el.innerHTML='<div style="text-align:center;padding:40px 20px;color:var(--text3);font-family:var(--serif);font-style:italic">участников пока нет</div>';
    return;
  }

  // Load last messages for each DM
  const previews = await Promise.all(members.map(async m=>{
    const key = dmKey(myName, m.name);
    try{
      const data = await fbGet(`dms/${key}`);
      const msgs = data ? Object.values(data).sort((a,b)=>b.ts-a.ts) : [];
      const last = msgs[0]||null;
      const unread = last && (last.ts||0) > (dmLastSeen[key]||0) && last.author!==myName ? 1 : 0;
      return {member:m, last, unread};
    }catch(e){ return {member:m, last:null, unread:0}; }
  }));

  // Sort: with messages first, then by last ts
  previews.sort((a,b)=>{
    if(!a.last&&!b.last) return 0;
    if(!a.last) return 1; if(!b.last) return -1;
    return (b.last.ts||0)-(a.last.ts||0);
  });

  el.innerHTML = previews.map(({member:m, last, unread})=>{
    const c = avatarColor(m.name);
    return `<div class="dm-item" onclick="openDm('${m.name}')">
      <div style="width:46px;height:46px;border-radius:50%;background:${c.bg};border:.5px solid ${c.bd};color:${c.tx};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:500;flex-shrink:0">${m.name[0].toUpperCase()}</div>
      <div class="dm-item-body">
        <div class="dm-item-name">${esc(m.name)}</div>
        <div class="dm-item-preview">${last?esc(last.text.slice(0,40)):'начать диалог...'}</div>
      </div>
      ${unread?`<div class="dm-unread-badge">${unread}</div>`:''}
    </div>`;
  }).join('');
}

function updateDmBadge(){
  loadDmSeen();
  const myName = D.currentUser?.name; if(!myName) return;
  let total = 0;
  Object.entries(dmMessages).forEach(([key, msgs])=>{
    if(!msgs.length) return;
    const last = msgs[msgs.length-1];
    if(last.author!==myName && (last.ts||0)>(dmLastSeen[key]||0)) total++;
  });
  const badge = document.getElementById('dm-badge');
  if(badge){ badge.style.display=total?'block':'none'; badge.textContent=total; }
}
