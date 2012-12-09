// needs Lablz.homePage

define([
  'cache!jquery', 
  'cache!jqmConfig', 
  'jqueryMobile' 
  'cache!underscore', 
  'cache!backbone', 
  'cache!utils',
  'cache!events', 
  'cache!templates',
  'cache!modelsBase',
  'cache!views/ResourceListView', 
  'cache!views/Header', 
  'cache!views/BackButton', 
  'cache!views/LoginButtons', 
  'cache!views/AroundMeButton', 
  'cache!views/MapItButton' 
], function($, __jqm__, __jqmConfig__, _, Backbone, U, Events, Templates, MB, ResourceListView, /*MapView,*/ Header, BackButton, LoginButtons, AroundMeButton, MapItButton) {
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
      this.listView && (this.listView.visible = this.visible);
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
      var isModification = U.isAssignableFrom(this.model.models[0].constructor, 'Modification', MB.typeToModel);
//      var isModification = type.indexOf(cmpStr) == type.length - cmpStr.length;
      var containerTag = isModification ? '#nabs_grid' : 'ul';
      this.listView = new ResourceListView({el: $(containerTag, this.el), model: this.model});
      this.listView.render();
      if (isGeo) {
        var self = this;
        require(['cache!views/MapView'], function(MapView) {
          self.mapView = new MapView({model: self.model, el: self.$('#mapHolder', self.el)});          
          self.mapView.render();
        });        
      }
      
      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
      this.rendered = true;
      return this;
    }
  });
});
