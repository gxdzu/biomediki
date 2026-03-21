// ══════════════════════════════════════════════
// CHAT — telegram style
// ══════════════════════════════════════════════
const AVATAR_COLORS=[
  {bg:'#1e2d3a',bd:'#6a96c4',tx:'#6a96c4'},{bg:'#1e3328',bd:'#6ab4a0',tx:'#6ab4a0'},
  {bg:'#3a1e2a',bd:'#c4748a',tx:'#c4748a'},{bg:'#2d1e3a',bd:'#8b7fcf',tx:'#8b7fcf'},
  {bg:'#3a2d1e',bd:'#c4a874',tx:'#c4a874'},{bg:'#2a1e1e',bd:'#c47474',tx:'#c47474'},
];
function avatarColor(name){
  if(!name) return AVATAR_COLORS[0];
  let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))%AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}
function avatarHtml(name,size=28){
  const c=avatarColor(name),l=(name||'?')[0].toUpperCase(),fs=Math.round(size*.43);
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${c.bg};border:.5px solid ${c.bd};display:flex;align-items:center;justify-content:center;font-size:${fs}px;font-weight:500;color:${c.tx};flex-shrink:0;cursor:pointer" onclick="openMemberProfile('${name}')">${l}</div>`;
}

// ── MEMBER PROFILE SHEET ──
function openMemberProfile(name){
  // Try fbMembers first, then D.members, then construct minimal profile
  const allMembers = [...(fbMembers.length ? fbMembers : []), ...D.members];
  const seen = new Set();
  const members = allMembers.filter(m=>{ if(seen.has(m.name)) return false; seen.add(m.name); return true; });
  const m = members.find(x=>x.name===name) || {name, role:'member'};
  const c = avatarColor(m.name);
  const av = document.getElementById('msheet-av');
  if(av){ av.textContent=(m.name||'?')[0].toUpperCase(); av.style.cssText=`width:64px;height:64px;border-radius:50%;background:${c.bg};border:1px solid ${c.bd};color:${c.tx};display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:300;font-family:var(--serif);margin:0 auto 12px`; }
  document.getElementById('msheet-name').textContent = m.name;
  document.getElementById('msheet-role').textContent = m.role==='admin'?'администратор':(m.subgroup?`подгруппа ${m.subgroup}`:'участник');
  document.getElementById('msheet-bio').textContent = m.bio||'';
  const soc = m.socials||{};
  const defs=[{k:'vk',l:'VK'},{k:'tg',l:'Telegram'},{k:'inst',l:'Instagram'},{k:'other',l:'Сайт'}];
  document.getElementById('msheet-socials').innerHTML = defs.filter(d=>soc[d.k]).map(d=>
    `<a class="social-chip" href="${soc[d.k]}" target="_blank">${d.l}</a>`
  ).join('');
  document.getElementById('member-profile-modal').classList.remove('hidden');
}
function closeMemberProfile(){
  document.getElementById('member-profile-modal').classList.add('hidden');
}

function toggleMembersList(){
  const sheet = document.getElementById('members-sheet');
  if(!sheet) return;
  const isHidden = sheet.classList.contains('hidden');
  if(isHidden){
    // populate list
    const allMembers = fbMembers.length ? fbMembers : D.members;
    const listEl = document.getElementById('members-sheet-list');
    if(listEl){
      listEl.innerHTML = allMembers.map(m=>{
        const c = avatarColor(m.name);
        return `<div class="mention-item" onclick="closeMembersList();openMemberProfile('${m.name}')">
          <div style="width:38px;height:38px;border-radius:50%;background:${c.bg};border:.5px solid ${c.bd};color:${c.tx};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:500;flex-shrink:0">${m.name[0].toUpperCase()}</div>
          <div>
            <div class="mention-item-name">${esc(m.name)}</div>
            <div style="font-size:11px;color:var(--text3)">${m.role==='admin'?'администратор':m.subgroup?`пг ${m.subgroup}`:'участник'}</div>
          </div>
        </div>`;
      }).join('');
    }
    sheet.classList.remove('hidden');
  } else {
    sheet.classList.add('hidden');
  }
}
function closeMembersList(){
  document.getElementById('members-sheet')?.classList.add('hidden');
}

