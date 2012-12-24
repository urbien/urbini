define([
  'cache!jquery', 
  'cache!jqueryMobile',
  'underscore', 
  'cache!backbone', 
  'cache!utils',
  'cache!templates'
], function($, __jqm__, _, Backbone, U, Templates) {
  return Backbone.View.extend({
    template: 'loginButtonTemplate',
    popupId: '#loginPopup',
    
    events: {
      'click #login': 'showPopup'
    },
    
    initialize: function(options) {
      _.bindAll(this, 'render');
      this.template = _.template(Templates.get(this.template)); 
      return this;
    },

    render: function(options) {
      var method = options && options.append ? 'append' : 'html';
      var loginBtn = this.template();
      var popup = $(this.popupId).html();
      if (popup.indexOf('data-socialnet') == -1) {
        this.$el[method](_.template(Templates.get('logoutButtonTemplate'))());
        return this;
      }

      this.$el[method](loginBtn);
      this.$el.prevObject.append(popup);
      
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
      var $popup = $('.ui-page-active #login_popup');
      if ($popup.length == 0) {
        $(document.body).append(this.popupTemplate());
        $popup = $('#login_popup');
      }
      $popup.popup().popup("open");
      return false; // prevents login button highlighting
    }

  });
});
