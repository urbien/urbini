// needs Lablz.homePage

define([
  'jquery',
  'backbone',
  'underscore',
  'utils',
  'events',
  'templates',
  'views/ResourceListView',
  'views/MapView',
  'views/Header',
  'views/BackButton',
  'views/LoginButtons',
  'views/AroundMeButton',
  'views/MapItButton',
  'jqueryMobile'
], function($, Backbone, _, U, Events, Templates, ResourceListView, MapView, Header, BackButton, LoginButtons, AroundMeButton, MapItButton) {
  return Backbone.View.extend( {
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
      this.listView.visible = this.visible;
    },
    home: function() {
      app.navigate(Lablz.homePage, {trigger: true, replace: false});
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
        left: [BackButton, LoginButtons],
        right: isGeo ? [MapItButton, AroundMeButton] : null
      };
      
      this.header = new Header({
        model: this.model, 
        pageTitle: this.model.model.displayName, 
        buttons: this.buttons,
        el: $('#headerDiv', this.el)
      }).render();
  
      var type = this.model.type;
      var cmpStr = '/changeHistory/Modification';
      var isModification = type.indexOf(cmpStr) == type.length - cmpStr.length;
      var containerTag = isModification ? '#nabs_grid' : 'ul';
      this.listView = new ResourceListView({el: $(containerTag, this.el), model: this.model});
      this.listView.render();
      if (isGeo) {
        this.mapView = new MapView({model: this.model, el: this.$('#mapHolder', this.el)});
        var self = this;
        setTimeout(self.mapView.render, 100);
      }
      
      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
      this.rendered = true;
      return this;
    }
  });
});
