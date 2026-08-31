
(function(){
  const $=id=>document.getElementById(id);
  const q=$('yk-v23-place-search'), sb=$('yk-v23-search-btn');
  const help=$('yk-v23-map-help');
  if(sb&&q){
    sb.addEventListener('click', async ()=>{
      const term=q.value.trim();
      if(!term){ help.textContent='نام روستا، شهر، منطقه یا مختصات را وارد کن.'; return; }
      help.textContent='در حال پیدا کردن محل روی نقشه...';
      try{
        const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=fa&q='+encodeURIComponent(term));
        const d=await r.json();
        if(!d.length){help.textContent='مکانی با این مشخصات پیدا نشد. نام دقیق‌تر یا مختصات را امتحان کن.';return;}
        window.dispatchEvent(new CustomEvent('yk:place-found',{detail:d}));
        help.textContent='محل پیدا شد؛ حالا زمین را روی نقشه انتخاب کن.';
        if(window.ykSetMapCenter) window.ykSetMapCenter(+d[0].lat,+d[0].lon);
      }catch(e){help.textContent='جستجوی مکان در دسترس نیست. اتصال اینترنت را بررسی کن.';}
    });
  }
  document.querySelectorAll('[data-measure-mode]').forEach(b=>b.addEventListener('click',()=>{
    const mode=b.dataset.measureMode;
    window.dispatchEvent(new CustomEvent('yk:measure-mode',{detail:mode}));
    if(mode==='gps'&&navigator.geolocation){
      help.textContent='در حال دریافت موقعیت GPS...';
      navigator.geolocation.getCurrentPosition(
        p=>{ $('yk-v23-accuracy').textContent='±'+Math.round(p.coords.accuracy)+' متر'; help.textContent='GPS آماده است؛ پیمایش را شروع کن.'; },
        ()=>{help.textContent='دسترسی GPS داده نشد.'},
        {enableHighAccuracy:true,timeout:12000,maximumAge:0}
      );
    }else{
      help.textContent=mode==='map'?'گوشه‌های زمین را روی نقشه مشخص کن.':'GPS و نقاط نقشه را برای مرز دقیق‌تر ترکیب کن.';
    }
  }));
  // Safe weather presentation; existing weather engine can populate these hooks.
  window.addEventListener('yk:weather-update',e=>{
    const w=e.detail||{};
    if(w.temp!=null)$('yk-v23-temp').textContent=Math.round(w.temp)+'°';
    if(w.humidity!=null)$('yk-v23-humidity').textContent=Math.round(w.humidity)+'٪';
    if(w.wind!=null)$('yk-v23-wind').textContent=Math.round(w.wind)+' km/h';
    if(w.rain!=null)$('yk-v23-rain').textContent=w.rain;
    if(w.condition)$('yk-v23-condition').textContent=w.condition;
    if(w.icon)$('yk-v23-weather-icon').textContent=w.icon;
    $('yk-v23-weather-status').textContent='به‌روز';
  });
})();
