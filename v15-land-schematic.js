/* =========================================================
   یار کشاورز V15
   نقشه شماتیک زمین داخل پرونده زمین
   نسخه اصلاح‌شده
   بدون دستکاری app.js
   ========================================================= */

(function () {
  "use strict";

  const V15 = {
    stateKeys: ["yk-v3-clean", "yk-v03"],
    currentLandKey: "yk-v15-current-land",
    pendingKey: "yk-v15-pending-points",
    styleId: "yk-v15-style",
    cardId: "ykV15SchematicCard",
    modalId: "ykV15MapModal"
  };

  /* =========================================================
     ابزارها
     ========================================================= */

  function fa(value, digits) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";

    return n.toLocaleString("fa-IR", {
      maximumFractionDigits: digits == null ? 0 : digits,
      minimumFractionDigits: digits == null ? 0 : digits
    });
  }

  function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/[&<>"']/g, function (m) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[m];
      });
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("V15 storage error:", e);
      return false;
    }
  }

  function getStates() {
    const result = [];

    V15.stateKeys.forEach(function (key) {
      const state = readJSON(key, null);

      if (
        state &&
        Array.isArray(state.lands)
      ) {
        result.push({
          key: key,
          state: state
        });
      }
    });

    return result;
  }

  function getCurrentLandId() {
    try {
      return (
        sessionStorage.getItem(V15.currentLandKey) ||
        localStorage.getItem(V15.currentLandKey) ||
        ""
      );
    } catch (e) {
      return "";
    }
  }

  function setCurrentLandId(id) {
    if (!id) return;

    try {
      sessionStorage.setItem(
        V15.currentLandKey,
        String(id)
      );
    } catch (e) {}

    try {
      localStorage.setItem(
        V15.currentLandKey,
        String(id)
      );
    } catch (e) {}
  }

  function getCurrentLand() {
    const id = getCurrentLandId();
    if (!id) return null;

    const states = getStates();

    for (let i = 0; i < states.length; i++) {
      const land = states[i].state.lands.find(function (x) {
        return String(x.id) === String(id);
      });

      if (land) {
        return {
          land: land,
          state: states[i].state,
          key: states[i].key
        };
      }
    }

    return null;
  }

  /* =========================================================
     نقاط زمین
     ========================================================= */

  function cleanPoints(points) {
    if (!Array.isArray(points)) return [];

    return points
      .map(function (p) {
        if (!Array.isArray(p)) return null;

        const lat = num(p[0]);
        const lng = num(p[1]);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }

        if (lat === 0 && lng === 0) {
          return null;
        }

        return [lat, lng];
      })
      .filter(Boolean);
  }

  function getLandPoints(land) {
    if (!land) return [];

    const candidates = [
      land.measurement &&
        land.measurement.points,

      land.measurePoints,
      land.mapPoints,
      land.schematicPoints,
      land.points
    ];

    for (let i = 0; i < candidates.length; i++) {
      const points = cleanPoints(candidates[i]);

      if (points.length >= 3) {
        return points;
      }
    }

    return [];
  }

  function getPendingPoints() {
    try {
      const p = JSON.parse(
        sessionStorage.getItem(V15.pendingKey) || "[]"
      );

      return cleanPoints(p);
    } catch (e) {
      return [];
    }
  }

  function savePendingPoints(points) {
    const clean = cleanPoints(points);

    if (clean.length < 3) return;

    try {
      sessionStorage.setItem(
        V15.pendingKey,
        JSON.stringify(clean)
      );
    } catch (e) {}
  }

  /* =========================================================
     محاسبه محیط
     ========================================================= */

  function distanceMeters(a, b) {
    const R = 6371000;

    const lat1 = a[0] * Math.PI / 180;
    const lat2 = b[0] * Math.PI / 180;

    const dLat =
      (b[0] - a[0]) * Math.PI / 180;

    const dLng =
      (b[1] - a[1]) * Math.PI / 180;

    const x =
      Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
      Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

    return (
      2 *
      R *
      Math.atan2(
        Math.sqrt(x),
        Math.sqrt(1 - x)
      )
    );
  }

  function calculatePerimeter(points) {
    if (points.length < 3) return 0;

    let total = 0;

    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];

      total += distanceMeters(a, b);
    }

    return total;
  }

  /* =========================================================
     پیدا کردن مساحت
     ========================================================= */

  function getAreaM2(land, points) {
    if (!land) return 0;

    if (land.measurement) {
      const a = num(land.measurement.area);

      if (a > 0) return a;
    }

    if (num(land.areaM2) > 0) {
      return num(land.areaM2);
    }

    if (num(land.area) > 0) {
      return num(land.area) * 10000;
    }

    return 0;
  }

  /* =========================================================
     گرفتن Polygon از Leaflet
     ========================================================= */

  function hookLeaflet() {
    if (
      !window.L ||
      !L.Map ||
      !L.Map.prototype
    ) {
      return false;
    }

    if (L.Map.prototype.__ykV15Hooked) {
      return true;
    }

    const originalAddLayer =
      L.Map.prototype.addLayer;

    L.Map.prototype.addLayer = function (layer) {
      const result =
        originalAddLayer.call(this, layer);

      try {
        if (
          this._container &&
          this._container.id === "map" &&
          layer &&
          typeof layer.getLatLngs === "function"
        ) {
          const raw = layer.getLatLngs();

          let pts = raw;

          /*
           Polygon:
           [
             [
               LatLng,
               LatLng,
               ...
             ]
           ]
          */

          if (
            Array.isArray(raw) &&
            Array.isArray(raw[0]) &&
            raw[0].length
          ) {
            pts = raw[0];
          }

          if (
            Array.isArray(pts) &&
            pts.length >= 3
          ) {
            const coordinates = pts
              .map(function (p) {
                if (!p) return null;

                const lat =
                  typeof p.lat === "number"
                    ? p.lat
                    : num(p[0]);

                const lng =
                  typeof p.lng === "number"
                    ? p.lng
                    : num(p[1]);

                return [lat, lng];
              })
              .filter(function (p) {
                return (
                  Number.isFinite(p[0]) &&
                  Number.isFinite(p[1])
                );
              });

            if (coordinates.length >=
