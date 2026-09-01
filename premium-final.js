
(function(){
"use strict";
const $=id=>document.getElementById(id);
function addSection(id,html){if($(id)||!$("app"))return null;const s=document.createElement("section");s.id=id;s.className="pf-section";s.innerHTML=html;$("app").appendChild(s);return s}
function measurement(){
const s=addSection("pfMeasure",`<div class="pf-head"><div><h2>📐 متراژ حرفه‌ای زمین</h2><p>زمین را پیدا کن، مرز را مشخص کن و مساحت دقیق بگیر.</p></div><span class="pf-chip">نقشه + GPS</span></div>
<div class="pf-search"><input id="pfQ" class="pf-input" placeholder="نام روستا، شهر، منطقه یا مختصات را وارد کنید"><button id="pfFind" class="pf-btn">پیدا کردن زمین</button></div>
<div id="pfMap" class="pf-map"><iframe id="pfFrame" loading="lazy"></iframe></div>
<div class="pf-tools"><button id="pfGps">🛰️ شروع پیمایش</button><button id="pfPoint">📍 ثبت نقطه</button><button id="pfClear">پاک کردن</button></div>
<div class="pf-stats"><div class="pf-stat"><small>مساحت</small><b id="pfArea">—</b></div><div class="pf-stat"><small>هکتار</small><b id="pfHa">—</b></div><div class="pf-stat"><small>محیط</small><b id="pfPer">—</b></div><div class="pf-stat"><small>دقت GPS</small><b id="pfAcc">—</b></div></div>`);
if(!s)return;
let lat=35.70,lon=51.40,watch=null,points=[];
const frame=$("pfFrame");
function refresh(){frame.src=`https://www.openstreetmap.org/export/embed.html?bbox=${lon-.035}%2C${lat-.025}%2C${lon+.035}%2C${lat+.025}&layer=mapnik&marker=${lat}%2C${lon}`}
function dist(a,b){const R=6378137,A=Math.PI/180,d=(b[0]-a[0])*A,e=(b[1]-a[1])*A,x=Math.sin(d/2)**2+Math.cos(a[0]*A)*Math.cos(b[0]*A)*Math.sin(e/2)**2;return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function calc(){if(points.length<3){$("pfArea").textContent="—";$("pfHa").textContent="—";$("pfPer").textContent=points.length>1?Math.round(points.reduce((s,p,i)=>s+dist(p,points[(i+1)%points.length]),0)).toLocaleString("fa-IR")+" m":"—";return}const R=6378137,A=Math.PI/180,la=points.reduce((s,p)=>s+p[0],0)/points.length*A,xy=points.map(p=>[R*p[1]*A*Math.cos(la),R*p[0]*A]);let ar=0,pe=0;for(let i=0;i<xy.length;i++){let j=(i+1)%xy.length;ar+=xy[i][0]*xy[j][1]-xy[j][0]*xy[i][1];pe+=dist(points[i],points[j])}ar=Math.abs(ar)/2;$("pfArea").textContent=Math.round(ar).toLocaleString("fa-IR")+" m²";$("pfHa").textContent=(ar/10000).toFixed(3)+" هکتار";$("pfPer").textContent=Math.round(pe).toLocaleString("fa-IR")+" m"}
function point(p){lat=p[0];lon=p[1];points.push([lat,lon]);$("pfAcc").textContent=p[2]?"±"+Math.round(p[2])+" متر":$("pfAcc").textContent;refresh();calc()}
$("pfFind").onclick=async()=>{const q=$("pfQ").value.trim();if(!q)return;try{const r=await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=fa&q="+encodeURIComponent(q));const d=await r.json();if(!d[0])return alert("مکان پیدا نشد.");lat=+d[0].lat;lon=+d[0].lon;refresh()}catch(e){alert("جستجوی مکان انجام نشد.")}};
$("pfPoint").onclick=()=>point([lat,lon]);
$("pfClear").onclick=()=>{points=[];calc()};
$("pfGps").onclick=()=>{if(!navigator.geolocation)return alert("GPS در دسترس نیست.");if(watch!==null){navigator.geolocation.clearWatch(watch);watch=null;$("pfGps").textContent="🛰️ شروع پیمایش";return}watch=navigator.geolocation.watchPosition(p=>point([p.coords.latitude,p.coords.longitude,p.coords.accuracy]),()=>alert("دسترسی GPS داده نشد."),{enableHighAccuracy:true,maximumAge:1000,timeout:15000});$("pfGps").textContent="⏹ توقف پیمایش"};
refresh();
}
function weather(){
const s=addSection("pfWeather",`<div class="pf-head"><div><h2>🌤️ آب‌وهوای کشاورزی</h2><p>اطلاعات زنده و پیش‌بینی ساعتی برای تصمیم‌گیری بهتر.</p></div><span class="pf-chip">زنده</span></div>
<div class="pf-current"><div><div id="pfTemp" class="pf-temp">—°</div><div id="pfDesc" class="pf-desc">در حال دریافت...</div></div><div id="pfWicon" class="pf-wicon">☀️</div></div>
<div class="pf-weather-grid"><div><small>رطوبت</small><b id="pfHum">—</b></div><div><small>باد</small><b id="pfWind">—</b></div><div><small>بارش</small><b id="pfRain">—</b></div><div><small>طلوع</small><b id="pfRise">—</b></div><div><small>غروب</small><b id="pfSet">—</b></div></div><div id="pfHours" class="pf-hours"></div>`);
if(!s)return;
function code(c){if(c===0)return["صاف","☀️"];if(c<3)return["نیمه‌ابری","🌤️"];if(c<50)return["ابری","☁️"];if(c<70)return["بارانی","🌦️"];return["بارش شدید","🌧️"]}
async function load(la,lo){try{const u=`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&daily=sunrise,sunset&timezone=auto&forecast_days=3`;const d=await(await fetch(u)).json(),c=code(d.current.weather_code);$("pfTemp").textContent=Math.round(d.current.temperature_2m)+"°";$("pfDesc").textContent=c[0];$("pfWicon").textContent=c[1];$("pfHum").textContent=Math.round(d.current.relative_humidity_2m)+"٪";$("pfWind").textContent=Math.round(d.current.wind_speed_10m)+" km/h";$("pfRain").textContent=d.current.precipitation+" mm";$("pfRise").textContent=d.daily.sunrise[0].slice(11,16);$("pfSet").textContent=d.daily.sunset[0].slice(11,16);for(let i=0;i<12;i++){let cc=code(d.hourly.weather_code[i]);$("pfHours").innerHTML+=`<div><small>${d.hourly.time[i].slice(11,16)}</small><br>${cc[1]}<br><b>${Math.round(d.hourly.temperature_2m[i])}°</b><br><small>${d.hourly.precipitation_probability[i]}٪</small></div>`}}catch(e){$("pfDesc").textContent="اتصال آب‌وهوا برقرار نشد."}}
navigator.geolocation?.getCurrentPosition(p=>load(p.coords.latitude,p.coords.longitude),()=>load(35.7,51.4),{timeout:7000});
}
function photos(){
const s=addSection("pfPhotos",`<div class="pf-head"><div><h2>📸 عکس زمین</h2><p>عکس را با دوربین بگیر یا از گالری انتخاب کن.</p></div></div><div class="pf-photo"><div id="pfPreview" class="pf-preview"><div class="pf-empty">📷</div></div><div class="pf-photo-controls"><label for="pfFile">📷 افزودن عکس با کیفیت</label><input id="pfFile" type="file" accept="image/*" capture="environment"><button id="pfRemove" class="pf-btn light">حذف عکس</button></div></div>`);
if(!s)return;
$("pfFile").onchange=e=>{const f=e.target.files?.[0];if(f)$("pfPreview").innerHTML=`<img src="${URL.createObjectURL(f)}" alt="تصویر زمین">`};$("pfRemove").onclick=()=>{$("pfPreview").innerHTML='<div class="pf-empty">📷</div>';$("pfFile").value=""};
}
function icons(){addSection("pfIcons",`<div class="pf-head"><div><h2>ابزارهای یار کشاورز</h2><p>آیکون‌های وکتوری و شارپ در تمام اندازه‌ها.</p></div></div><div class="pf-icons">${[
["زمین",'<path d="M3 20h18M5 20l2-10 5 3 3-7 4 14"/><path d="M8 10l4 3M15 6l3 2"/>'],
["هوا",'<path d="M5 17h12a3 3 0 0 0 0-6 5 5 0 0 0-9-1"/><path d="M7 20h7"/>'],
["انبار",'<path d="M4 10l8-6 8 6v9H4z"/><path d="M8 19v-5h8v5"/>'],
["عکس",'<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m4 17 5-5 4 4 2-2 5 5"/>'],
["پروفایل",'<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>']
].map(x=>`<div class="pf-icon"><svg viewBox="0 0 24 24">${x[1]}</svg><span>${x[0]}</span></div>`).join("")}</div>`)}
function boot(){measurement();weather();photos();icons()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else setTimeout(boot,150);
})();
