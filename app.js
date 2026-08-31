/* یار کشاورز ۳ — بازسازی یکپارچه بر پایه نسخه ۰.۲
   داده‌ها محلی ذخیره می‌شوند و ساختار برای اتصال آینده به سرویس‌های واقعی آماده است. */

const KEY = "yk-v03";
const LEGACY_KEYS = ["yk-v02"];
const $ = s => document.querySelector(s);
const app = $("#app");
const title = $("#pageTitle");

const defaultState = {
  version: "3.0",
  lands: [],
  inventory: [],
  transactions: [],
  crops: [],
  sales: [],
  implements: [],
  alerts: [],
  settings: { currency: "تومان" }
};

let state = loadState();
let route = "home";
let selectedLandId = null;
let landTab = "overview";

function uid(prefix="id"){ return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function esc(v=""){ return String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function money(n){ return Number(n||0).toLocaleString("fa-IR") + " " + state.settings.currency; }
function num(v){ return Number(v)||0; }

function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw) return normalize(JSON.parse(raw));
    for(const k of LEGACY_KEYS){
      const legacy = localStorage.getItem(k);
      if(legacy){
        const s = normalize(JSON.parse(legacy));
        s.version = "3.0";
        localStorage.setItem(KEY, JSON.stringify(s));
        return s;
      }
    }
  }catch(e){ console.warn(e); }
  return structuredClone(defaultState);
}
function normalize(s){
  return Object.assign(structuredClone(defaultState), s, {
    lands: Array.isArray(s.lands)?s.lands:[],
    inventory: Array.isArray(s.inventory)?s.inventory:[],
    transactions: Array.isArray(s.transactions)?s.transactions:[],
    crops: Array.isArray(s.crops)?s.crops:[],
    sales: Array.isArray(s.sales)?s.sales:[],
    implements: Array.isArray(s.implements)?s.implements:[],
    alerts: Array.isArray(s.alerts)?s.alerts:[]
  });
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function land(id){ return state.lands.find(x=>x.id===id); }
function landName(id){ return land(id)?.name || "بدون زمین"; }

function totalsForLand(id){
  const tx = state.transactions.filter(x=>x.landId===id);
  const sales = state.sales.filter(x=>x.landId===id);
  const cost = tx.filter(x=>x.type==="expense").reduce((a,x)=>a+num(x.amount),0);
  const income = sales.reduce((a,x)=>a+num(x.amount),0) +
    tx.filter(x=>x.type==="income").reduce((a,x)=>a+num(x.amount),0);
  return {cost,income,profit:income-cost};
}
function totals(){
  return state.lands.reduce((a,l)=>{
    const t=totalsForLand(l.id); a.cost+=t.cost;a.income+=t.income;return a;
  },{cost:0,income:0});
}

function setRoute(r){
  route=r;
  if(r==="add") renderAdd();
  else if(r==="lands") renderLands();
  else if(r==="inventory") renderInventory();
  else if(r==="assistant") renderAssistant();
  else if(r==="news") renderNews();
  else if(r==="ads") renderAds();
  else if(r==="measure") renderMeasure();
  else if(r==="land") renderLand();
  else renderHome();
  document.querySelectorAll(".bottom-nav [data-route]").forEach(b=>b.classList.toggle("active",b.dataset.route===r));
}

function renderHome(){
  title.textContent="خانه";
  const t=totals();
  const low=state.inventory.filter(i=>num(i.quantity)<=num(i.minQuantity));
  const area=state.lands.reduce((a,x)=>a+num(x.area),0);
  const mainLand=state.lands[0];
  app.innerHTML=`
  <section class="hero"><span class="hero-badge">داشبورد هوشمند</span><h2>مدیریت مزرعه، ساده و حرفه‌ای</h2><p>زمین، آب‌وهوا، موجودی و امور مالی را یک‌جا ببین و سریع تصمیم بگیر.</p><div class="actions"><button class="primary" data-route="lands">مشاهده زمین‌ها</button><button class="secondary" data-route="assistant">گفت‌وگو با یار</button></div></section>
  <div class="grid">
    <div class="card"><div class="row"><span class="section-icon">🌾</span><span class="muted">زمین‌ها</span></div><strong class="metric">${state.lands.length.toLocaleString('fa-IR')}</strong><small class="muted">قطعه فعال</small></div>
    <div class="card"><div class="row"><span class="section-icon">📐</span><span class="muted">مساحت کل</span></div><strong class="metric">${area.toLocaleString('fa-IR',{maximumFractionDigits:2})}</strong><small class="muted">هکتار</small></div>
    <div class="card"><div class="row"><span class="section-icon">💰</span><span class="muted">هزینه</span></div><strong class="metric">${money(t.cost)}</strong></div>
    <div class="card"><div class="row"><span class="section-icon">📈</span><span class="muted">درآمد</span></div><strong class="metric">${money(t.income)}</strong></div>
  </div>
  <div class="section-title"><h3>دسترسی سریع</h3></div>
  <div class="grid">
    <button class="card quick-card" data-route="lands"><span class="quick-icon">🗺️</span><div><h3>زمین‌های من</h3><small class="muted">مشاهده و مدیریت زمین‌ها</small></div></button>
    <button class="card quick-card" data-route="add"><span class="quick-icon">＋</span><div><h3>ثبت جدید</h3><small class="muted">زمین، کشت و اطلاعات</small></div></button>
    <button class="card quick-card" data-route="inventory"><span class="quick-icon">📦</span><div><h3>انبار</h3><small class="muted">موجودی و مصرف</small></div></button>
    <button class="card quick-card" data-route="news"><span class="quick-icon">📰</span><div><h3>اخبار کشاورزی</h3><small class="muted">مطالب و اطلاع‌رسانی</small></div></button>
  </div>
  <div class="section-title"><h3>امروز</h3><button class="secondary" data-route="ads">پیشنهادها</button></div>
  ${mainLand?`<div class="card"><div class="row"><div><span class="badge">زمین منتخب</span><h3 style="margin-top:8px">${esc(mainLand.name)}</h3><p class="muted">${esc(mainLand.crop||'محصول ثبت نشده')} · ${num(mainLand.area).toLocaleString('fa-IR')} ${esc(mainLand.areaUnit||'هکتار')}</p></div><button class="primary" data-open-land="${mainLand.id}">جزئیات</button></div></div>`:''}
  ${low.length?`<div class="section-title"><h3>🔔 نیاز به توجه</h3></div><div class="list">${low.map(i=>`<div class="alert"><strong>${esc(i.name)}</strong> — موجودی ${num(i.quantity)} ${esc(i.unit||"واحد")}</div>`).join('')}</div>`:''}
  <div class="section-title"><h3>آخرین فعالیت‌ها</h3></div><div class="list">${recentActivity()}</div>`;
}

function recentActivity(){
  const all=[
    ...state.transactions.map(x=>({...x,label:x.type==="expense"?"هزینه":"درآمد",text:x.title,amount:x.amount,date:x.date})),
    ...state.crops.map(x=>({label:"کشت",text:x.product,amount:0,date:x.date}))
  ].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5);
  return all.length?all.map(x=>`<div class="card row"><span>${esc(x.label)} — ${esc(x.text)}</span><strong>${x.amount?money(x.amount):""}</strong></div>`).join(""):`<div class="empty">هنوز فعالیتی ثبت نشده است.</div>`;
}

