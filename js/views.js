tpl = { 
    // Hash of preloaded templates for the app
    templates: {},
 
    // Recursively pre-load all the templates for the app.
    // This implementation should be changed in a production environment:
    // All the template files should be concatenated in a single file.
    loadTemplates: function() {
      var elts = $('script[type="text/template"]');
      for (var i = 0; i < elts.length; i++) {
        this.templates[elts[i].id] = elts[i].innerHTML;
      }
    },
 
    // Get template by name from hash of preloaded templates
    get: function(name) {
      return this.templates[name];
    }
 
};

// Views
Lablz.ResourceView = Backbone.View.extend({
//  el: $('#content'),
//  tagName: 'div',
  initialize: function(options) {
    _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
    this.propRowTemplate = _.template(tpl.get('propRowTemplate'));
//    this.model.bind('change', this.render, this);
//    this.model.bind('reset', this.render, this);
    return this;
  },
  
  render:function (eventName) {
    var type = this.model.type;
//    var path = Utils.getPackagePath(type);
    var meta = this.model.__proto__.constructor.properties;
    meta = meta || this.model.properties;
    if (!meta)
      return this;
    
    var html = "";
    var json = this.model.toJSON();
    for (var p in json) {
      if (!_.has(json, p))
        continue;
      
      var prop = meta[p];
      if (!prop) {
        delete json[p];
        continue;
      }
            
      if (p.charAt(0) == '_')
        continue;
      if (p == 'davDisplayName')
        continue;
      if (prop.avoidDisplaying)
        continue;
      
      var propTemplate = Lablz.templates[prop.type];
      if (propTemplate) {
        json[p] = json[p].displayName ? json[p] : {value: json[p]};
        json[p] = _.template(tpl.get(propTemplate))(json[p]);
      }

//      var v = json[p];
//      var val = (prop.type == "resource") ? '<a href="' + Lablz.serverName + "/bb#view/" + v + '">' + v + '</a>' : v;
        
      html += this.propRowTemplate({name: prop.label, value: json[p]});
    }
    
    var j = {"props": json};
    this.$el.html(html);
    this.rendered = true;
    return this;
  }
});

Lablz.MapView = Backbone.View.extend({
  tagName: 'div',
  el: $('#map'),
  initialize:function () {
    _.bindAll(this, 'render', 'show', 'hide');
    this.template = _.template(tpl.get('mapTemplate'));
    this.ready = false;
    self = this;
//    $.when(
//      $.ajax(Lablz.serverName + "/styles/leaflet/" + ($.browser.msie ? "leaflet.ie.css" : "leaflet.css")),
//      $.ajax(Lablz.serverName + "/leaflet.js"),
//      $.ajax(Lablz.serverName + "/leaflet.markercluster.js"),
//      $.ajax(Lablz.serverName + "/maps.js")
//    ).then(
//      function () {
        self.ready = true;
//      }
//    );
  },
  render:function (eventName) {
    if (!this.ready) {
      setTimeout(
        function() {
          Lablz.MapView.prototype.render.call(this, eventName);
        }
      , 100);
      
      return this;
    }
      
    var m = this.model;
    var pLayers = m.get('pointLayers');
    if (pLayers) {
      for (var name in pLayers) {
        Lablz.Leaflet.addDelayedLayer(name, 'addPointsLayer');
      }
      
    }
    
//    $('#map').empty();
//    var init = m.get('init');
//    if (init) {
//      init = init.split("\n");
//      _.each(init, 
//          function(line) {
//            eval(line);
//          }
//      );
//    }      

//    {disableClusteringAtZoom: Lablz.Leaflet.maxZoom, singleMarkerMode: true, doScale: false, showCount: true, doSpiderfy: false}, null, {doCluster: true, highlight: true, zoom: false, hexColor: undefined}
    var map = new Lablz.Leaflet;
    map.pointLayers = this.model.get('pointLayers');
    map.pointLayerInfos = this.model.get('pointLayerInfos');
    map.shapeLayers = this.model.get('shapeLayers');
    map.shapeLayerInfos = this.model.get('shapeLayerInfos');
    var maxZoom = this.model.get('maxZoom');
    Lablz.Leaflet.addMap(this.model.get('cloudMadeApiKey'), this.model.get('styleId'), maxZoom, this.model.get('center'), undefined);
    if (pLayers) {
      var clusterStyle = this.model.get('clusterStyle');
      if (clusterStyle)
        clusterStyle.disableClusteringAtZoom = maxZoom;
      
      var firstLayerName = null;
      var firstLayer = null;
      for (var name in pLayers) {
        var type = Object.prototype.toString.call(pLayers[name]);
        if (type === '[object Array]') {
          firstLayerName = name;
          firstLayer = pLayers[name];
          map.addGeoJsonPoints({name: firstLayer}, null, clusterStyle, null, this.model.get('pointLayersStyle'));
        }
        else if (type == '[object Object]')
          map.addDelayedLayer(name, 'addDensityLayer');
//          Lablz.Leaflet.addGeoJsonPoints({'Basketball courts (531)': pLayers['Basketball courts (531)']}, 'Basketball courts', clusterStyle, null, this.model.get('pointLayersStyle'));        
      }
    }
    
    var mapBounds = this.model.get('bounds');
    Lablz.Leaflet.map.fitBounds(mapBounds);
    Lablz.Leaflet.addSizeButton(el, mapBounds);
    Lablz.Leaflet.addReZoomButton(mapBounds);
    var basicInfo = Lablz.Leaflet.addBasicMapInfo(firstLayerName);

    this.$el.html(this.template(this.model.toJSON()));
    return this;
  },
  
  show: function() {
    return this;
  },
  
  hide: function() {
    return this;    
  }
});

