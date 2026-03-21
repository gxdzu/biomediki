// FIREBASE — синхронизация всего
// ══════════════════════════════════════════════
const FB_URL = 'https://biomed-chat-3df3f-default-rtdb.firebaseio.com';

let fbMessages = [];
let fbSchedule = [];
let fbHomework = [];
let fbQuote    = '';

// ── helpers ──
async function fbGet(path) {
  const r = await fetch(`${FB_URL}/${path}.json`);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
async function fbSet(path, data) {
  await fetch(`${FB_URL}/${path}.json`, {
    method: 'PUT',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
}
async function fbPost(path, data) {
  const r = await fetch(`${FB_URL}/${path}.json`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
  return r.json(); // {name: key}
}
async function fbDelete(path) {
  await fetch(`${FB_URL}/${path}.json`, { method: 'DELETE' });
}

// ── MEMBERS via Firebase ──
let fbMembers = [];

async function fbPollMembers() {
  try {
    const data = await fbGet('members');
    const arr = data ? Object.entries(data).map(([k,v]) => ({...v, _key:k})) : [];
    if (JSON.stringify(arr) !== JSON.stringify(fbMembers)) {
      // Deduplicate by name — keep the one with more data (bio/socials)
      const seen = new Map();
      arr.forEach(fm => {
        const existing = seen.get(fm.name);
        if (!existing || (fm.bio || fm.socials)) seen.set(fm.name, fm);
      });
      fbMembers = [...seen.values()];

      fbMembers.forEach(fm => {
        const existing = D.members.find(m =>
          (m.code && m.code === fm.code) || m.name === fm.name
        );
        if (existing) {
          existing.name     = fm.name;
          existing.subgroup = fm.subgroup;
          existing.bio      = fm.bio || existing.bio;
          existing.socials  = fm.socials || existing.socials;
          existing._key     = fm._key;
          if (D.currentUser && D.currentUser.name === fm.name) {
            D.currentUser.bio     = fm.bio || D.currentUser.bio;
            D.currentUser.socials = fm.socials || D.currentUser.socials;
          }
        } else {
          D.members.push(fm);
        }
      });
      if (curScreen === 'chat') renderMembersPanel();
      if (curScreen === 'profile') renderProfile();
      if (document.getElementById('mem-list')) renderAdmin();
    }
  } catch(e) {}
}

async function fbSaveMember(member) {
  try {
    const payload = {
      name:     member.name,
      role:     member.role,
      code:     member.code || '',
      subgroup: member.subgroup || 0,
      bio:      member.bio     || '',
      socials:  member.socials || {},
    };
    if (member._key) {
      await fbSet(`members/${member._key}`, payload);
    } else {
      const res = await fbPost('members', payload);
      member._key = res.name;
    }
  } catch(e) { console.error('fbSaveMember error:', e); }
}

async function fbDelMember(key) {
  try { await fbDelete(`members/${key}`); } catch(e) {}
}

// ── unread tracking ──

function nowTime() {
  const n = new Date();
  return `${n.getHours()}:${String(n.getMinutes()).padStart(2,'0')}`;
}

// ── poll all data every 4s ──
function fbInit() {
  fbPollAll();
  setInterval(fbPollAll, 2000);
}

async function fbPollAll() {
  await Promise.all([fbPollChat(), fbPollSchedule(), fbPollHomework(), fbPollQuote(), fbPollLinks(), fbPollInvites(), fbPollMembers(), fbPollWeekType(), fbPollFeed(), fbPollPinned()]);
}

// ── CHAT ──
async function fbPollChat() {
  try {
    const data = await fbGet('chat');
    const arr = data ? Object.entries(data).map(([k,v])=>({...v,_key:k})).sort((a,b)=>a.ts-b.ts) : [];
    if (JSON.stringify(arr) !== JSON.stringify(fbMessages)) {
      const oldLen = fbMessages.length;
      fbMessages = arr;
      // notify if new message from someone else
      if(arr.length > oldLen && curScreen !== 'chat') {
        const last = arr[arr.length-1];
        if(last.author !== D.currentUser?.name) {
          notifyIfNeeded(`💬 ${last.author}`, last.text);
        }
      }
      if (curScreen === 'chat') {
        renderMsgs();
        markChatRead();
      } else {
        updateChatBadge(countUnread());
      }
      renderHome();
    }
  } catch(e) { fbMessages = D.chat.general || []; }
}

async function fbSend(author, text, replyTo=null) {
  const msg = {
    author, text, time: nowTime(), ts: Date.now(),
    ...(replyTo ? {replyTo: {key: replyTo.key, author: replyTo.author, text: replyTo.text}} : {})
  };
  fbMessages.push(msg); // optimistic
  renderMsgs();
  try {
    await fbPost('chat', msg);
  } catch(e) {
    if (!D.chat.general) D.chat.general = [];
    D.chat.general.push(msg);
    save();
  }
}

// ── SCHEDULE ──
async function fbPollSchedule() {
  try {
    const data = await fbGet('schedule');
    // data is object {key: lesson} or null
    const arr = data
      ? Object.entries(data).map(([k,v]) => ({...v, _key: k}))
      : [];
    if (JSON.stringify(arr) !== JSON.stringify(fbSchedule)) {
      fbSchedule = arr;
      D.schedule = arr; // keep local in sync for rendering
      if (curScreen === 'schedule') renderSchedule();
      renderHome();
    }
  } catch(e) { /* keep local */ }
}

async function fbAddLesson(lesson) {
  try {
    const res = await fbPost('schedule', lesson);
    lesson._key = res.name;
    fbSchedule.push(lesson);
    D.schedule = [...fbSchedule];
    renderSchedule(); renderAdminLists();
    toast('пара добавлена');
  } catch(e) {
    D.schedule.push(lesson); save();
    renderSchedule(); renderAdminLists();
    toast('пара добавлена (офлайн)');
  }
}

async function fbDelLesson(key, localIdx) {
  // remove locally immediately
  D.schedule.splice(localIdx, 1);
  fbSchedule = fbSchedule.filter(l => l._key !== key);
  renderSchedule(); renderAdminLists();
  try {
    await fbDelete(`schedule/${key}`);
  } catch(e) { save(); }
}

// ── HOMEWORK ──
async function fbPollHomework() {
  try {
    const data = await fbGet('homework');
    const arr = data
      ? Object.entries(data).map(([k,v]) => ({...v, _key: k}))
      : [];
    if (JSON.stringify(arr) !== JSON.stringify(fbHomework)) {
      // detect truly new items (not just doneBy changes)
      const oldIds = new Set(fbHomework.map(h=>h._key));
      const newItems = arr.filter(h=>!oldIds.has(h._key));
      newItems.forEach(h=>{
        notifyIfNeeded('📚 Новое задание', `${h.title} · ${h.dueDate?formatDue(h.dueDate):h.due}`);
      });
      fbHomework = arr;
      D.homework = arr;
      if (curScreen === 'hw') renderHw();
      renderHome();
    }
  } catch(e) { /* keep local */ }
}

async function fbAddHw(hw) {
  try {
    const res = await fbPost('homework', hw);
    hw._key = res.name;
    fbHomework.push(hw);
    D.homework = [...fbHomework];
    renderHw(); renderHome(); renderAdminLists();
    toast('задание добавлено');
  } catch(e) {
    D.homework.push(hw); save();
    renderHw(); renderHome(); renderAdminLists();
    toast('задание добавлено (офлайн)');
  }
}

async function fbDelHw(key) {
  D.homework = D.homework.filter(h => h._key !== key);
  fbHomework = fbHomework.filter(h => h._key !== key);
  renderHw(); renderHome(); renderAdminLists();
  try { await fbDelete(`homework/${key}`); } catch(e) { save(); }
}

async function fbToggleHw(hw) {
  const name = D.currentUser?.name;
  if (!name) return;
  const doneBy = hw.doneBy || [];
  const i = doneBy.indexOf(name);
  if (i > -1) doneBy.splice(i, 1);
  else { doneBy.push(name); D.cat.mood = Math.min(100, D.cat.mood+4); toast('задание отмечено ✓'); }
  hw.doneBy = doneBy;
  save();
  renderHw(); renderHome();
  if (hw._key) {
    try { await fbSet(`homework/${hw._key}/doneBy`, doneBy); } catch(e) {}
  }
}

// ── QUOTE ──
async function fbPollQuote() {
  try {
    const data = await fbGet('quote');
    if (data && data !== fbQuote) {
      fbQuote = data;
      D.quote = data;
      if (curScreen === 'home') renderHome();
    }
  } catch(e) {}
}

async function fbSetQuote(text) {
  D.quote = text; fbQuote = text; save(); renderHome();
  try { await fbSet('quote', text); toast('цитата обновлена'); }
  catch(e) { toast('цитата обновлена (офлайн)'); }
}

// ══════════════════════════════════════════════