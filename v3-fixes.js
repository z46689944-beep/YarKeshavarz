/* Yar Keshavarz V3.4 - targeted fixes */
(function(){
'use strict';

const css=document.createElement('style');
css.textContent=`
.measured-card>.row,.measured-card .measure-detail-grid{display:none!important}
.land-plan-inside img{max-width:100%!important;height:auto!important;display:block!important}
#measureMap{width:100%!important;min-height:320px!important;overflow:hidden!important}
.weather-page-head{min-height:135px!important}
.weather-temp-row strong{font-size:38px!important;line-height:1.1!important}
.weather-big-icon{font-size:46px!important;line-height:1!important}
.yk-equipment-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.yk-equipment-card{padding:14px;border:1px solid rgba(0,0,0,.08);border-radius:16px;background:#fff}
.yk-equipment-card h3{margin:0 0 6px}.yk-equipment-card p{margin:4px 0;opacity:.78}
.yk-equipment-actions{display:flex;gap:8px;margin-top:10px}
.yk-equipment-actions button{flex:1}
.yk-equipment-entry{margin:12px 0}
@media(max-width:560px){
 .weather-page-head{padding:14px!important}
 .weather-temp-row strong{font-size:36px!important}
 .weather-big-icon{font-size:44px!important}
 .yk-equipment-grid{grid-template-columns:1fr}
}
`;
document.head.appendChild(css);

function esc2(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]))}
function getEq(){try{return JSON.parse(localStorage.getItem('yk-equipment')||'[]')}catch(e){return[]}}
function setEq(a){localStorage.setItem('yk-equipment',JSON.stringify(a))}

window.renderEquipment=function(){
 const app=document.getElementById('app'); if(!app)return;
 const a=getEq();
 if(typeof window.head==='function') window.head('ادوات کشاورزی');
 app.innerHTML=`<section class="page">
  <div class="section-head">
   <h2>ادوات کشاورزی</h2>
   <button class="primary" data-eq-add>＋ افزودن وسیله</button>
  </div>
  <div class="card">
   <h3>موجودی ادوات مزرعه</h3>
   <p class="muted">تراکتور، سمپاش، کمباین، تیلر و سایر تجهیزات را اینجا ثبت و مدیریت کن.</p>
  </div>
  <div class="yk-equipment-grid">
   ${a.length?a.map((x,i)=>`<article class="yk-equipment-card">
    <h3>🚜 ${esc2(x.name||'بدون نام')}</h3>
    <p>دسته: <b>${esc2(x.type||'سایر')}</b></p>
    <p>تعداد: <b>${esc2(x.qty||1)}</b></p>
    <p>وضعیت: <b>${esc2(x.status||'فعال')}</b></p>
    <div class="yk-equipment-actions">
     <button class="secondary" data-eq-edit="${i}">ویرایش</button>
     <button class="danger" data-eq-del="${i}">حذف</button>
    </div>
   </article>`).join(''):`<div class="card" style="grid-column:1/-1;text-align:center;padding:28px">
    <div style="font-size:48px">🚜</div><h3>هنوز ادواتی ثبت نشده</h3>
    <p class="muted">اولین وسیله کشاورزی را اضافه کن.</p>
   </div>`}
  </div>
 </section>`;
};

function editEq(i){
 const a=getEq(), x=i==null?{}:a[i];
 const name=prompt('نام وسیله:',x.name||'');
 if(name===null)return;
 if(!name.trim()){alert('نام وسیله را وارد کن.');return}
 const type=prompt('دسته‌بندی:',x.type||'تراکتور')||'سایر';
 const qty=prompt('تعداد:',x.qty||1)||1;
 const status=prompt('وضعیت:',x.status||'فعال')||'فعال';
 const item={name:name.trim(),type:type.trim(),qty:String(qty).trim(),status:status.trim()};
 if(i==null)a.push(item);else a[i]=item;
 setEq(a); window.renderEquipment();
}

function addEquipmentEntry(){
 if(document.querySelector('.yk-equipment-entry'))return;
 const inv=document.querySelector('.section-head');
 if(!inv)return;
 const b=document.createElement('button');
 b.className='secondary yk-equipment-entry';
 b.dataset.route='equipment';
 b.textContent='🚜 ادوات کشاورزی';
 inv.parentNode.insertBefore(b,inv.nextSibling);
}

