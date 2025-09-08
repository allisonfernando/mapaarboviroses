// Variáveis
let markerType='arbovirose';
let markers=[];
let addMode=false;
let currentLat=-23.3805, currentLon=-53.2936;
let selectedMarker=null;
let minhaPosicaoMarker=null;

// Inicializa mapa
const map=L.map('map');
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(pos=>{
    currentLat=pos.coords.latitude;
    currentLon=pos.coords.longitude;
    map.setView([currentLat,currentLon],14);
  }, ()=>{ map.setView([currentLat,currentLon],14); });
}else{ map.setView([currentLat,currentLon],14); }

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'&copy; OpenStreetMap'
}).addTo(map);

// Ícones
const icons = {
  arbovirose: L.icon({
    iconUrl:'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 
    iconSize:[36,36], iconAnchor:[18,36]
  }),
  terreno: L.divIcon({
    html: "<div style='font-size:20px; color:red;'>❌</div>",
    className: "x-icon",
    iconSize: [20,20],
    iconAnchor: [10,10]
  }),
  localizacao: L.divIcon({
    html: "<div style='font-size:22px; color:blue;'>📍</div>",
    className: "posicao-icon",
    iconSize: [22,22],
    iconAnchor: [11,11]
  })
};

// Elementos do DOM
const infoCard = document.getElementById('info-card');
const cardImg = document.getElementById('card-img');
const cardTitle = document.getElementById('card-title');
const cardDesc = document.getElementById('card-desc');
const cardDate = document.getElementById('card-date');

document.getElementById('menu-toggle').addEventListener('click', toggleMenu);
document.getElementById('add-paciente').addEventListener('click', ()=>prepareAdd('arbovirose'));
document.getElementById('add-terreno').addEventListener('click', ()=>prepareAdd('terreno'));
document.getElementById('city-btn').addEventListener('click', goToCity);
document.getElementById('locate-btn').addEventListener('click', markCurrentLocation);
document.querySelector('#info-card .close-card').addEventListener('click', ()=>infoCard.style.display='none');
document.getElementById('remove-btn').addEventListener('click', removeMarker);

// Funções
function toggleMenu(){
  document.getElementById('menu-panel').classList.toggle('hidden');
}

function prepareAdd(type){
  markerType=type;
  addMode=true;
  if(type==='arbovirose'){
    document.getElementById("paciente-desc").style.display="block";
    alert("Clique no mapa para marcar o paciente.");
  } else {
    document.getElementById("paciente-desc").style.display="none";
    alert("Clique no mapa para marcar o terreno.");
  }
}

function addMarker(latlng,imageDataUrl,desc, typeOverride=null){
  const icon = typeOverride ? icons[typeOverride] : icons[markerType];
  const label = typeOverride==='localizacao' ? '📍 Minha Posição' :
                markerType==='arbovirose' ? '🧑‍⚕️ Paciente' : '❌ Terreno';
  const timestamp = new Date().toLocaleString('pt-BR',{hour12:false});
  
  const marker = L.marker(latlng,{icon:icon}).addTo(map);
  marker.data = { type: label, image: imageDataUrl || icon.options.iconUrl, desc: desc || '', date: timestamp };
  
  marker.on('click', e=>{
    e.originalEvent.stopPropagation();
    selectedMarker=marker;
    showCard(marker.data);
  });
  markers.push(marker);
}

function showCard(data){
  cardTitle.textContent = data.type;
  cardImg.src = data.image;
  cardDesc.textContent = data.desc || (data.type==='🧑‍⚕️ Paciente' ? 'Paciente marcado.' : 'Terreno identificado.');
  cardDate.textContent = `Data/Hora: ${data.date}`;
  infoCard.style.display='flex';
}

function removeMarker(){
  if(selectedMarker){
    map.removeLayer(selectedMarker);
    markers = markers.filter(m=>m!==selectedMarker);
    infoCard.style.display='none';
    selectedMarker=null;
  }
}

map.on('click', function(e){
  if(!addMode) return;
  if(markerType==='arbovirose'){
    const desc = document.getElementById("paciente-desc").value;
    addMarker(e.latlng, null, desc);
    addMode=false;
    document.getElementById("paciente-desc").value="";
    document.getElementById("paciente-desc").style.display="none";
  } else {
    const fileInput=document.getElementById('image-upload');
    fileInput.click();
    fileInput.onchange=function(){
      const file=fileInput.files[0];
      if(file){ 
        const reader=new FileReader(); 
        reader.onload=function(evt){ 
          addMarker(e.latlng, evt.target.result, "Terreno identificado."); 
          addMode=false; 
        }; 
        reader.readAsDataURL(file); 
      } else { addMarker(e.latlng,null,"Terreno identificado."); addMode=false; }
      fileInput.value='';
    };
  }
});

function goToCity(){
  const city=document.getElementById("city-input").value;
  if(!city) return;
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city+', Paraná, Brasil')}`)
  .then(res=>res.json())
  .then(data=>{
    if(data.length>0){ 
      const {lat,lon}=data[0]; 
      currentLat=parseFloat(lat); currentLon=parseFloat(lon); 
      map.setView([currentLat,currentLon],15); 
    } else alert("Cidade não encontrada.");
  });
}

function markCurrentLocation(){
  if (navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      map.setView([lat, lng],16);

      if (minhaPosicaoMarker) map.removeLayer(minhaPosicaoMarker);

      minhaPosicaoMarker = L.marker([lat, lng], {icon:icons.localizacao})
        .addTo(map)
        .bindPopup("Você está aqui")
        .openPopup();
    }, ()=>{ alert("Não foi possível obter sua localização."); });
  } else { alert("Geolocalização não suportada."); }
}
