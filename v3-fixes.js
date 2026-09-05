/* =========================================
   Yar Keshavarz V3.6 FIX
   Part 1 - Clean UI + Weather Fix
========================================= */

(function () {
"use strict";

/* ---------- CSS اصلاحات ---------- */

const style = document.createElement("style");

style.textContent = `

/* جلوگیری از زوم و قاطی شدن آب و هوا */
.weather-shell,
.weather-page-head,
.weather-main {
    transform:none !important;
    zoom:1 !important;
    max-width:100% !important;
    overflow:hidden !important;
}

.weather-big-icon {
    max-width:120px !important;
    height:auto !important;
}


/* نقشه متراژ */
#measureMap {
    width:100% !important;
    height:420px !important;
    overflow:hidden !important;
    touch-action:none !important;
}


/* دکمه های متراژ */
.yk36-actions {
    display:flex;
    gap:8px;
    margin-top:10px;
}

.yk36-actions button {
    flex:1;
    min-height:42px;
}


/* کارت ادوات */

.yk-equipment-grid {

 display:grid;
 grid-template-columns:
 repeat(2,minmax(0,1fr));
 gap:12px;

}


.yk-equipment-card {

 background:#fff;
 border-radius:16px;
 padding:15px;
 border:1px solid #ddd;

}


.yk-equipment-card h3 {
 margin-top:0;
}


@media(max-width:600px){

.yk-equipment-grid{
 grid-template-columns:1fr;
}

}


`;

document.head.appendChild(style);



/* ---------- اصلاح اندازه آب و هوا ---------- */


function fixWeather(){

    const items=[
        ".weather-shell",
        ".weather-page-head",
        ".weather-main"
    ];


    items.forEach(function(sel){

        document
        .querySelectorAll(sel)
        .forEach(function(el){

            el.style.transform="none";
            el.style.zoom="1";
            el.style.maxWidth="100%";

        });

    });

}


setTimeout(fixWeather,1000);
setTimeout(fixWeather,3000);



/* ---------- ذخیره ادوات ---------- */


function getEquipment(){

try{

return JSON.parse(
localStorage.getItem("yk-equipment") || "[]"
);

}catch(e){

return [];

}

}


function saveEquipment(data){

localStorage.setItem(
"yk-equipment",
JSON.stringify(data)
);

}
   /* =========================================
   Part 2 - Equipment Management
========================================= */


window.renderEquipment = function(){

const app=document.getElementById("app");

if(!app) return;


const data=getEquipment();


app.innerHTML=`

<section class="page">

<div class="section-head">

<h2>🚜 ادوات کشاورزی</h2>

<button id="addEquipment"
class="primary">
+ افزودن وسیله
</button>

</div>


<div class="card">

<h3>
موجودی ادوات مزرعه
</h3>

<p>
تراکتور، کمباین، سمپاش و تجهیزات خود را ثبت کنید.
</p>

</div>


<div class="yk-equipment-grid">


${
data.length ?

data.map((item,index)=>`

<div class="yk-equipment-card">


<h3>
🚜 ${item.name}
</h3>


<p>
نوع:
${item.type}
</p>


<p>
تعداد:
${item.count}
</p>


<p>
وضعیت:
${item.status}
</p>


<div class="yk36-actions">

<button
data-edit-equipment="${index}">
ویرایش
</button>


<button
data-delete-equipment="${index}">
حذف
</button>


</div>


</div>


`).join("")


:

`

<div class="card">

<h3>
هنوز وسیله‌ای ثبت نشده
</h3>

<p>
اولین وسیله کشاورزی را اضافه کنید.
</p>

</div>

`

}


</div>


</section>

`;



};



function addEquipment(){


let name=prompt(
"نام وسیله:"
);


if(!name)
return;


let type=prompt(
"نوع وسیله:",
"تراکتور"
);


let count=prompt(
"تعداد:",
"1"
);


let status=prompt(
"وضعیت:",
"فعال"
);



let data=getEquipment();


data.push({

name:name,

type:type || "سایر",

count:count || "1",

status:status || "فعال"

});


saveEquipment(data);


renderEquipment();


}




document.addEventListener(
"click",
function(e){


if(e.target.id==="addEquipment"){

addEquipment();

}



if(e.target.dataset.editEquipment){

let i=
Number(
e.target.dataset.editEquipment
);


let data=getEquipment();


let old=data[i];


let name=prompt(
"نام وسیله:",
old.name
);


if(name){

old.name=name;

saveEquipment(data);

renderEquipment();

}

}



if(e.target.dataset.deleteEquipment){


let i=
Number(
e.target.dataset.deleteEquipment
);


let data=getEquipment();


if(confirm("حذف شود؟")){


data.splice(i,1);


saveEquipment(data);


renderEquipment();


}


}



});



/* اضافه کردن دکمه ادوات به صفحه اصلی */


function addEquipmentButton(){


let home=document.querySelector(".quick");


if(!home)
return;



if(
document.getElementById(
"equipmentHomeBtn"
)
)
return;



let btn=document.createElement("button");


btn.id="equipmentHomeBtn";

btn.className="card";


btn.innerHTML=
`
🚜
<br>
ادوات کشاورزی
`;



btn.onclick=function(){

if(window.go)
window.go("equipment");

};



home.appendChild(btn);



}



setTimeout(
addEquipmentButton,
2000
);
   /* =========================================
   Part 3 - Measure Map Fix
========================================= */


function setupMeasureFix(){


const map=window.__ykMeasureMap;


if(!map)
return;



try{

map.touchZoom.enable();

map.dragging.enable();

map.scrollWheelZoom.enable();

map.doubleClickZoom.enable();


}catch(e){}



let points=[];


let layer=
L.layerGroup()
.addTo(map);



function redraw(){


layer.clearLayers();



if(points.length>1){

L.polyline(
points,
{
weight:4
}
)
.addTo(layer);

}



if(points.length>=3){

L.polygon(
points,
{
weight:3,
fillOpacity:.15
}
)
.addTo(layer);


}



points.forEach(
function(p,i){


L.marker(
p,
{

icon:L.divIcon({

className:
"yk-point",

html:
"<b>"+
(i+1)+
"</b>",


iconSize:
[32,32]

})


}

)
.addTo(layer);



});



updateMeasure();


}




function calc(){


if(points.length<3)

return 0;



let area=0;


for(
let i=0;
i<points.length;
i++
){


let j=
(i+1)
%
points.length;



area +=

points[i].lng *
points[j].lat

-

points[j].lng *
points[i].lat;


}



return Math.abs(area/2)*111000*111000;



}



function updateMeasure(){



let area=
document.getElementById(
"mArea"
);



if(area){

area.innerText=
Math.round(
calc()
)
.toLocaleString(
"fa-IR"
);

}


let count=
document.getElementById(
"mAcc"
);


if(count){

count.innerText=
points.length+
" نقطه ثبت شد";

}


}




/* جلوگیری از پاک شدن نقاط قبلی */

map.off("click");



map.on(
"click",
function(e){


points.push({

lat:e.latlng.lat,

lng:e.latlng.lng

});


redraw();


}

);



/* برگشت یک نقطه */


window.measureUndo=function(){


if(points.length){

points.pop();

redraw();

}


};



/* پاک کردن همه */


window.measureClear=function(){


points=[];

redraw();

};



/* ثبت زمین */


window.measureSave=function(){


if(points.length<3){

alert(
"حداقل ۳ نقطه لازم است"
);

return;

}



sessionStorage.setItem(
"measurePoints",
JSON.stringify(points)
);



if(window.go)

window.go("add");


};



}




setTimeout(
setupMeasureFix,
1500
);





/* =========================================
   Search Village / City
========================================= */


async function searchVillage(){


let input=
document.getElementById(
"measureSearch"
);


if(!input)
return;



let text=
input.value.trim();



if(!text)
return;



try{


let url=

"https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=ir&q="+

encodeURIComponent(
text
);



let res=
await fetch(url);



let data=
await res.json();



if(!data.length){

alert(
"مکان پیدا نشد"
);

return;

}



let place=data[0];



let lat=
Number(place.lat);



let lon=
Number(place.lon);



let map=
window.__ykMeasureMap;



if(map){

map.setView(
[
lat,
lon
],
15
);


L.marker(
[
lat,
lon
]
)
.addTo(map)
.bindPopup(
place.display_name
)
.openPopup();


}



}
catch(e){

alert(
"خطا در جستجو"
);

}



}




document.addEventListener(
"click",
function(e){


if(e.target.id==="searchBtn"){

searchVillage();

}


if(e.target.id==="undoPoint"){

measureUndo();

}


if(e.target.id==="clearPoints"){

measureClear();

}


if(e.target.id==="useBtn"){

measureSave();

}



}
);
   /* =========================================
   Part 4 - Final Connect
========================================= */


/* دکمه های کنترل متراژ */

function addMeasureButtons(){


let box =
document.querySelector(
".measure-controls"
);



if(!box)
return;



if(
document.getElementById(
"undoPoint"
)
)
return;



let div=
document.createElement(
"div"
);


div.className=
"yk36-actions";



div.innerHTML=

`

<button
id="undoPoint"
class="secondary">

↩️ برگشت یک نقطه

</button>


<button
id="clearPoints"
class="secondary">

🗑️ پاک کردن نقاط

</button>


`;



box.appendChild(div);



}



setTimeout(
addMeasureButtons,
2000
);





/* جلوگیری از سفید شدن نقشه بعد از تغییر صفحه */


window.addEventListener(
"resize",
function(){


if(
window.__ykMeasureMap
){

try{

window.__ykMeasureMap.invalidateSize(
true
);

}

catch(e){}



}


});





/* اصلاح نمایش آب و هوا بعد از باز شدن صفحه */


const oldGo =
window.go;



if(typeof oldGo==="function"){


window.go=function(route){


let result=
oldGo.apply(
this,
arguments
);



setTimeout(
fixWeather,
800
);



return result;


};



}





/* پایان V3.6 */

console.log(
"Yar Keshavarz V3.6 Loaded"
);


})();
