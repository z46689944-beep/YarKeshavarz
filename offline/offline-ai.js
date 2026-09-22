import baseDB from "./agriculture-db-extended.js";
import brain from "./global-agriculture-brain.js";
import cropProfiles from "./crop-profiles.js";
import {extractEntities} from "./intent-engine.js";
import {remember,contextHint} from "./context-engine.js";
import {getWeatherAdvice} from "./weather-advisor.js";
import buildRegionalAdvice from "./regional-crop-calendar.js";
import {buildFarmPlan,farmPlanText} from "./farm-planner.js";

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

const PROFILE_UI_MARKER="__YK_CROP_PROFILE_V1__";

function profileValue(profile,key){
  const v=profile?.[key];
  if(Array.isArray(v)) return v;
  if(v===undefined||v===null||v==="") return null;
  return [String(v)];
}
function profilePayload(profile, focus="general"){
  const name=cropNameOf(profile);
  const sections=[];
  const add=(title,icon,items)=>{
    const out=[];
    for(const [label,key] of items){
      const v=profileValue(profile,key);
      if(v===null) continue;
      out.push([label,v]);
    }
    if(out.length) sections.push({title,icon,items:out});
  };
  if(focus==="planting") add("کاشت و تکثیر","🌾",[["فصل مناسب","season"],["دوره رشد/رسیدگی","growthDays"],["تکثیر","propagation"],["روش و عمق کاشت","planting"]]);
  else if(focus==="irrigation") add("آبیاری","💧",[["مدیریت آب","irrigation"],["مراحل حساس","irrigationStages"]]);
  else if(focus==="fertilizer") add("تغذیه و کود","🧪",[["تغذیه","nutrition"],["راهنمای کود","fertilizer"]]);
  else if(focus==="pest") add("آفات","🐛",[["آفات مهم","pests"]]);
  else if(focus==="disease") add("بیماری‌ها","🦠",[["بیماری‌های مهم","diseases"]]);
  else if(focus==="harvest") add("برداشت و پس از برداشت","🧺",[["برداشت","harvest"],["پس از برداشت","postHarvest"],["انبارداری","storage"]]);
  else if(focus==="soil") add("خاک و شرایط محیطی","🌱",[["خاک","soil"],["pH","ph"],["EC/شوری","ec"],["اقلیم","climate"]]);
  else add("اطلاعات محصول","📋",[["اقلیم","climate"],["خاک","soil"],["کاشت","planting"],["آبیاری","irrigation"],["داشت","care"],["برداشت","harvest"]]);
  return {
    name,
    scientificName:profile?.scientificName||profile?.scientific||"",
    summary:profile?.summary||profile?.description||`شناسنامه پایه آفلاین ${name}`,
    sections
  };
}
function profileMarker(profile,focus="general"){
  return PROFILE_UI_MARKER+JSON.stringify(profilePayload(profile,focus));
}

