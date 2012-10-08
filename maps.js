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
    serverName : null,
    map : null,
    maxZoom : 17,
    pointOfInterest: {},
    color : null,
    shapeJsons : {},
    shapeLayers: {},
    pointLayers: {},
    shapeLayerInfos: {},
    pointLayerInfos: {},
    infoToLayer: {},
    nameToType: {},
    mapInfoObjs : [],
    layerToDensity : {},
    currentLayerDensity : null,
    currentLayerName : null,
    userAskedFor : {},
    getNextColor : function(seed) {
      var hsv = generateColors(1, seed || (LablzLeaflet.color ? LablzLeaflet.color[0] : 0.7));
      LablzLeaflet.color = hsv[0]; 
      var rgb = hsv2rgb(hsv[0][0], hsv[0][1], hsv[0][2]);
      return rgbToHex(rgb[0], rgb[1], rgb[2]);
    },
    
    addBasicMapInfo : function(init) {
      'use strict';
      var self = this;
      var mapInfo = L.control();
      mapInfo.onAdd = function (map) {
          this._div = L.DomUtil.create('div', 'mapInfo'); // create a div with a class "info"
          this.update();
          return this._div;
      };

      // method that we will use to update the control based on feature properties passed
      init = self.pointOfInterest.name ? init + ' near ' + self.pointOfInterest.name : init;
      init = "<h4>" + init + "</h4>";
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
          if (props.density != null) {
            var name = subType || props.item + 's';
//            name = props.type ? props.type + ' ' + name : name;
            this._div.innerHTML = init + '<b>' + props.name + '</b><br />' + (Math.round(props.density * 100) / 100) + ' ' + name + ' / ' + areaUnit + '<sup>2</sup>';
          }
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
//      if (max < this.minResolution)
//        return;

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
      if (!this.shapeJsons || !this.shapeLayerInfos)
        return;
      
      var geoJsonLayers = {};
      var names = name == null ? Object.keys(this.shapeLayerInfos) : [name];
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
        
        var nameToProps = this.shapeLayerInfos[name];
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
        if (minMax != null) {
          this.setMinMaxDensity(name, minMax);
          this.currentLayerName = name;
          this.currentLayerDensity = minMax;
        }
        
        if (counter == 0 && this.userAskedFor[name])
          firstLayer = name;
        
        var newLayer = this.mkShapeLayerGroup(name, geoJsonLayers[name], minMax, style, this.shapeLayers[name]);
        if (counter == 0 && this.userAskedFor[name])
          newLayer.addTo(this.map);
        
        this.shapeLayers[name] = newLayer;
        counter++;
      }

      this.setCurrentLayer(firstLayer || this.currentLayerName);
    },

    loadLayer : function(name, layerGroup, callback) {
      var layerCount = 0;
      layerGroup.eachLayer(
          function(layer) {
            layerCount++;
          }
      );
      
      if (layerCount > 0)
        return;
      
      var info = LablzLeaflet.shapeLayerInfos[name];
      info = info || LablzLeaflet.pointLayerInfos[name];
      LablzLeaflet.fetchLayer(name, info.query, LablzLeaflet[info.toGeoJson], callback);
    },

    addDelayedLayer : function(name, callback) {
      var self = this;
      var newLayer = new L.layerGroup();
      newLayer.onAdd = function(mapObj) {
        self.userAskedFor[name] = "y";
        LablzLeaflet.currentLayerName = name;
        this._map = mapObj;
        LablzLeaflet.loadLayer(name, newLayer, callback);
      };
      
      newLayer.onRemove = function(mapObj) {
        this._map = mapObj;
        newLayer.eachLayer(mapObj.removeLayer, mapObj);
        if (self.densityLegend)
          mapObj.removeControl(self.densityLegend);
      };

//      var numLayers = LablzLeaflet.pointLayers ? Object.size(LablzLeaflet.pointLayers) : 0;
//      numLayers += LablzLeaflet.shapeLayers ? Object.size(LablzLeaflet.shapeLayers) : 0;
//      setTimeout(function() {
//        LablzLeaflet.loadLayer(name, newLayer, callback);
//      }, 500 * numLayers);
      
      return newLayer;
    },

    mkPointLayerGroup : function(name, geoJsons, layerGroup) {
      var newLayer;
      if (layerGroup) {
        for (var i = 0; i < geoJsons.length; i++) {
          layerGroup.addLayer(geoJsons[i]);
        }
        
        newLayer = layerGroup;
      }
      else
        newLayer = new L.layerGroup(geoJsons);
      
      this.setOnAddRemove(name, newLayer);
      return newLayer;
    },

    mkShapeLayerGroup : function(name, geoJson, minMax, style, layerGroup) {
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
      
      this.setOnAddRemove(name, newLayer, minMax);
      return newLayer;
    },

    setOnAddRemove : function(name, newLayer, minMax) {
      newLayer.onAdd = function(mapObj) {
        LablzLeaflet.currentLayerName = name;
        this._map = mapObj;
        this.eachLayer(mapObj.addLayer, mapObj);
        if (typeof minMax != 'undefined') {
          LablzLeaflet.currentLayerName = name;
          LablzLeaflet.currentLayerDensity = minMax;
          LablzLeaflet.addDensityLegend(minMax);
        }
      };
      
      newLayer.onRemove = function(mapObj) {
        this._map = mapObj;
        this.eachLayer(mapObj.removeLayer, mapObj);
      };
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
      style = style ? style : this.simpleStyle;
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

      gj = L.geoJson(geoJson, {style: style, onEachFeature: onEachFeature});
      if (autoAdd)
        gj.addTo(this.map);
      
      if (geoJson.properties.html)
        gj.bindPopup(geoJson.properties.html);
      
      return gj;
    },
      
    toBasicGeoJsonShape : function(shape) {
      var shapeType = shape.shapeType ? (shape.shapeType.toLowerCase() == 'multipolygon' ? 'MultiPolygon' : 'Polygon') : 'Polygon';
      return {"type" : "Feature", "properties": {"name" : shape["DAV:displayname"], "html": html}, "geometry": {"type": shapeType, "coordinates": eval('(' + shape.shapeJson + ')')}};
    },

    toBasicGeoJsonPoint : function(point) {
      return {"type" : "Feature", "properties": {"name" : point["DAV:displayname"]}, "geometry": {"type": "Point", "coordinates": [point.longitude, point.latitude]}};
    },
    
    getScaledClusterIconCreateFunction: function(color, doScale, showCount) {
      return function(cluster) {
        var childCount = cluster.getChildCount();
        var children = cluster.getAllChildMarkers();
        var radius;
        var size = 40;
        var diameter = 30;
        custom = true;
        var rgb = hexToRGB(color || getNextColor(Math.random()));
        var background = "background-color: rgba(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ", 0.7); color: " + getTextColor(rgb[0], rgb[1], rgb[2]) + ";";
        var zoom = cluster._zoom || 10;
        var width;
        var font;
        if (doScale) {
          diameter = 10 + Math.round(100 * Math.log(childCount) / zoom);
          size = diameter + 6; // +10 if marker-cluster padding is 5px 
          width = "width: " + diameter + "px; height: " + diameter + "px; line-height: " + (diameter + 1) + "px;";
          font = "font-size: " + Math.ceil(size / 4 + 5) + "px;" // + (size < 20 ? '8px' : size < 60 ? '15px' : '25px') + ";";
        }
        
        html = '<div style=\"' + (background || '') + (width || '') + (font || '') + '\">' + (showCount && childCount > 1 ? childCount : '') + '</div>';
        
        return new L.DivIcon({ html: html, className: 'marker-cluster marker-cluster-tight marker-cluster-green', iconSize: new L.Point(size, size) });
      }
    },

    getSimpleClusterIconCreateFunction: function() {
      return function(cluster) {
        var childCount = cluster.getChildCount();
        var one = childCount == 1;
        var size = 40;
        var c;
        if (one) {
          size = 15;
          c = 'marker-cluster marker-cluster-tight marker-cluster-green';
        }
        else {
          c = ' marker-cluster-';
          if (childCount < 10) {
            c += 'small';
          } else if (childCount < 100) {
            c += 'medium';
          } else {
            c += 'large';
          }
          
          c = 'marker-cluster ' + c;
        }

        var div;
        if (one) {
          var diameter = size - 6;
          div = "<div style=\"width:" + diameter + "px; height: " + diameter + "px; line-height: " + (diameter + 1) + "px; background-color: rgba(0, 255, 0, 0.5);\">";
        }
        else
          div = '<div>';

          
        return new L.DivIcon({ html: div + (one ? '' : '<span>' + childCount + '</span>') + '</div>', className: c, iconSize: new L.Point(size, size) });
      }
    },

    addGeoJsonPoints : function(nameToGeoJson, type, markerOptions, style, behaviorOptions) {
      'use strict';
      behaviorOptions = behaviorOptions || {doCluster: false, highlight: false, zoom: false, hexColor: undefined, colorSeed: undefined, icon: undefined};
      var self = this;
      var style = style ? style : this.simpleStyle;
      var i = 0;
      var length = Object.size(nameToGeoJson);
      var layer = [];
      for (var name in nameToGeoJson) {
        var g = nameToGeoJson[name];
        var gj;
        var resetHighlight = function(e) {
          gj.resetStyle(e.target);
        };
        
        var onEachFeature = function(feature, layer) {
          layer.on({
            mouseover: behaviorOptions.highlight ? highlightFeature : updateInfos,
            mouseout: behaviorOptions.highlight ? resetHighlight : updateInfos,
            click: behaviorOptions.zoom ? zoomToFeature : null
          });
        };
        
        markerOptions = markerOptions || {};
//        if (!hexColor) {
//          var colors = generateColors(1, behaviorOptions.colorSeed || 0.5);
//          colorSeed = colors[0][0];
//          var color = hsv2rgb(colors[0][0], colors[0][1], colors[0][2]);
//          color = rgbToHex(color[0], color[1], color[2]);
//          markerOptions.color = color;
//        }
        if (behaviorOptions.hexColor) {
          var c = behaviorOptions.hexColor;
          markerOptions.color = c;
          var rgb = hexToRGB(c);
          behaviorOptions.colorSeed = rgb2hsv(rgb[0], rgb[1], rgb[2])[0];
          behaviorOptions.hexColor = null;
        }
        
        var markers;
        if (behaviorOptions.doCluster) {
          if (markerOptions.doScale)
            markerOptions.iconCreateFunction = self.getScaledClusterIconCreateFunction(markerOptions.color, markerOptions.doScale, markerOptions.showCount);
          else
            markerOptions.iconCreateFunction = self.getSimpleClusterIconCreateFunction();
          
          markers = new L.MarkerClusterGroup(markerOptions);
        }
        
        var pointToLayer = function(feature, latlng) {
          var marker;
          if (behaviorOptions.icon)
            marker = L.marker(latlng, {icon: behaviorOptions.icon});
          else
            marker = L.marker(latlng);
          
          var markerStyle = {};
          if (feature.properties.width)
            markerStyle.minWidth = feature.properties.width;
          
          if (feature.properties.height)
            markerStyle.minHeight = feature.properties.height;
            
          if (Object.size(markerStyle) > 0)
            marker.bindPopup(feature.properties.html, markerStyle);        
          else
            marker.bindPopup(feature.properties.html);

//          var name = type + ': ' + feature.properties.name;
          marker.on('mouseover', function(e) {self.updateInfosWithHTML(feature.properties.name);});
          marker.on('mouseout', function(e) {self.clearInfos(e);});
          if (behaviorOptions.doCluster)
            markers.addLayer(marker);
          
          return behaviorOptions.doCluster ? markers : marker;
        };
        
        gj = L.geoJson(g, {style: style, pointToLayer: pointToLayer});
        layer.push(gj);
        var newLayer = this.mkPointLayerGroup(name, layer, this.pointLayers[name]);
        this.pointLayers[name] = newLayer;
        this.nameToType[name] = type;
        
        newLayer.addTo(this.map);
        this.currentLayerName = name;
        i++;
      }
      
    },

    fitBounds : function(mapBounds) {
      if (mapBounds)
        this.map.fitBounds(mapBounds);
    },

    addMap : function(apiKey, styleId, maxZoom, center) {
      this.maxZoom = maxZoom;
      var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/' + apiKey + '/' + styleId + '/' + '256/{z}/{x}/{y}.png';
      var cloudmadeAttribution = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade'
      var cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: maxZoom, attribution: cloudmadeAttribution});
      var latlng = new L.LatLng(center[0], center[1]);
      this.map = new L.Map('map', {center: latlng, zoom: 12, maxZoom: maxZoom, layers: [cloudmade]});
      var loc = getUrlParam(window.location.href, "-loc");
      if (loc == null)
        return;
      
      loc = loc.split(",");
      if (loc.length != 2)
        return;
      
      var point = new L.LatLng(parseFloat(loc[0]), parseFloat(loc[1]));  
      this.map.setView(point);
      var marker = L.marker(point, {zIndexOffset: 1000, title: "Point of Interest"}).addTo(this.map);
      marker.bindPopup("<a href='javascript: history.go(-1);'>Probe me deeper</a>");
      this.pointOfInterest.marker = marker;
      this.pointOfInterest.name = "Baloney name";
    },

    addLayersControlToMap : function(radioLayers, checkboxLayers, options) {
      if ((!radioLayers && !checkboxLayers) ||
          (Object.size(radioLayers) == 1 && !checkboxLayers))
        return;
      
      options = options || {position: 'topright'};
      var lControl = L.control.layers(radioLayers, checkboxLayers, options).addTo(this.map);
    },

    addShapesLayer : function(name, shapesArr) {
      LablzLeaflet.currentLayerName = name;
      var newLayer = LablzLeaflet.mkShapeLayerGroup(name, shapesArr, undefined, undefined, LablzLeaflet.shapeLayers[name]).addTo(LablzLeaflet.map);      
      LablzLeaflet.shapeLayers[name] = newLayer;
    },

    addDensityLayer : function(name, propsArr) {
      var none = !propsArr || propsArr.length == 0;
      LablzLeaflet.shapeLayerInfos[name] = propsArr;
      var minMax = none ? [0, 0] : getMinMaxDensityFromPropertiesArray(propsArr);
      LablzLeaflet.setMinMaxDensity(name, minMax);
      if (LablzLeaflet.userAskedFor[name]) {
        LablzLeaflet.currentLayerName = name;
        LablzLeaflet.currentLayerDensity = minMax;
        LablzLeaflet.addDensityLegend(minMax);
      }
      
      LablzLeaflet.buildGeoJsonShapeLayers(LablzLeaflet.leafletDensityMapStyle, name);
    },
    
    addPointsLayer : function(name, geoJsons, type) {
      var nameToGJ = {};
      nameToGJ[name] = geoJsons;
      LablzLeaflet.addGeoJsonPoints(nameToGJ, type || name, {disableClusteringAtZoom: LablzLeaflet.maxZoom + 1, singleMarkerMode: true, doScale: true, showCount: true, doSpiderfy: false}, null, {doCluster: true, highlight: true, zoom: false, hexColor: LablzLeaflet.getNextColor()});      
    },
    
    fetchLayer : function(name, query, toGeoJson, callback) {
      if (!LablzLeaflet.serverName) {
        var baseUriO = document.getElementsByTagName('base');
        var baseUri = "";
        if (baseUriO) {
          baseUri = baseUriO[0].href;
          if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
            baseUri += "/";
        }
        
        LablzLeaflet.serverName = baseUri;
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
          var props = toGeoJson(data[i], name);
          if (props)
            propsArr.push(props);
        }

        if (typeof callback == 'string')
          callback = LablzLeaflet[callback];
        
        callback(name, propsArr);
        if (LablzLeaflet.userAskedFor)
          LablzLeaflet.userAskedFor[name] = null;
      }
      
      var path = query.split("?");
      postRequest(null, this.serverName + "api/v1/" + path[0], path.length > 1 ? path[1] : null, null, null, fetchedLayer);
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
 
    setWidthHeight : function(geoJson, width, height) {
      var hasWidth = typeof width != 'undefined';
      var hasHeight = typeof height != 'undefined';
      if (!hasWidth || !hasHeight) {
        geoJson.properties.width = 205;
        return;
      }
      
      var offset = Math.max(width, height) / 205;
      width = Math.round(width / offset);
      height = Math.round(height / offset);
      geoJson.properties.width = width;
      geoJson.properties.height = height;
    },
    
    setHTML : function(type, geoJson, item, img) {
      var width = geoJson.properties.width;
      var height = geoJson.properties.height;
      var hasWidth = typeof width != 'undefined';
      var hasHeight = typeof height != 'undefined';
      var isShort = item._uri.indexOf('http') != 0;
      var name = type + '<br />' + item["DAV:displayname"] + "<br/>";
      var html = "<a href='" + (isShort ? "v/" + item._uri : "v.html?uri=" + encodeURIComponent(item._uri)) + "'>" + name;
      if (img)
        html += "<img src='" + getImageUrl(img, this.serverName) + "'" + (hasWidth ? " width=\"" + width + "\"" : "") + (hasHeight ? " height=\"" + height + "\"" : "") + " />";
          
      html += "</a>";
      geoJson.properties.html = html;
    },
}

function getImageUrl(imgUri, serverName) {
  return imgUri == null ? null : 'http://' + serverName + imgUri.substring(imgUri.indexOf('Image') + 5);
}

//var Aggregation = {
//  'TreesBySpeciesAndPostalCode' : {'shape': 'geoLocation', 'nonShape' : 'species', 'count' : 'treesCount'},
//  'TreesBySpeciesAndCensusBlock' : {'shape': 'censusBlock', 'nonShape' : 'species', 'count' : 'treesCount'},
//}

function getMinMaxDensity(geoJsons) {
  var max = 0;
  var min = 0;
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
  var max = 0;
  var min = 0;
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

// concats "two" to "one" in new object
function merge(one, two) {
  if (!one && !two)
    return undefined;
  
  var obj = {};
  if (one) {
    for (var prop in one) {
      if (one.hasOwnProperty(prop))
        obj[prop] = one[prop];
    }
  }
  
  if (two) {
    for (var prop in two) {
      if (two.hasOwnProperty(prop))
        obj[prop] = two[prop];
    }
  }
  
  return obj;
}