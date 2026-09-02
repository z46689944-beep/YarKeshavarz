/* Yar Keshavarz V13 — آزاد کردن حرکت نقشه متراژ */
(function(){
  const css = `
    #measureMap,
    #measureMap .leaflet-container {
      touch-action: pan-x pan-y !important;
      -webkit-user-select: none !important;
      user-select: none !important;
      cursor: grab !important;
    }
    #measureMap .leaflet-container:active { cursor: grabbing !important; }
    .measure-overlay {
      pointer-events: none !important;
    }
    .measure-overlay input,
    .measure-overlay button,
    .measure-overlay select,
    .measure-overlay textarea {
      pointer-events: auto !important;
    }
    .measure-page .floating,
    .measure-page .measure-bottom {
      pointer-events: none !important;
    }
    .measure-page .floating button,
    .measure-page .measure-bottom button,
    .measure-page .measure-bottom input,
    .measure-page .measure-bottom select {
      pointer-events: auto !important;
    }
  `;
  function apply(){
    if(document.getElementById('yk-v13-map-fix')) return;
    const s=document.createElement('style');
    s.id='yk-v13-map-fix';
    s.textContent=css;
    document.head.appendChild(s);
  }
  function fix(){
    apply();
    const mapEl=document.getElementById('measureMap');
    if(!mapEl) return;
    const container=mapEl.querySelector('.leaflet-container');
    if(container){
      container.style.touchAction='pan-x pan-y';
      container.style.webkitUserSelect='none';
      container.style.userSelect='none';
    }
  }
  const mo=new MutationObserver(fix);
  mo.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(fix,50));
  window.addEventListener('load',()=>setTimeout(fix,200));
  setInterval(fix,1000);
  fix();
})();
