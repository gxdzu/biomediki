// ══════════════════════════════════════════════
// SCHEDULE
// ══════════════════════════════════════════════
let fbWeekType = '';

function getMonday(off=0){
  const d=new Date(); const day=d.getDay()||7;
  d.setDate(d.getDate()-day+1+off*7); d.setHours(0,0,0,0); return d;
}

function renderSchedule(){
  const mon=getMonday(curWkOff);
  const fri=new Date(mon); fri.setDate(fri.getDate()+4);
  document.getElementById('wk-lbl').textContent=`${mon.getDate()} — ${fri.getDate()} ${MON_RU[fri.getMonth()]}`;

  // Week type — auto by default, admin can override via Firebase
  const wt = getCurrentWeekType();
  const badge = document.getElementById('week-type-badge');
  if(badge){ badge.textContent = wt==='red'?'красная':'синяя'; badge.className=`week-badge ${wt}`; }
  document.getElementById('wk-red-btn')?.classList.toggle('active', wt==='red');
  document.getElementById('wk-blue-btn')?.classList.toggle('active', wt==='blue');

  const sq = document.getElementById('sched-quote');
  if(sq) sq.textContent = D.quote||QUOTES[new Date().getDay()%QUOTES.length];

  const ti=todayIdx();
  document.getElementById('day-tabs').innerHTML=DAYS_S.slice(0,6).map((d,i)=>{
    const dt=new Date(mon); dt.setDate(dt.getDate()+i);
    const dot=curWkOff===0&&i===ti?' ·':'';
    return `<button class="day-tab ${i===curDay?'active':''}" onclick="selDay(${i})">${d} ${dt.getDate()}${dot}</button>`;
  }).join('');
  renderLessons();
  if(document.getElementById('cal-grid')) renderCalendar();
}

function prevWeek(){curWkOff--;renderSchedule()}
function nextWeek(){curWkOff++;renderSchedule()}
function selDay(i){curDay=i;renderSchedule()}

function renderLessons(){
  const el=document.getElementById('sched-list');
  const wt = getCurrentWeekType();
  const userSg = D.currentUser?.subgroup||0;
  let ls = D.schedule.filter(l=>l.day===curDay);

  // Filter by week type
  ls = ls.filter(l => !l.week || l.week==='both' || l.week===wt);

  // Filter by subgroup
  if(userSg>0){
    ls=ls.filter(l=>!l.subgroup||l.subgroup==='все'||l.subgroup===`подгруппа ${userSg}`);
  }

  ls=ls.sort((a,b)=>{
    const[ah,am]=a.time.split(':').map(Number);
    const[bh,bm]=b.time.split(':').map(Number);
    return (ah*60+am)-(bh*60+bm);
  });

  if(!ls.length){el.innerHTML='<div class="no-les">в этот день пар нет<em>время для себя</em></div>';return}

  // Current time for dimming past lessons
  const now = new Date();
  const nowMins = now.getHours()*60 + now.getMinutes();
  const isToday = curWkOff===0 && curDay===todayIdx();

  el.innerHTML=ls.map(l=>{
    const gi=D.schedule.indexOf(l);
    const sgLabel=l.subgroup&&l.subgroup!=='все'
      ?`<span class="les-sg">${l.subgroup}</span>`
      :`<span class="les-type все">общая</span>`;

    // Check if lesson is in the past
    let isPast = false;
    if(isToday && l.end){
      const[eh,em]=l.end.split(':').map(Number);
      isPast = (eh*60+em) < nowMins;
    }

    // Week badge on card
    const weekLabel = l.week&&l.week!=='both'
      ? `<span class="week-badge ${l.week}" style="font-size:9px;padding:1px 6px">${l.week==='red'?'кр':'си'}</span>` : '';

    return `<div class="les-card${isPast?' past':''}">
      <div class="les-tc"><div class="les-tm">${l.time}</div><div class="les-end">${l.end||''}</div></div>
      <div class="les-acc bar-${l.color}" style="height:52px"></div>
      <div class="les-body">
        <div class="les-subj">${l.subject}</div>
        <div class="les-room">${l.room}</div>
        <div class="les-badges">
          ${l.type?`<span class="les-type ${l.type}">${l.type}</span>`:''}
          ${sgLabel}${weekLabel}
        </div>
        ${l.notes?`<div class="les-notes">${l.notes}</div>`:''}
        ${l.link?`<a href="${l.link}" target="_blank" class="les-link">
          <svg viewBox="0 0 14 14" width="11" height="11"><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8M9 1h4v4M13 1L6 8" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>
          подключиться</a>`:''}
      </div>
      ${D.currentUser?.role==='admin'?`
        <button class="msg-act" onclick="openLesEdit(${gi})" style="font-size:12px;padding:4px 6px">✎</button>
        <button class="del-btn" onclick="delLessonByIdx(${gi})">×</button>`:''}
    </div>`;
  }).join('');
}

function delLessonByIdx(idx){
  const lesson=D.schedule[idx]; if(!lesson) return;
  fbDelLesson(lesson._key,idx);
}

// ── AUTO WEEK TYPE ──
// Anchor: week of 21 March 2026 (ISO week 12) = RED
// Even ISO week = red, odd = blue
function getAutoWeekType(date){
  const d = date || new Date();
  const jan4 = new Date(d.getFullYear(), 0, 4); // always in week 1
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - (jan4.getDay()||7) + 1);
  const weekNum = Math.round((d - startOfWeek1) / 604800000) + 1;
  return weekNum % 2 === 0 ? 'red' : 'blue';
}


function getCurrentWeekType(){
  // If admin manually set — use that; otherwise auto
  if(fbWeekType) return fbWeekType;
  return getAutoWeekType();
}

