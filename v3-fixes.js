
/* =========================================================
   Yar Keshavarz V3.5
   Measurement + Map Fix
   ========================================================= */

(function () {
  'use strict';

  /* -------------------------------------------------------
     ظاهر
     ------------------------------------------------------- */

  const css = document.createElement('style');

  css.textContent = `
    /* جلوگیری از دوباره نمایش دادن جزئیات متراژ */
    .measured-card > .row,
    .measured-card .measure-detail-grid {
      display: none !important;
    }

    /* تصویر نقشه شماتیک */
    .land-plan-inside img {
      max-width: 100% !important;
      height: auto !important;
      display: block !important;
    }

    /* نقشه */
    #measureMap {
      width: 100% !important;
      min-height: 320px !important;
      overflow: hidden !important;
      touch-action: none !important;
    }

    /* آب و هوا */
    .weather-page-head {
      min-height: 135px !important;
    }

    .weather-temp-row strong {
      font-size: 38px !important;
      line-height: 1.1 !important;
    }

    .weather-big-icon {
      font-size: 46px !important;
      line-height: 1 !important;
    }

    /* ادوات کشاورزی */
    .yk-equipment-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .yk-equipment-card {
      padding: 14px;
      border: 1px solid rgba(0,0,0,.08);
      border-radius: 16px;
      background: #fff;
    }

    .yk-equipment-card h3 {
      margin: 0 0 6px;
    }

    .yk-equipment-card p {
      margin: 4px 0;
      opacity: .78;
    }

    .yk-equipment-actions {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }

    .yk-equipment-actions button {
      flex: 1;
    }

    @media(max-width:560px) {
      .weather-page-head {
        padding: 14px !important;
      }

      .weather-temp-row strong {
        font-size: 36px !important;
      }

      .weather-big-icon {
        font-size: 44px !important;
      }

      .yk-equipment-grid {
        grid-template-columns: 1fr;
      }
    }

    /* نقاط متراژ */
    .yk35-point {
      background: transparent !important;
      border: 0 !important;
    }

    .yk35-point span {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #15803d;
      color: #fff;
      font: bold 14px sans-serif;
      border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,.25);
    }

    .yk35-control {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .yk35-control button {
      flex: 1;
      min-width: 130px;
    }
  `;

  document.head.appendChild(css);


  /* =======================================================
     ابزارهای کمکی
     ======================================================= */

  function esc2(v) {
    return String(v ?? '').replace(
      /[&<>\"']/g,
      m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[m])
    );
  }


  /* =======================================================
     ادوات کشاورزی
     ======================================================= */

  function getEq() {
    try {
      return JSON.parse(
        localStorage.getItem('yk-equipment') || '[]'
      );
    } catch (e) {
      return [];
    }
  }

  function setEq(a) {
    localStorage.setItem(
      'yk-equipment',
      JSON.stringify(a)
    );
  }

  window.renderEquipment = function () {

    const app = document.getElementById('app');

    if (!app) return;

    const a = getEq();

    app.innerHTML = `
      <section class="page">

        <div class="section-head">

          <h2>ادوات کشاورزی</h2>

          <button
            class="primary"
            data-eq-add>
            ＋ افزودن وسیله
          </button>

        </div>

        <div class="card">

          <h3>موجودی ادوات مزرعه</h3>

          <p class="muted">
            تراکتور، سمپاش، کمباین، تیلر
            و سایر تجهیزات را اینجا ثبت و مدیریت کن.
          </p>

        </div>

        <div class="yk-equipment-grid">

          ${
            a.length

            ?

            a.map((x,i) => `

              <article class="yk-equipment-card">

                <h3>
                  🚜 ${esc2(x.name || 'بدون نام')}
                </h3>

                <p>
                  دسته:
                  <b>${esc2(x.type || 'سایر')}</b>
                </p>

                <p>
                  تعداد:
                  <b>${esc2(x.qty || 1)}</b>
                </p>

                <p>
                  وضعیت:
                  <b>${esc2(x.status || 'فعال')}</b>
                </p>

                <div class="yk-equipment-actions">

                  <button
                    class="secondary"
                    data-eq-edit="${i}">
                    ویرایش
                  </button>

                  <button
                    class="danger"
                    data-eq-del="${i}">
                    حذف
                  </button>

                </div>

              </article>

            `).join('')

            :

            `

              <div
                class="card"
                style="
                  grid-column:1/-1;
                  text-align:center;
                  padding:28px
                "
              >

                <div style="font-size:48px">
                  🚜
                </div>

                <h3>
                  هنوز ادواتی ثبت نشده
                </h3>

                <p class="muted">
                  اولین وسیله کشاورزی را اضافه کن.
                </p>

              </div>

            `
          }

        </div>

      </section>
    `;
  };


  function editEq(i) {

    const a = getEq();

    const x =
      i == null
      ? {}
      : a[i];

    const name =
      prompt(
        'نام وسیله:',
        x.name || ''
      );

    if (name === null) return;

    if (!name.trim()) {

      alert(
        'نام وسیله را وارد کن.'
      );

      return;
    }

    const type =
      prompt(
        'دسته‌بندی:',
        x.type || 'تراکتور'
      ) || 'سایر';

    const qty =
      prompt(
        'تعداد:',
        x.qty || 1
      ) || 1;

    const status =
      prompt(
        'وضعیت:',
        x.status || 'فعال'
      ) || 'فعال';

    const item = {

      name: name.trim(),

      type: type.trim(),

      qty: String(qty).trim(),

      status: status.trim()

    };

    if (i == null) {

      a.push(item);

    } else {

      a[i] = item;

    }

    setEq(a);

    window.renderEquipment();
  }


  function addEquipmentEntry() {

    if (
      document.querySelector(
        '.yk-equipment-entry'
      )
    ) {
      return;
    }

    const inv =
      document.querySelector(
        '.section-head'
      );

    if (!inv) return;

    const b =
      document.createElement('button');

    b.className =
      'secondary yk-equipment-entry';

    b.dataset.route =
      'equipment';

    b.textContent =
      '🚜 ادوات کشاورزی';

    inv.parentNode.insertBefore(
      b,
      inv.nextSibling
    );
  }


  const oldInventory =
    window.renderInventory;

  if (
    typeof oldInventory === 'function'
  ) {

    window.renderInventory =
      function () {

        oldInventory();

        addEquipmentEntry();

      };
  }


  const oldHome =
    window.renderHome;

  if (
    typeof oldHome === 'function'
  ) {

    window.renderHome =
      function () {

        oldHome();

        const q =
          document.querySelector(
            '.quick'
          );

        if (
          q &&
          !q.querySelector(
            '[data-route="equipment"]'
          )
        ) {

          const b =
            document.createElement(
              'button'
            );

          b.className =
            'card';

          b.dataset.route =
            'equipment';

          b.innerHTML =
            '🚜<br>ادوات کشاورزی';

          q.appendChild(b);
        }

      };
  }


  /* =======================================================
     نقشه Leaflet
     ======================================================= */

  if (window.L) {

    const origMap =
      window.L.map;

    if (
      origMap &&
      !origMap.__yk35
    ) {

      function safeMap(
        id,
        opts
      ) {

        opts =
          Object.assign(
            {},
            opts || {},
            {
              maxZoom: 18,
              minZoom: 3,
              worldCopyJump: false,
              zoomControl: true
            }
          );

        const m =
          origMap.call(
            this,
            id,
            opts
          );

        if (
          id === 'measureMap'
        ) {

          window.__ykMeasureMap =
            m;

          setTimeout(
            () => {

              try {
                m.invalidateSize(true);
              } catch (e) {}

            },
            300
          );
        }

        return m;
      }

      safeMap.__yk35 = true;

      window.L.map =
        safeMap;
    }


    const origTile =
      window.L.tileLayer;

    if (
      origTile &&
      !origTile.__yk35
    ) {

      function safeTile(
        url,
        opts
      ) {

        opts =
          Object.assign(
            {},
            opts || {},
            {
              maxZoom: 18,
              maxNativeZoom: 18,
              keepBuffer: 5
            }
          );

        delete opts.noWrap;

        return origTile.call(
          this,
          url,
          opts
        );
      }

      safeTile.__yk35 = true;

      window.L.tileLayer =
        safeTile;
    }
  }


  /* =======================================================
     سیستم جدید اندازه‌گیری
     ======================================================= */

  function setupMeasurement() {

    const map =
      window.__ykMeasureMap;

    const box =
      document.getElementById(
        'measureMap'
      );

    if (
      !map ||
      !box ||
      map.__yk35ready
    ) {
      return;
    }

    map.__yk35ready = true;


    /* فعال کردن زوم و حرکت */

    try {
      map.touchZoom.enable();
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
    } catch (e) {}


    /* حذف listener قدیمی */

    try {
      map.off('click');
    } catch (e) {}


    const layer =
      L.layerGroup().addTo(map);

    const points = [];


    /* -----------------------------------------------------
       فاصله جغرافیایی
       ----------------------------------------------------- */

    function distance(a,b) {

      const R =
        6371008.8;

      const p1 =
        a.lat *
        Math.PI / 180;

      const p2 =
        b.lat *
        Math.PI / 180;

      const dp =
        (b.lat - a.lat) *
        Math.PI / 180;

      const dl =
        (b.lng - a.lng) *
        Math.PI / 180;

      const h =
        Math.sin(dp/2) ** 2 +
        Math.cos(p1) *
        Math.cos(p2) *
        Math.sin(dl/2) ** 2;

      return (
        2 *
        R *
        Math.asin(
          Math.min(
            1,
            Math.sqrt(h)
          )
        )
      );
    }


    /* -----------------------------------------------------
       محاسبه مساحت
       ----------------------------------------------------- */

    function calculate() {

      if (
        points.length < 3
      ) {

        let p = 0;

        for (
          let i = 1;
          i < points.length;
          i++
        ) {

          p += distance(
            points[i-1],
            points[i]
          );
        }

        return {
          area: 0,
          perimeter: p
        };
      }


      const R =
        6371008.8;

      const lat0 =
        points.reduce(
          (s,p) =>
            s + p.lat,
          0
        ) /
        points.length *
        Math.PI / 180;


      const xy =
        points.map(
          p => [

            R *
            p.lng *
            Math.PI / 180 *
            Math.cos(lat0),

            R *
            p.lat *
            Math.PI / 180

          ]
        );


      let area = 0;


      for (
        let i = 0;
        i < xy.length;
        i++
      ) {

        const j =
          (i + 1) %
          xy.length;

        area +=
          xy[i][0] *
          xy[j][1] -

          xy[j][0] *
          xy[i][1];
      }


      let perimeter = 0;


      for (
        let i = 0;
        i < points.length;
        i++
      ) {

        const j =
          (i + 1) %
          points.length;

        perimeter +=
          distance(
            points[i],
            points[j]
          );
      }


      return {

        area:
          Math.abs(area) / 2,

        perimeter

      };
    }


    /* -----------------------------------------------------
       رسم نقاط
       ----------------------------------------------------- */

    function draw() {

      layer.clearLayers();


      if (
        points.length >= 2
      ) {

        L.polyline(
          points,
          {
            weight: 4
          }
        ).addTo(layer);
      }


      if (
        points.length >= 3
      ) {

        L.polygon(
          points,
          {
            weight: 3,
            fillOpacity: .16
          }
        ).addTo(layer);
      }


      points.forEach(
        (p,i) => {

          L.marker(
            p,
            {
              icon:
                L.divIcon({

                  className:
                    'yk35-point',

                  html:
                    '<span>' +
                    (i + 1) +
                    '</span>',

                  iconSize:
                    [34,34],

                  iconAnchor:
                    [17,17]

                })
            }
          ).addTo(layer);

        }
      );


      const m =
        calculate();


      const area =
        document.getElementById(
          'mArea'
        );

      const ha =
        document.getElementById(
          'mHa'
        );

      const per =
        document.getElementById(
          'mPer'
        );

      const acc =
        document.getElementById(
          'mAcc'
        );

      const use =
        document.getElementById(
          'useBtn'
        );


      if (area) {

        area.textContent =
          Math.round(
            m.area
          ).toLocaleString(
            'fa-IR'
          );
      }


      if (ha) {

        ha.textContent =
          (
            m.area / 10000
          ).toLocaleString(
            'fa-IR',
            {
              maximumFractionDigits: 3
            }
          );
      }


      if (per) {

        per.textContent =
          Math.round(
            m.perimeter
          ).toLocaleString(
            'fa-IR'
          );
      }


      if (acc) {

        acc.textContent =
          points.length +
          ' نقطه · اندازه‌گیری نقشه';
      }


      if (use) {

        use.disabled =
          points.length < 3;

        use.textContent =
          points.length >= 3

          ?

          '📐 ثبت زمین با این مساحت'

          :

          '📐 حداقل ۳ نقطه لازم است';
      }
    }


    /* -----------------------------------------------------
       اضافه کردن نقطه
       ----------------------------------------------------- */

    map.on(
      'click',
      function (e) {

        points.push({

          lat:
            e.latlng.lat,

          lng:
            e.latlng.lng

        });

        draw();

      }
    );


    /* -----------------------------------------------------
       برگشت یک نقطه
       ----------------------------------------------------- */

    window.__ykMeasureUndo =
      function () {

        if (
          points.length === 0
        ) {
          return;
        }

        points.pop();

        draw();
      };


    /* -----------------------------------------------------
       پاک کردن همه نقاط
       ----------------------------------------------------- */

    window.__ykMeasureClear =
      function () {

        points.length = 0;

        draw();
      };


    /* -----------------------------------------------------
       ثبت متراژ
       ----------------------------------------------------- */

    window.__ykMeasureUse =
      function () {

        if (
          points.length < 3
        ) {

          alert(
            'حداقل ۳ نقطه لازم است.'
          );

          return;
        }


        const m =
          calculate();


        sessionStorage.setItem(
          'yk-measured-area',
          String(m.area)
        );


        sessionStorage.setItem(
          'yk-measured-perimeter',
          String(m.perimeter)
        );


        sessionStorage.setItem(
          'yk-measured-points',
          JSON.stringify(points)
        );


        if (
          typeof window.go ===
          'function'
        ) {

          window.go(
            'add'
          );
        }
      };


    /* -----------------------------------------------------
       دکمه‌های برگشت و پاک کردن
       ----------------------------------------------------- */

    const controls =
      document.querySelector(
        '.measure-overlay'
      );


    if (
      controls &&
      !document.getElementById(
        'yk35Undo'
      )
    ) {

      const b =
        document.createElement(
          'button'
        );

      b.id =
        'yk35Undo';

      b.className =
        'secondary';

      b.textContent =
        '↩️ برگشت یک نقطه';

      b.style.marginTop =
        '8px';

      controls.appendChild(
        b
      );
    }


    if (
      controls &&
      !document.getElementById(
        'yk35Clear'
      )
    ) {

      const c =
        document.createElement(
          'button'
        );

      c.id =
        'yk35Clear';

      c.className =
        'secondary';

      c.textContent =
        '🗑️ پاک کردن نقاط';

      c.style.marginTop =
        '8px';

      controls.appendChild(
        c
      );
    }


    draw();
  }


  /* =======================================================
     اتصال نقشه به سیستم جدید
     ======================================================= */

  function watchMap() {

    if (
      document.getElementById(
        'measureMap'
      ) &&
      window.__ykMeasureMap
    ) {

      setupMeasurement();

    }

  }


  const timer =
    setInterval(
      watchMap,
      100
    );


  setTimeout(
    () => {
      clearInterval(timer);
    },
    15000
  );


  /* =======================================================
     جستجوی روستا / شهر
     ======================================================= */

  async function searchBetter() {

    const input =
      document.getElementById(
        'measureSearch'
      );

    const q =
      (
        input &&
        input.value
        ||
        ''
      ).trim();


    const map =
      window.__ykMeasureMap;


    if (!q) {

      alert(
        'نام روستا، شهر یا مختصات را وارد کن.'
      );

      return;
    }


    if (!map) {

      alert(
        'نقشه هنوز آماده نشده است.'
      );

      return;
    }


    try {

      /* مختصات مستقیم */

      const coord =
        q
          .replace(/،/g, ',')
          .split(',')
          .map(
            x =>
              Number(
                x.trim()
              )
          );


      if (
        coord.length === 2 &&
        coord.every(
          Number.isFinite
        ) &&
        Math.abs(coord[0]) <= 90 &&
        Math.abs(coord[1]) <= 180
      ) {

        map.setView(
          [
            coord[0],
            coord[1]
          ],
          16
        );


        L.marker(
          [
            coord[0],
            coord[1]
          ]
        )
          .addTo(map)
          .bindPopup(
            'موقعیت جستجو'
          )
          .openPopup();


        return;
      }


      /* جستجوی نام */

      const queries = [

        q,

        q + ', ایران',

        q + ', Iran'

      ];


      let data = [];


      for (
        const text of queries
      ) {

        const url =
          'https://nominatim.openstreetmap.org/search' +

          '?format=jsonv2' +

          '&limit=8' +

          '&addressdetails=1' +

          '&namedetails=1' +

          '&accept-language=fa' +

          '&countrycodes=ir' +

          '&q=' +

          encodeURIComponent(
            text
          );


        const response =
          await fetch(
            url,
            {
              headers: {
                'Accept':
                  'application/json'
              }
            }
          );


        const result =
          await response.json();


        if (
          Array.isArray(result) &&
          result.length
        ) {

          data =
            result;

          break;
        }
      }


      if (!data.length) {

        alert(
          'روستا پیدا نشد. نام روستا را همراه شهرستان یا استان وارد کن.'
        );

        return;
      }


      const r =
        data[0];


      const lat =
        Number(r.lat);

      const lng =
        Number(r.lon);


      map.setView(
        [
          lat,
          lng
        ],
        16
      );


      L.marker(
        [
          lat,
          lng
        ]
      )
        .addTo(map)
        .bindPopup(
          r.display_name ||
          q
        )
        .openPopup();


    } catch (err) {

      console.error(
        err
      );

      alert(
        'جستجوی مکان انجام نشد. دوباره تلاش کن.'
      );
    }
  }


  /* =======================================================
     رویدادها
     ======================================================= */

  document.addEventListener(
    'click',
    function (e) {

      const target =
        e.target.closest(
          '[data-eq-add],' +
          '[data-eq-edit],' +
          '[data-eq-del],' +
          '[data-route="equipment"],' +
          '#yk35Undo,' +
          '#yk35Clear,' +
          '#useBtn,' +
          '#searchBtn'
        );


      if (!target) {
        return;
      }


      /* افزودن ادوات */

      if (
        target.hasAttribute(
          'data-eq-add'
        )
      ) {

        e.preventDefault();

        e.stopImmediatePropagation();

        editEq(null);

        return;
      }


      /* ویرایش ادوات */

      if (
        target.hasAttribute(
          'data-eq-edit'
        )
      ) {

        e.preventDefault();

        e.stopImmediatePropagation();

        editEq(
          Number(
            target.dataset.eqEdit
          )
        );

        return;
      }


      /* حذف ادوات */

      if (
        target.hasAttribute(
          'data-eq-del'
        )
      ) {

        e.preventDefault();

        e.stopImmediatePropagation();

        const a =
          getEq();

        const i =
          Number(
            target.dataset.eqDel
          );


        if (
          confirm(
            'این وسیله حذف شود؟'
          )
        ) {

          a.splice(
            i,
            1
          );

          setEq(a);

          window.renderEquipment();
        }

        return;
      }


      /* صفحه ادوات */

      if (
        target.dataset.route ===
        'equipment'
      ) {

        e.preventDefault();

        e.stopImmediatePropagation();

        if (
          typeof window.go ===
          'function'
        ) {

          window.go(
            'equipment'
          );
        }

        return;
      }


      /* برگشت یک نقطه */

      if (
        target.id ===
        'yk35Undo'
      ) {

        e.preventDefault();

        e.stopImmediatePropagation();

        if (
          window.__ykMeasureUndo
        ) {

          window.__ykMeasureUndo();
        }

        return;
      }


      /* پاک کردن */

      if (
        target.id ===
        'yk35Clear'
      ) {

        e.preventDefault();

        e.stopImmediatePropagation();

        if (
          window.__ykMeasureClear
        ) {

          window.__ykMeasureClear();
        }

        return;
      }


      /* ثبت زمین */

      if (
        target.id ===
        'useBtn'
      ) {

        e.preventDefault();

        e.stopImmediatePropagation();

        if (
          window.__ykMeasureUse
        ) {

          window.__ykMeasureUse();
        }

        return;
      }


      /* جستجو */

      if (
        target.id ===
        'searchBtn'
      ) {

        e.preventDefault();

        e.stopImmediatePropagation();

        searchBetter();

        return;
      }

    },
    true
  );


  /* =======================================================
     آب‌وهوای زمین
     ======================================================= */

  document.addEventListener(
    'click',
    function (e) {

      const b =
        e.target.closest(
          '[data-land-weather]'
        );

      if (!b) return;

      e.preventDefault();

      e.stopImmediatePropagation();


      let name = '';


      const h =
        document.querySelector(
          '#app h2'
        );


      if (h) {
        name =
          h.textContent.trim();
      }


      let s = null;


      try {

        s =
          JSON.parse(
            localStorage.getItem(
              'yk-v3-clean'
            ) ||
            'null'
          );

      } catch (_) {}


      const l =
        s &&
        Array.isArray(
          s.lands
        )

        ?

        s.lands.find(
          x =>
            String(
              x.name || ''
            ).trim() === name
        )

        :

        null;


      const box =
        document.getElementById(
          'landWeather'
        );


      if (
        l &&
        l.lat != null &&
        l.lng != null &&
        typeof window.weatherData ===
        'function'
      ) {

        if (box) {

          box.innerHTML =
            `
              <h3>
                آب‌وهوای این زمین
              </h3>

              <p>
                در حال دریافت اطلاعات هوا...
              </p>
            `;
        }


        window.weatherData(
          Number(l.lat),
          Number(l.lng),
          box
        );


      } else if (
        l &&
        box
      ) {

        box.innerHTML =
          `
            <h3>
              آب‌وهوای این زمین
            </h3>

            <p class="muted">
              برای این زمین مختصات GPS ثبت نشده است.
              ابتدا زمین را با موقعیت مکانی ثبت کن.
            </p>
          `;


      } else {

        alert(
          'پرونده زمین پیدا نشد.'
        );
      }

    },
    true
  );


  /* =======================================================
     مسیر ادوات
     ======================================================= */

  const oldGo =
    window.go;


  window.go =
    function (r) {

      if (
        r === 'equipment'
      ) {

        document.body.classList.remove(
          'measure-active'
        );

        window.route =
          'equipment';

        window.renderEquipment();

        document
          .querySelectorAll(
            '.bottom-nav button'
          )
          .forEach(
            x =>
              x.classList.remove(
                'active'
              )
          );

        return;
      }


      if (
        typeof oldGo ===
        'function'
      ) {

        return oldGo(r);
      }
    };


})();
