// ══════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════

function renderProfile(){
  const u=D.currentUser; if(!u) return;
  const c=avatarColor(u.name);

  // Big profile avatar
  const av=document.getElementById('prof-tg-av');
  if(av){
    if(u.avatarUrl){
      av.innerHTML=`<img src="${u.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      av.style.background='none'; av.style.borderColor=c.bd;
    } else {
      av.innerHTML=(u.name||'?')[0].toUpperCase();
      av.style.background=c.bg; av.style.borderColor=c.bd; av.style.color=c.tx;
    }
  }

  // Navbar avatar
  const navAv=document.getElementById('nav-prof-av');
  if(navAv){
    if(u.avatarUrl){
      navAv.innerHTML=`<img src="${u.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      navAv.style.background='none';
    } else {
      navAv.innerHTML=(u.name||'?')[0].toUpperCase();
      navAv.style.background=c.bg;
      navAv.style.border=`.5px solid ${c.bd}`;
      navAv.style.color=c.tx;
    }
  }
  const nameEl = document.getElementById('prof-tg-name');
  if(nameEl) nameEl.textContent = u.name||'—';
  const roleEl = document.getElementById('prof-tg-role');
  if(roleEl) roleEl.textContent = u.role==='admin'?'администратор':'участник';
  const bioEl = document.getElementById('prof-tg-bio');
  if(bioEl) bioEl.textContent = u.bio||'';

  const socEl = document.getElementById('prof-socials');
  if(socEl){
    const s = u.socials||{};
    const defs = [
      {k:'vk',   label:'VK',        icon:'<svg viewBox="0 0 20 20" width="13" height="13"><path d="M2 5h3l2 5 2-5h3v8h-2V8l-2 5H8L6 8v5H2V5z" fill="currentColor"/></svg>'},
      {k:'tg',   label:'Telegram',  icon:'<svg viewBox="0 0 20 20" width="13" height="13"><path d="M17 3L2 9l5 2 2 6 3-3 4 3 1-14z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/></svg>'},
      {k:'inst', label:'Instagram', icon:'<svg viewBox="0 0 20 20" width="13" height="13"><rect x="3" y="3" width="14" height="14" rx="4" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="14.5" cy="5.5" r=".8" fill="currentColor"/></svg>'},
      {k:'other',label:'Сайт',      icon:'<svg viewBox="0 0 20 20" width="13" height="13"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M3 10h14M10 3c-2 4-2 10 0 14M10 3c2 4 2 10 0 14" stroke="currentColor" stroke-width="1" fill="none"/></svg>'},
    ];
    socEl.innerHTML = defs.filter(d=>s[d.k]).map(d=>
      `<a class="social-chip" href="${s[d.k]}" target="_blank">${d.icon} ${d.label}</a>`
    ).join('');
  }

  const sg = u.subgroup||0;
  document.getElementById('sg1-btn')?.classList.toggle('active',sg===1);
  document.getElementById('sg2-btn')?.classList.toggle('active',sg===2);

  const catBtn = document.getElementById('prof-cat-mood-btn');
  if(catBtn){ const m=D.cat.mood; catBtn.textContent=m>60?'доволен':m>30?'задумчив':'скучает'; }

  updateThemeLabel(); updateNotifLabel();
}

function openProfileEdit(){
  const u=D.currentUser; if(!u) return;
  const s=u.socials||{};
  document.getElementById('pe-name').value  =u.name||'';
  document.getElementById('pe-bio').value   =u.bio||'';
  document.getElementById('pe-vk').value    =s.vk||'';
  document.getElementById('pe-tg').value    =s.tg||'';
  document.getElementById('pe-inst').value  =s.inst||'';
  document.getElementById('pe-other').value =s.other||'';
  document.getElementById('pe-avatar-url').value=u.avatarUrl||'';
  refreshEditAvatar(u.name, u.avatarUrl);
  document.getElementById('pe-name').oninput=function(){ refreshEditAvatar(this.value||u.name, document.getElementById('pe-avatar-url').value); };
  document.getElementById('prof-edit-modal').classList.remove('hidden');
  setTimeout(()=>document.getElementById('pe-name').focus(),50);
}

