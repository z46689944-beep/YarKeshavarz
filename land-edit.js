/* =========================================================
   یار کشاورز — Land Edit V3
   ویرایش مستقل هر زمین + تغییر متراژ روی همان زمین
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

  function toNumber(value) {
    return Number(
      String(value ?? "")
        .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
        .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
        .replace(/[٬,\s]/g, "")
    );
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (e) {
      console.error("Land edit load error:", e);
      return null;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error("Land edit save error:", e);
      return false;
    }
  }

  function formatNumber(value, digits = 1) {
    return Number(value || 0).toLocaleString("fa-IR", {
      maximumFractionDigits: digits
    });
  }

  function closeEditor() {
    const el = document.querySelector(".yk-v3-overlay");
    if (el) el.remove();
  }

  /* =========================================================
     STYLE
     ========================================================= */

  const style = document.createElement("style");

  style.textContent = `

    .yk-v3-edit-btn{
      width:100%;
      margin-top:9px;
      padding:13px 15px;
      border:0;
      border-radius:14px;
      background:#166534;
      color:#fff;
      font:700 14px inherit;
      box-shadow:0 5px 15px rgba(22,101,52,.16);
      cursor:pointer;
    }

    .yk-v3-edit-btn:active{
      transform:scale(.98);
    }

    .yk-v3-overlay{
      position:fixed;
      inset:0;
      z-index:100000;
      background:rgba(5,20,10,.58);
      display:flex;
      align-items:flex-end;
      justify-content:center;
    }

    .yk-v3-modal{
      width:100%;
      max-width:650px;
      max-height:94vh;
      overflow:auto;
      background:#fff;
      border-radius:25px 25px 0 0;
      padding:19px;
      box-sizing:border-box;
      direction:rtl;
      box-shadow:0 -12px 45px rgba(0,0,0,.25);
    }

    .yk-v3-head{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:15px;
    }

    .yk-v3-head h2{
      margin:0;
      font-size:20px;
    }

    .yk-v3-x{
      border:0;
      background:#eef3ef;
      width:40px;
      height:40px;
      border-radius:50%;
      font-size:22px;
      cursor:pointer;
    }

    .yk-v3-note{
      background:#f0fdf4;
      border:1px solid #d5f1dd;
      color:#166534;
      border-radius:14px;
      padding:11px 12px;
      font-size:13px;
      margin-bottom:14px;
      line-height:1.8;
    }

    .yk-v3-field{
      margin-bottom:12px;
    }

    .yk-v3-field label{
      display:block;
      font-size:13px;
      font-weight:800;
      margin-bottom:6px;
    }

    .yk-v3-field input,
    .yk-v3-field select,
    .yk-v3-field textarea{
      width:100%;
      box-sizing:border-box;
      border:1px solid #d7e1da;
      border-radius:13px;
      padding:12px;
      font:15px inherit;
      background:#fff;
      outline:0;
    }

    .yk-v3-field input:focus,
    .yk-v3-field select:focus,
    .yk-v3-field textarea:focus{
      border-color:#22a05a;
      box-shadow:0 0 0 3px rgba(34,160,90,.1);
    }

    .yk-v3-measure-btn{
      width:100%;
      border:1px solid #b8ddc2;
      background:#f0fdf4;
      color:#166534;
      border-radius:15px;
      padding:14px;
      font:800 15px inherit;
      cursor:pointer;
      margin:2px 0 13px;
    }

    .yk-v3-actions{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:9px;
      margin-top:16px;
    }

    .yk-v3-save,
    .yk-v3-cancel{
      border:0;
      border-radius:14px;
      padding:14px;
      font:800 15px inherit;
      cursor:pointer;
    }

    .yk-v3-save{
      background:#166534;
      color:#fff;
    }

    .yk-v3-cancel{
      background:#edf2ee;
      color:#333;
    }

    /* =====================================================
       MEASUREMENT SCREEN
       ===================================================== */

    .yk-measure-overlay{
      position:fixed;
      inset:0;
      z-index:100001;
      background:#fff;
      direction:rtl;
      display:flex;
      flex-direction:column;
    }

    .yk-measure-top{
      padding:10px 12px;
      background:rgba(255,255,255,.97);
      box-shadow:0 2px 12px rgba(0,0,0,.12);
      position:relative;
      z-index:3;
    }

    .yk-measure-title{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
    }

    .yk-measure-title strong{
      font-size:17px;
    }

    .yk-measure-close{
      border:0;
      background:#eef3ef;
      width:38px;
      height:38px;
      border-radius:50%;
      font-size:21px;
      cursor:pointer;
    }

    .yk-measure-sub{
      font-size:12px;
      color:#5c6b61;
      margin-top:3px;
      line-height:1.7;
    }

    .yk-measure-map{
      position:relative;
      flex:1;
      min-height:280px;
    }

    .yk-measure-map .leaflet-container{
      width:100%;
      height:100%;
      background:#dfe9df;
    }

    .yk-measure-tools{
      position:absolute;
      top:9px;
      left:9px;
      z-index:1000;
      display:flex;
      flex-direction:column;
      gap:7px;
    }

    .yk-measure-tools button{
      border:0;
      border-radius:12px;
      background:rgba(255,255,255,.96);
      padding:9px 11px;
      font:800 12px inherit;
      box-shadow:0 2px 9px rgba(0,0,0,.18);
      cursor:pointer;
    }

    .yk-measure-tools button.on{
      background:#166534;
      color:#fff;
    }

    .yk-measure-bottom{
      background:#fff;
      padding:10px 12px 12px;
      box-shadow:0 -3px 15px rgba(0,0,0,.14);
      z-index:3;
    }

    .yk-measure-stats{
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:7px;
      margin-bottom:9px;
    }

    .yk-stat{
      background:#f5f8f5;
      border-radius:12px;
      padding:9px;
      text-align:center;
    }

    .yk-stat b{
      display:block;
      font-size:15px;
      color:#166534;
    }

    .yk-stat span{
      font-size:11px;
      color:#59655d;
    }

    .yk-measure-row{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:7px;
    }

    .yk-measure-row button{
      border:0;
      border-radius:13px;
      padding:12px 8px;
      font:800 13px inherit;
      cursor:pointer;
    }

    .yk-gps{
      background:#e8f5eb;
      color:#166534;
    }

    .yk-gps.on{
      background:#166534;
      color:#fff;
    }

    .yk-clear{
      background:#f5eeee;
      color:#9b2c2c;
    }

    .yk-measure-save{
      width:100%;
      margin-top:8px;
      border:0;
      border-radius:14px;
      background:#166534;
      color:#fff;
      padding:14px;
      font:900 15px inherit;
      cursor:pointer;
    }

    .yk-measure-hint{
      text-align:center;
      color:#657067;
      font-size:11px;
      margin-top:6px;
      line-height:1.7;
    }

    .yk-point-label{
      background:#166534 !important;
      border:0 !important;
      color:#fff !important;
      font-weight:800;
      border-radius:8px !important;
      padding:3px 6px !important;
    }

    @media(min-width:700px){

      .yk-v3-overlay{
        align-items:center;
        padding:20px;
      }

      .yk-v3-modal{
        border-radius:25px;
        max-height:90vh;
      }

      .yk-measure-bottom{
        padding-left:22px;
        padding-right:22px;
      }

      .yk-measure-top{
        padding-left:22px;
        padding-right:22px;
      }
    }

  `;

  document.head.appendChild(style);

  /* =========================================================
     ADD EDIT BUTTON TO EVERY LAND
     ========================================================= */

  function addEditButtons(){

    const state = loadState();

    if(
      !state ||
      !Array.isArray(state.lands)
    ){
      return;
    }

    document.querySelectorAll("[data-open-land]").forEach(function(openButton){

      const id = openButton.dataset.openLand;

      if(!id){
        return;
      }

      const parent =
        openButton.closest(".land-card") ||
        openButton.closest("article") ||
        openButton.closest(".card") ||
        openButton.parentElement;

      if(!parent){
        return;
      }

      if(
        parent.querySelector(
          '[data-yk-v3-edit="' +
          CSS.escape(id) +
          '"]'
        )
      ){
        return;
      }

      const button =
        document.createElement("button");

      button.type = "button";
      button.className = "yk-v3-edit-btn";
      button.dataset.ykV3Edit = id;
      button.textContent = "✏️ ویرایش این زمین";

      button.addEventListener("click", function(event){

        event.preventDefault();
        event.stopPropagation();

        openEditor(id);

      });

      parent.appendChild(button);

    });

  }

  /* =========================================================
     LAND EDITOR
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
      state.lands.find(function(item){
        return item.id === id;
      });

    if(!land){
      alert("زمین موردنظر پیدا نشد.");
      return;
    }

    closeEditor();

    const overlay =
      document.createElement("div");

    overlay.className = "yk-v3-overlay";

    const modal =
      document.createElement("div");

    modal.className = "yk-v3-modal";

    modal.innerHTML = `

      <div class="yk-v3-head">

        <h2>
          ✏️ ویرایش زمین
        </h2>

        <button
          type="button"
          class="yk-v3-x"
          id="ykEditClose"
        >
          ×
        </button>

      </div>

      <div class="yk-v3-note">

        اطلاعات همین زمین تغییر می‌کند؛
        زمین جدید ساخته نمی‌شود.

        <br>

        برای تغییر دقیق مساحت،
        از «تغییر متراژ با نقشه و GPS» استفاده کن.

      </div>

      <div class="yk-v3-field">

        <label>
          نام زمین
        </label>

        <input
          id="ykEName"
          value="${esc(land.name)}"
          placeholder="مثلاً زمین شمالی"
        >

      </div>

      <div class="yk-v3-field">

        <label>
          مساحت (هکتار)
        </label>

        <input
          id="ykEArea"
          inputmode="decimal"
          value="${esc(land.area)}"
          placeholder="مثلاً 2.5"
        >

      </div>

      <button
        type="button"
        class="yk-v3-measure-btn"
        id="ykChangeMeasure"
      >
        📐 تغییر متراژ با نقشه و GPS
      </button>

      <div class="yk-v3-field">

        <label>
          روستا / شهر / منطقه
        </label>

        <input
          id="ykERegion"
          value="${esc(land.region)}"
        >

      </div>

      <div class="yk-v3-field">

        <label>
          مالکیت
        </label>

        <select id="ykEOwn">

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

      <div class="yk-v3-field">

        <label>
          نام مالک
        </label>

        <input
          id="ykEOwner"
          value="${esc(land.ownerName)}"
        >

      </div>

      <div class="yk-v3-field">

        <label>
          نوع خاک
        </label>

        <input
          id="ykESoil"
          value="${esc(land.soil)}"
        >

      </div>

      <div class="yk-v3-field">

        <label>
          منبع آب
        </label>

        <input
          id="ykEWater"
          value="${esc(land.water)}"
        >

      </div>

      <div class="yk-v3-field">

        <label>
          نوع آبیاری
        </label>

        <input
          id="ykEIrr"
          value="${esc(land.irrigation)}"
        >

      </div>

      <div class="yk-v3-field">

        <label>
          محصول
        </label>

        <input
          id="ykECrop"
          value="${esc(land.crop)}"
        >

      </div>

      <div class="yk-v3-field">

        <label>
          توضیحات
        </label>

        <textarea
          id="ykENotes"
          rows="4"
        >${esc(land.notes)}</textarea>

      </div>

      <div class="yk-v3-actions">

        <button
          type="button"
          class="yk-v3-save"
          id="ykESave"
        >
          💾 ذخیره تغییرات
        </button>

        <button
          type="button"
          class="yk-v3-cancel"
          id="ykECancel"
        >
          انصراف
        </button>

      </div>

    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector("#ykEditClose").onclick =
      function(){
        overlay.remove();
      };

    modal.querySelector("#ykECancel").onclick =
      function(){
        overlay.remove();
      };

    overlay.addEventListener("click", function(event){

      if(event.target === overlay){
        overlay.remove();
      }

    });

    modal.querySelector("#ykChangeMeasure").onclick =
      function(){

        openMeasure(id, overlay);

      };

    modal.querySelector("#ykESave").onclick =
      function(){

        const fresh =
          loadState();

        if(
          !fresh ||
          !Array.isArray(fresh.lands)
        ){
          alert("خطا در خواندن اطلاعات زمین.");
          return;
        }

        const target =
          fresh.lands.find(function(item){
            return item.id === id;
          });

        if(!target){
          alert("زمین پیدا نشد.");
          return;
        }

        const name =
          modal.querySelector("#ykEName")
            .value
            .trim();

        const area =
          toNumber(
            modal.querySelector("#ykEArea").value
          );

        if(!name){
          alert("نام زمین را وارد کن.");
          return;
        }

        if(area <= 0){
          alert("مساحت باید بیشتر از صفر باشد.");
          return;
        }

        target.name = name;
        target.area = area;

        target.region =
          modal.querySelector("#ykERegion")
            .value
            .trim();

        target.ownership =
          modal.querySelector("#ykEOwn")
            .value;

        target.ownerName =
          modal.querySelector("#ykEOwner")
            .value
            .trim();

        target.soil =
          modal.querySelector("#ykESoil")
            .value
            .trim();

        target.water =
          modal.querySelector("#ykEWater")
            .value
            .trim();

        target.irrigation =
          modal.querySelector("#ykEIrr")
            .value
            .trim();

        target.crop =
          modal.querySelector("#ykECrop")
            .value
            .trim();

        target.notes =
          modal.querySelector("#ykENotes")
            .value
            .trim();

        /*
          اگر متراژ نقشه‌ای قبلاً وجود داشته،
          اطلاعات دقیق آن حفظ می‌شود.
        */

        if(
          typeof target.areaM2 === "undefined" &&
          area > 0
        ){
          target.areaM2 = area * 10000;
        }

        if(!saveState(fresh)){
          alert("ذخیره انجام نشد.");
          return;
        }

        overlay.remove();

        refreshApp();

      };

  }

  /* =========================================================
     GEOGRAPHIC CALCULATIONS
     ========================================================= */

  function haversine(a, b){

    const R = 6371008.8;

    const rad = Math.PI / 180;

    const dLat =
      (b[0] - a[0]) * rad;

    const dLon =
      (b[1] - a[1]) * rad;

    const lat1 =
      a[0] * rad;

    const lat2 =
      b[0] * rad;

    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) ** 2;

    return (
      2 *
      R *
      Math.asin(
        Math.min(1, Math.sqrt(h))
      )
    );

  }

  function calculateArea(points){

    if(points.length < 3){
      return 0;
    }

    const R = 6371008.8;
    const rad = Math.PI / 180;

    let total = 0;

    for(
      let i = 0;
      i < points.length;
      i++
    ){

      const a =
        points[i];

      const b =
        points[
          (i + 1) %
          points.length
        ];

      total +=
        (b[1] - a[1]) *
        rad *
        (
          2 +
          Math.sin(a[0] * rad) +
          Math.sin(b[0] * rad)
        );

    }

    return Math.abs(
      total *
      R *
      R /
      2
    );

  }

  function calculatePerimeter(points){

    if(points.length < 2){
      return 0;
    }

    let total = 0;

    for(
      let i = 0;
      i < points.length;
      i++
    ){

      total +=
        haversine(
          points[i],
          points[
            (i + 1) %
            points.length
          ]
        );

    }

    return total;

  }

  /* =========================================================
     MEASUREMENT
     ========================================================= */

  function openMeasure(id, editOverlay){

    if(typeof L === "undefined"){

      alert(
        "نقشه هنوز بارگذاری نشده؛ چند لحظه بعد دوباره امتحان کن."
      );

      return;

    }

    editOverlay.remove();

    const state =
      loadState();

    const land =
      state &&
      state.lands &&
      state.lands.find(function(item){
        return item.id === id;
      });

    if(!land){
      return;
    }

    const overlay =
      document.createElement("div");

    overlay.className =
      "yk-measure-overlay";

    overlay.innerHTML = `

      <div class="yk-measure-top">

        <div class="yk-measure-title">

          <strong>
            📐 تغییر متراژ — ${esc(land.name)}
          </strong>

          <button
            type="button"
            class="yk-measure-close"
            id="ykMeasureClose"
          >
            ×
          </button>

        </div>

        <div class="yk-measure-sub">

          روی نقشه نقطه بزن یا GPS را روشن کن.
          نقاط بعداً قابل جابه‌جایی هستند.

        </div>

      </div>

      <div
        class="yk-measure-map"
        id="ykMeasureMap"
      >

        <div class="yk-measure-tools">

          <button
            type="button"
            id="ykMapBtn"
            class="on"
          >
            🗺️ نقشه
          </button>

          <button
            type="button"
            id="ykSatBtn"
          >
            🛰️ ماهواره
          </button>

        </div>

      </div>

      <div class="yk-measure-bottom">

        <div class="yk-measure-stats">

          <div class="yk-stat">

            <b id="ykMArea">
              ۰
            </b>

            <span>
              مترمربع
            </span>

          </div>

          <div class="yk-stat">

            <b id="ykMHect">
              ۰
            </b>

            <span>
              هکتار
            </span>

          </div>

          <div class="yk-stat">

            <b id="ykMPer">
              ۰
            </b>

            <span>
              متر محیط
            </span>

          </div>

        </div>

        <div class="yk-measure-row">

          <button
            type="button"
            class="yk-gps"
            id="ykGps"
          >
            📍 شروع GPS
          </button>

          <button
            type="button"
            class="yk-clear"
            id="ykClear"
          >
            🗑️ پاک کردن
          </button>

        </div>

        <button
          type="button"
          class="yk-measure-save"
          id="ykMeasureSave"
        >
          💾 ثبت متراژ برای همین زمین
        </button>

        <div class="yk-measure-hint">

          برای دقت بهتر، دور زمین چند نقطه واقعی ثبت کن.
          این ابزار نقشه‌ای است و جای نقشه‌برداری رسمی را نمی‌گیرد.

        </div>

      </div>

    `;

    document.body.appendChild(overlay);

    /* =====================================================
       MAP
       ===================================================== */

    const map =
      L.map(
        "ykMeasureMap",
        {
          zoomControl:true,
          attributionControl:true
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

    /* =====================================================
       EXISTING POINTS
       ===================================================== */

    let points = [];

    if(
      land.measurement &&
      Array.isArray(
        land.measurement.points
      )
    ){

      points =
        land.measurement.points
          .map(function(point){

            return [
              Number(point[0]),
              Number(point[1])
            ];

          })
          .filter(function(point){

            return (
              Number.isFinite(point[0]) &&
              Number.isFinite(point[1])
            );

          });

    }

    let markers = [];
    let polygon = null;

    let gpsWatch = null;
    let gpsOn = false;

    /* =====================================================
       REDRAW
       ===================================================== */

    function redraw(){

      markers.forEach(function(marker){
        marker.remove();
      });

      markers = [];

      if(polygon){
        polygon.remove();
        polygon = null;
      }

      points.forEach(function(point,index){

        const marker =
          L.marker(
            point,
            {
              draggable:true
            }
          ).addTo(map);

        marker.bindTooltip(
          String(index + 1),
          {
            permanent:true,
            direction:"top",
            offset:[0,-10],
            className:"yk-point-label"
          }
        );

        marker.on(
          "dragend",
          function(){

            const p =
              marker.getLatLng();

            points[index] = [
              p.lat,
              p.lng
            ];

            redraw();

          }
        );

        markers.push(marker);

      });

      if(points.length >= 2){

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

    /* =====================================================
       STATS
       ===================================================== */

    function updateStats(){

      const area =
        calculateArea(points);

      const perimeter =
        calculatePerimeter(points);

      overlay.querySelector(
        "#ykMArea"
      ).textContent =
        formatNumber(area,1);

      overlay.querySelector(
        "#ykMHect"
      ).textContent =
        formatNumber(area / 10000,3);

      overlay.querySelector(
        "#ykMPer"
      ).textContent =
        formatNumber(perimeter,1);

    }

    /* =====================================================
       MAP CLICK
       ===================================================== */

    map.on(
      "click",
      function(event){

        points.push([
          event.latlng.lat,
          event.latlng.lng
        ]);

        redraw();

      }
    );

    /* =====================================================
       MAP / SATELLITE
       ===================================================== */

    overlay.querySelector(
      "#ykMapBtn"
    ).onclick =
      function(){

        if(!map.hasLayer(street)){
          map.addLayer(street);
        }

        if(map.hasLayer(satellite)){
          map.removeLayer(satellite);
        }

        overlay.querySelector(
          "#ykMapBtn"
        ).classList.add("on");

        overlay.querySelector(
          "#ykSatBtn"
        ).classList.remove("on");

      };

    overlay.querySelector(
      "#ykSatBtn"
    ).onclick =
      function(){

        if(!map.hasLayer(satellite)){
          map.addLayer(satellite);
        }

        if(map.hasLayer(street)){
          map.removeLayer(street);
        }

        overlay.querySelector(
          "#ykSatBtn"
        ).classList.add("on");

        overlay.querySelector(
          "#ykMapBtn"
        ).classList.remove("on");

      };

    /* =====================================================
       CLEAR
       ===================================================== */

    overlay.querySelector(
      "#ykClear"
    ).onclick =
      function(){

        if(
          !confirm(
            "همه نقاط اندازه‌گیری پاک شود؟"
          )
        ){
          return;
        }

        points = [];

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

      gpsWatch = null;
      gpsOn = false;

      const button =
        overlay.querySelector(
          "#ykGps"
        );

      if(button){

        button.textContent =
          "📍 شروع GPS";

        button.classList.remove("on");

      }

    }

    overlay.querySelector(
      "#ykGps"
    ).onclick =
      function(){

        if(gpsOn){

          stopGPS();

          return;

        }

        if(!navigator.geolocation){

          alert(
            "GPS در این دستگاه در دسترس نیست."
          );

          return;

        }

        gpsOn = true;

        const button =
          overlay.querySelector(
            "#ykGps"
          );

        button.textContent =
          "⏹️ توقف GPS";

        button.classList.add("on");

        navigator.geolocation.getCurrentPosition(

          function(position){

            const point = [
              position.coords.latitude,
              position.coords.longitude
            ];

            if(points.length === 0){

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
              "دسترسی موقعیت مکانی داده نشد."
            );

            stopGPS();

          },

          {
            enableHighAccuracy:true,
            timeout:10000,
            maximumAge:0
          }

        );

        gpsWatch =
          navigator.geolocation.watchPosition(

            function(position){

              const point = [
                position.coords.latitude,
                position.coords.longitude
              ];

              if(
                points.length === 0 ||
                haversine(
                  points[points.length - 1],
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

    overlay.querySelector(
      "#ykMeasureClose"
    ).onclick =
      function(){

        stopGPS();

        overlay.remove();

        openEditor(id);

      };

    /* =====================================================
       SAVE MEASUREMENT
       ===================================================== */

    overlay.querySelector(
      "#ykMeasureSave"
    ).onclick =
      function(){

        if(points.length < 3){

          alert(
            "حداقل ۳ نقطه برای محاسبه زمین لازم است."
          );

          return;

        }

        const fresh =
          loadState();

        const target =
          fresh &&
          fresh.lands &&
          fresh.lands.find(function(item){
            return item.id === id;
          });

        if(!target){

          alert(
            "زمین پیدا نشد."
          );

          return;

        }

        const area =
          calculateArea(points);

        const perimeter =
          calculatePerimeter(points);

        if(area <= 0){

          alert(
            "مساحت قابل محاسبه نیست."
          );

          return;

        }

        /*
          ذخیره متراژ روی همان زمین
        */

        target.areaM2 =
          area;

        target.area =
          area / 10000;

        target.perimeter =
          perimeter;

        target.measurement = {

          points:
            points.map(function(point){

              return [
                point[0],
                point[1]
              ];

            }),

          area:
            area,

          perimeter:
            perimeter,

          updatedAt:
            new Date().toISOString()

        };

        /*
          اگر زمین مختصات نداشت،
          مرکز تقریبی را ذخیره می‌کنیم.
        */

        if(
          !target.lat ||
          !target.lng
        ){

          let lat = 0;
          let lng = 0;

          points.forEach(function(point){

            lat += point[0];
            lng += point[1];

          });

          target.lat =
            lat / points.length;

          target.lng =
            lng / points.length;

        }

        if(!saveState(fresh)){

          alert(
            "ذخیره متراژ انجام نشد."
          );

          return;

        }

        stopGPS();

        overlay.remove();

        refreshApp();

        /*
          بعد از برگشت، ویرایش همان زمین
          دوباره باز می‌شود.
        */

        setTimeout(
          function(){
            openEditor(id);
          },
          350
        );

      };

    /* =====================================================
       INITIAL VIEW
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
      150
    );

  }

  /* =========================================================
     REFRESH
     ========================================================= */

  function refreshApp(){

    try{

      if(
        typeof window.go === "function"
      ){

        window.go("home");

        setTimeout(
          function(){
            window.go("land");
          },
          100
        );

        return;

      }

    }catch(e){

      console.error(
        "Refresh app error:",
        e
      );

    }

    location.reload();

  }

  /* =========================================================
     OBSERVER
     ========================================================= */

  const observer =
    new MutationObserver(
      function(){
        addEditButtons();
      }
    );

  function boot(){

    addEditButtons();

    observer.observe(
      document.body,
      {
        childList:true,
        subtree:true
      }
    );

    setTimeout(
      addEditButtons,
      400
    );

    setTimeout(
      addEditButtons,
      1200
    );

  }

  if(
    document.readyState === "loading"
  ){

    document.addEventListener(
      "DOMContentLoaded",
      boot
    );

  }else{

    boot();

  }

})();
