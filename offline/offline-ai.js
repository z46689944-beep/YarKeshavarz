import baseDB from "./agriculture-db-extended.js";
import brain from "./global-agriculture-brain.js";
import cropProfiles from "./crop-profiles.js";
import {extractEntities} from "./intent-engine.js";
import {remember,contextHint} from "./context-engine.js";

const KNOWLEDGE_KEY="yk-admin-knowledge-v1";

const SMALL_TALK=[
  "ممنون","مرسی","متشکرم","سپاس","سپاسگزارم","خیلی ممنون",
  "دمت گرم","دستت درد نکنه","خسته نباشی","عالی بود","ممنونم"
];

function normalize(t=""){
  return String(t).toLowerCase()
    .replace(/[يى]/g,"ی")
    .replace(/ك/g,"ک")
    .replace(/\u200c/g," ")
    .replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[^\p{L}\p{N}\s]/gu," ")
    .replace(/\s+/g," ")
    .trim();
}

function isSmallTalk(q=""){
  const n=normalize(q);
  return SMALL_TALK.some(x=>n===normalize(x)||n.startsWith(normalize(x)+" "));
}

function smallTalkAnswer(q=""){
  const n=normalize(q);
  if(n.includes("ممنون")||n.includes("مرسی")||n.includes("متشکرم")||n.includes("سپاس"))
    return "خواهش می‌کنم داداش 🌱❤️ هر سؤال کشاورزی داشتی بپرس.";
  if(n.includes("عالی")||n.includes("دمت گرم"))
    return "قربانت داداش 🌱❤️ خوشحالم که به کارت اومد.";
  return "خواهش می‌کنم داداش 🌱🌾";
}

const STOP=new Set([
  "چیست","چیه","چه","چگونه","چطور","چرا","کی","زمان","زمانی","است","هست","هستند",
  "دارد","دارند","شود","باید","برای","در","از","به","با","را","که","این","آن","یک",
  "و","یا","من","می","کنم","کنیم","کنید","مناسب","لازم","نیاز","پیشنهاد"
]);

function toks(t){
  return normalize(t).split(" ").filter(x=>x.length>1&&!STOP.has(x));
}

function contains(text,term){
  const a=normalize(text).split(" ").filter(Boolean);
  const b=normalize(term).split(" ").filter(Boolean);
  if(!b.length)return false;
  if(b.length===1)return a.includes(b[0]);
  for(let i=0;i<=a.length-b.length;i++){
    let ok=true;
    for(let j=0;j<b.length;j++){
      if(a[i+j]!==b[j]){ok=false;break;}
    }
    if(ok)return true;
  }
  return false;
}

function managerDB(){
  try{
    const d=JSON.parse(localStorage.getItem(KNOWLEDGE_KEY)||"[]");
    return Array.isArray(d)?d.map(x=>({
      category:"مدیریت",
      topic:x.title||x.topic||"دانش مدیریت",
      keywords:x.keywords||[],
      general:x.answer||x.general||"",
      solution:x.solution||""
    })):[];
  }catch{return[];}
}

function score(q,qt,item,e){
  let s=0;
  const topic=normalize(item.topic||"");
  if(topic&&q===topic)s+=45;
  if(topic&&contains(q,topic))s+=20;
  for(const t of toks(topic))if(qt.includes(t))s+=5;
  for(const raw of item.keywords||[]){
    const k=normalize(raw);
    if(contains(q,k))s+=k.includes(" ")?11:7;
  }
  if(e.crop?.crop&&contains(topic,e.crop.crop))s+=16;
  if(e.intent?.id&&normalize(item.category||"").includes(e.intent.id))s+=3;
  return s;
}

export function searchKnowledge(question){
  const q=normalize(question);
  const entities=extractEntities(q);
  const e=contextHint(entities,q);
  const db=[
    ...(Array.isArray(baseDB)?baseDB:[]),
    ...(brain?.records||[]),
    ...managerDB()
  ];
  const ranked=db.map(item=>({item,score:score(q,toks(q),item,e)}))
    .filter(x=>x.score>0)
    .sort((a,b)=>b.score-a.score);
  return {
    item:ranked[0]?.item||null,
    score:ranked[0]?.score||0,
    ranked:ranked.slice(0,3),
    entities:e
  };
}

