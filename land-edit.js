/* =====================================
   Yar Keshavarz
   Land Edit Module V2
   ===================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "yk-v3-clean";

  /* ===============================
     STYLE
     =============================== */

  const style = document.createElement("style");

  style.textContent = `
    .land-edit-btn{
      width:100%;
      margin-top:10px;
      padding:14px 16px;
      border:0;
      border-radius:15px;
      background:#166534;
      color:#fff;
      font-size:15px;
      font-weight:700;
      cursor:pointer;
      box-shadow:0 5px 15px rgba(22,101,52,.18);
    }

    .land-edit-btn:active{
      transform:scale(.98);
    }

    .land-edit-overlay{
      position:fixed;
      inset:0;
      z-index:99999;
      background:rgba(0,0,0,.55);
      display:flex;
      align-items:flex-end;
      justify-content:center;
      padding:0;
    }

    .land-edit-modal{
      width:100%;
      max-width:620px;
      max-height:92vh;
      overflow-y:auto;
      background:#fff;
      border-radius:25px 25px 0 0;
      padding:20px;
      box-sizing:border-box;
      box-shadow:0 -10px 40px rgba(0,0,0,.25);
      direction:rtl;
    }

    .land-edit-title{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:18px;
    }

    .land-edit-title h2{
      margin:0;
      font-size:20px;
    }

    .land-edit-close{
      width:40px;
      height:40px;
      border:0;
      border-radius:50%;
      background:#f1f5f2;
      font-size:20px;
      cursor:pointer;
    }

    .land-edit-field{
      margin-bottom:13px;
    }

    .land-edit-field label{
      display:block;
      margin-bottom:6px;
      font-weight:700;
      font-size:14px;
    }

    .land-edit-field input,
    .land-edit-field select,
    .land-edit-field textarea{
      width:100%;
      box-sizing:border-box;
      border:1px solid #d8e2db;
      border-radius:13px;
      padding:12px 13px;
      font-family:inherit;
      font-size:15px;
      background:#fff;
      outline:none;
    }

    .land-edit-field input:focus,
    .land-edit-field select:focus,
    .land-edit-field textarea:focus{
      border-color:#22a05a;
      box-shadow:0 0 0 3px rgba(34,160,90,.10);
    }

    .land-edit-actions{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:9px;
      margin-top:18px;
    }

    .land-edit-save,
    .land-edit-cancel{
      border:0;
      border-radius:14px;
      padding:14px;
      font-family:inherit;
      font-size:15px;
      font-weight:700;
      cursor:pointer;
    }

    .land-edit-save{
      background:#166534;
      color:#fff;
    }

    .land-edit-cancel{
      background:#edf2ee;
      color:#333;
    }

    .land-edit-note{
      background:#f0fdf4;
      border:1px solid #d5f1dd;
      border-radius:13px;
      padding:11px 12px;
      margin-bottom:15px;
      font-size:13px;
      color:#166534;
    }

    @media(min-width:700px){
      .land-edit-overlay{
        align-items:center;
        padding:20px;
      }

      .land-edit-modal{
        border-radius:25px;
        max-height:90vh;
      }
    }
  `;

  document.head.appendChild(style);


  /* ===============================
     HELPERS
     =============================== */

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function faToEn(value) {
    return String(value ?? "")
      .replace(/[۰-۹]/g, function (d) {
        return "۰۱۲۳۴۵۶۷۸۹".indexOf(d);
      })
      .replace(/[٠-٩]/g, function (d) {
        return "٠١٢٣٤٥٦٧٨٩".indexOf(d);
      })
      .replace(/[٬,\s]/g, "");
  }


  function getState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) return null;

      return JSON.parse(raw);

    } catch (e) {
      console.error("Land edit load error:", e);
      return null;
    }
  }


  function saveState(state) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );

      return true;

    } catch (e) {
      console.error("Land edit save error:", e);
      return false;
    }
  }


  function getSelectedLand() {

    const state = getState();

    if (!state || !Array.isArray(state.lands)) {
      return null;
    }

    let id = null;

    /*
      app.js normally uses selected
    */

    if (
      typeof window.selected !== "undefined" &&
      window.selected
    ) {
      id = window.selected;
    }

    /*
      fallback: try data-open-land
    */

    if (!id) {

      const openButton =
        document.querySelector("[data-open-land]");

      if (openButton) {
        id = openButton.dataset.openLand;
      }

    }

    if (!id) return null;

    const land =
      state.lands.find(function (item) {
        return item.id === id;
      });

    if (!land) return null;

    return {
      state: state,
      land: land
    };
  }


  /* ===============================
     OPEN EDITOR
     =============================== */

  function openEditor(landId) {

    const state = getState();

    if (
      !state ||
      !Array.isArray(state.lands)
    ) {
      alert("اطلاعات زمین پیدا نشد.");
      return;
    }

    const land =
      state.lands.find(function (item) {
        return item.id === landId;
      });

    if (!land) {
      alert("زمین موردنظر پیدا نشد.");
      return;
    }


    const old =
      document.querySelector(".land-edit-overlay");

    if (old) {
      old.remove();
    }


    const overlay =
      document.createElement("div");

    overlay.className =
      "land-edit-overlay";


    const modal =
      document.createElement("div");

    modal.className =
      "land-edit-modal";


    modal.innerHTML = `

      <div class="land-edit-title">

        <h2>
          ✏️ ویرایش زمین
        </h2>

        <button
          type="button"
          class="land-edit-close"
          id="landEditClose"
        >
          ×
        </button>

      </div>


      <div class="land-edit-note">
        تغییرات را انجام بده و روی «ذخیره تغییرات» بزن.
        اطلاعات همین زمین ویرایش می‌شود و زمین جدید ساخته نمی‌شود.
      </div>


      <div class="land-edit-field">

        <label>
          نام زمین
        </label>

        <input
          id="editLandName"
          value="${escapeHTML(land.name)}"
          placeholder="مثلاً زمین شمالی"
        >

      </div>


      <div class="land-edit-field">

        <label>
          مساحت (هکتار)
        </label>

        <input
          id="editLandArea"
          inputmode="decimal"
          value="${escapeHTML(land.area)}"
          placeholder="مثلاً 2.5"
        >

      </div>


      <div class="land-edit-field">

        <label>
          روستا / شهر / منطقه
        </label>

        <input
          id="editLandRegion"
          value="${escapeHTML(land.region)}"
          placeholder="موقعیت زمین"
        >

      </div>


      <div class="land-edit-field">

        <label>
          مالکیت
        </label>

        <select id="editLandOwnership">

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


      <div class="land-edit-field">

        <label>
          نام مالک
        </label>

        <input
          id="editLandOwner"
          value="${escapeHTML(land.ownerName)}"
          placeholder="نام مالک"
        >

      </div>


      <div class="land-edit-field">

        <label>
          نوع خاک
        </label>

        <input
          id="editLandSoil"
          value="${escapeHTML(land.soil)}"
          placeholder="مثلاً رسی"
        >

      </div>


      <div class="land-edit-field">

        <label>
          منبع آب
        </label>

        <input
          id="editLandWater"
          value="${escapeHTML(land.water)}"
          placeholder="مثلاً چاه"
        >

      </div>


      <div class="land-edit-field">

        <label>
          نوع آبیاری
        </label>

        <input
          id="editLandIrrigation"
          value="${escapeHTML(land.irrigation)}"
          placeholder="مثلاً قطره‌ای"
        >

      </div>


      <div class="land-edit-field">

        <label>
          محصول
        </label>

        <input
          id="editLandCrop"
          value="${escapeHTML(land.crop)}"
          placeholder="مثلاً گندم"
        >

      </div>


      <div class="land-edit-field">

        <label>
          توضیحات
        </label>

        <textarea
          id="editLandNotes"
          rows="4"
          placeholder="توضیحات زمین"
        >${escapeHTML(land.notes)}</textarea>

      </div>


      <div class="land-edit-actions">

        <button
          type="button"
          class="land-edit-save"
          id="saveLandEdit"
        >
          💾 ذخیره تغییرات
        </button>

        <button
          type="button"
          class="land-edit-cancel"
          id="cancelLandEdit"
        >
          انصراف
        </button>

      </div>

    `;


    overlay.appendChild(modal);

    document.body.appendChild(overlay);


    /* ===============================
       CLOSE
       =============================== */

    document
      .querySelector("#landEditClose")
      .onclick = function () {
        overlay.remove();
      };


    document
      .querySelector("#cancelLandEdit")
      .onclick = function () {
        overlay.remove();
      };


    overlay.addEventListener(
      "click",
      function (event) {

        if (event.target === overlay) {
          overlay.remove();
        }

      }
    );


    /* ===============================
       SAVE
       =============================== */

    document
      .querySelector("#saveLandEdit")
      .onclick = function () {

        const freshState = getState();

        if (
          !freshState ||
          !Array.isArray(freshState.lands)
        ) {
          alert("خطا در خواندن اطلاعات زمین.");
          return;
        }


        const target =
          freshState.lands.find(
            function (item) {
              return item.id === landId;
            }
          );


        if (!target) {
          alert("زمین پیدا نشد.");
          return;
        }


        const name =
          document
            .querySelector("#editLandName")
            .value
            .trim();


        const areaText =
          document
            .querySelector("#editLandArea")
            .value;


        const area =
          Number(faToEn(areaText)) || 0;


        if (!name) {
          alert("نام زمین را وارد کن.");
          return;
        }


        if (area <= 0) {
          alert("مساحت زمین باید بیشتر از صفر باشد.");
          return;
        }


        /*
          Update existing land
        */

        target.name =
          name;

        target.area =
          area;

        target.region =
          document
            .querySelector("#editLandRegion")
            .value
            .trim();

        target.ownership =
          document
            .querySelector("#editLandOwnership")
            .value;

        target.ownerName =
          document
            .querySelector("#editLandOwner")
            .value
            .trim();

        target.soil =
          document
            .querySelector("#editLandSoil")
            .value
            .trim();

        target.water =
          document
            .querySelector("#editLandWater")
            .value
            .trim();

        target.irrigation =
          document
            .querySelector("#editLandIrrigation")
            .value
            .trim();

        target.crop =
          document
            .querySelector("#editLandCrop")
            .value
            .trim();

        target.notes =
          document
            .querySelector("#editLandNotes")
            .value
            .trim();


        /*
          Preserve measurement data
          */

        if (land.areaM2) {
          target.areaM2 =
            land.areaM2;
        }

        if (land.perimeter) {
          target.perimeter =
            land.perimeter;
        }

        if (land.measurement) {
          target.measurement =
            land.measurement;
        }

        if (land.lat !== undefined) {
          target.lat =
            land.lat;
        }

        if (land.lng !== undefined) {
          target.lng =
            land.lng;
        }


        /*
          Save
        */

        const ok =
          saveState(freshState);


        if (!ok) {
          alert("ذخیره اطلاعات انجام نشد.");
          return;
        }


        overlay.remove();


        alert(
          "✅ اطلاعات زمین با موفقیت ویرایش شد."
        );


        /*
          Refresh app
        */

        if (
          typeof window.go === "function"
        ) {

          window.go("land");

        } else {

          location.reload();

        }

      };

  }


  /* ===============================
     ADD EDIT BUTTON
     =============================== */

  function addEditButton() {

    if (
      typeof window.route !== "undefined" &&
      window.route !== "land"
    ) {
      return;
    }


    /*
      Find selected land
    */

    let landId = null;


    if (
      typeof window.selected !== "undefined" &&
      window.selected
    ) {

      landId =
        window.selected;

    }


    /*
      Search buttons
    */

    if (!landId) {

      const btn =
        document.querySelector(
          "[data-open-land]"
        );

      if (btn) {
        landId =
          btn.dataset.openLand;
      }

    }


    if (!landId) return;


    /*
      Don't duplicate
    */

    if (
      document.querySelector(
        "#landEditButton"
      )
    ) {
      return;
    }


    /*
      Find action area
    */

    let actions =
      document.querySelector(
        ".land-actions"
      );


    if (!actions) {

      actions =
        document.querySelector(
          ".actions"
        );

    }


    if (!actions) {

      /*
        fallback:
        add button to app
      */

      actions =
        document.querySelector(
          "#app"
        );

    }


    if (!actions) return;


    const button =
      document.createElement("button");


    button.id =
      "landEditButton";


    button.className =
      "land-edit-btn";


    button.textContent =
      "✏️ ویرایش اطلاعات زمین";


    button.onclick =
      function () {
        openEditor(landId);
      };


    actions.appendChild(button);

  }


  /* ===============================
     OBSERVER
     =============================== */

  const observer =
    new MutationObserver(
      function () {

        setTimeout(
          addEditButton,
          80
        );

      }
    );


  observer.observe(
    document.body,
    {
      childList:true,
      subtree:true
    }
  );


  /* ===============================
     LOAD
     =============================== */

  window.addEventListener(
    "load",
    function () {

      setTimeout(
        addEditButton,
        500
      );

    }
  );


  /*
    Also try periodically because
    app.js renders pages dynamically.
  */

  setInterval(
    function () {

      addEditButton();

    },
    1200
  );


})();
