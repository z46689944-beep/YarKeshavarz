// YarKeshavarz Universal Crop Engine V5
// Universal qualitative profiles plus broad numeric planning defaults.
// Specialized crop profiles override numeric defaults when they provide their own data.
import registry, {normalize} from "./global-crop-registry.js";

const groupTemplates = {
  cereals:{climate:"اقلیم خنک تا معتدل یا گرم، بسته به گونه و رقم.",soil:"خاک حاصلخیز با ساختمان مناسب و زهکشی قابل قبول.",irrigation:"نیاز آبی از استقرار تا پرشدن دانه/اندام اقتصادی تغییر می‌کند.",pests:["شته‌ها","تریپس‌ها","آفات اختصاصی هر غله"],diseases:["بیماری‌های برگی","زنگ‌ها","پوسیدگی‌های ریشه و طوقه"]},
  pulses:{climate:"اقلیم معتدل تا گرم؛ حساسیت به گرما و سرما به گونه وابسته است.",soil:"خاک با زهکشی خوب؛ ماندابی شدن برای بسیاری از حبوبات نامطلوب است.",irrigation:"آبیاری متعادل و جلوگیری از تنش شدید در گلدهی و تشکیل دانه.",pests:["شته","تریپس","کرم‌ها"],diseases:["پوسیدگی ریشه","بیماری‌های برگی","زنگ و لکه‌برگی"]},
  oilseeds:{climate:"اقلیم و طول فصل رشد باید با گونه و رقم هماهنگ شود.",soil:"خاک عمیق و دارای زهکشی مناسب؛ تحمل شوری گونه‌محور است.",irrigation:"تنش آبی در استقرار، گلدهی و پرشدن دانه اهمیت بیشتری دارد.",pests:["شته","سن‌ها","کرم‌های تغذیه‌کننده"],diseases:["سفیدک‌ها","لکه‌برگی","پوسیدگی‌ها"]},
  vegetables:{climate:"بسته به محصول از خنک تا گرم؛ دما و رطوبت مستقیماً روی کیفیت اثر دارند.",soil:"خاک نرم، حاصلخیز و دارای زهکشی مناسب.",irrigation:"آبیاری منظم با توجه به بافت خاک و مرحله رشد؛ نوسان شدید رطوبت می‌تواند مشکل‌ساز شود.",pests:["شته","کنه","تریپس","سفیدبالک","کرم‌ها"],diseases:["سفیدک‌ها","لکه‌برگی","پوسیدگی‌ها","بیماری‌های ویروسی"]},
  herbs_spices:{climate:"به گونه وابسته؛ بسیاری به نور مناسب و زهکشی خوب نیاز دارند.",soil:"خاک با زهکشی مناسب و ماده آلی کافی، با pH وابسته به گونه.",irrigation:"آبیاری متعادل و پرهیز از ماندابی شدن.",pests:["شته","کنه","تریپس"],diseases:["پوسیدگی ریشه","بیماری‌های برگی"]},
  orchards:{climate:"اقلیم، نیاز سرمایی، خطر یخبندان و گرمای تابستان باید با گونه و رقم هماهنگ شود.",soil:"خاک عمیق، دارای زهکشی و بدون لایه محدودکننده ریشه.",irrigation:"مدیریت آب بر اساس سن درخت، مرحله رشد، تبخیر-تعرق و بافت خاک.",pests:["شته","کنه","مگس‌ها","پروانه‌ها و آفات اختصاصی"],diseases:["شانکرها","لکه‌برگی","پوسیدگی ریشه و میوه"]},
  nuts:{climate:"اقلیم، سرمای زمستان، گرمای تابستان و نیاز سرمایی بسته به گونه/رقم مهم است.",soil:"خاک عمیق و زهکش‌دار برای توسعه ریشه.",irrigation:"تنش آبی در استقرار، گلدهی، رشد مغز و پرشدن دانه مهم است.",pests:["شته","کنه","آفات میوه و مغز"],diseases:["پوسیدگی ریشه","بیماری‌های برگی و میوه"]},
  tropical_arid:{climate:"گرمسیری، نیمه‌خشک یا گرم؛ حد تحمل سرما و شوری به گونه وابسته است.",soil:"زهکشی مناسب و مدیریت شوری آب و خاک اهمیت دارد.",irrigation:"برنامه آبیاری باید با تبخیر-تعرق، عمق ریشه و کیفیت آب تنظیم شود.",pests:["شته","کنه","تریپس","مگس‌های میوه"],diseases:["پوسیدگی‌ها","بیماری‌های برگی"]},
  forage:{climate:"بسته به گونه و هدف علوفه‌ای؛ طول فصل رشد تعیین‌کننده است.",soil:"خاک دارای حاصلخیزی و زهکشی مناسب.",irrigation:"آب کافی برای رشد رویشی و زمان مناسب برداشت اهمیت دارد.",pests:["شته","ملخ‌ها","آفات برگ"],diseases:["زنگ‌ها","لکه‌برگی","پوسیدگی ریشه"]},
  industrial:{climate:"گونه‌محور؛ دما، طول فصل رشد و رطوبت بر کیفیت محصول صنعتی اثر دارند.",soil:"خاک مناسب رشد ریشه با مدیریت pH، شوری و زهکشی.",irrigation:"برنامه آب باید با هدف محصول و کیفیت ماده خام هماهنگ شود.",pests:["شته","کنه","کرم‌ها و آفات اختصاصی"],diseases:["بیماری‌های برگی","پوسیدگی‌ها"]},
  ornamentals:{climate:"نور، دما، رطوبت و تهویه بر کیفیت اندام زینتی اثر مستقیم دارند.",soil:"بستر سبک و زهکش‌دار یا محیط کشت مناسب.",irrigation:"آبیاری منظم و جلوگیری از ماندابی شدن؛ در گلخانه EC و pH آب پایش شود.",pests:["شته","کنه","تریپس","سفیدبالک"],diseases:["سفیدک‌ها","پوسیدگی ریشه","بیماری‌های برگی"]}
};

