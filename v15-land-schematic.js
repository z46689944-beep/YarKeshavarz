/* =========================================================
   YAR KESHHAVARZ — V15 LAND SCHEMATIC
   Compatible with app.js / yk-v3-clean
   ========================================================= */

(function () {
  'use strict';

  const KEY = 'yk-v3-clean';
  const STYLE_ID = 'yk-v15-style';
  const CARD_ID = 'ykV15SchematicCard';

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function getState() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  }

  function getCurrentLand() {
    try {
      if (typeof selected !== 'undefined' && selected && typeof land === 'function') {
        return land(selected);
      }
    } catch (_) {}

    const s = getState();

    if (s.currentLandId && Array.isArray(s.lands)) {
      return s.lands.find(x => String(x.id) === String(s.currentLandId));
    }

    return null;
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;

    style.textContent = `
      #${CARD_ID}{
        margin-top:16px;
        overflow:hidden;
        position:relative;
        border-radius:24px;
        background:
          linear-gradient(145deg,rgba(255,255,255,.98),rgba(242,248,243,.96));
        border:1px solid rgba(31,106,69,.12);
        box-shadow:0 12px 35px rgba(22,70,43,.10);
      }

      #${CARD_ID} .yk15-head{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:18px 18px 8px;
      }

      #${CARD_ID} .yk15-title{
        display:flex;
        align-items:center;
        gap:11px;
      }

      #${CARD_ID} .yk15-icon{
        width:42px;
        height:42px;
        border-radius:14px;
        display:grid;
        place-items:center;
        background:linear-gradient(135deg,#e8f6ec,#d7efdf);
        font-size:23px;
      }

      #${CARD_ID} h3{
        margin:0;
        font-size:17px;
      }

      #${CARD_ID} .yk15-sub{
        margin:4px 0 0;
        color:#718078;
        font-size:12px;
      }

      #${CARD_ID} .yk15-badge{
        white-space:nowrap;
        padding:7px 10px;
        border-radius:999px;
        background:#e8f6ec;
        color:#247044;
        font-size:11px;
        font-weight:700;
      }

      #${CARD_ID} .yk15-map{
        margin:10px 14px 14px;
        min-height:235px;
        border-radius:20px;
        position:relative;
        overflow:hidden;
        background:
          radial-gradient(circle at 20% 20%,rgba(255,255,255,.85),transparent 28%),
          linear-gradient(135deg,#eef6ee,#dcebdd);
      }

      #${CARD_ID} svg{
        width:100%;
        height:235px;
        display:block;
      }

      #${CARD_ID} .yk15-north{
        position:absolute;
        right:13px;
        top:13px;
        width:42px;
        height:42px;
        border-radius:13px;
        background:rgba(255,255,255,.9);
        display:grid;
        place-items:center;
        box-shadow:0 5px 16px rgba(0,0,0,.08);
        font-weight:900;
        color:#1c5638;
      }

      #${CARD_ID} .yk15-metrics{
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:9px;
        padding:0 14px 14px;
      }

      #${CARD_ID} .yk15-metric{
        padding:13px 8px;
        text-align:center;
        border-radius:16px;
        background:#fff;
        border:1px solid rgba(31,106,69,.08);
      }

      #${CARD_ID} .yk15-metric strong{
        display:block;
        color:#175d39;
        font-size:15px;
      }

      #${CARD_ID} .yk15-metric span{
        display:block;
        margin-top:4px;
        color:#7b8881;
        font-size:10px;
      }

      #${CARD_ID} .yk15-actions{
        display:flex;
        gap:9px;
        padding:0 14px 16px;
      }

      #${CARD_ID} .yk15-btn{
        flex:1;
        border:0;
        border-radius:15px;
        padding:12px 10px;
        font-family:inherit;
        font-size:12px;
        font-weight:700;
        cursor:pointer;
      }

      #${CARD_ID} .yk15-btn.primary{
        background:#1f7045;
        color:#fff;
      }

      #${CARD_ID} .yk15-btn.secondary{
        background:#edf5ef;
        color:#23643e;
      }

      @media(max-width:430px){
        #${CARD_ID} .yk15-metrics{
          grid-template-columns:1fr 1fr 1fr;
        }

        #${CARD_ID} .yk15-badge{
          display:none;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function fmt(v, digits) {
    return num(v).toLocaleString('fa-IR', {
      maximumFractionDigits: digits == null ? 1 : digits
    });
  }

  function getPoints(l) {
    if (!l) return [];

    if (
      l.measurement &&
      Array.isArray(l.measurement.points) &&
      l.measurement.points.length >= 3
    ) {
      return l.measurement.points;
    }

    if (Array.isArray(l.points) && l.points.length >= 3) {
      return l.points;
    }

    return [];
  }

  function polygonPoints(points) {
    if (!points.length) return '';

    const minLat = Math.min(...points.map(p => num(p[0])));
    const maxLat = Math.max(...points.map(p => num(p[0])));
    const minLng = Math.min(...points.map(p => num(p[1])));
    const maxLng = Math.max(...points.map(p => num(p[1])));

    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;

    return points.map(p => {
      const x =
        45 +
        ((num(p[1]) - minLng) / lngRange) * 210;

      const y =
        35 +
        (1 - (num(p[0]) - minLat) / latRange) * 160;

      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  function render() {
    injectStyle();

    const l = getCurrentLand();
    if (!l) return;

    const measuredArea =
      num(l.areaM2) ||
      num(l.measurement && l.measurement.area);

    if (!measuredArea) return;

    const perimeter =
      num(l.perimeter) ||
      num(l.measurement && l.measurement.perimeter);

    const hectares =
      num(l.area) ||
      num(l.measurement && l.measurement.hectare) ||
      measuredArea / 10000;

    const points = getPoints(l);

    let existing = document.getElementById(CARD_ID);

    if (existing) {
      existing.remove();
    }

    const card = document.createElement('div');
    card.id = CARD_ID;

    let polygon = '';

    if (points.length >= 3) {
      polygon = `
        <polygon
          points="${polygonPoints(points)}"
          fill="rgba(46,125,74,.24)"
          stroke="#237044"
          stroke-width="3"
          stroke-linejoin="round"
        />
      `;
    } else {
      polygon = `
        <path
          d="M65 65 L245 42 L285 145 L175 192 L55 145 Z"
          fill="rgba(46,125,74,.24)"
          stroke="#237044"
          stroke-width="3"
          stroke-linejoin="round"
        />
      `;
    }

    card.innerHTML = `
      <div class="yk15-head">
        <div class="yk15-title">
          <div class="yk15-icon">📐</div>
          <div>
            <h3>نقشه شماتیک زمین</h3>
            <p class="yk15-sub">
              نمای حرفه‌ای از محدوده ثبت‌شده
            </p>
          </div>
        </div>

        <div class="yk15-badge">
          ${points.length >= 3 ? '✓ نقاط ثبت شده' : '✓ اندازه ثبت شده'}
        </div>
      </div>

      <div class="yk15-map">
        <div class="yk15-north">N<br><small>↑</small></div>

        <svg
          viewBox="0 0 330 235"
          preserveAspectRatio="xMidYMid meet"
          aria-label="نقشه شماتیک زمین"
        >
          <defs>
            <pattern
              id="yk15Grid"
              width="25"
              height="25"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 25 0 L 0 0 0 25"
                fill="none"
                stroke="rgba(40,100,60,.08)"
                stroke-width="1"
              />
            </pattern>
          </defs>

          <rect
            x="0"
            y="0"
            width="330"
            height="235"
            fill="url(#yk15Grid)"
          />

          ${polygon}

          <text
            x="165"
            y="122"
            text-anchor="middle"
            font-size="15"
            font-weight="700"
            fill="#175d39"
          >
            ${fmt(measuredArea, 0)} مترمربع
          </text>
        </svg>
      </div>

      <div class="yk15-metrics">

        <div class="yk15-metric">
          <strong>${fmt(measuredArea, 0)}</strong>
          <span>مترمربع</span>
        </div>

        <div class="yk15-metric">
          <strong>${fmt(hectares, 2)}</strong>
          <span>هکتار</span>
        </div>

        <div class="yk15-metric">
          <strong>${perimeter ? fmt(perimeter, 0) : '—'}</strong>
          <span>محیط / متر</span>
        </div>

      </div>

      <div class="yk15-actions">
        <button
          type="button"
          class="yk15-btn secondary"
          id="yk15ShowInfo"
        >
          📊 جزئیات
        </button>

        <button
          type="button"
          class="yk15-btn primary"
          id="yk15OpenMap"
        >
          🗺️ نمایش نقشه بزرگ
        </button>
      </div>
    `;

    const measuredCard = document.querySelector('.measured-card');

    if (measuredCard) {
      measuredCard.insertAdjacentElement('afterend', card);
    } else {
      const container =
        document.querySelector('#app') ||
        document.body;

      container.appendChild(card);
    }

    const infoBtn = document.getElementById('yk15ShowInfo');

    if (infoBtn) {
      infoBtn.onclick = function () {
        const text =
          `مساحت: ${fmt(measuredArea, 0)} مترمربع\n` +
          `هکتار: ${fmt(hectares, 2)}\n` +
          `محیط: ${perimeter ? fmt(perimeter, 0) + ' متر' : 'ثبت نشده'}\n` +
          `تعداد نقاط: ${points.length}`;

        alert(text);
      };
    }

    const mapBtn = document.getElementById('yk15OpenMap');

    if (mapBtn) {
      mapBtn.onclick = function () {
        openLargeMap(l, points);
      };
    }
  }

  function openLargeMap(l, points) {
    let old = document.getElementById('yk15LargeMap');

    if (old) old.remove();

    const modal = document.createElement('div');

    modal.id = 'yk15LargeMap';

    Object.assign(modal.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '99999',
      background: 'rgba(8,25,15,.72)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '14px'
    });

    const area =
      num(l.areaM2) ||
      num(l.measurement && l.measurement.area);

    const perimeter =
      num(l.perimeter) ||
      num(l.measurement && l.measurement.perimeter);

    const poly =
      points.length >= 3
        ? polygonPoints(points)
        : '65,65 245,42 285,145 175,192 55,145';

    modal.innerHTML = `
      <div style="
        width:min(680px,100%);
        max-height:94vh;
        overflow:auto;
        background:#f8fbf8;
        border-radius:26px;
        padding:15px;
        box-shadow:0 20px 70px rgba(0,0,0,.3);
      ">

        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          margin-bottom:12px;
        ">
          <div>
            <strong style="font-size:18px">
              🗺️ نقشه زمین
            </strong>

            <div style="
              color:#718078;
              font-size:12px;
              margin-top:4px;
            ">
              ${l.name || 'زمین'}
            </div>
          </div>

          <button
            id="yk15CloseMap"
            style="
              width:42px;
              height:42px;
              border:0;
              border-radius:14px;
              background:#eaf3ec;
              font-size:20px;
            "
          >×</button>
        </div>

        <div style="
          border-radius:20px;
          overflow:hidden;
          background:#e3eee5;
        ">
          <svg
            viewBox="0 0 330 235"
            style="width:100%;height:auto;display:block"
          >
            <defs>
              <pattern
                id="yk15BigGrid"
                width="22"
                height="22"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M22 0L0 0 0 22"
                  fill="none"
                  stroke="rgba(30,90,50,.10)"
                />
              </pattern>
            </defs>

            <rect
              width="330"
              height="235"
              fill="#edf5ee"
            />

            <rect
              width="330"
              height="235"
              fill="url(#yk15BigGrid)"
            />

            <polygon
              points="${poly}"
              fill="rgba(38,125,73,.25)"
              stroke="#1f7045"
              stroke-width="4"
              stroke-linejoin="round"
            />

            <text
              x="165"
              y="122"
              text-anchor="middle"
              font-size="15"
              font-weight="700"
              fill="#175d39"
            >
              ${fmt(area, 0)} مترمربع
            </text>

            <text
              x="165"
              y="145"
              text-anchor="middle"
              font-size="11"
              fill="#397052"
            >
              ${fmt(area / 10000, 2)} هکتار
            </text>

            <text
              x="305"
              y="25"
              text-anchor="middle"
              font-size="18"
              font-weight="900"
              fill="#175d39"
            >
              N
            </text>

            <path
              d="M305 32 L305 55"
              stroke="#175d39"
              stroke-width="3"
            />

            <path
              d="M305 30 L299 40 L311 40 Z"
              fill="#175d39"
            />
          </svg>
        </div>

        <div style="
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:8px;
          margin-top:12px;
        ">

          <div style="
            background:#fff;
            border-radius:15px;
            padding:12px 6px;
            text-align:center;
          ">
            <b style="color:#175d39">
              ${fmt(area,0)}
            </b>
            <small style="
              display:block;
              color:#77847d;
              margin-top:4px;
            ">مترمربع</small>
          </div>

          <div style="
            background:#fff;
            border-radius:15px;
            padding:12px 6px;
            text-align:center;
          ">
            <b style="color:#175d39">
              ${fmt(area/10000,2)}
            </b>
            <small style="
              display:block;
              color:#77847d;
              margin-top:4px;
            ">هکتار</small>
          </div>

          <div style="
            background:#fff;
            border-radius:15px;
            padding:12px 6px;
            text-align:center;
          ">
            <b style="color:#175d39">
              ${perimeter ? fmt(perimeter,0) : '—'}
            </b>
            <small style="
              display:block;
              color:#77847d;
              margin-top:4px;
            ">محیط</small>
          </div>

        </div>

      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('yk15CloseMap').onclick =
      () => modal.remove();

    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  function boot() {
    injectStyle();

    render();

    setTimeout(render, 500);
    setTimeout(render, 1200);
    setTimeout(render, 2500);
  }

  boot();

  /*
    app.js changes route/state without a full page reload.
    This observer keeps V15 synchronized with the current land.
  */
  const observer = new MutationObserver(function () {
    clearTimeout(observer._timer);

    observer._timer = setTimeout(function () {
      render();
    }, 150);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();         
