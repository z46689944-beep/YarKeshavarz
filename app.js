/* یار کشاورز ۳ — بازسازی یکپارچه بر پایه نسخه ۰.۲
   داده‌ها محلی ذخیره می‌شوند و ساختار برای اتصال آینده به سرویس‌های واقعی آماده است. */

const KEY = "yk-v03";
const LEGACY_KEYS = ["yk-v02"];
const $ = s => document.querySelector(s);
const title = $("#pageTitle");

// Bootstrap the app shell so the project also works when index.html is minimal.
if(!document.querySelector("header")){
  document.body.innerHTML = `
    <div class="app-shell">
      <header class="topbar"><div><span class="eyebrow">دستیار هوشمند مزرعه</span><b id="pageTitle">یار کشاورز</b></div><button class="profile-btn" data-route="profile" aria-label="پروفایل">👨‍🌾</button></header>
      <main id="app"></main>
      <input id="restoreInput" type="file" accept="application/json" hidden>
      <nav class="bottom-nav">
        <button data-route="home">⌂<small>خانه</small></button>
        <button data-route="lands">▦<small>زمین‌ها</small></button>
        <button data-route="news">◈<small>اخبار</small></button>
        <button data-route="ads">◇<small>بازار</small></button>
        <button data-route="assistant">✦<small>یار</small></button>
      </nav>
    </div>`;
}
const app = $("#app");
const titleEl = $("#pageTitle");

const defaultState = {
  version: "3.0",
  lands: [],
  inventory: [],
  transactions: [],
  crops: [],
  sales: [],
  implements: [],
  alerts: [],
  settings: { currency: "تومان" },
  profile: {name:"", email:"", phone:"", region:"", crop:""}
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
  else if(r==="measure") renderMeasure();
  else if(r==="news") renderNews();
  else if(r==="ads") renderAds();
  else if(r==="profile") renderProfile();
  else if(r==="land") renderLand();
  else renderHome();
  document.querySelectorAll(".bottom-nav [data-route]").forEach(b=>b.classList.toggle("active",b.dataset.route===r));
}

function renderHome(){
  titleEl.textContent="خانه";
  const t=totals();
  const low=state.inventory.filter(i=>num(i.quantity)<=num(i.minQuantity));
  app.innerHTML=`
  <section class="hero hero-photo"><div><span class="eyebrow">یار کشاورز • دستیار مزرعه</span><h2>سلام، ${esc(state.profile.name||"کشاورز عزیز")} 🌾</h2><p>مدیریت زمین، کشت، آب‌وهوا، انبار و امور مزرعه در یکجا.</p></div></section>
  <div class="grid">
    <div class="card"><div class="muted">زمین‌ها</div><div class="metric">${state.lands.length}</div></div>
    <div class="card"><div class="muted">مجموع مساحت</div><div class="metric">${state.lands.reduce((a,x)=>a+num(x.area),0).toLocaleString("fa-IR")}</div></div>
    <div class="card"><div class="muted">هزینه</div><div class="metric">${money(t.cost)}</div></div>
    <div class="card"><div class="muted">درآمد</div><div class="metric">${money(t.income)}</div></div>
  </div>
  <div class="section-title"><h3>دسترسی سریع</h3></div>
  <div class="grid">
    <button class="card" data-route="lands">🗺️<h3>زمین‌های من</h3></button>
    <button class="card" data-route="inventory">📦<h3>انبار</h3></button>
    <button class="card" data-route="add">➕<h3>ثبت اطلاعات</h3></button>
    <button class="card" data-route="assistant">🤖<h3>یار هوشمند</h3></button>
  </div>
  ${low.length?`<div class="section-title"><h3>🔔 هشدار انبار</h3></div><div class="list">${low.map(i=>`<div class="alert">${esc(i.name)} — موجودی ${num(i.quantity)} ${esc(i.unit||"واحد")}</div>`).join("")}</div>`:""}
  <div class="section-title"><h3>آخرین فعالیت‌ها</h3></div>
  <div class="list">${recentActivity()}</div>`;
}
function recentActivity(){
  const all=[
    ...state.transactions.map(x=>({...x,label:x.type==="expense"?"هزینه":"درآمد",text:x.title,amount:x.amount,date:x.date})),
    ...state.crops.map(x=>({label:"کشت",text:x.product,amount:0,date:x.date}))
  ].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5);
  return all.length?all.map(x=>`<div class="card row"><span>${esc(x.label)} — ${esc(x.text)}</span><strong>${x.amount?money(x.amount):""}</strong></div>`).join(""):`<div class="empty">هنوز فعالیتی ثبت نشده است.</div>`;
}

