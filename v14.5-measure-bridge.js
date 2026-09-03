/* Yar Keshavarz — V14.5 Measurement Bridge FIX
   ------------------------------------------------
   هدف:
   - هماهنگ‌سازی ثبت اندازه‌گیری با localStorage پروژه
   - اتصال مساحت، هکتار، محیط و نقاط نقشه به همان زمین
   - بدون تغییر در نقشه، ظاهر یا Rotation
*/

(function () {
  "use strict";

  const MEASURE_KEY = "yk-last-measure";
  const LAND_MAP_KEY = "yk-pending-land-map";
  const STATE_KEY = "yk-v03";

  function getMeasure() {
    try {
      return JSON.parse(
        localStorage.getItem(MEASURE_KEY) || "null"
      );
    } catch (e) {
      return null;
    }
  }

  function savePending(m) {
    if (!m) return;

    localStorage.setItem(
      LAND_MAP_KEY,
      JSON.stringify(m)
    );
  }

  function getState() {
    try {
      return JSON.parse(
        localStorage.getItem(STATE_KEY) || "null"
      );
    } catch (e) {
      return null;
    }
  }

  function saveState(state) {
    if (!state) return false;

    try {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify(state)
      );

      return true;
    } catch (e) {
      console.error(
        "YK: خطا در ذخیره اطلاعات زمین",
        e
      );

      return false;
    }
  }

  function fillLandArea() {
    const m = getMeasure();

    const input =
      document.getElementById("landArea");

    if (!m || !input) return;

    const hectares = Number(
      m.hectare ||
      (
        Number(m.area || 0) /
        10000
      )
    );

    if (hectares > 0) {
      input.value =
        hectares.toFixed(3);

      input.dispatchEvent(
        new Event(
          "input",
          { bubbles: true }
        )
      );

      input.dispatchEvent(
        new Event(
          "change",
          { bubbles: true }
        )
      );
    }
  }

  function goAdd() {
    const m = getMeasure();

    if (
      !m ||
      !Number(m.area) ||
      !Array.isArray(m.points) ||
      m.points.length < 3
    ) {
      alert(
        "ابتدا حداقل ۳ نقطه برای زمین ثبت کنید."
      );
      return;
    }

    savePending(m);

    /*
     * پروژه فعلی ممکن است از go()
     * یا setRoute() استفاده کند.
     */
    if (typeof window.go === "function") {
      window.go("add");
    } else if (
      typeof window.setRoute === "function"
    ) {
      window.setRoute("add");
    }

    setTimeout(fillLandArea, 150);
    setTimeout(fillLandArea, 400);
    setTimeout(fillLandArea, 800);
  }

  /*
   * دکمه ثبت زمین با اندازه‌گیری
   */
  document.addEventListener(
    "click",
    function (e) {

      const btn =
        e.target &&
        e.target.closest
          ? e.target.closest("#useBtn")
          : null;

      if (!btn) return;

      /*
       * اجازه می‌دهیم سیستم اندازه‌گیری
       * ابتدا yk-last-measure را ذخیره کند.
       */
      setTimeout(function () {

        const m = getMeasure();

        if (m) {
          goAdd();
        }

      }, 50);

    },
    true
  );

  /*
   * ثبت فرم زمین
   *
   * نکته مهم:
   * ابتدا app.js زمین را در yk-v03 ذخیره می‌کند.
   * سپس ما همان زمین آخر را پیدا کرده
   * و اطلاعات اندازه‌گیری را به آن اضافه می‌کنیم.
   */
  document.addEventListener(
    "submit",
    function (e) {

      if (
        !e.target ||
        e.target.id !== "landForm"
      ) {
        return;
      }

      const m = getMeasure();

      if (!m) return;

      savePending(m);

      /*
       * app.js باید اول فرم را ذخیره کند.
       * بعد از آن localStorage را می‌خوانیم.
       */
      setTimeout(function () {

        try {

          const state = getState();

          if (
            !state ||
            !Array.isArray(state.lands) ||
            !state.lands.length
          ) {
            console.warn(
              "YK: زمین ثبت‌شده در yk-v03 پیدا نشد."
            );
            return;
          }

          /*
           * آخرین زمین = زمینی که همین الان
           * توسط فرم ثبت شده است.
           */
          const land =
            state.lands[
              state.lands.length - 1
            ];

          const area =
            Number(m.area || 0);

          const hectare =
            Number(
              m.hectare ||
              area / 10000
            );

          const perimeter =
            Number(
              m.perimeter || 0
            );

          const points =
            Array.isArray(m.points)
              ? m.points
              : [];

          /*
           * اطلاعات کامل اندازه‌گیری
           */
          land.measurement = {
            area: area,
            hectare: hectare,
            perimeter: perimeter,
            points: points
          };

          /*
           * اطلاعات تکمیلی مرکز نقشه
           * در صورت وجود
           */
          if (
            m.center &&
            typeof m.center === "object"
          ) {
            land.mapCenter = {
              lat: Number(m.center.lat),
              lng: Number(m.center.lng)
            };
          }

          /*
           * ذخیره مستقیم در همان
           * localStorage اصلی پروژه
           */
          const saved =
            saveState(state);

          if (saved) {

            /*
             * پاک کردن داده موقت
             * فقط بعد از ذخیره موفق
             */
            localStorage.removeItem(
              LAND_MAP_KEY
            );

            /*
             * داده اندازه‌گیری قبلی را
             * هم پاک نمی‌کنیم؛ چون ممکن است
             * بخش‌های دیگر پروژه از آن استفاده کنند.
             */

            console.log(
              "YK: اندازه‌گیری با موفقیت به زمین متصل شد."
            );
          }

        } catch (err) {

          console.error(
            "YK: خطا هنگام اتصال اندازه‌گیری به زمین",
            err
          );

        }

      }, 700);

    },
    true
  );

  /*
   * API داخلی
   */
  window.YKMeasureV145 = {

    get: getMeasure,

    goAdd: goAdd,

    fillLandArea: fillLandArea,

    getState: getState,

    saveState: saveState

  };

  /*
   * حفظ اندازه نقشه
   * بدون دست‌کاری Rotation
   */
  function keepMapSized() {

    try {

      const map = window.M;

      if (
        map &&
        typeof map.resize === "function"
      ) {

        const el =
          document.getElementById(
            "measureMap"
          );

        if (
          el &&
          el.clientWidth > 0 &&
          el.clientHeight > 0
        ) {

          map.resize();

        }

      }

    } catch (e) {}

  }

  window.addEventListener(
    "resize",
    keepMapSized,
    { passive: true }
  );

  window.addEventListener(
    "orientationchange",
    function () {

      setTimeout(
        keepMapSized,
        120
      );

      setTimeout(
        keepMapSized,
        400
      );

    },
    { passive: true }
  );

  document.addEventListener(
    "visibilitychange",
    function () {

      if (!document.hidden) {

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

  setInterval(
    keepMapSized,
    1500
  );

})();