// ── PINNED MESSAGE ──
let pinnedMsgKey = null;

async function fbPollPinned(){
  try{
    const data = await fbGet('pinned');
    const newKey = data ? data.key : null;
    if(newKey !== pinnedMsgKey){ pinnedMsgKey=newKey; renderPinnedBar(); }
  }catch(e){}
}

function renderPinnedBar(){
  const bar=document.getElementById('pinned-bar'), txt=document.getElementById('pinned-text');
  if(!bar||!txt) return;
  if(!pinnedMsgKey){ bar.classList.add('hidden'); return; }
  const msg=fbMessages.find(m=>m._key===pinnedMsgKey);
  if(msg){ txt.textContent=msg.author+': '+msg.text.slice(0,60)+(msg.text.length>60?'…':''); bar.classList.remove('hidden'); }
  else bar.classList.add('hidden');
}

function scrollToPinned(){
  if(!pinnedMsgKey) return;
  document.getElementById('msg-'+pinnedMsgKey)?.scrollIntoView({behavior:'smooth',block:'center'});
}

async function pinMsg(key){
  const isPinned = pinnedMsgKey===key;
  const newKey = isPinned ? null : key;
  try{
    await fbSet('pinned', newKey?{key:newKey}:null);
    pinnedMsgKey=newKey; renderPinnedBar(); renderMsgs();
    toast(isPinned?'закреп снят':'сообщение закреплено');
  }catch(e){ toast('ошибка'); }
}

// ── SEARCH ──
let searchQuery = '';
function toggleChatSearch(){
  const bar=document.getElementById('chat-search-bar');
  if(!bar) return;
  const hidden=bar.classList.contains('hidden');
  bar.classList.toggle('hidden',!hidden);
  if(hidden){ setTimeout(()=>document.getElementById('chat-search-inp')?.focus(),50); }
  else{ searchQuery=''; document.getElementById('chat-search-inp').value=''; renderMsgs(); }
}
function searchMessages(q){
  searchQuery=q.toLowerCase(); renderMsgs();
  if(q){ const first=document.querySelector('.search-highlight'); first?.scrollIntoView({behavior:'smooth',block:'center'}); }
}
function highlightText(text, query){
  if(!query) return esc(text);
  const escaped = esc(text);
  const escapedQ = esc(query);
  return escaped.replace(new RegExp(escapedQ,'gi'), m=>`<span class="search-highlight">${m}</span>`);
}

// ── MENTIONS ──
function handleChatInput(val){
  const atIdx = val.lastIndexOf('@');
  const afterAt = atIdx >= 0 ? val.slice(atIdx + 1) : '';
  const hasSpace = afterAt.includes(' ');
  if(atIdx >= 0 && !hasSpace){
    const query = afterAt.toLowerCase();
    const allMembers = fbMembers.length ? fbMembers : D.members;
    const members = allMembers.filter(m=>m.name !== D.currentUser?.name);
    const matches = query ? members.filter(m=>m.name.toLowerCase().startsWith(query)) : members;
    if(matches.length) renderMentionList(matches, atIdx);
    else hideMentionList();
  } else {
    hideMentionList();
  }
}
function renderMentionList(members, atIdx){
  const el=document.getElementById('mention-list'); if(!el) return;
  if(!members.length){ hideMentionList(); return; }
  el.innerHTML = members.slice(0,5).map(m=>{
    const c=avatarColor(m.name);
    return `<div class="mention-item" onclick="insertMention('${m.name}',${atIdx})">
      <div style="width:28px;height:28px;border-radius:50%;background:${c.bg};border:.5px solid ${c.bd};color:${c.tx};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500;flex-shrink:0">${m.name[0].toUpperCase()}</div>
      <div class="mention-item-name">${m.name}</div>
    </div>`;
  }).join('');
  el.classList.remove('hidden');
}
function hideMentionList(){ document.getElementById('mention-list')?.classList.add('hidden'); }
function insertMention(name, atIdx){
  const inp=document.getElementById('chat-inp'); if(!inp) return;
  inp.value = inp.value.slice(0,atIdx)+'@'+name+' ';
  inp.focus(); hideMentionList();
}

