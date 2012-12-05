define([
  'jquery',
  'backbone',
  'underscore',
  'templates',
  'events',
  'utils',
  'lib/leaflet',
  'lib/leaflet.markercluster',
  'maps',
  'jqueryMobile'
], function($, Backbone, _, Templates, Events, U, L, LM, Mapper) {
  
  return Backbone.View.extend({
  //  template: 'mapTemplate',
    initialize: function (options) {
      _.bindAll(this, 'render', 'show', 'hide', 'tap', 'toggleMap', 'resetMap');
      Lablz.Events.on("mapIt", this.toggleMap);
      Lablz.Events.on("changePage", this.resetMap);
  //    this.template = _.template(Lablz.Templates.get(this.template));
      this.ready = false;
      self = this;
      
  //    $.when(
          // TODO: check if leaflet css has already been loaded
  //      $.ajax(Lablz.serverName + "/styles/leaflet/" + ($.browser.msie ? "leaflet.ie.css" : "leaflet.css")),
  //      ((typeof L != 'undefined' && L.Map) || $.ajax(Lablz.serverName + "/leaflet.js")),
  //      ((typeof L != 'undefined' && L.MarkerClusterGroup) || $.ajax(Lablz.serverName + "/leaflet.markercluster.js")),
  //      (typeof Lablz.Leaflet != 'undefined' || $.ajax(Lablz.serverName + "/maps.js"))        
  //    ).then(
  //      function () {
          self.ready = true;
  //      }
  //    );
    },
    events: {
      'tap': 'tap',
    },
    tap: Lablz.Events.defaultTapHandler,
    click: Lablz.Events.defaultClickHandler,  
    render:function (eventName) {
      var self = this;
      if (!this.ready) {
        setTimeout(
          function() {
            this.constructor.prototype.render.call(self, eventName);
          }
        , 100);
        
        return this;
      }
      
      var m = this.model;
      m = m instanceof Backbone.Collection ? m.model : m.constructor;
      if (U.isA(m, "Shape")) {
        this.remove();
        return this;
      }
      
      var metadata = {};
      var gj = this.constructor.collectionToGeoJSON(this.model, metadata);
      if (!gj || !_.size(gj))
        return;
      
      var bbox = metadata.bbox;
      var center = this.constructor.getCenterLatLon(bbox);
      
      var pMap = U.getHashParams();
      var poi = pMap['-item'];
      var isMe = poi == 'me';
      var latLon; 
      if (poi) {
        coords = [pMap.longitude, pMap.latitude];
        center = [coords[1], coords[0]];
        poi = this.constructor.getBasicGeoJSON('Point', coords);
        if (isMe) {
          poi.properties.name = 'Your location';
          poi.properties.html = '<a href="' + Lablz.pageRoot + '#view/profile">You are here</a>';
        }
      }
        
  //    this.$el.html(this.template());
  
      var div = document.createElement('div');
      div.className = 'map';
      div.id = 'map';
  
      var map = this.mapper = new Lablz.Leaflet(div);
      map.addMap(Lablz.cloudMadeApiKey, {maxZoom: poi ? 10 : null, center: center, bounds: bbox}, poi);
  //        , {'load': function() {
  //      Lablz.Events.trigger('mapReady', self.model);
  //      self.$el.append(frag);
  //      console.log('render map');      
  //    }});
  
      var clusterStyle = {singleMarkerMode: true, doScale: false, showCount: true, doSpiderfy: false};
      var style = {doCluster: true, highlight: true, zoom: false};
      var name = self.model.shortName;
      map.addGeoJsonPoints({name: gj}, null, clusterStyle, null, style);
      map.addSizeButton(this.$el[0]);
      map.addReZoomButton(bbox);
      var dName = self.model.displayName;
      dName = dName.endsWith('s') ? dName : dName + 's';
      var basicInfo = map.addBasicMapInfo(dName);
      var frag = document.createDocumentFragment();
      frag.appendChild(div);
      map.finish();
      
      Lablz.Events.trigger('mapReady', self.model);
      self.$el.append(frag);
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
    }
  },
  {
    getMapItemHTML: function(model) {
      var tpl = Lablz.Templates;
      var m = model;
      var grid = U.getGridCols(m);
    
      var resourceLink;
      for (var row in grid) {
        if (grid[row].resourceLink) {
          resourceLink = grid[row].value;
          delete grid[row];
        }
      }
      
      resourceLink = resourceLink || m.get('davDisplayName');
      var data = {resourceLink: resourceLink, uri: m.get('_uri'), rows: grid};
      
      if (m.isA("ImageResource")) {
        var medImg = m.get('mediumImage') || m.get('featured');
        if (medImg) {
          var width = m.get('originalWidth');
          var height = m.get('originalHeight');
          if (width && height) {
            var imgOffset = Math.max(width, height) / 205;
            width = Math.round(width / imgOffset);
            height = Math.round(height / imgOffset);
          }
          
          medImg = {value: U.decode(medImg)};
          width && (medImg.width = width);
          height && (medImg.height = height);
          data.image = _.template(tpl.get("imagePT"))(medImg);
          return _.template(tpl.get("mapItemTemplate"))(data);
        }
      }
      
      return _.template(tpl.get("mapItemTemplate"))(data);
    },
    collectionToGeoJSON: function(model, metadata) {
      var gj = [];
      _.each(model.models, function(m){
        var mGJ = this.constructor.modelToGeoJSON(m, metadata);
        if (mGJ)
          gj.push(mGJ);
      })
      
      return gj;
    },
    modelToGeoJSON: function(model, metadata) {
      if (model instanceof Backbone.Collection)
        return this.constructor.collectionToGeoJSON(model);
      
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
      
        
      var type = this.constructor.getShapeType(coords);
      if (metadata) {
        var bbox;
        if (isShape)
          bbox = [[model.get('lowestLatitude'), model.get('lowestLongitude')], [model.get('highestLatitude'), model.get('highestLongitude')]];
        else
          bbox = [[coords[1], coords[0]], [coords[1], coords[0]]];
        
        if (metadata.bbox) {
          var b = metadata.bbox;
          b[0][0] = Math.min(b[0][0], bbox[0][0]);
          b[0][1] = Math.min(b[0][1], bbox[0][1]);
          b[1][0] = Math.max(b[1][0], bbox[1][0]);
          b[1][1] = Math.max(b[1][1], bbox[1][1]);
        }
        else
          metadata.bbox = bbox; 
      }
      
      var json = this.constructor.getBasicGeoJSON(type, coords);
      json.properties.name = model.constructor.displayName + " " + model.get('davDisplayName');
      if (area)
        json.properties.area = area;
      
      json.properties.html = this.constructor.getMapItemHTML(model);
      return json;
    },
    
    getCenterLatLon: function(bbox) {
      return [(bbox[1][0] + bbox[0][0]) / 2, (bbox[1][1] + bbox[0][1]) / 2];
    }
  });
});