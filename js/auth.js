// ══════════════════════════════════════════════
// AUTH / GATE
// ══════════════════════════════════════════════
let pendingInviteCode = null;

const ADMIN_HASH = 'a6574587459245cdfb4f72cf92360a111af5c825b1ad1d3865c9b1e91dd8827e';

async function hashCode(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function doLogin(){
  const raw = document.getElementById('inv-inp').value.trim().toUpperCase();
  const err = document.getElementById('g-err');
  if(!raw){ err.textContent='введи код'; return; }

  // Admin check
  const inputHash = await hashCode(raw);
  if(inputHash === ADMIN_HASH){
    let m = D.members.find(x=>x.role==='admin');
    if(!m){ m={name:'admin',role:'admin',subgroup:0,code:'__admin__'}; D.members.push(m); }
    D.currentUser = {name:m.name, role:'admin', subgroup:m.subgroup||0, code:'__admin__'};
    save();
    fbSaveMember(m).then(()=>{ if(curScreen==='chat') renderMembersPanel(); });
    launchApp(); return;
  }

  // ВСЕГДА ждём Firebase — локальный кэш может быть устаревшим
  if(fbInvites.length === 0){
    err.textContent = 'загрузка...';
    let waited = 0;
    while(fbInvites.length === 0 && waited < 5000){
      await new Promise(r => setTimeout(r, 300));
      waited += 300;
    }
    err.textContent = '';
  }

  const allInvites = fbInvites;

  // Повторный вход по использованному инвайту
  const usedInv = allInvites.find(i => i.code === raw && i.used);
  if(usedInv){
    // Ждём members или грузим напрямую
    if(fbMembers.length === 0){
      let w = 0;
      while(fbMembers.length === 0 && w < 3000){ await new Promise(r=>setTimeout(r,300)); w+=300; }
    }
    // Если всё равно пусто — грузим напрямую из Firebase
    if(fbMembers.length === 0){
      try{
        const data = await fbGet('members');
        if(data) fbMembers = Object.entries(data).map(([k,v])=>({...v,_key:k}));
      }catch(e){}
    }
    const member = fbMembers.find(m => m.code === raw || m.name === usedInv.usedBy);
    if(member){
      D.currentUser = {
        name: member.name, role: member.role||'member',
        subgroup: member.subgroup||0, code: raw,
        bio: member.bio||'', socials: member.socials||{},
        avatarUrl: member.avatarUrl||'', _key: member._key
      };
      save(); launchApp(); return;
    }
    // Если member всё равно не найден — входим по имени из инвайта
    if(usedInv.usedBy){
      D.currentUser = {name: usedInv.usedBy, role:'member', subgroup:0, code:raw, bio:'', socials:{}, avatarUrl:''};
      save(); launchApp(); return;
    }
  }

  // Первый вход по новому инвайту
  const inv = allInvites.find(i => i.code === raw && !i.used);
  if(inv){
    pendingInviteCode = raw;
    document.getElementById('gate').classList.add('hidden');
    document.getElementById('name-overlay').classList.remove('hidden');
    setTimeout(()=>document.getElementById('name-inp').focus(), 50);
    return;
  }

  err.textContent = 'неверный код';
  document.getElementById('inv-inp').style.borderColor = 'rgba(196,116,116,.6)';
  setTimeout(()=>{ err.textContent=''; document.getElementById('inv-inp').style.borderColor=''; }, 2500);
}

async function confirmName(){
  const name=(document.getElementById('name-inp').value||'').trim().slice(0,20);
  if(!name) return;
  const allInvites = fbInvites.length ? fbInvites : D.invites;
  const inv = allInvites.find(i=>i.code===pendingInviteCode);
  if(inv){
    inv.used=true; inv.usedBy=name;
    if(inv._key){
      try{ await fbSet(`invites/${inv._key}`,{code:inv.code,used:true,usedBy:name}); }catch(e){}
    }
  }
  let member=D.members.find(m=>m.name===name);
  if(!member){ member={name,role:'member',code:pendingInviteCode,subgroup:0}; D.members.push(member); }
  D.currentUser={name,role:'member',subgroup:member.subgroup||0};
  save();
  await fbSaveMember(member);
  D.currentUser._key=member._key;
  document.getElementById('name-overlay').classList.add('hidden');
  launchApp();
}

function launchApp(){
  document.getElementById('gate').classList.add('hidden');
  document.getElementById('name-overlay').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  renderAll(); renderProfile();
  fbInit();
  if(D.currentUser?.role==='admin') addAdminFab();
}
