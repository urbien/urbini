define([
  'globals',
  'jquery', 
  'underscore', 
  'templates',
  'utils',
  'views/BasicView',
  'events'
], function(G, $, _, Templates, U, BasicView, Events) {
  return BasicView.extend({
    loginTemplate: 'loginButtonTemplate',
    logoutTemplate: 'logoutButtonTemplate',
//    popupTemplate: 'loginPopupTemplate',
    events: {
      'click #login' : 'showPopup',
      'click #logout': 'logout'
    },
    logout: function() {
//      var url = G.serverName + '/j_security_check?j_signout=true&returnUri=' + encodeURIComponent(G.serverName + '/' + G.pageRoot);
//      $.get(url, function() {
//          // may be current page is not public so go to home page (?)
//        window.location.hash = '';
//        window.location.reload();
//      });
      Events.trigger('logout');
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'showPopup', 'logout');
      this.constructor.__super__.initialize.apply(this, arguments);
//      this.popupTemplate = _.template(Templates.get(this.popupTemplate));
      this.loginTemplate = _.template(Templates.get(this.loginTemplate));
      this.logoutTemplate = _.template(Templates.get(this.logoutTemplate));
      return this;
    },

    render: function(options) {
      this.template = G.currentUser.guest ? this.loginTemplate : this.logoutTemplate;
      var method = options && options.append ? 'append' : 'html';
      var loginBtn = this.template();
      if (!_.size(G.socialNets)) {
        this.$el[method](_.template(Templates.get('logoutButtonTemplate'))());
        return this;
      }
            
      this.$el[method](loginBtn);
      return this;
    },
    
    showPopup: function() {
      Events.trigger(Events.REQUEST_LOGIN);
      return false;
//      var $popup = $('.ui-page-active #login_popup');
//      if ($popup.length == 0) {
//        $(document.body).append(this.popupTemplate({nets: G.socialNets}));
//        $popup = $('#login_popup');
//      }
//      $popup.trigger('create');
//      $popup.popup().popup("open");
//      return false; // prevents login button highlighting
    }

  });
});