export async function findCropProfileAnswer(question,entities,context={}){
  const cropName=entities?.crop?.crop || context?.cultivation?.crop || context?.land?.crop || context?.l?.crop;
  if(!cropName)return null;

  const profile=cropProfiles[cropName]||
    Object.entries(cropProfiles).find(([name,p])=>
      name===cropName||(p.aliases||[]).some(a=>normalize(a)===normalize(cropName))
    )?.[1];
  if(!profile)return null;

  const q=normalize(question);
  const intent=entities?.intent?.id||"general";
  const focusMap={
    planting:"planting", irrigation:"irrigation", fertilizer:"fertilizer",
    pest:"pest", disease:"disease", harvest:"harvest", soil:"soil"
  };
  const focus=(intent==="definition"||intent==="general"||q===normalize(profile.aliases?.[0]||""))
    ?"general":(focusMap[intent]||"general");

  const payload=profilePayload(profile,focus);
  const l=context?.land||context?.l;
  const stock=context?.inventory||context?.stock||[];
  const equipment=context?.equipment||[];
  const economics=context?.economics||context?.t||null;

  if(l){
    const landItems=[];
    for(const [label,value] of [
      ["زمین",l.name],["مساحت",l.area?`${fmtNum(l.area)} هکتار`:null],
      ["منطقه",l.region],["خاک",l.soil],["منبع آب",l.water],["آبیاری",l.irrigation],
      ["رقم",context?.cultivation?.variety||l.cropVariety],["تاریخ کاشت",context?.cultivation?.plantDate||l.plantDate]
    ]) if(value!==undefined&&value!==null&&String(value).trim()!="") landItems.push([label,[String(value)]]);
    if(landItems.length) payload.sections.push({title:"پرونده همین زمین",icon:"🗺️",items:landItems});
  }

  const cropWords=[normalize(cropName),...(profile.aliases||[]).map(normalize)];
  const relevantStock=stock.filter(x=>{
    const text=normalize(`${x?.name||""} ${x?.category||""}`);
    return cropWords.some(w=>w&&text.includes(w)) || /کود|بذر|سم|نهاده|گوگرد|ریز مغذی|ازت|فسفر|پتاس/.test(text);
  }).slice(0,12);
  if(relevantStock.length){
    payload.sections.push({title:"انبار مرتبط با این محصول",icon:"📦",items:relevantStock.map(x=>[
      x?.name||"نهاده",[`${fmtNum(x?.qty)} ${x?.unit||""}${x?.category?` — ${x.category}`:""}`.trim()]
    ])});
  }

  if(equipment.length){
    const relevantEq=equipment.filter(x=>/تراکتور|سمپاش|کمباین|دروگر|کولتیواتور|روتیواتور|بذرکار|خاکورز|ادوات|ماشین/.test(normalize(`${x?.name||""} ${x?.type||""}`))).slice(0,10);
    if(relevantEq.length) payload.sections.push({title:"ادوات در دسترس",icon:"🚜",items:relevantEq.map(x=>[
      x?.name||"تجهیز",[[x?.type,x?.model,x?.status].filter(Boolean).join(" | ")||"وضعیت ثبت نشده"]
    ])});
  }

  if(economics){
    payload.sections.push({title:"اقتصاد ثبت‌شده زمین",icon:"💰",items:[
      ["هزینه",[`${fmtNum(economics.cost)} تومان`]],
      ["درآمد",[`${fmtNum(economics.income)} تومان`]],
      ["سود/زیان",[`${fmtNum(economics.profit)} تومان`]]
    ]});
  }

  try{
    const weather=await getWeatherAdvice(context);
    if(weather?.data?.rows?.length){
      const rows=weather.data.rows;
      const hot=Math.max(...rows.map(x=>Number(x.tmax)||-99));
      const cold=Math.min(...rows.map(x=>Number(x.tmin)||99));
      const rain=rows.reduce((s,x)=>s+(Number(x.mm)||0),0);
      payload.sections.push({title:"هوا و ریسک کوتاه‌مدت",icon:"🌦️",items:[
        ["پیش‌بینی",[weather.data.place||"منطقه ثبت‌شده"]],
        ["بازه دما",[`${cold} تا ${hot}°C`]],
        ["بارش ۷ روز",[`${rain.toFixed(1)} میلی‌متر`]],
        ["نتیجه عملی",[weather.data.notes?.join(" ")||"هشدار عمومی ثبت نشده است."]]
      ]});
    }
  }catch{}

  const farmPlan=buildFarmPlan(context);
  if(farmPlan.ok){
    const planItems=[];
    if(farmPlan.planting) planItems.push(["تاریخ کاشت تقریبی",[farmPlan.planting.window]]);
    if(farmPlan.seed) planItems.push(["بذر کل زمین",[`${fmtNum(farmPlan.seed.range[0])} تا ${fmtNum(farmPlan.seed.range[1])} ${farmPlan.seed.unit}`]]);
    if(farmPlan.irrigation) planItems.push(["تعداد نوبت آبیاری",[`${fmtNum(farmPlan.irrigation.count[0])} تا ${fmtNum(farmPlan.irrigation.count[1])} نوبت در فصل؛ فاصله حدود ${fmtNum(farmPlan.irrigation.interval[0])} تا ${fmtNum(farmPlan.irrigation.interval[1])} روز`]]);
    if(farmPlan.economics?.actual) planItems.push(["اقتصاد ثبت‌شده",[`${fmtNum(farmPlan.economics.cost)} تومان هزینه | ${fmtNum(farmPlan.economics.income)} تومان درآمد | ${fmtNum(farmPlan.economics.profit)} تومان سود/زیان`]]);
    else if(farmPlan.economics) planItems.push(["برآورد اقتصادی",[`${fmtNum(farmPlan.economics.cost[0])} تا ${fmtNum(farmPlan.economics.cost[1])} تومان هزینه | ${fmtNum(farmPlan.economics.income[0])} تا ${fmtNum(farmPlan.economics.income[1])} تومان درآمد ناخالص`]]);
    if(planItems.length) payload.sections.push({title:"برنامه عددی همین زمین",icon:"📊",items:planItems});
  }
  payload.contextNote=`این شناسنامه با پرونده واقعی${l?` «${l.name||"زمین انتخاب‌شده"}»`:" کشاورزیار"} تطبیق داده شده است؛ توصیه نهایی باید با مرحله رشد، آزمون خاک/آب، رقم و شرایط روز مزرعه کنترل شود.`;
  return PROFILE_UI_MARKER+JSON.stringify(payload);
}

