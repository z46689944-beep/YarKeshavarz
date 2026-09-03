/* Yar Keshavarz — V14.5 measurement bridge
   Upload this file to the repository and load it AFTER v14.3-modern-measure.js.
   It preserves the existing rotation implementation.
*/
(function(){
  "use strict";

  const MEASURE_KEY = "yk-last-measure";
  const LAND_MAP_KEY = "yk-pending-land-map";

  function getMeasure(){
    try {
      return JSON.parse(
        localStorage.getItem(MEASURE_KEY) || "null"
      );
    } catch(e){
      return null;
    }
  }

  function savePending(m){
    if(m){
      localStorage.setItem(
        LAND_MAP_KEY,
        JSON.stringify(m)
      );
    }
  }

  function fillLandArea(){
    const m = getMeasure();
    const input = document.getElementById("landArea");

    if(!m || !input) return;

    const hectares = Number(
      m.hectare || (Number(m.area || 0) / 10000)
    );

    if(hectares > 0){
      input.value = hectares.toFixed(3);

      input.dispatchEvent(
        new Event("input", {bubbles:true})
      );

      input.dispatchEvent(
        new Event("change", {bubbles:true})
      );
    }
  }

  function goAdd(){
    const m = getMeasure();

    if(
      !m ||
      !m.area ||
      !Array.isArray(m.points) ||
      m.points.length < 3
    ){
      alert("ابتدا حداقل ۳ نقطه برای زمین ثبت کنید.");
      return;
    }

    savePending(m);

    if(typeof window.go === "function"){
      window.go("add");
    }

    setTimeout(fillLandArea, 180);
    setTimeout(fillLandArea, 500);
  }

  /*
   * دکمه «ثبت زمین با این مساحت»
   * بعد از محاسبه، مستقیماً وارد فرم ثبت زمین می‌شود
   * و متراژ را خودکار وارد می‌کند.
   */
  document.addEventListener("click", function(e){

    const btn =
      e.target &&
      e.target.closest ?
      e.target.closest("#useBtn") :
      null;

    if(!btn) return;

    setTimeout(function(){

      if(getMeasure()){
        goAdd();
      }

    }, 0);

  }, true);


  /*
   * بعد از ثبت فرم زمین،
   * اطلاعات نقشه و اندازه‌گیری به همان زمین متصل می‌شود.
   */
  document.addEventListener("submit", function(e){

    if(
      !e.target ||
      e.target.id !== "landForm"
    ){
      return;
    }

    const m = getMeasure();

    if(!m) return;

    savePending(m);

    setTimeout(function(){

      try{

        const s = window.state;

        if(
          !s ||
          !Array.isArray(s.lands) ||
          !s.lands.length
        ){
          return;
        }

        const land =
          s.lands[s.lands.length - 1];

        land.measurement = {

          area: Number(
            m.area || 0
          ),

          hectare: Number(
            m.hectare ||
            (Number(m.area || 0) / 10000)
          ),

          perimeter: Number(
            m.perimeter || 0
          ),

          points:
            Array.isArray(m.points)
            ? m.points
            : []

        };

        if(typeof window.save === "function"){
          window.save();
        }

        localStorage.removeItem(
          LAND_MAP_KEY
        );

      }catch(err){}

    }, 300);

  }, true);


  /*
   * API داخلی برای استفاده بخش‌های دیگر برنامه
   */
  window.YKMeasureV145 = {

    get: getMeasure,

    goAdd: goAdd,

    fillLandArea: fillLandArea

  };


  /*
   * جلوگیری از سفید شدن نقشه هنگام تغییر اندازه صفحه،
   * زوم یا برگشت از حالت پس‌زمینه.
   *
   * تنظیمات چرخش نقشه دست‌کاری نمی‌شود.
   */
  function keepMapSized(){

    try{

      const map = window.M;

      if(
        map &&
        typeof map.resize === "function"
      ){

        const el =
          document.getElementById(
            "measureMap"
          );

        if(
          el &&
          el.clientWidth > 0 &&
          el.clientHeight > 0
        ){

          map.resize();

        }

      }

    }catch(e){}

  }


  window.addEventListener(
    "resize",
    keepMapSized,
    {passive:true}
  );


  window.addEventListener(
    "orientationchange",
    function(){

      setTimeout(
        keepMapSized,
        120
      );

      setTimeout(
        keepMapSized,
        400
      );

    },
    {passive:true}
  );


  document.addEventListener(
    "visibilitychange",
    function(){

      if(!document.hidden){

        setTimeout(
          keepMapSized,
          120
        );

        setTimeout(
          keepMapSized,
          500
        );

      }

    }
  );


  /*
   * بررسی دوره‌ای اندازه نقشه
   */
  setInterval(
    keepMapSized,
    1500
  );

})();
