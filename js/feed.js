// ══════════════════════════════════════════════
// FEED — лента с реакциями и комментариями
// ══════════════════════════════════════════════
let fbFeed = [];
let curPostKey = null;

// ── медиа рендер (фото, видео, аудио, YouTube) ──
function getMediaHtml(url, compact=false){
  if(!url) return '';
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if(ytMatch) return `<div class="video-wrap${compact?' compact':''}"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
  if(/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return `<video class="feed-post-img${compact?' compact':''}" src="${url}" controls playsinline webkit-playsinline style="width:100%"></video>`;
  if(/\.(mp3|m4a|aac|wav|ogg)(\?|$)/i.test(url)) return `<audio controls style="width:100%;margin:6px 0;border-radius:var(--rs)"><source src="${url}"></audio>`;
  // Cloudinary audio (resource_type=video for audio in Cloudinary)
  if(url.includes('cloudinary.com')&&/\.(mp3|m4a|aac|wav)/.test(url)) return `<audio controls style="width:100%;margin:6px 0"><source src="${url}"></audio>`;
  return `<img class="feed-post-img${compact?' compact':''}" src="${url}" onerror="this.style.display='none'" loading="lazy">`;
}

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
  if(myReact===type) delete reactions[myName];
  else {
    reactions[myName] = type;
    // уведомить автора если это не сам автор
    if(post.author !== myName){
      notifyIfNeeded(
        `${type === '👍' ? '👍' : '👎'} ${myName} отреагировал на пост`,
        post.text.slice(0,60)
      );
    }
  }
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

function showReactions(key){
  const post = fbFeed.find(p=>p._key===key);
  if(!post||!post.reactions) return;
  const reactions = post.reactions;
  const likes = Object.entries(reactions).filter(([,v])=>v==='👍').map(([k])=>k);
  const dislikes = Object.entries(reactions).filter(([,v])=>v==='👎').map(([k])=>k);
  let msg = '';
  if(likes.length) msg += `👍 ${likes.join(', ')}`;
  if(dislikes.length) msg += (msg?'\n':'') + `👎 ${dislikes.join(', ')}`;
  if(msg) toast(msg);
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
  const myName = D.currentUser?.name||'Аноним';
  const comment = { author: myName, text, ts: Date.now(), time: nowTime() };
  try{
    await fbPost(`feed/${curPostKey}/comments`, comment);
    inp.value='';
    // уведомить автора поста
    const post = fbFeed.find(p=>p._key===curPostKey);
    if(post && post.author !== myName){
      notifyIfNeeded(`💬 ${myName} прокомментировал пост`, text.slice(0,60));
    }
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
        <div class="feed-post-av" style="background:${c.bg};border:.5px solid ${c.bd};color:${c.tx};cursor:pointer" onclick="openMemberProfile('${post.author}')">${(post.author||'?')[0].toUpperCase()}</div>
        <div class="feed-post-meta" style="cursor:pointer" onclick="openMemberProfile('${post.author}')">
          <div class="feed-post-author">${esc(post.author)}</div>
          <div class="feed-post-time">${post.time||''}</div>
        </div>
        ${canDel?`<button class="msg-act" onclick="deletePost('${post._key}')" style="margin-left:auto">✕</button>`:''}
      </div>
      ${getMediaHtml(post.mediaUrl||post.img)}
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
    mediaUrl: imgUrl||null, reactions:{}, comments:{}
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

function setPostMode(mode){
  document.getElementById('post-upload-mode').style.display = mode==='upload' ? '' : 'none';
  document.getElementById('post-link-mode').style.display   = mode==='link'   ? '' : 'none';
  document.getElementById('post-mode-upload').classList.toggle('active', mode==='upload');
  document.getElementById('post-mode-link').classList.toggle('active', mode==='link');
  if(mode==='link'){
    // clear upload state
    document.getElementById('post-img').value='';
    document.getElementById('post-media-preview').style.display='none';
    document.getElementById('post-media-clear').style.display='none';
  }
}

function openPostEditor(){
  document.getElementById('post-editor').classList.remove('hidden');
  setPostMode('upload');
  setTimeout(()=>document.getElementById('post-text').focus(),50);
}
function closePostEditor(){
  document.getElementById('post-editor').classList.add('hidden');
  document.getElementById('post-text').value='';
  document.getElementById('post-img').value='';
  clearPostMedia();
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
        <div class="feed-post-av" style="background:${c.bg};border:.5px solid ${c.bd};color:${c.tx};cursor:pointer" onclick="event.stopPropagation();openMemberProfile('${p.author}')">${(p.author||'?')[0].toUpperCase()}</div>
        <div class="feed-post-meta" style="cursor:pointer" onclick="event.stopPropagation();openMemberProfile('${p.author}')">
          <div class="feed-post-author">${esc(p.author)}</div>
          <div class="feed-post-time">${p.time||''}</div>
        </div>
        ${canDel?`<button class="msg-act" onclick="event.stopPropagation();deletePost('${p._key}')" style="margin-left:auto">✕</button>`:''}
      </div>
      ${getMediaHtml(p.mediaUrl||p.img, true)}
      <div class="feed-post-text">${esc(p.text)}</div>
      <div class="feed-reactions" onclick="event.stopPropagation()">
        <button class="react-btn ${myReact==='👍'?'active':''}" onclick="reactToPost('${p._key}','👍')">
          👍 <span onclick="event.stopPropagation();showReactions('${p._key}')">${likes||''}</span>
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

// ── CLOUDINARY INTEGRATION ──
function postPickMedia(){
  clPickAndUpload({
    accept: 'image/*,video/*,audio/*,.gif',
    onStart(file){
      document.getElementById('post-upload-progress').style.display='block';
      document.getElementById('post-media-btn').disabled=true;
      document.getElementById('post-media-btn').textContent='загрузка...';
      clPreview(file, document.getElementById('post-media-img'));
      document.getElementById('post-media-name').textContent=file.name;
      document.getElementById('post-media-preview').style.display='block';
    },
    onProgress(pct){
      document.getElementById('post-upload-bar').style.width=pct+'%';
      document.getElementById('post-upload-pct').textContent=pct+'%';
    },
    onDone({url}){
      document.getElementById('post-img').value=url;
      document.getElementById('post-upload-progress').style.display='none';
      document.getElementById('post-media-btn').disabled=false;
      document.getElementById('post-media-btn').textContent='выбрать фото / видео / гиф';
      document.getElementById('post-media-clear').style.display='';
      toast('медиа загружено ✓');
    },
    onError(){
      document.getElementById('post-upload-progress').style.display='none';
      document.getElementById('post-media-btn').disabled=false;
      document.getElementById('post-media-btn').textContent='выбрать фото / видео / гиф';
    }
  });
}

function clearPostMedia(){
  document.getElementById('post-img').value='';
  document.getElementById('post-media-preview').style.display='none';
  document.getElementById('post-media-clear').style.display='none';
  document.getElementById('post-media-img').src='';
  document.getElementById('post-media-name').textContent='';
}
