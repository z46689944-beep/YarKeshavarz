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

function findOfflineAnswer(question){
  const q=normalize(question);
  if(!q) return "ðŸŒ± Ø³Ø¤Ø§Ù„ Ú©Ø´Ø§ÙˆØ±Ø²ÛŒ Ø±Ø§ Ø¨Ù†ÙˆÛŒØ³ÛŒØ¯.";

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
    return "ðŸŒ± ÛŒØ§Ø± Ú©Ø´Ø§ÙˆØ±Ø² Ø¢ÙÙ„Ø§ÛŒÙ†\n\nØ¨Ø±Ø§ÛŒ Ø§ÛŒÙ† Ø³Ø¤Ø§Ù„ Ø¯Ø± Ø¨Ø§Ù†Ú© Ø¢ÙÙ„Ø§ÛŒÙ† Ù¾Ø§Ø³Ø® Ú©Ø§ÙÛŒ Ù¾ÛŒØ¯Ø§ Ù†Ú©Ø±Ø¯Ù….\nÙ†Ø§Ù… Ù…Ø­ØµÙˆÙ„ + Ù†Ø´Ø§Ù†Ù‡ ÛŒØ§ Ù…ÙˆØ¶ÙˆØ¹ Ø±Ø§ Ø¯Ù‚ÛŒÙ‚â€ŒØªØ± Ø¨Ù†ÙˆÛŒØ³ÛŒØ¯Ø› Ù…Ø«Ù„Ø§Ù‹ Â«Ú¯ÙˆØ¬Ù‡ØŒ Ø¨Ø±Ú¯ Ø²Ø±Ø¯Â» ÛŒØ§ Â«Ú¯Ù†Ø¯Ù…ØŒ Ø³Ù† Ú¯Ù†Ø¯Ù…Â».";
  }

  let out=`ðŸŒ± ${best.topic}\n\n`;
  if(best.symptoms) out+=`ðŸ”Ž Ù†Ø´Ø§Ù†Ù‡â€ŒÙ‡Ø§:\n${best.symptoms}\n\n`;
  if(best.cause) out+=`âš ï¸ Ø¹Ù„Øª/ØªÙˆØ¶ÛŒØ­:\n${best.cause}\n\n`;
  if(best.general) out+=`${best.general}\n\n`;
  if(best.solution) out+=`âœ… Ø±Ø§Ù‡Ú©Ø§Ø± Ú©Ù„ÛŒ:\n${best.solution}\n`;
  out+="\nâ„¹ï¸ Ø¨Ø±Ø§ÛŒ ØªØµÙ…ÛŒÙ… Ø¯Ø±Ø¨Ø§Ø±Ù‡ Ø³Ù…ØŒ Ú©ÙˆØ¯ ÛŒØ§ Ø¯Ø±Ù…Ø§Ù†ØŒ Ø¨Ø±Ú†Ø³Ø¨ Ø«Ø¨Øªâ€ŒØ´Ø¯Ù‡ØŒ Ø´Ø±Ø§ÛŒØ· Ù…Ø²Ø±Ø¹Ù‡ Ùˆ Ù†Ø¸Ø± Ú©Ø§Ø±Ø´Ù†Ø§Ø³ Ù…Ø­Ù„ÛŒ Ø±Ø§ Ù‡Ù… Ø¨Ø±Ø±Ø³ÛŒ Ú©Ù†ÛŒØ¯.";
  return out.trim();
}

export default findOfflineAnswer;
export { findOfflineAnswer };
window.YarKeshavarzOffline = { findOfflineAnswer };
    
