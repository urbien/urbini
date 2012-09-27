golden_ratio_conjugate = 0.618033988749895;
function generateColors(total, seed) {
  'use strict';
  var r = [];
  var third, secondThird;
  if (total < 3) {
    third = 1;
  }
  else {
    third = total / 3;
    var secondThird = third * 2;
  }
  
  var sum = 0;
  var h = seed || Math.random();
  for (var i = 0; i < total; i++) {
    h += golden_ratio_conjugate;
    h %= 1;
    var s, v;
    if (i < third) {
      s = 0.5;
      v = 0.95;
    }
    else if (i < secondThird) {
      s = 0.99;
      v = 0.8;
    }
    else {
      s = 0.3;
      v = 0.99;
    }
    
    r.push([h, s, v]);
  }
  
  return r;
}

function getTextColor(bgR, bgG, bgB) {
  'use strict';
  var d = 0;
  
  // Counting the perceptive luminance - human eye favors green color... 
  var a = 1 - ( 0.299 * bgR + 0.587 * bgG + 0.114 * bgB)/255;

  if (a < 0.5)
    d = 80; // bright colors - black font
  else
    d = 255; // dark colors - white font

  return rgbToHex(d, d, d);
}

function componentToHex(c) {
  'use strict';
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  'use strict';
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRGB(h) {
  'use strict';
  var num = (h.charAt(0)=="#") ? h.substring(1,7): h;
  return [parseInt(num.substring(0,2),16), parseInt(num.substring(2,4),16), parseInt(num.substring(4,6), 16)];
}

function hsv2rgb(h, s, v) {
  'use strict';
  //Adapted from http://www.easyrgb.com/math.html
  //hsv values = 0 - 1, rgb values = 0 - 255
  var r, g, b;
  var RGB = new Array();
  if (s == 0) {
      var r = Math.round(v * 255);
      RGB = [r, r, r];
  } else {
      var var_r, var_g, var_b;
      // h must be < 1
      var var_h = h * 6;
      if (var_h == 6) var_h = 0;
      //Or ... var_i = floor( var_h )
      var var_i = Math.floor(var_h);
      var var_1 = v * (1 - s);
      var var_2 = v * (1 - s * (var_h - var_i));
      var var_3 = v * (1 - s * (1 - (var_h - var_i)));
      if (var_i == 0) {
          var_r = v;
          var_g = var_3;
          var_b = var_1;
      } else if (var_i == 1) {
          var_r = var_2;
          var_g = v;
          var_b = var_1;
      } else if (var_i == 2) {
          var_r = var_1;
          var_g = v;
          var_b = var_3
      } else if (var_i == 3) {
          var_r = var_1;
          var_g = var_2;
          var_b = v;
      } else if (var_i == 4) {
          var_r = var_3;
          var_g = var_1;
          var_b = v;
      } else {
          var_r = v;
          var_g = var_1;
          var_b = var_2;
      }
      //rgb results = 0 ÷ 255  
      RGB = [Math.round(var_r * 255), Math.round(var_g * 255), Math.round(var_b * 255)];
  }
  
  return RGB;
};

function rgb2hsv (r,g,b) {
  'use strict';
  var computedH = 0;
  var computedS = 0;
  var computedV = 0;

  //remove spaces from input RGB values, convert to int
  r=r/255; g=g/255; b=b/255;
  var minRGB = Math.min(r,Math.min(g,b));
  var maxRGB = Math.max(r,Math.max(g,b));

  // Black-gray-white
  if (minRGB==maxRGB) {
   computedV = minRGB;
   return [0,0,computedV];
  }

  // Colors other than black-gray-white:
  var d = (r==minRGB) ? g-b : ((b==minRGB) ? r-g : b-r);
  var h = (r==minRGB) ? 3 : ((b==minRGB) ? 1 : 5);
  computedH = 60*(h - d/(maxRGB - minRGB));
  computedS = (maxRGB - minRGB)/maxRGB;
  computedV = maxRGB;
  return [computedH/360,computedS,computedV];
}

function componentToHex(c) {
  'use strict';
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  'use strict';
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

var mapInfoObjs = [];

function clearInfos(e) {
  'use strict';
  for (var i = 0; i < mapInfoObjs.length; i++) {
    mapInfoObjs[i].update();
  }  
}

function updateInfosForLayer(layer) {
  'use strict';
  for (var i = 0; i < mapInfoObjs.length; i++) {
    if (layer.feature.properties)
      mapInfoObjs[i].update(layer.feature.properties);
  }
}

function updateInfosWithHTML(html) {
  'use strict';
  for (var i = 0; i < mapInfoObjs.length; i++) {
    mapInfoObjs[i].updateWithHTML(html);
  }
}

function addBasicMapInfo(mapObj, init) {
  'use strict';
  var mapInfo = L.control();
  mapInfo.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'mapInfo'); // create a div with a class "info"
      this.update();
      return this._div;
  };

  // method that we will use to update the control based on feature properties passed
  mapInfo.update = function (properties) {
    var html = properties ? properties.name : null;
    this._div.innerHTML = html ? init + html : init;
  };

  mapInfo.updateWithHTML = function (html) {
    this._div.innerHTML = html ? init + html : init;
  };

  mapInfo.addTo(mapObj);
  mapInfoObjs.push(mapInfo);
  return mapInfo;
}