function refreshEditAvatar(name, avatarUrl){
  const av=document.getElementById('prof-edit-av'); if(!av) return;
  if(avatarUrl){
    av.innerHTML=`<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    av.style.cssText='width:60px;height:60px;border-radius:50%;overflow:hidden;flex-shrink:0';
  } else {
    const c=avatarColor(name);
    av.innerHTML=(name||'?')[0].toUpperCase();
    av.style.cssText=`background:${c.bg};border:1px solid ${c.bd};color:${c.tx};width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:300;font-family:var(--serif);flex-shrink:0`;
  }
}

function pickAvatar(){
  clPickAndUpload({
    accept:'image/*',
    onStart(){ toast('загружаю аватарку...'); },
    onDone({url}){
      document.getElementById('pe-avatar-url').value=url;
      refreshEditAvatar(document.getElementById('pe-name').value, url);
      toast('аватарка загружена');
    }
  });
}

function closeProfEdit(){
  document.getElementById('prof-edit-modal').classList.add('hidden');
}

async function saveProfileEdit(){
  const name=document.getElementById('pe-name').value.trim().slice(0,24);
  if(!name){ toast('введи имя'); return; }
  const oldName=D.currentUser.name;
  D.currentUser.name     =name;
  D.currentUser.bio      =document.getElementById('pe-bio').value.trim().slice(0,120);
  D.currentUser.avatarUrl=document.getElementById('pe-avatar-url').value||'';
  D.currentUser.socials  ={
    vk:   document.getElementById('pe-vk').value.trim(),
    tg:   document.getElementById('pe-tg').value.trim(),
    inst: document.getElementById('pe-inst').value.trim(),
    other:document.getElementById('pe-other').value.trim(),
  };
  const m=D.members.find(x=>x.name===oldName);
  if(m){ m.name=name; m.bio=D.currentUser.bio; m.avatarUrl=D.currentUser.avatarUrl; m.socials=D.currentUser.socials; await fbSaveMember(m); }
  save(); closeProfEdit(); renderProfile(); renderHome(); toast('профиль обновлён');
}

async function setSubgroup(n){
  D.currentUser.subgroup = D.currentUser.subgroup===n ? 0 : n;
  const m = D.members.find(x=>x.name===D.currentUser.name);
  if(m){ m.subgroup=D.currentUser.subgroup; await fbSaveMember(m); }
  save(); renderProfile(); renderSchedule();
  toast(D.currentUser.subgroup?`подгруппа ${D.currentUser.subgroup}`:'подгруппа снята');
}

function doLogout(){
  D.currentUser=null; save();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('gate').classList.remove('hidden');
  document.getElementById('inv-inp').value='';
  const fab=document.getElementById('admin-fab'); if(fab) fab.remove();
}

async function kickMember(fbKey,code){
  if(fbKey) await fbDelMember(fbKey);
  fbMembers=fbMembers.filter(m=>m._key!==fbKey);
  D.members=D.members.filter(m=>m.code!==code);
  const inv=fbInvites.find(i=>i.code===code);
  if(inv&&inv._key){ await fbDelete(`invites/${inv._key}`); fbInvites=fbInvites.filter(i=>i._key!==inv._key); D.invites=D.invites.filter(i=>i.code!==code); }
  save(); renderAdmin(); toast('участник удалён');
}

// ══════════════════════════════════════════════
// MEMBERS PANEL IN CHAT
// ══════════════════════════════════════════════
function renderMembersPanel(){
  const el=document.getElementById('members-panel'); if(!el) return;
  const members=fbMembers.length?fbMembers:D.members;
  el.innerHTML=`<div class="mp-ttl">участники</div>`+
    members.map(m=>`<div class="mp-item">
      <div class="mp-dot" style="background:${m.role==='admin'?'var(--gold)':'var(--grn)'}"></div>
      <div><div class="mp-name">${m.name}</div>${m.subgroup?`<div class="mp-sub">пг${m.subgroup}</div>`:''}</div>
    </div>`).join('');
}