const oldInventory=window.renderInventory;
if(typeof oldInventory==='function'){
 window.renderInventory=function(){
  oldInventory();
  addEquipmentEntry();
 };
}

const oldHome=window.renderHome;
if(typeof oldHome==='function'){
 window.renderHome=function(){
  oldHome();
  const q=document.querySelector('.quick');
  if(q && !q.querySelector('[data-route="equipment"]')){
   const b=document.createElement('button');
   b.className='card';
   b.dataset.route='equipment';
   b.innerHTML='🚜<br>ادوات کشاورزی';
   q.appendChild(b);
  }
 };
}

document.addEventListener('click',function(e){
 const b=e.target.closest('[data-eq-add],[data-eq-edit],[data-eq-del],[data-land-weather],[data-route="equipment"]');
 if(!b)return;

 if(b.hasAttribute('data-eq-add')){e.preventDefault();editEq(null);return}
 if(b.hasAttribute('data-eq-edit')){e.preventDefault();editEq(Number(b.dataset.eqEdit));return}
 if(b.hasAttribute('data-eq-del')){
  e.preventDefault();
  const a=getEq(),i=Number(b.dataset.eqDel);
  if(confirm('این وسیله حذف شود؟')){a.splice(i,1);setEq(a);window.renderEquipment()}
  return;
 }
 if(b.dataset.route==='equipment'){
  e.preventDefault();
  window.go('equipment');
  return;
 }

 if(b.hasAttribute('data-land-weather')){
  e.preventDefault();
  /* app.js keeps state/selected in lexical scope, so do not rely on window.state */
  let name='';
  const h=document.querySelector('#app h2');
  if(h) name=h.textContent.trim();
  let s=null;
  try{s=JSON.parse(localStorage.getItem('yk-v3-clean')||'null')}catch(_){}
  const l=s&&Array.isArray(s.lands)?s.lands.find(x=>String(x.name||'').trim()===name):null;
  const box=document.getElementById('landWeather');
  if(l && l.lat!=null && l.lng!=null && typeof window.weatherData==='function'){
   if(box)box.innerHTML='<h3>آب‌وهوای این زمین</h3><p>در حال دریافت اطلاعات هوا...</p>';
   window.weatherData(Number(l.lat),Number(l.lng),box);
  }else if(l && box){
   box.innerHTML='<h3>آب‌وهوای این زمین</h3><p class="muted">برای این زمین مختصات GPS ثبت نشده است. ابتدا زمین را با موقعیت مکانی ثبت کن.</p>';
  }else{
   alert('پرونده زمین پیدا نشد.');
  }
 }
},true);

/* app.js has a lexical `go`; overriding window.go is enough for data-route clicks */
const oldGo=window.go;
window.go=function(r){
 if(r==='equipment'){
  document.body.classList.remove('measure-active');
  window.route='equipment';
  window.renderEquipment();
  document.querySelectorAll('.bottom-nav button').forEach(x=>x.classList.remove('active'));
  return;
 }
 if(typeof oldGo==='function')return oldGo(r);
};

/* IMPORTANT: app.js uses lexical `map`, so replacing window.initMap does NOT fix it.
   Patch Leaflet constructors, then let the original initMap create its lexical map. */
if(window.L){
 const origMap=window.L.map;
 if(origMap && !origMap.__yk34){
  function safeMap(id,opts){
   opts=Object.assign({},opts||{},{
    maxZoom:18,
    minZoom:3,
    worldCopyJump:false
   });
   const m=origMap.call(this,id,opts);
   setTimeout(()=>{try{m.invalidateSize(true)}catch(e){}},350);
   return m;
  }
  safeMap.__yk34=true;
  window.L.map=safeMap;
 }
 const origTile=window.L.tileLayer;
 if(origTile && !origTile.__yk34){
  function safeTile(url,opts){
   opts=Object.assign({},opts||{},{
    maxZoom:18,
    maxNativeZoom:18,
    keepBuffer:5
   });
   delete opts.noWrap;
   return origTile.call(this,url,opts);
  }
  safeTile.__yk34=true;
  window.L.tileLayer=safeTile;
 }
}

/* Make field-weather button work even when the app does not auto-load it. */
setTimeout(function(){
 try{
  const landWeather=document.getElementById('landWeather');
  const btn=landWeather&&landWeather.querySelector('[data-land-weather]');
  if(btn && !btn.dataset.yk34){btn.dataset.yk34='1'}
 }catch(e){}
},100);

})();
