// ══════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════
const v=id=>document.getElementById(id)?.value||'';
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
let toastT;
function toast(msg){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=msg; el.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('show'),2200);
}

// ══════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  curDay=todayIdx();
  initTheme();
  fbPollInvites();
  if(D.currentUser) launchApp();
  let taps=0;
  document.querySelector('.g-title')?.addEventListener('click',()=>{
    if(++taps>=5){document.getElementById('inv-inp').value='BIO-7X4K-MED9';taps=0}
  });
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
window.openPostEditor=openPostEditor; window.closePostEditor=closePostEditor; window.publishPost=publishPost; window.deletePost=deletePost;
window.setWeekType=setWeekType;
window.pinMsg=pinMsg; window.scrollToPinned=scrollToPinned;
window.toggleEmojiPicker=toggleEmojiPicker; window.insertEmoji=insertEmoji;
window.toggleFaq=toggleFaq;
window.openMemberProfile=openMemberProfile; window.closeMemberProfile=closeMemberProfile;
window.toggleChatSearch=toggleChatSearch; window.searchMessages=searchMessages;
window.handleChatInput=handleChatInput; window.insertMention=insertMention;
window.openPost=openPost; window.submitComment=submitComment;
window.reactToPost=reactToPost;
window.switchHwTab=switchHwTab; window.addPersonalHw=addPersonalHw;
window.togglePersonalHw=togglePersonalHw; window.delPersonalHw=delPersonalHw;
window.toggleMembersList=toggleMembersList; window.closeMembersList=closeMembersList;
window.setReply=setReply; window.clearReply=clearReply; window.showReactions=showReactions;
window.calPrev=calPrev; window.calNext=calNext; window.calSelectDay=calSelectDay;
window.openDm=openDm; window.openDmFromSheet=openDmFromSheet; window.sendDm=sendDm;
window.toggleMembersList=toggleMembersList; window.closeMembersList=closeMembersList;
