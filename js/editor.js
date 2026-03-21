// MESSAGE EDIT / DELETE
// ══════════════════════════════════════════════
let editingMsgKey = null;

function openMsgEdit(key, text){
  editingMsgKey = key;
  document.getElementById('msg-edit-inp').value = text;
  document.getElementById('msg-modal').classList.remove('hidden');
  setTimeout(()=>document.getElementById('msg-edit-inp').focus(), 50);
}
function closeMsgModal(){
  editingMsgKey = null;
  document.getElementById('msg-modal').classList.add('hidden');
}
async function saveMsgEdit(){
  const text = document.getElementById('msg-edit-inp').value.trim();
  if(!text || !editingMsgKey) return;
  try {
    await fbSet(`chat/${editingMsgKey}/text`, text);
    await fbSet(`chat/${editingMsgKey}/edited`, true);
    const m = fbMessages.find(m=>m._key===editingMsgKey);
    if(m){m.text=text;m.edited=true;}
    renderMsgs();
    toast('сообщение изменено');
  } catch(e){ toast('ошибка'); }
  closeMsgModal();
}
async function delMsg(key){
  try {
    await fbDelete(`chat/${key}`);
    fbMessages = fbMessages.filter(m=>m._key!==key);
    renderMsgs();
  } catch(e){ toast('ошибка'); }
}

// ══════════════════════════════════════════════
// LESSON EDIT
// ══════════════════════════════════════════════
let editingLesIdx = null;

function openLesEdit(idx){
  editingLesIdx = idx;
  const l = D.schedule[idx];
  if(!l) return;
  document.getElementById('les-edit-time').value  = l.time||'';
  document.getElementById('les-edit-end').value   = l.end||'';
  document.getElementById('les-edit-subj').value  = l.subject||'';
  document.getElementById('les-edit-room').value  = l.room||'';
  document.getElementById('les-edit-link').value  = l.link||'';
  const notesEl = document.getElementById('les-edit-notes');
  if(notesEl) notesEl.value = l.notes||'';
  const weekEl = document.getElementById('les-edit-week');
  if(weekEl) weekEl.value = l.week||'both';
  document.getElementById('les-modal').classList.remove('hidden');
}
function closeLesModal(){
  editingLesIdx = null;
  document.getElementById('les-modal').classList.add('hidden');
}
async function saveLesEdit(){
  if(editingLesIdx === null) return;
  const l = D.schedule[editingLesIdx];
  if(!l) return;
  l.time    = document.getElementById('les-edit-time').value.trim() || l.time;
  l.end     = document.getElementById('les-edit-end').value.trim()  || l.end;
  l.subject = document.getElementById('les-edit-subj').value.trim() || l.subject;
  l.room    = document.getElementById('les-edit-room').value.trim() || l.room;
  l.link    = document.getElementById('les-edit-link').value.trim();
  const notesEl = document.getElementById('les-edit-notes');
  if(notesEl) l.notes = notesEl.value.trim();
  const weekEl = document.getElementById('les-edit-week');
  if(weekEl) l.week = weekEl.value;
  try {
    if(l._key) await fbSet(`schedule/${l._key}`, {
      day:l.day, time:l.time, end:l.end, subject:l.subject,
      room:l.room, color:l.color, link:l.link, type:l.type,
      subgroup:l.subgroup, week:l.week||'both', notes:l.notes||''
    });
    save(); renderSchedule(); renderAdminLists();
    toast('пара обновлена');
  } catch(e){ save(); renderSchedule(); renderAdminLists(); toast('обновлено локально'); }
  closeLesModal();
}

// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// HOMEWORK EDIT
// ══════════════════════════════════════════════


function openHwEdit(id){
  const hw = D.homework.find(h=>h.id===id);
  if(!hw) return;
  editingHwId = id;
  document.getElementById('hw-edit-title').value = hw.title||'';
  document.getElementById('hw-edit-subj').value  = hw.subject||'';
  document.getElementById('hw-edit-desc').value  = hw.desc||'';
  document.getElementById('hw-edit-url').value   = hw.url||'';
  document.getElementById('hw-edit-due').value   = hw.dueDate||'';
  document.getElementById('hw-edit-urg').value   = hw.urgency||'mid';
  document.getElementById('hw-modal').classList.remove('hidden');
}
function closeHwModal(){
  editingHwId=null;
  document.getElementById('hw-modal').classList.add('hidden');
}
async function saveHwEdit(){
  if(!editingHwId) return;
  const hw=D.homework.find(h=>h.id===editingHwId);
  if(!hw) return;
  hw.title   = document.getElementById('hw-edit-title').value.trim()||hw.title;
  hw.subject = document.getElementById('hw-edit-subj').value.trim()||hw.subject;
  hw.desc    = document.getElementById('hw-edit-desc').value.trim();
  hw.url     = document.getElementById('hw-edit-url').value.trim();
  hw.dueDate = document.getElementById('hw-edit-due').value;
  hw.urgency = document.getElementById('hw-edit-urg').value;
  hw.due     = hw.dueDate ? formatDue(hw.dueDate) : '';
  try{
    if(hw._key) await fbSet(`homework/${hw._key}`, {
      id:hw.id, title:hw.title, subject:hw.subject,
      desc:hw.desc, url:hw.url,
      dueDate:hw.dueDate, due:hw.due, urgency:hw.urgency, doneBy:hw.doneBy||[]
    });
    save(); renderHw(); renderAdminLists();
    toast('задание обновлено');
  }catch(e){ save(); renderHw(); toast('обновлено локально'); }
  closeHwModal();
}