function clarification(q,r){
  if(r.entities?.explicitCropLike&&!r.entities?.crop?.crop){
    return "🌱 محصول جدیدت را دیدم، اما هنوز آن محصول در دانش آفلاین من با اطمینان شناسایی نشده است. نام محصول را دقیق بنوی یا همراهش منطقه و مرحله رشد را بگو تا پاسخ عمومیِ امن بدهم؛ من محصول قبلی گفتگو را جایگزینش نمی‌کنم.";
  }
  return "🌱 برای این سؤال تطبیق مطمئن کافی پیدا نکردم. نام محصول، مشکل، مرحله رشد یا شرایط زمین را دقیق‌تر بنوی؛ مثلاً «گل محمدی، آبیاری تابستان» یا «گندم، برگ زرد».";
}

function list(value){
  if(!Array.isArray(value))return String(value||"");
  return value.map(x=>`• ${x}`).join("\n");
}

function cropNameOf(profile){
  return Object.keys(cropProfiles).find(k=>cropProfiles[k]===profile)||"محصول";
}

function section(title,icon,fields,profile){
  let out=`${icon} ${title}\n`,any=false;
  for(const [label,key] of fields){
    if(profile[key]!==undefined && profile[key]!==null && profile[key]!==""){
      any=true;
      out+=`• ${label}: ${Array.isArray(profile[key])?list(profile[key]):profile[key]}\n`;
    }
  }
  return any?out+"\n":"";
}

function fullProfileAnswer(profile){
  const name=cropNameOf(profile);
  let a=`🌱 ${name}\n`;
  if(profile.scientificName)a+=`🔬 نام علمی: ${profile.scientificName}\n`;
  if(profile.summary)a+=`\n${profile.summary}\n\n`;

  a+=section("شرایط و اقلیم","🌤️",[
    ["اقلیم","climate"],["دما","temperature"],["فصل مناسب","season"],["دوره رشد/رسیدگی","growthDays"]
  ],profile);
  a+=section("خاک و شرایط زمین","🌱",[
    ["خاک مناسب","soil"],["pH","ph"],["شوری / EC","ec"]
  ],profile);
  a+=section("کاشت و تکثیر","🌾",[
    ["روش تکثیر","propagation"],["روش و عمق کاشت","planting"]
  ],profile);
  a+=section("آبیاری","💧",[
    ["نیاز و مدیریت آب","irrigation"],["مراحل حساس","irrigationStages"]
  ],profile);
  a+=section("تغذیه و کود","🧪",[
    ["تغذیه","nutrition"],["راهنمای کود","fertilizer"]
  ],profile);
  a+=section("داشت و مراقبت","🌿",[["عملیات مهم","care"]],profile);
  a+=section("آفات","🐛",[["آفات مهم","pests"]],profile);
  a+=section("بیماری‌ها","🦠",[["بیماری‌های مهم","diseases"]],profile);
  a+=section("برداشت","🧺",[["زمان / نشانه برداشت","harvest"]],profile);
  a+=section("پس از برداشت و انبار","📦",[
    ["پس از برداشت","postHarvest"],["انبارداری","storage"]
  ],profile);
  a+=section("عملکرد و اقتصاد","💰",[
    ["عملکرد","yield"],["اقتصاد","economics"]
  ],profile);
  a+=section("ریسک‌های مهم","⚠️",[["ریسک‌ها","risks"]],profile);

  a+="ℹ️ این شناسنامه، راهنمای پایه آفلاین است؛ تاریخ کاشت، مقدار آب، کود و سایر اعداد باید با رقم، منطقه، آزمون خاک/آب و شرایط واقعی مزرعه تطبیق داده شوند.";
  return a.trim();
}

