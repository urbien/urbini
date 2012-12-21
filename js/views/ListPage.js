define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!events', 
  'cache!utils',
  'cache!modelsBase',
  'cache!views/ResourceListView', 
//  'cache!views/MapView',
  'cache!views/Header', 
  'cache!views/BackButton', 
  'cache!views/LoginButtons', 
  'cache!views/AroundMeButton', 
  'cache!views/MapItButton'
], function(G, $, __jqm__, _, Backbone, Templates, Events, U, MB, ResourceListView, /*MapView,*/ Header, BackButton, LoginButtons, AroundMeButton, MapItButton) {
  var MapView;
  return Backbone.View.extend({
    template: 'resource-list',
    initialize: function () {
      _.bindAll(this, 'render', 'tap', 'click', 'home', 'pageChanged');
      Events.on('changePage', this.pageChanged);
      this.template = _.template(Templates.get(this.template));
    },
    events: {
      'tap': 'tap',
      'click': 'click',
      'click #nextPage': 'getNextPage',
      'click #homeBtn': 'home'
    },
    pageChanged: function(view) {
      this.visible = (this == view || this.listView == view);
      this.listView && (this.listView.visible = this.visible);
    },
    home: function() {
      app.navigate(G.homePage, {trigger: true, replace: false});
      return this;
    },
    getNextPage: function() {
      if (!this.visible)
        return;
      
      this.listView && this.listView.getNextPage();
    },
  //  nextPage: function(e) {
  //    Events.trigger('nextPage', this.model);    
  //  },
    tap: Events.defaultTapHandler,
    click: Events.defaultClickHandler,  
    render:function (eventName) {
      console.log("render listPage");
  
      this.$el.html(this.template(this.model.toJSON()));
      
      var isGeo = (this.model.isA("Locatable") || this.model.isA("Shape")) && _.filter(this.model.models, function(m) {return m.get('latitude') || m.get('shapeJson')}).length;
      this.buttons = {
        left: [BackButton], // , LoginButtons
        right: isGeo ? [MapItButton, AroundMeButton] : null,
        log: [LoginButtons]    
      };
      
      this.header = new Header({
        model: this.model, 
        pageTitle: this.model.model.displayName, 
        buttons: this.buttons,
        el: $('#headerDiv', this.el)
      }).render();
  
      var models = this.model.models;
      var isModification = U.isAssignableFrom(models[0].constructor, 'Modification', MB.typeToModel);

      var meta = models[0].__proto__.constructor.properties;
      meta = meta || models[0].properties;

      var viewMode = models[0].constructor['viewMode'];
      var isList = (typeof viewMode != 'undefined'  &&  viewMode == 'List');
      var isMasonry = !isList && U.isA(models[0].constructor, 'ImageResource')  &&  (U.getCloneOf(meta, 'ImageResource.mediumImage').length > 0 || U.getCloneOf(meta, 'ImageResource.bigMediumImage').length > 0  ||  U.getCloneOf(meta, 'ImageResource.bigImage').length > 0);
//      var isModification = type.indexOf(cmpStr) == type.length - cmpStr.length;
      var containerTag = isModification || isMasonry ? '#nabs_grid' : 'ul';
      this.listView = new ResourceListView({el: $(containerTag, this.el), model: this.model});
      this.listView.render();
      if (isGeo) {
        var self = this;
        require(['cache!views/MapView'], function(MV) {
          MapView = MV;
          self.mapView = new MapView({model: self.model, el: self.$('#mapHolder', self.el)});
          self.mapView.render();
        });
      }
      
      this.$el.live('swipeleft swiperight', function(event) {
//        console.log(event.type);
        var hash = window.location.hash.slice(1);
        if (event.type == "swipeleft") {
        }
        if (event.type == "swiperight") {
          // open menu
          Backbone.history.navigate('menu/' + encodeURIComponent(hash), {trigger: true, replace: false});
        }
      });

      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
      this.rendered = true;
      return this;
    }
  });
});
