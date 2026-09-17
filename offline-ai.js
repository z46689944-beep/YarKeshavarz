import agricultureDB from './agriculture-db.js';

function normalize(s=''){
  return String(s).toLowerCase()
    .replace(/[يى]/g,'ی').replace(/ك/g,'ک')
    .replace(/[ۀة]/g,'ه').replace(/[‌ـ]/g,'')
    .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[^\p{L}\p{N}\s.]/gu,' ')
    .replace(/\s+/g,' ').trim();
}
function tokens(s){return normalize(s).split(' ').filter(x=>x.length>1)}
function num(v){return Number(String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,\s]/g,''))||0}
function money(v){return Math.round(num(v)).toLocaleString('fa-IR')+' تومان'}
function contextText(c){
  const l=c?.land||null;
  if(!l)return '';
  return [l.name,l.region,l.soil,l.water,l.irrigation,l.crop,l.notes].filter(Boolean).join(' ');
}
function scoreItem(item,q,qt){
  let score=0;
  for(const raw of item.keywords||[]){
    const key=normalize(raw); if(!key)continue;
    if(q.includes(key))score += key.includes(' ')?7:3;
    else score += tokens(key).filter(t=>qt.includes(t)).length;
  }
  if(normalize(item.topic)===q)score+=15;
  return score;
}
function bestMatches(q,limit=3){
  const qt=tokens(q);
  return agricultureDB.map(item=>({item,score:scoreItem(item,q,qt)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);
}
function landReport(c){
  const l=c?.land, e=c?.economics||{};
  if(!l)return null;
  const out=[];
  out.push(`🌾 پرونده «${l.name||'این زمین'}» را با اطلاعات ذخیره‌شده بررسی کردم.`);
  if(l.area)out.push(`📐 مساحت: ${num(l.area).toLocaleString('fa-IR')} هکتار.`);
  if(l.region)out.push(`📍 منطقه: ${l.region}.`); else out.push('📍 منطقه هنوز ثبت نشده است.');
  if(l.crop)out.push(`🌱 محصول ثبت‌شده: ${l.crop}.`); else out.push('🌱 محصول ثبت نشده؛ برای پیشنهاد کشت، محصول هدف/فصل را مشخص کن.');
  out.push(l.soil?`🪨 خاک: ${l.soil}.`:'🪨 مشخصات خاک ثبت نشده؛ pH، EC و بافت می‌تواند برای تصمیم‌های دقیق مهم باشد.');
  out.push(l.water?`💧 آب: ${l.water}.`:'💧 منبع/کیفیت آب ثبت نشده است.');
  out.push(l.irrigation?`🚿 آبیاری: ${l.irrigation}.`:'🚿 روش آبیاری ثبت نشده است.');
  out.push(`💰 اقتصاد ثبت‌شده: هزینه ${money(e.cost)}، درآمد ${money(e.income)}، خالص ${money(e.profit)}.`);
  if(Array.isArray(c.inventory)&&c.inventory.length)out.push(`📦 ${c.inventory.length.toLocaleString('fa-IR')} قلم نهاده/موجودی در پرونده انبار هست.`);
  return out.join('\n');
}
function economicsAnswer(c){
  const e=c?.economics||{};
  const cost=num(e.cost),income=num(e.income),profit=income-cost;
  const margin=income?((profit/income)*100):0;
  const lines=[`💰 تحلیل اقتصادی بر اساس اعداد ثبت‌شده:`,`• هزینه: ${money(cost)}`,`• درآمد: ${money(income)}`,`• خالص: ${money(profit)}`];
  if(income)lines.push(`• حاشیه خالص نسبت به درآمد: ${margin.toLocaleString('fa-IR',{maximumFractionDigits:1})}%`);
  if(c?.land?.area)lines.push(`• خالص به ازای هر هکتار: ${money(profit/num(c.land.area))}`);
  lines.push('📌 این محاسبه فقط بر مبنای تراکنش‌های ثبت‌شده است؛ هزینه‌های ثبت‌نشده، استهلاک، اجاره، آب، کارگر یا ارزش محصولِ مصرف‌شده می‌تواند نتیجه واقعی را تغییر دهد.');
  return lines.join('\n');
}
function inventoryAnswer(c){
  const items=Array.isArray(c?.inventory)?c.inventory:[];
  if(!items.length)return '📦 هنوز قلمی در انبار ثبت نشده است. اگر نام، مقدار و واحد هر نهاده را ثبت کنی، می‌توانم کمبودها و اقلام مهم را مرتب کنم.';
  const low=items.filter(x=>num(x.qty)<=0);
  const names=items.slice(0,12).map(x=>`• ${x.name||'بدون نام'}: ${x.qty??0} ${x.unit||''}`.trim());
  return `📦 موجودی ثبت‌شده (${items.length.toLocaleString('fa-IR')} قلم)\n\n${names.join('\n')}${low.length?`\n\n⚠️ اقلام با مقدار صفر/خالی: ${low.map(x=>x.name||'بدون نام').join('، ')}`:''}`;
}
function followup(q,c){
  const l=c?.land;
  const product=l?.crop||'محصول';
  if(/(چه محصول|چی بکار|کشت.*پیشنهاد|پیشنهاد.*کشت|کشت کنم)/.test(q)){
    return `🌱 برای پیشنهاد کشت ${l?`برای «${l.name||'این زمین'}»`:''} چند مورد را لازم دارم:\n1) شهر/منطقه و تاریخ تقریبی کشت\n2) محصول یا محصولات مدنظر\n3) بافت خاک و pH/EC اگر داری\n4) منبع و کیفیت آب و روش آبیاری\n5) دمای تقریبی/شرایط اقلیمی\n\n${l?.crop?`محصول فعلی پرونده: ${product}.`:''}`;
  }
  if(/(زرد|پژمرده|لکه|پیچیده|خشک|سوختگ|ریزش|آفت|بیماری)/.test(q)){
    return `🔎 برای تشخیص دقیق‌تر، ${l?.crop?`در محصول «${product}»، `:''}سن برگ/بخش درگیر، الگوی علائم، زمان شروع، نحوه آبیاری، سم/کود اخیر و منطقه را بگو. اگر عکس واضح از کل گیاه و نمای نزدیک از علامت داری، برای حالت آنلاین هم می‌توانی ارسالش کنی.`;
  }
  return '🌱 برای اینکه پاسخ آفلاین دقیق‌تر و کاربردی‌تر شود، نام محصول، منطقه، مرحله رشد و نشانه یا هدف اصلی را بنویس. اگر سؤال درباره زمین ثبت‌شده است، اطلاعات خاک، آب و آبیاری هم خیلی کمک می‌کند.';
}

function findOfflineAnswer(question, context={}){
  const q=normalize(question);
  if(!q)return '🌱 سؤال کشاورزی را بنویس.';
  if(/^(سلام|درود|صبح بخیر|شب بخیر|خوبی|چطوری)/.test(q))return 'سلام داداش 🌱 در خدمتم. درباره زمین، کشت، خاک، آب، آفت، بیماری، هزینه یا هر موضوع کشاورزی خواستی بپرس.';

  if(/(گزارش|وضعیت.*مزرعه|وضعیت.*زمین|پرونده.*زمین|اطلاعات.*زمین)/.test(q)){
    const r=landReport(context);
    if(r)return r;
  }
  if(/(اقتصاد|هزینه|درآمد|سود|زیان|صرفه|حاشیه)/.test(q) && context?.economics)return economicsAnswer(context);
  if(/(انبار|موجودی|نهاده|کمبود)/.test(q) && context?.inventory)return inventoryAnswer(context);

  const matches=bestMatches(q,4);
  if(!matches.length || matches[0].score<2)return followup(q,context);

  let out='';
  const top=matches[0].item;
  out+=`🌱 ${top.topic}\n\n`;
  if(top.symptoms)out+=`🔎 نشانه‌ها:\n${top.symptoms}\n\n`;
  if(top.cause)out+=`⚠️ علت/توضیح:\n${top.cause}\n\n`;
  if(top.general)out+=`${top.general}\n\n`;
  if(top.solution)out+=`✅ راهکار کلی:\n${top.solution}\n`;
  if(context?.land)out+=`\n📋 ارتباط با پرونده «${context.land.name||'این زمین'}»: ${contextText(context)||'اطلاعات زمینه‌ای کافی ثبت نشده است.'}\n`;
  if(matches.length>1){
    const related=matches.slice(1,3).map(x=>x.item.topic).filter(Boolean);
    if(related.length)out+=`\nموضوعات مرتبط: ${related.join('، ')}\n`;
  }
  out+='\n⚠️ برای دوز سم/کود یا تصمیم درمانی قطعی، محصول و فرمولاسیون، برچسب رسمی، شرایط مزرعه و نظر کارشناس محلی را ملاک قرار بده.';
  return out.trim();
}

export {findOfflineAnswer};
export default findOfflineAnswer;
window.YarKeshavarzOffline={findOfflineAnswer};
