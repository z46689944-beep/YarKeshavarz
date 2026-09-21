import agricultureDB from "./agriculture-db.js";

function normalize(s=""){
  return String(s).toLowerCase()
    .replace(/[ÙŠÙ‰]/g,"ÛŒ").replace(/Ùƒ/g,"Ú©")
    .replace(/[Û€Ø©]/g,"Ù‡").replace(/[â€ŒÙ€]/g,"")
    .replace(/[Û°-Û¹]/g,d=>"Û°Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹".indexOf(d))
    .replace(/[Ù -Ù©]/g,d=>"Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©".indexOf(d))
    .replace(/[^\p{L}\p{N}\s]/gu," ")
    .replace(/\s+/g," ").trim();
}

function tokens(s){ return normalize(s).split(" ").filter(x=>x.length>1); }

function managerKnowledge(){
  try {
    const a=JSON.parse(localStorage.getItem("yk-admin-knowledge-v1")||"[]");
    return Array.isArray(a)?a:[];
  } catch { return []; }
}

function fmtDate(v){
  if(!v) return "ثبت نشده";
  return String(v);
}

function landContextAnswer(question, context){
  const q=normalize(question);
  const land=context?.land;
  if(!land) return null;

  const cultivation=context?.cultivation || {};
  const history=Array.isArray(context?.cultivationHistory)
    ? context.cultivationHistory
    : [];

  const wantsHistory =
    /سابقه|پارسال|سال قبل|قبلا|قبلی|کشت قبلی|چه کاشتم|کاشته بودم/.test(q);

  if(wantsHistory){
    if(!history.length){
      return `🌾 سابقه کشت برای «${land.name||"این زمین"}» در اطلاعات آفلاین ثبت نشده است.`;
    }

    const rows=history.slice().reverse().map((x,i)=>{
      const crop=x.crop||"محصول ثبت نشده";
      const variety=x.variety?` (${x.variety})`:"";
      const year=x.year?` — سال ${x.year}`:"";
      const area=x.area?` — ${x.area} هکتار`:"";
      return `${i+1}. ${crop}${variety}${year}${area}`;
    }).join("\n");

    return `🌾 سابقه کشت «${land.name||"این زمین"}»:\n\n${rows}`;
  }

  if(/محصول فعلی|الان چی کاشتم|چی کاشتم|محصول این زمین/.test(q)){
    const crop=cultivation.crop||land.crop;
    if(crop){
      return `🌱 محصول فعلی این زمین: ${crop}${cultivation.variety?` — رقم ${cultivation.variety}`:""}\n📅 تاریخ کشت: ${fmtDate(cultivation.plantDate)}\n📌 وضعیت: ${cultivation.status||"ثبت نشده"}`;
    }
    return "🌱 برای این زمین هنوز محصول فعلی ثبت نشده است.";
  }

  if(/خاک|نوع خاک/.test(q) && land.soil){
    return `🪨 نوع خاک ثبت‌شده برای «${land.name||"این زمین"}»: ${land.soil}`;
  }

  if(/آب|آبیاری|منبع آب/.test(q)){
    const parts=[];
    if(land.water) parts.push(`منبع/وضعیت آب: ${land.water}`);
    if(land.irrigation) parts.push(`روش آبیاری: ${land.irrigation}`);
    return parts.length ? `💧 اطلاعات آب این زمین:\n\n${parts.join("\n")}` : null;
  }

  if(/منطقه|آدرس|روستا|موقعیت/.test(q) && land.region){
    return `📍 منطقه ثبت‌شده این زمین: ${land.region}`;
  }

  if(/مساحت|متراژ|چند هکتار/.test(q) && land.area){
    return `📐 مساحت «${land.name||"این زمین"}»: ${land.area} هکتار`;
  }

  return null;
}

function findOfflineAnswer(question, context=null){
  const direct=landContextAnswer(question, context);
  if(direct) return direct;

  const q=normalize(question);
  if(!q) return "🌱 سؤال کشاورزی را بنویسید.";

  const qt=tokens(q);
  let best=null, bestScore=0;
  const db=[...agricultureDB, ...managerKnowledge().map(x=>({
    topic:x.title,
    keywords:x.keywords||[],
    general:x.answer,
    solution:""
  }))];

  for(const item of db){
    let score=0;
    const keys=(item.keywords||[]).map(normalize);
    for(const key of keys){
      if(!key) continue;
      if(q.includes(key)) score += key.includes(" ") ? 5 : 2;
      else {
        const kt=tokens(key);
        score += kt.filter(t=>qt.includes(t)).length;
      }
    }
    if(normalize(item.topic)===q) score+=12;
    if(score>bestScore){bestScore=score;best=item;}
  }

  if(!best || bestScore<2){
    return "🌱 یار کشاورز آفلاین\n\nبرای این سؤال در بانک آفلاین پاسخ کافی پیدا نکردم.\nنام محصول + نشانه یا موضوع را دقیق‌تر بنویسید؛ مثلاً «گوجه، برگ زرد» یا «گندم، سن گندم».";
  }

  let out=`🌱 ${best.topic}\n\n`;
  if(best.symptoms) out+=`🔎 نشانه‌ها:\n${best.symptoms}\n\n`;
  if(best.cause) out+=`⚠️ علت/توضیح:\n${best.cause}\n\n`;
  if(best.general) out+=`${best.general}\n\n`;
  if(best.solution) out+=`✅ راهکار کلی:\n${best.solution}\n`;
  out+="\nℹ️ برای تصمیم درباره سم، کود یا درمان، شرایط مزرعه و برچسب ثبت‌شده محصول را هم بررسی کنید.";
  return out.trim();
}

export default findOfflineAnswer;
export { findOfflineAnswer };
window.YarKeshavarzOffline = { findOfflineAnswer };
