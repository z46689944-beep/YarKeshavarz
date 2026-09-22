// YarKeshavarz Regional Crop Calendar V1
// Offline, conservative regional recommendation layer.
// Dates are Persian-calendar month/day windows and should be refined with
// local extension recommendations, cultivar, elevation, irrigation and weather.

const MONTHS={
  فروردین:1,اردیبهشت:2,خرداد:3,تیر:4,مرداد:5,شهریور:6,
  مهر:7,آبان:8,آذر:9,دی:10,بهمن:11,اسفند:12
};

const ZONES={
  cold:{label:'سردسیر',keys:['سردسیر','سرد','کوهستان','آذربایجان','اردبیل','همدان','کردستان','کرمانشاه','چهارمحال','زنجان','قزوین','البرز','دماوند','شمال خراسان','خراسان شمالی']},
  temperate:{label:'معتدل',keys:['معتدل','مرکز','تهران','اصفهان','فارس','شیراز','لرستان','مرکزی','گلستان','سمنان']},
  warm:{label:'گرمسیر',keys:['گرمسیر','گرم','خوزستان','بوشهر','هرمزگان','میناب','جنوب کرمان','سیستان','بلوچستان','جنوب']},
  humid:{label:'شمال مرطوب',keys:['مازندران','گیلان','رشت','ساری','شمال','مرطوب','گلستان']}
};

// Windows are intentionally broad. They are not a substitute for the
// local annual agricultural bulletin or cultivar-specific recommendation.
const CALENDAR={
  wheat:{
    name:'گندم',
    windows:{cold:[['مهر',1,'مهر',30]],temperate:[['مهر',1,'آبان',15]],warm:[['آبان',1,'آذر',15]],humid:[['آبان',1,'آذر',15]]},
    seedKgHa:[100,170],
    details:{soil:'خاک با ساختمان مناسب و زهکشی قابل قبول؛ آزمون خاک مبنا باشد.',water:'استقرار اولیه و مراحل حساس رشد به تأمین رطوبت کافی نیاز دارند.',irrigation:'برنامه آبیاری را با بافت خاک، بارش و مرحله رشد تنظیم کن.',nutrition:'آزمون خاک و نیاز رقم را مبنا قرار بده؛ نسخه ثابت کود نده.',care:'پایش علف‌های هرز، بیماری‌های برگی و وضعیت سبزشدن.',harvest:'زمان برداشت را با رسیدگی دانه و شرایط رطوبتی تعیین کن.'}
  },
  barley:{
    name:'جو',
    windows:{cold:[['مهر',1,'مهر',30]],temperate:[['مهر',1,'آبان',15]],warm:[['آبان',1,'آذر',15]],humid:[['آبان',1,'آذر',15]]},
    seedKgHa:[100,170],
    details:{soil:'خاک دارای زهکشی مناسب؛ تحمل شوری به رقم وابسته است.',water:'تنش شدید در استقرار و مراحل تولید می‌تواند عملکرد را کاهش دهد.',irrigation:'بر اساس بارش، بافت خاک و مرحله رشد تنظیم شود.',nutrition:'آزمون خاک و رقم را مبنا قرار بده.',care:'پایش علف هرز، بیماری و تراکم سبزشدن.',harvest:'برداشت در رسیدگی مناسب و با کنترل رطوبت دانه انجام شود.'}
  },
  potato:{
    name:'سیب‌زمینی',
    windows:{cold:[['فروردین',1,'فروردین',31]],temperate:[['اسفند',15,'فروردین',31]],warm:[['بهمن',15,'اسفند',29]],humid:[['مهر',1,'مهر',30]]},
    details:{soil:'خاک عمیق، نرم، حاصلخیز و زهکش‌دار مناسب‌تر است؛ شوری بالا نامطلوب است.',water:'رطوبت یکنواخت خاک برای رشد غده مهم است.',irrigation:'از نوسان شدید رطوبت و ماندابی شدن جلوگیری کن.',nutrition:'برنامه تغذیه بر اساس آزمون خاک و نیاز رقم تنظیم شود.',care:'پایش بیماری‌های برگی، آفات و سلامت غده بذری.',harvest:'برداشت با رسیدگی مناسب پوست غده و شرایط بازار هماهنگ شود.'}
  },
  corn:{
    name:'ذرت',
    windows:{cold:[['اردیبهشت',15,'خرداد',15]],temperate:[['اردیبهشت',15,'خرداد',15]],warm:[['بهمن',15,'اسفند',15],['مرداد',15,'شهریور',15]],humid:[['اردیبهشت',15,'خرداد',15]]},
    seedKgHa:[22,25],
    details:{soil:'خاک حاصلخیز با زهکشی مناسب و توان نگهداری آب کافی.',water:'ذرت در رشد رویشی سریع و مراحل زایشی به آب کافی نیاز دارد.',irrigation:'تنش آبی در مراحل حساس را جدی بگیر.',nutrition:'ازت و سایر عناصر را بر اساس آزمون خاک و هدف عملکرد مدیریت کن.',care:'پایش علف هرز و آفات برگ و ساقه.',harvest:'زمان برداشت را با هدف دانه‌ای یا علوفه‌ای هماهنگ کن.'}
  }
};