export function findCropProfileAnswer(question,entities){
  const cropName=entities?.crop?.crop;
  if(!cropName)return null;

  const profile=cropProfiles[cropName]||
    Object.entries(cropProfiles).find(([name,p])=>
      name===cropName||(p.aliases||[]).some(a=>normalize(a)===normalize(cropName))
    )?.[1];

  if(!profile)return null;

  const q=normalize(question);
  const intent=entities?.intent?.id||"general";
  const name=cropNameOf(profile);

  if(intent==="definition"||intent==="general"||q===normalize(profile.aliases?.[0]||"")){
    return fullProfileAnswer(profile);
  }

  let a=`🌱 ${name}\n\n`;

  if(intent==="planting")a+=section("کاشت و تکثیر","🌾",[
    ["فصل مناسب","season"],["دوره رشد/رسیدگی","growthDays"],
    ["تکثیر","propagation"],["روش و عمق کاشت","planting"]
  ],profile);
  else if(intent==="irrigation")a+=section("آبیاری","💧",[
    ["مدیریت آب","irrigation"],["مراحل حساس","irrigationStages"]
  ],profile);
  else if(intent==="fertilizer")a+=section("تغذیه و کود","🧪",[
    ["تغذیه","nutrition"],["راهنمای کود","fertilizer"]
  ],profile);
  else if(intent==="pest")a+=section("آفات","🐛",[["آفات مهم","pests"]],profile);
  else if(intent==="disease")a+=section("بیماری‌ها","🦠",[["بیماری‌های مهم","diseases"]],profile);
  else if(intent==="harvest")a+=section("برداشت و پس از برداشت","🧺",[
    ["برداشت","harvest"],["پس از برداشت","postHarvest"],["انبارداری","storage"]
  ],profile);
  else if(intent==="soil")a+=section("خاک و شرایط محیطی","🌱",[
    ["خاک","soil"],["pH","ph"],["EC/شوری","ec"],["اقلیم","climate"]
  ],profile);
  else a+=section("اطلاعات محصول","📋",[
    ["اقلیم","climate"],["خاک","soil"],["کاشت","planting"],
    ["آبیاری","irrigation"],["داشت","care"],["برداشت","harvest"]
  ],profile);

  a+="ℹ️ این شناسنامه، راهنمای پایه آفلاین است؛ تاریخ کاشت، مقدار آب، کود و سایر اعداد باید با رقم، منطقه، آزمون خاک/آب و شرایط واقعی مزرعه تطبیق داده شوند.";
  return a.trim();
}

export function findOfflineAnswer(question=""){
  const q=normalize(question);
  if(!q)return "🌱 سؤال کشاورزی‌ات را بنوی.";
  if(isSmallTalk(q))return smallTalkAnswer(q);

  const entities=extractEntities(q);
  const e=contextHint(entities,q);
  const prof=findCropProfileAnswer(q,e);

  if(prof){
    remember("user",question,e);
    remember("bot",prof,e);
    return prof;
  }

  const r=searchKnowledge(q);
  remember("user",question,r.entities);

  if(!r.item||r.score<7)return clarification(q,r);

  let a=`🌱 ${r.item.topic||"موضوع کشاورزی"}\n\n`;
  if(r.item.symptoms)a+=`🔎 نشانه‌ها:\n${r.item.symptoms}\n\n`;
  if(r.item.cause)a+=`⚠️ علت یا توضیح:\n${r.item.cause}\n\n`;
  if(r.item.general)a+=r.item.general+"\n\n";
  if(r.item.solution)a+=`✅ راهکار کلی:\n${r.item.solution}\n\n`;

  if(r.entities?.intent?.id==="irrigation")
    a+="💧 مقدار و زمان آبیاری به مرحله رشد، بافت خاک، رطوبت و کیفیت آب وابسته است.\n\n";
  if(r.entities?.intent?.id==="fertilizer")
    a+="🧪 نسخه دقیق کود بهتر است بر پایه آزمون خاک/برگ، کیفیت آب و نیاز مرحله رشد تنظیم شود.\n\n";

  a+="ℹ️ برای سموم و درمان‌های حساس، برچسب رسمی، قوانین محلی و نظر کارشناس را هم در نظر بگیر.";

  const answer=a.trim();
  remember("bot",answer,r.entities);
  return answer;
}

export default findOfflineAnswer;

if(typeof window!=="undefined"){
  window.YarKeshavarzOffline={
    ...(window.YarKeshavarzOffline||{}),
    findOfflineAnswer,
    searchKnowledge,
    findCropProfileAnswer
  };
}


/* UI bridge: turn offline crop-profile text into structured product cards.
   Kept here so the offline knowledge engine stays unchanged. */
