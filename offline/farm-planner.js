// YarKeshavarz Farm Planner V1
// Offline, approximate planning layer. Values are broad planning ranges,
// not current market quotes or agronomic prescriptions.

const CROP_DATA = {
  wheat:{
    name:"گندم",
    seed:[100,170], seedUnit:"کیلوگرم",
    irrigations:[4,8], interval:[12,22],
    yield:[3,6], price:[15000,25000], cost:[25000000,50000000],
    water:"آبیاری عمیق‌تر و با فاصله بیشتر؛ مرحله استقرار، پنجه‌زنی، خوشه‌دهی/گلدهی و پرشدن دانه حساس‌ترند."
  },
  barley:{
    name:"جو",
    seed:[100,170], seedUnit:"کیلوگرم",
    irrigations:[3,6], interval:[14,24],
    yield:[2.5,5], price:[12000,20000], cost:[22000000,45000000],
    water:"تعداد نوبت معمولاً از سیب‌زمینی و ذرت کمتر است؛ مرحله استقرار و تشکیل دانه اهمیت بیشتری دارد."
  },
  potato:{
    name:"سیب‌زمینی",
    seed:[1800,3000], seedUnit:"کیلوگرم غده بذری",
    irrigations:[10,18], interval:[4,8],
    yield:[20,40], price:[10000,25000], cost:[180000000,500000000],
    water:"رطوبت یکنواخت لازم است؛ آبیاری‌های سبک‌تر و منظم‌تر از تنش و ترک/بدشکلی غده جلوگیری می‌کنند."
  },
  corn:{
    name:"ذرت",
    seed:[22,25], seedUnit:"کیلوگرم",
    irrigations:[8,14], interval:[5,10],
    yield:[6,10], price:[10000,20000], cost:[45000000,110000000],
    water:"در رشد سریع، گلدهی و پرشدن دانه حساس است؛ تنش آبی در این مراحل می‌تواند عملکرد را کاهش دهد."
  }
};

