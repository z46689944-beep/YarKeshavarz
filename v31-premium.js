
(function(){
"use strict";
const $=id=>document.getElementById(id);
function section(id,html){if($(id))return;const host=$("app");if(!host)return;const s=document.createElement("section");s.id=id;s.className="v31-section";s.innerHTML=html;host.appendChild(s);return s}
function icons(){
const svg=(p)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const data=[
["زمین",svg('<path d="M3 20h18M5 20l2-10 5 3 3-7 4 14"/><path d="M8 10l4 3M15 6l3 2"/>')],
["هوا",svg('<path d="M5 17h12a3 3 0 0 0 0-6 5 5 0 0 0-9-1"/><path d="M7 20h7"/>')],
["انبار",svg('<path d="M4 10l8-6 8 6v9H4z"/><path d="M8 19v-5h8v5"/>')],
["عکس",svg('<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m4 17 5-5 4 4 2-2 5 5"/>')],
["کشاورز",svg('<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>')]
];
const s=section("v31Icons",`<div class="v31-title"><div><h2>ابزارهای یار کشاورز</h2><small>طراحی وکتوری، شارپ و مناسب موبایل</small></div></div><div class="v31-icon-grid">${data.map(x=>`<div class="v31-icon-card">${x[1]}<span>${x[0]}</span></div>`).join("")}</div>`);
}
function measurement(){
const s=section("v31Measure",`<div class="v31-title"><div><h2>📐 اندازه‌گیری حرفه‌ای زمین</h2><small>پیدا کردن زمین + نقشه + پیمایش GPS</small></div><span class="v31-btn alt">نقشه هوشمند</span></div>
<div class="v31-measure-tools"><input class="v31-input" id="v31Place" placeholder="نام روستا، شهر، منطقه یا مختصات"><button class="v31-btn" id="v31Search">پیدا کردن</button><button class="v31-btn alt" id="v31Satellite">ماهواره</button></div>
<div class="v31-map" id="v31Map"><iframe id="v31Frame" loading="lazy"></iframe></div>
<div class="v31-modes"><button id="v31Gps">🛰️ شروع پیمایش GPS</button><button id="v31MapPoint">📍 ثبت نقطه روی نقشه</button><button id="v31Reset">پاک کردن</button></div>
<div class="v31-stats"><div class="v31-stat"><small>مساحت</small><b id="v31Area">—</b></div><div class="v31-stat"><small>هکتار</small><b id="v31Ha">—</b></div><div class="v31-stat"><small>محیط</small><b id="v31Per">—</b></div><div class="v31-stat"><small>دقت GPS</small><b id="v31Acc">—</b></div></div>`);
if(!s)return;
const frame=$("v31Frame");
let lat=35.7,lon=51.4, satellite=false, points=[], watch=null;
function mapUrl(){
const layer=satellite?"hot":"mapnik";
return `https://www.openstreetmap.org/export/embed.html?bbox=${lon-.03}%2C${lat-.02}%2C${lon+.03}%2C${lat+.02}&layer=${layer}&marker=${lat}%2C${lon}`;
}
function refresh(){frame.src=mapUrl()}
function area(ps){if(ps.length<3)return 0;const R=6378137,la=ps.reduce((a,p)=>a+p[0],0)/ps.length*Math.PI/180,xy=ps.map(p=>[R*p[1]*Math.PI/180*Math.cos(la),R*p[0]*Math.PI/180]);let a=0;for(let i=0;i<xy.length;i++){let j=(i+1)%xy.length;a+=xy[i][0]*xy[j][1]-xy[j][0]*xy[i][1]}return Math.abs(a)/2}
function dist(a,b){const R=6378137,A=Math.PI/180,d=(b[0]-a[0])*A,e=(b[1]-a[1])*A,x=Math.sin(d/2)**2+Math.cos(a[0]*A)*Math.cos(b[0]*A)*Math.sin(e/2)**2;return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function draw(){const a=area(points);let p=0;for(let i=0;i<points.length;i++)p+=dist(points[i],points[(i+1)%points.length]);$("v31Area").textContent=a?Math.round(a).toLocaleString("fa-IR")+" m²":"—";$("v31Ha").textContent=a?(a/10000).toFixed(3)+" هکتار":"—";$("v31Per").textContent=p?Math.round(p).toLocaleString("fa-IR")+" m":"—"}
function addPoint(p){points.push(p);lat=p[0];lon=p[1];refresh();draw()}
$("v31Search").onclick=async()=>{const q=$("v31Place").value.trim();if(!q)return;try{const r=await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=fa&q="+encodeURIComponent(q));const d=await r.json();if(!d[0])return alert("زمین/مکان پیدا نشد.");lat=+d[0].lat;lon=+d[0].lon;refresh()}catch(e){alert("جستجوی مکان در دسترس نیست.")}};
$("v31Satellite").onclick=()=>{satellite=!satellite;$("v31Satellite").textContent=satellite?"نقشه":"ماهواره";refresh()};
$("v31Gps").onclick=()=>{if(!navigator.geolocation)return alert("GPS در دسترس نیست.");if(watch!==null){navigator.geolocation.clearWatch(watch);watch=null;$("v31Gps").textContent="🛰️ شروع پیمایش GPS";return}watch=navigator.geolocation.watchPosition(p=>{lat=p.coords.latitude;lon=p.coords.longitude;$("v31Acc").textContent="±"+Math.round(p.coords.accuracy)+" متر";addPoint([lat,lon])},()=>alert("دسترسی GPS داده نشد."),{enableHighAccuracy:true,maximumAge:1000,timeout:15000});$("v31Gps").textContent="⏹ توقف پیمایش"};
$("v31MapPoint").onclick=()=>{addPoint([lat,lon]);alert("نقطه ثبت شد. برای مرز زمین چند نقطه ثبت کن.")};
$("v31Reset").onclick=()=>{points=[];draw()};
refresh();
}
function weather(){
const s=section("v31Weather",`<div class="v31-title"><div><h2 style="color:#fff">🌤️ آب‌وهوای حرفه‌ای</h2><small style="color:rgba(255,255,255,.72)">اطلاعات کاربردی برای تصمیم‌های روزانه کشاورز</small></div></div>
<div class="v31-weather-main"><div><div class="v31-weather-temp" id="v31Temp">—°</div><div class="v31-weather-desc" id="v31Cond">در حال دریافت اطلاعات...</div></div><div class="v31-weather-icon" id="v31Icon">☀️</div></div>
<div class="v31-weather-grid"><div><small>رطوبت</small><b id="v31Hum">—</b></div><div><small>باد</small><b id="v31Wind">—</b></div><div><small>بارش</small><b id="v31Rain">—</b></div><div><small>طلوع</small><b id="v31Sunrise">—</b></div><div><small>غروب</small><b id="v31Sunset">—</b></div></div><div class="v31-hourly" id="v31Hourly"></div>`);
if(!s)return;
function code(c){if(c===0)return["صاف","☀️"];if(c<3)return["نیمه‌ابری","🌤️"];if(c<50)return["ابری","☁️"];if(c<70)return["بارانی","🌦️"];return["بارش شدید","🌧️"]}
navigator.geolocation?.getCurrentPosition(async p=>load(p.coords.latitude,p.coords.longitude),async()=>load(35.7,51.4),{enableHighAccuracy:true,timeout:7000});
async function load(la,lo){try{const u=`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&daily=sunrise,sunset&timezone=auto&forecast_days=3`;const d=await (await fetch(u)).json();const c=code(d.current.weather_code);$("v31Temp").textContent=Math.round(d.current.temperature_2m)+"°";$("v31Cond").textContent=c[0];$("v31Icon").textContent=c[1];$("v31Hum").textContent=Math.round(d.current.relative_humidity_2m)+"٪";$("v31Wind").textContent=Math.round(d.current.wind_speed_10m)+" km/h";$("v31Rain").textContent=d.current.precipitation+" mm";$("v31Sunrise").textContent=d.daily.sunrise[0].slice(11,16);$("v31Sunset").textContent=d.daily.sunset[0].slice(11,16);const h=$("v31Hourly");h.innerHTML="";for(let i=0;i<12;i++){const cc=code(d.hourly.weather_code[i]);h.innerHTML+=`<div><small>${d.hourly.time[i].slice(11,16)}</small><br>${cc[1]}<br><b>${Math.round(d.hourly.temperature_2m[i])}°</b><br><small>${d.hourly.precipitation_probability[i]}٪</small></div>`}}catch(e){$("v31Cond").textContent="اتصال آب‌وهوا برقرار نشد."}}
}
function photos(){
const s=section("v31Photos",`<div class="v31-title"><div><h2>📸 ثبت عکس زمین</h2><small>عکس دوربین یا گالری، با نمایش بزرگ و باکیفیت</small></div></div><div class="v31-photo-box"><div class="v31-photo-preview" id="v31Preview"><div class="v31-photo-empty">📷</div></div><div class="v31-photo-controls"><label for="v31File">📷 گرفتن عکس / انتخاب از گالری</label><input id="v31File" type="file" accept="image/*" capture="environment"><button class="v31-btn alt" id="v31Remove">حذف عکس</button></div></div>`);
if(!s)return;
$("v31File").onchange=e=>{const f=e.target.files?.[0];if(!f)return;const u=URL.createObjectURL(f);$("v31Preview").innerHTML=`<img src="${u}" alt="تصویر زمین">`};
$("v31Remove").onclick=()=>{$("v31Preview").innerHTML='<div class="v31-photo-empty">📷</div>';$("v31File").value=""};
}
function boot(){measurement();weather();photos();icons()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else setTimeout(boot,100);
})();