function renderLands(){
  title.textContent="زمین‌های من";
  app.innerHTML=`<div class="section-title"><div><h2>زمین‌های من</h2><span class="muted">${state.lands.length.toLocaleString('fa-IR')} زمین ثبت شده</span></div><button class="primary" data-route="add">➕ زمین جدید</button></div>
  <div class="list">${state.lands.length?state.lands.map(l=>{const t=totalsForLand(l.id);return `<article class="card land-card"><div class="land-cover"><span class="badge">${l.ownership==="rent"?"🤝 اجاره‌ای":"🏠 مالک"}</span></div><div class="land-body"><div class="row"><div><div class="land-title">${esc(l.name)}</div><span class="muted">${esc(l.region||"منطقه ثبت نشده")}</span></div><span class="badge">${esc(l.crop||"بدون محصول")}</span></div><div class="land-meta"><div><small>مساحت</small><strong>${num(l.area).toLocaleString('fa-IR')} هکتار</strong></div><div><small>هزینه</small><strong>${money(t.cost)}</strong></div><div><small>سود/زیان</small><strong class="${t.profit>=0?'stat-positive':'stat-negative'}">${money(t.profit)}</strong></div></div><div class="actions"><button class="primary" data-open-land="${l.id}">مشاهده پرونده</button><button class="danger" data-delete-land="${l.id}">حذف</button></div></div></article>`}).join(""):`<div class="empty card">هنوز زمینی ثبت نشده است.<br><br><button class="primary" data-route="add">اولین زمین را ثبت کن</button></div>`}</div>`;
}

function renderAdd(){
  title.textContent="ثبت زمین";
  app.innerHTML=`<div class="section-title"><h2>➕ ثبت زمین</h2><button class="secondary" data-route="measure">📐 اندازه‌گیری</button></div>
  <form id="landForm" class="card form">
    <div class="field"><label>نام زمین</label><input name="name" required placeholder="مثلاً زمین شمالی"></div>
    <div class="field"><label>مساحت زمین</label><div class="row"><input id="landArea" name="area" type="number" step="0.01" required placeholder="مثلاً 2.5"><span class="badge">هکتار</span></div><small class="muted">اگر مرز زمین را روی نقشه اندازه‌گیری کردی، مساحت خودکار اینجا قرار می‌گیرد.</small></div>
    <input type="hidden" name="areaUnit" value="هکتار">
    <div class="field"><label>منطقه / روستا / شهر</label><input name="region" placeholder="برای آب‌وهوا بهتر است موقعیت دقیق زمین ثبت شود"></div>
    <div class="field"><label>نوع مالکیت</label><div class="ownership-grid"><label class="choice"><input type="radio" name="ownership" value="own" checked> 🏠 مالک زمین هستم</label><label class="choice"><input type="radio" name="ownership" value="rent"> 🤝 زمین را اجاره کرده‌ام</label></div></div>
    <div id="rentFields" class="card form rent-only" hidden><strong>اطلاعات اجاره</strong><div class="field"><label>نام مالک</label><input name="ownerName"></div><div class="field"><label>مبلغ اجاره</label><input name="rentAmount" type="number" min="0"></div><div class="field"><label>مدت اجاره</label><input name="rentPeriod" placeholder="مثلاً یک سال"></div></div>
    <div class="field"><label>نوع خاک</label><input name="soil"></div><div class="field"><label>وضعیت / منبع آب</label><input name="water"></div><div class="field"><label>نوع آبیاری</label><input name="irrigation"></div><div class="field"><label>محصول فعلی</label><input name="crop"></div><div class="field"><label>توضیحات</label><textarea name="notes"></textarea></div>
    <button class="primary">ذخیره زمین</button>
  </form>`;
}