// Broad planning defaults. They are intentionally approximate and category-level.
// Specialized profiles with real numeric data override these values in crop-profiles.js.
const numericDefaults={
  cereals:{seed:[80,180],seedUnit:'کیلوگرم بذر/هکتار',irrigations:[4,8],interval:[12,22],yield:[3,7],yieldUnit:'تن (کل زمین)',price:[15000,30000],cost:[40000000,90000000],durationMonths:[4,7],window:{cold:['مهر','آبان'],temperate:['مهر','آبان'],warm:['آبان','دی'],humid:['مهر','آبان']}},
  pulses:{seed:[50,140],seedUnit:'کیلوگرم بذر/هکتار',irrigations:[3,7],interval:[12,22],yield:[1.2,3.5],yieldUnit:'تن (کل زمین)',price:[50000,120000],cost:[35000000,75000000],durationMonths:[3,6],window:{cold:['فروردین','اردیبهشت'],temperate:['اسفند','فروردین'],warm:['مهر','آذر'],humid:['اسفند','فروردین']}},
  oilseeds:{seed:[5,80],seedUnit:'کیلوگرم بذر/هکتار',irrigations:[3,7],interval:[10,20],yield:[1,3.5],yieldUnit:'تن (کل زمین)',price:[30000,90000],cost:[40000000,90000000],durationMonths:[4,7],window:{cold:['فروردین','اردیبهشت'],temperate:['اسفند','فروردین'],warm:['مهر','آذر'],humid:['اسفند','فروردین']}},
  vegetables:{seed:[0.5,8],seedUnit:'کیلوگرم بذر/هکتار؛ برای نشایی/پیازی بسته به محصول متفاوت است',irrigations:[8,18],interval:[3,8],yield:[15,60],yieldUnit:'تن (کل زمین)',price:[15000,60000],cost:[90000000,250000000],durationMonths:[2,6],window:{cold:['فروردین','اردیبهشت'],temperate:['اسفند','اردیبهشت'],warm:['مهر','بهمن'],humid:['اسفند','فروردین']}},
  herbs_spices:{seed:[1,20],seedUnit:'کیلوگرم بذر/هکتار یا واحد تکثیر؛ بسته به محصول',irrigations:[4,12],interval:[7,18],yield:[0.5,5],yieldUnit:'تن (کل زمین)',price:[50000,400000],cost:[50000000,180000000],durationMonths:[3,12],window:{cold:['فروردین','اردیبهشت'],temperate:['اسفند','اردیبهشت'],warm:['مهر','آذر'],humid:['اسفند','فروردین']}},
  orchards:{seed:[200,800],seedUnit:'نهال/درخت در هکتار',irrigations:[12,30],interval:[5,15],yield:[5,25],yieldUnit:'تن (کل زمین)',price:[40000,250000],cost:[150000000,500000000],durationMonths:[12,36],window:{cold:['آبان','اسفند'],temperate:['آبان','اسفند'],warm:['آذر','بهمن'],humid:['آبان','اسفند']}},
  nuts:{seed:[120,500],seedUnit:'نهال/درخت در هکتار',irrigations:[12,30],interval:[7,18],yield:[1,6],yieldUnit:'تن (کل زمین)',price:[150000,800000],cost:[180000000,550000000],durationMonths:[12,36],window:{cold:['آبان','اسفند'],temperate:['آبان','اسفند'],warm:['آذر','بهمن'],humid:['آبان','اسفند']}},
  tropical_arid:{seed:[100,600],seedUnit:'نهال/بوته در هکتار',irrigations:[18,45],interval:[3,12],yield:[5,30],yieldUnit:'تن (کل زمین)',price:[30000,250000],cost:[150000000,500000000],durationMonths:[12,36],window:{cold:['فروردین','اردیبهشت'],temperate:['اسفند','اردیبهشت'],warm:['مهر','آذر'],humid:['اسفند','اردیبهشت']}},
  forage:{seed:[10,40],seedUnit:'کیلوگرم بذر/هکتار',irrigations:[4,12],interval:[7,18],yield:[5,20],yieldUnit:'تن (کل زمین)',price:[5000,18000],cost:[35000000,100000000],durationMonths:[2,8],window:{cold:['فروردین','اردیبهشت'],temperate:['اسفند','فروردین'],warm:['مهر','آذر'],humid:['اسفند','فروردین']}},
  industrial:{seed:[5,80],seedUnit:'کیلوگرم بذر/هکتار؛ بسته به محصول متفاوت است',irrigations:[5,14],interval:[7,20],yield:[2,10],yieldUnit:'تن (کل زمین)',price:[15000,90000],cost:[60000000,220000000],durationMonths:[4,10],window:{cold:['فروردین','اردیبهشت'],temperate:['اسفند','فروردین'],warm:['مهر','آذر'],humid:['اسفند','فروردین']}},
  ornamentals:{seed:[1000,6000],seedUnit:'بوته/نشاء/پیاز در هکتار',irrigations:[10,30],interval:[3,10],yield:[10000,50000],yieldUnit:'واحد قابل فروش (کل زمین)',price:[1000,15000],cost:[100000000,400000000],durationMonths:[3,12],window:{cold:['فروردین','اردیبهشت'],temperate:['اسفند','فروردین'],warm:['مهر','آذر'],humid:['اسفند','فروردین']}}
};

