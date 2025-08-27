let markerType='arbovirose';
let markers=[];
let heatPoints=[];
let addMode=false;
const WEATHER_API_KEY="9ed9d4d9d2204eadb26114413252708";
let currentLat=-23.3805, currentLon=-53.2936;

const map=L.map('map');
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(pos=>{currentLat=pos.coords.latitude; currentLon=pos.coords.longitude; map.setView([currentLat,currentLon],14); updateWeather();}, ()=>{ map.setView([currentLat,currentLon],14); updateWeather(); });
}else{ map.setView([currentLat,currentLon],14); updateWeather(); }

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution:'&copy; OpenStreetMap' }).addTo(map);

let heatLayer = L.heatLayer(heatPoints, {radius: 25, blur: 15, maxZoom: 17}).addTo(map);

function enableAdd(type){ markerType=type; addMode=true; alert('Clique no mapa para adicionar o marcador de '+(type==='arbovirose'?'Paciente com Arbovirose':'Terreno Abandonado')); }

function addMarker(latlng,imageDataUrl){
  let iconColor=markerType==='arbovirose'?'orange':'red';
  let label=markerType==='arbovirose'?'🧑‍⚕️ Paciente com Arbovirose':'⚠️ Terreno Abandonado';
  const marker=L.circleMarker(latlng,{radius:10, fillColor:iconColor, fillOpacity:0.9, color:'#000', weight:1}).addTo(map);
  let tooltipContent=`<strong>${label}</strong><br>`;
  if(imageDataUrl) tooltipContent+=`<img src="${imageDataUrl}" class="tooltip-img"/>`;
  marker.bindTooltip(tooltipContent,{direction:'top'});
  marker.on('click', e=>{ e.originalEvent.stopPropagation(); if(confirm('Deseja remover este marcador?')){ map.removeLayer(marker); markers.splice(markers.indexOf(marker),1); heatPoints.splice(heatPoints.indexOf([latlng.lat, latlng.lng]),1); heatLayer.setLatLngs(heatPoints); } });
  marker.on('mouseover', ()=>marker.openTooltip());
  marker.on('mouseout', ()=>marker.closeTooltip());
  markers.push(marker);
  // Adiciona no heatmap
  heatPoints.push([latlng.lat, latlng.lng, 0.5]); // peso 0.5
  heatLayer.setLatLngs(heatPoints);
}

map.on('click', function(e){
  if(!addMode) return;
  const fileInput=document.getElementById('image-upload');
  fileInput.click();
  fileInput.onchange=function(){
    const file=fileInput.files[0];
    if(file){ const reader=new FileReader(); reader.onload=function(evt){ addMarker(e.latlng, evt.target.result); addMode=false; }; reader.readAsDataURL(file); }
    else { addMarker(e.latlng,null); addMode=false; }
    fileInput.value='';
  };
});

function goToCity(){
  const city=document.getElementById("city-input").value;
  if(!city) return;
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city+', Paraná, Brasil')}`)
  .then(res=>res.json())
  .then(data=>{
    if(data.length>0){ const {lat,lon}=data[0]; currentLat=parseFloat(lat); currentLon=parseFloat(lon); map.setView([currentLat,currentLon],15); updateWeather(); }
    else alert("Cidade não encontrada.");
  });
}

// ======= Weather =======
function updateWeather(){
  fetch(`https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${currentLat},${currentLon}&days=3&lang=pt`)
  .then(res=>res.json())
  .then(data=>{
    const bar=document.getElementById('weather-bar'); bar.innerHTML='';
    const rainContainer=document.getElementById('rain'); rainContainer.innerHTML='';
    data.forecast.forecastday.forEach((day,i)=>{
      const div=document.createElement('div'); div.className='weather-day';
      const dateParts=day.date.split('-'); const formattedDate=`${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      div.innerHTML=`<div class="date">${formattedDate}</div>
      <img src="https:${day.day.condition.icon}" class="weather-icon" alt="${day.day.condition.text}"/>
      <div class="temp">${Math.round(day.day.avgtemp_c)}°C</div>
      <div class="condition">${day.day.condition.text}</div>`;
      bar.appendChild(div);

      // Animação chuva
      if(day.day.daily_chance_of_rain>50){
        for(let j=0;j<50;j++){
          const drop=document.createElement('div'); drop.className='rain-drop';
          drop.style.left=Math.random()*window.innerWidth+'px';
          drop.style.animationDuration=(0.5+Math.random()*0.5)+'s';
          drop.style.animationDelay=(Math.random()*2)+'s';
          rainContainer.appendChild(drop);
        }
        document.querySelector('.cloud').style.display='block';
        document.querySelector('.cloud2').style.display='block';
        document.querySelector('.sun').style.display='none';
      } else {
        document.querySelector('.cloud').style.display='none';
        document.querySelector('.cloud2').style.display='none';
        document.querySelector('.sun').style.display='block';
      }
    });
  })
  .catch(err=>console.error(err));
}