async function setWeekType(type){
  fbWeekType = type; D.weekType = type; save();
  document.getElementById('wk-red-btn')?.classList.toggle('active', type==='red');
  document.getElementById('wk-blue-btn')?.classList.toggle('active', type==='blue');
  renderSchedule();
  try{
    await fbSet('weekType', type||null);
    toast(type==='red'?'красная неделя':type==='blue'?'синяя неделя':'авто-режим');
  }catch(e){ toast('обновлено локально'); }
}

// ══════════════════════════════════════════════
// HOMEWORK
// ══════════════════════════════════════════════
function urgC(u){return u==='high'?'var(--red)':u==='mid'?'var(--yel)':'var(--grn)'}

function renderHw(){
  if(hwTab==='personal'){ renderPersonalHw(); return; }
  // ── COMMON ──
  const subjs=['all',...new Set(D.homework.map(h=>h.subject))];
  document.getElementById('hw-fils').innerHTML=subjs.map(s=>
    `<button class="fil-btn ${hwFil===s?'active':''}" onclick="setFil('${s}')">${s==='all'?'все':s}</button>`
  ).join('');
  const items=hwFil==='all'?D.homework:D.homework.filter(h=>h.subject===hwFil);
  const el=document.getElementById('hw-list');
  if(!items.length){el.innerHTML='<div class="no-les">заданий нет</div>';return}

  if(hwFil==='all'){
    // group by subject
    const bySubj={};
    items.forEach(hw=>{ if(!bySubj[hw.subject]) bySubj[hw.subject]=[]; bySubj[hw.subject].push(hw); });
    el.innerHTML=Object.entries(bySubj).map(([subj,hws])=>`
      <div class="sec-title" style="padding:12px 0 6px">${subj}</div>
      ${hws.map(hw=>hwCardHtml(hw)).join('')}
    `).join('');
  } else {
    el.innerHTML=items.map(hw=>hwCardHtml(hw)).join('');
  }
}

function hwCardHtml(hw){
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
}

function renderPersonalHw(){
  document.getElementById('hw-fils').innerHTML='';
  const arr=getPersonalHw();
  const el=document.getElementById('hw-list');
  if(!arr.length){
    el.innerHTML='<div class="personal-hw-empty">личных заданий нет<br><span style="font-size:12px">добавь ниже</span></div>';
    return;
  }
  el.innerHTML=arr.map(hw=>`
    <div class="hw-card ${hw.done?'done':''}" onclick="togglePersonalHw(${hw.id})">
      <div class="hw-chk">${hw.done?`<svg viewBox="0 0 12 12" width="11" height="11"><path d="M1.5 6l3 3 6-6" stroke="var(--grn)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`:''}</div>
      <div class="hw-body">
        <div class="hw-ttl">${hw.title}</div>
        ${hw.dueDate?`<div class="hw-meta"><div class="hw-badge ${urgencyFromDate(hw.dueDate)}">${formatDue(hw.dueDate)}</div></div>`:''}
      </div>
      <button class="del-btn" onclick="event.stopPropagation();delPersonalHw(${hw.id})">×</button>
    </div>`).join('');
}
function setFil(f){hwFil=f;renderHw()}
function toggleHw(id){
  const hw=D.homework.find(h=>h.id===id);
  if(!hw||!D.currentUser) return;
  fbToggleHw(hw);
}
function delHw(id){D.homework=D.homework.filter(h=>h.id!==id);save();renderHw()}

// ══════════════════════════════════════════════
// PERSONAL HOMEWORK
// ══════════════════════════════════════════════
let hwTab = 'common'; // 'common' | 'personal'

function switchHwTab(tab){
  hwTab = tab;
  document.getElementById('hw-tab-common')?.classList.toggle('active', tab==='common');
  document.getElementById('hw-tab-personal')?.classList.toggle('active', tab==='personal');
  const addBlock = document.getElementById('personal-hw-add');
  if(addBlock) addBlock.classList.toggle('hidden', tab!=='personal');
  hwFil = 'all';
  renderHw();
}

function getPersonalHw(){
  const key = 'sg_phw_'+(D.currentUser?.name||'');
  try{ return JSON.parse(localStorage.getItem(key)||'[]'); } catch(e){ return []; }
}
function savePersonalHw(arr){
  const key = 'sg_phw_'+(D.currentUser?.name||'');
  localStorage.setItem(key, JSON.stringify(arr));
}

function addPersonalHw(){
  const title = document.getElementById('phw-title')?.value.trim();
  const due = document.getElementById('phw-due')?.value;
  if(!title){ toast('введи название'); return; }
  const arr = getPersonalHw();
  arr.push({id: Date.now(), title, dueDate: due||'', done: false});
  savePersonalHw(arr);
  document.getElementById('phw-title').value='';
  document.getElementById('phw-due').value='';
  renderHw(); toast('добавлено');
}

function togglePersonalHw(id){
  const arr = getPersonalHw();
  const item = arr.find(h=>h.id===id);
  if(item) item.done = !item.done;
  savePersonalHw(arr); renderHw();
}

function delPersonalHw(id){
  savePersonalHw(getPersonalHw().filter(h=>h.id!==id));
  renderHw();
}

// Week type Firebase sync
async function fbPollWeekType(){
  try{
    const data = await fbGet('weekType');
    // null or empty = auto mode
    const newType = data && typeof data === 'string' ? data : '';
    if(newType !== fbWeekType){
      fbWeekType = newType;
      D.weekType = newType;
      if(curScreen==='schedule') renderSchedule();
      if(document.getElementById('admin')&&!document.getElementById('admin').classList.contains('hidden')) renderAdmin();
    }
  }catch(e){}
}
