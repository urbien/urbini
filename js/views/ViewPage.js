//'use strict';
define([
  'globals',
  'utils',
  'events',
  'views/BasicView',
  'views/Header',
  'views/BackButton',
  'views/LoginButtons',
  'views/AroundMeButton',
  'views/MenuButton',
  'views/ResourceView',
  'views/ResourceImageView',
  'views/ControlPanel'
], function(G, U, Events, BasicView, Header, BackButton, LoginButtons, AroundMeButton, MenuButton, ResourceView, ResourceImageView, ControlPanel) {
  return BasicView.extend({
    clicked: false,
    initialize: function(options) {
      _.bindAll(this, 'render', 'home', 'swipeleft', 'swiperight', 'edit');
      this.constructor.__super__.initialize.apply(this, arguments);
  //    this.model.on('change', this.render, this);
      this.template = this.makeTemplate('resource');
      this.TAG = "ViewPage";
      this.router = G.Router || Backbone.History;
      this.viewId = options.viewId;
      Events.on("mapReady", this.showMapButton);
    },
    events: {
      'click #edit': 'edit',
//      'click': 'click',
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
    },
    home: function() {
//      this.router.navigate(G.homePage, {trigger: true, replace: false});
      var here = window.location.href;
      window.location.href = here.slice(0, here.indexOf('#'));
      return this;
    },
    edit: function(e) {
      e.preventDefault();
      this.router.navigate('edit/' + U.encode(this.resource.get('_uri')), {trigger: true});
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
      var res = this.resource;
      var commonParams = {
        model: res,
        parentView: this
      }
      
      G.log(this.TAG, "render");
      var json = res.attributes;
      json.viewId = this.cid;
      this.$el.html(this.template(json));
      
      var isGeo = (res.isA("Locatable") && res.get('latitude')) || 
                  (res.isA("Shape") && res.get('shapeJson'));
      this.buttons = {
          left: [BackButton],
          right: isGeo ? [AroundMeButton, MenuButton] : [MenuButton], // no need MapItButton? nope
          log: [LoginButtons]
      };
      
      if (!G.currentUser.guest) {
        var user = G.currentUser._uri;
        if (U.isAssignableFrom(res.vocModel, "App")) {
          var appOwner = U.getLongUri1(res.get('creator') || user);
          if (user == appOwner  &&  (res.get('lastPublished')  &&  res.get('lastModifiedWebClass') > res.get('lastPublished')))
            this.doPublish = true;
          
          var noWebClasses = !res.get('lastModifiedWeblass')  &&  res.get('dashboard') != null  &&  res.get('dashboard').indexOf('http') == 0;
          var wasPublished = !this.hasPublish && (res.get('lastModifiedWeblass') < res.get('lastPublished'));
          if (res.get('_uri')  != G.currentApp._uri  &&  (noWebClasses ||  wasPublished)) {
            this.doTry = true;
            this.forkMe = true;
          }
        }

        else if (U.isAssignableFrom(res.vocModel, "Handler")) {
//          var handlerOwner = U.getLongUri1(res.get('submittedBy') || user);
//          if (user == handlerOwner)
            this.testHandler = true;            
        }
        else {
          var params = U.getParamMap(window.location.hash);
          if (U.isAssignableFrom(res.vocModel, "Video", G.typeToModel)  &&  params['-tournament'])
            this.enterTournament = true;
        }
      }
      
      this.header = new Header(_.extend(commonParams, {
//        pageTitle: this.pageTitle || res.get('davDisplayName'), 
        buttons: this.buttons,
        viewId: this.cid,
        el: $('#headerDiv', this.el)
      }, _.pick(this, ['doTry', 'doPublish', 'testHandler', 'forkMe', 'enterTournament']))).render();
      
      this.header.$el.trigger('create');      
      this.imageView = new ResourceImageView(_.extend(commonParams, {el: $('div#resourceImage', this.el)}));
      this.imageView.render();
      this.view = new ResourceView(_.extend(commonParams, {el: $('ul#resourceView', this.el)}));
      this.view.render();
      this.cp = new ControlPanel(_.extend(commonParams, {el: $('ul#cpView', this.el)}));
      this.cp.render();
      if (G.currentUser.guest) {
        this.$('#edit').hide();
      }
      
      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
      this.rendered = true;
      return this;
    }
  }, {
    displayName: 'ViewPage'
  });
});
