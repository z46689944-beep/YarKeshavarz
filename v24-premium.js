
(function(){
  const $=s=>document.querySelector(s);
  const panel=()=>{
    if($('#v24Measure')) return;
    const host=$('#app');
    if(!host) return;
    const el=document.createElement('section');
    el.className='v24-measure';
    el.id='v24Measure';
    el.innerHTML=`<h2>📐 اندازه‌گیری حرفه‌ای زمین</h2>
      <div class="v24-measure-search"><input id="v24q" placeholder="روستا، شهر، منطقه یا مختصات..."><button id="v24search">جستجوی زمین</button></div>
      <div class="v24-map" id="v24map"></div>
      <div class="v24-measure-actions">
        <button id="v24MapMode">📍 نقشه</button><button id="v24GpsMode">🛰️ پیمایش GPS</button><button id="v24Hybrid">🔀 ترکیبی</button><button id="v24Clear">پاک کردن</button>
      </div>
      <div class="v24-metrics"><div><small>مساحت</small><b id="v24area">—</b></div><div><small>هکتار</small><b id="v24ha">—</b></div><div><small>محیط</small><b id="v24per">—</b></div></div>`;
    host.prepend(el);
    initMap();
  };
  let map, poly, pts=[], markers, gpsWatch=null;
  function initMap(){
    if(!window.L) return;
    map=L.map('v24map').setView([35.7,51.4],12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
    markers=L.layerGroup().addTo(map);
    map.on('click',e=>add(e.latlng.lat,e.latlng.lng));
    $('#v24search').onclick=searchPlace;
    $('#v24Clear').onclick=clear;
    $('#v24GpsMode').onclick=startGPS;
    $('#v24MapMode').onclick=()=>stopGPS();
    $('#v24Hybrid').onclick=()=>startGPS();
  }
  function add(lat,lng){
    pts.push([lat,lng]);
    const m=L.marker([lat,lng],{draggable:true}).addTo(markers);
    m._i=pts.length-1;m.on('dragend',()=>{let p=m.getLatLng();pts[m._i]=[p.lat,p.lng];draw()});draw();
  }
  function draw(){
    if(poly)map.removeLayer(poly);
    if(pts.length>=3){poly=L.polygon(pts).addTo(map);let a=area(pts),p=perim(pts);$('#v24area').textContent=Math.round(a).toLocaleString('fa-IR')+' m²';$('#v24ha').textContent=(a/10000).toFixed(3)+' هکتار';$('#v24per').textContent=Math.round(p).toLocaleString('fa-IR')+' m';}
    else {$('#v24area').textContent='—';$('#v24ha').textContent='—';$('#v24per').textContent='—'}
  }
  function area(ps){const R=6378137,lat0=ps.reduce((s,p)=>s+p[0],0)/ps.length*Math.PI/180;let xy=ps.map(p=>[R*p[1]*Math.PI/180*Math.cos(lat0),R*p[0]*Math.PI/180]);let a=0;for(let i=0;i<xy.length;i++){let j=(i+1)%xy.length;a+=xy[i][0]*xy[j][1]-xy[j][0]*xy[i][1]}return Math.abs(a)/2}
  function dist(a,b){const R=6378137,dLat=(b[0]-a[0])*Math.PI/180,dLon=(b[1]-a[1])*Math.PI/180;const x=Math.sin(dLat/2)**2+Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(dLon/2)**2;return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
  function perim(ps){let s=0;for(let i=0;i<ps.length;i++)s+=dist(ps[i],ps[(i+1)%ps.length]);return s}
  async function searchPlace(){
    const q=$('#v24q').value.trim();if(!q)return;
    try{let r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=fa&q='+encodeURIComponent(q));let d=await r.json();if(!d[0]){alert('مکان پیدا نشد. نام دقیق‌تر یا مختصات را امتحان کن.');return}map.setView([+d[0].lat,+d[0].lon],17)}catch(e){alert('جستجوی مکان انجام نشد.')}
  }
  function startGPS(){
    if(!navigator.geolocation){alert('GPS در دسترس نیست.');return}
    stopGPS();gpsWatch=navigator.geolocation.watchPosition(p=>{let c=p.coords;map.setView([c.latitude,c.longitude],18);add(c.latitude,c.longitude)},e=>alert('اجازه GPS داده نشد.'),{enableHighAccuracy:true,maximumAge:1000,timeout:15000});
  }
  function stopGPS(){if(gpsWatch!==null){navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null}}
  function clear(){stopGPS();pts=[];markers.clearLayers();if(poly){map.removeLayer(poly);poly=null}draw()}
  // The panel is only inserted when the existing app reaches the measurement/add route.
  const old=window.setRoute;
  if(typeof old==='function'){
    window.setRoute=function(r){const x=old.apply(this,arguments);if(r==='measure'||r==='add')setTimeout(panel,60);return x}
  }
  // If the app already has a measure route, hook after initial render.
  setTimeout(()=>{if(location.hash.includes('measure'))panel()},300);
})();
