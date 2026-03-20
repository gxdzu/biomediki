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
  let h=0;for(let i=0;i<name.length;i++)h=(h*31+name.charCodeAt(i))%AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}
function avatarHtml(name,size=28){
  const c=avatarColor(name),l=(name||'?')[0].toUpperCase(),fs=Math.round(size*.43);
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${c.bg};border:.5px solid ${c.bd};display:flex;align-items:center;justify-content:center;font-size:${fs}px;font-weight:500;color:${c.tx};flex-shrink:0">${l}</div>`;
}

// ── PINNED MESSAGE ──
let pinnedMsgKey = null;

async function fbPollPinned(){
  try{
    const data = await fbGet('pinned');
    const newKey = data ? data.key : null;
    if(newKey !== pinnedMsgKey){
      pinnedMsgKey = newKey;
      renderPinnedBar();
    }
  }catch(e){}
}

function renderPinnedBar(){
  const bar = document.getElementById('pinned-bar');
  const txt = document.getElementById('pinned-text');
  if(!bar||!txt) return;
  if(!pinnedMsgKey){
    bar.classList.add('hidden'); return;
  }
  const msg = fbMessages.find(m=>m._key===pinnedMsgKey);
  if(msg){
    txt.textContent = msg.author + ': ' + msg.text.slice(0,60) + (msg.text.length>60?'…':'');
    bar.classList.remove('hidden');
  } else {
    bar.classList.add('hidden');
  }
}

function scrollToPinned(){
  if(!pinnedMsgKey) return;
  const el = document.getElementById('msg-'+pinnedMsgKey);
  if(el) el.scrollIntoView({behavior:'smooth',block:'center'});
}

async function pinMsg(key){
  const isCurrentlyPinned = pinnedMsgKey === key;
  const newKey = isCurrentlyPinned ? null : key;
  try{
    await fbSet('pinned', newKey ? {key: newKey} : null);
    pinnedMsgKey = newKey;
    renderPinnedBar();
    renderMsgs();
    toast(isCurrentlyPinned ? 'закреп снят' : 'сообщение закреплено');
  }catch(e){ toast('ошибка'); }
}

// ── EMOJI PICKER ──
const EMOJI_LIST = [
  '😀','😂','🥰','😍','🤔','😎','🥲','😭','😤','🤯',
  '👍','👎','❤️','🔥','💯','✅','❌','⚡','🎉','🙏',
  '😴','🤓','👀','💀','🫡','🤝','💪','🫶','🤦','🙈',
  '📚','📝','⏰','📅','💡','🔔','📌','🗂️','💬','🏠',
];

function toggleEmojiPicker(){
  const picker = document.getElementById('emoji-picker');
  if(!picker) return;
  if(picker.classList.contains('hidden')){
    picker.innerHTML = EMOJI_LIST.map(e=>
      `<button class="emoji-item" onclick="insertEmoji('${e}')">${e}</button>`
    ).join('');
    picker.classList.remove('hidden');
  } else {
    picker.classList.add('hidden');
  }
}

function insertEmoji(emoji){
  const inp = document.getElementById('chat-inp');
  if(!inp) return;
  const pos = inp.selectionStart||inp.value.length;
  inp.value = inp.value.slice(0,pos) + emoji + inp.value.slice(pos);
  inp.focus();
  inp.selectionStart = inp.selectionEnd = pos + emoji.length;
  document.getElementById('emoji-picker').classList.add('hidden');
}

// close emoji picker when clicking outside
document.addEventListener('click', e=>{
  const picker = document.getElementById('emoji-picker');
  if(picker && !picker.classList.contains('hidden') &&
     !picker.contains(e.target) && !e.target.closest('.emoji-btn')){
    picker.classList.add('hidden');
  }
});

// ── RENDER ──
function renderChat(){
  const members = fbMembers.length?fbMembers:D.members;
  const cnt = document.getElementById('chat-member-count');
  if(cnt) cnt.textContent=`${members.length} участник${members.length===1?'':'ов'}`;
  renderPinnedBar();
  renderMsgs();
}

