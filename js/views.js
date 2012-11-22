// Events //
Lablz.Events = _.extend({}, Backbone.Events);
Lablz.Events.defaultTapHandler = function(e) {
//  console.log("got tap event");
  var event = e.originalEvent;
  var el = event.target;
  var $el = $(el);
  if ($el.prop('tagName') != 'A')
    return true;
  
  event.preventDefault();
  var href = $el.prop('href');
  app.navigate(href.slice(href.indexOf('#') + 1), true);
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
  app.navigate(href.slice(href.indexOf('#') + 1), true);
}

// Views
Lablz.ResourceView = Backbone.View.extend({
  initialize: function(options) {
    _.bindAll(this, 'render', 'tap'); // fixes loss of context for 'this' within methods
    this.propRowTemplate = _.template(Lablz.Templates.get('propRowTemplate'));
    this.propGroupsDividerTemplate = _.template(Lablz.Templates.get('propGroupsDividerTemplate'));
    this.model.on('change', this.render, this);
    return this;
  },
  events: {
    'click': 'click',
    'tap': 'tap',
  },
  tap: Lablz.Events.defaultTapHandler,  
  click: Lablz.Events.defaultClickHandler,
  render: function(eventName) {
    console.log("render resource");
    var type = this.model.type;
    var meta = this.model.__proto__.constructor.properties;
    meta = meta || this.model.properties;
    if (!meta)
      return this;
    
    var list = _.toArray(meta);
    var propGroups = Utils.getPropertiesWith(list, "propertyGroupList");
    var backlinks = Utils.getPropertiesWith(list, "backLink");
    var backlinksWithCount = backlinks ? Utils.getPropertiesWith(backlinks, "count") : null;
    
    var gridColsStr = this.model.constructor.gridCols;
    gridCols = gridColsStr ? gridColsStr.replace(' ', '').split(',') : null;
  
    var json = this.model.toJSON();
    if (gridCols) {
      var gridColsCount;
      for (var i=0; i<gridCols.length; i++) {
        var p = gridCols[i].trim();
        if (p == 'DAV:displayname')
          p = 'displayName';
        if (!_.has(json, p))
          continue;
        gridColsCount++;
      }
//      if (gridColsCount != 0) {
//        this.gridColsView = new Lablz.GridColsView({model: this.model, el: this.$('#gridColsHolder', this.el)});
//        gridColsView.render();
//      }
    }
    if (Utils.isA(this.model.constructor, 'ImageResource')) {
      var propVal = json['featured'] || json['mediumImage'];
      if (typeof propVal != 'undefined') {
        if (propVal.indexOf('Image') == 0)
          propVal = propVal.slice(6);
        var iTemplate = _.template(Lablz.Templates.get('imagePT'));
        this.$('#resourceImage').html(iTemplate({value: propVal}));
      }
    }
    
    var html = "";

    var displayedProps = [];
    var idx = 0;
    var groupNameDisplayed;
    if (propGroups) {
      for (var i=0; i < propGroups.length; i++) {
        var grMeta = propGroups[i];
        var pgName = grMeta["displayName"];
        var props = grMeta["propertyGroupList"].split(",");
        groupNameDisplayed = false;
        for (var j = 0; j < props.length; j++) {
          var p = props[j].trim();
          if (!_.has(json, p) || _.contains(backlinks, p))
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
          if (!Utils.isPropVisible(json, prop))
            continue;

          displayedProps[idx++] = p;
          json[p] = Utils.makeProp(prop, json[p]);
          if (!groupNameDisplayed) {
            html += this.propGroupsDividerTemplate({value: pgName});
            groupNameDisplayed = true;
          }
          
          html += this.propRowTemplate(json[p]);
        }
      }
    }
    groupNameDisplayed = false;
    for (var p in json) {
      if (!_.has(json, p) || (displayedProps  &&  _.contains(displayedProps, p)) ||  _.contains(backlinks, p))
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
      if (!Utils.isPropVisible(json, prop))
        continue;

      if (displayedProps.length  &&  !groupNameDisplayed) {
        html += '<li data-role="collapsible" data-content-theme="c" id="other"><h2>Other</h2><ul data-role="listview">'; 
        groupNameDisplayed = true;
      }
      
      json[p] = Utils.makeProp(prop, json[p]);
      html += this.propRowTemplate(json[p]);
    }
    if (displayedProps.length  &&  groupNameDisplayed)
      html += "</ul></li>";
    
//    var j = {"props": json};
    this.$el.html(html);
    var self = this;

    this.rendered = true;
    return this;
  }
});

