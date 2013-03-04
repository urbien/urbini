//'use strict';
define([
  'globals',
  'jquery',
  'underscore',
  'utils',
  'events',
  'templates',
  'views/BasicView',
  'views/Header',
  'views/BackButton',
  'views/LoginButtons',
  'views/AroundMeButton',
  'views/MenuButton',
  'views/EditView',
  'views/ResourceImageView',
  'views/ControlPanel'
], function(G, $, _, U, Events, Templates, BasicView, Header, BackButton, LoginButtons, AroundMeButton, MenuButton, EditView, ResourceImageView, ControlPanel) {
  var editParams = ['action', 'viewId'];//, 'backlinkResource'];
  return BasicView.extend({
    clicked: false,
    initialize: function(options) {
      _.bindAll(this, 'render', 'edit', 'home', 'swipeleft', 'swiperight', 'set', 'resetForm');
      this.constructor.__super__.initialize.apply(this, arguments);
  //    this.resource.on('change', this.render, this);
      this.template = this.makeTemplate('resourceEdit');
      this.TAG = "EditPage";
      this.editOptions = _.extend({action: 'edit'}, _.pick(options, editParams));
      _.extend(this, this.editOptions);
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
//      'click': 'click',
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
//      G.Router.navigate('menu/' + U.encode(window.location.hash.slice(6)), {trigger: true, replace: false});
//      var menuPanel = new MenuPanel({viewId: this.cid, model: this.model});
//      menuPanel.render();
    },
    home: function() {
//      this.router.navigate('', {trigger: true, replace: false});
      var here = window.location.href;
      window.location.href = here.slice(0, here.indexOf('#'));
      return this;
    },
    edit: function(e) {
      Events.stopEvent(e);
      this.router.navigate(U.makeMobileUrl('edit', this.resource), {trigger: true, replace: true});
      return this;
    },
//    tap: function() {
//      G.log(this.TAG, 'events');
//      return Events.defaultTapHandler.apply(this, arguments);
//    },
//    click: Events.defaultClickHandler,  
//    click: function(e) {
//      clicked = true;
//      Events.defaultClickHandler(e);  
//    },

    render:function (eventName) {
      G.log(this.TAG, "render");
      var res = this.resource;
      var json = res.toJSON();
      json.viewId = this.cid;
      this.$el.html(this.template(json));
      
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
        viewId: this.cid,
        el: $('#headerDiv', this.el)
      }).render();
      
      this.header.$el.trigger('create');      
      this.imageView = new ResourceImageView({el: $('div#resourceImage', this.el), model: res});
      this.imageView.render();
      this.editView = new EditView(_.extend({el: $('#resourceEditView', this.el), model: res /*, backlinkResource: this.backlinkResource*/}, this.editOptions));
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