Lablz.ListPage = Backbone.View.extend({
  initialize:function () {
    _.bindAll(this, 'render');
    this.template = _.template(tpl.get('resource-list'));
  },
  render:function (eventName) {
//    $(this.el).html(this.template(this.model.toJSON()));
//    $(this.el).empty();
    this.$el.html(this.template(this.model.toJSON()));
//    this.listView = new EmployeeListView      ({el: $('ul', this.el), model: this.model});
    this.listView = new Lablz.ResourceListView({el: $('ul', this.el), model: this.model});
    this.listView.render();
    this.rendered = true;
    return this;
  }

});

Lablz.ViewPage = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'render');
    this.model.on('change', this.render, this);
    this.template = _.template(tpl.get('resource'));
  },

  render:function (eventName) {
//    $(this.el).empty();
    this.$el.html(this.template(this.model.toJSON()));
//    $(this.el).append('<div></div>');
    this.view = new Lablz.ResourceView({el: $('ul#resourceView', this.el), model: this.model});
    this.view.render();
    this.rendered = true;
    return this;
  }

});

Lablz.ResourceListView = Backbone.View.extend({
//    tagName:'ul',
//    el: '#sidebar',
    mapView: null,
    mapModel: null,
    initialize:function () {
      _.bindAll(this, 'render', 'fetchMap'); // fixes loss of context for 'this' within methods
      this.model.on('reset', this.render, this);
//      var self = this;
//      if (this.model.model.isA("Locatable") || this.model.isA("Shape"))
//        this.fetchMap();
      
      return this;
    },
//    events: {
//      'scroll': 'checkScroll'
//    },
//    checkScroll: function () {
//      var triggerPoint = 100; // 100px from the bottom
//        if( !this.isLoading && this.el.scrollTop + this.el.clientHeight + triggerPoint > this.el.scrollHeight ) {
//          this.twitterCollection.page += 1; // Load next page
//          this.loadResults();
//        }
//    },
    render:function (eventName) {
  		var elt = this.$el;
  		this.model.each(function (item) {
        elt.append(new Lablz.ResourceListItemView({model:item}).render().el);
      });
        
      this.rendered = true;
  		return this;
    },
    fetchMap: function() {
      this.mapModel = new Lablz.MapModel({url: this.model.url});
      mapView = new Lablz.MapView({model: this.mapModel});
      this.mapModel.fetch({success: 
        function() {
          $('body').append($(mapView.render().el));
        }
      });
    }
});

Lablz.ResourceListItemView = Backbone.View.extend({
  tagName:"li",
  
	initialize: function() {
    _.bindAll(this, 'render', 'onChange'); // fixes loss of context for 'this' within methods
		this.template = _.template(tpl.get('listItemTemplate'));
    this.model.on('change', this.render, this);
		return this;
	},

  render:function (eventName) {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  },
  
  onChange: function(item) {
    item = item;
  }
});
