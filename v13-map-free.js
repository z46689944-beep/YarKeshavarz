/* Yar Keshavarz V13.1 — Leaflet touch map fix */
(function(){
  function patchLeaflet(){
    if(!window.L || window.__ykTouchMapPatched) return;
    window.__ykTouchMapPatched = true;
    const originalInit = L.Map.prototype.initialize;
    L.Map.prototype.initialize = function(id, options){
      options = options || {};
      options.dragging = true;
      options.touchZoom = true;
      options.scrollWheelZoom = true;
      options.doubleClickZoom = true;
      return originalInit.call(this, id, options);
    };
    const css = document.createElement('style');
    css.id = 'yk-v13-touch-fix';
    css.textContent = `
      #measureMap, #measureMap .leaflet-container {
        touch-action: none !important;
        -ms-touch-action: none !important;
        overscroll-behavior: contain !important;
        -webkit-user-select: none !important;
        user-select: none !important;
        cursor: grab !important;
      }
      #measureMap .leaflet-container:active { cursor: grabbing !important; }
      #measureMap .leaflet-pane, #measureMap .leaflet-map-pane,
      #measureMap .leaflet-tile-pane { touch-action: none !important; }
    `;
    document.head.appendChild(css);
  }
  function scan(){
    patchLeaflet();
    const el = document.getElementById('measureMap');
    if(!el || !el._leaflet_map) return;
    el._leaflet_map.dragging.enable();
    el._leaflet_map.touchZoom.enable();
  }
  document.addEventListener('DOMContentLoaded', scan);
  window.addEventListener('load', scan);
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(scan,100); setTimeout(scan,500); setTimeout(scan,1500);
})();
