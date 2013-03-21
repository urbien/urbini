//'use strict';
define([
  'globals',
  'jquery',
  'underscore',
  'utils',
  'events',
  'views/BasicView',
  'views/Header',
  'views/EditView',
  'views/ResourceImageView',
  'views/ControlPanel'
], function(G, $, _, U, Events, BasicView, Header, EditView, ResourceImageView, ControlPanel) {
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

      var res = this.resource;
  //    var json = res.toJSON();
  //    json.viewId = this.cid;
      var settings = {viewId: this.cid}
      if (U.isAssignableFrom(res, "AppInstall")) {
        settings.submit = 'Allow';
        settings.noCancel = true;
      }
      
      this.$el.html(this.template(settings));
      
      var isGeo = !!((res.isA("Locatable") && res.get('latitude')) || 
                     (res.isA("Shape") && res.get('shapeJson')));
      
      this.buttons = {
        back: true,
        aroundMe: isGeo,
        menu: true,
        login: G.currentUser.guest
      };
    
      this.addChild('header', new Header({
        model: res, 
//        pageTitle: this.pageTitle || res.get('davDisplayName'), 
        buttons: this.buttons,
        viewId: this.cid,
        parentView: this
      }));
      
      var reqParams = U.getParamMap(window.location.href);
      var editCols =  reqParams['$editCols'];
      if (!editCols) {
        this.addChild('imageView', new ResourceImageView({model: res}));
      }
      
      this.addChild('editView', new EditView(_.extend({model: res /*, backlinkResource: this.backlinkResource*/}, this.editOptions)));
      if (this.editParams)
        this.editView.set(this.editParams);
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

    render: function() {
      try {
        return this.renderHelper.apply(this, arguments);
      } finally {
        this.finish();
      }
    },
    
    renderHelper:function () {
      G.log(this.TAG, "render");
      
      var views = {
        '#resourceEditView': this.editView,
        '#headerDiv'       : this.header
      };
      
      if (this.imageView)
        views['div#resourceImage'] = this.imageView;

      this.assign(views);      
      if (this.header.noButtons)
        this.header.$el.find('#headerButtons').css('display', 'none');

      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
      this.rendered = true;
      return this;
    }
  }, {
    displayName: 'EditPage'
  });
});
