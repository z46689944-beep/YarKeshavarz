/* Yar Keshavarz — V14.5 Unified Measurement Bridge */

(function () {
  "use strict";

  const MEASURE_KEY = "yk-last-measure";
  const STATE_KEY = "yk-v3-clean";

  function getMeasure() {
    try {
      return JSON.parse(localStorage.getItem(MEASURE_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function getState() {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function saveState(state) {
    if (!state) return false;

    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error("YK measurement save error", e);
      return false;
    }
  }

  function fillLandArea() {
    const m = getMeasure();
    const input = document.getElementById("landArea");

    if (!m || !input) return;

    const area = Number(m.area || 0);
    if (area <= 0) return;

    input.value = (area / 10000).toFixed(3);

    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function goAdd() {
    const m = getMeasure();

    if (!m || Number(m.area || 0) <= 0) {
      alert("ابتدا مساحت زمین را اندازه‌گیری کنید.");
      return;
    }

    if (typeof window.go === "function") {
      window.go("add");
    } else if (typeof window.setRoute === "function") {
      window.setRoute("add");
    }

    setTimeout(fillLandArea, 150);
    setTimeout(fillLandArea, 400);
    setTimeout(fillLandArea, 800);
  }

  document.addEventListener("click", function (e) {
    const btn = e.target?.closest?.("#useBtn");
    if (!btn) return;

    setTimeout(goAdd, 100);
  }, true);

  document.addEventListener("submit", function (e) {
    if (!e.target || e.target.id !== "landForm") return;

    const m = getMeasure();
    if (!m || Number(m.area || 0) <= 0) return;

    setTimeout(function () {
      try {
        const state = getState();

        if (!state || !Array.isArray(state.lands) || !state.lands.length) {
          console.warn("YK: land not found");
          return;
        }

        const land = state.lands[state.lands.length - 1];

        const area = Number(m.area || 0);
        const hectare = area / 10000;
        const perimeter = Number(m.perimeter || 0);
        const points = Array.isArray(m.points) ? m.points : [];

        land.areaM2 = area;
        land.area = hectare;

        land.measurement = {
          area: area,
          hectare: hectare,
          perimeter: perimeter,
          points: points
        };

        if (m.center) {
          land.mapCenter = {
            lat: Number(m.center.lat),
            lng: Number(m.center.lng)
          };
        }

        saveState(state);

        console.log("YK: unified measurement saved", area);

      } catch (err) {
        console.error("YK measurement error", err);
      }
    }, 800);
  }, true);

  window.YKMeasureV145 = {
    get: getMeasure,
    goAdd: goAdd,
    fillLandArea: fillLandArea,
    getState: getState,
    saveState: saveState
  };

})();