// ── EMOJI PICKER ──
const EMOJI_LIST=['😀','😂','🥰','😍','🤔','😎','🥲','😭','😤','🤯','👍','👎','❤️','🔥','💯','✅','❌','⚡','🎉','🙏','😴','🤓','👀','💀','🫡','🤝','💪','🫶','🤦','🙈','📚','📝','⏰','📅','💡','🔔','📌','🗂️','💬','🏠'];

function toggleEmojiPicker(){
  const picker=document.getElementById('emoji-picker'); if(!picker) return;
  if(picker.classList.contains('hidden')){
    picker.innerHTML=EMOJI_LIST.map(e=>`<button class="emoji-item" onclick="insertEmoji('${e}')">${e}</button>`).join('');
    picker.classList.remove('hidden');
  } else picker.classList.add('hidden');
}
function insertEmoji(emoji){
  const inp=document.getElementById('chat-inp'); if(!inp) return;
  const pos=inp.selectionStart||inp.value.length;
  inp.value=inp.value.slice(0,pos)+emoji+inp.value.slice(pos);
  inp.focus(); inp.selectionStart=inp.selectionEnd=pos+emoji.length;
  document.getElementById('emoji-picker').classList.add('hidden');
}
document.addEventListener('click',e=>{
  if(!document.getElementById('emoji-picker')?.classList.contains('hidden')&&!e.target.closest('.emoji-btn')&&!e.target.closest('#emoji-picker'))
    document.getElementById('emoji-picker')?.classList.add('hidden');
  if(!document.getElementById('mention-list')?.classList.contains('hidden')&&!e.target.closest('#chat-inp')&&!e.target.closest('#mention-list'))
    hideMentionList();
});

// ── RENDER MESSAGES ──
function renderMentionInText(text){
  const members = fbMembers.length?fbMembers:D.members;
  let result = searchQuery ? highlightText(text, searchQuery) : esc(text);
  members.forEach(m=>{
    const tag = '@'+m.name;
    result = result.split(tag).join(`<span style="color:var(--gold);font-weight:500" onclick="openMemberProfile('${m.name}')">${tag}</span>`);
  });
  return result;
}

function renderChat(){
  const members=fbMembers.length?fbMembers:D.members;
  const cnt=document.getElementById('chat-member-count');
  if(cnt) cnt.textContent=`${members.length} участник${members.length===1?'':'ов'}`;
  renderPinnedBar(); renderMsgs();
}