function norm(s=''){return String(s).toLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\u200c/g,' ').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();}
function detectZone(region=''){
  const q=norm(region);
  for(const [id,z] of Object.entries(ZONES)) if(z.keys.some(k=>q.includes(norm(k)))) return {id,...z};
  return null;
}
function detectCrop(crop=''){
  const q=norm(crop);
  if(q.includes('گندم')) return 'wheat';
  if(q.includes('جو')) return 'barley';
  if(q.includes('سیب زمینی')) return 'potato';
  if(q.includes('ذرت')) return 'corn';
  return null;
}
function jNow(){
  try{
    const parts=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'numeric',day:'numeric'}).formatToParts(new Date());
    return {month:Number(parts.find(x=>x.type==='month')?.value||0),day:Number(parts.find(x=>x.type==='day')?.value||0)};
  }catch{return {month:0,day:0};}
}
function ordinal(month,day){return month*31+day;}
function parseWindow(w){return [ordinal(MONTHS[w[0]],w[1]),ordinal(MONTHS[w[2]],w[3])];}
function statusFor(windows,now){
  const n=ordinal(now.month,now.day);
  for(const w of windows){const [a,b]=parseWindow(w);if(n>=a&&n<=b)return {state:'now',label:'در بازه پیشنهادی'};}
  const upcoming=windows.map(w=>({w,n:parseWindow(w)[0]})).filter(x=>x.n>n).sort((a,b)=>a.n-b.n)[0];
  if(upcoming)return {state:'upcoming',label:'بازه پیشنهادی هنوز نرسیده'};
  return {state:'passed',label:'بازه اصلی پیشنهادی گذشته است'};
}
function windowText(w){return `${w[0]} ${w[1]} تا ${w[2]} ${w[3]}`;}

export function regionalCropAdvice(context={}){
  const land=context?.l||context?.land||context||{};
  const crop=detectCrop(land.crop||context.crop||'');
  const zone=detectZone(land.region||'');
  if(!zone) return {ok:false,reason:'region',message:'📍 برای پیشنهاد تاریخ کاشت منطقه‌ای، ابتدا «روستا / شهر / منطقه» زمین را در پرونده زمین ثبت کن.'};
  if(!crop) return {ok:false,reason:'crop',message:'🌱 برای تعیین تاریخ کاشت، محصول فعلی زمین را هم در پرونده کشت ثبت کن. فعلاً می‌توانم برای گندم، جو، سیب‌زمینی و ذرت تقویم منطقه‌ای ارائه کنم.'};
  const data=CALENDAR[crop], windows=data.windows[zone.id]||[];
  if(!windows.length)return {ok:false,reason:'calendar'};
  const now=jNow(), status=statusFor(windows,now), area=Number(land.area)||0;
  const seed=data.seedKgHa&&area>0?`${(data.seedKgHa[0]*area).toLocaleString('fa-IR')} تا ${(data.seedKgHa[1]*area).toLocaleString('fa-IR')} کیلوگرم برای ${area.toLocaleString('fa-IR')} هکتار (بازه عمومی؛ رقم و روش کشت تعیین‌کننده است).`:'';
  const list=windows.map(windowText).join(' یا ');
  return {ok:true,crop,zone:zone.label,now,status,windows,windowText:list,seed,details:data.details,land:{name:land.name||'',area:land.area||'',soil:land.soil||'',water:land.water||'',irrigation:land.irrigation||'',region:land.region||''}};
}

export function buildRegionalAdvice(context={}){
  const r=regionalCropAdvice(context);
  if(!r.ok)return r.message||'🌱 اطلاعات منطقه‌ای زمین کامل نیست.';
  const L=r.land;
  const lines=[
    `📍 منطقه: ${L.region||r.zone}`,
    `🌱 محصول: ${r.crop==='wheat'?'گندم':r.crop==='barley'?'جو':r.crop==='potato'?'سیب‌زمینی':'ذرت'}`,
    `📅 بازه پیشنهادی کاشت: ${r.windowText}`,
    `🟢 وضعیت امروز: ${r.status.label}`,
    `🌤️ تقویم فعلی بر پایه منطقه «${r.zone}» است و باید با رقم، ارتفاع، وضعیت خاک و شرایط سال تطبیق داده شود.`,
    '',
    `🪨 خاک: ${L.soil||r.details.soil}`,
    `💧 آب: ${L.water||'ثبت نشده'} | 🚿 آبیاری: ${L.irrigation||r.details.irrigation}`,
    `🌿 مدیریت خاک: ${r.details.soil}`,
    `🧪 تغذیه: ${r.details.nutrition}`,
    `🌿 داشت: ${r.details.care}`,
    `🧺 برداشت: ${r.details.harvest}`
  ];
  if(r.seed)lines.push(`🌾 بذر تقریبی: ${r.seed}`);
  if(r.status.state==='now')lines.splice(4,0,'✅ بر اساس تقویم پایه، اکنون داخل بازه پیشنهادی هستی؛ قبل از کاشت رطوبت خاک و خطر سرما/گرمای غیرعادی را بررسی کن.');
  if(r.status.state==='upcoming')lines.splice(4,0,'⏳ هنوز وارد بازه اصلی پیشنهادی نشده‌ای؛ آماده‌سازی زمین و نهاده‌ها را می‌توانی از الان انجام بدهی.');
  if(r.status.state==='passed')lines.splice(4,0,'⚠️ بازه اصلی پیشنهادی گذشته است؛ بدون بررسی شرایط سال و رقم، کاشت خارج از بازه را توصیه نمی‌کنم.');
  return lines.join('\n');
}

export {detectZone,detectCrop,CALENDAR};
export default {regionalCropAdvice,buildRegionalAdvice};
