// ══════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════
let curScreen='home',curChat='general',curDay=todayIdx(),curWkOff=0,hwFil='all';

function todayIdx(){
  const d=new Date().getDay();
  return d===0?6:d-1;
}

function navigate(s){
  curScreen=s;
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',
    b.dataset.s===s || (b.dataset.s==='chat' && (s==='chatroom'||s==='dm'))
  ));
  const el=document.getElementById('screen-'+s);
  if(el) el.classList.add('active');

  const nav=document.querySelector('.bnav');
  if(nav) nav.style.display = (s==='post'||s==='dm'||s==='chatroom')?'none':'flex';

  if(s==='home') renderHome();
  if(s==='schedule') renderSchedule();
  if(s==='hw') renderHw();
  if(s==='chat'){ renderChatList(); updateChatBadge(countUnread()); }
  if(s==='chatroom'){ _lastMsgsHash=''; renderChat(); markChatRead(); clearChatOverlays(); }
  if(s==='links') renderLinks();
  if(s==='feed') renderFeed();
  if(s==='post') renderPostScreen();
  if(s==='faq') renderFaq();
  if(s==='dms'){ navigate('chat'); return; }
  if(s!=='dm'&&dmPolling){clearInterval(dmPolling);dmPolling=null;}
  if(s==='dm') renderDmMsgs(dmMessages[dmKey(D.currentUser?.name||'',curDmPartner||'')] || []);
  if(s==='cat') renderCat();
  if(s==='profile'){renderProfile();updateNotifLabel();}
}

function renderAll(){
  renderHome();renderSchedule();renderHw();renderChat();renderLinks();renderFeed();renderCat();renderMembersPanel();
}

function addAdminFab(){
  if(document.getElementById('admin-fab')) return;
  const b=document.createElement('button');
  b.id='admin-fab';
  b.title='админка';
  b.innerHTML=`<svg viewBox="0 0 20 20" width="18" height="18"><path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.8l-4.9 2.4.9-5.5L2 7.8l5.5-.8L10 2z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/></svg>`;
  b.onclick=openAdmin;
  document.body.appendChild(b);
}

function clearChatOverlays(){
  replyTo = null;
  document.getElementById('reply-bar')?.classList.add('hidden');
  document.getElementById('emoji-picker')?.classList.add('hidden');
  document.getElementById('chat-attach-sheet')?.classList.add('hidden');
  document.getElementById('chat-search-bar')?.classList.add('hidden');
  document.getElementById('members-sheet')?.classList.add('hidden');
  document.getElementById('mention-list')?.classList.add('hidden');
  searchQuery = '';
  const searchInp = document.getElementById('chat-search-inp');
  if(searchInp) searchInp.value = '';
}
