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
    secondThird = third * 2;
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

var LablzLeaflet = {
    map : null,
    shapeJsons : {},
    shapeLayers: {},
    pointLayers: {},
    layerInfos: {},
    infoToLayer: {},
    mapInfoObjs : [],
    layerToDensity : {},
    currentLayerDensity : null,
    currentLayerName : null,
    addBasicMapInfo : function(init) {
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

      mapInfo.addTo(this.map);
      this.mapInfoObjs.push(mapInfo);
      return mapInfo;
    },

    addMapInfo : function(type, subType, areaType, areaUnit) {
      'use strict';
      var info = L.control();
      info.onAdd = function (map) {
          this._div = L.DomUtil.create('div', 'mapInfo'); // create a div with a class "info"
          this.update();
          return this._div;
      };

      var init = '<h4>' + type + ' population density</h4>';
      // method that we will use to update the control based on feature properties passed
      info.update = function (props) {
        if (props) {
          if (props.density != null)
            this._div.innerHTML = init + '<b>' + props.name + '</b><br />' + (Math.round(props.density * 100) / 100) + ' ' + (subType || props.item) + ' / ' + areaUnit + '<sup>2</sup>';
//            this._div.innerHTML = init + '<b>' + areaType + ': ' + props.name + '</b><br />' + (Math.round(props.density * 100) / 100) + ' ' + (subType || props.item) + 's / ' + areaUnit + '<sup>2</sup>';
          else
            this._div.innerHTML = init;
          
//          if (props.count != null)
//            this._div.innerHTML += 'Total: ' + props.count + ' ' + (subType || props.item) + 's';
        }
        else
          this._div.innerHTML = init + 'Hover over a ' + areaType;
      };

      info.updateWithHTML = function (html) {
        this._div.innerHTML = init + html;
      };

      this.mapInfoObjs.push(info);
      info.addTo(this.map);  
    },

    clearInfos : function(e) {
      'use strict';
      for (var i = 0; i < LablzLeaflet.mapInfoObjs.length; i++) {
        LablzLeaflet.mapInfoObjs[i].update();
      }  
    },

    updateInfosForLayer : function(layer) {
      'use strict';
      for (var i = 0; i < LablzLeaflet.mapInfoObjs.length; i++) {
        if (layer.feature.properties)
          LablzLeaflet.mapInfoObjs[i].update(layer.feature.properties);
      }
    },

    updateInfosWithHTML : function(html) {
      'use strict';
      for (var i = 0; i < LablzLeaflet.mapInfoObjs.length; i++) {
        LablzLeaflet.mapInfoObjs[i].updateWithHTML(html);
      }
    },

    updateInfos : function(e) {
      'use strict';
      var layer = e.target;
      LablzLeaflet.updateInfosForLayer(layer);
    },

    highlightFeature : function(e) {
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
          LablzLeaflet.updateInfosForLayer(layer);
        }
    },

    minResolution : 0.01,
    getLeafletMapTileColor : function(d) {
      'use strict';
      var minMax = LablzLeaflet.currentLayerDensity;
      var min = minMax[0];
      var max = minMax[1];
      if (max < LablzLeaflet.minResolution)
        return LablzLeaflet.getColorForPercentile(0);
      
      if (min == max)
        min = 0;

      var percentile = max == min ? 100 : (d - min) * 100 / (max - min);
      var color = LablzLeaflet.getColorForPercentile(percentile);
      return color;
    },

    percentiles : [0, 10, 20, 40, 66, 75, 90, 95],
    
    getColorForPercentile : function(percentile) {
      'use strict';
      var color =
        percentile > LablzLeaflet.percentiles[7] ? '#800026' :
        percentile > LablzLeaflet.percentiles[6]  ? '#BD0026' :
        percentile > LablzLeaflet.percentiles[5]  ? '#E31A1C' :
        percentile > LablzLeaflet.percentiles[4]  ? '#FC4E2A' :
        percentile > LablzLeaflet.percentiles[3]   ? '#FD8D3C' :
        percentile > LablzLeaflet.percentiles[2]   ? '#FEB24C' :
        percentile > LablzLeaflet.percentiles[1]   ? '#FED976' : '#FFEDA0';
        
      return color;
    },

    simpleDashedStyle : function(feature) {
      'use strict';
      var simple = LablzLeaflet.simpleStyle(feature);
      simple['dashArray'] = '3';
      return simple;
    },

    simpleStyle : function(feature) {
      'use strict';
      return {
          fillColor: '#efefff',
          weight: 2,
          opacity: 1,
          color: '#5555ff',
          fillOpacity: 0.4
      };
    },

    leafletDensityMapStyle : function(feature) {
      'use strict';
      return {
          fillColor: LablzLeaflet.getLeafletMapTileColor(feature.properties.density),
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.7
      };
    },

    addSizeButton : function(mapDiv, bounds) {
      'use strict';
      var btn = L.control({position: 'bottomleft'});
      btn.onAdd = function (mapObj) {
        var maxImg = "<img src='icons/map-fullscreen.png' />";
        var minImg = "<img src='icons/map-unfullscreen.png' />";
        var div = L.DomUtil.create('div', 'resize');
        div.innerHTML = maxImg;
        div.onclick = function(e) {
          var maximized = mapDiv.innerHTML.indexOf('map-full') == -1;
          if (maximized) {
            // restore
            mapDiv.style.position = 'relative';
            mapDiv.style.height = "";
            document.body.style.overflow = 'auto';
            var parent = document.getElementById("siteResourceList");
            parent = parent || document.getElementById("corePageContent");
            parent.insertBefore(mapDiv, getFirstChild(parent));
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
            mapDiv.style.height = wDim[1] + "px";
            document.body.appendChild(mapDiv);
            document.body.style.overflow = 'hidden';
            div.innerHTML = minImg;
            mapObj.invalidateSize(true);
          }
        };
        
        return div;
      }
      
      btn.addTo(this.map);  
    },

    addReZoomButton : function(bounds) {
      'use strict';
      var rezoom = L.control({position: 'bottomleft'});
      rezoom.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'rezoom');
        div.innerHTML = "<img src='icons/homePage.png' />";
        div.onclick = function(e) {
          map.fitBounds(bounds);
        };
        
        return div;
      }
      
      rezoom.addTo(this.map);
    },

    addDensityLegend : function(minMax) {
      'use strict';
      if (this.densityLegend)
        this.map.removeControl(this.densityLegend);
      
      var max = minMax[1];
      if (max < this.minResolution)
        return;

      var min = minMax[0];
      if (min == max)
        min = 0;
      
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
          for (var i = 0; i < LablzLeaflet.percentiles.length; i++) {
            var grade = min + (LablzLeaflet.percentiles[i] / 100) * range;
            grade = Math.round(multiplier * grade) / multiplier;
            
            if (grades.indexOf(grade) == -1)
              grades.push(grade);
          }
        }
        
        var div = L.DomUtil.create('div', 'mapInfo mapLegend'),
