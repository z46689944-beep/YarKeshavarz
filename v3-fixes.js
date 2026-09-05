/* Yar Keshavarz V3.3 targeted recovery */
(function(){
'use strict';

const style=document.createElement('style');
style.textContent=`
.measured-card>.row,.measured-card .measure-detail-grid{display:none!important}
.land-plan-inside img{max-width:100%!important;height:auto!important;display:block!important}
#measureMap{width:100%!important;min-height:320px!important;overflow:hidden!important}
.weather-page-head{min-height:135px!important}
.weather-temp-row strong{font-size:38px!important;line-height:1.1!important}
.weather-big-icon{font-size:46px!important;line-height:1!important}
@media(max-width:560px){
.weather-page-head{padding:14px!important}
.weather-temp-row strong{font-size:36px!important}
.weather-big-icon{font-size:44px!important}
}
.yk-equipment-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.yk-equipment-card{padding:14px;border:1px solid rgba(0,0,0,.08);border-radius:16px;background:#fff}
.yk-equipment-card h3{margin:0 0 6px}.yk-equipment-card p{margin:4px 0;opacity:.78}
@media(max-width:520px){.yk-equipment-grid{grid-template-columns:1fr}}
`;
document.head.appendChild(style);

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function getEq(){try{return JSON.parse(localStorage.getItem('yk-equipment')||'[]')}catch(e){return[]}}
function setEq(a){localStorage.setItem('yk-equipment',JSON.stringify(a))}

window.renderEquipment=function(){
 const app=document.getElementById('app'); if(!app)return;
 const a=getEq();
 app.innerHTML=`<section class="page">
 <div class="page-head"><div><small>مدیریت مزرعه</small><h1>ادوات کشاورزی</h1></div><button class="primary" data-eq-add>＋ افزودن</button></div>
 <div class="card"><h3>موجودی ادوات</h3><p>تراکتور، سمپاش، کمباین و سایر تجهیزات مزرعه را ثبت و مدیریت کنید.</p></div>
 <div class="yk-equipment-grid">${a.length?a.map((x,i)=>`
 <article class="yk-equipment-card"><h3>${esc(x.name||'بدون نام')}</h3>
 <p>دسته: ${esc(x.type||'سایر')}</p><p>تعداد: ${esc(x.qty||1)}</p><p>وضعیت: ${esc(x.status||'فعال')}</p>
 <div style="display:flex;gap:8px;margin-top:10px"><button class="secondary" data-eq-edit="${i}">ویرایش</button><button class="secondary" data-eq-del="${i}">حذف</button></div>
 </article>`).join(''):`<div class="card" style="grid-column:1/-1;text-align:center;padding:28px"><div style="font-size:42px">🚜</div><h3>هنوز ادواتی ثبت نشده</h3><p>اولین وسیله کشاورزی را اضافه کنید.</p></div>`}</div>
 </section>`;
};

function editEq(i){
 const a=getEq(),x=i==null?{}:a[i],name=prompt('نام وسیله:',x.name||'');
 if(name===null)return;if(!name.trim()){alert('نام وسیله را وارد کنید.');return}
 const type=prompt('دسته‌بندی:',x.type||'تراکتور')||'سایر';
 const qty=prompt('تعداد:',x.qty||1)||1;const status=prompt('وضعیت:',x.status||'فعال')||'فعال';
 const item={name:name.trim(),type:type.trim(),qty:String(qty).trim(),status:status.trim()};
 if(i==null)a.push(item);else a[i]=item;setEq(a);renderEquipment();
}

document.addEventListener('click',function(e){
 const b=e.target.closest('[data-eq-add],[data-eq-edit],[data-eq-del],[data-land-weather],[data-route="equipment"]');
 if(!b)return;
 if(b.hasAttribute('data-eq-add')){e.preventDefault();editEq(null);return}
 if(b.hasAttribute('data-eq-edit')){e.preventDefault();editEq(Number(b.dataset.eqEdit));return}
 if(b.hasAttribute('data-eq-del')){e.preventDefault();const a=getEq(),i=Number(b.dataset.eqDel);if(confirm('این وسیله حذف شود؟')){a.splice(i,1);setEq(a);renderEquipment()}return}
 if(b.dataset.route==='equipment'){e.preventDefault();window.go('equipment');return}
 if(b.hasAttribute('data-land-weather')){
   e.preventDefault();
   const l=window.state&&Array.isArray(window.state.lands)?window.state.lands.find(x=>x.id===window.selected):null;
   if(l&&l.lat!=null&&l.lng!=null&&typeof window.weatherData==='function'){
     const box=document.getElementById('landWeather');if(box)box.innerHTML='<h3>آب‌وهوای این زمین</h3><p>در حال دریافت اطلاعات هوا...</p>';
     window.weatherData(l.lat,l.lng,box);
   }else alert('برای این زمین موقعیت مکانی ثبت نشده است.');
 }
},true);

const oldGo=window.go;
window.go=function(r){
 if(r==='equipment'){window.route='equipment';window.renderEquipment();return}
 if(typeof oldGo==='function')return oldGo(r);
};

window.initMap=function(){
 const el=document.getElementById('measureMap');if(!el||typeof L==='undefined')return;
 try{
  if(window.map){try{window.map.remove()}catch(e){}}
  window.map=L.map(el,{zoomControl:false,maxZoom:18,minZoom:3,worldCopyJump:false}).setView([35.7,51.4],12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,maxNativeZoom:18,keepBuffer:4,attribution:'© OpenStreetMap'}).addTo(window.map);
  setTimeout(()=>{try{window.map.invalidateSize(true)}catch(e){}},250);
 }catch(err){console.warn('YK map recovery',err)}
};
})();
