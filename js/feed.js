// ══════════════════════════════════════════════
// FEED — лента с реакциями и комментариями
// ══════════════════════════════════════════════
let fbFeed = [];
let curPostKey = null; // для экрана комментариев

async function fbPollFeed(){
  try{
    const data = await fbGet('feed');
    const arr = data ? Object.entries(data).map(([k,v])=>({...v,_key:k})).sort((a,b)=>b.ts-a.ts) : [];
    if(JSON.stringify(arr)!==JSON.stringify(fbFeed)){
      fbFeed=arr; D.feed=arr;
      if(curScreen==='feed') renderFeed();
      if(curScreen==='post') renderPostScreen();
      renderHome();
    }
  }catch(e){}
}

// ── реакции ──
async function reactToPost(key, type){
  const myName = D.currentUser?.name;
  if(!myName) return;
  const post = fbFeed.find(p=>p._key===key);
  if(!post) return;
  const reactions = post.reactions||{};
  const myReact = reactions[myName];
  // toggle: same → remove, different → switch
  if(myReact===type) delete reactions[myName];
  else reactions[myName] = type;
  post.reactions = reactions;
  try{
    await fbSet(`feed/${key}/reactions`, reactions);
    if(curScreen==='feed') renderFeed();
    if(curScreen==='post') renderPostScreen();
    renderHome();
  }catch(e){ toast('ошибка'); }
}

function countReactions(post, type){
  if(!post.reactions) return 0;
  return Object.values(post.reactions).filter(r=>r===type).length;
}

// ── комментарии ──
async function openPost(key){
  curPostKey = key;
  navigate('post');
  // If post not yet in fbFeed - fetch fresh data first
  if(!fbFeed.find(p=>p._key===key)){
    await fbPollFeed();
  }
  renderPostScreen();
}

async function submitComment(){
  const inp = document.getElementById('comment-inp');
  const text = inp?.value.trim();
  if(!text||!curPostKey) return;
  const comment = {
    author: D.currentUser?.name||'Аноним',
    text, ts: Date.now(), time: nowTime()
  };
  try{
    await fbPost(`feed/${curPostKey}/comments`, comment);
    inp.value='';
    // reload post data
    await fbPollFeed();
    renderPostScreen();
  }catch(e){ toast('ошибка'); }
}

function renderPostScreen(){
  const post = fbFeed.find(p=>p._key===curPostKey);
  const el = document.getElementById('post-screen-content');
  if(!el||!post) return;
  const myName = D.currentUser?.name;
  const isAdmin = D.currentUser?.role==='admin';
  const canDel = isAdmin||post.author===myName;
  const c = avatarColor(post.author);
  const likes = countReactions(post,'👍');
  const dislikes = countReactions(post,'👎');
  const myReact = post.reactions?.[myName];
  const comments = post.comments ? Object.values(post.comments).sort((a,b)=>a.ts-b.ts) : [];

  el.innerHTML = `
    <div class="feed-post" style="border-radius:0;border-left:none;border-right:none;border-top:none">
      <div class="feed-post-hdr">
        <div class="feed-post-av" style="background:${c.bg};border:.5px solid ${c.bd};color:${c.tx}">${(post.author||'?')[0].toUpperCase()}</div>
        <div class="feed-post-meta">
          <div class="feed-post-author">${esc(post.author)}</div>
          <div class="feed-post-time">${post.time||''}</div>
        </div>
        ${canDel?`<button class="msg-act" onclick="deletePost('${post._key}')" style="margin-left:auto">✕</button>`:''}
      </div>
      ${post.img?`<img class="feed-post-img" src="${post.img}" onerror="this.style.display='none'" loading="lazy">`:''}
      <div class="feed-post-text" style="margin-bottom:12px">${esc(post.text)}</div>
      <div class="feed-reactions">
        <button class="react-btn ${myReact==='👍'?'active':''}" onclick="reactToPost('${post._key}','👍')">
          👍 <span>${likes||''}</span>
        </button>
        <button class="react-btn ${myReact==='👎'?'active':''}" onclick="reactToPost('${post._key}','👎')">
          👎 <span>${dislikes||''}</span>
        </button>
        <span class="comment-count-lbl">${comments.length} комм.</span>
      </div>
    </div>
    <div class="comments-list">
      ${comments.length?comments.map(c=>{
        const cc=avatarColor(c.author);
        const canDelC=isAdmin||c.author===myName;
        return `<div class="comment-item">
          <div class="feed-post-av" style="width:28px;height:28px;font-size:12px;background:${cc.bg};border:.5px solid ${cc.bd};color:${cc.tx}">${(c.author||'?')[0].toUpperCase()}</div>
          <div style="flex:1">
            <div style="font-size:11px;color:var(--gold2);margin-bottom:2px">${esc(c.author)} <span style="color:var(--text3)">${c.time||''}</span></div>
            <div style="font-size:13px;color:var(--text)">${esc(c.text)}</div>
          </div>
        </div>`;
      }).join(''):'<div style="text-align:center;padding:20px;color:var(--text3);font-style:italic;font-family:var(--serif)">первый комментарий...</div>'}
    </div>
  `;
}

