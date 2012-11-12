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
  initialize: function(options) {
    _.bindAll(this, 'render', 'tap', 'fetchMap'); // fixes loss of context for 'this' within methods
    this.propRowTemplate = _.template(Lablz.Templates.get('propRowTemplate'));
    this.model.on('change', this.render, this);
    Lablz.Events.on('aroundMe', this.getAroundMe);
    return this;
  },
  events: {
    'click': 'click',
    'tap': 'tap',
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
//    this.mapModel = new Lablz.MapModel({model: this.model});
//    mapView = new Lablz.MapView({model: this.mapModel});
//    this.mapModel.fetch({success: 
//      function() {
//        $('body').append($(mapView.render().el));
//        mapView.render();
//      }
//    });
  }
});

Lablz.MapView = Backbone.View.extend({
//  template: 'mapTemplate',
  initialize: function (options) {
    _.bindAll(this, 'render', 'show', 'hide', 'tap', 'toggleMap');
    Lablz.Events.on("mapIt", this.toggleMap);    
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
          Lablz.MapView.prototype.render.call(self, eventName);
        }
      , 100);
      
      return this;
    }
    
    var m = this.model;
    m = m instanceof Backbone.Collection ? m.model : m.constructor;
    if (Utils.isA(m, "Shape")) {
      this.remove();
      return this;
    }
    
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
      if (poi == 'me') {
        poi.properties.name = 'Your location';
        poi.properties.html = '<a href="' + Lablz.pageRoot + '#profile">You are here</a>';
      }
    }
      
//    this.$el.html(this.template());

//    var frag = document.createDocumentFragment();
    var div = document.createElement('div');
    div.className = 'map';
    div.id = 'map';
    div.innerHTML = '<h2>HELLLLLLLLLLLLLLLLLLLLO</h2>';

    var map = new Lablz.Leaflet(div);
    map.addMap(Lablz.cloudMadeApiKey, {maxZoom: poi ? 10 : null, center: center, bounds: bbox}, poi);    
    var clusterStyle = {singleMarkerMode: true, doScale: false, showCount: true, doSpiderfy: false};
    var style = {doCluster: true, highlight: true, zoom: false};
    var name = self.model.shortName;
    map.addGeoJsonPoints({name: gj}, null, clusterStyle, null, style);
    map.addSizeButton(this.$el[0]);
    map.addReZoomButton(bbox);
    var dName = self.model.displayName;
    dName = dName.endsWith('s') ? dName : dName + 's';
    var basicInfo = map.addBasicMapInfo(dName);
    Lablz.Events.trigger('mapReady', this.model);
//    $('body').append(this.$el);
    console.log('render map');

    var frag = document.createDocumentFragment();
    frag.appendChild(div);
    this.$el.html(frag);
//    this.$el.trigger('create');
//    if (!this.$el.parentNode) 
//      $('body').append(this.$el);    
    
//    setTimeout(function(){self.$el.addClass('map');}, 100);
    
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
  template: 'resource-list',
  initialize:function () {
    _.bindAll(this, 'render', 'tap', 'showMapButton', 'nextPage', 'click');
    Lablz.Events.on("mapReady", this.showMapButton);
    this.template = _.template(Lablz.Templates.get(this.template));
  },
  events: {
    'tap': 'tap',
    'click': 'click',
    'click #nextPage': 'nextPage',
  },
  nextPage: function(e) {
    Lablz.Events.trigger('nextPage', this.model);    
  },
  showMapButton: function(e) {
//    var mBtn = new Lablz.MapItButton({model: this.model, el: this.header.$('#headerRight')}).render();
//    this.buttons.right.push(mBtn);
//    this.header.render();
//    this.header.makeWidget(mBtn);
//    this.header.$el.trigger('create');
  },
  tap: Lablz.Events.defaultTapHandler,
  click: Lablz.Events.defaultClickHandler,  
  render:function (eventName) {
    console.log("render listPage");
        
    this.$el.html(this.template(this.model.toJSON()));
    var isGeo = this.model.isA("Locatable") || this.model.isA("Shape");
    this.buttons = {
      left: [Lablz.BackButton],
      right: isGeo ? [Lablz.MapItButton, Lablz.AroundMeButton] : null
    };
    
    this.header = new Lablz.Header({
      model: this.model, 
      pageTitle: this.model.model.displayName, 
      buttons: this.buttons,
      el: $('#headerDiv', this.el)
    }).render();
    
    this.listView = new Lablz.ResourceListView({el: $('ul', this.el), model: this.model});
    this.listView.render();
    
//    this.header.$el.trigger('create');    
    this.listView.$el.trigger('create');
    
    if (!this.$el.parentNode) 
      $('body').append(this.$el);
    
    this.rendered = true;
    return this;
  }
});

