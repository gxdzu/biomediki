// ══════════════════════════════════════════════
// AUTH / GATE
// ══════════════════════════════════════════════
let pendingInviteCode = null;

// Admin code stored as SHA-256 hash only — never the plain code
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

  // If Firebase hasn't loaded yet — wait up to 3 seconds
  if(fbInvites.length === 0 && D.invites.length === 0){
    err.textContent = 'загрузка...';
    let waited = 0;
    while(fbInvites.length === 0 && waited < 3000){
      await new Promise(r => setTimeout(r, 300));
      waited += 300;
    }
    err.textContent = '';
  }

  const allInvites = fbInvites.length ? fbInvites : D.invites;

  // Re-login with used invite
  const usedInv = allInvites.find(i => i.code===raw && i.used);
  if(usedInv){
    const member = (fbMembers.length?fbMembers:D.members).find(m=>m.code===raw);
    if(member){
      D.currentUser = {name:member.name, role:member.role||'member', subgroup:member.subgroup||0, code:raw};
      save(); launchApp(); return;
    }
  }

  // Fresh unused invite
  const inv = allInvites.find(i => i.code===raw && !i.used);
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