//Lablz.ResourceEditView = Backbone.View.extend({
//  initialize: function(options) {
//    _.bindAll(this, 'render', 'tap', 'save', 'cancel'); // fixes loss of context for 'this' within methods
//    this.propRowTemplate = _.template(Lablz.Templates.get('propRowTemplate'));
//    this.propGroupsDividerTemplate = _.template(Lablz.Templates.get('propGroupsDividerTemplate'));
//    this.model.on('change', this.render, this);
//    return this;
//  },
//  events: {
//    'click #save': 'save',
//    'click #cancel': 'cancel',
//    'click': 'click',
//    'tap': 'tap',
//  },
//  save: function() {
//    
//  },
//  cancel: function() {
//    e.preventDefault();
//    Backbone.history.navigate('view/' + encodeURIComponent(this.model.get('_uri')), {trigger: true, replace: true});
//    return this;    
//  },
//  tap: Lablz.Events.defaultTapHandler,  
//  click: Lablz.Events.defaultClickHandler,  
//  render:function (eventName) {
//    console.log("render resource edit");
//    var type = this.model.type;
//    var meta = this.model.__proto__.constructor.properties;
//    meta = meta || this.model.properties;
//    if (!meta)
//      return this;
//    
//    var list = _.toArray(meta);
//    var propGroups = Utils.getPropertiesWith(list, "propertyGroupList");
//    var backlinks = Utils.getPropertiesWith(list, "backLink");
//    var backlinksWithCount = backlinks ? Utils.getPropertiesWith(backlinks, "count") : null;
//    
//    var html = "";
//    var json = this.model.toJSON();
//
//    var displayedProps = [];
//    var idx = 0;
//    var groupNameDisplayed;
//    if (propGroups) {
//      for (var i=0; i < propGroups.length; i++) {
//        var grMeta = propGroups[i];
//        var pgName = grMeta["displayName"];
//        var props = grMeta["propertyGroupList"].split(",");
//        groupNameDisplayed = false;
//        for (var j = 0; j < props.length; j++) {
//          var p = props[j].trim();
//          if (!_.has(json, p) || _.contains(backlinks, p))
//            continue;
//          var prop = meta[p];
//          if (!prop) {
//            delete json[p];
//            continue;
//          }
//                
//          if (p.charAt(0) == '_')
//            continue;
//          if (p == 'davDisplayName')
//            continue;
//          if (!Utils.isPropVisible(json, prop))
//            continue;
//
//          displayedProps[idx++] = prop;
//          json[p] = Utils.makePropEdit(prop, json[p]);
//          if (!groupNameDisplayed) {
//            html += this.propGroupsDividerTemplate({value: pgName});
//            groupNameDisplayed = true;
//          }
//          
//          html += this.propRowTemplate(json[p]);
//        }
//      }
//    }
//    
//    groupNameDisplayed = false;
//    for (var p in json) {
//      if ((displayedProps  &&  _.contains(displayedProps, meta[p])) ||  _.contains(backlinks, p))
//        continue;
//      
//      var prop = meta[p];
//      if (!prop) {
//        delete json[p];
//        continue;
//      }
//            
//      if (p.charAt(0) == '_')
//        continue;
//      if (p == 'davDisplayName')
//        continue;
//      if (!Utils.isPropVisible(json, prop))
//        continue;
//
//      if (displayedProps.length  &&  !groupNameDisplayed) {
//        html += '<li data-role="collapsible" data-content-theme="c" style="padding:0;border:0;border-collapse:collapse"><h2>Others</h2><ul data-role="listview">'; 
//        groupNameDisplayed = true;
//      }
//      
//      json[p] = Utils.makePropEdit(prop, json[p]);
//      html += this.propRowTemplate(json[p]);
//    }
//    if (displayedProps.length  &&  groupNameDisplayed)
//      html += "</ul></li>";
//    
//    this.$el.html(html);
//    var self = this;
//
//    this.rendered = true;
//    return this;
//  }
//});

