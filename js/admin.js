// ADMIN
// ══════════════════════════════════════════════
function openAdmin(){document.getElementById('admin').classList.remove('hidden');renderAdmin()}
function closeAdmin(){document.getElementById('admin').classList.add('hidden')}
function renderAdmin(){
  renderInviteList();
  const members = fbMembers.length ? fbMembers : D.members;
  document.getElementById('mem-list').innerHTML=members.map(m=>`
    <div class="mem-item">
      <div class="mem-name">${m.name}</div>
      <div class="mem-role ${m.role}">${m.role==='admin'?'администратор':'участник'}${m.subgroup?` · пг${m.subgroup}`:''}</div>
      ${m.role!=='admin'?`<button class="inv-del" onclick="kickMember('${m._key||''}','${m.code||''}')" title="удалить">×</button>`:''}
    </div>`).join('');
  renderAdminLists();
}
function renderAdminLists(){
  const sl=document.getElementById('adm-sched-list');
  if(sl){
    const sorted=[...D.schedule].sort((a,b)=>a.day-b.day||a.time.localeCompare(b.time));
    sl.innerHTML=sorted.length?sorted.map(l=>{
      const gi=D.schedule.indexOf(l);
      return `<div class="adm-les-item">
        <div class="adm-item-info">
          <div class="adm-item-name">${l.subject}</div>
          <div class="adm-item-meta">${DAYS_RU[l.day]}, ${l.time}${l.end?'–'+l.end:''} · ${l.room}${l.type?' · '+l.type:''}${l.subgroup?' · '+l.subgroup:''}</div>
        </div>
        <button class="msg-act" onclick="openLesEdit(${gi})" style="font-size:12px;padding:4px 6px">✎</button>
        <button class="inv-del" onclick="delLessonByIdx(${gi})">×</button>
      </div>`;
    }).join(''):'<div style="color:var(--text3);font-size:12px;padding:8px 0">расписание пусто</div>';
  }
  const hl=document.getElementById('adm-hw-list');
  if(hl){
    hl.innerHTML=D.homework.length?D.homework.map(hw=>`
      <div class="adm-hw-item">
        <div class="adm-item-info">
          <div class="adm-item-name">${hw.title}</div>
          <div class="adm-item-meta">${hw.subject} · ${hw.due}</div>
        </div>
        <button class="inv-del" onclick="delHwAdmin(${hw.id})">×</button>
      </div>`).join(''):'<div style="color:var(--text3);font-size:12px;padding:8px 0">заданий нет</div>';
  }
  const ll = document.getElementById('adm-links-list');
  if(ll){
    ll.innerHTML = fbLinks.length ? fbLinks.map(l=>`
      <div class="adm-les-item">
        <div class="adm-item-info">
          <div class="adm-item-name">${esc(l.title)}</div>
          <div class="adm-item-meta">${l.subject||'—'} · ${l.type}</div>
        </div>
        <button class="inv-del" onclick="fbDelLink('${l._key}')">×</button>
      </div>`).join('')
      :'<div style="color:var(--text3);font-size:12px;padding:8px 0">материалов нет</div>';
  }
}
function delHwAdmin(id){
  const hw = D.homework.find(h=>h.id===id);
  if (hw) fbDelHw(hw._key);
}
// ── INVITES via Firebase ──
let fbInvites = [];

async function fbPollInvites() {
  try {
    const data = await fbGet('invites');
    const arr = data ? Object.entries(data).map(([k,v]) => ({...v, _key:k})) : [];
    if (JSON.stringify(arr) !== JSON.stringify(fbInvites)) {
      fbInvites = arr;
      D.invites = arr;
      if (document.getElementById('inv-list')) renderInviteList();
    }
  } catch(e) {}
  // Always show the gate form after first attempt (success or fail)
  const loading = document.getElementById('gate-loading');
  const form = document.getElementById('gate-form');
  if (loading) loading.style.display = 'none';
  if (form) { form.style.display = 'flex'; setTimeout(()=>document.getElementById('inv-inp')?.focus(), 50); }
}

async function genInvite() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const p = n => Array.from({length:n}, () => c[Math.floor(Math.random()*c.length)]).join('');
  const code = `${p(4)}-${p(4)}`;
  const inv = {code, used:false, usedBy:null};
  toast('создаю инвайт...');
  try {
    const res = await fbPost('invites', inv);
    console.log('Firebase invite response:', res);
    if(!res || !res.name) throw new Error('no key returned: ' + JSON.stringify(res));
    inv._key = res.name;
    fbInvites.push(inv);
    D.invites = [...fbInvites];
    renderAdmin();
    toast('создан: ' + code);
  } catch(e) {
    console.error('genInvite Firebase error:', e);
    toast('⚠ ошибка Firebase: ' + e.message);
    // fallback: save locally so at least admin can see it
    D.invites.push(inv); save(); renderAdmin();
  }
}

async function delInvite(i) {
  const inv = fbInvites[i] || D.invites[i];
  if (inv?._key) {
    try { await fbDelete(`invites/${inv._key}`); } catch(e) {}
  }
  fbInvites = fbInvites.filter((_,idx) => idx !== i);
  D.invites = D.invites.filter((_,idx) => idx !== i);
  save(); renderAdmin();
}

function renderInviteList() {
  const invites = fbInvites.length ? fbInvites : D.invites;
  document.getElementById('inv-list').innerHTML = invites.map((inv,i) => `
    <div class="inv-item">
      <div class="inv-code">${inv.code}</div>
      <div class="inv-stat">${inv.used ? `использован · ${inv.usedBy}` : 'свободен'}</div>
      <button class="inv-del" onclick="delInvite(${i})" title="удалить">×</button>
    </div>`).join('') || '<div style="color:var(--text3);font-size:12px;padding:8px 0">нет инвайтов</div>';
}
function addLesson(){
  const day=+v('n-day'),time=v('n-time').trim(),end=v('n-end').trim(),subject=v('n-subj').trim();
  const room=v('n-room').trim(),link=v('n-link').trim(),color=v('n-color');
  const type=v('n-type'),subgroup=v('n-sg');
  if(!time||!subject||!room){toast('заполни все поля');return}
  const endTime=end||calcEnd(time);
  const lesson={day,time,end:endTime,subject,room,color,link,type,subgroup};
  ['n-time','n-end','n-subj','n-room','n-link'].forEach(id=>document.getElementById(id).value='');
  fbAddLesson(lesson);
}
function calcEnd(time){
  const[h,m]=(time.split(':').map(Number));
  const em=m+30,eh=h+1+Math.floor(em/60);
  return `${eh}:${String(em%60).padStart(2,'0')}`;
}
function addHw(){
  const title=v('n-htitle').trim(),subject=v('n-hsubj').trim();
  const dueDate=v('n-hdue'),urgency=v('n-hurg');
  if(!title||!subject||!dueDate){toast('заполни все поля');return}
  const hw={id:D.hwNextId++,title,subject,dueDate,due:formatDue(dueDate),urgency:urgency||urgencyFromDate(dueDate),doneBy:[]};
  ['n-htitle','n-hsubj'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('n-hdue').value='';
  fbAddHw(hw);
}
function setQuote(){
  const q=v('n-quote').trim();if(!q)return;
  document.getElementById('n-quote').value='';
  fbSetQuote(q);
}

// ══════════════════════════════════════════════