function renderMsgs(){
  const el=document.getElementById('chat-msgs'); if(!el) return;
  let msgs=fbMessages.length?fbMessages:(D.chat.general||[]);
  if(searchQuery) msgs=msgs.filter(m=>m.text?.toLowerCase().includes(searchQuery)||m.author?.toLowerCase().includes(searchQuery));
  if(!msgs.length){
    el.innerHTML=searchQuery?'<div class="chat-empty">ничего не найдено</div>':'<div class="chat-empty">начните разговор...</div>';
    return;
  }
  const wasAtBottom=el.scrollHeight-el.scrollTop-el.clientHeight<80;
  const isAdmin=D.currentUser?.role==='admin';
  const myName=D.currentUser?.name;
  const myMsgs=msgs.filter(m=>m.author===myName);
  const lastMyKey=myMsgs.length?myMsgs[myMsgs.length-1]._key:null;

  let html='<div style="flex:1"></div>'; let lastDate=null,lastAuthor=null;
  msgs.forEach((m,idx)=>{
    const me=m.author===myName;
    if(m.ts&&!searchQuery){
      const d=new Date(m.ts);
      const ds=`${d.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][d.getMonth()]}`;
      if(ds!==lastDate){html+=`<div class="chat-day-sep">${ds}</div>`;lastDate=ds;}
    }
    const showName=!me&&m.author!==lastAuthor;
    const nextSameAuthor=msgs[idx+1]&&msgs[idx+1].author===m.author;
    const canEdit=me&&m._key===lastMyKey;
    const canDel=isAdmin||canEdit;
    const isPinned=m._key===pinnedMsgKey;
    const actions=`<div class="msg-actions">
      ${canEdit?`<button class="msg-act" onclick="openMsgEdit('${m._key}','${esc(m.text).replace(/'/g,"\\'")}')">✎</button>`:''}
      ${isAdmin?`<button class="msg-act" onclick="pinMsg('${m._key}')">${isPinned?'📌':'📍'}</button>`:''}
      ${canDel?`<button class="msg-act" onclick="delMsg('${m._key}')">✕</button>`:''}
    </div>`;
    const bblStyle=nextSameAuthor?(me?'border-radius:16px 16px 4px 16px':'border-radius:16px 16px 16px 4px'):'';
    html+=`<div class="msg-row ${me?'me':''}" id="msg-${m._key}">
      ${!me?`<div style="width:28px;flex-shrink:0;align-self:flex-end">${!nextSameAuthor?avatarHtml(m.author):''}</div>`:''}
      <div class="msg-col">
        ${showName?`<div class="msg-name" style="color:${avatarColor(m.author).tx};cursor:pointer" onclick="openMemberProfile('${m.author}')">${esc(m.author)}</div>`:''}
        ${isPinned?'<div class="msg-pinned-mark">📌</div>':''}
        <div class="msg-bbl" style="${bblStyle}">${renderMentionInText(m.text)}</div>
        <div class="msg-footer">
          <span class="msg-time">${m.time}</span>
          ${m.edited?'<span class="msg-edited">ред.</span>':''}
          ${actions}
        </div>
      </div>
    </div>`;
    lastAuthor=m.author;
  });
  el.innerHTML=html;
  if(wasAtBottom) el.scrollTop=el.scrollHeight;
}

function sendMsg(){
  const inp=document.getElementById('chat-inp');
  const txt=inp.value.trim(); if(!txt) return;
  inp.value='';
  hideMentionList();
  document.getElementById('emoji-picker')?.classList.add('hidden');
  D.cat.mood=Math.min(100,D.cat.mood+1); save();
  // check for mentions and notify
  const members=fbMembers.length?fbMembers:D.members;
  members.forEach(m=>{
    if(m.name!==D.currentUser?.name && txt.includes('@'+m.name)){
      notifyIfNeeded(`📣 ${D.currentUser?.name} упомянул вас`,txt);
    }
  });
  fbSend(D.currentUser?.name||'Аноним',txt);
}

// ── UNREAD TRACKING ──
let lastSeenTs=parseInt(localStorage.getItem('sg_last_seen')||'0');
function markChatRead(){
  if(!fbMessages.length) return;
  lastSeenTs=fbMessages[fbMessages.length-1].ts||Date.now();
  localStorage.setItem('sg_last_seen',String(lastSeenTs));
  updateChatBadge(0);
}
function updateChatBadge(count){
  const el=document.getElementById('chat-badge'); if(!el) return;
  if(count<=0){el.style.display='none';return;}
  el.style.display='block'; el.textContent=count>99?'99+':String(count);
}
function countUnread(){
  const myName=D.currentUser?.name;
  return fbMessages.filter(m=>m.author!==myName&&(m.ts||0)>lastSeenTs).length;
}
