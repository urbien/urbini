define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile',
  'underscore', 
  'cache!backbone', 
  'cache!utils',
  'cache!templates'
], function(G, $, __jqm__, _, Backbone, U, Templates) {
  return Backbone.View.extend({
    loginTemplate: 'loginButtonTemplate',
    logoutTemplate: 'logoutButtonTemplate',
    popupTemplate: 'loginPopupTemplate',
    events: {
      'click #login' : 'showPopup',
      'click #logout': 'showPopup'
    },
    
    initialize: function(options) {
      _.bindAll(this, 'render', 'showPopup');
      this.popupTemplate = _.template(Templates.get(this.popupTemplate));
      this.loginTemplate = _.template(Templates.get(this.loginTemplate));
      this.logoutTemplate = _.template(Templates.get(this.logoutTemplate));
      return this;
    },

    render: function(options) {
      this.template = G.currentUser.guest ? this.loginTemplate : this.logoutTemplate;
      var method = options && options.append ? 'append' : 'html';
      var loginBtn = this.template();
      if (!_.size(Lablz.socialNets)) {
        this.$el[method](_.template(Templates.get('logoutButtonTemplate'))());
        return this;
      }
      
      var here = window.location.href;
      _.each(Lablz.socialNets, function(net) {
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
        $(document.body).append(this.popupTemplate({nets: Lablz.socialNets}));
        $popup = $('#login_popup');
      }
      $popup.popup().popup("open");
      return false; // prevents login button highlighting
    }

  });
});