function renderLand(){
  const l=land(selectedLandId);
  if(!l){setRoute("lands");return;}
  title.textContent=l.name;
  const t=totalsForLand(l.id);
  const crops=state.crops.filter(x=>x.landId===l.id);
  const tx=state.transactions.filter(x=>x.landId===l.id);
  const inventory=state.inventory;
  const content={
    overview:`<div class="grid">
      <div class="card"><div class="muted">مساحت</div><div class="metric">${num(l.area).toLocaleString("fa-IR")}</div><span class="muted">${esc(l.areaUnit||"هکتار")}</span></div>
      <div class="card"><div class="muted">هزینه</div><div class="metric">${money(t.cost)}</div></div>
      <div class="card"><div class="muted">درآمد</div><div class="metric">${money(t.income)}</div></div>
      <div class="card"><div class="muted">سود/زیان</div><div class="metric">${money(t.profit)}</div></div>
    </div>
    <div class="section-title"><h3>📋 مشخصات</h3></div>
    <div class="card list">${detail("مالکیت",l.ownership==="rent"?"اجاره‌ای":"مالک")}${detail("منطقه",l.region)}${detail("خاک",l.soil)}${detail("آب",l.water)}${detail("آبیاری",l.irrigation)}${detail("محصول فعلی",l.crop)}</div>`,
    crops:`<div class="actions"><button class="primary" data-add-crop="${l.id}">🌱 ثبت کشت جدید</button></div><div class="section-title"><h3>سوابق کشت</h3></div><div class="list">${crops.length?crops.map(c=>`<div class="card"><div class="row"><strong>${esc(c.product)}</strong><span>${esc(c.date||"")}</span></div><p class="muted">بذر: ${num(c.seedQty)} ${esc(c.seedUnit||"واحد")}</p></div>`).join(""):`<div class="empty card">هنوز کشت ثبت نشده است.</div>`}</div>`,
    finance:`<div class="actions"><button class="primary" data-add-tx="${l.id}">💰 ثبت هزینه/درآمد</button></div><div class="list">${tx.length?tx.map(x=>`<div class="card row"><span>${esc(x.title)}<small class="muted"> · ${esc(x.date||"")}</small></span><strong>${x.type==="expense"?"−":"+"}${money(x.amount)}</strong></div>`).join(""):`<div class="empty card">تراکنش مالی ندارید.</div>`}</div>`,
    calculator:calculator(l),
    inventory:`<div class="actions"><button class="primary" data-consume="${l.id}">📦 ثبت مصرف از انبار</button></div><div class="list">${inventory.length?inventory.map(i=>`<div class="card row"><span>${esc(i.name)}<small class="muted"> · ${esc(i.unit||"واحد")}</small></span><strong>${num(i.quantity)}</strong></div>`).join(""):`<div class="empty card">انبار خالی است.</div>`}</div>`,
    suggestions:`<div class="card"><h3>🌾 پیشنهاد محصولات</h3><p class="muted">در نسخه ۳، پیشنهاد باید بر اساس اطلاعات همین زمین و داده‌های معتبر بازار/آب‌وهوا محاسبه شود. تا اتصال منبع واقعی، عدد ساختگی نمایش داده نمی‌شود.</p><div class="actions"><button class="secondary" data-calc-suggestions="${l.id}">بررسی اطلاعات زمین</button></div></div>`,
    weather:`<div class="card"><h3>🌦️ آب‌وهوای واقعی زمین</h3><p class="muted">ابتدا موقعیت زمین را با GPS ثبت کن؛ سپس برنامه آب‌وهوای همان مختصات را از سرویس زنده می‌گیرد.</p><div class="actions"><button class="primary" data-weather="${l.id}">📍 دریافت موقعیت و آب‌وهوا</button><button class="secondary" data-route="measure">📐 اندازه‌گیری زمین</button></div><div id="weatherBox" class="section-title">${l.lat?`<span class="badge">موقعیت ثبت شده</span>`:`<span class="muted">موقعیت GPS ثبت نشده</span>`}</div></div>`, 
    assistant:`${assistantForLand(l)}`
  }[landTab] || "";
  app.innerHTML=`<div class="card land-detail-hero"><div class="land-detail-cover"></div><div class="land-detail-info"><div class="row"><div><h2>${esc(l.name)}</h2><span class="badge">${l.ownership==="rent"?"🤝 اجاره‌ای":"🏠 مالک"}</span></div><button class="secondary" data-route="lands">بازگشت</button></div></div></div>
  <div class="tabs">${["overview","crops","finance","calculator","inventory","suggestions","weather","assistant"].map(x=>`<button class="${x===landTab?"active":""}" data-land-tab="${x}">${tabLabel(x)}</button>`).join("")}</div>
  ${content}`;
}
function detail(k,v){return `<div class="row"><span class="muted">${k}</span><strong>${esc(v||"ثبت نشده")}</strong></div>`}
function tabLabel(x){return ({overview:"📋 مشخصات",crops:"🌱 کشت",finance:"💰 مالی",calculator:"🧮 محاسبه",inventory:"📦 انبار",suggestions:"🌾 پیشنهاد",weather:"🌦️ آب‌وهوا",assistant:"🤖 یار"})[x];}

function calculator(l){
  return `<div class="card"><h3>🧮 محاسبه‌گر حرفه‌ای</h3>
  <p class="muted">زمین: ${esc(l.name)} · ${num(l.area)} ${esc(l.areaUnit||"هکتار")} · ${l.ownership==="rent"?"اجاره‌ای":"مالک"}</p>
  <form id="calcForm" class="form">
  ${["بذر","کود","سم","آب","کارگر","سوخت","روغن","ماشین‌آلات","اجاره زمین","سایر"].map((x,i)=>`<div class="field"><label>${x}</label><input name="c${i}" type="number" min="0" step="0.01" value="${x==="اجاره زمین"&&l.ownership!=="rent"?"0":""}"></div>`).join("")}
  <div class="field"><label>مقدار تولید مورد انتظار</label><input name="production" type="number" min="0" step="0.01"></div>
  <div class="field"><label>قیمت فروش هر واحد</label><input name="salePrice" type="number" min="0" step="0.01"></div>
  <button class="primary">محاسبه سود/زیان</button></form>
  <div id="calcResult"></div></div>`;
}

