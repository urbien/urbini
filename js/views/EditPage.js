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
  'cache!views/MenuButton',
  'cache!views/EditView',
  'cache!views/ResourceImageView',
  'cache!views/ControlPanel',
  'cache!jqueryMobile'
], function(G, $, _, Backbone, U, Events, Templates, Header, BackButton, LoginButtons, AroundMeButton, MenuButton, EditView, ResourceImageView, ControlPanel, __jqm__) {
  return Backbone.View.extend({
    clicked: false,
    initialize: function() {
      _.bindAll(this, 'render', 'click', 'edit', 'home', 'swipeleft', 'swiperight');
  //    this.model.on('change', this.render, this);
      this.template = _.template(Templates.get('resourceEdit'));
      this.TAG = "EditPage";
      this.router = G.Router || Backbone.History;
      Events.on("mapReady", this.showMapButton);
    },
    events: {
      'click #edit': 'edit',
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
      G.Router.navigate('menu/' + U.encode(window.location.hash.slice(5)), {trigger: true, replace: false});
    },
    home: function() {
//      this.router.navigate('', {trigger: true, replace: false});
      var here = window.location.href;
      window.location.href = here.slice(0, here.indexOf('#'));
      return this;
    },
    edit: function(e) {
      e.preventDefault();
      this.router.navigate('edit/' + U.encode(this.model.get('_uri')), {trigger: true, replace: true});
      return this;
    },
//    tap: function() {
//      G.log(this.TAG, 'events');
//      return Events.defaultTapHandler.apply(this, arguments);
//    },
//    click: Events.defaultClickHandler,  
    click: function(e) {
      clicked = true;
      Events.defaultClickHandler(e);  
    },

    render:function (eventName) {
      G.log(this.TAG, "render");
      this.$el.html(this.template(this.model.toJSON()));
      
      var isGeo = (this.model.isA("Locatable") && this.model.get('latitude')) || 
                  (this.model.isA("Shape") && this.model.get('shapeJson'));
      
      this.buttons = {
          left: [BackButton],
          right: isGeo ? [AroundMeButton, MenuButton] : [MenuButton], // no need MapItButton? nope
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
      this.view = new EditView({el: $('ul#resourceEditView', this.el), model: this.model});
      this.view.render();
//      this.cp = new ControlPanel({el: $('ul#cpView', this.el), model: this.model});
//      this.cp.render();      
//      this.editBtn = new EditButton({el: $('#edit', this.el), model: this.model});
//      this.editBtn.render();
      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
      this.rendered = true;
      return this;
    }
  }, {
    displayName: 'EditPage'
  });
});
