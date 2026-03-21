// THEME TOGGLE
// ══════════════════════════════════════════════
function initTheme(){
  const saved = localStorage.getItem('sg_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.querySelector('meta[name=theme-color]').content = saved==='dark'?'#0c0c14':'#f5f2eb';
  updateThemeLabel();
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme', next);
  document.querySelector('meta[name=theme-color]').content = next==='dark'?'#0c0c14':'#f5f2eb';
  localStorage.setItem('sg_theme', next);
  updateThemeLabel();
  // update date input color-scheme
  document.querySelectorAll('input[type=date]').forEach(el=>{
    el.style.colorScheme = next;
  });
}
function updateThemeLabel(){
  const el = document.getElementById('theme-label');
  if(el) el.textContent = document.documentElement.getAttribute('data-theme')==='dark'?'тёмная ✓':'светлая ✓';
}

// ══════════════════════════════════════════════
// NOTIFICATIONS (Web Push via Notification API)
// ══════════════════════════════════════════════
function requestNotifs(){
  const el = document.getElementById('notif-label');
  if(!('Notification' in window)){
    if(el) el.textContent = 'не поддерживается';
    return;
  }
  if(Notification.permission === 'granted'){
    if(el) el.textContent = 'включены ✓';
    toast('уведомления уже включены');
    return;
  }
  Notification.requestPermission().then(p=>{
    if(p==='granted'){
      if(el) el.textContent = 'включены ✓';
      toast('уведомления включены');
      new Notification('Биомедики', {body:'уведомления работают 🐱', icon:''});
    } else {
      if(el) el.textContent = 'отклонено';
    }
  });
}
function updateNotifLabel(){
  const el = document.getElementById('notif-label');
  if(!el) return;
  if(!('Notification' in window)) el.textContent = 'не поддерживается';
  else if(Notification.permission==='granted') el.textContent = 'включены ✓';
  else el.textContent = 'включить';
}
function notifyIfNeeded(title, body){
  if(typeof Notification!=='undefined' && Notification.permission==='granted'){
    new Notification(title, {body, icon:''});
  }
}

// ══════════════════════════════════════════════
// DEADLINE DATE FORMATTING
// ══════════════════════════════════════════════
function formatDue(dateStr){
  if(!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  if(isNaN(d)) return dateStr;
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.round((d-now)/86400000);
  const days = ['вс','пн','вт','ср','чт','пт','сб'];
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  if(diff < 0) return `просрочено`;
  if(diff === 0) return `сегодня`;
  if(diff === 1) return `завтра`;
  if(diff <= 6) return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  return `${d.getDate()} ${months[d.getMonth()]}`;
}
function urgencyFromDate(dateStr){
  if(!dateStr) return 'mid';
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((d - new Date().setHours(0,0,0,0))/86400000);
  if(diff <= 1) return 'high';
  if(diff <= 4) return 'mid';
  return 'low';
}

// ══════════════════════════════════════════════
// MATERIALS — Firebase sync + personal
// ══════════════════════════════════════════════
let fbLinks = [];
let linksTab = 'common'; // 'common' | 'personal'

function switchLinksTab(tab){
  linksTab = tab;
  document.getElementById('links-tab-common')?.classList.toggle('active', tab==='common');
  document.getElementById('links-tab-personal')?.classList.toggle('active', tab==='personal');
  renderLinks();
}

function getPersonalLinks(){
  const key='sg_plinks_'+(D.currentUser?.name||'');
  try{ return JSON.parse(localStorage.getItem(key)||'[]'); }catch(e){ return []; }
}
function savePersonalLinks(arr){
  localStorage.setItem('sg_plinks_'+(D.currentUser?.name||''), JSON.stringify(arr));
}

async function fbPollLinks(){
  try {
    const data = await fbGet('links');
    const arr = data ? Object.entries(data).map(([k,v])=>({...v,_key:k})) : [];
    if(JSON.stringify(arr) !== JSON.stringify(fbLinks)){
      fbLinks = arr; D.links = arr;
      if(curScreen==='links') renderLinks();
    }
  } catch(e){}
}
async function fbAddLink(link){
  try {
    const res = await fbPost('links', link);
    link._key = res.name;
    fbLinks.push(link); D.links = [...fbLinks];
    renderLinks(); renderAdminLists();
    toast('материал добавлен');
  } catch(e){ toast('ошибка'); }
}
async function fbDelLink(key){
  fbLinks = fbLinks.filter(l=>l._key!==key);
  D.links = [...fbLinks];
  renderLinks(); renderAdminLists();
  try { await fbDelete(`links/${key}`); } catch(e){}
}

const LINK_ICONS = {
  конспект:    `<svg viewBox="0 0 20 20" width="16" height="16"><path d="M4 3h8l4 4v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M12 3v5h4M7 10h6M7 13h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  задачи:      `<svg viewBox="0 0 20 20" width="16" height="16"><path d="M9 5H7a1 1 0 00-1 1v9a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1h-2M9 5a1 1 0 001 1h2a1 1 0 001-1M9 5a1 1 0 011-1h2a1 1 0 011 1" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M8 11l2 2 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  презентация: `<svg viewBox="0 0 20 20" width="16" height="16"><rect x="2" y="3" width="16" height="11" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M10 14v3M7 17h6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  книга:       `<svg viewBox="0 0 20 20" width="16" height="16"><path d="M4 2h9l3 3v13H4V2z" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M13 2v4h3M7 8h6M7 11h6M7 14h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  другое:      `<svg viewBox="0 0 20 20" width="16" height="16"><path d="M10 13a5 5 0 007.54.54l2-2a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-2 2a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>`,
};

function renderLinks(){
  const el = document.getElementById('links-list'); if(!el) return;
  const query = (document.getElementById('links-search')?.value||'').toLowerCase().trim();
  const isAdmin = D.currentUser?.role==='admin';

  if(linksTab==='personal'){
    let items = getPersonalLinks();
    if(query) items = items.filter(l=>(l.title+l.subject+l.url).toLowerCase().includes(query));
    if(!items.length){
      el.innerHTML=`<div style="text-align:center;padding:30px 20px;color:var(--text3);font-family:var(--serif);font-style:italic">личных материалов нет</div>`;
      return;
    }
    el.innerHTML = items.map(l=>`
      <div style="display:flex;align-items:center;gap:0;margin-bottom:8px">
        <a href="${l.url}" target="_blank" style="text-decoration:none;flex:1">
          <div class="link-card" style="margin-bottom:0">
            <div class="link-icon">${LINK_ICONS[l.type]||LINK_ICONS.другое}</div>
            <div class="link-body">
              <div class="link-title">${esc(l.title)}</div>
              <div class="link-meta">${l.subject||''} · ${l.type}</div>
            </div>
          </div>
        </a>
        <button class="inv-del" onclick="delPersonalLink(${l.id})" style="margin-left:4px">×</button>
      </div>`).join('');
    return;
  }

  // COMMON
  let items = fbLinks.length ? fbLinks : (D.links||[]);
  if(query) items = items.filter(l=>(l.title+l.subject+l.url).toLowerCase().includes(query));
  if(!items.length){
    el.innerHTML=`<div style="text-align:center;padding:40px 20px;color:var(--text3);font-family:var(--serif);font-style:italic;font-size:16px">${query?'ничего не найдено':'материалы появятся здесь'}</div>`;
    return;
  }
  const bySubj = {};
  items.forEach(l=>{ const s=l.subject||'общее'; if(!bySubj[s]) bySubj[s]=[]; bySubj[s].push(l); });
  el.innerHTML = Object.entries(bySubj).map(([subj,links])=>`
    <div style="margin-bottom:20px">
      <div class="sec-title" style="padding:0 0 8px">${subj}</div>
      ${links.map(l=>`
        <div style="display:flex;align-items:center;gap:0;margin-bottom:8px">
          <a href="${l.url}" target="_blank" style="text-decoration:none;flex:1">
            <div class="link-card" style="margin-bottom:0">
              <div class="link-icon">${LINK_ICONS[l.type]||LINK_ICONS.другое}</div>
              <div class="link-body">
                <div class="link-title">${esc(l.title)}</div>
                <div class="link-meta">${l.type}</div>
              </div>
              <svg viewBox="0 0 16 16" width="12" height="12" style="flex-shrink:0;color:var(--text3)"><path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </a>
          ${isAdmin?`<button class="inv-del" onclick="fbDelLink('${l._key}')" style="margin-left:4px">×</button>`:''}
        </div>`).join('')}
    </div>`).join('');
}

function delPersonalLink(id){
  savePersonalLinks(getPersonalLinks().filter(l=>l.id!==id));
  renderLinks();
}

// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// DEADLINE REMINDERS
// ══════════════════════════════════════════════
let _reminderLastFired = {};

function checkDeadlineReminders(){
  if(typeof Notification==='undefined'||Notification.permission!=='granted') return;
  const myName=D.currentUser?.name; if(!myName) return;
  const now=new Date(); now.setSeconds(0,0);
  D.homework.forEach(hw=>{
    if(!hw.dueDate) return;
    if(hw.doneBy?.includes(myName)) return; // already done
    const due=new Date(hw.dueDate+'T00:00:00');
    const diffH=Math.round((due-now)/3600000);
    // fire at ~24h and ~1h before, but only once per window
    const key=hw.id+'_'+diffH;
    if(_reminderLastFired[key]) return;
    if(diffH===24){
      _reminderLastFired[key]=true;
      notifyIfNeeded(`📅 Завтра дедлайн`,`${hw.title} · ${hw.subject}`);
    } else if(diffH===1){
      _reminderLastFired[key]=true;
      notifyIfNeeded(`⏰ Через час дедлайн!`,`${hw.title} · ${hw.subject}`);
    } else if(diffH===0){
      _reminderLastFired[key]=true;
      notifyIfNeeded(`🔴 Дедлайн сегодня!`,`${hw.title} · ${hw.subject}`);
    }
  });
}

// Check every minute
setInterval(checkDeadlineReminders, 60000);

// ══════════════════════════════════════════════
// DEADLINE REMINDERS
// ══════════════════════════════════════════════
let reminderChecked = false;

function checkDeadlineReminders(){
  if(reminderChecked) return;
  if(typeof Notification==='undefined'||Notification.permission!=='granted') return;
  reminderChecked = true;

  const myName = D.currentUser?.name;
  const now = new Date(); now.setHours(0,0,0,0);
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate()+1);
  const dayAfter  = new Date(now); dayAfter.setDate(dayAfter.getDate()+2);

  D.homework.forEach(hw=>{
    if(!hw.dueDate) return;
    if(hw.doneBy?.includes(myName)) return; // already done
    const due = new Date(hw.dueDate+'T00:00:00');

    // Today
    if(due.getTime()===now.getTime()){
      new Notification('⏰ Сдать сегодня!', {
        body: `${hw.title} · ${hw.subject}`,
        icon: ''
      });
    }
    // Tomorrow
    else if(due.getTime()===tomorrow.getTime()){
      new Notification('📅 Сдать завтра', {
        body: `${hw.title} · ${hw.subject}`,
        icon: ''
      });
    }
    // In 2 days
    else if(due.getTime()===dayAfter.getTime()){
      new Notification('📌 Послезавтра дедлайн', {
        body: `${hw.title} · ${hw.subject}`,
        icon: ''
      });
    }
  });
}

// ══════════════════════════════════════════════
// LINK EDITOR — upload vs url mode
// ══════════════════════════════════════════════
let _linkMode = 'upload';

function setLinkMode(mode){
  _linkMode = mode;
  document.getElementById('link-upload-mode').style.display = mode==='upload'?'':'none';
  document.getElementById('link-url-mode').style.display    = mode==='url'?'':'none';
  document.getElementById('link-mode-upload').classList.toggle('active', mode==='upload');
  document.getElementById('link-mode-url').classList.toggle('active', mode==='url');
  if(mode==='upload') document.getElementById('n-lurl').value='';
  else document.getElementById('n-lurl-hidden').value='';
}

function linkPickFile(){
  clPickAndUpload({
    accept: '*/*',
    onStart(file){
      document.getElementById('link-upload-btn').disabled=true;
      document.getElementById('link-upload-btn').textContent='загрузка...';
      document.getElementById('link-upload-progress').style.display='block';
    },
    onProgress(pct){
      document.getElementById('link-upload-bar').style.width=pct+'%';
      document.getElementById('link-upload-pct').textContent=pct+'%';
    },
    onDone({url, originalFilename, format}, file){
      const name=(originalFilename&&format)?`${originalFilename}.${format}`:(file?.name||'файл');
      document.getElementById('n-lurl-hidden').value=url;
      document.getElementById('link-upload-progress').style.display='none';
      document.getElementById('link-upload-btn').disabled=false;
      document.getElementById('link-upload-btn').textContent='выбрать другой файл';
      const nameEl=document.getElementById('link-upload-name');
      nameEl.textContent='✓ '+name; nameEl.style.display='block';
      // Auto-fill title if empty
      const titleEl=document.getElementById('n-ltitle');
      if(titleEl&&!titleEl.value) titleEl.value=(originalFilename||name).replace(/\.[^.]+$/,'');
      toast('файл загружен ✓');
    },
    onError(){
      document.getElementById('link-upload-btn').disabled=false;
      document.getElementById('link-upload-btn').textContent='выбрать файл с устройства';
      document.getElementById('link-upload-progress').style.display='none';
    }
  });
}

function openLinkEditor(){
  _linkMode='upload';
  document.getElementById('link-editor').classList.remove('hidden');
  setLinkMode('upload');
  document.getElementById('n-lurl-hidden').value='';
  document.getElementById('link-upload-name').style.display='none';
  document.getElementById('link-upload-btn').textContent='выбрать файл с устройства';
  setTimeout(()=>document.getElementById('n-ltitle')?.focus(),50);
}

function closeLinkEditor(){
  document.getElementById('link-editor').classList.add('hidden');
}

function addLink(){
  const title=v('n-ltitle').trim(), subject=v('n-lsubj').trim();
  const type=v('n-ltype');
  // URL comes from upload or manual input
  const url=(_linkMode==='upload'
    ? document.getElementById('n-lurl-hidden').value
    : v('n-lurl').trim());
  if(!title||!url){toast('заполни название и добавь файл или ссылку');return}
  ['n-ltitle','n-lsubj','n-lurl'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('n-lurl-hidden').value='';
  closeLinkEditor();
  if(linksTab==='personal'){
    const arr=getPersonalLinks();
    arr.push({id:Date.now(),title,subject,url,type});
    savePersonalLinks(arr);
    renderLinks(); toast('добавлено');
  } else {
    fbAddLink({title,subject,url,type,ts:Date.now()});
  }
}
