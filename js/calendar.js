// ══════════════════════════════════════════════
// CALENDAR
// ══════════════════════════════════════════════
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-indexed

const CAL_DAYS_RU = ['пн','вт','ср','чт','пт','сб','вс'];
const CAL_MON_RU  = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
const CAL_MON_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

function calPrev(){ if(calMonth===0){calMonth=11;calYear--;}else calMonth--; renderCalendar(); }
function calNext(){ if(calMonth===11){calMonth=0;calYear++;}else calMonth++; renderCalendar(); }

function getCalEvents(year, month){
  const events = [];
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth   = new Date(year, month+1, 0);

  // Homework deadlines
  D.homework.forEach(hw => {
    if(!hw.dueDate) return;
    const d = new Date(hw.dueDate+'T00:00:00');
    if(d >= startOfMonth && d <= endOfMonth){
      events.push({
        date: d, day: d.getDate(),
        type: 'hw', label: hw.title,
        urgency: hw.urgency, color: urgencyColor(hw.urgency),
      });
    }
  });

  // Schedule lessons for this month (show each lesson on correct weekday)
  const userSg = D.currentUser?.subgroup||0;
  const wt = (typeof fbWeekType !== 'undefined' ? fbWeekType : null) || D.weekType || 'red';
  for(let day=1; day<=endOfMonth.getDate(); day++){
    const d = new Date(year, month, day);
    const weekDay = d.getDay()===0?6:d.getDay()-1; // 0=mon
    D.schedule.filter(l=>{
      if(l.day !== weekDay) return false;
      if(userSg>0 && l.subgroup && l.subgroup!=='все' && l.subgroup!==`подгруппа ${userSg}`) return false;
      if(l.week && l.week!=='both' && l.week!==wt) return false;
      return true;
    }).forEach(l=>{
      events.push({
        date: d, day, type:'lesson',
        label: `${l.time} ${l.subject}`,
        color: `var(--${l.color==='purple'?'pur':l.color==='teal'?'teal':l.color==='gold'?'gold':l.color==='rose'?'rose':'blue'})`,
      });
    });
  }

  return events;
}

function urgencyColor(u){ return u==='high'?'var(--red)':u==='mid'?'var(--yel)':'var(--grn)'; }

function renderCalendar(){
  const label = document.getElementById('cal-month-label');
  if(label) label.textContent = `${CAL_MON_RU[calMonth]} ${calYear}`;

  const grid = document.getElementById('cal-grid'); if(!grid) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay  = new Date(calYear, calMonth+1, 0);
  const startWd  = firstDay.getDay()===0?6:firstDay.getDay()-1; // offset

  const events = getCalEvents(calYear, calMonth);
  // map day → event dots
  const dotsByDay = {};
  events.forEach(e => {
    if(!dotsByDay[e.day]) dotsByDay[e.day]=[];
    dotsByDay[e.day].push(e);
  });

  let html = CAL_DAYS_RU.map(d=>`<div class="cal-dow">${d}</div>`).join('');
  // empty cells before first day
  for(let i=0;i<startWd;i++) html+=`<div class="cal-cell"></div>`;
  for(let d=1;d<=lastDay.getDate();d++){
    const date = new Date(calYear,calMonth,d);
    const isToday = date.getTime()===today.getTime();
    const dots = dotsByDay[d]||[];
    const hwDots = dots.filter(e=>e.type==='hw');
    const lesDots = dots.filter(e=>e.type==='lesson');
    html+=`<div class="cal-cell${isToday?' today':''}" onclick="calSelectDay(${d})">
      <div class="cal-day-num${isToday?' today-num':''}">${d}</div>
      <div class="cal-dots">
        ${hwDots.slice(0,3).map(e=>`<span class="cal-dot" style="background:${e.color}"></span>`).join('')}
        ${lesDots.length?`<span class="cal-dot" style="background:var(--text3)"></span>`:''}
      </div>
    </div>`;
  }
  grid.innerHTML = html;

  // update home calendar count — events this month
  const calCountEl = document.getElementById('home-cal-count');
  if(calCountEl){
    const now = new Date(); now.setHours(0,0,0,0);
    const upcoming = events.filter(e=>e.date>=now&&e.type==='hw').length;
    calCountEl.textContent = upcoming || '✓';
  }

  renderCalEvents(null);
}

function calSelectDay(day){
  // highlight selected
  document.querySelectorAll('.cal-cell').forEach((el,i)=>{
    el.classList.toggle('selected', parseInt(el.querySelector('.cal-day-num')?.textContent)===day && el.querySelector('.cal-day-num'));
  });
  renderCalEvents(day);
}

function renderCalEvents(selectedDay){
  const el = document.getElementById('cal-events'); if(!el) return;
  const events = getCalEvents(calYear, calMonth);
  const filtered = selectedDay ? events.filter(e=>e.day===selectedDay) : events;

  if(!filtered.length){
    el.innerHTML = `<div style="text-align:center;padding:30px 20px;color:var(--text3);font-style:italic;font-family:var(--serif);font-size:15px">${selectedDay?'в этот день ничего нет':'нет событий в этом месяце'}</div>`;
    return;
  }

  // Group by day
  const byDay = {};
  filtered.forEach(e=>{ const k=e.day; if(!byDay[k]) byDay[k]=[]; byDay[k].push(e); });

  el.innerHTML = Object.entries(byDay).sort(([a],[b])=>a-b).map(([day,evs])=>`
    <div class="cal-day-group">
      <div class="cal-day-hdr">${day} ${CAL_MON_GEN[calMonth]}</div>
      ${evs.map(e=>`
        <div class="cal-event-item">
          <div class="cal-event-dot" style="background:${e.color}"></div>
          <div class="cal-event-body">
            <div class="cal-event-label">${esc(e.label)}</div>
            <div class="cal-event-type">${e.type==='hw'?'задание':'пара'}</div>
          </div>
        </div>`).join('')}
    </div>`).join('');
}
