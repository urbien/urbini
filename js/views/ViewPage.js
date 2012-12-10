// needs Lablz.homePage

define([
  'cache!jquery', 
  'jqueryMobile',
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
  'cache!views/ResourceImageView' 
], function($, __jqm__, _, Backbone, U, Events, Templates, Header, BackButton, LoginButtons, AroundMeButton, ResourceView, ResourceImageView) {
  return Backbone.View.extend({
    initialize: function() {
      _.bindAll(this, 'render', 'tap', 'click', 'edit', 'home');
  //    this.model.on('change', this.render, this);
      this.template = _.template(Templates.get('resource'));
      Events.on("mapReady", this.showMapButton);
    },
    events: {
      'click #edit': 'edit',
      'tap': 'tap',
      'click': 'click',
      'click #homeBtn': 'home'
    },
    home: function() {
      Backbone.history.navigate(Lablz.homePage, {trigger: true, replace: false});
      return this;
    },
    edit: function(e) {
      e.preventDefault();
      Backbone.history.navigate('view/' + encodeURIComponent(this.model.get('_uri')) + "?-edit=y", {trigger: true, replace: true});
      return this;
    },
    tap: Events.defaultTapHandler,
    click: Events.defaultClickHandler,  
    render:function (eventName) {
      console.log("render viewPage");
      this.$el.html(this.template(this.model.toJSON()));
      
      var isGeo = (this.model.isA("Locatable") && this.model.get('latitude')) || 
                  (this.model.isA("Shape") && this.model.get('shapeJson'));
      
      this.buttons = {
          left: [BackButton, LoginButtons],
          right: isGeo ? [AroundMeButton] : null,
      };
      
      this.header = new Header({
        model: this.model, 
        pageTitle: this.model.get('davDisplayName'), 
        buttons: this.buttons,
        el: $('#headerDiv', this.el)
      }).render();
      
      this.header.$el.trigger('create');
      
      this.imageView = new ResourceImageView({el: $('div#resourceImage', this.el), model: this.model});
      this.imageView.render();
      this.view = new ResourceView({el: $('ul#resourceView', this.el), model: this.model});
      this.view.render();
      this.rendered = true;
      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
      return this;
    }
  });
});