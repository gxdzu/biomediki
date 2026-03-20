// HOME
// ══════════════════════════════════════════════
function renderHome(){
  const h=new Date().getHours();
  const g=h<6?'не спишь?':h<12?'доброе утро':h<17?'добрый день':'добрый вечер';
  document.getElementById('greeting').textContent=g;
  const n=new Date();
  document.getElementById('dateline').textContent=`${DAYS_RU[n.getDay()===0?6:n.getDay()-1]}, ${n.getDate()} ${MON_RU[n.getMonth()]}`;
  // deadlines
  const dl=document.getElementById('home-dl');
  if(dl){
    const items=D.homework.filter(h=>!h.doneBy.includes(D.currentUser?.name));
    dl.innerHTML=items.length
      ?items.slice(0,4).map(h=>`<div class="dl-item"><div class="dl-dot" style="background:${urgC(h.urgency)}"></div><div class="dl-name">${h.title}</div><div class="dl-due">${h.dueDate?formatDue(h.dueDate):h.due}</div></div>`).join('')
      :`<div style="color:var(--text3);font-size:12px;padding:4px 0">всё сделано ✓</div>`;
  }
  // quick counts
  const hwEl=document.getElementById('home-hw-count');
  if(hwEl){const c=D.homework.filter(h=>!h.doneBy.includes(D.currentUser?.name)).length;hwEl.textContent=c||'✓';}
  const linksEl=document.getElementById('home-links-count');
  if(linksEl) linksEl.textContent=(fbLinks.length||D.links?.length||0).toString();
  // schedule today
  const sd=document.getElementById('home-sched');
  if(sd){
    const userSg=D.currentUser?.subgroup||0;
    let ls=D.schedule.filter(l=>l.day===todayIdx());
    if(userSg>0) ls=ls.filter(l=>!l.subgroup||l.subgroup==='все'||l.subgroup===`подгруппа ${userSg}`);
    ls=ls.sort((a,b)=>{const[ah,am]=a.time.split(':').map(Number);const[bh,bm]=b.time.split(':').map(Number);return(ah*60+am)-(bh*60+bm);});
    sd.innerHTML=ls.length
      ?ls.map(l=>`<div class="si-home"><div class="si-t">${l.time}</div><div class="si-bar ac-${l.color}">${l.subject}</div></div>`).join('')
      :`<div style="color:var(--text3);font-size:12px">пар нет — отдыхаем</div>`;
  }
  // quote
  const qEl=document.getElementById('quote');
  if(qEl) qEl.textContent=D.quote||QUOTES[new Date().getDay()%QUOTES.length];
  // mood dot
  const mdEl=document.getElementById('mood-dot');
  if(mdEl) mdEl.style.background=D.cat.mood>60?'var(--grn)':D.cat.mood>30?'var(--yel)':'var(--red)';
}

// ══════════════════════════════════════════════