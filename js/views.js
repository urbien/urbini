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
    _.bindAll(this, 'render', 'tap', 'mapIt', 'fetchMap', 'getAroundMe'); // fixes loss of context for 'this' within methods
    this.propRowTemplate = _.template(Lablz.Templates.get('propRowTemplate'));
    this.model.on('change', this.render, this);
    Lablz.Events.on('aroundMe', this.getAroundMe);
//    this.model.on('reset', this.render, this);
    return this;
  },
  events: {
    'click': 'click',
    'tap': 'tap',
    "click #mapIt": "mapIt"
  },
  mapIt: function(e) {
    Lablz.Events.trigger("mapIt", this.model);
  },
  getAroundMe: function() {
    this.model.constructor.getAroundMe();    
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
    var self = this;
    if (this.model.isA("Locatable") || this.model.isA("Shape"))
      this.fetchMap();

    this.rendered = true;
    return this;
  },
  fetchMap: function() {
    this.mapModel = new Lablz.MapModel({model: this.model});
//    mapView = new Lablz.MapView({mapDivId: 'resourceMap', model: this.mapModel});
//    this.mapModel.fetch({success: 
//      function() {
//        $('body').append($(mapView.render().el));
//        mapView.render();
//      }
//    });
  }
});

Lablz.MapView = Backbone.View.extend({
  tagName: 'div',
  initialize: function (options) {
    _.bindAll(this, 'render', 'show', 'hide', 'tap', 'toggleMap');
    Lablz.Events.on("mapIt", this.toggleMap);
    if (options) {
      this.mapDivId = options.mapDivId;
      this.el = $(this.mapDivId);
    }
    
    this.ready = false;
    self = this;
    this.getCloudMade = function() {
      
    }
    
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
          Lablz.MapView.prototype.render.call(self, eventName);
        }
      , 100);
      
      return this;
    }
    
//    $(this.mapDivId).hide();
    var map = new Lablz.Leaflet(this.mapDivId);
    var metadata = {};
    var gj = Utils.collectionToGeoJSON(this.model, metadata);
    var bbox = metadata.bbox;
    var center = Utils.getCenterLatLon(bbox);
    
    var pMap = Utils.getHashParams();
    var poi = pMap['-item'];
    var latLon; 
    if (poi) {
      coords = [pMap.longitude, pMap.latitude];
      center = [coords[1], coords[0]];
      poi = Utils.getBasicGeoJSON('Point', coords);
      if (poi == 'me')
        poi.properties.html = '<a href="' + Lablz.pageRoot + '#profile">You are here</a>';
    }
      
    map.addMap(Lablz.cloudMadeApiKey, {maxZoom: poi ? 10 : null, center: center, bounds: bbox}, poi);    
    var clusterStyle = {singleMarkerMode: true, doScale: false, showCount: true, doSpiderfy: false};
    var style = {doCluster: true, highlight: true, zoom: false};
    var name = this.model.shortName;
    map.addGeoJsonPoints({name: gj}, null, clusterStyle, null, style);
    map.addSizeButton(this.$el[0]);
    map.addReZoomButton(bbox);
    var basicInfo = map.addBasicMapInfo(this.model.shortName + 's');
    Lablz.Events.trigger('mapReady', this.model);
//    $('body').append(this.$el);
    console.log('render map');
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
    Lablz.Events.on("mapReady", this.showMapButton);
    this.template = _.template(Lablz.Templates.get('resource-list'));
  },
  events: {
    'tap': 'tap',
    'click #mapIt': 'mapIt',
    'click': 'click',
    'click #nextPage': 'nextPage',
    'click #aroundMe': 'aroundMe'
  },
  nextPage: function(e) {
    Lablz.Events.trigger('nextPage', this.model);    
  },
  aroundMe: function(e) {
    Lablz.Events.trigger('aroundMe', this.model);    
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
    
    this.listView.$el.trigger('create');
//    this.listView.refresh();
//    this.listView.refresh();
//    var self = this;
//    setTimeout(function() {self.listView.refresh()}, 0);
    return this;
  }
});