Lablz.MapView = Backbone.View.extend({
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
    if (!gj || !_.size(gj))
      return;
    
    var bbox = metadata.bbox;
    var center = Utils.getCenterLatLon(bbox);
    
    var pMap = Utils.getHashParams();
    var poi = pMap['-item'];
    var isMe = poi == 'me';
    var latLon; 
    if (poi) {
      coords = [pMap.longitude, pMap.latitude];
      center = [coords[1], coords[0]];
      poi = Utils.getBasicGeoJSON('Point', coords);
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
});

Lablz.LoginButtons = Backbone.View.extend({
  template: 'loginTemplate',
  initialize: function(options) {
    _.bindAll(this, 'render');
    this.template = _.template(Lablz.Templates.get(this.template));    
    return this;
  },
  render: function(options) {
    if (typeof options !== 'undefined' && options.append)
      this.$el.append(this.template());
    else
      this.$el.html(this.template());
    
    _.each(this.$('a'), function(a) {
      if (a.href) {
        var base = a.href.split('?');
        base = base[0];
        var q = Utils.getQueryParams(a.href);
        var param = q.state ? 'state' : 'redirect_uri';
        var returnUri = U.getQueryParams(q[param]).returnUri;
        if (!returnUri) {
          q[param] = U.replaceParam(q[param], 'returnUri', window.location.href, true);
          $(a).attr('href', base + '?' + U.getQueryString(q));
        }
      }
    });
    
    return this;
  }
});

Lablz.ListPage = Backbone.View.extend({
  template: 'resource-list',
  initialize:function () {
    _.bindAll(this, 'render', 'tap', 'showMapButton', 'nextPage', 'click');
    Lablz.Events.on("mapReady", this.showMapButton);
    this.template = _.template(Lablz.Templates.get(this.template));
//    if (this.model.isA("Locatable") || this.model.isA("Shape"))
//      this.mapView = new Lablz.MapView({model: this.model, el: this.$('#mapHolder', this.el)});
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
      left: [Lablz.LoginButtons],
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
//    if (this.mapView)
    if (isGeo) {
      this.mapView = new Lablz.MapView({model: this.model, el: this.$('#mapHolder', this.el)});
      var self = this;
      setTimeout(self.mapView.render, 100);
    }
    
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
    _.bindAll(this, 'render', 'tap', 'showMapButton', 'click', 'edit');
    this.model.on('change', this.render, this);
    this.template = _.template(Lablz.Templates.get('resource'));
    Lablz.Events.on("mapReady", this.showMapButton);
  },
  events: {
    'click #edit': 'edit',
    'tap': 'tap',
    'click': 'click',
  },
  edit: function(e) {
    e.preventDefault();
    app.navigate('view/' + encodeURIComponent(this.model.get('_uri')) + "?-edit=y", {trigger: true, replace: true});
    return this;
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

//Lablz.EditPage = Backbone.View.extend({
//  initialize: function() {
//    _.bindAll(this, 'render', 'tap', 'click');
//    this.model.on('change', this.render, this);
//    this.template = _.template(Lablz.Templates.get('resourceEdit'));
//  },
//  events: {
//    'tap': 'tap',
//    'click': 'click',
//  },
//  tap: Lablz.Events.defaultTapHandler,
//  click: Lablz.Events.defaultClickHandler,  
//  render:function (eventName) {
//    console.log("render editPage");
//    this.$el.html(this.template(this.model.toJSON()));
//    this.view = new Lablz.ResourceEditView({el: $('ul#resourceEditView', this.el), model: this.model});
//    this.view.render();
//    this.rendered = true;
//    if (!this.$el.parentNode) 
//      $('body').append(this.$el);
//    
//    return this;
//  }
//
//});

Lablz.ResourceListView = Backbone.View.extend({
  mapView: null,
  mapModel: null,
  page: 1,
  changedViews: [],
  initialize:function () {
    _.bindAll(this, 'render', 'tap', 'swipe', 'checkScroll', 'getNextPage', 'renderMany', 'renderOne', 'refresh', 'changed'); // fixes loss of context for 'this' within methods
    Lablz.Events.on('nextPage', this.getNextPage);
    this.model.on('refresh', this.refresh, this);
    this.model.on('add', this.renderOne, this);
    this.model.on('reset', this.render, this);
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
    this.$el.listview();
    this.$el.listview('refresh');
    this.$el.parentNode && this.$el.parentNode.page();
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

Lablz.ToggleButton = Backbone.View.extend({
  btnId: null,
  initialize: function(options) {
    _.bindAll(this, 'setStyle', 'resetStyle');
    this.active = (options && options.active) || (this.isActive && this.isActive());
//    this.on('click', this.onclick);
//    var eName = 'click #' + this.btnId;
//    this.originalOnclick = this.events[eName];
//    this.events[eName] = 'onclick';
    Lablz.Events.on("changePage", this.resetStyle);
  },
//  onclick: function(e) {
//    console.log('clicked toggle button');
//    return true;
//    if (this.originalOnclick)
//      return this[this.originalOnclick].apply(this, arguments);
//    else
//      return this;
//  },
  isActive: function() {
    return this.active;
  },
  resetStyle: function() {
    this.active = this.isActive();
    this.setStyle();
    return this;
  },
  setStyle: function() {
    if (!this.btnId) {
      console.log("Toggle button is missing btnId property");
      return this;
    }
    
    this.$('#' + this.btnId)[this.active ? 'addClass' : 'removeClass']('ui-btn-active');
  },
  render: function(options) {
    if (!this.template)
      return this;
    
    if (typeof options !== 'undefined' && options.append)
      this.$el.append(this.template());
    else
      this.$el.html(this.template());
    
    this.resetStyle();
    return this;
  }
});

Lablz.MapItButton = Lablz.ToggleButton.extend({
  btnId: 'mapIt',
  template: 'mapItButtonTemplate',
  events: {
    'click #mapIt': 'mapIt'
  },
  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    
    _.bindAll(this, 'render', 'mapIt');
    this.template = _.template(Lablz.Templates.get(this.template));
    return this;
  },
  mapIt: function(e) {
    this.active = !this.active;
    Lablz.Events.trigger('mapIt', {active: this.active});
    this.resetStyle();
    return this;
  }
});


Lablz.AroundMeButton = Lablz.ToggleButton.extend({
  btnId: 'aroundMe',
  template: 'aroundMeButtonTemplate',
  events: {
    'click #aroundMe': 'toggleAroundMe'
  },
  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    
    _.bindAll(this, 'render', 'toggleAroundMe');
    this.template = _.template(Lablz.Templates.get(this.template));        
    return this;
  },
  isActive: function() {
    return window.location.hash.indexOf('-item=me') != -1;
  },
  toggleAroundMe : function() {
    this.active = !this.active;
    if (!this.active) {
      app.navigate(this.model.shortName, {trigger: true});
      return this;
    }
    
    if (!navigator.geolocation) {
      alert("Sorry, your browser does not support geolocation services.");
      return this;
    }
      
    var model = this.model instanceof Backbone.Collection ? this.model.model : this.model.constructor;
    var iFaces = model.interfaces;
    if (!_.contains(iFaces, 'Locatable'))
      return this;
    
//    if (!props.distance || !props.latitude || !props.longitude)
//      return;
    
    var self = this;
    navigator.geolocation.getCurrentPosition(
      function(position) {
        return self.fetchAroundPosition(position.coords);
      },
      function(error) {
        var lastLocTime = Lablz.userLocation.timestamp;
        if (lastLocTime && new Date().getTime() - lastLocTime < 1000)
          self.fetchAroundPosition(Lablz.userLocation.location);
        else
          Lablz.locationError(error);
      }
    );
    
    return this;
  },
  fetchAroundPosition : function(coords, item) {
    var model = this.model instanceof Backbone.Collection ? this.model.model : this.model.constructor;
    Lablz.userLocation = {
      location: coords,
      timestamp: new Date().getTime()
    };
    
    app.navigate(model.shortName + "?$orderBy=distance&$asc=1&latitude=" + coords.latitude + "&longitude=" + coords.longitude + '&-item=' + (item || 'me'), {trigger: true});
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
//    w = new w({model: this.model}).render();
//    this.$(options.id).append(w.el);
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
    l && this.makeWidgets(l, {domEl: 'a', id: '#headerLeft'}); //, css: 'ui-btn-left'});
    var r = this.buttons.right;
    r && this.makeWidgets(r, {domEl: 'a', id: '#headerRight'}); //, css: 'ui-btn-right'});
    return this;
  }
});
