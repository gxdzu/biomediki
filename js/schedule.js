// SCHEDULE
// ══════════════════════════════════════════════
function getMonday(off=0){
  const d=new Date();const day=d.getDay()||7;
  d.setDate(d.getDate()-day+1+off*7);d.setHours(0,0,0,0);return d;
}
function renderSchedule(){
  const mon=getMonday(curWkOff);
  const fri=new Date(mon);fri.setDate(fri.getDate()+4);
  document.getElementById('wk-lbl').textContent=`${mon.getDate()} — ${fri.getDate()} ${MON_RU[fri.getMonth()]}`;
  // day tabs
  const ti=todayIdx();
  document.getElementById('day-tabs').innerHTML=DAYS_S.slice(0,6).map((d,i)=>{
    const dt=new Date(mon);dt.setDate(dt.getDate()+i);
    const dot=curWkOff===0&&i===ti?' ·':'';
    return `<button class="day-tab ${i===curDay?'active':''}" onclick="selDay(${i})">${d} ${dt.getDate()}${dot}</button>`;
  }).join('');
  renderLessons();
}
function prevWeek(){curWkOff--;renderSchedule()}
function nextWeek(){curWkOff++;renderSchedule()}
function selDay(i){curDay=i;renderSchedule()}
function renderLessons(){
  const el=document.getElementById('sched-list');
  const userSg=D.currentUser?.subgroup||0;
  let ls=D.schedule.filter(l=>l.day===curDay);
  if(userSg>0){
    ls=ls.filter(l=>!l.subgroup||l.subgroup==='все'||l.subgroup===`подгруппа ${userSg}`);
  }
  ls=ls.sort((a,b)=>{
    const [ah,am]=a.time.split(':').map(Number);
    const [bh,bm]=b.time.split(':').map(Number);
    return (ah*60+am)-(bh*60+bm);
  });
  if(!ls.length){el.innerHTML='<div class="no-les">в этот день пар нет<em>время для себя</em></div>';return}
  el.innerHTML=ls.map(l=>{
    const gi=D.schedule.indexOf(l);
    const sgLabel=l.subgroup&&l.subgroup!=='все'
      ?`<span class="les-sg">${l.subgroup}</span>`
      :`<span class="les-type все">общая</span>`;
    return `<div class="les-card">
      <div class="les-tc"><div class="les-tm">${l.time}</div><div class="les-end">${l.end||''}</div></div>
      <div class="les-acc bar-${l.color}" style="height:52px"></div>
      <div class="les-body">
        <div class="les-subj">${l.subject}</div>
        <div class="les-room">${l.room}</div>
        <div class="les-badges">
          ${l.type?`<span class="les-type ${l.type}">${l.type}</span>`:''}
          ${sgLabel}
        </div>
        ${l.link?`<a href="${l.link}" target="_blank" class="les-link">
          <svg viewBox="0 0 14 14" width="11" height="11"><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8M9 1h4v4M13 1L6 8" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>
          подключиться</a>`:''}
      </div>
      ${D.currentUser?.role==='admin'?`<button class="del-btn" onclick="delLessonByIdx(${gi})">×</button>`:''}
    </div>`;
  }).join('');
}
function delLessonByIdx(idx){
  const lesson = D.schedule[idx];
  if (!lesson) return;
  fbDelLesson(lesson._key, idx);
}

// ══════════════════════════════════════════════
// HOMEWORK
// ══════════════════════════════════════════════
function urgC(u){return u==='high'?'var(--red)':u==='mid'?'var(--yel)':'var(--grn)'}
function renderHw(){
  const subjs=['all',...new Set(D.homework.map(h=>h.subject))];
  document.getElementById('hw-fils').innerHTML=subjs.map(s=>`<button class="fil-btn ${hwFil===s?'active':''}" onclick="setFil('${s}')">${s==='all'?'все':s}</button>`).join('');
  const items=hwFil==='all'?D.homework:D.homework.filter(h=>h.subject===hwFil);
  const el=document.getElementById('hw-list');
  if(!items.length){el.innerHTML='<div class="no-les">заданий нет</div>';return}
  el.innerHTML=items.map(hw=>{
    const done=hw.doneBy.includes(D.currentUser?.name);
    return `<div class="hw-card ${done?'done':''}" onclick="toggleHw(${hw.id})">
      <div class="hw-chk">${done?`<svg viewBox="0 0 12 12" width="11" height="11"><path d="M1.5 6l3 3 6-6" stroke="var(--grn)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`:''}</div>
      <div class="hw-body">
        <div class="hw-ttl">${hw.title}</div>
        <div class="hw-meta"><div class="hw-subj">${hw.subject}</div><div class="hw-badge ${urgencyFromDate(hw.dueDate)||hw.urgency}">${hw.dueDate?formatDue(hw.dueDate):hw.due}</div></div>
        <div class="hw-cnt">${hw.doneBy.length} из ${D.members.length} сделали</div>
      </div>
      ${D.currentUser?.role==='admin'?`<button class="del-btn" onclick="event.stopPropagation();delHw(${hw.id})">×</button>`:''}
    </div>`;
  }).join('');
}
function setFil(f){hwFil=f;renderHw()}
function toggleHw(id){
  const hw=D.homework.find(h=>h.id===id);
  if(!hw||!D.currentUser) return;
  fbToggleHw(hw);
}
function delHw(id){D.homework=D.homework.filter(h=>h.id!==id);save();renderHw()}
