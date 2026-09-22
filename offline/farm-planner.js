// YarKeshavarz Farm Planner V1 - product-independent numeric planning layer.
// Numeric values are profile data, not crop-specific code. Unknown crops never
// receive fabricated numbers; they fall back to the qualitative crop profile.
import cropProfiles, {findCropProfile} from './crop-profiles.js';

const PLACEHOLDERS = new Set(['','هیچی','هیچ','ندارد','ثبت نشده','ثبت نشده است','نامشخص','نامعلوم','none','no crop','unknown','null','undefined']);

function norm(v=''){
  return String(v??'').toLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/‌/g,' ').replace(/\s+/g,' ').trim();
}

export function normalizeCropName(value=''){
  const n=norm(value);
  if(PLACEHOLDERS.has(n)) return '';
  const hit=findCropProfile(value);
  if(hit){
    const canonical=Object.keys(cropProfiles).find(k=>cropProfiles[k]===hit);
    if(canonical) return canonical;
  }
  return Object.keys(cropProfiles).find(k=>norm(k)===n) || String(value).trim();
}

function cropKey(value=''){
  const name=normalizeCropName(value);
  if(!name) return '';
  const aliases={
    'wheat':'گندم','barley':'جو','corn':'ذرت','maize':'ذرت','potato':'سیب زمینی','سیب‌زمینی':'سیب زمینی'
  };
  return aliases[norm(name)] || name;
}

// Numeric planning data lives inside each crop profile.
// The planner algorithm below is product-independent: adding a crop means
// adding/updating its profile data, not adding another crop-specific branch.

function profileFor(crop){
  const key=cropKey(crop);
  const qualitative=findCropProfile(crop)||null;
  const p=qualitative?.numeric||null;
  return {key, numeric:p, qualitative};
}

function areaHa(land){return Math.max(0,Number(land?.area)||0)}
function rangeMul(r,a){return [r[0]*a,r[1]*a]}
function fmt(x){return Number(x||0).toLocaleString('fa-IR',{maximumFractionDigits:2})}
function money(x){return Math.round(x||0).toLocaleString('fa-IR')+' تومان'}
function zoneOf(region=''){
  const r=norm(region);
  if(/سرد|کوهستان|آذربایجان|اردبیل|همدان|کردستان|کرمانشاه|چهارمحال|زنجان|قزوین|البرز|دماوند|خراسان شمالی/.test(r))return 'cold';
  if(/گرمسیر|گرم|خوزستان|بوشهر|هرمزگان|میناب|جنوب کرمان|سیستان|بلوچستان|جنوب/.test(r))return 'warm';
  if(/مازندران|گیلان|رشت|ساری|شمال|مرطوب/.test(r))return 'humid';
  return 'temperate';
}

function cropFromContext(context){
  return normalizeCropName(context?.cultivation?.crop || context?.land?.crop || context?.l?.crop || context?.crop || '');
}

export function inventoryRelevance(crop,inventory=[]){
  const c=norm(normalizeCropName(crop));
  if(!c) return [];
  const words=c.split(' ').filter(Boolean);
  return (Array.isArray(inventory)?inventory:[]).filter(item=>{
    const name=norm(item?.name||'');
    const cat=norm(item?.category||'');
    if(words.some(w=>w.length>1 && name.includes(w))) return true;
    if(/بذر|seed/.test(cat) && (name.includes(c)||c.includes(name))) return true;
    if(/کود|fertil/.test(cat)) return true; // fertilizer is relevant only when a crop exists
    return false;
  }).slice(0,12);
}