// ── публикация ──
async function publishPost(){
  const text = document.getElementById('post-text').value.trim();
  if(!text){ toast('напиши что-нибудь'); return; }
  const imgUrl = document.getElementById('post-img').value.trim();
  const post = {
    author: D.currentUser?.name||'Аноним',
    text, ts: Date.now(), time: nowTime(),
    img: imgUrl||null, reactions:{}, comments:{}
  };
  try{
    const res = await fbPost('feed', post);
    post._key = res.name;
    fbFeed.unshift(post); D.feed=[...fbFeed];
    document.getElementById('post-text').value='';
    document.getElementById('post-img').value='';
    closePostEditor(); renderFeed(); renderHome();
    toast('пост опубликован');
  }catch(e){ toast('ошибка публикации'); }
}

async function deletePost(key){
  fbFeed=fbFeed.filter(p=>p._key!==key); D.feed=[...fbFeed];
  if(curScreen==='post') navigate('feed');
  else renderFeed();
  renderHome();
  try{ await fbDelete(`feed/${key}`); }catch(e){}
}

function openPostEditor(){
  document.getElementById('post-editor').classList.remove('hidden');
  setTimeout(()=>document.getElementById('post-text').focus(),50);
}
function closePostEditor(){
  document.getElementById('post-editor').classList.add('hidden');
}

// ── рендер ленты ──
function renderFeed(){
  const el=document.getElementById('feed-list'); if(!el) return;
  const posts=fbFeed.length?fbFeed:(D.feed||[]);
  if(!posts.length){el.innerHTML='<div class="feed-empty">лента пуста — будьте первым!</div>';return;}
  const isAdmin=D.currentUser?.role==='admin';
  const myName=D.currentUser?.name;
  el.innerHTML=posts.map(p=>{
    const c=avatarColor(p.author);
    const canDel=isAdmin||p.author===myName;
    const likes=countReactions(p,'👍');
    const dislikes=countReactions(p,'👎');
    const myReact=p.reactions?.[myName];
    const commCount=p.comments?Object.keys(p.comments).length:0;
    return `<div class="feed-post" onclick="openPost('${p._key}')">
      <div class="feed-post-hdr">
        <div class="feed-post-av" style="background:${c.bg};border:.5px solid ${c.bd};color:${c.tx}">${(p.author||'?')[0].toUpperCase()}</div>
        <div class="feed-post-meta">
          <div class="feed-post-author">${esc(p.author)}</div>
          <div class="feed-post-time">${p.time||''}</div>
        </div>
        ${canDel?`<button class="msg-act" onclick="event.stopPropagation();deletePost('${p._key}')" style="margin-left:auto">✕</button>`:''}
      </div>
      ${p.img?`<img class="feed-post-img" src="${p.img}" onerror="this.style.display='none'" loading="lazy">`:''}
      <div class="feed-post-text">${esc(p.text)}</div>
      <div class="feed-reactions" onclick="event.stopPropagation()">
        <button class="react-btn ${myReact==='👍'?'active':''}" onclick="reactToPost('${p._key}','👍')">
          👍 <span>${likes||''}</span>
        </button>
        <button class="react-btn ${myReact==='👎'?'active':''}" onclick="reactToPost('${p._key}','👎')">
          👎 <span>${dislikes||''}</span>
        </button>
        ${commCount?`<button class="react-btn" onclick="openPost('${p._key}')">💬 <span>${commCount}</span></button>`:`<button class="react-btn" onclick="openPost('${p._key}')">💬 <span style="font-size:11px">комментировать</span></button>`}
      </div>
    </div>`;
  }).join('');
}

// ── пост дня на главной (топ по лайкам) ──
function getBestPost(){
  if(!fbFeed.length) return null;
  return [...fbFeed].sort((a,b)=>{
    const al=countReactions(a,'👍'); const bl=countReactions(b,'👍');
    return bl-al;
  })[0];
}