function renderMeasure(){
  title.textContent="اندازه‌گیری زمین";
  app.innerHTML=`<div class="section-title"><h2>📐 اندازه‌گیری مساحت</h2><button class="secondary" data-route="lands">بازگشت</button></div>
  <div class="card"><p class="muted">روی نقشه گوشه‌های زمین را به ترتیب لمس کن. حداقل ۳ نقطه لازم است.</p><div id="map" class="map"></div>
  <div class="actions measure-actions"><button class="primary" data-gps>📍 موقعیت من</button><button class="secondary" data-clear-points>پاک کردن نقاط</button><button class="secondary" data-use-area>استفاده از این مساحت</button></div>
  <div id="measureResult" class="alert">هنوز نقطه‌ای ثبت نشده است.</div></div>
  <div class="card"><h3>روش دقیق‌تر</h3><p class="muted">اگر GPS دقیق نیست، می‌توانی نقاط را روی نقشه جابه‌جا کنی. مساحت نهایی بر حسب هکتار محاسبه می‌شود.</p></div>`;
  setTimeout(initMap,0);
}
let measureMap=null, measurePoints=[], measureLayer=null, measurePolygon=null, measuredHectares=0;
function initMap(){
  if(typeof L==='undefined'){ $('#measureResult').textContent='نقشه بارگذاری نشد؛ اینترنت را بررسی کن.'; return; }
  measureMap=L.map('map').setView([35.7,51.4],12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(measureMap);
  measureLayer=L.layerGroup().addTo(measureMap);
  measureMap.on('click', e=>addMeasurePoint(e.latlng.lat,e.latlng.lng));
}
function addMeasurePoint(lat,lng){
  measurePoints.push([lat,lng]);
  const m=L.marker([lat,lng],{draggable:true}).addTo(measureLayer); m._ykIndex=measurePoints.length-1;
  m.on('dragend',()=>{const p=m.getLatLng();measurePoints[m._ykIndex]=[p.lat,p.lng];updateMeasure();}); updateMeasure();
}
function updateMeasure(){
  if(measurePolygon) measureMap.removeLayer(measurePolygon);
  if(measurePoints.length>=3){measurePolygon=L.polygon(measurePoints).addTo(measureMap);measuredHectares=polygonArea(measurePoints)/10000;$('#measureResult').innerHTML=`مساحت تقریبی: <strong>${measuredHectares.toLocaleString('fa-IR',{maximumFractionDigits:3})} هکتار</strong> (${Math.round(measuredHectares*10000).toLocaleString('fa-IR')} متر مربع)`;}
  else {measuredHectares=0;$('#measureResult').textContent=`${measurePoints.length} نقطه ثبت شده؛ حداقل ۳ نقطه لازم است.`;}
}
function polygonArea(points){
  const R=6378137, lat0=points.reduce((a,p)=>a+p[0],0)/points.length*Math.PI/180;
  const xy=points.map(p=>[R*p[1]*Math.PI/180*Math.cos(lat0),R*p[0]*Math.PI/180]);
  let a=0; for(let i=0;i<xy.length;i++){const j=(i+1)%xy.length;a+=xy[i][0]*xy[j][1]-xy[j][0]*xy[i][1];} return Math.abs(a)/2;
}
function clearMeasure(){measurePoints=[];measuredHectares=0;if(measureLayer)measureLayer.clearLayers();if(measurePolygon){measureMap.removeLayer(measurePolygon);measurePolygon=null;}$('#measureResult').textContent='هنوز نقطه‌ای ثبت نشده است.';}
function locateUser(){if(!navigator.geolocation){alert('GPS در این مرورگر در دسترس نیست.');return;}navigator.geolocation.getCurrentPosition(pos=>{const {latitude,longitude}=pos.coords;if(measureMap){measureMap.setView([latitude,longitude],17);addMeasurePoint(latitude,longitude);}},err=>alert('دسترسی به موقعیت داده نشد. GPS و اجازه Location را فعال کن.'),{enableHighAccuracy:true,timeout:15000,maximumAge:0});}
function useMeasuredArea(){if(measuredHectares<=0){alert('ابتدا حداقل ۳ نقطه از مرز زمین را ثبت کن.');return;}localStorage.setItem('yk-v03-measured-area',String(measuredHectares));setRoute('add');setTimeout(()=>{const f=$('#landArea');if(f){f.value=measuredHectares.toFixed(3);f.focus();}},50);}
function weatherForLand(id){
 const l=land(id);if(!l)return;if(!navigator.geolocation){alert('GPS در این مرورگر در دسترس نیست.');return;}
 const box=$('#weatherBox');if(box)box.innerHTML='<div class="card weather-card"><div class="muted">در حال دریافت آب‌وهوای زمین...</div></div>';
 navigator.geolocation.getCurrentPosition(async pos=>{
  l.lat=pos.coords.latitude;l.lon=pos.coords.longitude;save();
  try{const url=`https://api.open-meteo.com/v1/forecast?latitude=${l.lat}&longitude=${l.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&forecast_days=3&timezone=auto`;const r=await fetch(url);if(!r.ok)throw new Error();const d=await r.json();const c=d.current, days=d.daily;
   const icon=weatherIcon(c.weather_code), name=weatherName(c.weather_code);let fc='';for(let i=0;i<days.time.length;i++){fc+=`<div><small>${new Date(days.time[i]).toLocaleDateString('fa-IR',{weekday:'short'})}</small><strong>${weatherIcon(days.weather_code[i])}</strong><span>${Math.round(days.temperature_2m_max[i])}° / ${Math.round(days.temperature_2m_min[i])}°</span><small>${days.precipitation_probability_max[i]||0}% بارش</small></div>`}
   box.innerHTML=`<div class="card weather-card"><div class="weather-main"><div><span class="badge" style="background:rgba(255,255,255,.14);color:#fff">${name}</span><div class="weather-temp">${Math.round(c.temperature_2m)}°</div><div class="muted">دمای فعلی زمین</div></div><div class="weather-icon">${icon}</div></div><div class="weather-grid"><div><small>رطوبت</small><strong>${c.relative_humidity_2m}%</strong></div><div><small>باد</small><strong>${Math.round(c.wind_speed_10m)} km/h</strong></div><div><small>بارش</small><strong>${c.precipitation} mm</strong></div></div><div class="forecast">${fc}</div></div>`;
  }catch(e){box.innerHTML='<div class="alert">آب‌وهوای زنده دریافت نشد. اتصال اینترنت را بررسی کن.</div>';}
 },()=>{if(box)box.innerHTML='<div class="alert">اجازه دسترسی به موقعیت داده نشد. Location گوشی را فعال کن.</div>';},{enableHighAccuracy:true,timeout:15000,maximumAge:0});
}
function weatherIcon(code){if(code===0)return'☀️';if([1,2].includes(code))return'🌤️';if(code===3)return'☁️';if([45,48].includes(code))return'🌫️';if([51,53,55,56,57].includes(code))return'🌦️';if([61,63,65,66,67,80,81,82].includes(code))return'🌧️';if([71,73,75,77,85,86].includes(code))return'🌨️';if([95,96,99].includes(code))return'⛈️';return'🌤️';}
function weatherName(code){if(code===0)return'آفتابی';if([1,2].includes(code))return'نیمه‌ابری';if(code===3)return'ابری';if([45,48].includes(code))return'مه‌آلود';if([51,53,55,56,57].includes(code))return'نم‌نم باران';if([61,63,65,66,67,80,81,82].includes(code))return'بارانی';if([71,73,75,77,85,86].includes(code))return'برفی';if([95,96,99].includes(code))return'رعدوبرق';return'متغیر';}

function renderInventory(){
  title.textContent="انبار";
  const low=state.inventory.filter(i=>num(i.quantity)<=num(i.minQuantity));
  app.innerHTML=`<div class="section-title"><div><h2>انبار</h2><span class="muted">مدیریت سریع موجودی و مصرف</span></div><button class="primary" data-add-item>＋ ثبت کالا</button></div>
  <div class="grid"><div class="card"><div class="muted">کل اقلام</div><div class="metric">${state.inventory.length.toLocaleString('fa-IR')}</div></div><div class="card"><div class="muted">نیاز به خرید</div><div class="metric ${low.length?'stat-negative':'stat-positive'}">${low.length.toLocaleString('fa-IR')}</div></div></div>
  ${low.length?`<div class="card alert"><strong>لیست خرید پیشنهادی</strong><p class="muted" style="margin:5px 0 0">${low.map(i=>esc(i.name)).join(' · ')}</p></div>`:''}
  <div class="section-title"><h3>موجودی</h3></div><div class="list">${state.inventory.length?state.inventory.map(i=>`<div class="card"><div class="inventory-item"><div class="stock-icon">${categoryIcon(i.category)}</div><div><strong>${esc(i.name)}</strong><div class="muted">${esc(i.category||'سایر')} · حداقل ${num(i.minQuantity)} ${esc(i.unit||'واحد')}</div></div><div class="stock-qty">${num(i.quantity).toLocaleString('fa-IR')}<small class="muted"> ${esc(i.unit||'واحد')}</small></div></div><div class="inventory-actions"><button class="secondary" data-stock="${i.id}">↕ تغییر موجودی</button><button class="secondary" data-consume-item="${i.id}">− مصرف</button></div></div>`).join(''):`<div class="empty card">هنوز کالایی ثبت نشده است.<br><button class="primary" data-add-item style="margin-top:12px">＋ افزودن اولین کالا</button></div>`}</div>`;
}
function categoryIcon(c){return ({'بذر':'🌱','کود':'🧪','سم':'🧴','سوخت':'⛽','روغن':'🛢️','ابزار':'🛠️','قطعه':'⚙️'})[c]||'📦';}
function showModal(titleText, body){
  document.getElementById('modalRoot')?.remove();
  const root=document.createElement('div');root.id='modalRoot';root.className='modal-backdrop';root.innerHTML=`<div class="modal-sheet"><div class="modal-head"><h2>${titleText}</h2><button class="modal-close" data-close-modal>×</button></div>${body}</div>`;document.body.appendChild(root);
}
function closeModal(){document.getElementById('modalRoot')?.remove();}
function addInventoryItem(){
  showModal('ثبت کالای جدید',`<form id="inventoryForm" class="form"><div class="field"><label>نام کالا</label><input name="name" required placeholder="مثلاً کود اوره"></div><div class="field"><label>دسته</label><select name="category"><option>بذر</option><option>کود</option><option>سم</option><option>سوخت</option><option>روغن</option><option>ابزار</option><option>قطعه</option><option>سایر</option></select></div><div class="grid"><div class="field"><label>واحد</label><input name="unit" value="کیلو"></div><div class="field"><label>موجودی اولیه</label><input name="quantity" type="number" min="0" step="0.01" value="0"></div></div><div class="field"><label>حداقل موجودی</label><input name="minQuantity" type="number" min="0" step="0.01" value="0"></div><div class="actions"><button class="primary">ذخیره کالا</button><button type="button" class="secondary" data-close-modal>انصراف</button></div></form>`);
}
function stockDialog(id){
 const i=state.inventory.find(x=>x.id===id);if(!i)return;showModal(`تغییر موجودی · ${esc(i.name)}`,`<form id="stockForm" class="form" data-id="${i.id}"><div class="alert">موجودی فعلی: <strong>${num(i.quantity)} ${esc(i.unit||'واحد')}</strong></div><div class="field"><label>مقدار تغییر</label><input name="delta" type="number" step="0.01" placeholder="مثلاً 25 یا -5" required></div><p class="muted">عدد مثبت = ورود، عدد منفی = مصرف</p><div class="actions"><button class="primary">ثبت تغییر</button><button type="button" class="secondary" data-close-modal>انصراف</button></div></form>`);
}

function renderAssistant(){
  title.textContent="یار کشاورز";
  const history=JSON.parse(localStorage.getItem('yk-chat')||'[]');
  app.innerHTML=`<div class="card"><div class="assistant-brand"><div class="assistant-avatar">✦</div><div><h2 style="margin:0">یار کشاورز</h2><span class="badge">دستیار کشاورزی</span></div></div><p class="muted" style="margin-top:14px">با زبان خودت حرف بزن؛ سؤال آماده لازم نیست.</p></div><div class="card chat"><div id="chatMessages" class="chat-messages">${history.length?history.map(m=>`<div class="bubble ${m.role==='user'?'user':'ai'}">${m.html}</div>`).join(''):`<div class="bubble ai">سلام! من یار کشاورزم. ✦<br>هر چیزی درباره زمین، کشت، هزینه یا انبارت می‌خواهی بپرس.</div>`}</div><div class="ai-status">نسخه فعلی پاسخ‌ها را از اطلاعات ثبت‌شدهٔ داخل برنامه می‌سازد؛ اتصال به هوش مصنوعی واقعی را در مرحله بعد انجام می‌دهیم.</div><div class="chat-compose"><input id="aiQuestion" autocomplete="off" placeholder="مثلاً وضعیت زمین‌های من چطور است؟"><button class="primary" data-ask-ai aria-label="ارسال">➤</button></div></div>`;
  const box=$('#chatMessages');if(box)box.scrollTop=box.scrollHeight;
}

function renderNews(){
 title.textContent="اخبار";
 app.innerHTML=`<div class="section-title"><div><h2>اخبار کشاورزی</h2><span class="muted">مطالب کاربردی و اطلاع‌رسانی</span></div></div><div class="news-grid">
 <article class="card news-card"><div class="news-image" style="background-image:url('wheat-hero.jpg')"></div><div class="news-body"><span class="badge">کشت و زراعت</span><h3>راهنمای پایش وضعیت گندم در طول فصل</h3><p class="muted">نکات کاربردی برای بررسی رشد، آبیاری و علائم ظاهری مزرعه.</p><span class="news-meta">مطالعه ۳ دقیقه‌ای</span></div></article>
 <article class="card news-card"><div class="news-image" style="background-image:url('UI-MOCKUP-V3.png')"></div><div class="news-body"><span class="badge">مدیریت مزرعه</span><h3>چطور هزینه‌های مزرعه را بهتر کنترل کنیم؟</h3><p class="muted">ثبت منظم هزینه‌ها و موجودی، تصمیم‌گیری مالی را ساده‌تر می‌کند.</p><span class="news-meta">مطالعه ۴ دقیقه‌ای</span></div></article>
 </div>`;
}
function renderAds(){
 title.textContent="پیشنهادها";
 app.innerHTML=`<div class="section-title"><div><h2>پیشنهادهای کشاورزی</h2><span class="muted">تبلیغات و پیشنهادهای مرتبط</span></div></div><div class="ads-grid"><article class="card ad-card"><div class="ad-image" style="background-image:url('wheat-hero.jpg')"></div><div class="ad-body"><span class="ad-badge">پیشنهاد ویژه</span><h3>تخفیف نهاده‌های کشاورزی</h3><p class="muted">پیشنهادهای مرتبط با محصول و فصل کشت را اینجا ببین.</p><button class="primary">مشاهده پیشنهاد</button></div></article><article class="card ad-card"><div class="ad-body"><span class="ad-badge">خدمات مزرعه</span><h3>خدمات و ابزارهای مورد نیاز کشاورز</h3><p class="muted">این بخش برای تبلیغات واقعی و هدفمند آماده شده است.</p><button class="secondary">اطلاعات بیشتر</button></div></article></div>`;
}

function saveChat(history){localStorage.setItem('yk-chat',JSON.stringify(history.slice(-30)));}
function generateAnswer(q){
  const text=(q||"").trim(); if(!text)return "لطفاً سؤال را بنویس.";
  const t=totals(); const low=state.inventory.filter(i=>num(i.quantity)<=num(i.minQuantity));
  if(/انبار|موجودی|کم|تمام/.test(text)) return low.length?`این اقلام در انبار به حداقل رسیده‌اند: <strong>${low.map(i=>esc(i.name)).join("، ")}</strong>.`:`در حال حاضر موردی زیر حداقل موجودی ثبت‌شده نیست.`;
  if(/بیشترین هزینه|پر هزینه|هزینه.*زمین/.test(text)){
    if(!state.lands.length)return "هنوز زمینی ثبت نشده است.";
    const ranked=state.lands.map(l=>({l,t:totalsForLand(l.id)})).sort((a,b)=>b.t.cost-a.t.cost); const x=ranked[0];
    return `بیشترین هزینه مربوط به <strong>${esc(x.l.name)}</strong> است: <strong>${money(x.t.cost)}</strong>.`;
  }
  if(/سود|زیان/.test(text)){
    if(!state.lands.length)return "هنوز زمینی ثبت نشده است.";
    return state.lands.map(l=>{const x=totalsForLand(l.id);return `<div>${esc(l.name)}: ${x.profit>=0?"سود":"زیان"} <strong>${money(Math.abs(x.profit))}</strong></div>`}).join("");
  }
  if(/مجموع|کل.*هزینه/.test(text)) return `مجموع هزینه‌های ثبت‌شده <strong>${money(t.cost)}</strong> و مجموع درآمد <strong>${money(t.income)}</strong> است.`;
  if(/زمین|اطلاعات/.test(text)){ return state.lands.length?`تعداد زمین‌های ثبت‌شده <strong>${state.lands.length}</strong> است: ${state.lands.map(l=>esc(l.name)).join("، ")}.`:"هنوز زمینی ثبت نشده است."; }
  return `من سؤال را دریافت کردم. فعلاً می‌توانم درباره زمین‌ها، هزینه و درآمد، سود/زیان و موجودی انبار بر اساس اطلاعات ثبت‌شده پاسخ بدهم.`;
}
function askAI(){ const input=$("#aiQuestion"); if(!input)return; const q=input.value.trim(); if(!q)return; const history=JSON.parse(localStorage.getItem('yk-chat')||'[]'); const answer=generateAnswer(q); history.push({role:'user',html:esc(q)},{role:'ai',html:answer}); saveChat(history); renderAssistant(); }
function answerGeneral(q){ const input=$("#aiQuestion"); if(input){input.value=q;askAI();}else{const history=JSON.parse(localStorage.getItem('yk-chat')||'[]');history.push({role:'user',html:esc(q)},{role:'ai',html:generateAnswer(q)});saveChat(history);renderAssistant();}}
function assistantForLand(l){
  const t=totalsForLand(l.id);
  return `<div class="card"><h3>🤖 یار هوشمند — ${esc(l.name)}</h3><p class="muted">اطلاعات همین زمین در دسترس رابط هوشمند است.</p>
  <div class="actions">${["هزینه این زمین چقدر است؟","برای این زمین چه چیزهایی در انبار دارم؟","چه اطلاعاتی از کشت این زمین ثبت شده؟"].map(q=>`<button class="secondary" data-land-question="${esc(q)}">${esc(q)}</button>`).join("")}</div>
  <div id="landAssistantAnswer" class="section-title"><p class="muted">هزینه فعلی: ${money(t.cost)} · درآمد: ${money(t.income)}</p></div></div>`;
}

document.addEventListener("click", e=>{
  const r=e.target.closest("[data-route]")?.dataset.route;
  if(r){setRoute(r);return;}
  const open=e.target.closest("[data-open-land]");
  if(open){selectedLandId=open.dataset.openLand;landTab="overview";setRoute("land");return;}
  const tab=e.target.closest("[data-land-tab]");
  if(tab){landTab=tab.dataset.landTab;renderLand();return;}
  const del=e.target.closest("[data-delete-land]");
  if(del && confirm("این زمین و ارتباطات آن حذف شود؟")){state.lands=state.lands.filter(x=>x.id!==del.dataset.deleteLand);save();renderLands();return;}
  const action=e.target.closest("[data-action]")?.dataset.action;
  if(action==="backup") backup();
  if(action==="restore") $("#restoreInput").click();
  if(e.target.closest("[data-gps]")){locateUser();return;}
  if(e.target.closest("[data-clear-points]")){clearMeasure();return;}
  if(e.target.closest("[data-use-area]")){useMeasuredArea();return;}
  const weather=e.target.closest("[data-weather]"); if(weather){weatherForLand(weather.dataset.weather);return;}
  const addItem=e.target.closest("[data-add-item]");
  if(addItem) addInventoryItem();
  const stock=e.target.closest("[data-stock]");
  if(stock) stockDialog(stock.dataset.stock);
  const addCrop=e.target.closest("[data-add-crop]");
  if(addCrop) cropDialog(addCrop.dataset.addCrop);
  const addTx=e.target.closest("[data-add-tx]");
  if(addTx) txDialog(addTx.dataset.addTx);
  const consume=e.target.closest("[data-consume]");
  if(consume) consumeDialog(consume.dataset.consume);
  const q=e.target.closest("[data-question]");
  if(q) answerGeneral(q.dataset.question);
  const lq=e.target.closest("[data-land-question]");
  if(lq) answerLand(lq.dataset.landQuestion);
  if(e.target.closest("[data-close-modal]")){closeModal();return;}
  const consumeItem=e.target.closest("[data-consume-item]"); if(consumeItem){const i=state.inventory.find(x=>x.id===consumeItem.dataset.consumeItem);if(i){showModal(`مصرف · ${esc(i.name)}`,`<form id="stockForm" class="form" data-id="${i.id}" data-mode="consume"><div class="field"><label>مقدار مصرف</label><input name="delta" type="number" min="0" step="0.01" required placeholder="مثلاً 5"></div><p class="muted">مقدار به صورت خودکار از موجودی کم می‌شود.</p><div class="actions"><button class="primary">ثبت مصرف</button><button type="button" class="secondary" data-close-modal>انصراف</button></div></form>`);}}
  if(e.target.closest("[data-ask-ai]")){askAI();return;}
  const suggest=e.target.closest("[data-calc-suggestions]");
  if(suggest) alert("برای پیشنهاد دقیق محصول، منبع معتبر آب‌وهوا/بازار باید متصل شود؛ فعلاً از نمایش عدد ساختگی خودداری می‌کنیم.");
});

document.addEventListener("click", e=>{if(e.target.classList.contains("modal-backdrop"))closeModal();});
document.addEventListener("keydown", e=>{ if(e.key==="Enter" && e.target.id==="aiQuestion"){e.preventDefault();askAI();} });
document.addEventListener("change", e=>{
  if(e.target.name==="ownership"){const rent=e.target.value==="rent";$("#rentFields").hidden=!rent; if(!rent){["ownerName","rentAmount","rentPeriod"].forEach(n=>{const el=document.querySelector(`[name="${n}"]`);if(el)el.value="";});}}
});
document.addEventListener("submit", e=>{
  e.preventDefault();
  if(e.target.id==="inventoryForm"){const f=new FormData(e.target);state.inventory.push({id:uid("item"),name:f.get("name"),category:f.get("category"),unit:f.get("unit")||"واحد",quantity:num(f.get("quantity")),minQuantity:num(f.get("minQuantity")),createdAt:new Date().toISOString()});save();closeModal();renderInventory();return;}
  if(e.target.id==="stockForm"){const i=state.inventory.find(x=>x.id===e.target.dataset.id);if(!i)return;let d=num(new FormData(e.target).get("delta")); if(e.target.dataset.mode==="consume") d=-Math.abs(d); i.quantity=Math.max(0,num(i.quantity)+d);save();closeModal();renderInventory();return;}
  if(e.target.id==="landForm"){
    const f=new FormData(e.target);
    const l={id:uid("land"),name:f.get("name"),area:num(f.get("area")),areaUnit:f.get("areaUnit"),region:f.get("region"),ownership:f.get("ownership"),ownerName:f.get("ownerName"),rentAmount:num(f.get("rentAmount")),rentPeriod:f.get("rentPeriod"),soil:f.get("soil"),water:f.get("water"),irrigation:f.get("irrigation"),crop:f.get("crop"),notes:f.get("notes"),createdAt:new Date().toISOString()};
    state.lands.push(l);
    if(l.ownership==="rent"&&l.rentAmount) state.transactions.push({id:uid("tx"),landId:l.id,type:"expense",title:"اجاره زمین",amount:l.rentAmount,date:new Date().toISOString().slice(0,10),category:"اجاره زمین"});
    save();selectedLandId=l.id;landTab="overview";setRoute("land");
  }
  if(e.target.id==="calcForm"){
    const f=new FormData(e.target); const costs=[0,1,2,3,4,5,6,7,8,9].reduce((s,i)=>s+num(f.get("c"+i)),0);
    const income=num(f.get("production"))*num(f.get("salePrice")); const profit=income-costs;
    $("#calcResult").innerHTML=`<div class="section-title"><h3>نتیجه</h3></div><div class="grid"><div class="card">کل هزینه<strong class="metric">${money(costs)}</strong></div><div class="card">درآمد احتمالی<strong class="metric">${money(income)}</strong></div><div class="card">سود/زیان<strong class="metric">${money(profit)}</strong></div></div>`;
  }
});

$("#restoreInput").addEventListener("change", async e=>{
  const file=e.target.files[0]; if(!file)return;
  try{const data=JSON.parse(await file.text());state=normalize(data);state.version="3.0";save();setRoute("home");alert("پشتیبان با موفقیت بازیابی شد.");}catch(err){alert("فایل پشتیبان معتبر نیست.");}
  e.target.value="";
});

function cropDialog(landId){
  const product=prompt("نام محصول:"); if(!product)return;
  const date=prompt("تاریخ کشت (مثلاً ۱۴۰۵/۰۶/۰۱):","")||"";
  const seedQty=num(prompt("مقدار بذر:","0"));
  state.crops.push({id:uid("crop"),landId,product,date,seedQty,seedUnit:"کیلو",createdAt:new Date().toISOString()});
  save();renderLand();
}
function txDialog(landId){
  const type=prompt("نوع: expense برای هزینه / income برای درآمد","expense"); if(!type)return;
  const title=prompt("عنوان:"); if(!title)return;
  const amount=num(prompt("مبلغ:","0"));
  state.transactions.push({id:uid("tx"),landId,type:type==="income"?"income":"expense",title,amount,date:new Date().toISOString().slice(0,10)});
  save();renderLand();
}
function consumeDialog(landId){
  if(!state.inventory.length){alert("ابتدا یک کالا در انبار ثبت کنید.");return;}
  const item=state.inventory[0];
  const id=prompt("شناسه کالا را وارد کنید:\n"+state.inventory.map(i=>`${i.id} — ${i.name}`).join("\n"),item.id);
  const i=state.inventory.find(x=>x.id===id); if(!i)return;
  const qty=num(prompt(`مقدار مصرف ${i.name}:`,"0")); if(qty<=0)return;
  if(qty>num(i.quantity)){alert("موجودی کافی نیست.");return;}
  const cost=num(i.unitPrice)*qty;
  i.quantity-=qty;
  state.transactions.push({id:uid("tx"),landId,type:"expense",title:`مصرف ${i.name}`,amount:cost,date:new Date().toISOString().slice(0,10),inventoryItemId:i.id,quantity:qty});
  save();renderLand();
}
function answerGeneral(q){
  const t=totals(), low=state.inventory.filter(i=>num(i.quantity)<=num(i.minQuantity));
  $("#assistantAnswer").innerHTML=`<h3>🤖 پاسخ</h3><p>${esc(q)}</p><p>هزینه کل ثبت‌شده: <strong>${money(t.cost)}</strong>؛ درآمد کل: <strong>${money(t.income)}</strong>.</p><p>${low.length?`اقلام کم‌موجودی: ${low.map(i=>esc(i.name)).join("، ")}.`:"در حال حاضر قلمی زیر حداقل موجودی ثبت‌شده نیست."}</p>`;
}
function answerLand(q){
  const l=land(selectedLandId), t=totalsForLand(l.id), crops=state.crops.filter(x=>x.landId===l.id);
  $("#landAssistantAnswer").innerHTML=`<div class="card"><h3>🤖 پاسخ</h3><p>${esc(q)}</p><p>زمین <strong>${esc(l.name)}</strong>: هزینه ${money(t.cost)}، درآمد ${money(t.income)}، سود/زیان ${money(t.profit)}.</p><p>تعداد سوابق کشت: ${crops.length}.</p></div>`;
}
function backup(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="yar-keshavarz-v3-backup.json";a.click();URL.revokeObjectURL(a.href);
}

document.addEventListener("click", e=>{
  const q=e.target.closest("[data-land-question]");
  if(q) answerLand(q.dataset.landQuestion);
});
setRoute("home");
