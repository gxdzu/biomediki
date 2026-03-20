// ══════════════════════════════════════════════
// AUTH / GATE
// ══════════════════════════════════════════════
let pendingInviteCode=null;

function doLogin(){
  const raw = document.getElementById('inv-inp').value.trim().toUpperCase();
  const err = document.getElementById('g-err');

  // Admin — always works, no Firebase needed
  if(raw === ADMIN_CODE){
    let m = D.members.find(x=>x.role==='admin');
    if(!m){m={name:'Саша',role:'admin',subgroup:0,code:ADMIN_CODE};D.members.push(m);}
    D.currentUser={name:m.name,role:'admin',subgroup:m.subgroup||0,code:ADMIN_CODE};
    save();
    fbSaveMember(m).then(()=>{if(curScreen==='chat')renderMembersPanel();});
    launchApp(); return;
  }

  // Merge Firebase + local invites
  const allInvites = fbInvites.length ? fbInvites : D.invites;

  // Re-login with used invite
  const usedInv = allInvites.find(i => i.code===raw && i.used);
  if(usedInv){
    const member = D.members.find(m => m.code===raw);
    if(member){
      D.currentUser = {name:member.name, role:member.role||'member', subgroup:member.subgroup||0};
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

  // If Firebase hasn't loaded yet, show different message
  if(fbInvites.length === 0 && D.invites.length === 0){
    err.textContent = 'подождите, идёт загрузка...';
    setTimeout(()=>err.textContent='', 2000);
    return;
  }

  err.textContent = 'неверный код';
  document.getElementById('inv-inp').style.borderColor = 'rgba(196,116,116,.6)';
  setTimeout(()=>{ err.textContent=''; document.getElementById('inv-inp').style.borderColor=''; }, 2500);
}

async function confirmName(){
  const name=(document.getElementById('name-inp').value||'').trim().slice(0,20);
  if(!name) return;
  // Mark invite used in Firebase
  const allInvites = fbInvites.length ? fbInvites : D.invites;
  const inv = allInvites.find(i=>i.code===pendingInviteCode);
  if(inv){
    inv.used=true; inv.usedBy=name;
    if(inv._key){
      try { await fbSet(`invites/${inv._key}`, {code:inv.code,used:true,usedBy:name}); } catch(e){}
    }
  }
  let member=D.members.find(m=>m.name===name);
  if(!member){member={name,role:'member',code:pendingInviteCode,subgroup:0};D.members.push(member);}
  D.currentUser={name,role:'member',subgroup:member.subgroup||0};
  save();
  // Save member to Firebase
  await fbSaveMember(member);
  D.currentUser._key = member._key;
  document.getElementById('name-overlay').classList.add('hidden');
  launchApp();
}

function launchApp(){
  document.getElementById('gate').classList.add('hidden');
  document.getElementById('name-overlay').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  renderAll();
  renderProfile();
  fbInit();
  if(D.currentUser?.role==='admin') addAdminFab();
}

// ══════════════════════════════════════════════