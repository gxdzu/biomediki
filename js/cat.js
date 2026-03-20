// CAT
// ══════════════════════════════════════════════
function renderCat(){
  document.getElementById('mood-fill').style.width=D.cat.mood+'%';
  document.getElementById('food-fill').style.width=D.cat.food+'%';
  const msgs=D.cat.mood>60?CAT_HAPPY:D.cat.mood>30?CAT_NEU:CAT_SAD;
  document.getElementById('cat-msg').textContent=rnd(msgs);
  updateBigCat();
}
function updateBigCat(){
  const bc=document.getElementById('big-cat');
  if(D.cat.mood>60) bc.classList.add('happy'); else bc.classList.remove('happy');
}
function petCat(){
  D.cat.mood=Math.min(100,D.cat.mood+10);D.cat.lastPet=Date.now();
  save();showCatMsg(CAT_PET);
  const bc=document.getElementById('big-cat');
  bc.classList.add('purring');setTimeout(()=>bc.classList.remove('purring'),1500);
  updateBigCat();renderHome();
}
function feedCat(){
  D.cat.food=Math.min(100,D.cat.food+22);D.cat.mood=Math.min(100,D.cat.mood+5);D.cat.lastFed=Date.now();
  save();showCatMsg(CAT_FED);updateBigCat();
}
function showCatMsg(arr){
  const el=document.getElementById('cat-msg');
  el.style.opacity='0';
  setTimeout(()=>{el.textContent=rnd(arr);el.style.opacity='1'},200);
}

// ══════════════════════════════════════════════