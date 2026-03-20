// ══════════════════════════════════════════════
// CHAT
// ══════════════════════════════════════════════
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

function renderChat(){
  const members=fbMembers.length?fbMembers:D.members;
  const cnt=document.getElementById('chat-member-count');
  if(cnt) cnt.textContent=`${members.length} участник${members.length===1?'':'ов'}`;
  renderMsgs();
}

function renderMsgs(){
  const el=document.getElementById('chat-msgs');
  if(!el) return;
  const msgs=fbMessages.length?fbMessages:(D.chat.general||[]);
  if(!msgs.length){el.innerHTML='<div class="chat-empty">начните разговор...</div>';return;}
  const wasAtBottom=el.scrollHeight-el.scrollTop-el.clientHeight<80;
  const isAdmin=D.currentUser?.role==='admin';
  const myName=D.currentUser?.name;
  const myMsgs=msgs.filter(m=>m.author===myName);
  const lastMyKey=myMsgs.length?myMsgs[myMsgs.length-1]._key:null;
  let html='<div style="flex:1"></div>';
  let lastDate=null,lastAuthor=null;
  msgs.forEach((m,idx)=>{
    const me=m.author===myName;
    if(m.ts){
      const d=new Date(m.ts);
      const ds=`${d.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][d.getMonth()]}`;
      if(ds!==lastDate){html+=`<div class="chat-day-sep">${ds}</div>`;lastDate=ds;}
    }
    const showName=!me&&m.author!==lastAuthor;
    const showAv=!me;
    const nextSameAuthor=msgs[idx+1]&&msgs[idx+1].author===m.author;
    const canEdit=me&&m._key===lastMyKey;
    const canDel=isAdmin||canEdit;
    const av=!me?avatarHtml(m.author):'';
    const actions=(canEdit||canDel)?`<div class="msg-actions">
      ${canEdit?`<button class="msg-act" onclick="openMsgEdit('${m._key}','${esc(m.text).replace(/'/g,"\\'")}')">✎</button>`:''}
      ${canDel?`<button class="msg-act" onclick="delMsg('${m._key}')">✕</button>`:''}
    </div>`:'';
    const bblStyle=nextSameAuthor?(me?'border-radius:16px 16px 4px 16px':'border-radius:16px 16px 16px 4px'):'';
    html+=`<div class="msg-row ${me?'me':''}">
      ${!me?`<div style="width:28px;flex-shrink:0;align-self:flex-end">${showAv&&!nextSameAuthor?avatarHtml(m.author):''}</div>`:''}
      <div class="msg-col">
        ${showName?`<div class="msg-name" style="color:${avatarColor(m.author).tx}">${esc(m.author)}</div>`:''}
        <div class="msg-bbl" style="${bblStyle}">${esc(m.text)}</div>
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
  const txt=inp.value.trim();
  if(!txt) return;
  inp.value='';
  D.cat.mood=Math.min(100,D.cat.mood+1);
  save();
  fbSend(D.currentUser?.name||'Аноним',txt);
}

// ══════════════════════════════════════════════