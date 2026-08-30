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
function num(v){
  if(v===null || v===undefined || v==="") return 0;
  let s=String(v)
    .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[٬،,\s]/g, "")
    .replace(/٫/g, ".");
  return Number(s)||0;
}
function formatMoneyInput(el){
  if(!el) return;
  const raw=String(el.value||"");
  const digits=raw.replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^0-9]/g,"");
  if(!digits){ el.value=""; return; }
  el.value=Number(digits).toLocaleString("en-US");
}

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
  else if(r==="measure") renderMeasure();
  else if(r==="land") renderLand();
  else renderHome();
  document.querySelectorAll(".bottom-nav [data-route]").forEach(b=>b.classList.toggle("active",b.dataset.route===r));
}

function renderHome(){
  title.textContent="خانه";
  const t=totals();
  const low=state.inventory.filter(i=>num(i.quantity)<=num(i.minQuantity));
  const totalArea=state.lands.reduce((a,x)=>a+num(x.area),0);
  app.innerHTML=`
  <section class="hero"><h2>سلام کشاورز عزیز 🌱</h2><p>به یار کشاورز خوش آمدید؛ مدیریت زمین، کشت، هزینه، انبار و تصمیم‌های مزرعه در یکجا.</p><button class="primary" data-route="add">＋ افزودن قطعه زمین</button></section>
  <div class="section-title"><h3>قطعه زمین‌های من</h3><button class="secondary" data-route="lands">مشاهده همه</button></div>
  <div class="list">${state.lands.length?state.lands.slice(0,3).map(l=>`<button class="card row" data-open-land="${l.id}"><span><strong>${esc(l.name)}</strong><small class="muted">${esc(l.region||"منطقه ثبت نشده")} · ${esc(l.crop||"محصول ثبت نشده")}</small></span><span class="badge">${num(l.area).toLocaleString("fa-IR")} ${esc(l.areaUnit||"هکتار")}</span></button>`).join(""):`<div class="empty card">هنوز زمینی ثبت نشده است.</div>`}</div>
  ${low.length?`<div class="section-title"><h3>🔔 هشدارهای مهم</h3></div><div class="alert">${low.map(i=>`🔔 ${esc(i.name)} رو به اتمام است — ${num(i.quantity)} ${esc(i.unit||"واحد")}`).join("<br>")}</div>`:""}
  <div class="section-title"><h3>خلاصه وضعیت مزرعه</h3></div>
  <div class="grid"><div class="card"><div class="muted">🌾 تعداد زمین</div><div class="metric">${state.lands.length.toLocaleString("fa-IR")}</div></div><div class="card"><div class="muted">📐 کل مساحت</div><div class="metric">${totalArea.toLocaleString("fa-IR")} هکتار</div></div><div class="card"><div class="muted">💰 هزینه کل</div><div class="metric">${money(t.cost)}</div></div><div class="card"><div class="muted">📈 درآمد کل</div><div class="metric">${money(t.income)}</div></div></div>
  <div class="card" style="background:linear-gradient(135deg,#eef7f1,#fff)"><div class="row"><div><h3>🤖 یار هوشمند کشاورز</h3><p class="muted">هر سؤالی درباره زمین‌ها، هزینه‌ها، انبار و کشت داری، بپرس.</p></div><button class="primary" data-route="assistant">گفتگو با یار</button></div></div>
  <div class="section-title"><h3>دسترسی سریع</h3></div><div class="grid"><button class="card" data-route="lands">🗺️<h3>زمین‌ها</h3></button><button class="card" data-route="inventory">📦<h3>انبار</h3></button><button class="card" data-route="measure">📐<h3>پیمایش زمین</h3></button><button class="card" data-route="assistant">🤖<h3>یار هوشمند</h3></button></div>`;
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
  app.innerHTML=`<div class="section-title"><h2>🗺️ زمین‌های من</h2><button class="primary" data-route="add">➕ زمین جدید</button></div>
  <div class="list">${state.lands.length?state.lands.map(l=>{
    const t=totalsForLand(l.id);
    return `<article class="card">
      <div class="row"><div><h3>${esc(l.name)}</h3><span class="badge">${l.ownership==="rent"?"🤝 اجاره‌ای":"🏠 مالک"}</span></div><strong>${num(l.area).toLocaleString("fa-IR")} ${esc(l.areaUnit||"هکتار")}</strong></div>
      <p class="muted">${esc(l.region||"منطقه ثبت نشده")} · ${esc(l.crop||"محصول ثبت نشده")}</p>
      <div class="row"><span>هزینه: ${money(t.cost)}</span><span>سود/زیان: ${money(t.profit)}</span></div>
      <div class="actions"><button class="primary" data-open-land="${l.id}">📁 پرونده زمین</button><button class="danger" data-delete-land="${l.id}">حذف</button></div>
    </article>`}).join(""):`<div class="empty card">هنوز زمینی ثبت نشده است.<br><br><button class="primary" data-route="add">اولین زمین را ثبت کن</button></div>`}</div>`;
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
    <div id="rentFields" class="card form rent-only" hidden><strong>اطلاعات اجاره</strong><div class="field"><label>نام مالک</label><input name="ownerName"></div><div class="field"><label>مبلغ اجاره</label><input name="rentAmount" class="money-input" inputmode="numeric" type="text" autocomplete="off" placeholder="مثلاً 16,000,000"></div><div class="field"><label>مدت اجاره</label><input name="rentPeriod" placeholder="مثلاً یک سال"></div></div>
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
    overview:`<div class="land-summary">
      <div class="summary-box"><div class="muted">📐 مساحت زمین</div><strong>${num(l.area).toLocaleString("fa-IR")} ${esc(l.areaUnit||"هکتار")}</strong><small class="muted">${Math.round(num(l.area)*10000).toLocaleString("fa-IR")} مترمربع</small></div>
      <div class="summary-box weather-mini"><div class="muted">🌦️ آب‌وهوای این زمین</div><strong>${l.lat?"موقعیت ثبت شده":"هنوز ثبت نشده"}</strong><small class="muted">${l.lat?"آماده دریافت پیش‌بینی":"از بخش آب‌وهوا ثبت کن"}</small></div>
      <div class="summary-box"><div class="muted">💰 هزینه</div><strong>${money(t.cost)}</strong></div>
      <div class="summary-box"><div class="muted">📈 سود/زیان</div><strong>${money(t.profit)}</strong></div>
    </div>
    <div class="actions"><button class="primary" data-land-tab="weather">🌦️ آب‌وهوای این زمین</button><button class="secondary" data-land-tab="assistant">🤖 یار هوشمند این زمین</button></div>
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
  app.innerHTML=`<section class="land-head"><div class="row"><div><h2>${esc(l.name)}</h2><span class="badge">${l.ownership==="rent"?"🤝 اجاره‌ای":"🏠 مالک"}</span></div><button class="secondary" data-route="lands">بازگشت</button></div><p>پرونده کامل این قطعه؛ متراژ، موقعیت، آب‌وهوا، کشت، مالی و یار هوشمند.</p></section>
  <div class="tabs">${["overview","crops","finance","calculator","inventory","suggestions","weather","assistant"].map(x=>`<button class="${x===landTab?"active":""}" data-land-tab="${x}">${tabLabel(x)}</button>`).join("")}</div>
  ${content}`;
}
function detail(k,v){return `<div class="row"><span class="muted">${k}</span><strong>${esc(v||"ثبت نشده")}</strong></div>`}
function tabLabel(x){return ({overview:"📋 مشخصات",crops:"🌱 کشت",finance:"💰 مالی",calculator:"🧮 محاسبه",inventory:"📦 انبار",suggestions:"🌾 پیشنهاد",weather:"🌦️ آب‌وهوا",assistant:"🤖 یار"})[x];}

function calculator(l){
  return `<div class="card"><h3>🧮 محاسبه‌گر حرفه‌ای</h3>
  <p class="muted">زمین: ${esc(l.name)} · ${num(l.area)} ${esc(l.areaUnit||"هکتار")} · ${l.ownership==="rent"?"اجاره‌ای":"مالک"}</p>
  <form id="calcForm" class="form">
  ${["بذر","کود","سم","آب","کارگر","سوخت","روغن","ماشین‌آلات","اجاره زمین","سایر"].map((x,i)=>`<div class="field"><label>${x}</label><input name="c${i}" class="money-input" inputmode="numeric" type="text" autocomplete="off" value="${x==="اجاره زمین"&&l.ownership!=="rent"?"0":""}"></div>`).join("")}
  <div class="field"><label>مقدار تولید مورد انتظار</label><input name="production" type="number" min="0" step="0.01"></div>
  <div class="field"><label>قیمت فروش هر واحد</label><input name="salePrice" class="money-input" inputmode="numeric" type="text" autocomplete="off" placeholder="مثلاً 16,000,000"></div>
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
  const l=land(id); if(!l)return;
  const box=$("#weatherBox");
  if(box)box.innerHTML='<span class="muted">در حال دریافت آب‌وهوا...</span>';
  const useSaved=Number.isFinite(num(l.lat))&&Number.isFinite(num(l.lon));
  const fetchWeather=async(lat,lon)=>{
    l.lat=lat; l.lon=lon; save();
    try{
      const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code&forecast_days=16&timezone=auto`;
      const r=await fetch(url); if(!r.ok)throw new Error(); const d=await r.json(); const c=d.current;
      const days=(d.daily?.time||[]).slice(0,7).map((day,i)=>`<div class="weather-day"><small>${esc(day)}</small><strong>${d.daily.temperature_2m_max[i]}° / ${d.daily.temperature_2m_min[i]}°</strong><span>🌧️ ${d.daily.precipitation_probability_max[i]??0}%</span></div>`).join('');
      if(box)box.innerHTML=`<div class="grid"><div class="card"><div class="muted">🌡️ دما</div><strong class="metric">${c.temperature_2m}°</strong></div><div class="card"><div class="muted">💧 رطوبت</div><strong class="metric">${c.relative_humidity_2m}%</strong></div><div class="card"><div class="muted">💨 باد</div><strong class="metric">${c.wind_speed_10m}</strong></div><div class="card"><div class="muted">🌧️ بارش</div><strong class="metric">${c.precipitation}</strong></div></div><h4>پیش‌بینی ۷ روز آینده</h4><div class="weather-days">${days}</div><p class="muted">مختصات زمین: ${lat.toFixed(5)}, ${lon.toFixed(5)} · پیش‌بینی سرویس برای این مختصات</p>`;
    }catch(e){if(box)box.innerHTML='<div class="alert">آب‌وهوای زنده دریافت نشد. اتصال اینترنت را بررسی کن.</div>';}
  };
  if(useSaved){fetchWeather(num(l.lat),num(l.lon)); return;}
  if(!navigator.geolocation){if(box)box.innerHTML='<div class="alert">GPS در این دستگاه در دسترس نیست.</div>';return;}
  if(box)box.innerHTML='<span class="muted">برای ثبت موقعیت این زمین، GPS را فعال کن...</span>';
  navigator.geolocation.getCurrentPosition(pos=>fetchWeather(pos.coords.latitude,pos.coords.longitude),()=>{if(box)box.innerHTML='<div class="alert">اجازه Location داده نشد. موقعیت مکانی گوشی را فعال کن.</div>';},{enableHighAccuracy:true,timeout:15000,maximumAge:0});
}

function renderInventory(){
  title.textContent="انبار";
  app.innerHTML=`<div class="section-title"><h2>📦 انبار حرفه‌ای</h2><button class="primary" data-add-item>➕ کالا</button></div>
  <div class="grid"><div class="card"><div class="muted">اقلام</div><div class="metric">${state.inventory.length}</div></div><div class="card"><div class="muted">کمبود</div><div class="metric">${state.inventory.filter(i=>num(i.quantity)<=num(i.minQuantity)).length}</div></div></div>
  <div class="section-title"><h3>موجودی</h3></div><div class="list">${state.inventory.length?state.inventory.map(i=>`<div class="card"><div class="row"><strong>${esc(i.name)}</strong><span class="badge">${esc(i.category||"سایر")}</span></div><div class="row"><span>${num(i.quantity)} ${esc(i.unit||"واحد")} · حداقل ${num(i.minQuantity)}</span><div class="actions"><button class="secondary" data-stock="${i.id}">ورود/مصرف</button></div></div></div>`).join(""):`<div class="empty card">هنوز کالایی در انبار ثبت نشده است.</div>`}</div>`;
}

function renderAssistant(){
  title.textContent="یار هوشمند";
  app.innerHTML=`<section class="hero"><h2>🤖 یار هوشمند</h2><p>سؤال خودت را بنویس. یار از اطلاعات ثبت‌شده همین برنامه پاسخ می‌دهد.</p></section>
  <div class="card form"><div class="field"><label>سؤال شما</label><input id="aiQuestion" placeholder="مثلاً برای کدام زمین بیشترین هزینه را داشته‌ام؟"></div><button class="primary" data-ask-ai>پرسیدن از یار 🤖</button></div>
  <div class="card"><h3>سؤال‌های آماده</h3><div class="actions">${["برای کدام زمین بیشترین هزینه را داشته‌ام؟","چه چیزهایی از انبار کم دارم؟","وضعیت سود زمین‌ها چطور است؟","مجموع هزینه‌ها چقدر است؟"].map(q=>`<button class="secondary" data-question="${esc(q)}">${esc(q)}</button>`).join("")}</div></div>
  <div id="assistantAnswer" class="card"><p class="muted">سؤال خودت را بنویس و روی «پرسیدن از یار» بزن.</p></div>`;
}
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
function askAI(){ const input=$("#aiQuestion"); if(!input)return; const q=input.value; $("#assistantAnswer").innerHTML=`<h3>🤖 پاسخ یار</h3><p>${generateAnswer(q)}</p>`; }
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
  if(e.target.closest("[data-ask-ai]")){askAI();return;}
  const suggest=e.target.closest("[data-calc-suggestions]");
  if(suggest) alert("برای پیشنهاد دقیق محصول، منبع معتبر آب‌وهوا/بازار باید متصل شود؛ فعلاً از نمایش عدد ساختگی خودداری می‌کنیم.");
});

document.addEventListener("keydown", e=>{ if(e.key==="Enter" && e.target.id==="aiQuestion"){e.preventDefault();askAI();} });
document.addEventListener("input", e=>{
  if(e.target.classList.contains("money-input")) formatMoneyInput(e.target);
});

document.addEventListener("focusin", e=>{
  if(e.target.classList.contains("money-input")) formatMoneyInput(e.target);
});

document.addEventListener("change", e=>{
  if(e.target.name==="ownership"){const rent=e.target.value==="rent";$("#rentFields").hidden=!rent; if(!rent){["ownerName","rentAmount","rentPeriod"].forEach(n=>{const el=document.querySelector(`[name="${n}"]`);if(el)el.value="";});}}
});
document.addEventListener("submit", e=>{
  e.preventDefault();
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

function addInventoryItem(){
  const name=prompt("نام کالا:"); if(!name)return;
  const category=prompt("دسته (بذر/کود/سم/سوخت/روغن/ابزار/قطعه/سایر):","سایر")||"سایر";
  const unit=prompt("واحد:","کیلو")||"واحد";
  const quantity=num(prompt("موجودی اولیه:","0"));
  const minQuantity=num(prompt("حداقل موجودی:","0"));
  state.inventory.push({id:uid("item"),name,category,unit,quantity,minQuantity,createdAt:new Date().toISOString()});
  save();renderInventory();
}
function stockDialog(id){
  const i=state.inventory.find(x=>x.id===id); if(!i)return;
  const type=prompt("برای ورود عدد مثبت و برای مصرف عدد منفی وارد کنید:", "0");
  if(type===null)return; const delta=num(type); i.quantity=Math.max(0,num(i.quantity)+delta);
  save();renderInventory();
}
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
