//'use strict';
define('views/MapView', [
  'globals',
  'underscore', 
  'events', 
  'utils',
  'views/BasicView'
], function(G, _, Events, U, BasicView) {
  var MapView = BasicView.extend({
//    css: [
//      'leaflet.css', 
//      'MarkerCluster.Default.css'
//    ],
//    cssListeners: [],
    loadedCSS: false,
    initialize: function (options) {
      _.bindAll(this, 'render', 'render1', 'show', 'hide','toggleMap', 'resetMap', 'onSwipe');
      this.constructor.__super__.initialize.apply(this, arguments);
      Events.on("mapIt", this.toggleMap);
      Events.on("pageChange", this.resetMap);
      
//      var self = this;
//      csses = _.map(this.css, function(c) {return '../styles/leaflet/' + c});
//      require(csses, function() {
//        self.loadedCSS = true;
//        if (self.cssListeners.length)
//          _.each(self.cssListeners, function(f) {f()});
//      });
    },
    events: {
//      'click': 'click',
      'swipe': 'onSwipe',
      'swiperight': 'onSwipe',
      'swipeleft': 'onSwipe'
    },
    onSwipe: function(e) {
      Events.stopEvent(e);
    },
//    click: Events.defaultClickHandler,  
    render: function (eventName) {
      var self = this, 
          args = arguments;
      
      require(['maps', 'leaflet', 'leafletMarkerCluster', '../styles/leaflet/leaflet.css', '../styles/leaflet/MarkerCluster.Default.css'], function(Mapper, L) {
        self.render1.apply(self, arguments);
      });
    },
    render1: function() {
      L.Icon.Default.imagePath = 'images/leaflet';
//      if (!this.loadedCSS) {
//        this.cssListeners.push(self.render);
//        return this;
//      }
      
      var res = this.resource || this.collection;
      var vocModel = this.vocModel;
      if (res.isA("Shape")) {
        this.remove();
        return this;
      }
      
      var metadata = {};
      var gj = this.collectionToGeoJSON(res, metadata);
      if (!gj || !_.size(gj))
        return;
      
      var bbox = metadata.bbox;
      var center = this.getCenterLatLon(bbox);
      
      var pMap = U.getHashParams();
      var poi = pMap['-item'];
      var isMe = poi == 'me';
      var latLon; 
      if (poi) {
        coords = [parseFloat(pMap.longitude), parseFloat(pMap.latitude)];
        center = [coords[1], coords[0]];
        poi = this.getBasicGeoJSON('Point', coords);
        if (isMe) {
          poi.properties.name = 'Your location';
          poi.properties.html = '<a href="' + G.pageRoot + '#view/profile">You are here</a>';
        }
      }
        
  //    this.$el.html(this.template());
  
      var div = document.createElement('div');
      div.className = 'map';
      div.id = 'map';
  
      var map = this.mapper = new Mapper(div);
      map.addMap(G.cloudMadeApiKey, {maxZoom: poi ? 10 : null, center: center, bounds: bbox}, poi);
      var zoom = map.initialZoom;
  //        , {'load': function() {
  //      Events.trigger('mapReady', this.resource);
  //      this.$el.append(frag);
  //      console.log('render map');      
  //    }});
  
      var clusterStyle = {singleMarkerMode: true, doScale: false, showCount: true, doSpiderfy: false};
      var style = {doCluster: true, highlight: true, zoom: false};
      var name = vocModel.shortName;
      var geoJson = {};
      geoJson[name] = gj;
      map.addGeoJsonPoints(geoJson, null, clusterStyle, null, style);
//      map.addSizeButton(this.$el[0]);
//      map.addReZoomButton({zoom: zoom, center: center});
      map.addReZoomButton({bounds: bbox})
      var dName = vocModel.displayName;
      dName = dName.endsWith('s') ? dName : dName + 's';
      var basicInfo = map.addBasicMapInfo(dName);
      var frag = document.createDocumentFragment();
      frag.appendChild(div);
      map.finish();
      
      Events.trigger('mapReady', res);
      this.$el.append(frag);
      this.hide();
      return this;
    },
    resetMap: function() {
      this.mapper && this.mapper.map.invalidateSize();
    },
    toggleMap: function(e) {
      if (e.active) {
        this.show();
        this.resetMap();
      }
      else {
        this.hide();
      }
    },
    
    show: function() {
      this.$el.show();
      return this;
    },
    
    hide: function() {
      this.$el.hide();
      return this;    
    },
    getMapItemHTML: function(res) {
      var grid = U.getCols(res, 'grid');
    
      var resourceLink;
      for (var row in grid) {
        if (grid[row].resourceLink) {
          resourceLink = grid[row].value;
          delete grid[row];
        }
      }
      
      resourceLink = resourceLink || res.get('davDisplayName');
      var data = {resourceLink: resourceLink, uri: res.getUri(), rows: grid};
      
      if (res.isA("ImageResource")) {
        var medImg = res.get('mediumImage') || res.get('featured');
        if (medImg) {
          var width = res.get('originalWidth');
          var height = res.get('originalHeight');
          if (width && height) {
            var imgOffset = Math.max(width, height) / 205;
            width = Math.round(width / imgOffset);
            height = Math.round(height / imgOffset);
          }
          
          medImg = {value: U.decode(medImg)};
          width && (medImg.width = width);
          height && (medImg.height = height);
          data.image = this.makeTemplate("imagePT", "imagePT")(medImg);
//          _.extend(data, {U: U, G: G});
          return this.makeTemplate("mapItemTemplate", "mapItemTemplate")(data);
        }
      }
      
      return this.makeTemplate("mapItemTemplate", "mapItemTemplate")(data);
    },
    collectionToGeoJSON: function(model, metadata) {
      var gj = [];
      _.each(model.models, function(m){
        var mGJ = this.modelToGeoJSON(m, metadata);
        if (mGJ)
          gj.push(mGJ);
      }.bind(this));
      
      return gj;
    },
    modelToGeoJSON: function(model, metadata) {
      if (U.isCollection(model))
        return this.collectionToGeoJSON(model);
      
      var isShape = model.isA("Shape");
      var coords, area;
      if (isShape) {
        coords = model.get('shapeJson');
        if (!coords)
          return null;
        
        area = model.get('area');
      }
      else {
        var lon = model.get('longitude');
        if (!lon)
          return null;
        
        coords = [lon, model.get('latitude')];  
      }
      
        
      var type = this.getShapeType(coords);
      if (metadata) {
        var bbox;
        if (isShape)
          bbox = [[model.get('lowestLatitude'), model.get('lowestLongitude')], [model.get('highestLatitude'), model.get('highestLongitude')]];
        else {
          bbox = [coords[1], coords[0]];
          bbox = [bbox, bbox];
        }
        
        if (metadata.bbox) {
          var b = metadata.bbox;
          Mapper.adjustBounds(b, coords, isShape ? 'Polygon' : 'Point');
        }
        else
          metadata.bbox = bbox; 
      }
      
      var json = this.getBasicGeoJSON(type, coords);
      json.properties.name = model.constructor.displayName + " " + model.get('davDisplayName');
      if (area)
        json.properties.area = area;
      
      json.properties.html = this.getMapItemHTML(model);
      return json;
    },
    
    getCenterLatLon: function(bbox) {
      return [(bbox[1][0] + bbox[0][0]) / 2, (bbox[1][1] + bbox[0][1]) / 2];
    },
    
    /**
     * @param coords: points should be in lon, lat order
     */
    getBasicGeoJSON: function(shapeType, coords) {
      return {
        "type": "Feature",
        "properties": {
        },
        "geometry": {
          "type": shapeType,
          "coordinates": coords
        }
      };
    },
    
    getShapeType: function(rings) {
      var depth = this.getDepth(rings);
      switch (depth) {
      case 1:
        return "Point";
      case 2:
        return null;
      case 3:
        return "Polygon";
      case 4:
        return "MultiPolygon";
      default:
        return null;
      }
    },
    
    getDepth: function(arr) {
      var depth = 1;
      for (var i = 0; i < arr.length; i++) {
        var sub = arr[i];
        if (U.isArray(sub))
          depth = Math.max(depth, U.getDepth(sub) + 1);
        else
          return depth;
      }
      
      return depth;
    }
  },
  {
    displayName: 'MapView'
  });
  
  return MapView;
});