define([
  'cache!jquery', 
  'cache!jqueryMobile',
  'underscore', 
  'cache!backbone', 
  'cache!utils',
  'cache!templates'
], function($, __jqm__, _, Backbone, U, Templates) {
  return Backbone.View.extend({
    template: 'loginTemplate',
    
    events: {
      'click #login-popup_btn': 'showPopup'
    },
    
    initialize: function(options) {
      _.bindAll(this, 'render');
      this.template = _.template(Templates.get(this.template));    
      return this;
    },

    render: function(options) {
      var method = options && options.append ? 'append' : 'html';
      var socials = this.template();
      if (socials.indexOf('data-socialnet') == -1) {
        this.$el[method](_.template(Templates.get('logoutButtonTemplate'))());
        return this;
      }
      
      this.$el[method](socials);
      var btns = this.$('a[data-socialNet]');
      _.each(btns, function(a) {
        if (a.href) {
          var base = a.href.split('?');
          base = base[0];
          var q = U.getQueryParams(a.href);
          var param = q.state ? 'state' : 'redirect_uri';
          var returnUri = U.getQueryParams(q[param]).returnUri;
          if (!returnUri) {
            q[param] = U.replaceParam(q[param], 'returnUri', window.location.href, true);
            $(a).attr('href', base + '?' + U.getQueryString(q));
          }
        }
      });
      
      return this;
    },
    
    showPopup: function() {
      $('#login-popup').popup("open");
    },

  });
});
