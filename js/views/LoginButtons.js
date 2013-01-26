define([
  'globals',
  'cache!jquery', 
  'cache!underscore', 
  'cache!templates',
  'cache!utils',
  'cache!views/BasicView'
], function(G, $, _, Templates, U, BasicView) {
  return BasicView.extend({
    loginTemplate: 'loginButtonTemplate',
    logoutTemplate: 'logoutButtonTemplate',
    popupTemplate: 'loginPopupTemplate',
    events: {
      'click #login' : 'showPopup',
      'click #logout': 'logout'
    },
    logout: function() {
      var url = G.serverName + '/j_security_check?j_signout=true&returnUri=' + encodeURIComponent(G.serverName + '/' + G.pageRoot);
      $.get(url, function() {
          // may be current page is not public so go to home page (?)
        window.location.hash = '';
        window.location.reload();
      });
        // window.location.href = G.serverName + '/j_security_check?j_signout=true&returnUri=' + encodeURIComponent(G.serverName + '/' + G.pageRoot);      
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'showPopup', 'logout');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.popupTemplate = _.template(Templates.get(this.popupTemplate));
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
      
      var here = window.location.href;
      _.each(G.socialNets, function(net) {
        var state = U.getQueryString({socialNet: net.socialNet, returnUri: here, actionType: 'Login'}, true); // sorted alphabetically
        var params = net.oAuthVersion == 1 ?
        {
          episode: 1, 
          socialNet: net.socialNet,
          actionType: 'Login'
        }
        : 
        {
          scope: net.settings,
          display: 'page', 
          state: state, 
          redirect_uri: G.serverName + '/social/socialsignup', 
          response_type: 'code', 
          client_id: net.appId || net.appKey
        };
        
        net.icon = net.icon || G.serverName + '/icons/' + net.socialNet.toLowerCase() + '-mid.png';
        net.url = net.authEndpoint + '?' + U.getQueryString(params, true); // sorted alphabetically
      });
      
      this.$el[method](loginBtn);
      return this;
    },
    
    showPopup: function() {
      var $popup = $('.ui-page-active #login_popup');
      if ($popup.length == 0) {
        $(document.body).append(this.popupTemplate({nets: G.socialNets}));
        $popup = $('#login_popup');
      }
      $popup.trigger('create');
      $popup.popup().popup("open");
      return false; // prevents login button highlighting
    }

  });
});
