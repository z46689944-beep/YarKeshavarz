// YarKeshavarz Farm Planner V2 - product-independent numeric planning layer.
import cropProfiles, {findCropProfile} from './crop-profiles.js';
const PLACEHOLDERS=new Set(['','هیچی','هیچ','ندارد','ثبت نشده','ثبت نشده است','نامشخص','نامعلوم','none','no crop','unknown','null','undefined']);
function norm(v=''){return String(v??'').toLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/‌/g,' ').replace(/\s+/g,' ').trim()}
export function normalizeCropName(value=''){
  const n=norm(value); if(PLACEHOLDERS.has(n))return '';
  const hit=findCropProfile(value); if(hit){const canonical=Object.keys(cropProfiles).find(k=>cropProfiles[k]===hit);if(canonical)return canonical;}
  return Object.keys(cropProfiles).find(k=>norm(k)===n)||String(value).trim();
}
function cropKey(value=''){
  const name=normalizeCropName(value); if(!name)return '';
  const aliases={'wheat':'گندم','barley':'جو','corn':'ذرت','maize':'ذرت','potato':'سیب زمینی','سیب‌زمینی':'سیب زمینی'};
  return aliases[norm(name)]||name;
}
function profileFor(crop){const key=cropKey(crop);const qualitative=findCropProfile(crop)||null;return {key,numeric:qualitative?.numeric||null,qualitative}}
function areaHa(land){return Math.max(0,Number(land?.area)||0)}
function rangeMul(r,a){return [r[0]*a,r[1]*a]}
function fmt(x){return Number(x||0).toLocaleString('fa-IR',{maximumFractionDigits:2})}
function money(x){return Math.round(x||0).toLocaleString('fa-IR')+' تومان'}
function zoneOf(region='',lat=null){
  const r=norm(region);
  if(/مازندران|گیلان|رشت|ساری|شمال|مرطوب/.test(r))return 'humid';
  if(/سرد|کوهستان|آذربایجان|اردبیل|همدان|کردستان|کرمانشاه|چهارمحال|زنجان|قزوین|البرز|دماوند|خراسان شمالی/.test(r))return 'cold';
  if(/گرمسیر|گرم|خوزستان|بوشهر|هرمزگان|میناب|جنوب کرمان|سیستان|بلوچستان|جنوب/.test(r))return 'warm';
  if(Number(lat)>=36)return 'cold';
  if(Number(lat)<=29.5)return 'warm';
  return 'temperate';
}
const PERSIAN_MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
function harvestDates(windowRange,duration){
  if(!windowRange)return null;
  const start=PERSIAN_MONTHS.indexOf(windowRange[0])+1;
  if(!start)return null;
  const add=(start+(Number(duration?.[1])||4)-1);
  return {from:PERSIAN_MONTHS[(add-1)%12],to:PERSIAN_MONTHS[(add+1)%12]};
}
function cropFromContext(context){return normalizeCropName(context?.cultivation?.crop||context?.land?.crop||context?.l?.crop||context?.crop||'')}
export function inventoryRelevance(crop,inventory=[]){
  const c=norm(normalizeCropName(crop));if(!c)return [];
  const words=c.split(' ').filter(Boolean);
  return (Array.isArray(inventory)?inventory:[]).filter(item=>{const name=norm(item?.name||'');const cat=norm(item?.category||'');if(words.some(w=>w.length>1&&name.includes(w)))return true;if(/بذر|seed/.test(cat)&&(name.includes(c)||c.includes(name)))return true;if(/کود|fertil/.test(cat))return true;return false}).slice(0,12);
}
export function buildFarmPlan(context={}){
  const land=context.land||context.l||null,crop=cropFromContext(context),area=areaHa(land);
  if(!land)return {ok:false,status:'no_land',message:'برای برنامه عددی، ابتدا یک پرونده زمین انتخاب کن.'};
  if(!crop)return {ok:false,status:'missing_crop',crop:'',area,message:'محصول این زمین ثبت نشده است؛ بنابراین عددی برای بذر، آبیاری، هزینه یا درآمد به محصولی که وجود ندارد نسبت نمی‌دهم.'};
  const p=profileFor(crop);
  if(!p.numeric)return {ok:false,status:'profile_missing',crop,area,qualitative:p.qualitative,message:`برای «${crop}» شناسنامه کیفی موجود است، اما پروفایل عددی محلی/معتبر در موتور فعلی ثبت نشده؛ عدد ساختگی ارائه نمی‌کنم.`};
  const n=p.numeric,zone=zoneOf(land.region,land.lat),seed=rangeMul(n.seed,area),irrig=[n.irrigations[0],n.irrigations[1]],y=rangeMul(n.yield,area),revenue=[y[0]*1000*n.price[0],y[1]*1000*n.price[1]],cost=rangeMul(n.cost,area),profit=[revenue[0]-cost[1],revenue[1]-cost[0]],win=n.window?.[zone]||n.window?.temperate||null;
  return {ok:true,status:'ready',crop,area,zone,seed,seedUnit:n.seedUnit,irrigations:irrig,interval:n.interval,yield:y,yieldUnit:n.yieldUnit,price:n.price,cost,revenue,profit,plantingWindow:win,harvestDates:harvestDates(win,n.durationMonths),estimated:!!n.estimated,estimateScope:n.estimateScope||''};
}
export function farmPlanText(context={}){
  const r=buildFarmPlan(context);
  if(!r.ok){if(r.status==='missing_crop')return `🌱 محصول این زمین ثبت نشده است.\n• مساحت: ${fmt(r.area)} هکتار\n• هیچ مقدار بذر/آبیاری/هزینه/درآمد بدون محصول محاسبه نمی‌کنم.`;if(r.status==='profile_missing')return `🌱 ${r.message}\n• مساحت: ${fmt(r.area)} هکتار`;return `🌱 ${r.message}`;}
  const inv=inventoryRelevance(r.crop,context.inventory||context.stock||[]);
  let out=`📊 برنامه عددی مزرعه «${r.crop}»\n• مساحت: ${fmt(r.area)} هکتار\n• بازه تقریبی کاشت: ${r.plantingWindow?r.plantingWindow.join(' تا '):'نیازمند تقویم محلی'}\n• بذر/واحد تکثیر موردنیاز کل: ${fmt(r.seed[0])} تا ${fmt(r.seed[1])} ${r.seedUnit}\n• تعداد تقریبی نوبت آبیاری: ${fmt(r.irrigations[0])} تا ${fmt(r.irrigations[1])} نوبت\n• فاصله تقریبی آبیاری: هر ${fmt(r.interval[0])} تا ${fmt(r.interval[1])} روز؛ با توجه به بارش، بافت خاک و مرحله رشد اصلاح شود.\n• عملکرد تقریبی کل: ${fmt(r.yield[0])} تا ${fmt(r.yield[1])} ${r.yieldUnit}\n• هزینه تقریبی کل: ${money(r.cost[0])} تا ${money(r.cost[1])}\n• درآمد تقریبی کل: ${money(r.revenue[0])} تا ${money(r.revenue[1])}\n• سود/زیان تقریبی قبل از هزینه‌های خارج از این برآورد: ${money(r.profit[0])} تا ${money(r.profit[1])}\n`;
  if(r.estimated)out+=`\n🟡 این محصول پروفایل اختصاصی عددی نداشت؛ اعداد بالا از بازه عمومی گروه «محصولات مشابه» به‌صورت تقریبی تولید شده‌اند و برای رقم، منطقه، روش کشت و بازار محلی باید اصلاح شوند.\n`;
  if(inv.length)out+='\n📦 اقلام مرتبط از موجودی ثبت‌شده:\n'+inv.map(x=>`• ${x.name||'قلم'}: ${fmt(x.qty)} ${x.unit||''}`).join('\n')+'\n';
  out+='\n⚠️ این اعداد «برآورد برنامه‌ریزی» هستند، نه نسخه قطعی اقتصادی یا زراعی؛ قیمت، رقم، عملکرد، آب و هزینه‌های واقعی منطقه می‌توانند نتیجه را تغییر دهند.';
  return out;
}
export default buildFarmPlan;
