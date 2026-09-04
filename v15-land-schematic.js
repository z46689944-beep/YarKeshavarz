/* =========================================================
   یار کشاورز V15
   نقشه شماتیک زمین داخل پرونده زمین
   بدون دستکاری app.js
   ========================================================= */

(function () {
  "use strict";

  const STATE_KEY = "yk-v03";
  const POINTS_KEY = "yk-v15-pending-points";
  const LAND_KEY = "yk-v15-current-land";

  function fa(n, digits = 0) {
    return Number(n || 0).toLocaleString("fa-IR", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits
    });
  }

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }

  function savePendingPoints(points) {
    if (!Array.isArray(points) || points.length < 3) return;

    const clean = points
      .map(p => [Number(p[0]), Number(p[1])])
      .filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]));

    if (clean.length >= 3) {
      sessionStorage.setItem(POINTS_KEY, JSON.stringify(clean));
    }
  }

  function getPendingPoints() {
    try {
      const p = JSON.parse(sessionStorage.getItem(POINTS_KEY) || "[]");
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }

  function saveCurrentLand(id) {
    if (id) sessionStorage.setItem(LAND_KEY, String(id));
  }

  function getCurrentLandId() {
    return sessionStorage.getItem(LAND_KEY) || "";
  }

  /* ---------------------------------------------------------
     1. گرفتن نقاط واقعی Polygon از Leaflet
     --------------------------------------------------------- */

  function hookLeaflet() {
    if (!window.L || !L.Map || !L.Map.prototype) return false;
    if (L.Map.prototype.__ykV15Hooked) return true;

    const originalAddLayer = L.Map.prototype.addLayer;

    L.Map.prototype.addLayer = function (layer) {
      const result = originalAddLayer.call(this, layer);

      try {
        if (
          layer &&
          typeof layer.getLatLngs === "function" &&
          this._container &&
          this._container.id === "map"
        ) {
          const raw = layer.getLatLngs();

          let pts = raw;

          // Polygon معمولاً آرایه تو در تو برمی‌گرداند
          if (Array.isArray(raw) && Array.isArray(raw[0])) {
            if (
              raw[0] &&
              raw[0][0] &&
              typeof raw[0][0].lat === "number"
            ) {
              pts = raw[0];
            }
          }

          if (Array.isArray(pts) && pts.length >= 3) {
            const coordinates = pts.map(p => [
              Number(p.lat),
              Number(p.lng)
            ]);

            savePendingPoints(coordinates);
          }
        }
      } catch (e) {
        console.warn("V15 polygon capture:", e);
      }

      return result;
    };

    L.Map.prototype.__ykV15Hooked = true;
    return true;
  }

  /* ---------------------------------------------------------
     2. ثبت اینکه کاربر کدام زمین را باز کرده
     --------------------------------------------------------- */

  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-open-land]");
    if (btn) {
      saveCurrentLand(btn.dataset.openLand);
    }
  }, true);

  /* ---------------------------------------------------------
     3. وقتی کاربر «استفاده از این مساحت» را می‌زند،
        آخرین Polygon را نگه می‌داریم.
     --------------------------------------------------------- */

  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-use-area]");
    if (!btn) return;

    const points = getPendingPoints();

    if (points.length >= 3) {
      sessionStorage.setItem(
        POINTS_KEY,
        JSON.stringify(points)
      );
    }
  }, true);

  /* ---------------------------------------------------------
     4. هنگام ذخیره زمین، نقاط را داخل همان زمین ذخیره کن
     --------------------------------------------------------- */

  document.addEventListener("submit", function (e) {
    if (!e.target || e.target.id !== "landForm") return;

    const points = getPendingPoints();
    if (points.length < 3) return;

    // کمی صبر می‌کنیم تا app.js زمین را بسازد
    setTimeout(() => {
      try {
        const state = readState();

        if (!Array.isArray(state.lands)) return;

        const last = state.lands[state.lands.length - 1];
        if (!last) return;

        last.measurePoints = points;
        last.mapPoints = points;
        last.schematicPoints = points;
        last.measureSource = "map";

        localStorage.setItem(
          STATE_KEY,
          JSON.stringify(state)
        );

        sessionStorage.removeItem(POINTS_KEY);
        saveCurrentLand(last.id);

        // دوباره پرونده زمین را تازه کن
        setTimeout(renderSchematic, 80);
      } catch (err) {
        console.warn("V15 save land points:", err);
      }
    }, 120);

  }, true);

  /* ---------------------------------------------------------
     5. ساخت SVG شماتیک
     --------------------------------------------------------- */

  function buildSVG(points, large = false) {
    if (!points || points.length < 3) return "";

    const xs = points.map(p => p[1]);
    const ys = points.map(p => p[0]);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const dx = Math.max(maxX - minX, 0.000001);
    const dy = Math.max(maxY - minY, 0.000001);

    const pad = large ? 90 : 45;
    const W = large ? 900 : 520;
    const H = large ? 620 : 320;

    const sx = (W - pad * 2) / dx;
    const sy = (H - pad * 2) / dy;
    const scale = Math.min(sx, sy);

    const ox = (W - dx * scale) / 2;
    const oy = (H - dy * scale) / 2;

    const coords = points.map(p => {
      const x = ox + (p[1] - minX) * scale;
      const y = H - (oy + (p[0] - minY) * scale);
      return [x, y];
    });

    const polygon = coords.map(p => p.join(",")).join(" ");

    const dots = coords.map((p, i) => `
      <circle
        cx="${p[0]}"
        cy="${p[1]}"
        r="${large ? 8 : 5}"
        fill="#fff"
        stroke="#1f7a45"
        stroke-width="${large ? 4 : 3}"
      />
      <text
        x="${p[0]}"
        y="${p[1] - (large ? 15 : 10)}"
        text-anchor="middle"
        font-size="${large ? 16 : 11}"
        font-weight="700"
        fill="#174d31"
      >${i + 1}</text>
    `).join("");

    return `
      <svg
        viewBox="0 0 ${W} ${H}"
        class="yk-v15-map-svg"
        role="img"
        aria-label="نقشه شماتیک زمین"
      >

        <defs>
          <pattern
            id="ykGrid${large ? "Large" : "Small"}"
            width="${large ? 40 : 25}"
            height="${large ? 40 : 25}"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M ${large ? 40 : 25} 0 L 0 0 0 ${large ? 40 : 25}"
              fill="none"
              stroke="rgba(30,90,50,.10)"
              stroke-width="1"
            />
          </pattern>

          <linearGradient id="ykFieldGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#8fcb72"/>
            <stop offset="100%" stop-color="#4e9b59"/>
          </linearGradient>
        </defs>

        <rect
          x="0"
          y="0"
          width="${W}"
          height="${H}"
          rx="${large ? 28 : 18}"
          fill="#eef7ed"
        />

        <rect
          x="0"
          y="0"
          width="${W}"
          height="${H}"
          rx="${large ? 28 : 18}"
          fill="url(#ykGrid${large ? "Large" : "Small"})"
        />

        <polygon
          points="${polygon}"
          fill="url(#ykFieldGradient)"
          fill-opacity=".72"
          stroke="#1f7a45"
          stroke-width="${large ? 7 : 5}"
          stroke-linejoin="round"
        />

        ${dots}

        <!-- شمال -->
        <g transform="translate(${W - (large ? 75 : 50)},${large ? 85 : 55})">
          <circle
            cx="0"
            cy="0"
            r="${large ? 32 : 22}"
            fill="rgba(255,255,255,.94)"
            stroke="#1f7a45"
            stroke-width="2"
          />
          <path
            d="M 0 ${large ? -22 : -15} L ${large ? 10 : 7} ${large ? 7 : 5} L 0 ${large ? 3 : 2} L ${large ? -10 : -7} ${large ? 7 : 5} Z"
            fill="#1f7a45"
          />
          <text
            x="0"
            y="${large ? 49 : 36}"
            text-anchor="middle"
            font-size="${large ? 17 : 12}"
            font-weight="800"
            fill="#174d31"
          >شمال</text>
        </g>

      </svg>
    `;
  }

  /* ---------------------------------------------------------
     6. کارت داخل پرونده زمین
     --------------------------------------------------------- */

  function buildCard(land) {
    const points =
      land.measurePoints ||
      land.mapPoints ||
      land.schematicPoints ||
      [];

    const areaHa = Number(land.area || 0);

    const areaM2 =
      land.areaM2
        ? Number(land.areaM2)
        : areaHa * 10000;

    const perimeter =
      Number(
        land.perimeter ||
        land.perimeterM ||
        0
      );

    if (!Array.isArray(points) || points.length < 3) {
      return `
        <section class="card yk-v15-schematic empty-schematic">
          <div class="yk-v15-title-row">
            <div>
              <div class="yk-v15-kicker">پرونده زمین</div>
              <h3>🗺️ نقشه شماتیک زمین</h3>
            </div>
          </div>

          <div class="yk-v15-empty">
            <div class="yk-v15-empty-icon">📐</div>
            <strong>مرز دقیق زمین هنوز ثبت نشده</strong>
            <p>
              برای نمایش شکل واقعی زمین،
              ابتدا زمین را روی نقشه اندازه‌گیری کن.
            </p>

            <button
              class="primary"
              data-route="measure"
            >
              📐 اندازه‌گیری زمین
            </button>
          </div>
        </section>
      `;
    }

    return `
      <section class="card yk-v15-schematic">

        <div class="yk-v15-title-row">

          <div>
            <div class="yk-v15-kicker">نقشه پرونده</div>
            <h3>🗺️ نقشه شماتیک زمین</h3>
            <p class="muted">
              ${points.length} نقطه مرزی ثبت شده
            </p>
          </div>

          <span class="yk-v15-live">
            ● ثبت شده
          </span>

        </div>

        <div class="yk-v15-map-preview">
          ${buildSVG(points)}
        </div>

        <div class="yk-v15-stats">

          <div>
            <span>مساحت</span>
            <strong>${fa(areaM2)} <small>مترمربع</small></strong>
          </div>

          <div>
            <span>هکتار</span>
            <strong>${fa(areaM2 / 10000, 3)}</strong>
          </div>

          <div>
            <span>محیط</span>
            <strong>
              ${perimeter ? fa(perimeter) : "—"}
              <small>${perimeter ? "متر" : ""}</small>
            </strong>
          </div>

        </div>

        <div class="yk-v15-actions">

          <button
            class="primary"
            data-v15-large-map
          >
            🗺️ نمایش نقشه بزرگ
          </button>

          <button
            class="secondary"
            data-route="measure"
          >
            📐 اندازه‌گیری مجدد
          </button>

        </div>

      </section>
    `;
  }

  /* ---------------------------------------------------------
     7. تزریق کارت بدون جایگزین کردن renderLand
     --------------------------------------------------------- */

  function renderSchematic() {
    const app = document.querySelector("#app");
    if (!app) return;

    const landId = getCurrentLandId();
    if (!landId) return;

    const state = readState();
    const lands = Array.isArray(state.lands)
      ? state.lands
      : [];

    const land = lands.find(x => String(x.id) === String(landId));
    if (!land) return;

    // فقط وقتی داخل پرونده زمین هستیم
    const tabs = app.querySelector("[data-land-tab]");
    if (!tabs) return;

    // اگر قبلاً وجود دارد دوباره نساز
    if (app.querySelector(".yk-v15-schematic")) return;

    const cardHTML = buildCard(land);

    const temp = document.createElement("div");
    temp.innerHTML = cardHTML.trim();

    const card = temp.firstElementChild;
    if (!card) return;

    // بعد از هدر پرونده و قبل از محتوای اصلی
    const tabsBox = app.querySelector(".tabs");

    if (tabsBox) {
      tabsBox.insertAdjacentElement("afterend", card);
    } else {
      app.prepend(card);
    }
  }

  /* ---------------------------------------------------------
     8. نقشه بزرگ
     --------------------------------------------------------- */

  function showLargeMap() {
    const landId = getCurrentLandId();
    if (!landId) return;

    const state = readState();
    const land = (state.lands || []).find(
      x => String(x.id) === String(landId)
    );

    if (!land) return;

    const points =
      land.measurePoints ||
      land.mapPoints ||
      land.schematicPoints ||
      [];

    if (!Array.isArray(points) || points.length < 3) {
      alert("برای این زمین نقشه شماتیک ثبت نشده است.");
      return;
    }

    const old = document.querySelector(".yk-v15-modal");
    if (old) old.remove();

    const areaM2 = Number(land.area || 0) * 10000;

    const modal = document.createElement("div");
    modal.className = "yk-v15-modal";

    modal.innerHTML = `
      <div class="yk-v15-modal-inner">

        <div class="yk-v15-modal-head">
          <div>
            <div class="yk-v15-kicker">نقشه زمین</div>
            <h2>${esc(land.name)}</h2>
          </div>

          <button
            class="yk-v15-close"
            data-v15-close
          >×</button>
        </div>

        <div class="yk-v15-large-map">
          ${buildSVG(points, true)}
        </div>

        <div class="yk-v15-large-info">

          <div>
            <span>مساحت</span>
            <strong>${fa(areaM2)} مترمربع</strong>
          </div>

          <div>
            <span>هکتار</span>
            <strong>${fa(areaM2 / 10000, 3)}</strong>
          </div>

          <div>
            <span>تعداد نقاط</span>
            <strong>${fa(points.length)}</strong>
          </div>

        </div>

        <button
          class="primary yk-v15-modal-close-btn"
          data-v15-close
        >
          بستن
        </button>

      </div>
    `;

    document.body.appendChild(modal);
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-v15-large-map]")) {
      showLargeMap();
      return;
    }

    if (e.target.closest("[data-v15-close]")) {
      const modal = document.querySelector(".yk-v15-modal");
      if (modal) modal.remove();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const modal = document.querySelector(".yk-v15-modal");
      if (modal) modal.remove();
    }
  });

  /* ---------------------------------------------------------
     9. CSS اختصاصی V15
     --------------------------------------------------------- */

  const style = document.createElement("style");

  style.textContent = `
    .yk-v15-schematic {
      position: relative;
      overflow: hidden;
      margin-top: 14px;
      padding: 16px;
      border: 1px solid rgba(255,255,255,.38);
      box-shadow: 0 14px 35px rgba(20,65,35,.12);
    }

    .yk-v15-title-row {
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:12px;
      margin-bottom:12px;
    }

    .yk-v15-title-row h3 {
      margin:2px 0 3px;
      font-size:18px;
    }

    .yk-v15-kicker {
      font-size:11px;
      font-weight:800;
      opacity:.62;
      letter-spacing:.3px;
    }

    .yk-v15-live {
      background:rgba(40,135,75,.11);
      color:#236c3e;
      border:1px solid rgba(40,135,75,.18);
      border-radius:999px;
      padding:6px 9px;
      font-size:10px;
      font-weight:800;
      white-space:nowrap;
    }

    .yk-v15-map-preview {
      width:100%;
      overflow:hidden;
      border-radius:18px;
      background:#edf7ec;
      border:1px solid rgba(30,90,50,.12);
    }

    .yk-v15-map-svg {
      display:block;
      width:100%;
      height:auto;
    }

    .yk-v15-stats {
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:8px;
      margin-top:10px;
    }

    .yk-v15-stats > div {
      padding:10px 8px;
      border-radius:14px;
      background:rgba(255,255,255,.65);
      border:1px solid rgba(30,90,50,.09);
      text-align:center;
    }

    .yk-v15-stats span,
    .yk-v15-large-info span {
      display:block;
      font-size:10px;
      opacity:.62;
      margin-bottom:4px;
    }

    .yk-v15-stats strong {
      display:block;
      font-size:14px;
    }

    .yk-v15-stats small {
      font-size:9px;
      font-weight:500;
    }

    .yk-v15-actions {
      display:grid;
      grid-template-columns:1.35fr 1fr;
      gap:8px;
      margin-top:10px;
    }

    .yk-v15-actions button {
      min-height:44px;
    }

    .yk-v15-empty {
      text-align:center;
      padding:26px 12px 20px;
      border-radius:18px;
      background:rgba(255,255,255,.48);
      border:1px dashed rgba(30,90,50,.18);
    }

    .yk-v15-empty-icon {
      font-size:36px;
      margin-bottom:8px;
    }

    .yk-v15-empty strong {
      display:block;
      font-size:15px;
    }

    .yk-v15-empty p {
      margin:7px auto 14px;
      max-width:300px;
      font-size:12px;
      opacity:.68;
      line-height:1.8;
    }

    .yk-v15-modal {
      position:fixed;
      inset:0;
      z-index:99999;
      background:rgba(7,25,14,.72);
      backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
      padding:12px;
      display:flex;
      align-items:center;
      justify-content:center;
    }

    .yk-v15-modal-inner {
      width:min(960px,100%);
      max-height:94vh;
      overflow:auto;
      background:rgba(248,252,247,.98);
      border-radius:26px;
      padding:15px;
      box-shadow:0 30px 90px rgba(0,0,0,.35);
    }

    .yk-v15-modal-head {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:12px;
    }

    .yk-v15-modal-head h2 {
      margin:2px 0 0;
      font-size:20px;
    }

    .yk-v15-close {
      width:42px;
      height:42px;
      border:0;
      border-radius:50%;
      font-size:28px;
      line-height:1;
      background:rgba(0,0,0,.07);
      cursor:pointer;
    }

    .yk-v15-large-map {
      width:100%;
      overflow:hidden;
      border-radius:22px;
      border:1px solid rgba(30,90,50,.12);
    }

    .yk-v15-large-map .yk-v15-map-svg {
      min-height:320px;
    }

    .yk-v15-large-info {
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:8px;
      margin:10px 0;
    }

    .yk-v15-large-info > div {
      text-align:center;
      padding:12px 8px;
      border-radius:15px;
      background:#fff;
      border:1px solid rgba(30,90,50,.08);
    }

    .yk-v15-large-info strong {
      font-size:14px;
    }

    .yk-v15-modal-close-btn {
      width:100%;
      min-height:48px;
    }

    @media(max-width:420px) {
      .yk-v15-actions {
        grid-template-columns:1fr;
      }

      .yk-v15-stats strong {
        font-size:12px;
      }

      .yk-v15-large-map .yk-v15-map-svg {
        min-height:250px;
      }
    }
  `;

  document.head.appendChild(style);

  /* ---------------------------------------------------------
     10. MutationObserver برای تشخیص ورود به پرونده زمین
     --------------------------------------------------------- */

  function startObserver() {
    const app = document.querySelector("#app");
    if (!app) return;

    const observer = new MutationObserver(() => {
      clearTimeout(window.__ykV15Timer);
      window.__ykV15Timer = setTimeout(renderSchematic, 80);
    });

    observer.observe(app, {
      childList: true,
      subtree: true
    });

    window.__ykV15Observer = observer;
  }

  /* ---------------------------------------------------------
     شروع V15
     --------------------------------------------------------- */

  function boot() {
    hookLeaflet();

    // اگر Leaflet کمی دیرتر لود شد
    let tries = 0;

    const timer = setInterval(() => {
      hookLeaflet();
      tries++;

      if (window.L && L.Map?.prototype?.__ykV15Hooked) {
        clearInterval(timer);
      }

      if (tries > 40) {
        clearInterval(timer);
      }
    }, 250);

    startObserver();

    setTimeout(renderSchematic, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