//              grades = percentiles,
            grades,
            labels = [];

        // loop through our density intervals and generate a label with a colored square for each interval
        if (grades.length == 1)
          return div;
        
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<p><i style="background:' + LablzLeaflet.getColorForPercentile(100 * ((grades[i] - min) / range + 0.1)) + '"></i> ' +
                grades[i] + (grades[i + 1] ? ' &ndash; ' + grades[i + 1] : '+') + "</p>";
        }

        return div;
      };
      
      legend.addTo(this.map);
      this.densityLegend = legend;
    },

    buildGeoJsonShapeLayers : function(style, name) {
      'use strict';
      if (!this.shapeJsons || !this.layerInfos)
        return;
      
      var geoJsonLayers = {};
      var names = name == null ? Object.keys(this.layerInfos) : [name];
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        if (this.shapeLayers && this.shapeLayers[name]) {
          var l = this.shapeLayers[name];
          var layerCount = 0;
          l.eachLayer(
              function(layer) {
                layerCount++;
              }
          );
          
          if (layerCount > 0)
            continue;
        }
        
        var nameToProps = this.layerInfos[name];
        var geoJsonLayer = [];
        for (var j = 0; j < nameToProps.length; j++) {
          var props = nameToProps[j];
          var shapeId = props['id'];
          var shapeJson = this.shapeJsons[shapeId];
          var geoJson = JSON.parse(JSON.stringify(shapeJson)); //jQuery.extend(true, {}, shapeJson);
          for (var prop in props) {
            if (props.hasOwnProperty(prop))
              geoJson.properties[prop] = props[prop];
          }
          
          geoJsonLayer.push(geoJson);
        }
        
        geoJsonLayers[name] = geoJsonLayer;
      }

      var counter = 0;
      var firstLayer;
      for (var name in geoJsonLayers) {    
        var minMax = getMinMaxDensity(geoJsonLayers[name]);
        this.setMinMaxDensity(name, minMax);
        this.currentLayerName = name;
        this.currentLayerDensity = minMax;
        if (counter == 0)
          firstLayer = name;
        
        var newLayer = this.mkLayerGroup(name, geoJsonLayers[name], minMax, style, this.shapeLayers[name]);
        if (counter == 0)
          newLayer.addTo(this.map);
        
        this.shapeLayers[name] = newLayer;
        counter++;
      }

      this.currentLayerName = firstLayer;
    },

    addDelayedLayer : function(name) {
      var self = this;
      var newLayer = new L.layerGroup();
      newLayer.onAdd = function(mapObj) {
        LablzLeaflet.currentLayerName = name;
        this._map = mapObj;
        var layerCount = 0;
        this.eachLayer(
            function(layer) {
              layerCount++;
            }
        );
        
        if (layerCount == 0) {
          var info = self.layerInfos[name];
//          function paint() {
//            newLayer.eachLayer(mapObj.addLayer, mapObj);
//            newLayer.densityLegend = LablzLeaflet.addDensityLegend(geoJson, minMax);
//          }
          
          self.fetchLayer(name, info.query, self[info.toGeoJson]); //, paint);
          return;
        }        
      };
      
      newLayer.onRemove = function(mapObj) {
        this._map = mapObj;
        this.eachLayer(mapObj.removeLayer, mapObj);
        if (self.densityLegend)
          mapObj.removeControl(self.densityLegend);
      };
      
      return newLayer;
    },
    
    mkLayerGroup : function(name, geoJson, minMax, style, layerGroup) {
      var self = this;
      var layers = this.addGeoJsonShapes(geoJson, style);
      var newLayer;
      if (layerGroup) {
        for (var i = 0; i < layers.length; i++) {
          layerGroup.addLayer(layers[i]);
        }
        
        newLayer = layerGroup;
      }
      else
        newLayer = new L.layerGroup(layers);
      
      newLayer.onAdd = function(mapObj) {
        LablzLeaflet.currentLayerName = name;
        this._map = mapObj;
        this.eachLayer(mapObj.addLayer, mapObj);
        LablzLeaflet.addDensityLegend(minMax);
//        LablzLeaflet.fetchLayer("TreesBySpeciesAndPostalCode", "species=TreeSpecies/PLAC", this);
      };
      
      newLayer.onRemove = function(mapObj) {
        this._map = mapObj;
        this.eachLayer(mapObj.removeLayer, mapObj);
//        if (this.densityLegend)
//          mapObj.removeControl(this.densityLegend);
      };

      return newLayer;
    },

    addGeoJsonShapes : function(geoJsons, style, autoAdd) {
      'use strict';
      var layers = [];
      for (var i = 0; i < geoJsons.length; i++) {
        var gj = this.makeLayerFromGeoJsonShape(geoJsons[i], style, autoAdd);
        layers.push(gj);
      }
      
//      this.shapeLayers = this.shapeLayers ? this.shapeLayers.concat(layers) : layers;
      return layers;
    },

    makeLayerFromGeoJsonShape : function(geoJson, style, autoAdd) {
      var gj;
      var resetHighlight = function(e) {
        gj.resetStyle(e.target);
        LablzLeaflet.clearInfos(e);
      };
      
      var zoomToFeature = function(e) {
        LablzLeaflet.fitBounds(e.target.getBounds());
      }

      var onEachFeature = function(feature, layer) {
        layer.on({
          mouseover: LablzLeaflet.highlightFeature,
          mouseout: resetHighlight,
          click: zoomToFeature
        });
      };

      gj = L.geoJson(geoJson, {style: style ? style : this.simpleStyle, onEachFeature: onEachFeature});
      if (autoAdd)
        gj.addTo(this.map);
      
      if (geoJson.properties.html)
        gj.bindPopup(geoJson.properties.html);
      
      return gj;
    },
      
    addGeoJsonPoints : function(mapLayers, nameToGeoJson, options, style, doCluster, highlight, zoom, hexColor, colorSeed, icon) {
      'use strict';
      var i = 0;
      var layers = mapLayers || {};
      var length = Object.size(nameToGeoJson);
      for (var name in nameToGeoJson) {
        var g = nameToGeoJson[name];
        var gj;
        var resetHighlight = function(e) {
          gj.resetStyle(e.target);
        };
        
        var onEachFeature = function(feature, layer) {
          layer.on({
            mouseover: highlight ? highlightFeature : updateInfos,
            mouseout: highlight ? resetHighlight : updateInfos,
            click: zoom ? zoomToFeature : null
          });
        };
        
        options = options || {};
        if (length > 1) {
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
        }
        
        if (doCluster)
          var markers = new L.MarkerClusterGroup(options);
        var pointToLayer = function(feature, latlng) {
          var marker;
          if (icon)
            marker = L.marker(latlng, {icon: icon});
          else
            marker = L.marker(latlng);
          
          if (feature.properties.width) {
            marker.bindPopup(feature.properties.html, {minWidth: feature.properties.width, minHeight: feature.properties.height});        
          }
          else {
            marker.bindPopup(feature.properties.html);
          }

          marker.on('mouseover', function(e) {this.updateInfosWithHTML(feature.properties.name);});
          marker.on('mouseout', function(e) {this.clearInfos(e);});
          if (doCluster)
            markers.addLayer(marker);
          
          return doCluster ? markers : marker;
        };
        
        gj = L.geoJson(g, {style: style ? style : this.simpleStyle, pointToLayer: pointToLayer}).addTo(this.map);
        layers[name] = gj;
        i++;
      }

      merge(this.pointLayers, layers);
      return layers;
    },

    fitBounds : function(mapBounds) {
      if (mapBounds)
        this.map.fitBounds(mapBounds);
    },

    addMap : function(apiKey, styleId, maxZoom, center) {
      var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/' + apiKey + '/' + styleId + '/' + '256/{z}/{x}/{y}.png';
      var cloudmadeAttribution = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade'
      var cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: maxZoom, attribution: cloudmadeAttribution});
      var latlng = new L.LatLng(center[0], center[1]);
      this.map = new L.Map('map', {center: latlng, zoom: 12, maxZoom: maxZoom, layers: [cloudmade]});
      this.map.on('layeradd', function(e) {
        console.log('adding layer: ' + e);
      });
    },

    addLayersControlToMap : function(radioLayers, checkboxLayers, options) {
      options = options || {position: 'topright'};
      var lControl = L.control.layers(radioLayers, checkboxLayers, options).addTo(this.map);
      
//      var all = new L.layerGroup();
//      for (var name in layers) {
//        all.addLayer(layers[name]);
//      }
    //  
//      all.addTo(map);
//      var outer = {'Show/Hide All': all};
//      for (var name in layers) {
//        outer[name] = layers[name];
//      }
    //  
//      var lControl = L.control.layers(null, outer, {position: 'topleft'}).addTo(map);
    },

    fetchLayer : function(name, query, toGeoJson) { //, callback) {
      var baseUriO = document.getElementsByTagName('base');
      var baseUri = "";
      if (baseUriO) {
        baseUri = baseUriO[0].href;
        if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
          baseUri += "/";
      }

      function fetchedLayer(e, div, hotspot, content, url) {
        if (!content)
          return;
        
        content = eval("(" + content + ")");
        if (content.error || !content.data)
          return;

        var data = content.data;
        if (data.length == 0)
          return;
        
        var geoJson = {};
        var propsArr = [];
        for (var i = 0; i < data.length; i++) {
          var props = toGeoJson(data[i]);
          propsArr.push(props);
        }

        LablzLeaflet.layerInfos[name] = propsArr;
        var minMax = getMinMaxDensityFromPropertiesArray(propsArr);
        LablzLeaflet.setMinMaxDensity(name, minMax);
        LablzLeaflet.currentLayerName = name;
        LablzLeaflet.currentLayerDensity = minMax;
        LablzLeaflet.buildGeoJsonShapeLayers(LablzLeaflet.leafletDensityMapStyle, name);
        LablzLeaflet.addDensityLegend(minMax);
      }
      
      var path = query.split("?");
      postRequest(null, baseUri + "api/v1/" + path[0], path.length > 1 ? path[1] : null, null, null, fetchedLayer);
    },

    getLayerName : function(type) {
      switch (type) {
      case 'TreesBySpeciesAndPostalCode':
      case 'TreesBySpeciesAndCensusBlock':
        return 'species.commonName';
      }  
    },
    setMinMaxDensity : function(name, minMax) {
      this.layerToDensity[name] = minMax;
    },
    
    setCurrentLayer : function(name) {
      this.currentLayerName = name;
      this.currentLayerDensity = this.layerToDensity[name];
    },
    
    getMinMaxDensity : function(name) {
      return this.layerToDensity[name];
    },
    
}

