// ══════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════
const v=id=>document.getElementById(id)?.value||'';
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
let toastT;
function toast(msg){
  const el=document.getElementById('toast'); if(!el) return;
  el.textContent=msg; el.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('show'),2200);
}

// ══════════════════════════════════════════════
// ONLINE STATUS
// ══════════════════════════════════════════════
function updateOnlineStatus(){
  const myName = D.currentUser?.name; if(!myName) return;
  const ts = Date.now();
  try{ localStorage.setItem('sg_online_'+myName, ts); }catch(e){}
}

function getLastSeen(name){
  try{ return parseInt(localStorage.getItem('sg_online_'+name)||'0'); }catch(e){ return 0; }
}

function formatLastSeen(ts){
  if(!ts) return 'не в сети';
  const diff = Date.now() - ts;
  if(diff < 60000) return 'в сети';
  if(diff < 3600000) return `был(а) ${Math.floor(diff/60000)} мин назад`;
  if(diff < 86400000) return `был(а) ${Math.floor(diff/3600000)} ч назад`;
  return `был(а) давно`;
}

// Broadcast online status every 30s while app is open
setInterval(updateOnlineStatus, 30000);

// ══════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  curDay=todayIdx();
  initTheme();
  fbPollInvites();
  updateOnlineStatus();
  if(D.currentUser) launchApp();
  document.getElementById('inv-inp')?.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin()});
});

// ── expose all functions to global scope ──
window.doLogin=doLogin; window.confirmName=confirmName;
window.navigate=navigate; window.prevWeek=prevWeek; window.nextWeek=nextWeek; window.selDay=selDay;
window.petCat=petCat; window.feedCat=feedCat; window.toggleHw=toggleHw;
window.setFil=setFil; window.sendMsg=sendMsg;
window.openAdmin=openAdmin; window.closeAdmin=closeAdmin;
window.genInvite=genInvite; window.delInvite=delInvite; window.kickMember=kickMember;
window.addLesson=addLesson; window.addHw=addHw; window.addLink=addLink;
window.setQuote=setQuote;
window.setSubgroup=setSubgroup; window.doLogout=doLogout;
window.toggleTheme=toggleTheme; window.requestNotifs=requestNotifs;
window.delLessonByIdx=delLessonByIdx; window.delHwAdmin=delHwAdmin;
window.fbDelLink=fbDelLink; window.fbDelHw=fbDelHw;
window.openMsgEdit=openMsgEdit; window.closeMsgModal=closeMsgModal; window.saveMsgEdit=saveMsgEdit; window.delMsg=delMsg;
window.openLesEdit=openLesEdit; window.closeLesModal=closeLesModal; window.saveLesEdit=saveLesEdit;
window.openProfileEdit=openProfileEdit; window.closeProfEdit=closeProfEdit; window.saveProfileEdit=saveProfileEdit;
window.openPostEditor=openPostEditor; window.closePostEditor=closePostEditor;
window.publishPost=publishPost; window.deletePost=deletePost;
window.setWeekType=setWeekType;
window.pinMsg=pinMsg; window.scrollToPinned=scrollToPinned;
window.toggleEmojiPicker=toggleEmojiPicker; window.insertEmoji=insertEmoji;
window.toggleFaq=toggleFaq;
window.openMemberProfile=openMemberProfile; window.closeMemberProfile=closeMemberProfile;
window.toggleMembersList=toggleMembersList; window.closeMembersList=closeMembersList;
window.toggleChatSearch=toggleChatSearch; window.searchMessages=searchMessages;
window.handleChatInput=handleChatInput; window.insertMention=insertMention;
window.openPost=openPost; window.submitComment=submitComment;
window.reactToPost=reactToPost; window.showReactions=showReactions;
window.switchHwTab=switchHwTab; window.addPersonalHw=addPersonalHw;
window.togglePersonalHw=togglePersonalHw; window.delPersonalHw=delPersonalHw;
window.setReply=setReply; window.clearReply=clearReply;
window.calPrev=calPrev; window.calNext=calNext; window.calSelectDay=calSelectDay;
window.openDm=openDm; window.openDmFromSheet=openDmFromSheet; window.sendDm=sendDm;
window.setDmReply=setDmReply; window.clearDmReply=clearDmReply;
window.toggleDmEmoji=toggleDmEmoji; window.insertDmEmoji=insertDmEmoji;
window.openDmMsgEdit=openDmMsgEdit; window.saveDmMsgEdit=saveDmMsgEdit; window.closeDmMsgModal=closeDmMsgModal;
window.delDmMsg=delDmMsg;
window.switchLinksTab=switchLinksTab; window.delPersonalLink=delPersonalLink;
window.openLinkEditor=openLinkEditor; window.closeLinkEditor=closeLinkEditor;
window.openHwEdit=openHwEdit; window.closeHwEdit=closeHwEdit; window.saveHwEdit=saveHwEdit;
window.checkAdminCode=checkAdminCode;
window.postPickMedia=postPickMedia; window.clearPostMedia=clearPostMedia;
window.pickAvatar=pickAvatar;
window.chatPickPhoto=chatPickPhoto; window.dmPickPhoto=dmPickPhoto;
window.setPostMode=setPostMode;
window.toggleChatAttach=toggleChatAttach; window.closeChatAttach=closeChatAttach;
window.chatPickFile=chatPickFile; window.chatPickLink=chatPickLink;
