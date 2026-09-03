/* Yar Keshavarz — Professional Land Schematic Plan */
(function(){
  'use strict';

  function getLand(){
    try{
      if(typeof selected==='undefined' || typeof land!=='function') return null;
      return land(selected);
    }catch(e){
      return null;
    }
  }

  function getPoints(l){
    const p =
      l && l.measurement && Array.isArray(l.measurement.points)
        ? l.measurement.points
        : (l && Array.isArray(l.points) ? l.points : []);

    return p.filter(function(x){
      return Array.isArray(x) &&
        x.length >= 2 &&
        isFinite(Number(x[0])) &&
        isFinite(Number(x[1]));
    });
  }

  function buildSvg(points){
    if(points.length < 3) return '';

    const xs = points.map(p => Number(p[1]));
    const ys = points.map(p => Number(p[0]));

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const dx = Math.max(maxX - minX, 0.00001);
    const dy = Math.max(maxY - minY, 0.00001);

    const pad = 44;
    const W = 520;
    const H = 310;

    const sx = x => pad + (x-minX)/dx * (W-pad*2);
    const sy = y => pad + (maxY-y)/dy * (H-pad*2);

    const pts = points.map(p => [
      sx(Number(p[1])),
      sy(Number(p[0]))
    ]);

    const poly = pts.map(p =>
      p[0].toFixed(1)+','+p[1].toFixed(1)
    ).join(' ');

    const cx = pts.reduce((a,p)=>a+p[0],0)/pts.length;
    const cy = pts.reduce((a,p)=>a+p[1],0)/pts.length;

    let grid = '';

    for(let x=20;x<W;x+=50){
      grid += `<line x1="${x}" y1="18" x2="${x}" y2="292" class="yk-g"/>`;
    }

    for(let y=18;y<H;y+=50){
      grid += `<line x1="18" y1="${y}" x2="502" y2="${y}" class="yk-g"/>`;
    }

    const marks = pts.map((p,i)=>`
      <g>
        <circle
          cx="${p[0].toFixed(1)}"
          cy="${p[1].toFixed(1)}"
          r="8"
          class="yk-pt"/>
        <text
          x="${p[0].toFixed(1)}"
          y="${(p[1]+4).toFixed(1)}"
          class="yk-num">${i+1}</text>
      </g>
    `).join('');

    return `
      <svg
        viewBox="0 0 ${W} ${H}"
        class="yk-land-plan-svg"
        aria-label="پلان شماتیک زمین">

        <defs>
          <linearGradient
            id="ykLandFill"
            x1="0"
            y1="0"
            x2="1"
            y2="1">
            <stop offset="0" stop-color="#3c9b63"/>
            <stop offset="1" stop-color="#8bcf86"/>
          </linearGradient>
        </defs>

        <rect
          x="0"
          y="0"
          width="520"
          height="310"
          rx="22"
          class="yk-bg"/>

        ${grid}

        <polygon
          points="${poly}"
          class="yk-shape"/>

        <polyline
          points="${poly} ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}"
          class="yk-edge"/>

        ${marks}

        <circle
          cx="${cx.toFixed(1)}"
          cy="${cy.toFixed(1)}"
          r="5"
          class="yk-center"/>

        <text
          x="478"
          y="45"
          class="yk-north">N</text>

        <path
          d="M478 53l-7 18h14z"
          class="yk-arrow"/>

        <text
          x="28"
          y="286"
          class="yk-caption">
          نمای شماتیک محدوده واقعی زمین
        </text>

      </svg>
    `;
  }

  function addStyles(){
    if(document.getElementById('ykLandPlanStyles')) return;

    const s = document.createElement('style');

    s.id = 'ykLandPlanStyles';

    s.textContent = `
      #landPlanCard{
        margin-top:14px;
        overflow:hidden;
      }

      #landPlanCard .yk-land-plan-svg{
        display:block;
        width:100%;
        height:auto;
        min-height:240px;
        border-radius:20px;
      }

      #landPlanCard .yk-bg{
        fill:#f5f8f3;
      }

      #landPlanCard .yk-g{
        stroke:#dbe7dc;
        stroke-width:1;
      }

      #landPlanCard .yk-shape{
        fill:url(#ykLandFill);
        fill-opacity:.42;
        stroke:none;
      }

      #landPlanCard .yk-edge{
        fill:none;
        stroke:#16733c;
        stroke-width:4;
        stroke-linejoin:round;
      }

      #landPlanCard .yk-pt{
        fill:#fff;
        stroke:#16733c;
        stroke-width:3;
      }

      #landPlanCard .yk-num{
        font:700 11px sans-serif;
        fill:#16733c;
        text-anchor:middle;
      }

      #landPlanCard .yk-center{
        fill:#fff;
        stroke:#e09b2d;
        stroke-width:3;
      }

      #landPlanCard .yk-north{
        font:700 18px sans-serif;
        fill:#173b2a;
        text-anchor:middle;
      }

      #landPlanCard .yk-arrow{
        fill:#173b2a;
      }

      #landPlanCard .yk-caption{
        font:600 12px sans-serif;
        fill:#60736a;
      }

      #landPlanCard .yk-legend{