function norm(s=""){
  return String(s).toLowerCase().replace(/[يى]/g,"ی").replace(/ك/g,"ک")
    .replace(/\u200c/g," ").replace(/[^\p{L}\p{N}\s]/gu," ")
    .replace(/\s+/g," ").trim();
}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function fa(v,d=0){return num(v).toLocaleString("fa-IR",{maximumFractionDigits:d})}
function money(v){return `${fa(v)} تومان`}
function cropKey(crop=""){
  const q=norm(crop);
  if(q.includes("گندم"))return "wheat";
  if(q.includes("جو"))return "barley";
  if(q.includes("سیب زمینی"))return "potato";
  if(q.includes("ذرت"))return "corn";
  return null;
}
function landOf(context={}){
  return context?.land||context?.l||{};
}
function soilFactor(soil=""){
  const q=norm(soil);
  if(/شنی|ماسه/.test(q))return 1.25;
  if(/رسی|سنگین/.test(q))return .82;
  return 1;
}
function irrigationFactor(method=""){
  const q=norm(method);
  if(/قطره|تیپ/.test(q))return {count:1.15,interval:.82};
  if(/بارانی/.test(q))return {count:1.05,interval:.9};
  if(/غرقابی|جوی|نشتی/.test(q))return {count:.92,interval:1.08};
  return {count:1,interval:1};
}
function cropData(context={}){
  const l=landOf(context);
  const crop=context?.cultivation?.crop||l.crop||context.crop||"";
  const key=cropKey(crop);
  return key?{key,crop:crop||CROP_DATA[key].name,data:CROP_DATA[key]}:null;
}
function irrigationPlan(context={}){
  const x=cropData(context); if(!x)return null;
  const l=landOf(context), sf=soilFactor(l.soil), mf=irrigationFactor(l.irrigation);
  let lo=Math.max(1,Math.round(x.data.irrigations[0]*sf*mf.count));
  let hi=Math.max(lo,Math.round(x.data.irrigations[1]*sf*mf.count));
  let il=Math.max(2,Math.round(x.data.interval[0]*mf.interval/sf));
  let ih=Math.max(il,Math.round(x.data.interval[1]*mf.interval/sf));
  return {
    count:[lo,hi], interval:[il,ih],
    note:x.data.water,
    caveat:"تعداد نوبت تقریبی است؛ بارش، بافت خاک، عمق ریشه، دبی آب و روش آبیاری می‌تواند آن را کم‌وزیاد کند."
  };
}
function seedPlan(context={}){
  const x=cropData(context); if(!x)return null;
  const area=num(landOf(context).area);
  if(area<=0)return null;
  return {
    crop:x.data.name, area,
    range:[x.data.seed[0]*area,x.data.seed[1]*area],
    unit:x.data.seedUnit,
    perHa:x.data.seed
  };
}
function economyPlan(context={}){
  const x=cropData(context); if(!x)return null;
  const l=landOf(context), area=num(l.area);
  if(area<=0)return null;
  const actual=context?.economics||context?.t||null;
  const actualCost=num(actual?.cost), actualIncome=num(actual?.income);
  if(actualCost>0||actualIncome>0){
    return {
      actual:true,cost:actualCost,income:actualIncome,
      profit:actualIncome-actualCost
    };
  }
  const d=x.data;
  const cost=[d.cost[0]*area,d.cost[1]*area];
  const revenue=[d.yield[0]*1000*d.price[0]*area,d.yield[1]*1000*d.price[1]*area];
  return {
    actual:false,cost,income:revenue,
    profit:[revenue[0]-cost[1],revenue[1]-cost[0]],
    assumptions:{
      yield:d.yield,price:d.price
    }
  };
}
function plantingPlan(context={}){
  const l=landOf(context), crop=context?.cultivation?.crop||l.crop||"";
  const q=norm(crop), region=l.region||"";
  const windows={
    wheat:{cold:"مهر ۱ تا مهر ۳۰",temperate:"مهر ۱ تا آبان ۱۵",warm:"آبان ۱ تا آذر ۱۵",humid:"آبان ۱ تا آذر ۱۵"},
    barley:{cold:"مهر ۱ تا مهر ۳۰",temperate:"مهر ۱ تا آبان ۱۵",warm:"آبان ۱ تا آذر ۱۵",humid:"آبان ۱ تا آذر ۱۵"},
    potato:{cold:"فروردین ۱ تا فروردین ۳۱",temperate:"اسفند ۱۵ تا فروردین ۳۱",warm:"بهمن ۱۵ تا اسفند ۲۹",humid:"مهر ۱ تا مهر ۳۰"},
    corn:{cold:"اردیبهشت ۱۵ تا خرداد ۱۵",temperate:"اردیبهشت ۱۵ تا خرداد ۱۵",warm:"بهمن ۱۵ تا اسفند ۱۵ / مرداد ۱۵ تا شهریور ۱۵",humid:"اردیبهشت ۱۵ تا خرداد ۱۵"}
  };
  let key=cropKey(q); if(!key)return null;
  const r=norm(region);
  let zone=r.includes("سرد")||r.includes("کوهستان")||/آذربایجان|اردبیل|همدان|کردستان|کرمانشاه|زنجان|قزوین|البرز/.test(r)?"cold":
    r.includes("گرم")||/خوزستان|بوشهر|هرمزگان|میناب|جنوب کرمان|سیستان|بلوچستان|جنوب/.test(r)?"warm":
    /مازندران|گیلان|رشت|ساری|شمال|مرطوب/.test(r)?"humid":"temperate";
  return {crop:CROP_DATA[key].name,zone,window:windows[key][zone],note:"این بازه تقریبی منطقه‌ای است؛ رقم، ارتفاع، دمای خاک و وضعیت سال می‌تواند تاریخ واقعی را جابه‌جا کند."};
}
export function buildFarmPlan(context={}){
  const x=cropData(context); if(!x)return {ok:false,message:"برای برنامه عددی، محصول و مساحت زمین را ثبت کن."};
  const l=landOf(context), area=num(l.area);
  if(area<=0)return {ok:false,message:"مساحت زمین ثبت نشده؛ مقدار بذر، هزینه و درآمد بدون مساحت قابل محاسبه نیست."};
  const seed=seedPlan(context), irr=irrigationPlan(context), eco=economyPlan(context), plant=plantingPlan(context);
  return {ok:true,crop:x.data.name,area,seed,irrigation:irr,economics:eco,planting:plant,region:l.region||"",soil:l.soil||"",water:l.water||"",method:l.irrigation||""};
}
export function farmPlanText(context={}){
  const p=buildFarmPlan(context);
  if(!p.ok)return "🌱 "+p.message;
  const L=landOf(context), lines=[
    `📐 زمین: ${L.name||"زمین انتخاب‌شده"} — ${fa(p.area,2)} هکتار`,
    `🌱 محصول: ${p.crop}`
  ];
  if(p.planting)lines.push(`📅 تاریخ کاشت تقریبی: ${p.planting.window} — منطقه ${p.region||p.planting.zone}.`);
  if(p.seed)lines.push(`🌾 بذر موردنیاز تقریبی: ${fa(p.seed.range[0],0)} تا ${fa(p.seed.range[1],0)} ${p.seed.unit} برای کل زمین. (نرخ پایه: ${fa(p.seed.perHa[0])} تا ${fa(p.seed.perHa[1])} ${p.seed.unit} در هکتار)`);
  if(p.irrigation)lines.push(`💧 آبیاری تقریبی: ${fa(p.irrigation.count[0])} تا ${fa(p.irrigation.count[1])} نوبت در فصل، با فاصله حدود ${fa(p.irrigation.interval[0])} تا ${fa(p.irrigation.interval[1])} روز؛ ${p.irrigation.note}`);
  if(p.economics?.actual){
    lines.push(`💰 اقتصاد ثبت‌شده همین زمین: هزینه ${money(p.economics.cost)} | درآمد ${money(p.economics.income)} | سود/زیان ${money(p.economics.profit)}.`);
  }else if(p.economics){
    lines.push(`💰 خرج تقریبی کل زمین: ${money(p.economics.cost[0])} تا ${money(p.economics.cost[1])}.`);
    lines.push(`📈 درآمد ناخالص تقریبی: ${money(p.economics.income[0])} تا ${money(p.economics.income[1])}.`);
    lines.push(`📊 سود/زیان تقریبی قبل از اختلاف قیمت و هزینه‌های محلی: ${money(p.economics.profit[0])} تا ${money(p.economics.profit[1])}.`);
    lines.push(`ℹ️ فرض محاسبه: عملکرد حدود ${p.economics.assumptions.yield[0]} تا ${p.economics.assumptions.yield[1]} تن/هکتار و قیمت پایه ${fa(p.economics.assumptions.price[0])} تا ${fa(p.economics.assumptions.price[1])} تومان/کیلو؛ این اعداد قیمت روز بازار نیستند و برای برآورد اولیه‌اند.`);
  }
  if(L.soil)lines.push(`🪨 خاک ثبت‌شده: ${L.soil}.`);
  if(L.water)lines.push(`💧 منبع آب: ${L.water}${L.irrigation?` | روش آبیاری: ${L.irrigation}`:""}.`);
  lines.push("⚠️ اعداد بذر، آب، هزینه و درآمد تقریبی‌اند و باید با رقم، آزمون خاک/آب، بارش، قیمت محلی و روش کشت تنظیم شوند.");
  return lines.join("\n");
}
export default {buildFarmPlan,farmPlanText};