function profile(meta){
  const g=groupTemplates[meta.category]||groupTemplates.cereals;
  return {
    aliases:[meta.name,...meta.aliases],category:meta.label,scientificName:"",
    summary:`${meta.name} در گروه «${meta.label}» قرار می‌گیرد. این شناسنامه به‌صورت خودکار از رجیستری جهانی آفلاین ساخته شده و برای توصیه دقیق باید گونه/رقم، منطقه، مرحله رشد و شرایط آب و خاک مشخص باشد.`,
    climate:g.climate,temperature:"عدد دما را بدون شناخت گونه و رقم ثابت فرض نکن؛ حداقل/بهینه/حداکثر دما باید از داده گونه‌ای یا منبع محلی تعیین شود.",soil:g.soil,ph:"pH مناسب گونه‌محور است؛ نتیجه آزمون خاک مبنا قرار گیرد.",ec:"تحمل EC و شوری گونه‌محور است؛ EC خاک و آب اندازه‌گیری شود.",propagation:"روش تکثیر بر اساس نوع محصول می‌تواند بذر، نشا، قلمه، پیاز، غده، ریزوم یا نهال باشد.",planting:"تاریخ، تراکم، فاصله و عمق کاشت باید بر اساس گونه، رقم، اقلیم، روش آبیاری و هدف تولید تنظیم شود.",season:"تقویم کاشت باید با دمای منطقه و خطر یخبندان/گرمای شدید هماهنگ شود.",growthDays:"دوره رشد ثابت جهانی نیست و به گونه، رقم، دما و مدیریت وابسته است.",irrigation:g.irrigation,irrigationStages:"استقرار، رشد رویشی، مرحله تولید اندام اقتصادی و رسیدگی؛ مرحله حساس دقیق به گونه وابسته است.",nutrition:"نیاز غذایی باید بر اساس گونه، مرحله رشد و آزمون خاک/آب/برگ تعیین شود.",fertilizer:"نسخه عددی ثابت برای همه مناطق مناسب نیست؛ آزمون و نیاز واقعی محصول مبنا باشد.",care:"پایش منظم، مدیریت علف هرز، کنترل رطوبت و تهویه، بهداشت مزرعه و ثبت عملیات.",pests:g.pests,diseases:g.diseases,harvest:"برداشت بر اساس شاخص بلوغ و هدف بازار/مصرف انجام شود.",postHarvest:"کاهش ضربه، گرما و رطوبت اضافی و انتقال سریع به شرایط مناسب پس از برداشت.",storage:"شرایط دما، رطوبت و تهویه باید با محصول و هدف نگهداری هماهنگ شود.",yield:"عملکرد به گونه، رقم، منطقه، آب، خاک و مدیریت وابسته است؛ عدد قطعی بدون داده محلی اعلام نشود.",economics:"هزینه بذر/نهال، آماده‌سازی، آب، کود، حفاظت، کارگر، ماشین، برداشت، بسته‌بندی و ضایعات را ثبت کن.",
    numeric:{...(numericDefaults[meta.category]||numericDefaults.cereals),estimated:true,estimateScope:"برآورد عمومی گروه محصول؛ برای رقم، منطقه و بازار محلی باید اصلاح شود."},
    risks:["تنش آبی","شوری","دمای نامناسب","آفات و بیماری‌ها","تفاوت رقم و منطقه"]
  };
}

export const universalProfiles=Object.fromEntries(Object.entries(registry).map(([name,meta])=>[name,profile(meta)]));
export function findRegisteredCrop(name=""){
  const n=normalize(name);
  for(const [key,p] of Object.entries(universalProfiles)){
    if(normalize(key)===n || (p.aliases||[]).some(a=>normalize(a)===n)) return {name:key,profile:p};
  }
  return null;
}
export default universalProfiles;