Lablz.ViewPage = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'render', 'tap', 'showMapButton', 'click');
    this.model.on('change', this.render, this);
    this.template = _.template(Lablz.Templates.get('resource'));
    Lablz.Events.on("mapReady", this.showMapButton);
  },
  events: {
    'tap': 'tap',
    'click': 'click',
  },
  showMapButton: function(e) {
//    var mBtn = new Lablz.MapItButton({model: this.model}).render();
//    this.buttons.right.push(mBtn);
//    this.header.render();
  },
  tap: Lablz.Events.defaultTapHandler,
  click: Lablz.Events.defaultClickHandler,  
  render:function (eventName) {
    console.log("render viewPage");
    this.$el.html(this.template(this.model.toJSON()));
    
    var isGeo = this.model.isA("Locatable") || this.model.isA("Shape");
    this.buttons = {
        left: [Lablz.BackButton],
        right: isGeo ? [Lablz.AroundMeButton] : null,
    };
    
    this.header = new Lablz.Header({
      model: this.model, 
      pageTitle: this.model.get('davDisplayName'), 
      buttons: this.buttons,
      el: $('#headerDiv', this.el)
    }).render();
    
    this.header.$el.trigger('create');
    
    this.view = new Lablz.ResourceView({el: $('ul#resourceView', this.el), model: this.model});
    this.view.render();
    this.rendered = true;
    if (!this.$el.parentNode) 
      $('body').append(this.$el);
    
    return this;
  }

});

Lablz.ResourceListView = Backbone.View.extend({
  mapView: null,
  mapModel: null,
  page: 1,
  changedViews: [],
  initialize:function () {
    _.bindAll(this, 'render', 'fetchMap', 'tap', 'swipe', 'checkScroll', 'getNextPage', 'renderMany', 'renderOne', 'refresh', 'changed'); // fixes loss of context for 'this' within methods
    Lablz.Events.on('nextPage', this.getNextPage);
    this.model.on('refresh', this.refresh, this);
    this.model.on('add', this.renderOne, this);
    this.model.on('reset', this.render, this);
//      this.$el.on('create', this.refresh);
    var self = this;
    if (this.model.isA("Locatable") || this.model.isA("Shape"))
      this.fetchMap();
    
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
      this.getNextPage();
    }
    
    return this;
  },
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
    return this;
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
    
    return this;
  },
  render: function(e) {
    console.log("render listView");
		this.renderMany(this.model.models, true);
		e && this.refresh(e);
		
    this.rendered = true;
		return this;
  },
  fetchMap: function() {
//      this.mapModel = new Lablz.MapModel({model: this.model});
//      mapView = new Lablz.MapView({model: this.mapModel});
    this.mapView = new Lablz.MapView({model: this.model, el: this.$('#mapHolder')});
//      this.mapModel.fetch({success: 
//        function() {
//          $('body').append($(mapView.render().el));
    setTimeout(this.mapView.render, 100);
//        }
//      });
    return this;
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
    return this;
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


Lablz.MapItButton = Backbone.View.extend({
  template: 'mapItButtonTemplate',
  events: {
    'click': 'mapIt'
  },
  initialize: function(options) {
    _.bindAll(this, 'render', 'mapIt');
    this.template = _.template(Lablz.Templates.get(this.template));
    return this;
  },
  mapIt: function(e) {
//    Lablz.Events.trigger("mapIt", this.model);
    this.model.trigger('mapIt');
    return this;
  },
  render: function(options) {
    if (options.append)
      this.$el.html(this.$el.html() + this.template());
    else
      this.$el.html(this.template());
    
    return this;
  }
});


Lablz.AroundMeButton = Backbone.View.extend({
  template: 'aroundMeButtonTemplate',
  events: {
    'click #aroundMe': 'aroundMe'
  },
  initialize: function(options) {
    _.bindAll(this, 'render', 'aroundMe');
    this.template = _.template(Lablz.Templates.get(this.template));
    return this;
  },
  aroundMe: function(e) {
//    console.log("clicked aroundMe button");
//    Lablz.Events.trigger("aroundMe", this.model);
    this.model.trigger('aroundMe');
    return this;
  },
  render: function() {
    this.$el.html(this.template());
    return this;
  }
});

Lablz.BackButton = Backbone.View.extend({
  template: 'backButtonTemplate',
  events: {
    'click': 'back'
  },
  initialize: function(options) {
    _.bindAll(this, 'render', 'back');
    this.template = _.template(Lablz.Templates.get(this.template));
    return this;
  },
  back: function(e) {
    e.preventDefault();
    App.backClicked = true;
    window.history.back();
    return this;
  },
  render: function() {
    this.$el.html(this.template());
    return this;
  }
});

Lablz.Header = Backbone.View.extend({
  template: 'headerTemplate',
  initialize: function(options) {
    _.bindAll(this, 'render', 'makeWidget', 'makeWidgets');
    _.extend(this, options);
    this.template = _.template(Lablz.Templates.get(this.template));
    return this;
  },
//  events: {
//    'click': 'clickButton',
//  },
//  clickButton: function(e) {
//    e.preventDefault();
//    console.log("clicked button: " + e);
//    return this;
//  },
  makeWidget: function(options) {
    var w = options.widget;
    if (typeof w != 'function') {
      w.render({append: true});
      return;
    }
    
    w = new w({model: this.model, el: this.$(options.id)}).render({append: true});
    w.$(options.domEl).addClass(options.css);
    w.$el.trigger('create');
    return this;
  },
  makeWidgets: function(wdgts, options) {
    for (var i = 0; i < wdgts.length; i++) {
      options.widget = wdgts[i];
      this.makeWidget(options);
    }
    
    return this;
  },
  render: function() {
    this.$el.html(this.template());
    var l = this.buttons.left;
    l && this.makeWidgets(l, {domEl: 'a', id: '#headerLeft', css: 'ui-btn-left'});
    var r = this.buttons.right;
    r && this.makeWidgets(r, {domEl: 'a', id: '#headerRight', css: 'ui-btn-right'});
    return this;
  }
});
