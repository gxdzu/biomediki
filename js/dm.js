// ══════════════════════════════════════════════
// DIRECT MESSAGES
// ══════════════════════════════════════════════
let curDmPartner = null;
let dmMessages   = {};
let dmLastSeen   = {};
let dmPolling    = null;
let dmReplyTo    = null;
let editingDmKey = null;

function dmKey(a, b){ return [a,b].sort().join('__'); }

function loadDmSeen(){
  try{ dmLastSeen=JSON.parse(localStorage.getItem('sg_dm_seen')||'{}'); }catch(e){ dmLastSeen={}; }
}
function saveDmSeen(){ localStorage.setItem('sg_dm_seen',JSON.stringify(dmLastSeen)); }

// ── OPEN DM ──
function openDm(partnerName){
  curDmPartner=partnerName;
  const c=avatarColor(partnerName);
  const avEl=document.getElementById('dm-hdr-av');
  if(avEl){ avEl.textContent=partnerName[0].toUpperCase(); avEl.style.background=c.bg; avEl.style.border=`.5px solid ${c.bd}`; avEl.style.color=c.tx; }
  const nameEl=document.getElementById('dm-hdr-name');
  if(nameEl) nameEl.textContent=partnerName;
  // Show online status
  updateDmOnlineStatus();
  document.getElementById('member-profile-modal')?.classList.add('hidden');
  navigate('dm');
  loadDmMessages();
  if(dmPolling) clearInterval(dmPolling);
  dmPolling=setInterval(()=>{ loadDmMessages(); updateDmOnlineStatus(); },2000);
}

function openDmFromSheet(){
  const name=document.getElementById('msheet-name')?.textContent;
  if(name) openDm(name);
}

function updateDmOnlineStatus(){
  if(!curDmPartner) return;
  const ts=getLastSeen(curDmPartner);
  const statusEl=document.getElementById('dm-hdr-status');
  if(statusEl) statusEl.textContent=formatLastSeen(ts);
}

// ── REPLY ──
function setDmReply(author,text){
  dmReplyTo={author,text};
  const bar=document.getElementById('dm-reply-bar');
  if(bar){ bar.classList.remove('hidden'); document.getElementById('dm-reply-author').textContent=author; document.getElementById('dm-reply-text').textContent=text.slice(0,80)+(text.length>80?'…':''); }
  document.getElementById('dm-inp')?.focus();
}
function clearDmReply(){
  dmReplyTo=null;
  document.getElementById('dm-reply-bar')?.classList.add('hidden');
}

// ── EDIT / DELETE ──
function openDmMsgEdit(msgKey, text){
  editingDmKey=msgKey;
  const modal=document.getElementById('dm-msg-modal');
  const inp=document.getElementById('dm-msg-edit-inp');
  if(modal){ modal.classList.remove('hidden'); if(inp){ inp.value=text; inp.focus(); } }
}
function closeDmMsgModal(){
  editingDmKey=null;
  document.getElementById('dm-msg-modal')?.classList.add('hidden');
}
async function saveDmMsgEdit(){
  const text=document.getElementById('dm-msg-edit-inp')?.value.trim();
  if(!text||!editingDmKey||!curDmPartner) return;
  const myName=D.currentUser?.name;
  const key=dmKey(myName,curDmPartner);
  // find Firebase key — we need it from the raw data
  try{
    const data=await fbGet(`dms/${key}`);
    const entry=Object.entries(data||{}).find(([,v])=>v.ts===editingDmKey);
    if(entry){
      await fbSet(`dms/${key}/${entry[0]}/text`,text);
      await fbSet(`dms/${key}/${entry[0]}/edited`,true);
    }
    await loadDmMessages();
  }catch(e){ toast('ошибка'); }
  closeDmMsgModal();
}
async function delDmMsg(ts){
  if(!curDmPartner) return;
  const myName=D.currentUser?.name;
  const key=dmKey(myName,curDmPartner);
  try{
    const data=await fbGet(`dms/${key}`);
    const entry=Object.entries(data||{}).find(([,v])=>v.ts===ts);
    if(entry) await fbDelete(`dms/${key}/${entry[0]}`);
    await loadDmMessages();
  }catch(e){ toast('ошибка'); }
}

