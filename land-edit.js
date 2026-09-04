/* =========================================================
   یار کشاورز — Land Edit V4
   ویرایش مستقل تمام زمین‌ها
   + تغییر متراژ همان زمین با نقشه و GPS
   ========================================================= */

(function () {
  "use strict";

  const KEY = "yk-v3-clean";

  /* =========================================================
     HELPERS
     ========================================================= */

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function faToEn(value) {
    return String(value ?? "")
      .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
      .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  }

  function num(value) {
    return Number(
      faToEn(value)
        .replace(/[٬,\s]/g, "")
    ) || 0;
  }

  function loadState() {
    try {
      return JSON.parse(
        localStorage.getItem(KEY) || "null"
      );
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify(state)
      );
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  function format(value, digits = 1) {
    return Number(value || 0).toLocaleString(
      "fa-IR",
      {
        maximumFractionDigits: digits
      }
    );
  }

  /* =========================================================
     CSS
     ========================================================= */

  const style = document.createElement("style");

  style.textContent = `

    .yk-v4-edit-btn{
      width:100%;
      margin-top:10px;
      border:0;
      border-radius:14px;
      padding:13px 15px;
      background:#166534;
      color:#fff;
      font:800 14px inherit;
      cursor:pointer;
      box-shadow:0 5px 16px rgba(22,101,52,.18);
    }

    .yk-v4-edit-btn:active{
      transform:scale(.98);
    }

    .yk-v4-overlay{
      position:fixed;
      inset:0;
      z-index:99999;
      background:rgba(0,0,0,.55);
      display:flex;
      align-items:flex-end;
      justify-content:center;
      direction:rtl;
    }

    .yk-v4-modal{
      width:100%;
      max-width:680px;
      max-height:94vh;
      overflow:auto;
      background:#fff;
      border-radius:26px 26px 0 0;
      padding:18px;
      box-sizing:border-box;
    }

    .yk-v4-head{
      display:flex;
      align-items:center;
      justify-content:space-between;
      margin-bottom:14px;
    }

    .yk-v4-head h2{
      margin:0;
      font-size:20px;
    }

    .yk-v4-close{
      width:40px;
      height:40px;
      border:0;
      border-radius:50%;
      background:#eef3ef;
      font-size:22px;
    }

    .yk-v4-note{
      background:#f0fdf4;
      border:1px solid #ccebd5;
      color:#166534;
      border-radius:14px;
      padding:11px;
      font-size:13px;
      line-height:1.8;
      margin-bottom:15px;
    }

    .yk-v4-field{
      margin-bottom:12px;
    }

    .yk-v4-field label{
      display:block;
      font-size:13px;
      font-weight:800;
      margin-bottom:6px;
    }

    .yk-v4-field input,
    .yk-v4-field select,
    .yk-v4-field textarea{
      width:100%;
      box-sizing:border-box;
      border:1px solid #d7e1da;
      border-radius:13px;
      padding:12px;
      background:#fff;
      outline:none;
      font:15px inherit;
    }

    .yk-v4-field input:focus,
    .yk-v4-field select:focus,
    .yk-v4-field textarea:focus{
      border-color:#22a05a;
      box-shadow:0 0 0 3px rgba(34,160,90,.10);
    }

    .yk-v4-measure{
      width:100%;
      border:1px solid #b9dfc4;
      border-radius:15px;
      padding:14px;
      background:#f0fdf4;
      color:#166534;
      font:900 15px inherit;
      margin:2px 0 14px;
    }

    .yk-v4-actions{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:9px;
      margin-top:16px;
    }

    .yk-v4-save,
    .yk-v4-cancel{
      border:0;
      border-radius:14px;
      padding:14px;
      font:900 15px inherit;
    }

    .yk-v4-save{
      background:#166534;
      color:#fff;
    }

    .yk-v4-cancel{
      background:#edf2ee;
      color:#333;
    }

    /* =====================================================
       MEASUREMENT
       ===================================================== */

    .yk-v4-measure-screen{
      position:fixed;
      inset:0;
      z-index:100000;
      background:#fff;
      display:flex;
      flex-direction:column;
      direction:rtl;
    }

    .yk-v4-measure-head{
      padding:10px 12px;
      background:#fff;
      box-shadow:0 2px 12px rgba(0,0,0,.12);
      z-index:5;
    }

    .yk-v4-measure-title{
      display:flex;
      align-items:center;
      justify-content:space-between;
    }

    .yk-v4-measure-title strong{
      font-size:17px;
    }

    .yk-v4-measure-close{
      width:38px;
      height:38px;
      border:0;
      border-radius:50%;
      background:#eef3ef;
      font-size:21px;
    }

    .yk-v4-measure-help{
      font-size:12px;
      color:#66736a;
      line-height:1.7;
      margin-top:3px;
    }

    .yk-v4-map{
      position:relative;
      flex:1;
      min-height:280px;
    }

    .yk-v4-map .leaflet-container{
      width:100%;
      height:100%;
    }

    .yk-v4-map-tools{
      position:absolute;
      top:10px;
      left:10px;
      z-index:1000;
      display:flex;
      flex-direction:column;
      gap:7px;
    }

    .yk-v4-map-tools button{
      border:0;
      border-radius:12px;
      background:#fff;
      padding:9px 11px;
      font:800 12px inherit;
      box-shadow:0 2px 9px rgba(0,0,0,.18);
    }

    .yk-v4-map-tools button.active{
      background:#166534;
      color:#fff;
    }

    .yk-v4-bottom{
      background:#fff;
      padding:10px 12px 13px;
      box-shadow:0 -3px 16px rgba(0,0,0,.14);
      z-index:5;
    }

    .yk-v4-stats{
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:7px;
      margin-bottom:9px;
    }

    .yk-v4-stat{
      background:#f5f8f5;
      border-radius:12px;
      padding:9px 5px;
      text-align:center;
    }

    .yk-v4-stat b{
      display:block;
      color:#166534;
      font-size:15px;
    }

    .yk-v4-stat span{
      font-size:10px;
      color:#657067;
    }

    .yk-v4-controls{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:7px;
    }

    .yk-v4-controls button{
      border:0;
      border-radius:13px;
      padding:12px 7px;
      font:800 13px inherit;
    }

    .yk-v4-gps{
      background:#e8f5eb;
      color:#166534;
    }

    .yk-v4-gps.active{
      background:#166534;
      color:#fff;
    }

    .yk-v4-clear{
      background:#f8eeee;
      color:#9b2c2c;
    }

    .yk-v4-save-measure{
      width:100%;
      border:0;
      border-radius:14px;
      padding:14px;
      margin-top:8px;
      background:#166534;
      color:#fff;
      font:900 15px inherit;
    }

    .yk-v4-hint{
      text-align:center;
      color:#68736c;
      font-size:10px;
      margin-top:6px;
      line-height:1.6;
    }

    .yk-v4-point-label{
      background:#166534 !important;
      border:0 !important;
      color:#fff !important;
      border-radius:8px !important;
      font-weight:900;
      padding:3px 6px !important;
    }

    @media(min-width:700px){

      .yk-v4-overlay{
        align-items:center;
        padding:20px;
      }

      .yk-v4-modal{
        border-radius:26px;
        max-height:90vh;
      }

    }

  `;

  document.head.appendChild(style);

  /* =========================================================
     FIND ALL LAND CARDS
     ========================================================= */

  function addButtons(){

    const cards =
      document.querySelectorAll(".land-card");

    if(!cards.length){
      return;
    }

    const state = loadState();

    if(
      !state ||
      !Array.isArray(state.lands)
    ){
      return;
    }

    cards.forEach(function(card){

      /*
        اگر دکمه قبلاً ساخته شده،
        دوباره نساز.
      */

      if(
        card.querySelector(
          ".yk-v4-edit-btn"
        )
      ){
        return;
      }

      /*
        شناسه زمین را مستقیماً
        از دکمه پرونده می‌گیریم.
      */

      const openButton =
        card.querySelector(
          "[data-open-land]"
        );

      if(!openButton){
        return;
      }

      const id =
        openButton.getAttribute(
          "data-open-land"
        );

      if(!id){
        return;
      }

      /*
        اطمینان از وجود همین زمین
        در localStorage
      */

      const land =
        state.lands.find(
          x => String(x.id) === String(id)
        );

      if(!land){
        return;
      }

      const button =
        document.createElement("button");

      button.type = "button";
      button.className =
        "yk-v4-edit-btn";

      button.textContent =
        "✏️ ویرایش این زمین";

      button.addEventListener(
        "click",
        function(e){

          e.preventDefault();
          e.stopPropagation();

          openEditor(id);

        }
      );

      /*
        دکمه را مستقیماً
        داخل همان کارت قرار می‌دهیم.
      */

      card.appendChild(button);

    });

  }

  /* =========================================================
     EDITOR
     ========================================================= */

  function openEditor(id){

    const state = loadState();

    if(
      !state ||
      !Array.isArray(state.lands)
    ){
      alert("اطلاعات زمین پیدا نشد.");
      return;
    }

    const land =
      state.lands.find(
        x => String(x.id) === String(id)
      );

    if(!land){
      alert("زمین پیدا نشد.");
      return;
    }

    const old =
      document.querySelector(
        ".yk-v4-overlay"
      );

    if(old){
      old.remove();
    }

    const overlay =
      document.createElement("div");

    overlay.className =
      "yk-v4-overlay";

    const modal =
      document.createElement("div");

    modal.className =
      "yk-v4-modal";

    modal.innerHTML = `

      <div class="yk-v4-head">

        <h2>
          ✏️ ویرایش زمین
        </h2>

        <button
          class="yk-v4-close"
          id="ykV4Close"
        >
          ×
        </button>

      </div>

      <div class="yk-v4-note">

        این ویرایش فقط روی
        «${esc(land.name || "این زمین")}»
        انجام می‌شود.

        <br>

        برای تغییر واقعی متراژ،
        دکمه «تغییر متراژ» را بزن.

      </div>

      <div class="yk-v4-field">
        <label>نام زمین</label>

        <input
          id="ykV4Name"
          value="${esc(land.name)}"
        >
      </div>

      <div class="yk-v4-field">
        <label>مساحت (هکتار)</label>

        <input
          id="ykV4Area"
          inputmode="decimal"
          value="${esc(land.area)}"
        >
      </div>

      <button
        class="yk-v4-measure"
        id="ykV4Measure"
      >
        📐 تغییر متراژ با نقشه و GPS
      </button>

      <div class="yk-v4-field">
        <label>روستا / شهر / منطقه</label>

        <input
          id="ykV4Region"
          value="${esc(land.region)}"
        >
      </div>

      <div class="yk-v4-field">
        <label>مالکیت</label>

        <select id="ykV4Ownership">

          <option
            value="own"
            ${land.ownership === "own" ? "selected" : ""}
          >
            مالک
          </option>

          <option
            value="rent"
            ${land.ownership === "rent" ? "selected" : ""}
          >
            اجاره‌ای
          </option>

        </select>
      </div>

      <div class="yk-v4-field">
        <label>نام مالک</label>

        <input
          id="ykV4Owner"
          value="${esc(land.ownerName)}"
        >
      </div>

      <div class="yk-v4-field">
        <label>نوع خاک</label>

        <input
          id="ykV4Soil"
          value="${esc(land.soil)}"
        >
      </div>

      <div class="yk-v4-field">
        <label>منبع آب</label>

        <input
          id="ykV4Water"
          value="${esc(land.water)}"
        >
      </div>

      <div class="yk-v4-field">
        <label>نوع آبیاری</label>

        <input
          id="ykV4Irrigation"
          value="${esc(land.irrigation)}"
        >
      </div>

      <div class="yk-v4-field">
        <label>محصول</label>

        <input
          id="ykV4Crop"
          value="${esc(land.crop)}"
        >
      </div>

      <div class="yk-v4-field">
        <label>توضیحات</label>

        <textarea
          id="ykV4Notes"
          rows="4"
        >${esc(land.notes)}</textarea>
      </div>

      <div class="yk-v4-actions">

        <button
          class="yk-v4-save"
          id="ykV4Save"
        >
          💾 ذخیره تغییرات
        </button>

        <button
          class="yk-v4-cancel"
          id="ykV4Cancel"
        >
          انصراف
        </button>

      </div>

    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal
      .querySelector("#ykV4Close")
      .onclick =
      () => overlay.remove();

    modal
      .querySelector("#ykV4Cancel")
      .onclick =
      () => overlay.remove();

    overlay.addEventListener(
      "click",
      function(e){

        if(e.target === overlay){
          overlay.remove();
        }

      }
    );

    modal
      .querySelector("#ykV4Measure")
      .onclick =
      function(){

        openMeasurement(
          id,
          overlay
        );

      };

    modal
      .querySelector("#ykV4Save")
      .onclick =
      function(){

        const fresh =
          loadState();

        if(
          !fresh ||
          !Array.isArray(fresh.lands)
        ){
          alert("خطا در اطلاعات زمین.");
          return;
        }

        const target =
          fresh.lands.find(
            x =>
              String(x.id) ===
              String(id)
          );

        if(!target){
          alert("زمین پیدا نشد.");
          return;
        }

        const name =
          modal
            .querySelector("#ykV4Name")
            .value
            .trim();

        const area =
          num(
            modal
              .querySelector("#ykV4Area")
              .value
          );

        if(!name){
          alert("نام زمین را وارد کن.");
          return;
        }

        if(area <= 0){
          alert("مساحت باید بیشتر از صفر باشد.");
          return;
        }

        target.name =
          name;

        target.area =
          area;

        target.region =
          modal
            .querySelector("#ykV4Region")
            .value
            .trim();

        target.ownership =
          modal
            .querySelector("#ykV4Ownership")
            .value;

        target.ownerName =
          modal
            .querySelector("#ykV4Owner")
            .value
            .trim();

        target.soil =
          modal
            .querySelector("#ykV4Soil")
            .value
            .trim();

        target.water =
          modal
            .querySelector("#ykV4Water")
            .value
            .trim();

        target.irrigation =
          modal
            .querySelector("#ykV4Irrigation")
            .value
            .trim();

        target.crop =
          modal
            .querySelector("#ykV4Crop")
            .value
            .trim();

        target.notes =
          modal
            .querySelector("#ykV4Notes")
            .value
            .trim();

        /*
          اگر قبلاً متراژ دقیق نداشته،
          مقدار هکتار را به مترمربع تبدیل کن.
        */

        if(
          !target.areaM2
        ){
          target.areaM2 =
            area * 10000;
        }

        if(
          !saveState(fresh)
        ){
          alert("ذخیره انجام نشد.");
          return;
        }

        overlay.remove();

        refresh();

      };

  }

  /* =========================================================
     GEO
     ========================================================= */

  function distance(a,b){

    const R =
      6371008.8;

    const rad =
      Math.PI / 180;

    const dLat =
      (b[0]-a[0])*rad;

    const dLon =
      (b[1]-a[1])*rad;

    const lat1 =
      a[0]*rad;

    const lat2 =
      b[0]*rad;

    const h =
      Math.sin(dLat/2)**2 +
      Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon/2)**2;

    return (
      2*R*
      Math.asin(
        Math.min(
          1,
          Math.sqrt(h)
        )
      )
    );

  }

  function area(points){

    if(points.length < 3){
      return 0;
    }

    const R =
      6371008.8;

    const rad =
      Math.PI / 180;

    let sum = 0;

    for(
      let i=0;
      i<points.length;
      i++
    ){

      const a =
        points[i];

      const b =
        points[
          (i+1) %
          points.length
        ];

      sum +=
        (b[1]-a[1]) *
        rad *
        (
          2 +
          Math.sin(a[0]*rad) +
          Math.sin(b[0]*rad)
        );

    }

    return Math.abs(
      sum *
      R *
      R /
      2
    );

  }

  function perimeter(points){

    if(points.length < 2){
      return 0;
    }

    let total=0;

    for(
      let i=0;
      i<points.length;
      i++
    ){

      total +=
        distance(
          points[i],
          points[
            (i+1) %
            points.length
          ]
        );

    }

    return total;

  }

  /* =========================================================
     MEASUREMENT SCREEN
     ========================================================= */

  function openMeasurement(
    id,
    editor
  ){

    if(
      typeof L === "undefined"
    ){

      alert(
        "نقشه هنوز بارگذاری نشده است."
      );

      return;

    }

    editor.remove();

    const state =
      loadState();

    const land =
      state &&
      state.lands &&
      state.lands.find(
        x =>
          String(x.id) ===
          String(id)
      );

    if(!land){
      return;
    }

    const screen =
      document.createElement("div");

    screen.className =
      "yk-v4-measure-screen";

    screen.innerHTML = `

      <div class="yk-v4-measure-head">

        <div class="yk-v4-measure-title">

          <strong>
            📐 تغییر متراژ
          </strong>

          <button
            class="yk-v4-measure-close"
            id="ykV4MClose"
          >
            ×
          </button>

        </div>

        <div class="yk-v4-measure-help">

          زمین:
          ${esc(land.name)}

          <br>

          روی نقشه نقطه بزن
          یا GPS را روشن کن.

        </div>

      </div>

      <div
        class="yk-v4-map"
        id="ykV4Map"
      >

        <div class="yk-v4-map-tools">

          <button
            id="ykV4Street"
            class="active"
          >
            🗺️ نقشه
          </button>

          <button
            id="ykV4Satellite"
          >
            🛰️ ماهواره
          </button>

        </div>

      </div>

      <div class="yk-v4-bottom">

        <div class="yk-v4-stats">

          <div class="yk-v4-stat">
            <b id="ykV4Area">
              ۰
            </b>
            <span>مترمربع</span>
          </div>

          <div class="yk-v4-stat">
            <b id="ykV4Hectare">
              ۰
            </b>
            <span>هکتار</span>
          </div>

          <div class="yk-v4-stat">
            <b id="ykV4Perimeter">
              ۰
            </b>
            <span>متر محیط</span>
          </div>

        </div>

        <div class="yk-v4-controls">

          <button
            class="yk-v4-gps"
            id="ykV4GPS"
          >
            📍 شروع GPS
          </button>

          <button
            class="yk-v4-clear"
            id="ykV4Clear"
          >
            🗑️ پاک کردن
          </button>

        </div>

        <button
          class="yk-v4-save-measure"
          id="ykV4SaveMeasure"
        >
          💾 ثبت متراژ برای همین زمین
        </button>

        <div class="yk-v4-hint">

          نقطه‌ها قابل جابه‌جایی هستند.
          برای اندازه‌گیری دقیق‌تر،
          دور زمین نقاط بیشتری ثبت کن.

        </div>

      </div>

    `;

    document.body.appendChild(screen);

    /* =====================================================
       MAP
       ===================================================== */

    const map =
      L.map(
        "ykV4Map",
        {
          zoomControl:true
        }
      ).setView(
        [35.7,51.4],
        13
      );

    const street =
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom:20,
          attribution:"© OpenStreetMap"
        }
      ).addTo(map);

    const satellite =
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom:20,
          attribution:"© Esri"
        }
      );

    let points=[];

    if(
      land.measurement &&
      Array.isArray(
        land.measurement.points
      )
    ){

      points =
        land.measurement.points
          .map(
            p => [
              Number(p[0]),
              Number(p[1])
            ]
          )
          .filter(
            p =>
              Number.isFinite(p[0]) &&
              Number.isFinite(p[1])
          );

    }

    let markers=[];
    let polygon=null;

    let gpsWatch=null;
    let gpsActive=false;

    /* =====================================================
       DRAW
       ===================================================== */

    function redraw(){

      markers.forEach(
        m => m.remove()
      );

      markers=[];

      if(polygon){
        polygon.remove();
        polygon=null;
      }

      points.forEach(
        function(point,index){

          const marker =
            L.marker(
              point,
              {
                draggable:true
              }
            ).addTo(map);

          marker.bindTooltip(
            String(index+1),
            {
              permanent:true,
              direction:"top",
              offset:[0,-10],
              className:
                "yk-v4-point-label"
            }
          );

          marker.on(
            "dragend",
            function(){

              const p =
                marker.getLatLng();

              points[index]=[
                p.lat,
                p.lng
              ];

              redraw();

            }
          );

          markers.push(marker);

        }
      );

      if(points.length>=3){

        polygon =
          L.polygon(
            points,
            {
              color:"#166534",
              weight:4,
              fillOpacity:.16
            }
          ).addTo(map);

      }

      updateStats();

    }

    function updateStats(){

      const a =
        area(points);

      const p =
        perimeter(points);

      screen.querySelector(
        "#ykV4Area"
      ).textContent =
        format(a,1);

      screen.querySelector(
        "#ykV4Hectare"
      ).textContent =
        format(a/10000,3);

      screen.querySelector(
        "#ykV4Perimeter"
      ).textContent =
        format(p,1);

    }

    /* =====================================================
       MAP CLICK
       ===================================================== */

    map.on(
      "click",
      function(e){

        points.push([
          e.latlng.lat,
          e.latlng.lng
        ]);

        redraw();

      }
    );

    /* =====================================================
       LAYERS
       ===================================================== */

    screen.querySelector(
      "#ykV4Street"
    ).onclick =
      function(){

        if(!map.hasLayer(street)){
          map.addLayer(street);
        }

        if(map.hasLayer(satellite)){
          map.removeLayer(satellite);
        }

        this.classList.add("active");

        screen.querySelector(
          "#ykV4Satellite"
        ).classList.remove("active");

      };

    screen.querySelector(
      "#ykV4Satellite"
    ).onclick =
      function(){

        if(!map.hasLayer(satellite)){
          map.addLayer(satellite);
        }

        if(map.hasLayer(street)){
          map.removeLayer(street);
        }

        this.classList.add("active");

        screen.querySelector(
          "#ykV4Street"
        ).classList.remove("active");

      };

    /* =====================================================
       CLEAR
       ===================================================== */

    screen.querySelector(
      "#ykV4Clear"
    ).onclick =
      function(){

        if(
          !confirm(
            "همه نقاط پاک شود؟"
          )
        ){
          return;
        }

        points=[];

        redraw();

      };

    /* =====================================================
       GPS
       ===================================================== */

    function stopGPS(){

      if(
        gpsWatch !== null &&
        navigator.geolocation
      ){

        navigator.geolocation.clearWatch(
          gpsWatch
        );

      }

      gpsWatch=null;
      gpsActive=false;

      const btn =
        screen.querySelector(
          "#ykV4GPS"
        );

      if(btn){

        btn.textContent =
          "📍 شروع GPS";

        btn.classList.remove(
          "active"
        );

      }

    }

    screen.querySelector(
      "#ykV4GPS"
    ).onclick =
      function(){

        if(gpsActive){

          stopGPS();

          return;

        }

        if(
          !navigator.geolocation
        ){

          alert(
            "GPS در این دستگاه در دسترس نیست."
          );

          return;

        }

        gpsActive=true;

        this.textContent =
          "⏹️ توقف GPS";

        this.classList.add(
          "active"
        );

        navigator.geolocation.getCurrentPosition(

          function(pos){

            const point=[
              pos.coords.latitude,
              pos.coords.longitude
            ];

            if(points.length===0){

              map.setView(
                point,
                18
              );

            }

            points.push(point);

            redraw();

          },

          function(){

            alert(
              "دسترسی GPS داده نشد."
            );

            stopGPS();

          },

          {
            enableHighAccuracy:true,
            timeout:15000,
            maximumAge:0
          }

        );

        gpsWatch =
          navigator.geolocation.watchPosition(

            function(pos){

              const point=[
                pos.coords.latitude,
                pos.coords.longitude
              ];

              if(
                points.length===0 ||
                distance(
                  points[
                    points.length-1
                  ],
                  point
                ) >= 2
              ){

                points.push(point);

                map.setView(
                  point,
                  18
                );

                redraw();

              }

            },

            function(){},

            {
              enableHighAccuracy:true,
              maximumAge:1000,
              timeout:15000
            }

          );

      };

    /* =====================================================
       CLOSE
       ===================================================== */

    screen.querySelector(
      "#ykV4MClose"
    ).onclick =
      function(){

        stopGPS();

        screen.remove();

        openEditor(id);

      };

    /* =====================================================
       SAVE
       ===================================================== */

    screen.querySelector(
      "#ykV4SaveMeasure"
    ).onclick =
      function(){

        if(points.length<3){

          alert(
            "حداقل ۳ نقطه لازم است."
          );

          return;

        }

        const fresh =
          loadState();

        const target =
          fresh &&
          fresh.lands &&
          fresh.lands.find(
            x =>
              String(x.id) ===
              String(id)
          );

        if(!target){

          alert(
            "زمین پیدا نشد."
          );

          return;

        }

        const a =
          area(points);

        const p =
          perimeter(points);

        if(a<=0){

          alert(
            "مساحت قابل محاسبه نیست."
          );

          return;

        }

        target.areaM2 =
          a;

        target.area =
          a / 10000;

        target.perimeter =
          p;

        target.measurement={
          points:
            points.map(
              p => [
                p[0],
                p[1]
              ]
            ),
          area:a,
          perimeter:p,
          updatedAt:
            new Date().toISOString()
        };

        /*
          ذخیره مرکز زمین
        */

        if(
          !target.lat ||
          !target.lng
        ){

          let lat=0;
          let lng=0;

          points.forEach(
            p => {
              lat+=p[0];
              lng+=p[1];
            }
          );

          target.lat =
            lat/points.length;

          target.lng =
            lng/points.length;

        }

        if(
          !saveState(fresh)
        ){

          alert(
            "ذخیره متراژ انجام نشد."
          );

          return;

        }

        stopGPS();

        screen.remove();

        refresh();

        setTimeout(
          function(){
            openEditor(id);
          },
          400
        );

      };

    /* =====================================================
       INITIAL
       ===================================================== */

    if(points.length){

      map.fitBounds(
        L.latLngBounds(points),
        {
          padding:[25,25]
        }
      );

    }

    redraw();

    setTimeout(
      function(){
        map.invalidateSize();
      },
      200
    );

  }

  /* =========================================================
     REFRESH APP
     ========================================================= */

  function refresh(){

    /*
      چون state داخل app.js
      در حافظه است، صفحه را
      reload می‌کنیم تا state
      از localStorage دوباره خوانده شود.
    */

    location.reload();

  }

  /* =========================================================
     OBSERVER
     ========================================================= */

  const observer =
    new MutationObserver(
      function(){

        addButtons();

      }
    );

  function boot(){

    addButtons();

    observer.observe(
      document.body,
      {
        childList:true,
        subtree:true
      }
    );

    /*
      چند بار بعد از رندر
      هم بررسی می‌کنیم.
    */

    setTimeout(
      addButtons,
      300
    );

    setTimeout(
      addButtons,
      800
    );

    setTimeout(
      addButtons,
      1500
    );

    setTimeout(
      addButtons,
      2500
    );

  }

  if(
    document.readyState ===
    "loading"
  ){

    document.addEventListener(
      "DOMContentLoaded",
      boot
    );

  }else{

    boot();

  }

})();