function addMapInfo(mapObj, item, areaType, areaUnit) {
  'use strict';
  var info = L.control();
  info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'mapInfo'); // create a div with a class "info"
      this.update();
      return this._div;
  };

  var init = '<h4>' + item + ' population density</h4>';
  // method that we will use to update the control based on feature properties passed
  info.update = function (props) {
    if (props) {
      if (props.density)
        this._div.innerHTML = init + '<b>' + areaType + ': ' + props.name + '</b><br />' + (Math.round(props.density * 100) / 100) + ' ' + item + 's / ' + areaUnit + '<sup>2</sup>';
      else
        this._div.innerHTML = init;
    }
    else
      this._div.innerHTML = init + 'Hover over a ' + areaType;
  };

  info.updateWithHTML = function (html) {
    this._div.innerHTML = init + html;
  };

  mapInfoObjs.push(info);
  info.addTo(mapObj);  
}

function updateInfos(e) {
  'use strict';
  var layer = e.target;
  updateInfosForLayer(layer);
}

function highlightFeature(e) {
  'use strict';
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
    
    if (layer.feature) {
      updateInfosForLayer(layer);
    }
}

function paintPolygon(map, shapeDiv) {
  'use strict';
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
  'use strict';
  var min = minMapDensity || defaultMinMapDensity;
  var max = maxMapDensity || defaultMaxMapDensity;
  if (max < minResolution)
    return getColorForPercentile(0);
  
  var percentile = max == min ? 100 : (d - min) * 100 / (max - min);
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

var percentiles = [0, 10, 20, 40, 66, 75, 90, 95];
function getColorForPercentile(percentile) {
  'use strict';
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

function simpleDashedStyle(feature) {
  'use strict';
  var simple = simpleStyle(feature);
  simple['dashArray'] = '3';
  return simple;
}

function simpleStyle(feature) {
  'use strict';
  return {
      fillColor: '#efefff',
      weight: 2,
      opacity: 1,
      color: '#5555ff',
      fillOpacity: 0.4
  };
}

function leafletDensityMapStyle(feature) {
  'use strict';
  return {
      fillColor: getLeafletMapTileColor(feature.properties.density),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
  };
}

function addSizeButton(mapDiv, mapObj, bounds) {
  'use strict';
  var btn = L.control({position: 'bottomleft'});
  btn.onAdd = function (mapObj) {
    var maxImg = "<img src='icons/map-fullscreen.png' />";
    var minImg = "<img src='icons/map-unfullscreen.png' />";
    var oWidth = mapDiv.offsetWidth;
    var oHeight = mapDiv.offsetHeight;
    var oTop = mapDiv.offsetTop;
    var oLeft = mapDiv.offsetLeft;
    var parent = mapDiv.parentNode;
    var div = L.DomUtil.create('div', 'resize');
    div.innerHTML = maxImg;
    div.onclick = function(e) {
      var maximized = mapDiv.innerHTML.indexOf('map-full') == -1;
      if (maximized) {
        // restore
        mapDiv.style.position = 'relative';
        mapDiv.style.width = oWidth;
        mapDiv.style.height = oHeight;
        mapDiv.style.top = oTop;
        mapDiv.style.left = oLeft;
        document.body.style.overflow = 'auto';
        div.innerHTML = maxImg;
        mapObj.invalidateSize(true);
        mapObj.fitBounds(bounds);
      }
      else {
        // maximize
        var scroll = getScrollXY();
        var wDim = getWindowDimension();
        mapDiv.style.position = 'absolute';
        mapDiv.style.top = scroll[1] + "px"; 
        mapDiv.style.left = scroll[0] + "px"; 
        mapDiv.style.width = wDim[0] + "px";
        mapDiv.style.height = wDim[1] + "px";
        document.body.appendChild(mapDiv);
        document.body.style.overflow = 'hidden';
        div.innerHTML = minImg;
        mapObj.invalidateSize(true);
      }
    };
    
    return div;
  }
  
  btn.addTo(mapObj);  
}

function addReZoomButton(mapObj, bounds) {
  'use strict';
  var rezoom = L.control({position: 'bottomleft'});
  rezoom.onAdd = function (mapObj) {
    var div = L.DomUtil.create('div', 'rezoom');
    div.innerHTML = "<img src='icons/homePage.png' />";
    div.onclick = function(e) {
      mapObj.fitBounds(bounds);
    };
    
    return div;
  }
  
  rezoom.addTo(mapObj);
}

function addDensityLegend(mapObj, geoJsons) {
  'use strict';
//  var length = geoJsons.length;
//  var numPercentiles = Math.min(Math.log(length), 8);
  
  
  var max = maxMapDensity || defaultMaxMapDensity;
  if (max < minResolution)
    return;

  var min = minMapDensity || defaultMinMapDensity;
  var legend = L.control({position: 'bottomright'});
  legend.onAdd = function (mapObj) {
    var grades = [];
    var range = max - min;
    var rangeDigits = Math.round(Math.log(range) / Math.log(10));
    var pow = -rangeDigits + 2;
    var multiplier = Math.pow(10, pow);
    if (range == 0) {
      grades.push(max);
    }
    else {
      for (var i = 0; i < percentiles.length; i++) {
        var grade = min + (percentiles[i] / 100) * range;
        grade = Math.round(multiplier * grade) / multiplier;
        
        if (grades.indexOf(grade) == -1)
          grades.push(grade);
      }
    }
    
    var div = L.DomUtil.create('div', 'mapInfo mapLegend'),
//          grades = percentiles,
        grades,
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    if (grades.length == 1)
      return div;
    
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<p><i style="background:' + getColorForPercentile(100 * ((grades[i] - min) / range + 0.1)) + '"></i> ' +
            grades[i] + (grades[i + 1] ? ' &ndash; ' + grades[i + 1] : '+') + "</p>";
    }

    return div;
  };
  
  legend.addTo(mapObj);
}

function addGeoJsonShapeLayers(map, mapLayers, geoJsonLayers, style) {
  'use strict';
  var layers = mapLayers || [];
  var counter = 0;
  for (var name in geoJsonLayers) {
    var layer = addGeoJsonShapes(map, null, geoJsonLayers[name], style);
    var newLayer = new L.layerGroup(layer);
    if (counter++ == 0)
      newLayer.addTo(map);
    layers[name] = newLayer;
  }
  
  return layers;
}

function addGeoJsonShapes(map, mapLayers, geoJsons, style) {
  'use strict';
  var layers = mapLayers || [];
  for (var i = 0; i < geoJsons.length; i++) {
    var gj;
    var resetHighlight = function(e) {
      gj.resetStyle(e.target);
      clearInfos(e);
    };
    
    var zoomToFeature = function(e) {
      map.fitBounds(e.target.getBounds());
    }

    var onEachFeature = function(feature, layer) {
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
      });
    };
  
    gj = L.geoJson(geoJsons[i], {style: style ? style : simpleStyle, onEachFeature: onEachFeature});
    if (geoJsons[i].properties.html)
      gj.bindPopup(geoJsons[i].properties.html);
    
    layers.push(gj);
  }
  
  return layers;
}