Lablz.ViewPage = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'render', 'tap', 'mapIt', 'showMapButton', 'aroundMe');
    this.model.on('change', this.render, this);
    this.template = _.template(Lablz.Templates.get('resource'));
    Lablz.Events.on("mapReady", this.showMapButton);
  },
  events: {
    'tap': 'tap',
    'click #mapIt': 'mapIt',
    'click': 'click',
    'click #aroundMe': 'aroundMe'
  },
  aroundMe: function(e) {
    Lablz.Events.trigger('aroundMe', this.model);    
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
    changedViews: [],
    initialize:function () {
      _.bindAll(this, 'render', 'fetchMap', 'tap', 'swipe', 'checkScroll', 'getNextPage', 'getAroundMe', 'renderMany', 'renderOne', 'refresh', 'changed'); // fixes loss of context for 'this' within methods
      Lablz.Events.on('nextPage', this.getNextPage);
      Lablz.Events.on('aroundMe', this.getAroundMe);
      this.model.on('refresh', this.refresh, this);
      this.model.on('add', this.renderOne, this);
      this.model.on('reset', this.render, this);
//      this.$el.on('create', this.refresh);
      var self = this;
      if (this.model.isA("Locatable") || this.model.isA("Shape"))
        this.fetchMap();
      
      return this;
    },
    getAroundMe: function() {
      this.model.getAroundMe();
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
        this.getNextPage();
      }
      
      return this;
    },
//    mapIt: function(e) {
//      e.preventDefault();
//      Lablz.Events.trigger("mapIt", this.model);
//    },
    tap: Lablz.Events.defaultTapHandler,
    click: Lablz.Events.defaultClickHandler,  
    swipe: function(e) {
      console.log("swipe");
    },
    refresh: function() {
      var self = this;
//      _.forEach(this.changedViews, function(view) {
//        view.unbind();
//        view.remove();
//        view.render();
//        view = new Lablz.ResourceListItemView({model:view.model});
//        view.render();
//        self.$el.append(view.render().el);
//      });
      
      this.$el.listview();
      this.$el.listview('refresh');
      this.$el.parentNode && this.$el.parentNode.page();
      
//      e ? this.$el.listview('refresh') : this.$el.trigger('create');
//      var self = this;
//      setTimeout(function() {self.$el.listview()}, 0);
//      this.$el.trigger('create');
//      this.$el.listview('refresh');
//      this.$el.page();
//      this.$el.html().page();
    },
    changed: function(view) {
      this.changedViews.push(view);
    },
    renderOne: function(model) {
      var liView = new Lablz.ResourceListItemView({model:model});
      liView.on('change', this.changed);
      this.$el.append(liView.render().el);
    },
    renderMany: function(models, init) {
      if (models instanceof Backbone.Model) // one model
        this.renderOne(models);
      else {
        var self = this;
        var frag = document.createDocumentFragment();
        _.forEach(models, function(model) {
          var liView = new Lablz.ResourceListItemView({model:model});
          liView.on('change', self.changed);
          frag.appendChild(liView.render().el);
        });
        
        this.$el.append(frag);
      }
    },
    render: function(e) {
      console.log("render listView");
  		this.renderMany(this.model.models, true);
  		e && this.refresh(e);
  		
//  		var mapBtnElt = this.$('mapIt');
//  		if (mapBtnElt) {
//  		  this.mapItBtn = new MapItButtonView({el: this.$('mapIt')});
//  		}
  		
      this.rendered = true;
  		return this;
    },
    fetchMap: function() {
//      this.mapModel = new Lablz.MapModel({model: this.model});
//      mapView = new Lablz.MapView({mapDivId: 'listMap', model: this.mapModel});
      mapView = new Lablz.MapView({mapDivId: 'listMap', model: this.model});
//      this.mapModel.fetch({success: 
//        function() {
//          $('body').append($(mapView.render().el));
      setTimeout(mapView.render, 100);
//        }
//      });
    }
});

Lablz.ResourceListItemView = Backbone.View.extend({
  tagName:"li",
  
	initialize: function(options) {
    _.bindAll(this, 'render', 'tap', 'changed'); // fixes loss of context for 'this' within methods
		this.template = _.template(Lablz.Templates.get('listItemTemplate'));
//    this.model.on('change', this.changed, this);
    this.model.on('change', this.changed, this);
    this.parentView = options && options.parentView;
		return this;
	},
  events: {
    'tap': 'tap',
    'click': 'click'
  },
  changed: function() {
    this.render.apply(this, arguments);
    this.trigger('change', this);
  },
  tap: Lablz.Events.defaultTapHandler,
  click: Lablz.Events.defaultClickHandler,  
  render: function(event) {
//    var exists = !!this.$el.html();
//    var parent = exists && this.$el.parentNode;
//    exists && this.$el.remove();
      
    this.$el.html(this.template(this.model.toJSON()));
//    exists && parent.append(this.$el);
    return this;
  }
});
