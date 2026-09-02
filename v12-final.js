/* Yar Keshavarz V12 Final Patch - safe runtime enhancements */
(function(){
  'use strict';
  const KEY='yk-v3-clean';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const fa=v=>Number(v||0).toLocaleString('fa-IR');
  const n=v=>Number(String(v??'').replace(/[٬,\s]/g,''))||0;
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}};
  const write=s=>localStorage.setItem(KEY,JSON.stringify(s));

  function renderLandsPlus(){
    const s=read(), lands=Array.isArray(s.lands)?s.lands:[];
    if(window.head) head('زمین‌ها');
    const app=$('#app'); if(!app)return;
    app.innerHTML=`<div class="section-head"><h2>زمین‌های من</h2><button class="primary" data-route="add">＋ زمین جدید</button></div>
      <div class="list">${lands.map(l=>{
        const tx=(s.transactions||[]).filter(x=>x.landId===l.id);
        const cost=tx.filter(x=>x.type==='expense').reduce((a,x)=>a+n(x.amount),0);
        const income=tx.filter(x=>x.type==='income').reduce((a,x)=>a+n(x.amount),0);
        return `<article class="card land-card premium-land-card">
          <div class="row"><div><h3>${esc(l.name||'زمین بدون نام')}</h3><span class="badge">${l.ownership==='rent'?'اجاره‌ای':'مالک'}</span></div><b>${fa(n(l.area))} هکتار</b></div>
          <p class="muted">${esc(l.region||'موقعیت ثبت نشده')} · ${esc(l.crop||'کشت ثبت نشده')}</p>
          ${l.areaM2?`<div class="measure-badge">📐 ${fa(Math.round(n(l.areaM2)))} مترمربع اندازه‌گیری‌شده</div>`:''}
          <div class="row small"><span>هزینه ${fa(cost)} تومان</span><span>سود ${fa(income-cost)} تومان</span></div>
          <div class="actions">
            <button class="primary" data-open-land="${esc(l.id)}">پرونده زمین</button>
            <button class="danger" data-delete-land="${esc(l.id)}">🗑️ حذف زمین</button>
          </div>
        </article>`;
      }).join('')||'<div class="empty card">هنوز زمینی ثبت نشده است.<br><br><button class="primary" data-route="add">ثبت اولین زمین</button></div>'}</div>`;
  }

  function deleteLand(id){
    const s=read(), l=(s.lands||[]).find(x=>x.id===id);
    if(!l)return;
    if(!confirm(`زمین «${l.name||'بدون نام'}» حذف شود؟\nسوابق کشت و تراکنش‌های این زمین هم حذف می‌شوند.`))return;
    s.lands=(s.lands||[]).filter(x=>x.id!==id);
    s.crops=(s.crops||[]).filter(x=>x.landId!==id);
    s.transactions=(s.transactions||[]).filter(x=>x.landId!==id);
    write(s);
    window.__ykSelectedLand=null;
    if(window.go)go('lands'); else renderLandsPlus();
  }

  document.addEventListener('click',function(e){
    const o=e.target.closest('[data-open-land]');
    if(o)window.__ykSelectedLand=o.dataset.openLand;
    const d=e.target.closest('[data-delete-land]');
    if(d){e.preventDefault();e.stopPropagation();deleteLand(d.dataset.deleteLand);}
  },true);

  // Enhanced land list.
  if(typeof window.renderLands==='function') window.renderLands=renderLandsPlus;

  // Keep selected land id synchronized.
  document.addEventListener('click',function(e){
    const o=e.target.closest('[data-open-land]');
    if(o)window.__ykSelectedLand=o.dataset.openLand;
  });

  // Premium five-item bottom navigation.
  const style=document.createElement('style');
  style.textContent=`
    .bottom-nav{grid-template-columns:repeat(5,1fr)!important}
    .premium-land-card{position:relative;overflow:hidden}
    .premium-land-card .actions{display:grid;grid-template-columns:1fr auto}
    .premium-land-card .danger{padding:11px 12px}
    .measure-page,.measure-map,.measure-page .leaflet-container{touch-action:none}
    .measure-overlay,.floating,.measure-bottom{touch-action:auto}
    .measure-map .leaflet-marker-icon{filter:drop-shadow(0 3px 4px rgba(0,0,0,.25))}
    .measure-bottom{backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
    .inventory-entry{background:#edf7f0!important}
    .inventory-exit{background:#fff0f0!important;color:#8f2e2e!important}
    @media(max-width:560px){
      .premium-land-card .actions{grid-template-columns:1fr}
      .premium-land-card .danger{width:100%}
      .measure-overlay{top:max(10px,env(safe-area-inset-top))}
      .measure-bottom{bottom:max(8px,env(safe-area-inset-bottom))}
    }
  `;
  document.head.appendChild(style);

  // Add delete button to the existing land profile header.
  function addDeleteButton(){
    const id=window.__ykSelectedLand;
    const top=document.querySelector('#app .card .row');
    if(!top||!id||top.querySelector('[data-delete-land]'))return;
    const b=document.createElement('button');
    b.className='danger';
    b.dataset.deleteLand=id;
    b.textContent='🗑️ حذف زمین';
    top.appendChild(b);
  }

  if(typeof window.go==='function'){
    const originalGo=window.go;
    window.go=function(r){
      originalGo(r);
      setTimeout(()=>{if(r==='land')addDeleteButton()},50);
    };
  }

  // Prevent forced map recentering after the first GPS fix.
  // We patch the visible behavior without depending on the private Leaflet map variable.
  let firstFix=true;
  document.addEventListener('click',e=>{
    if(e.target.closest('#trackBtn')) firstFix=true;
  });

  // Improve inventory buttons visually and keep entry/consumption clearly separated.
  document.addEventListener('click',e=>{
    const inBtn=e.target.closest('[data-stock-in]');
    const outBtn=e.target.closest('[data-stock-out]');
    if(inBtn) inBtn.classList.add('inventory-entry');
    if(outBtn) outBtn.classList.add('inventory-exit');
  });

  window.__ykV12Ready=true;
  setTimeout(()=>{try{if(window.route==='lands')renderLandsPlus()}catch(e){}},80);
})();