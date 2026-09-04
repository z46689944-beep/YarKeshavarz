const KEY='yk-v3-clean';
const $=s=>document.querySelector(s), app=$('#app'), title=$('#pageTitle');

const base={
  version:'3.0',
  lands:[],
  inventory:[],
  transactions:[],
  crops:[],
  profile:{name:'',email:'',phone:'',photo:''}
};

let state=load(),route='home',selected=null,tab='overview';

function clone(x){
  return JSON.parse(JSON.stringify(x))
}

function uid(){
  return 'id_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)
}

function esc(v=''){
  return String(v).replace(/[&<>"']/g,m=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[m]))
}

function faDigits(v){
  return String(v??'')
    .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
}

function num(v){
  v=faDigits(v).replace(/[٬,\s]/g,'');
  return Number(v)||0
}

function money(v){
  return num(v).toLocaleString('fa-IR')+' تومان'
}

function load(){
  try{
    let x=JSON.parse(localStorage.getItem(KEY));
    return normalize(x||base)
  }catch(e){
    return clone(base)
  }
}

function normalize(x){
  x=x||{};
  return {
    ...clone(base),
    ...x,
    lands:Array.isArray(x.lands)?x.lands:[],
    inventory:Array.isArray(x.inventory)?x.inventory:[],
    transactions:Array.isArray(x.transactions)?x.transactions:[],
    crops:Array.isArray(x.crops)?x.crops:[],
    profile:{...base.profile,...(x.profile||{})}
  }
}

function save(){
  localStorage.setItem(KEY,JSON.stringify(state))
}

function land(id){
  return state.lands.find(x=>x.id===id)
}

function totals(id){
  let tx=state.transactions.filter(x=>!id||x.landId===id),
      cost=tx.filter(x=>x.type==='expense').reduce((a,x)=>a+num(x.amount),0),
      income=tx.filter(x=>x.type==='income').reduce((a,x)=>a+num(x.amount),0);

  return {
    cost,
    income,
    profit:income-cost
  }
}

function go(r){
  if(r==='assistant')r='yar';

  route=r;

  document.body.classList.toggle(
    'measure-active',
    r==='measure'
  );

  if(r==='land')renderLand();
  else if(r==='lands')renderLands();
  else if(r==='add')renderAdd();
  else if(r==='measure')renderMeasure();
  else if(r==='weather')renderWeather();
  else if(r==='profile')renderProfile();
  else if(r==='account')renderAccount();
  else if(r==='ads')renderAds();
  else if(r==='news')renderNews();
  else if(r==='inventory')renderInventory();
  else if(r==='yar')renderYar();
  else renderHome();

  document.querySelectorAll('.bottom-nav button').forEach(b=>{
    b.classList.toggle(
      'active',
      (b.dataset.route===r) ||
      (b.dataset.route==='assistant'&&r==='yar')
    )
  })
}

function head(h){
  title.textContent=h
}

function renderHome(){
  head('خانه');

  let t=totals(),
      area=state.lands.reduce((a,l)=>a+num(l.area),0);

  app.innerHTML=`
    <section class="hero">
      <h1>یار کشاورز</h1>
      <p>مدیریت حرفه‌ای زمین، کشت، هزینه و درآمد</p>
    </section>

    <div class="grid">
      <div class="card">
        <span class="muted">زمین‌ها</span>
        <div class="metric">${state.lands.length.toLocaleString('fa-IR')}</div>
      </div>

      <div class="card">
        <span class="muted">مساحت</span>
        <div class="metric">${area.toLocaleString('fa-IR')}</div>
        <span class="small muted">هکتار</span>
      </div>

      <div class="card">
        <span class="muted">هزینه</span>
        <div class="metric">${money(t.cost)}</div>
      </div>

      <div class="card">
        <span class="muted">درآمد</span>
        <div class="metric">${money(t.income)}</div>
      </div>
    </div>

    <div class="section-head">
      <h3>دسترسی سریع</h3>
    </div>

    <div class="quick">
      <button class="card" data-route="add">
        ＋<br>ثبت زمین
      </button>

      <button class="card" data-route="measure">
        ⌖<br>اندازه‌گیری
      </button>

      <button class="card" data-route="weather">
        ☼<br>آب‌وهوا
      </button>

      <button class="card" data-route="inventory">
        ▦<br>انبار
      </button>
    </div>

    <div class="section-head">
      <h3>زمین‌های اخیر</h3>
      <button class="secondary" data-route="lands">
        مشاهده همه
      </button>
    </div>

    <div class="list">
      ${
        state.lands.slice(0,3).map(l=>landCard(l)).join('')
        ||
        '<div class="empty card">هنوز زمینی ثبت نشده است.</div>'
      }
    </div>
  `
}

function landCard(l){
  let t=totals(l.id);

  return `
    <article class="card land-card">

      <div class="row">
        <div>
          <h3>${esc(l.name)}</h3>
          <span class="badge">
            ${l.ownership==='rent'?'اجاره‌ای':'مالک'}
          </span>
        </div>

        <b>
          ${num(l.area).toLocaleString('fa-IR')} هکتار
        </b>
      </div>

      <p class="muted">
        ${esc(l.region||'موقعیت ثبت نشده')}
        ·
        ${esc(l.crop||'کشت ثبت نشده')}
      </p>

      ${
        l.areaM2
        ?
        `<div class="measure-badge">
          📐 ${Math.round(num(l.areaM2)).toLocaleString('fa-IR')}
          مترمربع اندازه‌گیری‌شده
        </div>`
        :
        ''
      }

      <div class="row small">
        <span>هزینه ${money(t.cost)}</span>
        <span>سود ${money(t.profit)}</span>
      </div>

      <div class="actions">
        <button class="primary" data-open-land="${l.id}">
          پرونده زمین
        </button>
      </div>

    </article>
  `
}

function renderLands(){
  head('زمین');

  app.innerHTML=`
    <div class="section-head">
      <h2>زمین‌های من</h2>
      <button class="primary" data-route="add">
        ＋ زمین جدید
      </button>
    </div>

    <div class="list">
      ${
        state.lands.map(landCard).join('')
        ||
        `
        <div class="empty card">
          هنوز زمینی ثبت نشده است.
          <br><br>
          <button class="primary" data-route="add">
            ثبت اولین زمین
          </button>
        </div>
        `
      }
    </div>
  `
}

function renderAdd(){
  head('ثبت زمین');

  let ma=num(sessionStorage.getItem('yk-measured-area')),
      mp=num(sessionStorage.getItem('yk-measured-perimeter'));

  app.innerHTML=`
    <div class="section-head">
      <h2>ثبت زمین جدید</h2>

      <button class="secondary" data-route="measure">
        📐 اندازه‌گیری
      </button>
    </div>

    ${
      ma
      ?
      `
      <div class="measured-banner card">
        <div>
          <b>📐 متراژ اندازه‌گیری‌شده آماده ثبت است</b>

          <span>
            ${Math.round(ma).toLocaleString('fa-IR')}
            مترمربع
            ·
            ${(ma/10000).toLocaleString('fa-IR',{
              maximumFractionDigits:3
            })}
            هکتار
            ·
            محیط
            ${Math.round(mp).toLocaleString('fa-IR')}
            متر
          </span>
        </div>

        <button class="secondary" id="clearMeasured">
          پاک کردن
        </button>
      </div>
      `
      :
      ''
    }

    <form id="landForm" class="card form">

      <div class="field">
        <label>نام زمین</label>
        <input
          name="name"
          required
          placeholder="مثلاً زمین شمالی"
        >
      </div>

      <div class="field">
        <label>مساحت (هکتار)</label>

        <input
          name="area"
          class="money-input"
          inputmode="decimal"
          ${ma?'value="'+(ma/10000).toLocaleString('en-US',{
            maximumFractionDigits:3
          })+'"':''}
          required
          placeholder="مثلاً 2.5"
        >
      </div>

      <div class="field">
        <label>روستا / شهر / منطقه</label>
        <input
          name="region"
          placeholder="موقعیت زمین"
        >
      </div>

      <div class="field">
        <label>مالکیت</label>

        <select name="ownership">
          <option value="own">مالک</option>
          <option value="rent">اجاره‌ای</option>
        </select>
      </div>

      <div class="field">
        <label>نوع خاک</label>
        <input name="soil">
      </div>

      <div class="field">
        <label>منبع آب</label>
        <input name="water">
      </div>

      <div class="field">
        <label>نوع آبیاری</label>
        <input name="irrigation">
      </div>

      <div class="field">
        <label>محصول فعلی</label>
        <input name="crop">
      </div>

      <div class="field">
        <label>توضیحات</label>
        <textarea name="notes"></textarea>
      </div>

      <button class="primary">
        ذخیره زمین
      </button>

    </form>
  `
}


/* =========================================================
   نقشه شماتیک
   ========================================================= */

function createLandPlan(points,areaM2,perimeterM){

  if(!points || points.length<3){
    return ''
  }

  let canvas=document.createElement('canvas');

  canvas.width=900;
  canvas.height=650;

  let ctx=canvas.getContext('2d');

  /* پس‌زمینه */
  ctx.fillStyle='#ffffff';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  /* شبکه */
  ctx.strokeStyle='#e5eee8';
  ctx.lineWidth=1;

  for(let x=40;x<860;x+=45){
    ctx.beginPath();
    ctx.moveTo(x,20);
    ctx.lineTo(x,630);
    ctx.stroke();
  }

  for(let y=20;y<630;y+=45){
    ctx.beginPath();
    ctx.moveTo(20,y);
    ctx.lineTo(880,y);
    ctx.stroke();
  }

  let xs=points.map(p=>Number(p[1])),
      ys=points.map(p=>Number(p[0]));

  let minX=Math.min(...xs),
      maxX=Math.max(...xs),
      minY=Math.min(...ys),
      maxY=Math.max(...ys);

  let dx=maxX-minX || 0.000001,
      dy=maxY-minY || 0.000001;

  let scale=Math.min(
    720/dx,
    440/dy
  );

  /* محدود کردن مقیاس */
  if(!isFinite(scale) || scale<=0){
    scale=1
  }

  let centerX=450,
      centerY=345;

  let mapP=points.map(p=>[
    centerX+
      (Number(p[1])-minX-dx/2)*scale,
    centerY-
      (Number(p[0])-minY-dy/2)*scale
  ]);

  /* مرز زمین */
  ctx.beginPath();

  mapP.forEach((p,i)=>{
    if(i===0){
      ctx.moveTo(p[0],p[1]);
    }else{
      ctx.lineTo(p[0],p[1]);
    }
  });

  ctx.closePath();

  ctx.fillStyle='rgba(34,139,80,.18)';
  ctx.fill();

  ctx.strokeStyle='#176b43';
  ctx.lineWidth=7;
  ctx.lineJoin='round';
  ctx.stroke();

  /* نقاط */
  mapP.forEach((p,i)=>{

    ctx.beginPath();
    ctx.arc(
      p[0],
      p[1],
      11,
      0,
      Math.PI*2
    );

    ctx.fillStyle='#15803d';
    ctx.fill();

    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=4;
    ctx.stroke();

    ctx.fillStyle='#14532d';
    ctx.font='bold 20px sans-serif';

    ctx.fillText(
      String(i+1),
      p[0]+15,
      p[1]-10
    );
  });

  /* مرکز زمین */
  let cx=mapP.reduce((s,p)=>s+p[0],0)/mapP.length;
  let cy=mapP.reduce((s,p)=>s+p[1],0)/mapP.length;

  ctx.fillStyle='#14532d';
  ctx.font='bold 30px sans-serif';
  ctx.textAlign='center';

  ctx.fillText(
    Math.round(areaM2).toLocaleString('fa-IR')+' مترمربع',
    cx,
    cy
  );

  ctx.textAlign='left';

  /* قطب‌نما */
  let nx=785,
      ny=95;

  ctx.beginPath();
  ctx.arc(nx,ny,48,0,Math.PI*2);

  ctx.fillStyle='rgba(255,255,255,.92)';
  ctx.fill();

  ctx.strokeStyle='#dbe7df';
  ctx.lineWidth=2;
  ctx.stroke();

  ctx.fillStyle='#14532d';
  ctx.font='bold 28px sans-serif';
  ctx.textAlign='center';

  ctx.fillText('N',nx,ny-12);

  ctx.font='bold 24px sans-serif';
  ctx.fillText('↑',nx,ny+18);

  ctx.textAlign='left';

  /* عنوان بالا */
  ctx.fillStyle='#163b2a';
  ctx.font='bold 28px sans-serif';

  ctx.fillText(
    'پلان شماتیک زمین',
    45,
    58
  );

  /* اطلاعات پایین */
  ctx.fillStyle='#4b6358';
  ctx.font='22px sans-serif';

  ctx.fillText(
    'مساحت: '+
    Math.round(areaM2).toLocaleString('fa-IR')+
    ' مترمربع',
    45,
    555
  );

  ctx.fillText(
    'محیط: '+
    Math.round(perimeterM).toLocaleString('fa-IR')+
    ' متر',
    45,
    590
  );

  ctx.font='18px sans-serif';
  ctx.fillStyle='#71847a';

  ctx.fillText(
    'پلان شماتیک بر اساس نقاط ثبت‌شده GPS',
    45,
    620
  );

  return canvas.toDataURL('image/png');
}


/* =========================================================
   پرونده زمین
   ========================================================= */

function renderLand(){

  let l=land(selected);

  if(!l){
    go('lands');
    return
  }

  head(l.name);

  let t=totals(l.id),
      crops=state.crops.filter(x=>x.landId===l.id),
      tx=state.transactions.filter(x=>x.landId===l.id);

  let plan='';

  if(
    l.areaM2 &&
    l.measurement &&
    Array.isArray(l.measurement.points) &&
    l.measurement.points.length>=3
  ){
    plan=createLandPlan(
      l.measurement.points,
      num(l.areaM2),
      num(l.perimeter||l.measurement.perimeter||0)
    );
  }

  /*
   * اگر نسخه‌های قدیمی فقط points را در measurement نگه داشته‌اند
   */
  if(
    !plan &&
    l.measurement &&
    Array.isArray(l.measurement.points) &&
    l.measurement.points.length>=3
  ){
    plan=createLandPlan(
      l.measurement.points,
      num(l.measurement.area||l.areaM2),
      num(l.measurement.perimeter||l.perimeter||0)
    );
  }

  let content={

    overview:`

      <div class="grid">

        <div class="card">
          <span class="muted">مساحت</span>
          <div class="metric">
            ${num(l.area).toLocaleString('fa-IR')}
          </div>
          <span class="muted">هکتار</span>
        </div>

        <div class="card">
          <span class="muted">هزینه</span>
          <div class="metric">
            ${money(t.cost)}
          </div>
        </div>

        <div class="card">
          <span class="muted">درآمد</span>
          <div class="metric">
            ${money(t.income)}
          </div>
        </div>

        <div class="card">
          <span class="muted">سود/زیان</span>
          <div class="metric">
            ${money(t.profit)}
          </div>
        </div>

      </div>

      ${
        l.areaM2
        ?
        `
        <div class="card measured-card">

          <div class="row">
            <div>
              <h3>📐 اندازه‌گیری زمین</h3>

              <span class="badge">
                ثبت شده با نقشه
              </span>
            </div>

            <b>
              ${Math.round(num(l.areaM2))
                .toLocaleString('fa-IR')}
              مترمربع
            </b>
          </div>

          <div class="measure-detail-grid">

            <div>
              <span>هکتار</span>
              <b>
                ${
                  (num(l.areaM2)/10000)
                  .toLocaleString('fa-IR',{
                    maximumFractionDigits:3
                  })
                }
              </b>
            </div>

            <div>
              <span>محیط</span>
              <b>
                ${
                  Math.round(
                    num(l.perimeter||0)
                  ).toLocaleString('fa-IR')
                }
                متر
              </b>
            </div>

            <div>
              <span>موقعیت</span>
              <b>
                ${
                  l.lat&&l.lng
                  ?
                  'GPS ثبت شده'
                  :
                  'ثبت نشده'
                }
              </b>
            </div>

          </div>

          ${
            plan
            ?
            `
            <div
              class="land-plan-inside"
              style="
                margin-top:18px;
                border-radius:24px;
                overflow:hidden;
                background:#f5faf7;
                border:1px solid #e1eee7;
                box-shadow:0 8px 25px rgba(20,83,45,.08);
              "
            >

              <div
                style="
                  padding:14px 16px 4px;
                  display:flex;
                  align-items:center;
                  justify-content:space-between;
                  gap:10px;
                "
              >
                <div>
                  <strong
                    style="
                      font-size:18px;
                      color:#174d35;
                    "
                  >
                    🗺️ نقشه شماتیک زمین
                  </strong>

                  <div
                    style="
                      font-size:13px;
                      color:#71847a;
                      margin-top:4px;
                    "
                  >
                    نمای حرفه‌ای محدوده ثبت‌شده
                  </div>
                </div>

                <span
                  style="
                    background:#e5f4eb;
                    color:#176b43;
                    border-radius:999px;
                    padding:7px 11px;
                    font-size:12px;
                    white-space:nowrap;
                  "
                >
                  GPS
                </span>
              </div>

              <img
                src="${plan}"
                alt="نقشه شماتیک زمین"
                style="
                  display:block;
                  width:100%;
                  height:auto;
                  margin-top:8px;
                "
              >

              <div
                style="
                  display:grid;
                  grid-template-columns:repeat(3,1fr);
                  gap:8px;
                  padding:12px;
                "
              >

                <div
                  style="
                    background:#fff;
                    border-radius:15px;
                    padding:10px 7px;
                    text-align:center;
                  "
                >
                  <small
                    style="
                      display:block;
                      color:#7a8b83;
                    "
                  >
                    مساحت
                  </small>

                  <b
                    style="
                      display:block;
                      margin-top:4px;
                      color:#174d35;
                    "
                  >
                    ${Math.round(num(l.areaM2))
                      .toLocaleString('fa-IR')}
                  </b>

                  <small>مترمربع</small>
                </div>

                <div
                  style="
                    background:#fff;
                    border-radius:15px;
                    padding:10px 7px;
                    text-align:center;
                  "
                >
                  <small
                    style="
                      display:block;
                      color:#7a8b83;
                    "
                  >
                    هکتار
                  </small>

                  <b
                    style="
                      display:block;
                      margin-top:4px;
                      color:#174d35;
                    "
                  >
                    ${(num(l.areaM2)/10000)
                      .toLocaleString('fa-IR',{
                        maximumFractionDigits:3
                      })}
                  </b>
                </div>

                <div
                  style="
                    background:#fff;
                    border-radius:15px;
                    padding:10px 7px;
                    text-align:center;
                  "
                >
                  <small
                    style="
                      display:block;
                      color:#7a8b83;
                    "
                  >
                    محیط
                  </small>

                  <b
                    style="
                      display:block;
                      margin-top:4px;
                      color:#174d35;
                    "
                  >
                    ${Math.round(
                      num(l.perimeter||0)
                    ).toLocaleString('fa-IR')}
                  </b>

                  <small>متر</small>
                </div>

              </div>

            </div>
            `
            :
            ''
          }

        </div>
        `
        :
        ''
      }

      <div class="section-head">
        <h3>مشخصات زمین</h3>
      </div>

      <div class="card list">
        ${row(
          'مالکیت',
          l.ownership==='rent'?'اجاره‌ای':'مالک'
        )}

        ${row('منطقه',l.region)}
        ${row('خاک',l.soil)}
        ${row('آب',l.water)}
        ${row('آبیاری',l.irrigation)}
        ${row('محصول',l.crop)}
      </div>

      <div class="section-head">
        <h3>عکس‌های زمین</h3>
      </div>

      <div class="card">

        <label class="file-btn">
          📷 افزودن عکس

          <input
            id="landPhoto"
            type="file"
            accept="image/*"
            capture="environment"
            hidden
          >
        </label>

        <div
          class="photo-grid"
          id="photoGrid"
        >
          ${
            (l.photos||[])
            .map(p=>`
              <img
                src="${p}"
                alt="عکس زمین"
              >
            `)
            .join('')
          }
        </div>

      </div>

    `,

    crops:`

      <div class="actions">
        <button class="primary" data-add-crop>
          ＋ ثبت کشت
        </button>
      </div>

      <div class="list">

        ${
          crops.map(c=>`
            <div class="card">

              <div class="row">
                <b>${esc(c.product)}</b>
                <span>${esc(c.date||'')}</span>
              </div>

              <span class="muted">
                بذر:
                ${num(c.seedQty)}
                کیلو
              </span>

            </div>
          `).join('')
          ||
          `
          <div class="empty card">
            سوابق کشت خالی است.
          </div>
          `
        }

      </div>

    `,

    finance:`

      <div class="actions">
        <button class="primary" data-add-tx>
          ＋ تراکنش
        </button>
      </div>

      <div class="list">

        ${
          tx.map(x=>`
            <div class="card row">

              <span>
                ${esc(x.title)}

                <small class="muted">
                  · ${esc(x.date||'')}
                </small>
              </span>

              <b>
                ${x.type==='expense'?'−':'+'}
                ${money(x.amount)}
              </b>

            </div>
          `).join('')
          ||
          `
          <div class="empty card">
            تراکنش مالی ندارید.
          </div>
          `
        }

      </div>

    `,

    inventory:`

      <div class="card">

        <h3>مصرف از انبار</h3>

        <p class="muted">
          مصرف این زمین را جداگانه ثبت کن؛
          موجودی انبار هم‌زمان کم می‌شود.
        </p>

        <button class="primary" data-consume>
          📤 ثبت مصرف
        </button>

      </div>

    `,

    weather:`

      <div id="landWeather" class="card">

        <h3>آب‌وهوای این زمین</h3>

        <p class="muted">
          ${
            l.lat
            ?
            'مختصات زمین ثبت شده است.'
            :
            'هنوز مختصات GPS ثبت نشده؛ از متراژ برای تعیین موقعیت استفاده کن.'
          }
        </p>

        <button class="primary" data-land-weather>
          ☀️ دریافت هوا
        </button>

      </div>

    `,

    calculator:`

      <div class="card">

        <h3>محاسبه سود و هزینه</h3>

        <form id="calcForm" class="form">

          <div class="field">
            <label>هزینه کل</label>

            <input
              name="cost"
              class="money-input"
              inputmode="numeric"
              placeholder="16,000,000"
            >
          </div>

          <div class="field">
            <label>تولید</label>

            <input
              name="production"
              type="number"
            >
          </div>

          <div class="field">
            <label>قیمت فروش هر واحد</label>

            <input
              name="price"
              class="money-input"
              inputmode="numeric"
            >
          </div>

          <button class="primary">
            محاسبه
          </button>

        </form>

        <div id="calcResult"></div>

      </div>

    `
  }[tab];

  app.innerHTML=`

    <div class="card">

      <div class="row">

        <div>
          <h2>${esc(l.name)}</h2>

          <span class="badge">
            ${l.ownership==='rent'?'اجاره‌ای':'مالک'}
          </span>
        </div>

        <button
          class="secondary"
          data-route="lands"
        >
          بازگشت
        </button>

      </div>

    </div>

    <div class="tabs">

      ${
        [
          'overview',
          'crops',
          'finance',
          'inventory',
          'weather',
          'calculator'
        ]
        .map(x=>`
          <button
            class="${x===tab?'active':''}"
            data-tab="${x}"
          >
            ${
              ({
                overview:'مشخصات',
                crops:'کشت',
                finance:'مالی',
                inventory:'انبار',
                weather:'هوا',
                calculator:'محاسبه'
              })[x]
            }
          </button>
        `)
        .join('')
      }

    </div>

    ${content}
  `;

  let ph=$('#landPhoto');

  if(ph){
    ph.onchange=e=>
      compressImage(
        e.target.files[0],
        src=>{
          l.photos=l.photos||[];
          l.photos.push(src);
          save();
          renderLand()
        }
      )
  }
}

function row(k,v){
  return `
    <div class="row">
      <span class="muted">${k}</span>
      <b>${esc(v||'ثبت نشده')}</b>
    </div>
  `
}

function compressImage(file,cb){

  if(!file)return;

  let r=new FileReader();

  r.onload=()=>{

    let im=new Image();

    im.onload=()=>{

      let c=document.createElement('canvas'),
          max=1280,
          s=Math.min(
            1,
            max/Math.max(im.width,im.height)
          );

      c.width=Math.round(im.width*s);
      c.height=Math.round(im.height*s);

      c.getContext('2d')
        .drawImage(
          im,
          0,
          0,
          c.width,
          c.height
        );

      cb(
        c.toDataURL(
          'image/jpeg',
          .82
        )
      )
    };

    im.src=r.result
  };

  r.readAsDataURL(file)
}


/* =========================================================
   انبار
   ========================================================= */

function renderInventory(){

  head('انبار');

  app.innerHTML=`

    <div class="section-head">

      <h2>انبار</h2>

      <button
        class="primary"
        data-add-item
      >
        ＋ کالا
      </button>

    </div>

    <div class="grid">

      <div class="card">
        <span class="muted">اقلام</span>
        <div class="metric">
          ${state.inventory.length}
        </div>
      </div>

      <div class="card">
        <span class="muted">کمبود</span>
        <div class="metric">
          ${
            state.inventory.filter(
              i=>num(i.quantity)<=num(i.minQuantity)
            ).length
          }
        </div>
      </div>

    </div>

    <div class="list">

      ${
        state.inventory.map(i=>`

          <div class="card">

            <div class="row">

              <b>${esc(i.name)}</b>

              <span class="badge">
                ${esc(i.unit||'واحد')}
              </span>

            </div>

            <p>
              موجودی:
              <b>${num(i.quantity)}</b>
            </p>

            <div class="actions">

              <button
                class="secondary"
                data-stock-in="${i.id}"
              >
                📥 ورود
              </button>

              <button
                class="danger"
                data-stock-out="${i.id}"
              >
                📤 مصرف/خروج
              </button>

            </div>

          </div>

        `).join('')
        ||
        `
        <div class="empty card">
          انبار خالی است.
        </div>
        `
      }

    </div>
  `
}


/* =========================================================
   کشاورزیار
   ========================================================= */

function renderYar(){

  head('کشاورزیار');

  app.innerHTML=`

    <section class="yar-hero card">

      <div class="yar-mark">
        ✦
      </div>

      <div>

        <span class="eyebrow">
          دستیار هوشمند مزرعه
        </span>

        <h2>
          سلام، من کشاورزیارم
        </h2>

        <p class="muted">
          برای زمین، کشت، هزینه، انبار و گزارش‌ها کنارت هستم.
        </p>

      </div>

    </section>

    <div class="list">

      <div class="card">

        <h3>
          💬 از کشاورزیار بپرس
        </h3>

        <div class="yar-suggestions">

          <button
            class="secondary"
            data-yar-question="برای این زمین چه محصولی مناسب است؟"
          >
            چه محصولی بکارم؟
          </button>

          <button
            class="secondary"
            data-yar-question="هزینه‌های این زمین را بررسی کن."
          >
            هزینه‌ها را بررسی کن
          </button>

          <button
            class="secondary"
            data-yar-question="موجودی انبار من چه چیزهایی کم دارد؟"
          >
            انبار چه کم دارد؟
          </button>

          <button
            class="secondary"
            data-yar-question="یک گزارش کوتاه از وضعیت مزرعه بده."
          >
            گزارش مزرعه
          </button>

        </div>

        <div class="yar-chat">

          <div class="yar-bubble">
            فعلاً نسخه پایه‌ام فعال است؛
            سوالت را بنویس تا بر اساس اطلاعات ثبت‌شده راهنمایی‌ات کنم.
          </div>

          <textarea
            id="yarInput"
            rows="3"
            placeholder="مثلاً: برای زمین میلان پنج چه محصولی بهتر است؟"
          ></textarea>

          <button
            class="primary"
            id="yarSend"
          >
            ارسال به کشاورزیار
          </button>

          <div id="yarReply"></div>

        </div>

      </div>

      <div class="card">

        <h3>
          🌾 اطلاعاتی که می‌توانم بررسی کنم
        </h3>

        <div class="grid">

          <div>
            <b>${state.lands.length}</b>
            <span class="muted">
              زمین ثبت‌شده
            </span>
          </div>

          <div>
            <b>${state.inventory.length}</b>
            <span class="muted">
              قلم انبار
            </span>
          </div>

          <div>
            <b>${state.crops.length}</b>
            <span class="muted">
              سابقه کشت
            </span>
          </div>

          <div>
            <b>${state.transactions.length}</b>
            <span class="muted">
              تراکنش
            </span>
          </div>

        </div>

      </div>

    </div>
  `;

  document
    .querySelectorAll('[data-yar-question]')
    .forEach(b=>{
      b.onclick=()=>{
        $('#yarInput').value=b.dataset.yarQuestion;
        $('#yarInput').focus()
      }
    });

  $('#yarSend')?.addEventListener(
    'click',
    ()=>{

      let q=$('#yarInput').value.trim();

      if(!q)return;

      let l=state.lands[0];

      let reply=
        `سوالت دریافت شد. ${
          l
          ?
          `در حال حاضر ${l.name} با مساحت ${num(l.area).toLocaleString('fa-IR')} هکتار در پرونده ثبت شده است.`
          :
          'هنوز زمینی در پرونده ثبت نشده است.'
        }
        برای پاسخ تخصصی‌تر، اطلاعات زمین و سوابق کشت را کامل‌تر ثبت کن.`;

      $('#yarReply').innerHTML=`

        <div class="yar-bubble answer">

          <b>کشاورزیار:</b>

          <p>
            ${esc(reply)}
          </p>

        </div>

      `
    }
  )
}


/* =========================================================
   اکانت
   ========================================================= */

function renderProfile(){
  renderAccount()
}

function renderAccount(){

  head('اکانت');

  const p=state.profile||{};

  const landCount=state.lands.length;

  const cropCount=
    state.crops.length ||
    state.lands.filter(
      x=>x&&x.crop
    ).length;

  const avatar=
    p.photo
    ?
    `<img src="${p.photo}" alt="پروفایل">`
    :
    `<span>👨‍🌾</span>`;

  app.innerHTML=`

    <section class="account-hero card">

      <div class="account-avatar">
        ${avatar}
      </div>

      <div class="account-identity">

        <h1>
          ${esc(p.name||'کشاورز عزیز')}
        </h1>

        <p>
          ${esc(p.place||'پروفایل کشاورز')}
        </p>

      </div>

      <button
        class="secondary account-edit"
        id="accountEdit"
      >
        ویرایش
      </button>

    </section>

    <div class="account-stats">

      <div class="card account-stat">
        <b>${landCount.toLocaleString('fa-IR')}</b>
        <span>زمین</span>
      </div>

      <div class="card account-stat">
        <b>${cropCount.toLocaleString('fa-IR')}</b>
        <span>کشت</span>
      </div>

      <div class="card account-stat">
        <b>${state.inventory.length.toLocaleString('fa-IR')}</b>
        <span>اقلام انبار</span>
      </div>

    </div>

    <section class="card account-info">

      <div class="section-head">
        <h3>اطلاعات حساب</h3>
      </div>

      ${row(
        'نام و نام خانوادگی',
        p.name||'ثبت نشده'
      )}

      ${row(
        'شماره تماس',
        p.phone||'ثبت نشده'
      )}

      ${row(
        'ایمیل',
        p.email||'ثبت نشده'
      )}

      ${row(
        'شهر / روستا',
        p.place||'ثبت نشده'
      )}

    </section>

    <section class="card account-tools">

      <div class="section-head">
        <h3>مدیریت حساب</h3>
      </div>

      <button
        class="secondary full-btn"
        id="accountBackup"
      >
        ⬇️ تهیه نسخه پشتیبان
      </button>

      <button
        class="secondary full-btn"
        id="accountRestore"
      >
        ⬆️ بازیابی اطلاعات
      </button>

      <input
        id="accountRestoreFile"
        type="file"
        accept="application/json"
        hidden
      >

    </section>

    <section class="card account-help">

      <b>یار کشاورز</b>

      <p class="muted">
        اطلاعات حساب، زمین‌ها و فعالیت‌های مزرعه
        در همین دستگاه ذخیره می‌شوند.
      </p>

    </section>
  `;
}


/* =========================================================
   تبلیغات
   ========================================================= */

function renderAds(){

  head('تبلیغات');

  app.innerHTML=`

    <div class="section-head">
      <h2>تبلیغات و پیشنهادها</h2>
    </div>

    <div class="list">

      <article class="card ad">

        <h2>ویژه کشاورزان</h2>

        <p>
          فضای آماده برای معرفی خدمات،
          تجهیزات، بذر و نهاده‌های کشاورزی.
        </p>

      </article>

      <article class="card">

        <h3>جایگاه تبلیغاتی</h3>

        <p class="muted">
          در نسخه آنلاین می‌توان این بخش را
          به سامانه واقعی تبلیغات متصل کرد.
        </p>

      </article>

    </div>
  `
}


/* =========================================================
   اخبار
   ========================================================= */

function renderNews(){

  head('اخبار');

  app.innerHTML=`

    <div class="section-head">
      <h2>اخبار کشاورزی</h2>
    </div>

    <div class="list">

      <article class="card">

        <div
          class="hero"
          style="min-height:150px;margin:0 0 10px"
        >

          <h2>کشاورزی هوشمند</h2>

          <p>
            مدیریت داده‌های زمین،
            هزینه و کشت در یک برنامه.
          </p>

        </div>

        <span class="muted">
          خبر و آموزش
        </span>

      </article>

      <article class="card">

        <h3>
          گزارش‌های مزرعه را منظم نگه دار
        </h3>

        <p class="muted">
          عکس، هزینه، کشت و موجودی را
          کنار پرونده هر زمین ثبت کن.
        </p>

      </article>

    </div>
  `
}


/* =========================================================
   آب‌وهوا
   ========================================================= */

function weatherIcon(code){

  code=Number(code);

  if(code===0)return '☀️';
  if(code<=2)return '🌤️';
  if(code===3)return '☁️';
  if(code<=48)return '🌫️';
  if(code<=57)return '🌦️';
  if(code<=67)return '🌧️';
  if(code<=77)return '🌨️';
  if(code<=82)return '🌦️';
  if(code<=86)return '🌨️';
  if(code<=99)return '⛈️';

  return '🌤️'
}

function weatherLabel(code){

  code=Number(code);

  const m={
    0:'صاف',
    1:'عمدتاً صاف',
    2:'نیمه‌ابری',
    3:'ابری',
    45:'مه‌آلود',
    48:'مه یخ‌زن',
    51:'نم‌نم باران',
    53:'باران خفیف',
    55:'باران پیوسته',
    61:'باران',
    63:'بارش متوسط',
    65:'بارش شدید',
    71:'برف خفیف',
    73:'برف',
    75:'برف شدید',
    80:'رگبار',
    81:'رگبار متوسط',
    82:'رگبار شدید',
    95:'رعدوبرق',
    96:'رعدوبرق و تگرگ',
    99:'رعدوبرق شدید'
  };

  return m[code]||'وضعیت متغیر'
}

function faDate(iso){

  try{

    return new Intl.DateTimeFormat(
      'fa-IR',
      {
        weekday:'long',
        month:'long',
        day:'numeric'
      }
    ).format(
      new Date(iso+'T12:00:00')
    )

  }catch(e){
    return iso
  }
}

function faTime(iso){

  try{

    return new Intl.DateTimeFormat(
      'fa-IR',
      {
        hour:'2-digit',
        minute:'2-digit',
        hour12:false
      }
    ).format(
      new Date(iso)
    )

  }catch(e){

    return iso.slice(11,16)

  }
}

function farmAdvice(c,d){

  let rain=
      Number(
        d?.daily?.precipitation_probability_max?.[0]||0
      ),

      wind=
        Number(c?.wind_speed_10m||0),

      temp=
        Number(c?.temperature_2m||0);

  if(rain>=60){

    return {
      tone:'info',
      title:'احتمال بارندگی بالاست',
      text:'قبل از آبیاری یا کوددهی، بارش امروز را در برنامه کار زمین در نظر بگیر.'
    }

  }

  if(wind>=20){

    return {
      tone:'warn',
      title:'برای سم‌پاشی احتیاط کن',
      text:'سرعت باد نسبتاً بالاست؛ زمان سم‌پاشی را به ساعات کم‌بادتر موکول کن.'
    }

  }

  if(temp>=34){

    return {
      tone:'warn',
      title:'گرمای هوا بالاست',
      text:'آبیاری و فعالیت در زمین را به ساعات خنک‌تر منتقل کن و از تنش گرمایی محصول مراقبت کن.'
    }

  }

  if(temp<=3){

    return {
      tone:'warn',
      title:'احتمال سرمای آسیب‌زا',
      text:'برای محصولات حساس، وضعیت سرما و دمای شب را بررسی کن.'
    }

  }

  return {
    tone:'good',
    title:'شرایط کلی مناسب است',
    text:'باد و احتمال بارش فعلاً پایین است؛ برای کارهای معمول مزرعه شرایط نسبتاً مناسبی دیده می‌شود.'
  }
}

async function weatherData(lat,lon,box){

  try{

    box.innerHTML=`
      <div class="weather-loading">

        <div class="spinner"></div>

        <b>
          در حال دریافت آخرین وضعیت هوا…
        </b>

        <span>
          اطلاعات بر اساس موقعیت زمین محاسبه می‌شود.
        </span>

      </div>
    `;

    let u=
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code,uv_index&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset&timezone=auto`;

    let ac=new AbortController();

    let tm=setTimeout(
      ()=>ac.abort(),
      12000
    );

    let d=
      await(
        await fetch(
          u,
          {signal:ac.signal}
        )
      ).json();

    clearTimeout(tm);

    d=d||{};

    let c=d.current||{},
        h=d.hourly||{},
        days=d.daily||{},
        advice=farmAdvice(c,d);

    let hStart=Math.max(
      0,
      (h.time||[]).findIndex(
        x=>x>=c.time
      )
    );

    if(hStart<0)hStart=0;

    let hours=
      (h.time||[]).slice(
        hStart,
        hStart+12
      );

    box.innerHTML=`

      <div class="weather-page-head">

        <div>

          <span class="eyebrow">
            وضعیت فعلی
          </span>

          <h2>
            ${weatherLabel(c.weather_code)}
          </h2>

          <div class="weather-temp-row">

            <strong>
              ${Math.round(c.temperature_2m||0)}°
            </strong>

            <span>
              احساس
              ${Math.round(c.apparent_temperature||0)}°
            </span>

          </div>

          <p class="weather-location">
            📍 موقعیت انتخاب‌شده
            ·
            بروزرسانی
            ${faTime(c.time||new Date().toISOString())}
          </p>

        </div>

        <div class="weather-big-icon">
          ${weatherIcon(c.weather_code)}
        </div>

      </div>

      <div class="weather-stats">

        <div>
          <span>💧 رطوبت</span>
          <b>${Math.round(c.relative_humidity_2m||0)}٪</b>
        </div>

        <div>
          <span>💨 باد</span>
          <b>${Math.round(c.wind_speed_10m||0)} km/h</b>
        </div>

        <div>
          <span>🌧️ بارش</span>
          <b>${Math.round(c.precipitation||0)} mm</b>
        </div>

        <div>
          <span>☀️ UV</span>
          <b>${Math.round(c.uv_index||0)}</b>
        </div>

      </div>

      <div class="farm-advice ${advice.tone}">

        <div class="advice-icon">
          ${
            advice.tone==='good'
            ?
            '✓'
            :
            advice.tone==='warn'
            ?
            '!'
            :
            'i'
          }
        </div>

        <div>

          <b>${advice.title}</b>

          <p>
            ${advice.text}
          </p>

        </div>

      </div>

      <div class="weather-section">

        <div class="section-head">

          <h3>
            پیش‌بینی ساعتی
          </h3>

          <span class="muted small">
            ۱۲ ساعت آینده
          </span>

        </div>

        <div class="hourly-row">

          ${
            hours.map((x,i)=>{

              let j=h.time.indexOf(x);

              return `

                <div
                  class="hour-card ${i===0?'now':''}"
                >

                  <b>
                    ${i===0?'اکنون':faTime(x)}
                  </b>

                  <span class="hour-icon">
                    ${weatherIcon(h.weather_code?.[j])}
                  </span>

                  <strong>
                    ${Math.round(
                      h.temperature_2m?.[j]||0
                    )}°
                  </strong>

                  <small>
                    بارش
                    ${Math.round(
                      h.precipitation_probability?.[j]||0
                    )}٪
                  </small>

                </div>

              `
            }).join('')
          }

        </div>

      </div>

      <div class="weather-section">

        <div class="section-head">

          <h3>
            پیش‌بینی روزانه
          </h3>

          <span class="muted small">
            ۷ روز آینده
          </span>

        </div>

        <div class="forecast-list">

          ${
            (days.time||[])
            .slice(0,7)
            .map((x,i)=>`

              <div class="forecast-card">

                <div class="forecast-day">

                  <b>
                    ${i===0?'امروز':faDate(x)}
                  </b>

                  <small>
                    ${x}
                  </small>

                </div>

                <div class="forecast-icon">
                  ${weatherIcon(
                    days.weather_code?.[i]
                  )}
                </div>

                <div class="forecast-temp">

                  <strong>
                    ${Math.round(
                      days.temperature_2m_max?.[i]||0
                    )}°
                  </strong>

                  <span>
                    ${Math.round(
                      days.temperature_2m_min?.[i]||0
                    )}°
                  </span>

                </div>

                <div class="forecast-rain">

                  🌧️
                  ${Math.round(
                    days.precipitation_probability_max?.[i]||0
                  )}٪

                  <small>
                    ${
                      Number(
                        days.precipitation_sum?.[i]||0
                      ).toFixed(1)
                    }
                    mm
                  </small>

                </div>

              </div>

            `).join('')
          }

        </div>

      </div>

      <div class="sun-card">

        <div>
          <span>🌅 طلوع</span>
          <b>
            ${faTime(days.sunrise?.[0]||'')}
          </b>
        </div>

        <div>
          <span>🌇 غروب</span>
          <b>
            ${faTime(days.sunset?.[0]||'')}
          </b>
        </div>

        <div>
          <span>💨 بیشینه باد</span>
          <b>
            ${Math.round(
              days.wind_speed_10m_max?.[0]||0
            )}
            km/h
          </b>
        </div>

      </div>

      <p class="weather-note">
        پیش‌بینی‌ها تقریبی‌اند و با تغییر شرایط جوی بروزرسانی می‌شوند.
        برای تصمیم‌های حساس مزرعه، وضعیت لحظه‌ای را دوباره بررسی کن.
      </p>
    `

  }catch(e){

    box.innerHTML=`

      <div class="weather-error">

        <b>
          دریافت آب‌وهوا انجام نشد.
        </b>

        <span>
          اتصال اینترنت یا دسترسی سرویس هواشناسی را بررسی کن.
        </span>

        <button
          class="secondary"
          onclick="renderWeather()"
        >
          تلاش دوباره
        </button>

      </div>

    `
  }
}

function renderWeather(){

  head('هوا');

  let lands=
    state.lands.filter(
      x=>x.lat&&x.lng
    );

  let l=lands[0];

  app.innerHTML=`

    <div class="weather-shell">

      <div class="weather-toolbar">

        <div>

          <span class="eyebrow">
            هواشناسی مزرعه
          </span>

          <h2>
            آب‌وهوای دقیق زمین
          </h2>

        </div>

        <button
          class="refresh-weather"
          id="weatherRefresh"
        >
          ↻ بروزرسانی
        </button>

      </div>

      <div class="weather-picker card">

        <label>
          زمین موردنظر
        </label>

        <select id="weatherLand">

          <option value="user">
            📍 موقعیت من
          </option>

          ${
            lands.map(x=>`
              <option value="${x.id}">
                ${esc(x.name)}
              </option>
            `).join('')
          }

        </select>

      </div>

      <div id="weatherMain"></div>

    </div>
  `;

  let box=$('#weatherMain');

  const loadUser=()=>{

    navigator.geolocation?.getCurrentPosition(
      p=>weatherData(
        p.coords.latitude,
        p.coords.longitude,
        box
      ),
      ()=>{
        box.innerHTML=`

          <div class="weather-error card">

            <b>
              دسترسی به موقعیت فعال نیست
            </b>

            <span>
              از تنظیمات گوشی اجازه موقعیت مکانی را
              برای Chrome فعال کن.
            </span>

          </div>

        `
      },
      {
        enableHighAccuracy:true,
        maximumAge:60000,
        timeout:12000
      }
    )
  };

  if(l){
    weatherData(
      l.lat,
      l.lng,
      box
    )
  }else{

    box.innerHTML=`

      <div class="weather-empty card">

        <div class="empty-icon">
          ☀️
        </div>

        <h3>
          آماده دریافت هوا
        </h3>

        <p class="muted">
          یک زمین دارای موقعیت را انتخاب کن
          یا موقعیت فعلی گوشی را بگیر.
        </p>

        <button
          class="primary"
          id="getUserWeather"
        >
          📍 دریافت آب‌وهوای موقعیت من
        </button>

      </div>

    `

  }

  $('#getUserWeather')
    ?.addEventListener(
      'click',
      loadUser
    );

  $('#weatherLand').onchange=()=>{

    let v=$('#weatherLand').value;

    if(v==='user'){
      loadUser()
    }else{

      let x=land(v);

      if(x?.lat&&x?.lng){
        weatherData(
          x.lat,
          x.lng,
          box
        )
      }

    }
  };

  $('#weatherRefresh').onclick=()=>{

    let v=$('#weatherLand').value;

    if(v==='user'){
      loadUser()
    }else{

      let x=land(v);

      if(x?.lat&&x?.lng){
        weatherData(
          x.lat,
          x.lng,
          box
        )
      }

    }
  }
}


/* =========================================================
   اندازه‌گیری
   ========================================================= */

let map=null,
    points=[],
    markers=[],
    watch=null,
    layer=null,
    poly=null,
    track=false,
    sat=false,
    acc=0;

function renderMeasure(){

  head('متراژ');

  app.innerHTML=`

    <div class="measure-page">

      <div
        id="measureMap"
        class="measure-map"
      ></div>

      <div class="measure-overlay">

        <input
          id="measureSearch"
          placeholder="جستجوی روستا، شهر یا مختصات"
        >

        <button
          class="primary"
          id="searchBtn"
        >
          جستجو
        </button>

      </div>

      <div class="floating">

        <button id="locBtn">
          ⌖
        </button>

        <button id="satBtn">
          🛰️
        </button>

        <button id="clearBtn">
          ↺
        </button>

        <button id="closeMeasure">
          ×
        </button>

      </div>

      <div class="measure-bottom">

        <div class="measure-stats">

          <div>
            <b id="mArea">۰</b>
            <span>مترمربع</span>
          </div>

          <div>
            <b id="mHa">۰</b>
            <span>هکتار</span>
          </div>

          <div>
            <b id="mPer">۰</b>
            <span>متر محیط</span>
          </div>

        </div>

        <div
          class="accuracy"
          id="mAcc"
        >
          آماده پیمایش
        </div>

        <button
          class="finish"
          id="trackBtn"
        >
          ▶ شروع پیمایش GPS
        </button>

        <div class="measure-help">
          ۳ نقطه روی نقشه بزن یا پیمایش GPS را شروع کن؛
          بعد دکمه ثبت فعال می‌شود.
        </div>

        <button
          class="primary measure-register"
          id="useBtn"
          style="width:100%;margin-top:7px"
          disabled
        >
          📐 ثبت زمین با این مساحت
        </button>

      </div>

    </div>
  `;

  setTimeout(
    initMap,
    30
  )
}

function initMap(){

  if(!window.L){

    $('#mAcc').textContent=
      'نقشه بارگذاری نشد.';

    return
  }

  map=L.map(
    'measureMap',
    {
      zoomControl:false,
      maxZoom:20,
      minZoom:3
    }
  ).setView(
    [35.7,51.4],
    12
  );

  layer=
    L.layerGroup()
      .addTo(map);

  baseLayer=
    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom:20,
        attribution:'© OpenStreetMap',
        noWrap:true
      }
    ).addTo(map);

  map.on(
    'click',
    e=>addPoint(
      e.latlng.lat,
      e.latlng.lng
    )
  );

  points=[];
  markers=[];

  updateMeasure()
}

function addPoint(lat,lng,a){

  if(a&&a>35)return;

  if(
    points.length &&
    haversine(
      points[points.length-1],
      [lat,lng]
    )<3
  ){
    return
  }

  points.push([
    lat,
    lng
  ]);

  acc=a||acc;

  let m=
    L.marker(
      [lat,lng],
      {draggable:true}
    ).addTo(layer);

  m.on(
    'dragend',
    ()=>{
      let p=m.getLatLng(),
          i=markers.indexOf(m);

      points[i]=[
        p.lat,
        p.lng
      ];

      updateMeasure()
    }
  );

  markers.push(m);

  updateMeasure()
}

function haversine(a,b){

  let R=6371000,
      p=Math.PI/180,
      d=(b[0]-a[0])*p,
      e=(b[1]-a[1])*p,
      x=
        Math.sin(d/2)**2+
        Math.cos(a[0]*p)*
        Math.cos(b[0]*p)*
        Math.sin(e/2)**2;

  return 2*R*Math.atan2(
    Math.sqrt(x),
    Math.sqrt(1-x)
  )
}

function area(p){

  if(p.length<3)return 0;

  let R=6378137,
      lat0=
        p.reduce(
          (s,x)=>s+x[0],
          0
        )/p.length*Math.PI/180,

      xy=p.map(
        x=>[
          R*x[1]*Math.PI/180*Math.cos(lat0),
          R*x[0]*Math.PI/180
        ]
      ),

      a=0;

  for(
    let i=0;
    i<xy.length;
    i++
  ){

    let j=(i+1)%xy.length;

    a+=
      xy[i][0]*xy[j][1]-
      xy[j][0]*xy[i][1];
  }

  return Math.abs(a)/2
}

function perimeter(p){

  return p.length<2
    ?
    0
    :
    p.reduce(
      (s,x,i)=>
        s+
        haversine(
          x,
          p[(i+1)%p.length]
        ),
      0
    )
}

function updateMeasure(){

  if(!map)return;

  if(poly){
    map.removeLayer(poly)
  }

  if(points.length>=3){
    poly=
      L.polygon(points)
        .addTo(map)
  }

  let a=area(points),
      p=perimeter(points);

  $('#mArea').textContent=
    Math.round(a)
      .toLocaleString('fa-IR');

  $('#mHa').textContent=
    (a/10000)
      .toLocaleString(
        'fa-IR',
        {
          maximumFractionDigits:3
        }
      );

  $('#mPer').textContent=
    Math.round(p)
      .toLocaleString('fa-IR');

  $('#mAcc').textContent=
    `${points.length} نقطه · دقت GPS ±${Math.round(acc||0)} متر`;

  let u=$('#useBtn');

  if(u){

    u.disabled=
      points.length<3||
      a<=0;

    u.textContent=
      points.length>=3
      ?
      '📐 ثبت زمین با این مساحت'
      :
      '📐 حداقل ۳ نقطه برای ثبت زمین لازم است'
  }
}

function clearMeasure(){

  if(watch!==null){

    navigator.geolocation.clearWatch(
      watch
    );

    watch=null
  }

  track=false;

  points=[];

  markers.forEach(
    m=>m.remove()
  );

  markers=[];

  updateMeasure();

  $('#trackBtn').textContent=
    '▶ شروع پیمایش GPS'
}

function startTrack(){

  if(!navigator.geolocation){

    return alert(
      'GPS در دسترس نیست.'
    )
  }

  if(watch!==null){

    navigator.geolocation.clearWatch(
      watch
    );

    watch=null;
    track=false;

    $('#trackBtn').textContent=
      '▶ شروع پیمایش GPS';

    return
  }

  track=true;

  $('#trackBtn').textContent=
    '⏹ پایان پیمایش';

  watch=
    navigator.geolocation.watchPosition(
      p=>{

        let c=p.coords;

        acc=c.accuracy;

        map.setView(
          [
            c.latitude,
            c.longitude
          ],
          Math.max(
            map.getZoom(),
            18
          )
        );

        addPoint(
          c.latitude,
          c.longitude,
          c.accuracy
        );

        updateMeasure()
      },
      ()=>{
        alert(
          'اجازه موقعیت داده نشد.'
        )
      },
      {
        enableHighAccuracy:true,
        maximumAge:1000,
        timeout:15000
      }
    )
}

async function searchPlace(){

  let q=
    $('#measureSearch')
      .value.trim();

  if(!q)return;

  try{

    let d=
      await(
        await fetch(
          'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=fa&q='+
          encodeURIComponent(q)
        )
      ).json();

    if(!d[0]){

      return alert(
        'مکان پیدا نشد.'
      )
    }

    let lat=+d[0].lat,
        lon=+d[0].lon;

    map.setView(
      [lat,lon],
      17
    );

    addPoint(
      lat,
      lon
    )

  }catch(e){

    alert(
      'جستجو انجام نشد.'
    )
  }
}

function toggleSat(){

  sat=!sat;

  const old=baseLayer;

  if(old){
    map.removeLayer(old)
  }

  if(sat){

    map.setMaxZoom(19);

    baseLayer=
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom:19,
          maxNativeZoom:19,
          noWrap:true,
          attribution:'© Esri',
          keepBuffer:2
        }
      );

    baseLayer.on(
      'tileerror',
      ()=>{
        if(sat){

          sat=false;

          map.removeLayer(
            baseLayer
          );

          map.setMaxZoom(20);

          baseLayer=
            L.tileLayer(
              'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              {
                maxZoom:20,
                attribution:'© OpenStreetMap'
              }
            ).addTo(map);

          alert(
            'تصاویر ماهواره‌ای در این بزرگنمایی در دسترس نیست؛ نقشه عادی فعال شد.'
          )
        }
      }
    );

    baseLayer.addTo(map)

  }else{

    map.setMaxZoom(20);

    baseLayer=
      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom:20,
          attribution:'© OpenStreetMap'
        }
      ).addTo(map)
  }
}


/* =========================================================
   رویدادهای کلیک
   ========================================================= */

document.addEventListener(
  'click',
  e=>{

    let r=
      e.target.closest(
        '[data-route]'
      )?.dataset.route;

    if(r){

      go(r);

      return
    }

    let o=
      e.target.closest(
        '[data-open-land]'
      );

    if(o){

      selected=
        o.dataset.openLand;

      tab='overview';

      go('land');

      return
    }

    let t=
      e.target.closest(
        '[data-tab]'
      );

    if(t){

      tab=
        t.dataset.tab;

      renderLand();

      return
    }

    if(
      e.target.id==='trackBtn'
    ){
      startTrack()
    }

    if(
      e.target.id==='clearBtn'
    ){
      clearMeasure()
    }

    if(
      e.target.id==='locBtn'
    ){

      navigator.geolocation?.getCurrentPosition(
        p=>{

          map.setView(
            [
              p.coords.latitude,
              p.coords.longitude
            ],
            18
          );

          addPoint(
            p.coords.latitude,
            p.coords.longitude,
            p.coords.accuracy
          )
        }
      )
    }

    if(
      e.target.id==='satBtn'
    ){
      toggleSat()
    }

    if(
      e.target.id==='searchBtn'
    ){
      searchPlace()
    }

    if(
      e.target.id==='closeMeasure'
    ){

      if(watch!==null){

        navigator.geolocation.clearWatch(
          watch
        );

        watch=null
      }

      go('home')
    }

    if(
      e.target.id==='useBtn'
    ){

      let a=area(points),
          p=perimeter(points);

      if(a>0){

        sessionStorage.setItem(
          'yk-measured-area',
          a
        );

        sessionStorage.setItem(
          'yk-measured-perimeter',
          p
        );

        if(points[0]){

          sessionStorage.setItem(
            'yk-measured-lat',
            points[0][0]
          );

          sessionStorage.setItem(
            'yk-measured-lng',
            points[0][1]
          )
        }

        go('add')
      }
    }

    if(
      e.target.dataset.stockIn
    ){

      let i=
        state.inventory.find(
          x=>x.id===e.target.dataset.stockIn
        );

      let q=
        num(
          prompt(
            'مقدار ورود',
            '0'
          )
        );

      if(i&&q>0){

        i.quantity=
          num(i.quantity)+q;

        save();

        renderInventory()
      }
    }

    if(
      e.target.dataset.stockOut
    ){

      let i=
        state.inventory.find(
          x=>x.id===e.target.dataset.stockOut
        );

      let q=
        num(
          prompt(
            'مقدار مصرف/خروج',
            '0'
          )
        );

      if(i&&q>0){

        i.quantity=
          Math.max(
            0,
            num(i.quantity)-q
          );

        save();

        renderInventory()
      }
    }

    if(
      e.target.closest(
        '[data-add-item]'
      )
    ){

      let n=
        prompt(
          'نام کالا'
        );

      if(n){

        let u=
          prompt(
            'واحد',
            'کیلو'
          )||'واحد';

        let q=
          num(
            prompt(
              'موجودی اولیه',
              '0'
            )
          );

        let m=
          num(
            prompt(
              'حداقل موجودی',
              '0'
            )
          );

        state.inventory.push({
          id:uid(),
          name:n,
          unit:u,
          quantity:q,
          minQuantity:m
        });

        save();

        renderInventory()
      }
    }

    if(
      e.target.closest(
        '[data-add-crop]'
      )
    ){

      let p=
        prompt(
          'محصول'
        );

      if(p){

        state.crops.push({
          id:uid(),
          landId:selected,
          product:p,
          date:prompt(
            'تاریخ',
            ''
          ),
          seedQty:num(
            prompt(
              'مقدار بذر',
              '0'
            )
          )
        });

        save();

        renderLand()
      }
    }

    if(
      e.target.closest(
        '[data-add-tx]'
      )
    ){

      let typ=
        prompt(
          'expense برای هزینه یا income برای درآمد',
          'expense'
        );

      let tt=
        prompt(
          'عنوان'
        );

      if(tt){

        state.transactions.push({
          id:uid(),
          landId:selected,
          type:
            typ==='income'
            ?
            'income'
            :
            'expense',
          title:tt,
          amount:num(
            prompt(
              'مبلغ',
              '0'
            )
          ),
          date:new Date()
            .toLocaleDateString('fa-IR')
        });

        save();

        renderLand()
      }
    }

    if(
      e.target.closest(
        '[data-consume]'
      )
    ){

      let i=
        state.inventory[0];

      if(!i){

        return alert(
          'انبار خالی است.'
        )
      }

      let q=
        num(
          prompt(
            `مصرف ${i.name}`,
            '0'
          )
        );

      if(
        q>0 &&
        q<=num(i.quantity)
      ){

        i.quantity-=q;

        save();

        renderLand()
      }
    }

  }
);


/* =========================================================
   پاک کردن اندازه‌گیری
   ========================================================= */

document.addEventListener(
  'click',
  e=>{

    if(
      e.target.id==='clearMeasured'
    ){

      [
        'yk-measured-area',
        'yk-measured-perimeter',
        'yk-measured-lat',
        'yk-measured-lng'
      ]
      .forEach(
        k=>sessionStorage.removeItem(k)
      );

      renderAdd()
    }

  }
);


/* =========================================================
   ذخیره زمین
   ========================================================= */

document.addEventListener(
  'submit',
  e=>{

    if(
      e.target.id==='landForm'
    ){

      e.preventDefault();

      let f=
        new FormData(
          e.target
        );

      let l={
        id:uid(),
        name:f.get('name'),
        area:num(
          f.get('area')
        ),
        region:f.get('region'),
        ownership:f.get('ownership'),
        soil:f.get('soil'),
        water:f.get('water'),
        irrigation:f.get('irrigation'),
        crop:f.get('crop'),
        notes:f.get('notes'),
        photos:[]
      };

      let a=
        num(
          sessionStorage.getItem(
            'yk-measured-area'
          )
        );

      let mp=
        num(
          sessionStorage.getItem(
            'yk-measured-perimeter'
          )
        );

      let mlat=
        num(
          sessionStorage.getItem(
            'yk-measured-lat'
          )
        );

      let mlng=
        num(
          sessionStorage.getItem(
            'yk-measured-lng'
          )
        );

      if(a){

        l.area=
          a/10000;

        l.areaM2=a;

        l.perimeter=mp;

        l.measured=true;

        if(mlat){

          l.lat=mlat;
          l.lng=mlng
        }

        /*
         * نقاط کامل اندازه‌گیری
         * اگر نسخه فعلی اندازه‌گیری نقاط را
         * در sessionStorage داشته باشد،
         * اینجا ذخیره می‌شوند.
         */
        try{

          let savedPoints=
            sessionStorage.getItem(
              'yk-measured-points'
            );

          if(savedPoints){

            let parsed=
              JSON.parse(
                savedPoints
              );

            if(
              Array.isArray(parsed) &&
              parsed.length>=3
            ){

              l.measurement={
                area:a,
                hectare:a/10000,
                perimeter:mp,
                points:parsed
              }

            }

          }

        }catch(err){}

        sessionStorage.removeItem(
          'yk-measured-area'
        );

        sessionStorage.removeItem(
          'yk-measured-perimeter'
        );

        sessionStorage.removeItem(
          'yk-measured-lat'
        );

        sessionStorage.removeItem(
          'yk-measured-lng'
        );

        sessionStorage.removeItem(
          'yk-measured-points'
        )
      }

      state.lands.push(l);

      save();

      selected=l.id;

      tab='overview';

      go('land')
    }

    if(
      e.target.id==='calcForm'
    ){

      e.preventDefault();

      let f=
        new FormData(
          e.target
        );

      let c=
        num(f.get('cost'));

      let income=
        num(f.get('production'))*
        num(f.get('price'));

      $('#calcResult').innerHTML=`

        <div class="card">

          <p>
            هزینه:
            <b>${money(c)}</b>
          </p>

          <p>
            درآمد احتمالی:
            <b>${money(income)}</b>
          </p>

          <p>
            سود/زیان:
            <b>${money(income-c)}</b>
          </p>

        </div>
      `
    }

  }
);


/* =========================================================
   پروفایل قدیمی
   ========================================================= */

document.addEventListener(
  'click',
  e=>{

    if(
      e.target.id==='saveProfile'
    ){

      state.profile.name=
        $('#pName').value;

      state.profile.email=
        $('#pEmail').value;

      state.profile.phone=
        $('#pPhone').value;

      save();

      alert(
        'پروفایل ذخیره شد.'
      )
    }

  }
);


/* =========================================================
   پشتیبان قدیمی
   ========================================================= */

const backupBtn=
  $('#backupBtn');

const restoreInput=
  $('#restoreInput');

if(backupBtn){

  backupBtn.onclick=()=>{

    let b=
      new Blob(
        [
          JSON.stringify(
            state,
            null,
            2
          )
        ],
        {
          type:'application/json'
        }
      );

    let a=
      document.createElement('a');

    a.href=
      URL.createObjectURL(b);

    a.download=
      'yar-keshavarz-backup.json';

    a.click()
  }
}

if(restoreInput){

  restoreInput.onchange=e=>{

    let f=
      e.target.files[0];

    if(f){

      f.text()
        .then(
          x=>{
            state=
              normalize(
                JSON.parse(x)
              );

            save();

            go('home')
          }
        )
        .catch(
          ()=>alert(
            'فایل پشتیبان معتبر نیست.'
          )
        )
    }
  }
}


/* =========================================================
   اکانت
   ========================================================= */

document.addEventListener(
  'click',
  e=>{

    if(
      e.target.closest(
        '#accountEdit'
      )
    ){

      const p=
        state.profile||{};

      app.innerHTML=`

        <div class="card account-info">

          <div class="section-head">

            <h2>
              ویرایش اکانت
            </h2>

            <button
              class="secondary"
              id="accountCancel"
            >
              انصراف
            </button>

          </div>

          <div class="form account-editor">

            <div class="field">

              <label>
                نام و نام خانوادگی
              </label>

              <input
                id="aName"
                value="${esc(p.name||'')}"
              >

            </div>

            <div class="field">

              <label>
                شماره تماس
              </label>

              <input
                id="aPhone"
                inputmode="tel"
                value="${esc(p.phone||'')}"
              >

            </div>

            <div class="field">

              <label>
                ایمیل
              </label>

              <input
                id="aEmail"
                type="email"
                value="${esc(p.email||'')}"
              >

            </div>

            <div class="field">

              <label>
                شهر / روستا
              </label>

              <input
                id="aPlace"
                value="${esc(p.place||'')}"
              >

            </div>

            <label class="file-btn">

              📷 تغییر عکس پروفایل

              <input
                id="aPhoto"
                type="file"
                accept="image/*"
                hidden
              >

            </label>

            <button
              class="primary"
              id="accountSave"
            >
              ذخیره اطلاعات
            </button>

          </div>

        </div>
      `;

      $('#aPhoto').onchange=
        ev=>
          compressImage(
            ev.target.files[0],
            src=>{
              state.profile.photo=src;
              save()
            }
          )
    }

    if(
      e.target.closest(
        '#accountCancel'
      )
    ){
      renderAccount()
    }

    if(
      e.target.closest(
        '#accountSave'
      )
    ){

      state.profile={
        ...state.profile,
        name:$('#aName').value.trim(),
        phone:$('#aPhone').value.trim(),
        email:$('#aEmail').value.trim(),
        place:$('#aPlace').value.trim()
      };

      save();

      alert(
        'اطلاعات اکانت ذخیره شد.'
      );

      renderAccount()
    }

    if(
      e.target.closest(
        '#accountBackup'
      )
    ){

      const blob=
        new Blob(
          [
            JSON.stringify(
              state,
              null,
              2
            )
          ],
          {
            type:'application/json'
          }
        );

      const a=
        document.createElement('a');

      a.href=
        URL.createObjectURL(blob);

      a.download=
        'yar-keshavarz-backup.json';

      a.click();

      setTimeout(
        ()=>{
          URL.revokeObjectURL(
            a.href
          )
        },
        500
      )
    }

    if(
      e.target.closest(
        '#accountRestore'
      )
    ){

      $('#accountRestoreFile')
        ?.click()
    }

  }
);

document.addEventListener(
  'change',
  e=>{

    if(
      e.target.id==='accountRestoreFile' &&
      e.target.files?.[0]
    ){

      e.target.files[0]
        .text()
        .then(
          x=>{

            state=
              normalize(
                JSON.parse(x)
              );

            save();

            renderAccount();

            alert(
              'اطلاعات با موفقیت بازیابی شد.'
            )
          }
        )
        .catch(
          ()=>alert(
            'فایل پشتیبان معتبر نیست.'
          )
        )
    }

  }
);


/* =========================================================
   شروع برنامه
   ========================================================= */

go('home');
