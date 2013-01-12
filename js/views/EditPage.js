define([
  'globals',
  'cache!jquery',
  'cache!underscore',
  'cache!backbone',
  'cache!utils',
  'cache!events',
  'cache!templates',
  'cache!views/BasicView',
  'cache!views/Header',
  'cache!views/BackButton',
  'cache!views/LoginButtons',
  'cache!views/AroundMeButton',
  'cache!views/MenuButton',
  'cache!views/EditView',
  'cache!views/ResourceImageView',
  'cache!views/ControlPanel',
  'cache!jqueryMobile'
], function(G, $, _, Backbone, U, Events, Templates, BasicView, Header, BackButton, LoginButtons, AroundMeButton, MenuButton, EditView, ResourceImageView, ControlPanel, __jqm__) {
  return BasicView.extend({
    clicked: false,
    initialize: function(options) {
      _.bindAll(this, 'render', 'click', 'edit', 'home', 'swipeleft', 'swiperight', 'set', 'resetForm');
      this.constructor.__super__.initialize.apply(this, arguments);

  //    this.resource.on('change', this.render, this);
      this.template = _.template(Templates.get('resourceEdit'));
      this.TAG = "EditPage";
      this.router = G.Router || Backbone.History;
      this.action = options && options.action || 'edit';
      Events.on("mapReady", this.showMapButton);
    },
    set: function(params) {
      _.extend(this, params);
      if (this.editView)
        this.editView.set(params);
      else
        this.editParams = params;
    },
    events: {
      'click #edit': 'edit',
      'click': 'click',
      'click #homeBtn': 'home',
      'swiperight': 'swiperight',
      'swipeleft': 'swipeleft'
    },
    resetForm: function() {
      this.editView && this.editView.resetForm();
    },
    swipeleft: function(e) {
      // open backlinks
      G.log(this.TAG, 'events', 'swipeleft');
    },
    swiperight: function(e) {
      // open menu
      G.log(this.TAG, 'events', 'swiperight');
      G.Router.navigate('menu/' + U.encode(window.location.hash.slice(6)), {trigger: true, replace: false});
    },
    home: function() {
//      this.router.navigate('', {trigger: true, replace: false});
      var here = window.location.href;
      window.location.href = here.slice(0, here.indexOf('#'));
      return this;
    },
    edit: function(e) {
      e.preventDefault();
      this.router.navigate('edit/' + U.encode(this.resource.get('_uri')), {trigger: true, replace: true});
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
      var res = this.resource;
      this.$el.html(this.template(res.toJSON()));
      
      var isGeo = (res.isA("Locatable") && res.get('latitude')) || 
                  (res.isA("Shape") && res.get('shapeJson'));
      
      this.buttons = {
          left: [BackButton],
          right: isGeo ? [AroundMeButton, MenuButton] : [MenuButton], // no need MapItButton? nope
          log: [LoginButtons]
      };
      
      this.header = new Header({
        model: res, 
//        pageTitle: this.pageTitle || res.get('davDisplayName'), 
        buttons: this.buttons,
        el: $('#headerDiv', this.el)
      }).render();
      
      this.header.$el.trigger('create');      
      this.imageView = new ResourceImageView({el: $('div#resourceImage', this.el), model: res});
      this.imageView.render();
      this.editView = new EditView({el: $('#resourceEditView', this.el), model: res});
      if (this.editParams)
        this.editView.set(this.editParams);
      
      this.editView.render();
//      this.cp = new ControlPanel({el: $('ul#cpView', this.el), model: res});
//      this.cp.render();      
//      this.editBtn = new EditButton({el: $('#edit', this.el), model: res});
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
