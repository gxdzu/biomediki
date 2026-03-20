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
// MATERIALS — Firebase sync
// ══════════════════════════════════════════════
let fbLinks = [];

async function fbPollLinks(){
  try {
    const data = await fbGet('links');
    const arr = data ? Object.entries(data).map(([k,v])=>({...v,_key:k})) : [];
    if(JSON.stringify(arr) !== JSON.stringify(fbLinks)){
      fbLinks = arr;
      D.links = arr;
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
  const el = document.getElementById('links-list');
  if(!el) return;
  const items = fbLinks.length ? fbLinks : (D.links||[]);
  // group by subject
  const bySubj = {};
  items.forEach(l=>{
    const s = l.subject||'общее';
    if(!bySubj[s]) bySubj[s]=[];
    bySubj[s].push(l);
  });
  if(!items.length){
    el.innerHTML=`<div style="text-align:center;padding:40px 20px;color:var(--text3);font-family:var(--serif);font-style:italic;font-size:16px">материалы появятся здесь</div>`;
    return;
  }
  el.innerHTML = Object.entries(bySubj).map(([subj,links])=>`
    <div style="margin-bottom:20px">
      <div class="sec-title" style="padding:0 0 8px">${subj}</div>
      ${links.map(l=>`
        <a href="${l.url}" target="_blank" style="text-decoration:none">
          <div class="link-card">
            <div class="link-icon">${LINK_ICONS[l.type]||LINK_ICONS.другое}</div>
            <div class="link-body">
              <div class="link-title">${esc(l.title)}</div>
              <div class="link-meta">${l.type}</div>
            </div>
            <svg viewBox="0 0 16 16" width="12" height="12" style="flex-shrink:0;color:var(--text3)"><path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </a>`).join('')}
    </div>`).join('');
}

function addLink(){
  const title=v('n-ltitle').trim(), subject=v('n-lsubj').trim();
  const url=v('n-lurl').trim(), type=v('n-ltype');
  if(!title||!url){toast('заполни название и ссылку');return}
  ['n-ltitle','n-lsubj','n-lurl'].forEach(id=>document.getElementById(id).value='');
  fbAddLink({title, subject, url, type, ts: Date.now()});
}

// ══════════════════════════════════════════════