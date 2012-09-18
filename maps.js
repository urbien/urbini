var info;
var basicInfo;

function addBasicMapInfo(mapObj, init) {
  var mapInfo = L.control();
  mapInfo.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'mapInfo'); // create a div with a class "info"
      this.update();
      return this._div;
  };

  // method that we will use to update the control based on feature properties passed
  mapInfo.update = function (html) {
    this._div.innerHTML = html ? init + html : init;
  };

  mapInfo.addTo(mapObj);
  return mapInfo;
}

function addMapInfo(mapObj, item, areaType, areaUnit) {
  info = L.control();
  info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'mapInfo'); // create a div with a class "info"
      this.update();
      return this._div;
  };

  // method that we will use to update the control based on feature properties passed
  info.update = function (props) {
      this._div.innerHTML = '<h4>' + item + ' population density</h4>' + 
          (props ? '<b>' + areaType + ': ' + props.name + '</b><br />' + (Math.round(props.density * 100) / 100) + ' ' + item + 's / ' + areaUnit + '<sup>2</sup>' : 'Hover over a ' + areaType);
  };

  info.addTo(mapObj);  
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
    
    if (info && layer.feature)
      info.update(layer.feature.properties);
}

function paintPolygon(map, shapeDiv) {
  var json = eval(shapeDiv.innerHTML);
  var numRings = json.length;
  for (var i = 0; i < numRings; i++) {
    var polygon = json[i];
    var p = L.polygon(polygon).addTo(map);
//    var p = L.polygon(polygon, {
//      color: 'red',
//      fillColor: '#f03',
//      fillOpacity: 0.5
//    }).addTo(map);
  }
}

var defaultMinMapDensity = 0;
var defaultMaxMapDensity = 10;
var minResolution = 0.01
function getLeafletMapTileColor(d) {
  var min = minMapDensity || defaultMinMapDensity;
  var max = maxMapDensity || defaultMaxMapDensity;
  if (max < minResolution)
    return getColorForPercentile(0);
  
  var percentile = (d - min) * 100 / (max - min);
  var color = getColorForPercentile(percentile);
//  console.log("returning color " + color + " for percentile " + percentile);
  return color;
//      return d > 1000 ? '#800026' :
//             d > 500  ? '#BD0026' :
//             d > 200  ? '#E31A1C' :
//             d > 100  ? '#FC4E2A' :
//             d > 50   ? '#FD8D3C' :
//             d > 20   ? '#FEB24C' :
//             d > 10   ? '#FED976' :
//                        '#FFEDA0';
}

var percentiles = [0, 1, 2, 5, 10, 25, 50, 90];
function getColorForPercentile(percentile) {
  var color =
    percentile > percentiles[7] ? '#800026' :
    percentile > percentiles[6]  ? '#BD0026' :
    percentile > percentiles[5]  ? '#E31A1C' :
    percentile > percentiles[4]  ? '#FC4E2A' :
    percentile > percentiles[3]   ? '#FD8D3C' :
    percentile > percentiles[2]   ? '#FEB24C' :
    percentile > percentiles[1]   ? '#FED976' : '#FFEDA0';
    
//  console.log("getColorForPercentile(" + percentile + ") = " + color); 
  return color;
}

function simpleStyle(feature) {
  return {
      fillColor: '#efefff',
      weight: 2,
      opacity: 1,
      color: 'blue',
      dashArray: '3',
      fillOpacity: 0.4
  };
}

function leafletDensityMapStyle(feature) {
  return {
      fillColor: getLeafletMapTileColor(feature.properties.density),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
  };
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function addMapLegend(mapObj) {
  var max = maxMapDensity || defaultMaxMapDensity;
  if (max < minResolution)
    return;
  
  var legend = L.control({position: 'bottomright'});
  legend.onAdd = function (mapObj) {
    var grades = [];
    for (var i = 0; i < percentiles.length; i++) {
      var grade = Math.round(percentiles[i] * maxMapDensity) / 100;
      if (grade > 0)
        grades.push(grade);
    }
    
    var div = L.DomUtil.create('div', 'mapInfo mapLegend'),
//          grades = percentiles,
        grades,
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<p><i style="background:' + getColorForPercentile(percentiles[i] + 0.1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? ' &ndash; ' + grades[i + 1] : '+') + "</p>";
    }

    return div;
  };
  
  legend.addTo(mapObj);
}