function addClustersForGeoJsons(map, mapLayers, nameToGeoJson, clusterOptions, style, highlight, zoom, hexColor, colorSeed) {
  'use strict';
  var i = 0;
  var layers = mapLayers || {};
  for (var name in nameToGeoJson) {
    var g = nameToGeoJson[name];
    var gj;
//    var resetHighlight = function(e) {
//      gj.resetStyle(e.target);
//    };
//    
//    var onEachFeature = function(feature, layer) {
//      layer.on({
//        mouseover: highlight ? highlightFeature : updateInfos,
//        mouseout: highlight ? resetHighlight : updateInfos,
//        click: zoom ? zoomToFeature : null
//      });
//    };
    
    var options = clusterOptions ? clusterOptions : {};
    if (!hexColor) {
      var colors = generateColors(1, colorSeed || 0.5);
      colorSeed = colors[0][0];
      var color = hsv2rgb(colors[0][0], colors[0][1], colors[0][2]);
      color = rgbToHex(color[0], color[1], color[2]);
      options.color = color;
    }
    else {
      options.color = hexColor;
      var rgb = hexToRGB(hexColor);
      colorSeed = rgb2hsv(rgb[0], rgb[1], rgb[2])[0];
      hexColor = null;
    }
    
    var markers = new L.MarkerClusterGroup(options);
    var pointToLayer = function(feature, latlng) {
      var marker = L.marker(latlng);
      if (feature.properties.width) {
        marker.bindPopup(feature.properties.html, {minWidth: feature.properties.width, minHeight: feature.properties.height});        
      }
      else {
        marker.bindPopup(feature.properties.html);
      }

      marker.on('mouseover', function(e) {updateInfosWithHTML(feature.properties.name);});
      marker.on('mouseout', function(e) {clearInfos(e);});
      markers.addLayer(marker);
      return markers;
    };
    
    gj = L.geoJson(g, {style: style ? style : simpleStyle, pointToLayer: pointToLayer}).addTo(map);
    layers[name] = gj;
    i++;
  }

//  var all = new L.layerGroup([layers]);
//  var outer = {'All': all};
//  for (name in layers) {
//    outer[name] = layers[name];
//  }
//  
//  return outer;
  return layers;
}

function addLayersControlToMap(map, radioLayers, checkboxLayers, options) {
  options = options || {position: 'topright'};
  var lControl = L.control.layers(radioLayers, checkboxLayers, options).addTo(map);
  
//  var all = new L.layerGroup();
//  for (var name in layers) {
//    all.addLayer(layers[name]);
//  }
//  
//  all.addTo(map);
//  var outer = {'Show/Hide All': all};
//  for (var name in layers) {
//    outer[name] = layers[name];
//  }
//  
//  var lControl = L.control.layers(null, outer, {position: 'topleft'}).addTo(map);
}
