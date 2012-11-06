Lablz.Templates = { 
    // Hash of preloaded templates for the app
    templates: {},
 
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

// Events //
Lablz.Events = _.extend({}, Backbone.Events);
//$(window).scroll(function() {
//  Lablz.Events.trigger("windowScroll");
//});

Lablz.Events.defaultTapHandler = function(e) {
//  console.log("got tap event");
  var event = e.originalEvent;
  var el = event.target;
  var $el = $(el);
  if ($el.prop('tagName') != 'A')
    return true;
  
  event.preventDefault();
  var href = $el.prop('href');
  Backbone.history.navigate(href.slice(href.indexOf('#') + 1), true);
}

Lablz.Events.defaultClickHandler = function(e) {
//  console.log("got click event");
  var event = e.originalEvent;
  var el = event.target;
  var $el = $(el);
  if ($el.prop('tagName') != 'A')
    return true;

  event.preventDefault();
  var href = $el.prop('href');
  Backbone.history.navigate(href.slice(href.indexOf('#') + 1), true);
}

// Views
Lablz.ResourceView = Backbone.View.extend({
//  el: $('#content'),
//  tagName: 'div',
  initialize: function(options) {
    _.bindAll(this, 'render', 'tap', 'mapIt', 'fetchMap'); // fixes loss of context for 'this' within methods
    this.propRowTemplate = _.template(Lablz.Templates.get('propRowTemplate'));
    this.model.bind('change', this.render, this);
//    this.model.bind('reset', this.render, this);
    return this;
  },
  events: {
    'click': 'click',
    'tap': 'tap',
    "click #mapIt": "mapIt"
  },
  mapIt: function(e) {
    e.preventDefault();
    Lablz.Events.trigger("mapIt", this.model);
  },
  tap: Lablz.Events.defaultTapHandler,  
  click: Lablz.Events.defaultClickHandler,  
  render:function (eventName) {
    console.log("render resource");
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
        json[p] = _.template(Lablz.Templates.get(propTemplate))(json[p]);
      }

      html += this.propRowTemplate({name: prop.label, value: json[p]});
    }
    
    var j = {"props": json};
    this.$el.html(html);
//    var self = this;
//    if (this.model.isA("Locatable") || this.model.isA("Shape"))
//      this.fetchMap();

    this.rendered = true;
    return this;
  },
  fetchMap: function() {
    this.mapModel = new Lablz.MapModel({model: this.model});
    mapView = new Lablz.MapView({mapDivId: 'resourceMap', model: this.mapModel});
    this.mapModel.fetch({success: 
      function() {
//        $('body').append($(mapView.render().el));
        mapView.render();
      }
    });
  }
});

Lablz.MapView = Backbone.View.extend({
  tagName: 'div',
  el: $('#map'),
  initialize: function (options) {
    _.bindAll(this, 'render', 'show', 'hide', 'tap', 'toggleMap');
    Lablz.Events.bind("mapIt", this.toggleMap);
    if (options) {
      this.el = options.el;
      this.mapDivId = options.mapDivId;
    }
    
//    this.template = _.template(Lablz.Templates.get('mapTemplate'));
    this.ready = false;
    self = this;
//    $.when(
//      // TODO: check if leaflet css has already been loaded
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
    if (!this.ready) {
      setTimeout(
        function() {
          Lablz.MapView.prototype.render.call(this, eventName);
        }
      , 100);
      
      return this;
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
//    this.$el.html(this.template());
//    this.el = $(this.mapDivId);
    this.$el.empty();
//    this.$el.hide();
    var m = this.model;
    var map = Lablz.Leaflet(this.mapDivId);
    map.pointLayers = m.get('pointLayers');
    map.pointLayerInfos = m.get('pointLayerInfos');
    map.shapeLayers = m.get('shapeLayers');
    map.shapeLayerInfos = m.get('shapeLayerInfos');
    map.userAskedFor = m.get('userAskedFor');
    var maxZoom = m.get('maxZoom');
    map.addMap(m.get('cloudMadeApiKey'), m.get('styleId'), maxZoom, m.get('center'), undefined);
    
    var pLayers = m.get('pointLayers');
    if (pLayers) {
      var clusterStyle = m.get('clusterStyle');
      if (clusterStyle)
        clusterStyle.disableClusteringAtZoom = maxZoom;
      
      var firstLayerName = null;
      var firstLayer = null;
      for (var name in pLayers) {
        var type = Object.prototype.toString.call(pLayers[name]);
        if (type === '[object Array]') {
          firstLayerName = name;
          firstLayer = pLayers[name];
          map.addGeoJsonPoints({name: firstLayer}, null, clusterStyle, null, m.get('pointLayersStyle'));
        }
        else if (type == '[object Object]')
          map.addDelayedLayer(name, 'addPointsLayer');
      }
    }
    
    var mapBounds = m.get('bounds');
    map.fitBounds(mapBounds);
    map.addSizeButton(this.$el, mapBounds);
    map.addReZoomButton(mapBounds);
    var basicInfo = map.addBasicMapInfo(firstLayerName);
    Lablz.Events.trigger('mapReady', this.model);
    return this;
  },

  toggleMap: function(e) {
    this.$el.is(":visible") && this.hide() || this.show();
  },
  
  show: function() {
    this.$el.show();
    return this;
  },
  
  hide: function() {
    this.$el.hide();
    return this;    
  }
});

Lablz.ListPage = Backbone.View.extend({
  initialize:function () {
    _.bindAll(this, 'render', 'tap', 'mapIt', 'showMapButton');
    Lablz.Events.bind("mapReady", this.showMapButton);
    this.template = _.template(Lablz.Templates.get('resource-list'));
  },
  events: {
    'tap': 'tap',
    'click #mapIt': 'mapIt',
    'click': 'click',
    'click #nextPage': 'nextPage'
  },
  nextPage: function(e) {
    Lablz.Events.trigger('nextPage', this.model);    
  },
  mapIt: function(e) {
    e.preventDefault();
    Lablz.Events.trigger("mapIt", this.model);
  },
  showMapButton: function(e) {
    this.$('#mapIt').show();
  },
  tap: Lablz.Events.defaultTapHandler,
  click: Lablz.Events.defaultClickHandler,  
  render:function (eventName) {
    console.log("render listPage");
    this.$el.html(this.template(this.model.toJSON()));
    this.listView = new Lablz.ResourceListView({el: $('ul', this.el), model: this.model});
    this.listView.render();
    this.rendered = true;
    if (!this.$el.parentNode) 
      $('body').append(this.$el);
    
    return this;
  }
});

Lablz.ViewPage = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'render', 'tap', 'mapIt', 'showMapButton');
    this.model.on('change', this.render, this);
    this.template = _.template(Lablz.Templates.get('resource'));
    Lablz.Events.bind("mapReady", this.showMapButton);
  },
  events: {
    'tap': 'tap',
    'click #mapIt': 'mapIt',
    'click': 'click'
  },
  mapIt: function(e) {
    e.preventDefault();
    Lablz.Events.trigger("mapIt", this.model);
  },
  showMapButton: function(e) {
    this.$('#mapIt').show();
  },
  tap: Lablz.Events.defaultTapHandler,
  click: Lablz.Events.defaultClickHandler,  
  render:function (eventName) {
    console.log("render viewPage");
    this.$el.html(this.template(this.model.toJSON()));
    this.view = new Lablz.ResourceView({el: $('ul#resourceView', this.el), model: this.model});
    this.view.render();
    this.rendered = true;
    if (!this.$el.parentNode) 
      $('body').append(this.$el);
    
//    $(".back").on('tap', function(e) {
//      console.log("tap event");
//    });
//
//    $(".back").on('taphold', function(e) {
//      console.log("taphold event");
//    });
//
//    $(".back").on('swipe', function(e) {
//      console.log("swipe event");
//    });
//
//    $(".back").on('touchend', function(e) {
//      console.log("touchend event");
//    });

    return this;
  }

});

