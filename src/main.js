console.log(curTime)

function checkNumber(number){
	number = parseInt(number)
	if (number<10){
		number="00"+number.toString();
	}
	else if (number >=10 && number <100){
		number="0"+number.toString();
	}
	else {number=number.toString()}
	return number;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

map_layer = L.layerGroup()
L.tileLayer('https://tiles.windy.com/tiles/v10.0/darkmap/{z}/{x}/{y}.png', {
 	attribution: ' <a href="http://amo.gov.vn/about/">&copy; AMO_VN </a>',
maxZoom: 11,
minZoom: 6,
}).addTo(map_layer);

bounds = new L.LatLngBounds(new L.LatLng(5, 98), new L.LatLng(27, 115));
var map = L.map('map', {
center: bounds.getCenter(),
maxBounds: bounds,
maxBoundsViscosity: 0.75,
layers: [map_layer],
minZoom: 6,
}).setView([15.834536, 107.655273], 0); 


var Lightning_Icon = L.icon({
    iconUrl: 'image/l.png',
    iconSize:     [10, 10], // size of the icon
    popupAnchor: [0,-12],
});

var the_marker = []
function onMapClick(e) {
    lon = String(e.latlng).split(" ")[1].slice(0,8);
    lat = String(e.latlng).split(" ")[0].slice(7,14);
 	the_marker = L.marker([lat, lon], {icon: Lightning_Icon, opacity: 0}).addTo(map);
 	the_marker.bindPopup('Lat: ' + lat + ', Lon:' + lon).openPopup();
	}
map.on('click', onMapClick);

var allCmax = ['./data/f10.jpg', './data/f20.jpg', './data/f30.jpg', './data/f40.jpg', './data/f50.jpg', './data/f60.jpg']
var fTime_ = ['+10 min', '+20 min', '+30 min', '+40 min', '+50 min', '+60 min'];
var imageBounds = [ [7.2, 97], [25.2, 115]];

var allSet = ['set_f10', 'set_f20', 'set_f30', 'set_f40', 'set_f50', 'set_f60'];
var var_name;
var currentSet = 0;
var polygon_layer = L.layerGroup();
polygon_layer.addTo(map);
var loop = false;

var canvas_layer = L.layerGroup();
canvas_layer.addTo(map)
// '#34495E','#154360','#1A5276','#1F618D','#2980B9',
// '#16A085','#117A65','#0E6655','#0B5345',
// '#145A32','#196F3D','#1E8449','#27AE60',
// '#F1C40F','#9A7D0A',
// '#C0392B','#7B241C',
// '#5B2C6F','#6C3483','#8E44AD'
var scale = chroma.scale(['#34495E','#154360','#1A5276','#1F618D','#2980B9','#16A085','#117A65','#0E6655','#0B5345','#145A32','#196F3D','#1E8449','#27AE60','#F1C40F','#9A7D0A','#C0392B','#7B241C','#5B2C6F','#6C3483','#8E44AD']).domain([0.5,2,5,8,10,12,15,18,20,22,25,28,30,35,40,45,55,60,65,70]);
//0,2,5,8,10,12,15,18,20,22,25,28,30,35,40,45,55,60,65,70
function updatePolygon(){
	for (let i = 0; i < window[allSet[currentSet]]; i++) {
		var_name = allSet[currentSet] + "_" + checkNumber(i)
		L.polygon(window[var_name], {fill:'url(./image/icon_set1.png)', color: '#434954', stroke:false, weight:0.2, fillOpacity:0.8, fillRule: "nonzero"}).addTo(polygon_layer);
	}
}


function create_img(){
    img = new Image();
    img.src = allCmax[currentSet];
    img.onload = () => 
	{
		var canvas = document.createElement("canvas");
		canvas.width = img.width;
		canvas.height = img.height;
	    var ctx = canvas.getContext("2d");
	    ctx.drawImage(img, 0, 0);
	    var imageData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
	    var img_data = [];
	    for (let i =0;i<imageData.length;i+=4){
	    	img_data.push(imageData[i]+imageData[i+1]/10)
		}
		n_points = Math.sqrt(img_data.length);
		var lon_d = (115-97)/n_points;
		var lat_d = (25.2-7.2)/n_points;
		var grid = [];
		for (var i = 0; i < n_points; i++)
		{
			var grid_i = [];
			for (var j = 0; j < n_points; j++)
			{
				grid_i.push(img_data[i*n_points+j]);
			}
			grid.push(grid_i);
		}
		d3.text('./data/default.asc', function (asc) {
		    let s = L.ScalarField.fromASCIIGrid(asc);
		    s.zs = img_data;
		    s.params.zs = img_data;
		    s.width = n_points;
		    s.height = n_points;
		    s.nCols = n_points;
		    s.nRows = n_points;
		    s.cellXSize = lon_d;
		    s.cellYSize = lat_d;
		    s.xllCorner = 97.;
		    s.xurCorner = 115.;
		    s.yllCorner = 7.2;
		    s.yurCorner = 25.2;
		    s.grid = grid;
		    for (let i = 0; i < s.grid.length; i++) {
				s.grid[i] = s.grid[i].map(x => x == 0 ? null :x);
			}
		    let identify = function (e) {
		        if (e.value !== null) {
		          let v = e.value.toFixed(3);
		          let html = `<span class="popupText">Radar reflectivity ${v} dbz</span>`;
		          let popup = L.popup().setLatLng(e.latlng).setContent(html).openOn(map);
		        }
		    };
		    var interpolated = L.canvasLayer.scalarField(s, {
		      	color: scale,
		        interpolate: true,
		      });
		      interpolated.on('click', identify);
		      interpolated.addTo(canvas_layer);
		})
	}
}

async function updateImg(){
	document.getElementById("cTime").innerText = String(curTime)+" UTC\n"+String(fTime_[currentSet]);
	create_img();
	updatePolygon();
	await sleep(1000);
	Loop();
}

function clear_layer(){
	polygon_layer.clearLayers();
	canvas_layer.clearLayers();
}

async function Loop(){
	if (loop){
		if (currentSet==allSet.length-1){
			currentSet=0;
		} else{
			currentSet+=1;
		}
		await sleep(1500);
		clear_layer();
		await sleep(400);
		updateImg();

	}	
}
updateImg();

function playPause(){
	if (loop) {loop=false}
	else {
		loop=true;
		updateImg();
	}
}

async function next(){
	if (!loop){
		if (currentSet==allSet.length-1){
			currentSet=0;
		} else{
			currentSet+=1;
		}
		clear_layer();
		await sleep(400);
		updateImg();

	}	
}

async function back(){
	if (!loop){
		if (currentSet==0){
			currentSet=allSet.length-1;
		} else{
			currentSet-=1;
		}
		clear_layer();
		await sleep(400);
		updateImg();

	}	
}




