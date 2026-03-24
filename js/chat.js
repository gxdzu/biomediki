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
function avatarHtml(name, size=28){
  // Check if member has a real photo
  const allMembers = typeof fbMembers !== 'undefined' ? (fbMembers.length?fbMembers:[]) : [];
  const member = allMembers.find(m=>m.name===name) || (typeof D!=='undefined'?D.members?.find(m=>m.name===name):null);
  if(member?.avatarUrl){
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex-shrink:0;cursor:pointer" onclick="openMemberProfile('${name}')"><img src="${member.avatarUrl}" style="width:100%;height:100%;object-fit:cover"></div>`;
  }
  const c=avatarColor(name),l=(name||'?')[0].toUpperCase(),fs=Math.round(size*.43);
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${c.bg};border:.5px solid ${c.bd};display:flex;align-items:center;justify-content:center;font-size:${fs}px;font-weight:500;color:${c.tx};flex-shrink:0;cursor:pointer" onclick="openMemberProfile('${name}')">${l}</div>`;
}

// ── REPLY TO MESSAGE ──
let replyTo = null; // {key, author, text}

function setReply(key, author, text){
  replyTo = {key, author, text};
  const bar = document.getElementById('reply-bar');
  const rAuthor = document.getElementById('reply-author');
  const rText = document.getElementById('reply-text');
  if(bar) bar.classList.remove('hidden');
  if(rAuthor) rAuthor.textContent = author;
  if(rText) rText.textContent = text.slice(0, 80) + (text.length > 80 ? '…' : '');
  document.getElementById('chat-inp')?.focus();
}

function clearReply(){
  replyTo = null;
  document.getElementById('reply-bar')?.classList.add('hidden');
}