function renderLands(){
  titleEl.textContent="زمین‌های من";
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
  titleEl.textContent="ثبت زمین";
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
  titleEl.textContent=l.name;
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
  app.innerHTML=`<div class="card"><div class="row"><div><h2>${esc(l.name)}</h2><span class="badge">${l.ownership==="rent"?"🤝 اجاره‌ای":"🏠 مالک"}</span></div><button class="secondary" data-route="lands">بازگشت</button></div></div>
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
  titleEl.textContent="اندازه‌گیری حرفه‌ای زمین";
  app.innerHTML=`
    <section class="measure-hero">
      <div><span class="eyebrow">اندازه‌گیری دقیق</span><h2>زمین را روی نقشه پیدا کن</h2><p>بدون راه رفتن دور زمین، مرز را روی نقشه مشخص کن؛ یا با GPS پیمایش کن.</p></div>
      <div class="measure-icon">⌖</div>
    </section>
    <div class="measure-modes">
      <button class="mode-btn active" data-measure-mode="map">⌖<span>نقشه</span><small>انتخاب گوشه‌ها</small></button>
      <button class="mode-btn" data-measure-mode="gps">◉<span>پیمایش GPS</span><small>حرکت دور زمین</small></button>
      <button class="mode-btn" data-measure-mode="hybrid">↗<span>ترکیبی</span><small>نقشه + GPS</small></button>
    </div>
    <div class="card measure-panel">
      <div class="map-tools">
        <div class="search-row"><input id="placeSearch" placeholder="نام روستا، شهر یا مکان زمین..." autocomplete="off"><button class="secondary" data-search-place>جستجو</button></div>
        <div class="tool-row"><button class="secondary" data-map-type="sat">🛰️ ماهواره</button><button class="secondary" data-gps-center>◎ موقعیت من</button><button class="secondary" data-clear-points>پاک کردن</button></div>
      </div>
      <div id="map" class="map professional-map"></div>
      <div class="measure-stats">
        <div><span>مساحت</span><strong id="measureArea">۰</strong><small>هکتار</small></div>
        <div><span>مترمربع</span><strong id="measureSqm">۰</strong><small>m²</small></div>
        <div><span>محیط</span><strong id="measurePerimeter">۰</strong><small>متر</small></div>
        <div><span>نقاط</span><strong id="measureCount">۰</strong><small>نقطه</small></div>
      </div>
      <div class="measure-actions"><button class="primary" data-start-gps>▶ شروع پیمایش</button><button class="primary" data-finish-gps hidden>■ پایان پیمایش</button><button class="secondary" data-use-area>استفاده از مساحت</button></div>
      <div id="measureResult" class="alert">برای حالت نقشه، روی گوشه‌های زمین لمس کن.</div>
    </div>
    <div class="card"><h3>💡 راهنمای سریع</h3><p class="muted">نقشه: گوشه‌ها را لمس کن. GPS: شروع را بزن و دور زمین حرکت کن. ترکیبی: هر دو روش را در یک مرز استفاده کن.</p></div>`;
  measureMode='map'; measurePoints=[]; measuredHectares=0; gpsPath=[]; gpsWatch=null;
  setTimeout(initMap,0);
}
let measureMap=null, measurePoints=[], measureLayer=null, measurePolygon=null, measuredHectares=0;
let measureMode='map', gpsWatch=null, gpsPath=[], gpsPolyline=null, satelliteLayer=null, baseLayer=null;
function initMap(){
  if(typeof L==='undefined'){ $('#measureResult').textContent='نقشه بارگذاری نشد؛ اینترنت را بررسی کن.'; return; }
  measureMap=L.map('map',{zoomControl:false}).setView([35.7,51.4],12);
  L.control.zoom({position:'bottomright'}).addTo(measureMap);
  baseLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(measureMap);
  satelliteLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © Esri'});
  measureLayer=L.layerGroup().addTo(measureMap);
  measureMap.on('click', e=>{ if(measureMode==='map'||measureMode==='hybrid') addMeasurePoint(e.latlng.lat,e.latlng.lng); });
}
function addMeasurePoint(lat,lng){
  measurePoints.push([lat,lng]);
  const m=L.marker([lat,lng],{draggable:true}).addTo(measureLayer); m._ykIndex=measurePoints.length-1;
  m.on('dragend',()=>{const p=m.getLatLng();measurePoints[m._ykIndex]=[p.lat,p.lng];updateMeasure();});
  updateMeasure();
}
function updateMeasure(){
  if(!measureMap)return;
  if(measurePolygon) measureMap.removeLayer(measurePolygon);
  if(measurePoints.length>=3){
    measurePolygon=L.polygon(measurePoints,{weight:3,fillOpacity:.18}).addTo(measureMap);
    const sqm=polygonArea(measurePoints), ha=sqm/10000, per=polygonPerimeter(measurePoints); measuredHectares=ha;
    $('#measureArea').textContent=ha.toLocaleString('fa-IR',{maximumFractionDigits:3});
    $('#measureSqm').textContent=Math.round(sqm).toLocaleString('fa-IR');
    $('#measurePerimeter').textContent=Math.round(per).toLocaleString('fa-IR');
    $('#measureCount').textContent=measurePoints.length.toLocaleString('fa-IR');
    $('#measureResult').innerHTML=`مساحت نهایی <strong>${ha.toLocaleString('fa-IR',{maximumFractionDigits:3})} هکتار</strong> است.`;
  }else{
    $('#measureArea').textContent='۰'; $('#measureSqm').textContent='۰'; $('#measurePerimeter').textContent='۰'; $('#measureCount').textContent=measurePoints.length.toLocaleString('fa-IR');
    $('#measureResult').textContent=`${measurePoints.length.toLocaleString('fa-IR')} نقطه ثبت شده؛ حداقل ۳ نقطه لازم است.`;
  }
}
function polygonPerimeter(points){let d=0;for(let i=0;i<points.length;i++){d+=distanceMeters(points[i],points[(i+1)%points.length]);}return d;}
function distanceMeters(a,b){const R=6371008.8,p=Math.PI/180,lat1=a[0]*p,lat2=b[0]*p,dl=(b[0]-a[0])*p,dlo=(b[1]-a[1])*p;const x=Math.sin(dl/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dlo/2)**2;return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function clearMeasure(){stopGps();measurePoints=[];gpsPath=[];if(measureLayer)measureLayer.clearLayers();if(measurePolygon){measureMap.removeLayer(measurePolygon);measurePolygon=null;}if(gpsPolyline){measureMap.removeLayer(gpsPolyline);gpsPolyline=null;}updateMeasure();$('#measureResult').textContent='مرز پاک شد. یک روش اندازه‌گیری انتخاب کن.';}
function locateUser(){if(!navigator.geolocation){alert('GPS در این مرورگر در دسترس نیست.');return;}navigator.geolocation.getCurrentPosition(pos=>{if(measureMap)measureMap.setView([pos.coords.latitude,pos.coords.longitude],17);},()=>alert('دسترسی به موقعیت داده نشد.'),{enableHighAccuracy:true,timeout:15000,maximumAge:0});}
function startGps(){
  if(!navigator.geolocation){alert('GPS در این مرورگر در دسترس نیست.');return;}
  measureMode = measureMode==='map'?'gps':measureMode; gpsPath=[];
  $('#start-gps').hidden=true; $('#finish-gps').hidden=false;
  gpsWatch=navigator.geolocation.watchPosition(pos=>{const p=[pos.coords.latitude,pos.coords.longitude];gpsPath.push(p);if(measureMap){measureMap.setView(p,Math.max(measureMap.getZoom(),17));}if(gpsPolyline)measureMap.removeLayer(gpsPolyline);gpsPolyline=L.polyline(gpsPath,{weight:4}).addTo(measureMap);if(measureMode==='gps') {measurePoints=gpsPath.slice(); updateMeasure();}},err=>{$('#measureResult').textContent='دسترسی GPS برقرار نشد؛ Location گوشی را روشن کن.';},{enableHighAccuracy:true,maximumAge:1000,timeout:10000});
}
function stopGps(){if(gpsWatch!==null){navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null;}const b=$('[data-start-gps]'),f=$('[data-finish-gps]');if(b)b.hidden=false;if(f)f.hidden=true;if(gpsPath.length>=3){measurePoints=gpsPath.slice();updateMeasure();}}
async function searchPlace(){const q=($('#placeSearch')?.value||'').trim();if(!q)return;$('#measureResult').textContent='در حال پیدا کردن مکان...';try{const r=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q='+encodeURIComponent(q),{headers:{'Accept':'application/json'}});const d=await r.json();if(!d.length){$('#measureResult').textContent='مکان پیدا نشد. نام روستا/شهر یا مختصات را دقیق‌تر وارد کن.';return;}if(d.length>1){const pick=d.map((x,i)=>`${i+1}. ${x.display_name}`).join('\n');const choice=prompt('چند مکان پیدا شد؛ شماره مکان را انتخاب کن:\n'+pick,'1');const idx=Math.max(0,Math.min(d.length-1,num(choice)-1));measureMap.setView([+d[idx].lat,+d[idx].lon],17);$('#measureResult').textContent='مکان پیدا شد؛ حالا روی گوشه‌های زمین لمس کن.';}else{measureMap.setView([+d[0].lat,+d[0].lon],17);$('#measureResult').textContent='مکان پیدا شد؛ حالا روی گوشه‌های زمین لمس کن.';}}catch(e){$('#measureResult').textContent='جستجوی مکان انجام نشد؛ اتصال اینترنت را بررسی کن.';}}
function toggleSatellite(){if(!measureMap)return;if(measureMap.hasLayer(satelliteLayer)){measureMap.removeLayer(satelliteLayer);baseLayer.addTo(measureMap);}else{measureMap.removeLayer(baseLayer);satelliteLayer.addTo(measureMap);}}
function useMeasuredArea(){if(measuredHectares<=0){alert('ابتدا مرز زمین را کامل کن.');return;}localStorage.setItem('yk-v03-measured-area',String(measuredHectares));setRoute('add');setTimeout(()=>{const f=$('#landArea');if(f){f.value=measuredHectares.toFixed(3);f.focus();}},50);}

function polygonArea(points){
  const R=6378137, lat0=points.reduce((a,p)=>a+p[0],0)/points.length*Math.PI/180;
  const xy=points.map(p=>[R*p[1]*Math.PI/180*Math.cos(lat0),R*p[0]*Math.PI/180]);
  let a=0; for(let i=0;i<xy.length;i++){const j=(i+1)%xy.length;a+=xy[i][0]*xy[j][1]-xy[j][0]*xy[i][1];} return Math.abs(a)/2;
}
function weatherForLand(id){const l=land(id);if(!l)return;if(!navigator.geolocation){alert('GPS در این مرورگر در دسترس نیست.');return;}const box=$('#weatherBox');if(box)box.innerHTML='<span class="muted">در حال دریافت موقعیت...</span>';navigator.geolocation.getCurrentPosition(async pos=>{l.lat=pos.coords.latitude;l.lon=pos.coords.longitude;save();if(box)box.innerHTML='<span class="muted">در حال دریافت آب‌وهوای زنده...</span>';try{const url=`https://api.open-meteo.com/v1/forecast?latitude=${l.lat}&longitude=${l.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto`;const r=await fetch(url);if(!r.ok)throw new Error();const d=await r.json();const c=d.current;box.innerHTML=`<div class="grid"><div class="card">🌡️ دما<strong class="metric">${c.temperature_2m}°</strong></div><div class="card">💧 رطوبت<strong class="metric">${c.relative_humidity_2m}%</strong></div><div class="card">💨 باد<strong class="metric">${c.wind_speed_10m}</strong></div><div class="card">🌧️ بارش<strong class="metric">${c.precipitation}</strong></div></div><p class="muted">مختصات: ${l.lat.toFixed(5)}, ${l.lon.toFixed(5)}</p>`;}catch(e){box.innerHTML='<div class="alert">آب‌وهوای زنده دریافت نشد. اتصال اینترنت را بررسی کن.</div>';}} ,err=>{if(box)box.innerHTML='<div class="alert">اجازه دسترسی به موقعیت داده نشد. Location گوشی را روشن و اجازه مرورگر را فعال کن.</div>';},{enableHighAccuracy:true,timeout:15000,maximumAge:0});}

function renderInventory(){
  titleEl.textContent="انبار";
  const low=state.inventory.filter(i=>num(i.quantity)<=num(i.minQuantity));
  app.innerHTML=`<div class="section-title"><div><span class="eyebrow">مدیریت موجودی</span><h2>انبار من</h2></div><button class="primary" data-add-item>➕ افزودن کالا</button></div>
  <div class="grid inventory-summary"><div class="card"><div class="muted">کل اقلام</div><div class="metric">${state.inventory.length}</div></div><div class="card"><div class="muted">نیاز به تأمین</div><div class="metric">${low.length}</div></div></div>
  <div class="list">${state.inventory.length?state.inventory.map(i=>`<article class="card inventory-card"><div class="row"><div><strong>${esc(i.name)}</strong><span class="badge">${esc(i.category||"سایر")}</span></div><strong class="stock-number">${num(i.quantity).toLocaleString('fa-IR')} <small>${esc(i.unit||"واحد")}</small></strong></div><div class="stock-actions"><button class="stock-btn in" data-stock-in="${i.id}">＋ ورود</button><button class="stock-btn out" data-stock-out="${i.id}">− مصرف</button></div><div class="inventory-meta">حداقل موجودی: ${num(i.minQuantity).toLocaleString('fa-IR')} ${esc(i.unit||"واحد")}${num(i.quantity)<=num(i.minQuantity)?`<span class="low-badge">نیاز به تأمین</span>`:''}</div></article>`).join(""):`<div class="empty card"><div class="empty-icon">📦</div><h3>انبار هنوز خالی است</h3><p>اولین کالا را اضافه کن تا موجودی مزرعه را مدیریت کنی.</p><button class="primary" data-add-item>➕ افزودن اولین کالا</button></div>`}</div>`;
}

function inventoryForm(type,id){
  const i=state.inventory.find(x=>x.id===id); if(!i)return;
  const title=type==='in'?'ورود به انبار':'مصرف از انبار';
  const qty=prompt(`${title} — ${i.name}\nمقدار ${i.unit||'واحد'} را وارد کن:`,`1`);
  if(qty===null)return; const n=num(qty); if(n<=0)return;
  if(type==='out' && n>num(i.quantity)){alert('موجودی کافی نیست.');return;}
  i.quantity = type==='in' ? num(i.quantity)+n : Math.max(0,num(i.quantity)-n);
  save(); renderInventory();
}

function renderNews(){
  titleEl.textContent="اخبار";
  const news=[
    {t:"راهنمای مدیریت آبیاری در روزهای گرم",d:"نکات کاربردی برای کاهش مصرف آب و حفظ سلامت محصول.",tag:"آبیاری",img:"https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1000&q=80"},
    {t:"چطور هزینه‌های مزرعه را دقیق‌تر ثبت کنیم؟",d:"با ثبت هزینه‌ها به تفکیک زمین، سود واقعی هر قطعه را ببین.",tag:"مدیریت",img:"https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80"},
    {t:"اهمیت پایش خاک و تغذیه محصول",d:"چند نکته ساده برای تصمیم‌گیری بهتر درباره کوددهی.",tag:"آموزش",img:"https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=80"}
  ];
  app.innerHTML=`<div class="section-title"><div><span class="eyebrow">دانش و اطلاع‌رسانی</span><h2>📰 اخبار کشاورزی</h2></div></div><div class="news-grid">${news.map(n=>`<article class="news-card"><img src="${n.img}" alt=""><div class="news-body"><span class="badge">${n.tag}</span><h3>${n.t}</h3><p>${n.d}</p><button class="secondary" data-news-open="${esc(n.t)}">مطالعه خبر ←</button></div></article>`).join('')}</div>`;
}
function renderAds(){
  titleEl.textContent="بازار";
  const ads=[
    {t:"بذر اصلاح‌شده گندم",cat:"بذر",desc:"مناسب کشت پاییزه و شرایط متنوع مزرعه.",price:"استعلام قیمت",img:"https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1000&q=80"},
    {t:"تجهیزات آبیاری قطره‌ای",cat:"آبیاری",desc:"راهکارهای کم‌مصرف برای زمین‌های کشاورزی.",price:"مشاهده آگهی",img:"https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1000&q=80"},
    {t:"خدمات ماشین‌آلات کشاورزی",cat:"خدمات",desc:"معرفی خدمات محلی برای آماده‌سازی و برداشت.",price:"مشاهده آگهی",img:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80"}
  ];
  app.innerHTML=`<div class="section-title"><div><span class="eyebrow">خدمات و پیشنهادها</span><h2>📢 بازار کشاورزی</h2></div><button class="secondary" data-ad-post>ثبت آگهی</button></div><div class="ads-grid">${ads.map(a=>`<article class="ad-card"><img src="${a.img}" alt=""><div class="ad-body"><span class="badge">${a.cat}</span><h3>${a.t}</h3><p>${a.desc}</p><div class="row"><strong>${a.price}</strong><button class="primary" data-ad-open="${esc(a.t)}">مشاهده</button></div></div></article>`).join('')}</div>`;
}
function renderProfile(){
  titleEl.textContent="پروفایل کشاورز";
  const p=state.profile||{}; const area=state.lands.reduce((a,x)=>a+num(x.area),0);
  app.innerHTML=`<section class="profile-hero"><div class="profile-avatar">${p.name?esc(p.name.trim().slice(0,1)):'👨‍🌾'}</div><div><span class="eyebrow">حساب کشاورز</span><h2>${esc(p.name||'پروفایل من')}</h2><p>${esc(p.email||'ایمیل خود را برای اتصال حساب ثبت کن')}</p></div></section>
  <div class="grid"><div class="card"><div class="muted">زمین‌ها</div><div class="metric">${state.lands.length.toLocaleString('fa-IR')}</div></div><div class="card"><div class="muted">مجموع مساحت</div><div class="metric">${area.toLocaleString('fa-IR')}</div><span class="muted">هکتار</span></div></div>
  <form id="profileForm" class="card form"><h3>اطلاعات پروفایل</h3><div class="field"><label>نام و نام خانوادگی</label><input name="profileName" value="${esc(p.name||'')}" placeholder="مثلاً علی احمدی"></div><div class="field"><label>ایمیل</label><input name="profileEmail" type="email" value="${esc(p.email||'')}" placeholder="example@email.com"></div><div class="field"><label>شماره تلفن</label><input name="profilePhone" value="${esc(p.phone||'')}" placeholder="09..."></div><div class="field"><label>شهر / منطقه</label><input name="profileRegion" value="${esc(p.region||'')}" placeholder="روستا یا شهرستان"></div><div class="field"><label>محصول اصلی</label><input name="profileCrop" value="${esc(p.crop||'')}" placeholder="گندم، جو، باغ..." ></div><button class="primary">💾 ذخیره پروفایل</button></form>
  <div class="card"><h3>☁️ حساب و همگام‌سازی</h3><p class="muted">این نسخه اطلاعات را روی همین دستگاه ذخیره می‌کند. برای ورود با ایمیل و همگام‌سازی بین گوشی‌ها، مرحلهٔ بعدی نیازمند سرویس احراز هویت و پایگاه دادهٔ آنلاین است.</p></div>`;
}
function renderAssistant(){
  titleEl.textContent="یار هوشمند";
  app.innerHTML=`<section class="hero assistant-hero"><span class="eyebrow">دستیار مزرعه</span><h2>یار، آمادهٔ کمک به توست</h2><p>درباره زمین‌ها، انبار، هزینه‌ها و کارهای مزرعه سؤال بپرس.</p></section>
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
  if(e.target.closest("[data-gps-center]")){locateUser();return;}
  if(e.target.closest("[data-start-gps]")){startGps();return;}
  if(e.target.closest("[data-finish-gps]")){stopGps();return;}
  if(e.target.closest("[data-search-place]")){searchPlace();return;}
  if(e.target.closest("[data-map-type]")){toggleSatellite();return;}
  const mm=e.target.closest("[data-measure-mode]"); if(mm){measureMode=mm.dataset.measureMode;document.querySelectorAll("[data-measure-mode]").forEach(x=>x.classList.toggle("active",x===mm)); if(measureMode!=="gps" && gpsPath.length){measurePoints=gpsPath.slice();updateMeasure();} return;}
  if(e.target.closest("[data-clear-points]")){clearMeasure();return;}
  if(e.target.closest("[data-use-area]")){useMeasuredArea();return;}
  const weather=e.target.closest("[data-weather]"); if(weather){weatherForLand(weather.dataset.weather);return;}
  const newsOpen=e.target.closest("[data-news-open]"); if(newsOpen){alert(newsOpen.dataset.newsOpen+"\n\nاین خبر در نسخهٔ آزمایشی برای تست رابط کاربری نمایش داده شده است.");return;}
  const adOpen=e.target.closest("[data-ad-open]"); if(adOpen){alert(adOpen.dataset.adOpen+"\n\nاین آگهی نمونه است و در نسخهٔ آزمایشی فقط رابط بازار را نمایش می‌دهد.");return;}
  if(e.target.closest("[data-ad-post]")){alert("ثبت آگهی در نسخهٔ بعدی به پنل فروشنده و مدیریت آگهی متصل می‌شود.");return;}
  const addItem=e.target.closest("[data-add-item]");
  if(addItem) addInventoryItem();
  const stockIn=e.target.closest("[data-stock-in]"); if(stockIn){inventoryForm("in",stockIn.dataset.stockIn);return;}
  const stockOut=e.target.closest("[data-stock-out]"); if(stockOut){inventoryForm("out",stockOut.dataset.stockOut);return;}
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
document.addEventListener("change", e=>{
  if(e.target.name==="ownership"){const rent=e.target.value==="rent";$("#rentFields").hidden=!rent; if(!rent){["ownerName","rentAmount","rentPeriod"].forEach(n=>{const el=document.querySelector(`[name="${n}"]`);if(el)el.value="";});}}
});
document.addEventListener("submit", e=>{
  e.preventDefault();
  if(e.target.id==="profileForm"){const f=new FormData(e.target);state.profile={name:f.get("profileName")||"",email:f.get("profileEmail")||"",phone:f.get("profilePhone")||"",region:f.get("profileRegion")||"",crop:f.get("profileCrop")||""};save();renderProfile();return;}
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