function renderMsgs(){
  const el = document.getElementById('chat-msgs');
  if(!el) return;
  const msgs = fbMessages.length?fbMessages:(D.chat.general||[]);
  if(!msgs.length){el.innerHTML='<div class="chat-empty">начните разговор...</div>';return;}
  const wasAtBottom = el.scrollHeight-el.scrollTop-el.clientHeight<80;
  const isAdmin = D.currentUser?.role==='admin';
  const myName = D.currentUser?.name;
  const myMsgs = msgs.filter(m=>m.author===myName);
  const lastMyKey = myMsgs.length?myMsgs[myMsgs.length-1]._key:null;

  let html = '<div style="flex:1"></div>';
  let lastDate=null, lastAuthor=null;

  msgs.forEach((m,idx)=>{
    const me = m.author===myName;
    // date separator
    if(m.ts){
      const d=new Date(m.ts);
      const ds=`${d.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][d.getMonth()]}`;
      if(ds!==lastDate){html+=`<div class="chat-day-sep">${ds}</div>`;lastDate=ds;}
    }

    const showName = !me&&m.author!==lastAuthor;
    const nextSameAuthor = msgs[idx+1]&&msgs[idx+1].author===m.author;
    const canEdit = me&&m._key===lastMyKey;
    const canDel = isAdmin||canEdit;
    const isPinned = m._key===pinnedMsgKey;

    const actions = `<div class="msg-actions">
      ${canEdit?`<button class="msg-act" onclick="openMsgEdit('${m._key}','${esc(m.text).replace(/'/g,"\\'")}')">✎</button>`:''}
      ${isAdmin?`<button class="msg-act" onclick="pinMsg('${m._key}')" title="${isPinned?'снять закреп':'закрепить'}">${isPinned?'📌':'📍'}</button>`:''}
      ${canDel?`<button class="msg-act" onclick="delMsg('${m._key}')">✕</button>`:''}
    </div>`;

    const pinnedMark = isPinned ? `<div class="msg-pinned-mark">📌</div>` : '';
    const bblStyle = nextSameAuthor?(me?'border-radius:16px 16px 4px 16px':'border-radius:16px 16px 16px 4px'):'';

    html+=`<div class="msg-row ${me?'me':''}" id="msg-${m._key}">
      ${!me?`<div style="width:28px;flex-shrink:0;align-self:flex-end">${!nextSameAuthor?avatarHtml(m.author):''}</div>`:''}
      <div class="msg-col">
        ${showName?`<div class="msg-name" style="color:${avatarColor(m.author).tx}">${esc(m.author)}</div>`:''}
        ${pinnedMark}
        <div class="msg-bbl" style="${bblStyle}">${esc(m.text)}</div>
        <div class="msg-footer">
          <span class="msg-time">${m.time}</span>
          ${m.edited?'<span class="msg-edited">ред.</span>':''}
          ${actions}
        </div>
      </div>
    </div>`;
    lastAuthor = m.author;
  });

  el.innerHTML = html;
  if(wasAtBottom) el.scrollTop = el.scrollHeight;
}

function sendMsg(){
  const inp = document.getElementById('chat-inp');
  const txt = inp.value.trim();
  if(!txt) return;
  inp.value = '';
  document.getElementById('emoji-picker')?.classList.add('hidden');
  D.cat.mood = Math.min(100,D.cat.mood+1);
  save();
  fbSend(D.currentUser?.name||'Аноним', txt);
}

// ── UNREAD TRACKING ──
let lastSeenTs = parseInt(localStorage.getItem('sg_last_seen')||'0');

function markChatRead(){
  if(!fbMessages.length) return;
  const last = fbMessages[fbMessages.length-1];
  lastSeenTs = last.ts||Date.now();
  localStorage.setItem('sg_last_seen', String(lastSeenTs));
  updateChatBadge(0);
}

function updateChatBadge(count){
  const el = document.getElementById('chat-badge');
  if(!el) return;
  if(count<=0){el.style.display='none';return;}
  el.style.display='block';
  el.textContent = count>99?'99+':String(count);
}

function countUnread(){
  const myName = D.currentUser?.name;
  return fbMessages.filter(m=>m.author!==myName&&(m.ts||0)>lastSeenTs).length;
}