// ── MEMBER PROFILE SHEET ──
function openMemberProfile(name){
  const allMembers=[...(fbMembers.length?fbMembers:[]),...D.members];
  const seen=new Set();
  const members=allMembers.filter(m=>{ if(seen.has(m.name)) return false; seen.add(m.name); return true; });
  const m=members.find(x=>x.name===name)||{name,role:'member'};
  const c=avatarColor(m.name);
  const av=document.getElementById('msheet-av');
  if(av){
    if(m.avatarUrl){
      av.innerHTML=`<img src="${m.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      av.style.cssText='width:64px;height:64px;border-radius:50%;overflow:hidden;margin:0 auto 12px;border:1px solid '+c.bd;
    } else {
      av.textContent=(m.name||'?')[0].toUpperCase();
      av.style.cssText=`width:64px;height:64px;border-radius:50%;background:${c.bg};border:1px solid ${c.bd};color:${c.tx};display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:300;font-family:var(--serif);margin:0 auto 12px`;
    }
  }
  document.getElementById('msheet-name').textContent=m.name;
  document.getElementById('msheet-role').textContent=m.role==='admin'?'администратор':(m.subgroup?`подгруппа ${m.subgroup}`:'участник');
  document.getElementById('msheet-bio').textContent=m.bio||'';
  const soc=m.socials||{};
  const defs=[{k:'vk',l:'VK'},{k:'tg',l:'Telegram'},{k:'inst',l:'Instagram'},{k:'other',l:'Сайт'}];
  document.getElementById('msheet-socials').innerHTML=defs.filter(d=>soc[d.k]).map(d=>
    `<a class="social-chip" href="${soc[d.k]}" target="_blank">${d.l}</a>`
  ).join('');
  // Hide write button if viewing own profile
  const dmBtn=document.getElementById('msheet-dm-btn');
  if(dmBtn) dmBtn.style.display=m.name===D.currentUser?.name?'none':'';
  document.getElementById('member-profile-modal').classList.remove('hidden');
}
function closeMemberProfile(){ document.getElementById('member-profile-modal').classList.add('hidden'); }

function toggleMembersList(){
  const sheet=document.getElementById('members-sheet'); if(!sheet) return;
  if(sheet.classList.contains('hidden')){
    const allMembers=fbMembers.length?fbMembers:D.members;
    const listEl=document.getElementById('members-sheet-list');
    if(listEl) listEl.innerHTML=allMembers.map(m=>{
      return `<div class="mention-item" onclick="closeMembersList();openMemberProfile('${m.name}')">
        ${getMemberAvatarHtml(m.name,38)}
        <div>
          <div class="mention-item-name">${esc(m.name)}</div>
          <div style="font-size:11px;color:var(--text3)">${m.role==='admin'?'администратор':m.subgroup?`пг ${m.subgroup}`:'участник'}</div>
        </div>
      </div>`;
    }).join('');
    sheet.classList.remove('hidden');
  } else sheet.classList.add('hidden');
}
function closeMembersList(){ document.getElementById('members-sheet')?.classList.add('hidden'); }

// ── PINNED MESSAGE ──
let pinnedMsgKey=null;
async function fbPollPinned(){
  try{
    const data=await fbGet('pinned');
    const newKey=data?data.key:null;
    if(newKey!==pinnedMsgKey){ pinnedMsgKey=newKey; renderPinnedBar(); }
  }catch(e){}
}
function renderPinnedBar(){
  const bar=document.getElementById('pinned-bar'),txt=document.getElementById('pinned-text');
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
  const isPinned=pinnedMsgKey===key;
  try{
    await fbSet('pinned',isPinned?null:{key});
    pinnedMsgKey=isPinned?null:key; renderPinnedBar(); renderMsgs();
    toast(isPinned?'закреп снят':'сообщение закреплено');
  }catch(e){ toast('ошибка'); }
}

// ── SEARCH ──
let searchQuery='';
function toggleChatSearch(){
  const bar=document.getElementById('chat-search-bar'); if(!bar) return;
  const hidden=bar.classList.contains('hidden');
  bar.classList.toggle('hidden',!hidden);
  if(hidden) setTimeout(()=>document.getElementById('chat-search-inp')?.focus(),50);
  else{ searchQuery=''; document.getElementById('chat-search-inp').value=''; renderMsgs(); }
}
function searchMessages(q){ searchQuery=q.toLowerCase(); renderMsgs(); if(q) document.querySelector('.search-highlight')?.scrollIntoView({behavior:'smooth',block:'center'}); }
function highlightText(text,query){
  if(!query) return esc(text);
  return esc(text).replace(new RegExp(esc(query),'gi'),m=>`<span class="search-highlight">${m}</span>`);
}

// ── MENTIONS ──
function handleChatInput(val){
  const atIdx=val.lastIndexOf('@');
  const afterAt=atIdx>=0?val.slice(atIdx+1):'';
  if(atIdx>=0&&!afterAt.includes(' ')){
    const query=afterAt.toLowerCase();
    const allMembers=fbMembers.length?fbMembers:D.members;
    const members=allMembers.filter(m=>m.name!==D.currentUser?.name);
    const matches=query?members.filter(m=>m.name.toLowerCase().startsWith(query)):members;
    if(matches.length) renderMentionList(matches,atIdx); else hideMentionList();
  } else hideMentionList();
}
function renderMentionList(members,atIdx){
  const el=document.getElementById('mention-list'); if(!el) return;
  if(!members.length){ hideMentionList(); return; }
  el.innerHTML=members.slice(0,5).map(m=>{
    const c=avatarColor(m.name);
    return `<div class="mention-item" onclick="insertMention('${m.name}',${atIdx})">
      <div style="width:28px;height:28px;border-radius:50%;background:${c.bg};border:.5px solid ${c.bd};color:${c.tx};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500;flex-shrink:0">${m.name[0].toUpperCase()}</div>
      <div class="mention-item-name">${m.name}</div>
    </div>`;
  }).join('');
  el.classList.remove('hidden');
}
function hideMentionList(){ document.getElementById('mention-list')?.classList.add('hidden'); }
function insertMention(name,atIdx){
  const inp=document.getElementById('chat-inp'); if(!inp) return;
  inp.value=inp.value.slice(0,atIdx)+'@'+name+' ';
  inp.focus(); hideMentionList();
}

// ── EMOJI PICKER ──
const EMOJI_LIST=['😀','😂','🥰','😍','🤔','😎','🥲','😭','😤','🤯','👍','👎','❤️','🔥','💯','✅','❌','⚡','🎉','🙏','😴','🤓','👀','💀','🫡','🤝','💪','🫶','🤦','🙈','📚','📝','⏰','📅','💡','🔔','📌','🗂️','💬','🏠'];
function toggleEmojiPicker(){
  const picker=document.getElementById('emoji-picker'); if(!picker) return;
  if(picker.classList.contains('hidden')){ picker.innerHTML=EMOJI_LIST.map(e=>`<button class="emoji-item" onclick="insertEmoji('${e}')">${e}</button>`).join(''); picker.classList.remove('hidden'); }
  else picker.classList.add('hidden');
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
  const members=fbMembers.length?fbMembers:D.members;
  let result=searchQuery?highlightText(text,searchQuery):esc(text);
  members.forEach(m=>{
    const tag='@'+m.name;
    result=result.split(tag).join(`<span style="color:var(--gold);font-weight:500;cursor:pointer" onclick="openMemberProfile('${m.name}')">${tag}</span>`);
  });
  return result;
}

// ── FILE BUBBLE ──
function renderFileBubble(text){
  try{
    const {url,name,size}=JSON.parse(text);
    const ext=(name.split('.').pop()||'').toLowerCase();
    const isImg=/^(jpg|jpeg|png|gif|webp|svg)$/.test(ext);
    const isPdf=ext==='pdf';
    const icon=isImg?'🖼️':isPdf?'📄':ext==='zip'||ext==='rar'?'🗜️':ext==='mp3'||ext==='m4a'?'🎵':'📎';
    return `<a href="${url}" target="_blank" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit;min-width:160px">
      <span style="font-size:22px">${icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text)">${esc(name)}</div>
        ${size?`<div style="font-size:10px;color:var(--text3)">${size}</div>`:''}
      </div>
      <svg viewBox="0 0 16 16" width="14" height="14" style="flex-shrink:0;color:var(--text3)"><path d="M3 8v5h10V8M8 2v8M5 7l3 3 3-3" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>`;
  }catch(e){
    // fallback: plain URL
    return `<a href="${esc(text)}" target="_blank" style="color:var(--gold2);text-decoration:underline">📎 файл</a>`;
  }
}

// ── ОТКРЫТЬ КОМНАТУ ЧАТА ──
function openChatRoom(channel){
  curChat = channel;
  // Заголовок и аватар
  const titles = { general:'биомедики — общая', sg1:'подгруппа 1', sg2:'подгруппа 2' };
  const avText = { general:'Б', sg1:'1', sg2:'2' };
  const avStyles = {
    general:'background:#2a1e3a;border-color:#8b7fcf;color:#8b7fcf',
    sg1:'background:#1e2d3a;border-color:#6a96c4;color:#6a96c4',
    sg2:'background:#1e3328;border-color:#6ab4a0;color:#6ab4a0'
  };
  const titleEl = document.getElementById('chatroom-title');
  const avEl = document.getElementById('chatroom-av');
  if(titleEl) titleEl.textContent = titles[channel]||channel;
  if(avEl){ avEl.textContent = avText[channel]||'Б'; avEl.style.cssText = avStyles[channel]||''; }
  navigate('chatroom');
}

// ── СПИСОК ЧАТОВ ──
function renderChatList(){
  const myName = D.currentUser?.name;
  // Превью для групповых чатов
  const updatePreview = (id, msgs) => {
    const el = document.getElementById('preview-'+id);
    const te = document.getElementById('time-'+id);
    if(!el) return;
    const last = msgs[msgs.length-1];
    if(last){
      el.textContent = (last.author===myName?'Вы: ':last.author+': ') + (last.msgType==='image'?'📷 фото': last.msgType==='file'?'📎 файл':(last.text||'').slice(0,40));
      if(te) te.textContent = last.time ? last.time.split(',')[1]?.trim()||last.time : '';
    } else {
      el.textContent = 'нет сообщений';
    }
  };
  updatePreview('general', fbMessages);
  updatePreview('sg1', fbMsgsSg1);
  updatePreview('sg2', fbMsgsSg2);

  // Превью ЛС — рендерим список
  renderDmList();
}

function renderChat(){
  const members=fbMembers.length?fbMembers:D.members;
  const cnt=document.getElementById('chat-member-count');
  if(cnt) cnt.textContent=`${members.length} участник${members.length===1?'':'ов'}`;
  renderPinnedBar();
  _lastMsgsHash='';
  renderMsgs();
}

let _lastMsgsHash = '';

function renderMsgs(){
  const el=document.getElementById('chat-msgs'); if(!el) return;
  let msgs = curChatMsgs();
  if(searchQuery) msgs=msgs.filter(m=>m.text?.toLowerCase().includes(searchQuery)||m.author?.toLowerCase().includes(searchQuery));
  if(!msgs.length){
    el.innerHTML=searchQuery?'<div class="chat-empty">ничего не найдено</div>':'<div class="chat-empty">начните разговор...</div>';
    _lastMsgsHash='';
    return;
  }

  // Не перерисовывать если ничего не изменилось
  const hash = msgs.map(m=>m._key+'|'+(m.text||'')+'|'+(m.edited||'')).join(',');
  if(hash === _lastMsgsHash) return;
  _lastMsgsHash = hash;

  const wasAtBottom = el.scrollHeight===0 || el.scrollHeight-el.scrollTop-el.clientHeight < 100;
  const prevScrollTop = el.scrollTop;
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

    // Reply preview inside bubble
    let replyHtml='';
    if(m.replyTo){
      const orig=msgs.find(x=>x._key===m.replyTo.key);
      const origText=orig?orig.text:m.replyTo.text;
      const c=avatarColor(m.replyTo.author);
      replyHtml=`<div class="msg-reply-preview" onclick="document.getElementById('msg-${m.replyTo.key}')?.scrollIntoView({behavior:'smooth',block:'center'})">
        <div class="msg-reply-line" style="background:${c.bd}"></div>
        <div>
          <div style="font-size:11px;font-weight:500;color:${c.tx}">${esc(m.replyTo.author)}</div>
          <div style="font-size:12px;color:var(--text2);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:220px">${esc(origText||'').slice(0,60)}</div>
        </div>
      </div>`;
    }

    const safeText = (m.msgType==='image'?'📷 фото':m.msgType==='file'?'📎 файл':m.text||'').replace(/'/g,"\\'").slice(0,100);
    const actions=`<div class="msg-actions">
      <button class="msg-act" onclick="setReply('${m._key}','${esc(m.author).replace(/'/g,"\\'")}','${safeText}')">↩</button>
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
        <div class="msg-bbl" style="${bblStyle}">
          ${replyHtml}
          ${m.msgType==='image'
            ? `<img src="${m.text}" style="max-width:220px;max-height:220px;border-radius:10px;display:block;cursor:pointer" onclick="window.open('${m.text}','_blank')" loading="lazy">`
            : m.msgType==='file'
              ? renderFileBubble(m.text)
              : m.msgType==='link'
                ? `<a href="${esc(m.text)}" target="_blank" style="color:var(--gold2);text-decoration:underline;word-break:break-all">${esc(m.text)}</a>`
                : renderMentionInText(m.text)
          }
        </div>
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
  else el.scrollTop=prevScrollTop;
}

function sendMsg(){
  const inp=document.getElementById('chat-inp');
  const txt=inp.value.trim(); if(!txt) return;
  inp.value='';
  _lastMsgsHash=''; // сбрасываем чтобы renderMsgs точно перерисовал
  hideMentionList();
  document.getElementById('emoji-picker')?.classList.add('hidden');
  D.cat.mood=Math.min(100,D.cat.mood+1); save();
  const members=fbMembers.length?fbMembers:D.members;
  members.forEach(m=>{
    if(m.name!==D.currentUser?.name&&txt.includes('@'+m.name))
      notifyIfNeeded(`📣 ${D.currentUser?.name} упомянул вас`,txt);
  });
  if(replyTo && replyTo.author !== D.currentUser?.name)
    notifyIfNeeded(`↩ ${D.currentUser?.name} ответил вам`,txt);
  fbSend(D.currentUser?.name||'Аноним', txt, replyTo);
  clearReply();
}

// ── UNREAD TRACKING ──
let lastSeenTs=parseInt(localStorage.getItem('sg_last_seen')||'0');
function markChatRead(){
  const msgs = curChatMsgs();
  if(!msgs.length) return;
  lastSeenTs=msgs[msgs.length-1].ts||Date.now();
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
  // Суммируем непрочитанные по всем трём каналам
  const allMsgs=[...fbMessages,...fbMsgsSg1,...fbMsgsSg2];
  return allMsgs.filter(m=>m.author!==myName&&(m.ts||0)>lastSeenTs).length;
}

// ── CLOUDINARY — отправка фото в чат ──
function chatPickPhoto(){
  clPickAndUpload({
    accept: 'image/*',
    onStart(){ toast('загружаю фото...'); },
    onDone({url}){
      // Send as message with image URL embedded
      fbSend(D.currentUser?.name||'Аноним', url, null, 'image');
      D.cat.mood=Math.min(100,D.cat.mood+1); save();
    }
  });
}

// ── ATTACH SHEET ──
function toggleChatAttach(){
  const s=document.getElementById('chat-attach-sheet');
  if(!s) return;
  s.classList.toggle('hidden');
}
function closeChatAttach(){
  document.getElementById('chat-attach-sheet')?.classList.add('hidden');
}

// ── FILE UPLOAD to Cloudinary ──
function chatPickFile(){
  clPickAndUpload({
    accept:'*/*',
    onStart(file){ toast('загружаю файл...'); },
    onDone({url, originalFilename, format, bytes}, file){
      const name = (originalFilename&&format) ? `${originalFilename}.${format}` : (file?.name||'файл');
      const sizeStr = bytes ? (bytes>1048576?(bytes/1048576).toFixed(1)+' МБ':(bytes/1024).toFixed(0)+' КБ') : '';
      // encode name+size into text so it's displayable
      const payload = JSON.stringify({url, name, size:sizeStr});
      fbSend(D.currentUser?.name||'Аноним', payload, null, 'file');
      D.cat.mood=Math.min(100,D.cat.mood+1); save();
    }
  });
}

// ── SEND LINK in chat ──
function chatPickLink(){
  const url = prompt('Вставь ссылку:');
  if(!url||!url.trim()) return;
  fbSend(D.currentUser?.name||'Аноним', url.trim(), null, 'link');
}

// close attach sheet on outside click
document.addEventListener('click', e=>{
  const sheet=document.getElementById('chat-attach-sheet');
  if(sheet&&!sheet.classList.contains('hidden')&&!e.target.closest('.emoji-btn')&&!e.target.closest('#chat-attach-sheet'))
    closeChatAttach();
});

// ── UNIVERSAL AVATAR HTML ──
function getMemberAvatarHtml(name, size=36, onClick=''){
  const all=[...(typeof fbMembers!=='undefined'?fbMembers:[]), ...(typeof D!=='undefined'&&D.members?D.members:[])];
  const seen=new Set(); const members=all.filter(m=>{if(seen.has(m.name))return false;seen.add(m.name);return true;});
  const m=members.find(x=>x.name===name);
  const c=avatarColor(name);
  const clickAttr=onClick?`onclick="${onClick}" style="cursor:pointer;width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex-shrink:0;border:.5px solid ${c.bd}"`:`style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex-shrink:0;border:.5px solid ${c.bd}"`;
  if(m?.avatarUrl){
    return `<div ${clickAttr}><img src="${m.avatarUrl}" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy"></div>`;
  }
  const fs=Math.round(size*.43);
  const clickStyle=onClick?`cursor:pointer;`:'';
  return `<div style="${clickStyle}width:${size}px;height:${size}px;border-radius:50%;background:${c.bg};border:.5px solid ${c.bd};color:${c.tx};display:flex;align-items:center;justify-content:center;font-size:${fs}px;font-weight:500;flex-shrink:0"${onClick?` onclick="${onClick}"`:''}>${(name||'?')[0].toUpperCase()}</div>`;
}

// ── UNIVERSAL AVATAR HTML (for feed, DM list, etc.) ──
function getAvatarUrl(name){
  const allMembers = (typeof fbMembers!=='undefined'&&fbMembers.length?fbMembers:[]).concat(
    typeof D!=='undefined'&&D.members?D.members:[]
  );
  const seen=new Set(); 
  for(const m of allMembers){
    if(m.name===name&&!seen.has(name)){ seen.add(name); return m.avatarUrl||''; }
  }
  return '';
}

function feedAvatarHtml(name, size=36){
  const url=getAvatarUrl(name);
  const c=avatarColor(name);
  const letter=(name||'?')[0].toUpperCase();
  if(url) return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex-shrink:0;border:.5px solid ${c.bd};cursor:pointer" onclick="openMemberProfile('${name}')"><img src="${url}" style="width:100%;height:100%;object-fit:cover"></div>`;
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${c.bg};border:.5px solid ${c.bd};color:${c.tx};display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*.38)}px;font-weight:500;flex-shrink:0;cursor:pointer" onclick="openMemberProfile('${name}')">${letter}</div>`;
}

// Экспорт в глобальный scope сразу при загрузке скрипта
window.openChatRoom = openChatRoom;
