define([
  'globals',
  'cache!jquery',
  'cache!underscore',
  'cache!backbone',
  'cache!utils',
  'cache!events',
  'cache!templates',
  'cache!views/Header',
  'cache!views/BackButton',
  'cache!views/LoginButtons',
  'cache!views/AroundMeButton',
  'cache!views/ResourceView',
  'cache!views/ResourceImageView',
  'cache!views/ControlPanel',
  'cache!jqueryMobile'
], function(G, $, _, Backbone, U, Events, Templates, Header, BackButton, LoginButtons, AroundMeButton, ResourceView, ResourceImageView, ControlPanel, __jqm__) {
  return Backbone.View.extend({
    initialize: function() {
      _.bindAll(this, 'render', 'tap', 'click', 'edit', 'home', 'swipeleft', 'swiperight');
  //    this.model.on('change', this.render, this);
      this.template = _.template(Templates.get('resource'));
      this.router = G.app && G.app.router || Backbone.history;
      this.TAG = "ViewPage";
      Events.on("mapReady", this.showMapButton);
    },
    events: {
      'click #edit': 'edit',
      'tap': 'tap',
      'click': 'click',
      'click #homeBtn': 'home',
      'swiperight': 'swiperight',
      'swipeleft': 'swipeleft'
    },
    swipeleft: function(e) {
      // open backlinks
      G.log(this.TAG, 'events', 'swipeleft');
    },
    swiperight: function(e) {
      // open menu
      G.log(this.TAG, 'events', 'swiperight');
      this.router.navigate('menu/' + encodeURIComponent(window.location.hash.slice(5)), {trigger: true, replace: false});
    },
    home: function() {
      this.router.navigate(G.homePage, {trigger: true, replace: false});
      return this;
    },
    edit: function(e) {
      e.preventDefault();
      this.router.navigate('view/' + encodeURIComponent(this.model.get('_uri')) + "?-edit=y", {trigger: true, replace: true});
      return this;
    },
    tap: function() {
//      G.log(this.TAG, 'events', 'tap');
      return Events.defaultTapHandler.apply(this, arguments);
    },
//    click: Events.defaultClickHandler,  
    click: function() {
      this.clicked = true;
      return Events.defaultClickHandler.apply(this, arguments);
    },
    render:function (eventName) {
      G.log(this.TAG, "render");
      this.$el.html(this.template(this.model.toJSON()));
      
      var isGeo = (this.model.isA("Locatable") && this.model.get('latitude')) || 
                  (this.model.isA("Shape") && this.model.get('shapeJson'));
      
      this.buttons = {
          left: [BackButton],
          right: isGeo ? [AroundMeButton] : null, // no need MapItButton?
          log: [LoginButtons]
      };
      
      this.header = new Header({
        model: this.model, 
//        pageTitle: this.pageTitle || this.model.get('davDisplayName'), 
        buttons: this.buttons,
        el: $('#headerDiv', this.el)
      }).render();
      
      this.header.$el.trigger('create');      
      this.imageView = new ResourceImageView({el: $('div#resourceImage', this.el), model: this.model});
      this.imageView.render();
      this.view = new ResourceView({el: $('ul#resourceView', this.el), model: this.model});
      this.view.render();
      this.cp = new ControlPanel({el: $('ul#cpView', this.el), model: this.model});
      this.cp.render();
      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
      this.rendered = true;
      return this;
    }
  });
});