// ── LOAD & RENDER ──
async function loadDmMessages(){
  const myName=D.currentUser?.name; if(!myName||!curDmPartner) return;
  const key=dmKey(myName,curDmPartner);
  try{
    const data=await fbGet(`dms/${key}`);
    const arr=data?Object.values(data).sort((a,b)=>a.ts-b.ts):[];
    dmMessages[key]=arr;
    renderDmMsgs(arr);
    if(arr.length){ dmLastSeen[key]=arr[arr.length-1].ts; saveDmSeen(); updateDmBadge(); }
  }catch(e){}
}

function renderDmMsgs(msgs){
  const el=document.getElementById('dm-msgs'); if(!el) return;
  if(!msgs.length){el.innerHTML='<div class="chat-empty">начните диалог...</div>';return;}
  const wasAtBottom=el.scrollHeight-el.scrollTop-el.clientHeight<80;
  const myName=D.currentUser?.name;
  const myMsgs=msgs.filter(m=>m.author===myName);
  const lastMyTs=myMsgs.length?myMsgs[myMsgs.length-1].ts:null;
  let lastDate=null;
  el.innerHTML=msgs.map((m,idx)=>{
    const me=m.author===myName;
    let dateSep='';
    if(m.ts){
      const d=new Date(m.ts);
      const ds=`${d.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][d.getMonth()]}`;
      if(ds!==lastDate){dateSep=`<div class="chat-day-sep">${ds}</div>`;lastDate=ds;}
    }
    let replyHtml='';
    if(m.replyTo){
      const c=avatarColor(m.replyTo.author);
      replyHtml=`<div class="msg-reply-preview"><div class="msg-reply-line" style="background:${c.bd}"></div><div>
        <div style="font-size:11px;font-weight:500;color:${c.tx}">${esc(m.replyTo.author)}</div>
        <div style="font-size:12px;color:var(--text2)">${esc(m.replyTo.text||'').slice(0,50)}</div>
      </div></div>`;
    }
    const isLast=!msgs[idx+1]||msgs[idx+1].author!==m.author;
    const bblStyle=!isLast?(me?'border-radius:16px 16px 4px 16px':'border-radius:16px 16px 16px 4px'):'';
    const canEdit=me&&m.ts===lastMyTs;
    const canDel=me;
    const actions=`<div class="msg-actions">
      <button class="msg-act" onclick="setDmReply('${esc(m.author).replace(/'/g,"\\'")}','${esc(m.text).replace(/'/g,"\\'")}')">↩</button>
      ${canEdit?`<button class="msg-act" onclick="openDmMsgEdit(${m.ts},'${esc(m.text).replace(/'/g,"\\'")}')">✎</button>`:''}
      ${canDel?`<button class="msg-act" onclick="delDmMsg(${m.ts})">✕</button>`:''}
    </div>`;
    return `${dateSep}<div class="msg-row ${me?'me':''}">
      ${!me?`<div style="width:28px;flex-shrink:0"></div>`:''}
      <div class="msg-col">
        <div class="msg-bbl" style="${bblStyle}">${replyHtml}${esc(m.text)}${m.edited?` <span style="font-size:9px;color:var(--text3)">ред.</span>`:''}</div>
        <div class="msg-footer"><span class="msg-time">${m.time||''}</span>${actions}</div>
      </div>
    </div>`;
  }).join('');
  if(wasAtBottom) el.scrollTop=el.scrollHeight;
}

async function sendDm(){
  const inp=document.getElementById('dm-inp');
  const txt=inp?.value.trim(); if(!txt||!curDmPartner) return;
  const myName=D.currentUser?.name; if(!myName) return;
  inp.value='';
  document.getElementById('dm-emoji-picker')?.classList.add('hidden');
  const key=dmKey(myName,curDmPartner);
  const msg={author:myName,text:txt,ts:Date.now(),time:nowTime(),...(dmReplyTo?{replyTo:dmReplyTo}:{})};
  clearDmReply();
  if(!dmMessages[key]) dmMessages[key]=[];
  dmMessages[key].push(msg);
  renderDmMsgs(dmMessages[key]);
  try{ await fbPost(`dms/${key}`,msg); notifyIfNeeded(`💬 ${myName}`,txt); }
  catch(e){ toast('ошибка'); }
  updateOnlineStatus();
}

function toggleDmEmoji(){
  const picker=document.getElementById('dm-emoji-picker'); if(!picker) return;
  if(picker.classList.contains('hidden')){ picker.innerHTML=EMOJI_LIST.map(e=>`<button class="emoji-item" onclick="insertDmEmoji('${e}')">${e}</button>`).join(''); picker.classList.remove('hidden'); }
  else picker.classList.add('hidden');
}
function insertDmEmoji(emoji){
  const inp=document.getElementById('dm-inp'); if(!inp) return;
  const pos=inp.selectionStart||inp.value.length;
  inp.value=inp.value.slice(0,pos)+emoji+inp.value.slice(pos);
  inp.focus(); inp.selectionStart=inp.selectionEnd=pos+emoji.length;
  document.getElementById('dm-emoji-picker')?.classList.add('hidden');
}

// ── DM LIST & BADGE ──
async function renderDmList(){
  const el=document.getElementById('dm-list'); if(!el) return;
  const myName=D.currentUser?.name; if(!myName) return;
  loadDmSeen();
  const members=(fbMembers.length?fbMembers:D.members).filter(m=>m.name!==myName);
  if(!members.length){ el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text3);font-family:var(--serif);font-style:italic">участников пока нет</div>'; return; }
  const previews=await Promise.all(members.map(async m=>{
    const key=dmKey(myName,m.name);
    try{
      const data=await fbGet(`dms/${key}`);
      const msgs=data?Object.values(data).sort((a,b)=>b.ts-a.ts):[];
      const last=msgs[0]||null;
      const unread=last&&(last.ts||0)>(dmLastSeen[key]||0)&&last.author!==myName?1:0;
      return {member:m,last,unread};
    }catch(e){ return {member:m,last:null,unread:0}; }
  }));
  previews.sort((a,b)=>{ if(!a.last&&!b.last) return 0; if(!a.last) return 1; if(!b.last) return -1; return (b.last.ts||0)-(a.last.ts||0); });
  el.innerHTML=previews.map(({member:m,last,unread})=>{
    const c=avatarColor(m.name);
    const online=Date.now()-getLastSeen(m.name)<90000; // online if seen <90s ago
    return `<div class="dm-item" onclick="openDm('${m.name}')">
      <div style="position:relative">
        <div style="width:46px;height:46px;border-radius:50%;background:${c.bg};border:.5px solid ${c.bd};color:${c.tx};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:500">${m.name[0].toUpperCase()}</div>
        ${online?`<div style="position:absolute;bottom:1px;right:1px;width:11px;height:11px;border-radius:50%;background:var(--grn);border:2px solid var(--bg)"></div>`:''}
      </div>
      <div class="dm-item-body">
        <div class="dm-item-name">${esc(m.name)}</div>
        <div class="dm-item-preview">${last?esc(last.text.slice(0,40))+(last.edited?' ред.':''):'начать диалог...'}</div>
      </div>
      ${unread?`<div class="dm-unread-badge">${unread}</div>`:''}
    </div>`;
  }).join('');
}

function updateDmBadge(){
  loadDmSeen();
  const myName=D.currentUser?.name; if(!myName) return;
  let total=0;
  Object.entries(dmMessages).forEach(([key,msgs])=>{
    if(!msgs.length) return;
    const last=msgs[msgs.length-1];
    if(last.author!==myName&&(last.ts||0)>(dmLastSeen[key]||0)) total++;
  });
  const badge=document.getElementById('dm-badge');
  if(badge){ badge.style.display=total?'block':'none'; badge.textContent=total; }
}
