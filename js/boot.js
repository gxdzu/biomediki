// UTILS
// ══════════════════════════════════════════════
const v=id=>document.getElementById(id).value;
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
let toastT;
function toast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg;el.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),2200);
}

// ══════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  curDay=todayIdx();
  initTheme();
  // fetch invites immediately so login can validate them
  fbPollInvites();
  if(D.currentUser) launchApp();
  // tap title 5x to autofill admin
  let taps=0;
  document.querySelector('.g-title').addEventListener('click',()=>{
    if(++taps>=5){document.getElementById('inv-inp').value='BIO-7X4K-MED9';taps=0}
  });
  document.getElementById('inv-inp').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin()});
});
// ── expose all functions to global scope (survives Netlify IIFE bundling) ──
window.doLogin=doLogin; window.confirmName=confirmName;
window.navigate=navigate; window.prevWeek=prevWeek; window.nextWeek=nextWeek; window.selDay=selDay;
window.petCat=petCat; window.feedCat=feedCat; window.toggleHw=toggleHw;
window.setFil=setFil; window.sendMsg=sendMsg;
window.openAdmin=openAdmin; window.closeAdmin=closeAdmin;
window.genInvite=genInvite; window.delInvite=delInvite; window.kickMember=kickMember;
window.addLesson=addLesson; window.addHw=addHw; window.addLink=addLink;
window.setQuote=setQuote; window.saveProfileName=saveProfileName;
window.setSubgroup=setSubgroup; window.doLogout=doLogout;
window.toggleTheme=toggleTheme; window.requestNotifs=requestNotifs;
window.delLessonByIdx=delLessonByIdx; window.delHwAdmin=delHwAdmin;
window.fbDelLink=fbDelLink; window.fbDelHw=fbDelHw;
window.openMsgEdit=openMsgEdit; window.closeMsgModal=closeMsgModal; window.saveMsgEdit=saveMsgEdit; window.delMsg=delMsg;
window.openLesEdit=openLesEdit; window.closeLesModal=closeLesModal; window.saveLesEdit=saveLesEdit;