export function buildFarmPlan(context={}){
  const land=context.land||context.l||null;
  const crop=cropFromContext(context);
  const area=areaHa(land);
  if(!land) return {ok:false,status:'no_land',message:'برای برنامه عددی، ابتدا یک پرونده زمین انتخاب کن.'};
  if(!crop) return {ok:false,status:'missing_crop',crop:'',area,message:'محصول این زمین ثبت نشده است؛ بنابراین عددی برای بذر، آبیاری، هزینه یا درآمد به محصولی که وجود ندارد نسبت نمی‌دهم.'};
  const p=profileFor(crop);
  if(!p.numeric) return {ok:false,status:'profile_missing',crop,area,qualitative:p.qualitative,message:`برای «${crop}» شناسنامه کیفی موجود است، اما پروفایل عددی محلی/معتبر در موتور فعلی ثبت نشده؛ عدد ساختگی ارائه نمی‌کنم. ساختار موتور آماده افزودن پروفایل این محصول است.`};
  const n=p.numeric;
  const zone=zoneOf(land.region);
  const seed=rangeMul(n.seed,area);
  const irrig=[n.irrigations[0],n.irrigations[1]];
  const y=rangeMul(n.yield,area);
  const revenue=[y[0]*1000*n.price[0],y[1]*1000*n.price[1]];
  const cost=rangeMul(n.cost,area);
  const profit=[revenue[0]-cost[1],revenue[1]-cost[0]];
  const win=n.window?.[zone]||n.window?.temperate||null;
  return {ok:true,status:'ready',crop,area,zone,seed,seedUnit:n.seedUnit,irrigations:irrig,interval:n.interval,yield:y,yieldUnit:n.yieldUnit,price:n.price,cost,revenue,profit,plantingWindow:win};
}

export function farmPlanText(context={}){
  const r=buildFarmPlan(context);
  if(!r.ok){
    if(r.status==='missing_crop') return `🌱 محصول این زمین ثبت نشده است.\n• مساحت: ${fmt(r.area)} هکتار\n• هیچ مقدار بذر/آبیاری/هزینه/درآمدی بدون محصول محاسبه نمی‌کنم.`;
    if(r.status==='profile_missing') return `🌱 ${r.message}\n• مساحت: ${fmt(r.area)} هکتار`;
    return `🌱 ${r.message}`;
  }
  const inv=inventoryRelevance(r.crop,context.inventory||context.stock||[]);
  let out=`📊 برنامه عددی مزرعه «${r.crop}»\n`;
  out+=`• مساحت: ${fmt(r.area)} هکتار\n`;
  out+=`• بازه تقریبی کاشت: ${r.plantingWindow?r.plantingWindow.join(' تا '):'نیازمند تقویم محلی'}\n`;
  out+=`• بذر موردنیاز کل: ${fmt(r.seed[0])} تا ${fmt(r.seed[1])} ${r.seedUnit}\n`;
  out+=`• تعداد تقریبی نوبت آبیاری: ${fmt(r.irrigations[0])} تا ${fmt(r.irrigations[1])} نوبت\n`;
  out+=`• فاصله تقریبی آبیاری: هر ${fmt(r.interval[0])} تا ${fmt(r.interval[1])} روز؛ با توجه به بارش، بافت خاک و مرحله رشد اصلاح شود.\n`;
  out+=`• عملکرد تقریبی کل: ${fmt(r.yield[0])} تا ${fmt(r.yield[1])} ${r.yieldUnit}\n`;
  out+=`• هزینه تقریبی کل: ${money(r.cost[0])} تا ${money(r.cost[1])}\n`;
  out+=`• درآمد تقریبی کل: ${money(r.revenue[0])} تا ${money(r.revenue[1])}\n`;
  out+=`• سود/زیان تقریبی قبل از هزینه‌های خارج از این برآورد: ${money(r.profit[0])} تا ${money(r.profit[1])}\n`;
  if(inv.length){
    out+='\n📦 اقلام مرتبط از موجودی ثبت‌شده:\n'+inv.map(x=>`• ${x.name||'قلم'}: ${fmt(x.qty)} ${x.unit||''}`).join('\n')+'\n';
  }
  out+='\n⚠️ این اعداد «برآورد برنامه‌ریزی» هستند، نه نسخه قطعی اقتصادی یا زراعی؛ قیمت، رقم، عملکرد، آب و هزینه‌های واقعی منطقه می‌توانند نتیجه را تغییر دهند.';
  return out;
}

export default buildFarmPlan;
