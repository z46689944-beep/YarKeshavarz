import agricultureDB from "./agriculture-db.js";

function normalize(s=""){
  return String(s).toLowerCase()
    .replace(/[يى]/g,"ی").replace(/ك/g,"ک")
    .replace(/[ۀة]/g,"ه").replace(/[‌ـ]/g,"")
    .replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d))
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

function findOfflineAnswer(question){
  const q=normalize(question);
  if(!q) return "🌱 سؤال کشاورزی را بنویسید.";

  const qt=tokens(q);
  let best=null, bestScore=0;
  const db=[...agricultureDB, ...managerKnowledge().map(x=>({topic:x.title,keywords:x.keywords||[],general:x.answer,solution:""}))];

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
  out+="\nℹ️ برای تصمیم درباره سم، کود یا درمان، برچسب ثبت‌شده، شرایط مزرعه و نظر کارشناس محلی را هم بررسی کنید.";
  return out.trim();
}

export default findOfflineAnswer;
export { findOfflineAnswer };
window.YarKeshavarzOffline = { findOfflineAnswer };