Lablz.ResourceListView = Backbone.View.extend({
    mapView: null,
    mapModel: null,
    page: 1,
    initialize:function () {
      _.bindAll(this, 'render', 'fetchMap', 'tap', 'swipe', 'mapIt', 'checkScroll', 'getNextPage', 'renderMany', 'renderOne'); // fixes loss of context for 'this' within methods
      Lablz.Events.bind('nextPage', this.getNextPage);
      this.model.bind('add', this.renderMany, this);
      this.model.on('reset', this.render, this);
//      var self = this;
//      if (this.model.isA("Locatable") || this.model.isA("Shape"))
//        this.fetchMap();
      
      return this;
    },
    getNextPage: function() {
      this.isLoading = true;
      var self = this;
      var before = this.model.models.length;
      var after = function() {
        self.isLoading = false;
      };
      
      this.model.getNextPage({
        success: after,
        error: after
      });      
    },
    checkScroll: function () {
      var triggerPoint = 100; // 100px from the bottom
      if(!this.isLoading && this.el.scrollTop + this.el.clientHeight + triggerPoint > this.el.scrollHeight ) {
        console.log("scroll event");
//        getNextPage();
      }
      
      return this;
    },
    mapIt: function(e) {
      e.preventDefault();
      Lablz.Events.trigger("mapIt", this.model);
    },
    tap: Lablz.Events.defaultTapHandler,
    click: Lablz.Events.defaultClickHandler,  
    swipe: function(e) {
      console.log("swipe");
    },
    renderOne: function(model) {
      this.$el.append(new Lablz.ResourceListItemView({model:model}).render().el);
    },
    renderMany: function(models) {
      if (models instanceof Backbone.Model) // one model
        this.renderOne(models);
      else
        _.forEach(models, this.renderOne);
    },
    render:function (eventName) {
      console.log("render listView");
  		this.renderMany(this.model.models);
  		
//  		var mapBtnElt = this.$('mapIt');
//  		if (mapBtnElt) {
//  		  this.mapItBtn = new MapItButtonView({el: this.$('mapIt')});
//  		}
  		
      this.rendered = true;
  		return this;
    },
    fetchMap: function() {
      this.mapModel = new Lablz.MapModel({model: this.model});
      mapView = new Lablz.MapView({mapDivId: 'listMap', model: this.mapModel});
      this.mapModel.fetch({success: 
        function() {
          mapView.render();
        }
      });
    }
});

Lablz.ResourceListItemView = Backbone.View.extend({
  tagName:"li",
  
	initialize: function() {
    _.bindAll(this, 'render', 'tap'); // fixes loss of context for 'this' within methods
		this.template = _.template(Lablz.Templates.get('listItemTemplate'));
    this.model.on('change', this.render, this);
		return this;
	},
  events: {
    'tap': 'tap',
    'click': 'click'
  },
  tap: Lablz.Events.defaultTapHandler,
  click: Lablz.Events.defaultClickHandler,  
  render:function (eventName) {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  }
});
