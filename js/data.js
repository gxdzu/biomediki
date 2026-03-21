// ══════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════
const SK = 'sg304v3';
// Admin auth — code is not stored in source, verified via hash
function checkAdminCode(raw){
  const c = raw.toUpperCase();
  let h = 0;
  for(let i=0;i<c.length;i++) h = Math.imul(31,h)+c.charCodeAt(i)|0;
  const salted = c.split('').reverse().join('')+'sg304v3';
  let h2 = 0;
  for(let i=0;i<salted.length;i++) h2 = Math.imul(31,h2)+salted.charCodeAt(i)|0;
  return Math.abs(h).toString(36)+Math.abs(h2).toString(36) === 'rut1311rwpvn';
}

const DEFAULTS = {
  invites:[
    {code:'PQRS-7842',used:false,usedBy:null},
    {code:'MNOP-3391',used:false,usedBy:null},
    {code:'WXYZ-5520',used:false,usedBy:null},
  ],
  members:[{name:'Саша',role:'admin',code:'',subgroup:0}],
  schedule:[],
  homework:[],
  feed:[],
  chat:{general:[],math:[],history:[],philosophy:[],programming:[]},
  quote:'Всё, что мы знаем — это то, что мы ничего не знаем. — Сократ',
  cat:{mood:72,food:55,lastFed:null,lastPet:null},
  currentUser:null,
  hwNextId:1,
  weekType:'red', // 'red' or 'blue' — current week type
};

const QUOTES=[
  'Всё, что мы знаем — это то, что мы ничего не знаем. — Сократ',
  'Красота спасёт мир. — Достоевский',
  'Существование предшествует сущности. — Сартр',
  'Человек — это верёвка над пропастью. — Ницше',
  'Я мыслю, следовательно, существую. — Декарт',
  'Всё течёт, всё меняется. — Гераклит',
  'Учись так, словно тебе всегда будет мало.',
];

const DAYS_RU=['понедельник','вторник','среда','четверг','пятница','суббота','воскресенье'];
const DAYS_S=['пн','вт','ср','чт','пт','сб','вс'];
const MON_RU=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const CHANNELS={general:'общий',math:'матан',history:'история',philosophy:'философия',programming:'программирование'};
const CAT_HAPPY=['мурр... всё хорошо','жизнь прекрасна','мурмурмур','тепло и уютно'];
const CAT_NEU=['смотрит в окно','думает о своём','моргает медленно'];
const CAT_SAD=['где все?','давно никто...','мяу?','одиноко...'];
const CAT_FED=['спасибо за еду!','вкусно...','мммм','ещё?'];
const CAT_PET=['мррр...','чуть громче мурчит','щурится от удовольствия'];

function loadApp(){
  try{
    const r=localStorage.getItem(SK);
    if(r){
      const p=JSON.parse(r);
      return mergeDeep(JSON.parse(JSON.stringify(DEFAULTS)),p);
    }
  }catch(e){}
  return JSON.parse(JSON.stringify(DEFAULTS));
}
function mergeDeep(d,s){
  if(!s||typeof s!=='object') return d;
  const o=Object.assign({},d);
  for(const k in s){
    if(Array.isArray(d[k])&&Array.isArray(s[k])) o[k]=s[k];
    else if(d[k]&&typeof d[k]==='object'&&typeof s[k]==='object') o[k]=mergeDeep(d[k],s[k]);
    else o[k]=s[k];
  }
  return o;
}
const D=loadApp();
const save=()=>localStorage.setItem(SK,JSON.stringify(D));