function fmtNum(v){
  const n=Number(v);
  return Number.isFinite(n)?n.toLocaleString("fa-IR"):"-";
}
function inventorySummary(items=[]){
  if(!Array.isArray(items)||!items.length)return "📦 در پرونده انبار موردی ثبت نشده است.";
  return "📦 موجودی ثبت‌شده:\n"+items.slice(0,30).map(x=>{
    const name=x?.name||"بدون نام", qty=x?.qty??"-", unit=x?.unit||"";
    const cat=x?.category?` (${x.category})`:"";
    return `• ${name}: ${fmtNum(qty)} ${unit}${cat}`.trim();
  }).join("\n");
}
function equipmentSummary(items=[]){
  if(!Array.isArray(items)||!items.length)return "🚜 در پرونده تجهیزات/ادوات موردی ثبت نشده است.";
  return "🚜 تجهیزات و ادوات ثبت‌شده:\n"+items.slice(0,30).map(x=>{
    const name=x?.name||"بدون نام";
    const parts=[x?.type,x?.model,x?.status].filter(Boolean);
    return `• ${name}${parts.length?" — "+parts.join(" | "):""}`;
  }).join("\n");
}
function economicsSummary(e){
  if(!e)return "💰 اطلاعات اقتصادی برای این پرونده ثبت نشده است.";
  return `💰 اقتصاد پرونده:\n• هزینه: ${fmtNum(e.cost)} تومان\n• درآمد: ${fmtNum(e.income)} تومان\n• سود/زیان: ${fmtNum(e.profit)} تومان`;
}
function landSummary(c){
  const l=c?.land||c?.l;
  if(!l)return "🌾 هنوز پرونده زمین مشخصی انتخاب نشده است.";
  const rows=[
    ["نام",l.name],["مساحت",l.area?`${fmtNum(l.area)} هکتار`:null],
    ["منطقه",l.region],["خاک",l.soil],["منبع آب",l.water],
    ["آبیاری",l.irrigation],["محصول",l.crop],["مالکیت",l.ownership]
  ].filter(x=>x[1]!==undefined&&x[1]!==null&&String(x[1]).trim()!=="");
  return "🌾 مشخصات پرونده زمین:\n"+rows.map(x=>`• ${x[0]}: ${x[1]}`).join("\n");
}
function hasAny(q,words){
  return words.some(w=>contains(q,w));
}
async function contextAnswer(q,context){
  const stock=context?.inventory||context?.stock||[];
  const equipment=context?.equipment||[];
  const economics=context?.economics||context?.t||null;
  const land=context?.land||context?.l||null;
  const cultivation=context?.cultivation||{};
  const history=context?.cultivationHistory||[];
  const tx=context?.recentTransactions||[];

  const invQ=hasAny(q,["انبار","موجودی","موجودی انبار","کود","بذر","سم","نهاده","چی دارم","چه دارم"]);
  const eqQ=hasAny(q,["ادوات","تجهیزات","ماشین","تراکتور","سمپاش","کمباین","دروگر","بذرکار","روتیواتور"]);
  const ecoQ=hasAny(q,["هزینه","درآمد","سود","زیان","اقتصاد","خرج","صرفه","فروش","خرید"]);
  const landQ=hasAny(q,["زمینم","زمین","مساحت","خاک","آب","آبیاری","منطقه","روستا","شهر","رقم","تاریخ کاشت","مرحله رشد"]);
  const weatherQ=hasAny(q,["هوا","آب و هوا","بارندگی","باران","دما","باد","یخبندان","گرما","سرما","رطوبت"]);
  const planQ=hasAny(q,["چه کار کنم","الان چه کار","قدم بعدی","برنامه","برنامه امروز","پیشنهاد بده","راهنمایی کن","تصمیم","بهتره","تاریخ کاشت","زمان کاشت","کی بکارم","بذر","چقدر بذر","چند نوبت آبیاری","نوبت آبیاری","خرج تقریبی","هزینه تقریبی","درآمد تقریبی","سود تقریبی"]);
  const crop= cultivation.crop || land?.crop || "";

  const lines=[];
  const title=land?`🧠 تحلیل پرونده «${land.name||"زمین انتخاب‌شده"}»`:`🧠 تحلیل کشاورزیار`;
  lines.push(title);
  if(planQ && land && (cultivation.crop||land.crop)){
    const planText=farmPlanText(context);
    if(planText) lines.push("📊 برنامه عددی مزرعه:\n"+planText);
  }

  if(landQ){
    lines.push(landSummary(context));
  }
  if(invQ){
    lines.push(inventorySummary(stock));
    if(stock.length && crop) {
      const useful=stock.filter(x=>/کود|بذر|سم|نهاده|گوگرد|ازت|فسفر|پتاس|ریز/.test(normalize(`${x?.name||""} ${x?.category||""}`))).slice(0,8);
      if(useful.length) lines.push(`🎯 برای ${crop} از اقلام ثبت‌شده، این موارد بیشترین ارتباط را دارند:\n`+useful.map(x=>`• ${x.name}: ${fmtNum(x.qty)} ${x.unit||""}`).join("\n"));
    }
  }
  if(eqQ) lines.push(equipmentSummary(equipment));
  if(ecoQ){
    lines.push(economicsSummary(economics));
    if(tx.length){
      const recent=tx.slice(-8).map(x=>`• ${x.date||"بدون تاریخ"} — ${x.type||"عملیات"} — ${fmtNum(x.amount)} تومان${x.category?` — ${x.category}`:""}`).join("\n");
      lines.push(`🧾 آخرین تراکنش‌های ثبت‌شده:\n${recent}`);
    }
  }
  if(history.length && hasAny(q,["سال قبل","سال گذشته","سابقه","تاریخچه","قبلی","عملکرد"])){ 
    lines.push(`📚 سابقه کشت:\n${history.slice(-6).map(x=>`• ${x.year||"سال نامشخص"}: ${x.crop||"-"}${x.variety?` (${x.variety})`:""} | هزینه ${fmtNum(x.cost)} | درآمد ${fmtNum(x.income)} | سود ${fmtNum(x.profit)}`).join("\n")}`);
  }

  let weather=null;
  if(weatherQ||planQ||invQ||eqQ||crop){
    try{weather=await getWeatherAdvice(context)}catch{}
    if(weatherQ&&weather) lines.push(weather.text.trim());
  }

  if(planQ && land){
    const actions=[];
    if(!land.crop) actions.push("🌱 محصول و مرحله رشد را ثبت کن؛ بدون آن برنامه عملی دقیق محدود می‌شود.");
    if(!land.soil) actions.push("🪨 نوع خاک یا نتیجه آزمون خاک را ثبت کن.");
    if(!land.water||!land.irrigation) actions.push("💧 منبع آب و روش آبیاری را مشخص کن تا مدیریت آب قابل تنظیم باشد.");
    if(weather?.data?.notes?.length) actions.push(...weather.data.notes);
    if(stock.length) actions.push(`📦 قبل از خرید نهاده، موجودی ثبت‌شده را با نیاز مرحله رشد ${crop||"محصول"} تطبیق بده.`);
    if(equipment.length) actions.push("🚜 برنامه عملیات را با ادوات موجود و وضعیت ثبت‌شده آن‌ها هماهنگ کن.");
    if(economics) actions.push(`💰 سود/زیان فعلی ثبت‌شده ${fmtNum(economics.profit)} تومان است؛ خرید جدید را با این عدد و هزینه‌های عملیات مقایسه کن.`);
    if(actions.length) lines.push("🎯 قدم‌های پیشنهادی:\n"+actions.slice(0,7).map(x=>`• ${x}`).join("\n"));
  }

  // A context-aware response should only fire when the question clearly asks about the farm dossier.
  const explicitContext=invQ||eqQ||ecoQ||landQ||weatherQ||planQ;
  if(!explicitContext)return null;
  if(lines.length<=1)return "🌱 برای تحلیل دقیق‌تر، یک زمین را انتخاب کن تا پرونده، انبار، ادوات، اقتصاد و آب‌وهوا را هم‌زمان بررسی کنم.";
  return lines.join("\n\n");
}

