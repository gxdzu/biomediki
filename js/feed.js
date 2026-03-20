// ══════════════════════════════════════════════
// FEED
// ══════════════════════════════════════════════
let fbFeed = [];

async function fbPollFeed(){
  try{
    const data = await fbGet('feed');
    const arr = data ? Object.entries(data).map(([k,v])=>({...v,_key:k})).sort((a,b)=>b.ts-a.ts) : [];
    if(JSON.stringify(arr)!==JSON.stringify(fbFeed)){
      fbFeed=arr; D.feed=arr;
      if(curScreen==='feed') renderFeed();
    }
  }catch(e){}
}

async function publishPost(){
  const text = document.getElementById('post-text').value.trim();
  if(!text){ toast('напиши что-нибудь'); return; }
  const imgUrl = document.getElementById('post-img').value.trim();
  const post = {
    author: D.currentUser?.name||'Аноним',
    text, ts: Date.now(),
    time: nowTime(),
    img: imgUrl||null,
  };
  try{
    const res = await fbPost('feed', post);
    post._key = res.name;
    fbFeed.unshift(post); D.feed = [...fbFeed];
    document.getElementById('post-text').value='';
    document.getElementById('post-img').value='';
    closePostEditor();
    renderFeed();
    toast('пост опубликован');
  }catch(e){ toast('ошибка публикации'); }
}

async function deletePost(key){
  fbFeed = fbFeed.filter(p=>p._key!==key);
  D.feed = [...fbFeed];
  renderFeed();
  try{ await fbDelete(`feed/${key}`); }catch(e){}
}

function openPostEditor(){
  document.getElementById('post-editor').classList.remove('hidden');
  setTimeout(()=>document.getElementById('post-text').focus(),50);
}
function closePostEditor(){
  document.getElementById('post-editor').classList.add('hidden');
}

function renderFeed(){
  const el = document.getElementById('feed-list');
  if(!el) return;
  const posts = fbFeed.length ? fbFeed : (D.feed||[]);
  if(!posts.length){
    el.innerHTML='<div class="feed-empty">лента пуста — будьте первым!</div>';
    return;
  }
  const isAdmin = D.currentUser?.role==='admin';
  const myName = D.currentUser?.name;
  el.innerHTML = posts.map(p=>{
    const c = avatarColor(p.author);
    const canDel = isAdmin || p.author===myName;
    return `<div class="feed-post">
      <div class="feed-post-hdr">
        <div class="feed-post-av" style="background:${c.bg};border:.5px solid ${c.bd};color:${c.tx}">${(p.author||'?')[0].toUpperCase()}</div>
        <div class="feed-post-meta">
          <div class="feed-post-author">${esc(p.author)}</div>
          <div class="feed-post-time">${p.time||''}</div>
        </div>
        ${canDel?`<button class="msg-act" onclick="deletePost('${p._key}')" style="margin-left:auto">✕</button>`:''}
      </div>
      ${p.img?`<img class="feed-post-img" src="${p.img}" onerror="this.style.display='none'" loading="lazy">`:''}
      <div class="feed-post-text">${esc(p.text)}</div>
    </div>`;
  }).join('');
}
