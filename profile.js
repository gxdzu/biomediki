// PROFILE
// ══════════════════════════════════════════════
function renderProfile(){
  const u=D.currentUser;if(!u)return;
  document.getElementById('prof-avatar').textContent=u.name?u.name[0].toUpperCase():'?';
  document.getElementById('prof-name-display').textContent=u.name||'—';
  document.getElementById('prof-role-display').textContent=u.role==='admin'?'администратор':'участник';
  document.getElementById('prof-name-inp').value=u.name||'';
  document.getElementById('prof-member-count').textContent=D.members.length;
  const done=D.homework.reduce((s,h)=>s+(h.doneBy.includes(u.name)?1:0),0);
  document.getElementById('prof-done-count').textContent=done;
  const sg=u.subgroup||0;
  document.getElementById('sg1-btn').classList.toggle('active',sg===1);
  document.getElementById('sg2-btn').classList.toggle('active',sg===2);
  const mood=D.cat.mood;
  const moodEl=document.getElementById('prof-cat-mood');
  if(moodEl) moodEl.textContent=mood>60?'доволен 🐱':mood>30?'задумчив...':'скучает →';
  updateThemeLabel();
  updateNotifLabel();
}
async function saveProfileName(){
  const name=document.getElementById('prof-name-inp').value.trim().slice(0,20);
  if(!name){toast('введи имя');return}
  const oldName=D.currentUser.name;
  D.currentUser.name=name;
  const m=D.members.find(x=>x.name===oldName);
  if(m){m.name=name; await fbSaveMember(m);}
  save();renderProfile();renderHome();toast('имя обновлено');
}
async function setSubgroup(n){
  D.currentUser.subgroup=D.currentUser.subgroup===n?0:n;
  const m=D.members.find(x=>x.name===D.currentUser.name);
  if(m){m.subgroup=D.currentUser.subgroup; await fbSaveMember(m);}
  save();renderProfile();renderSchedule();toast(D.currentUser.subgroup?`подгруппа ${D.currentUser.subgroup}`:'подгруппа снята');
}
function doLogout(){
  D.currentUser=null;save();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('gate').classList.remove('hidden');
  document.getElementById('inv-inp').value='';
  const fab=document.getElementById('admin-fab');if(fab)fab.remove();
}

async function kickMember(fbKey, code){
  // Remove from Firebase
  if(fbKey) await fbDelMember(fbKey);
  // Remove from local
  fbMembers = fbMembers.filter(m => m._key !== fbKey);
  D.members = D.members.filter(m => m.code !== code);
  // Also mark their invite as used/deleted so they can't re-login
  const inv = fbInvites.find(i => i.code === code);
  if(inv && inv._key) {
    await fbDelete(`invites/${inv._key}`);
    fbInvites = fbInvites.filter(i => i._key !== inv._key);
    D.invites = D.invites.filter(i => i.code !== code);
  }
  save(); renderAdmin(); toast('участник удалён');
}

// ══════════════════════════════════════════════
// MEMBERS PANEL IN CHAT
// ══════════════════════════════════════════════
function renderMembersPanel(){
  const el=document.getElementById('members-panel');
  if(!el)return;
  const members = fbMembers.length ? fbMembers : D.members;
  el.innerHTML=`<div class="mp-ttl">участники</div>`+
    members.map(m=>`
      <div class="mp-item">
        <div class="mp-dot" style="background:${m.role==='admin'?'var(--gold)':'var(--grn)'}"></div>
        <div>
          <div class="mp-name">${m.name}</div>
          ${m.subgroup?`<div class="mp-sub">пг${m.subgroup}</div>`:''}
        </div>
      </div>`).join('');
}

// ══════════════════════════════════════════════