export async function findOfflineAnswer(question="",context={}){
  const q=normalize(question);
  if(!q)return "🌱 سؤال کشاورزی‌ات را بنوی.";
  if(isSmallTalk(q))return smallTalkAnswer(q);
  const ctxAnswer=await contextAnswer(q,context);
  if(ctxAnswer){
    remember("user",question,context?.l?{land:context.l}:{})
    remember("bot",ctxAnswer,context?.l?{land:context.l}:{});
    return ctxAnswer;
  }
  if(/(تاریخ کاشت|زمان کاشت|کی بکار|کی بکارم|الان بکار|الان بکارم|وقت کاشت|بازه کاشت|تقویم کشت|تقویم کاشت|برنامه کشت|پیشنهاد کشت|پیشنهاد کاشت|چه موقع بکار)/.test(q)){
    let regional=buildRegionalAdvice(context);
    const plan=farmPlanText(context);
    if(plan && !/برای برنامه عددی/.test(plan)) regional+="\n\n📊 برآورد عددی زمین:\n"+plan;
    const weather=await getWeatherAdvice(context);
    if(weather) regional+=weather.text;
    remember("user",question,context?.l?{land:context.l}:{});
    remember("bot",regional,context?.l?{land:context.l,weather:weather?.data}:{});
    return regional;
  }

  const entities=extractEntities(q);
  const e=contextHint(entities,q);
  const prof=await findCropProfileAnswer(q,e,context);

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

  let answer=a.trim();
  if(context?.l){
    const weather=await getWeatherAdvice(context);
    if(weather) answer+=weather.text;
  }
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
