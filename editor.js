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
  document.getElementById('les-edit-time').value = l.time||'';
  document.getElementById('les-edit-end').value  = l.end||'';
  document.getElementById('les-edit-subj').value = l.subject||'';
  document.getElementById('les-edit-room').value = l.room||'';
  document.getElementById('les-edit-link').value = l.link||'';
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
  try {
    if(l._key) await fbSet(`schedule/${l._key}`, {
      day:l.day, time:l.time, end:l.end, subject:l.subject,
      room:l.room, color:l.color, link:l.link, type:l.type, subgroup:l.subgroup
    });
    save(); renderSchedule(); renderAdminLists();
    toast('пара обновлена');
  } catch(e){ save(); renderSchedule(); renderAdminLists(); toast('обновлено локально'); }
  closeLesModal();
}

// ══════════════════════════════════════════════