//var Aggregation = {
//  'TreesBySpeciesAndPostalCode' : {'shape': 'geoLocation', 'nonShape' : 'species', 'count' : 'treesCount'},
//  'TreesBySpeciesAndCensusBlock' : {'shape': 'censusBlock', 'nonShape' : 'species', 'count' : 'treesCount'},
//}

function getMinMaxDensity(geoJsons) {
  var max;
  var min;
  for (var i = 0; i < geoJsons.length; i++) {
    var gj = geoJsons[i];
    var props = gj.properties;
    if (!props || props.density == null)
      continue;
    
    var d = props.density;
    max = max ? Math.max(d, max) : d;
    min = min ? Math.min(d, min) : d;
  }
  
  return [min, max];
}

function getMinMaxDensityFromPropertiesArray(propsArr) {
  var max;
  var min;
  for (var i = 0; i < propsArr.length; i++) {
    var props = propsArr[i];
    if (!props || props.density == null)
      continue;
    
    var d = props.density;
    max = max ? Math.max(d, max) : d;
    min = min ? Math.min(d, min) : d;
  }
  
  return [min, max];
}

// concats "two" to "one" and returns one
function merge(one, two) {
  if (!one)
    one = {};
  
  if (!two)
    return one;
  
  for (var prop in two) {
    one[prop] = two[prop];
  }
  
  return one;
}