(function installYarProductCards(){
  if(typeof window==='undefined') return;
  if(window.__YK_PRODUCT_CARDS_V1__) return;
  const escHtml=(v)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const sectionRe=/^(🌤️|🌱|🌾|💧|🧪|🌿|🐛|🦠|🧺|📦|💰|⚠️)\s+(.+)$/;
  function cardHtml(text){
    const raw=String(text||'').replace(/\r/g,'').trim();
    if(!raw || !/ℹ️\s*این شناسنامه/.test(raw)) return null;
    const lines=raw.split('\n').map(x=>x.trim()).filter(Boolean);
    const sections=[]; let title='', intro=[], current=null;
    for(const line of lines){
      const m=line.match(sectionRe);
      if(m){ current={icon:m[1],title:m[2],items:[]}; sections.push(current); continue; }
      if(!title && /^🌱\s+/.test(line)){ title=line.replace(/^🌱\s+/,''); continue; }
      if(!current) intro.push(line); else current.items.push(line);
    }
    if(sections.length<2) return null;
    const introHtml=intro.length?'<div class="yk-product-intro">'+intro.map(x=>'<p>'+escHtml(x)+'</p>').join('')+'</div>':'';
    const cards=sections.map(s=>{
      const body=s.items.map(line=>{
        const safe=escHtml(line);
        return /^•/.test(line)?'<div class="yk-product-line">'+safe+'</div>':'<p class="yk-product-text">'+safe+'</p>';
      }).join('');
      return '<section class="yk-product-card"><h3><span>'+s.icon+'</span>'+escHtml(s.title)+'</h3><div class="yk-product-body">'+body+'</div></section>';
    }).join('');
    return '<div class="yk-product-profile"><div class="yk-product-head"><div class="yk-product-mark">🌱</div><div><h2>'+escHtml(title||'شناسنامه محصول')+'</h2><span>راهنمای آفلاین کشاورزی</span></div></div>'+introHtml+'<div class="yk-product-grid">'+cards+'</div></div>';
  }
  function install(){
    if(window.__YK_PRODUCT_CARDS_V1__) return true;
    if(typeof window.yarRender!=='function') return false;
    const original=window.yarRender;
    window.yarRender=function(){
      original.apply(this,arguments);
      const root=document.getElementById('yarChat');
      if(!root) return;
      root.querySelectorAll('.yar-msg.bot').forEach(msg=>{
        if(msg.dataset.productCard==='1') return;
        const span=msg.querySelector(':scope > div > span');
        if(!span) return;
        const card=cardHtml(span.textContent||'');
        if(card){ span.outerHTML=card; msg.dataset.productCard='1'; }
      });
    };
    const style=document.createElement('style');
    style.id='yk-product-cards-v1';
    style.textContent='.yk-product-profile{width:100%;box-sizing:border-box;color:#173f32}.yk-product-head{display:flex;align-items:center;gap:11px;padding:12px 13px;margin-bottom:10px;border-radius:18px;background:linear-gradient(135deg,#e9f7ef,#f8fcfa);border:1px solid #cfe5d9}.yk-product-mark{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:#176b4d;color:#fff;font-size:24px;flex:0 0 44px}.yk-product-head h2{margin:0;font-size:18px;color:#14583f;font-weight:900}.yk-product-head span{display:block;margin-top:3px;font-size:9px;color:#789087}.yk-product-intro{padding:10px 12px;margin-bottom:10px;border-radius:15px;background:#f7fbf8;border:1px solid #e0eee6;font-size:11px;line-height:1.9;color:#35594b}.yk-product-intro p{margin:0}.yk-product-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.yk-product-card{margin:0;padding:0;overflow:hidden;border:1px solid #dcebe3;border-radius:16px;background:#fff;box-shadow:0 3px 10px rgba(20,70,50,.06)}.yk-product-card h3{display:flex;align-items:center;gap:7px;margin:0;padding:9px 10px;font-size:11px;color:#14583f;background:#eef8f2;border-bottom:1px solid #e0eee6;font-weight:900}.yk-product-card h3 span{font-size:17px}.yk-product-body{padding:9px 10px;font-size:9.5px;line-height:1.9;color:#34574a}.yk-product-body p{margin:0 0 5px}.yk-product-line{margin:0 0 5px;padding:5px 7px;border-radius:9px;background:#f7faf8}@media(max-width:520px){.yk-product-grid{grid-template-columns:1fr}.yk-product-head h2{font-size:17px}.yk-product-body{font-size:10px}}';
    document.head.appendChild(style);
    window.__YK_PRODUCT_CARDS_V1__=true;
    return true;
  }
  if(!install()){
    let n=0; const timer=setInterval(()=>{if(install()||++n>20) clearInterval(timer)},250);
  }
})();
