//'use strict';
define('views/StaticPage', [
  'globals',
  'utils',
  'events',
  'views/BasicPageView',
  'views/Header'
], function(G, U, Events, BasicPageView, Header) {
  return BasicPageView.extend({
    initialize: function(options) {
      options = options || {};
      this.constructor.__super__.initialize.apply(this, arguments);

      if (options.header) {
        this.headerButtons = {
          back: true,
          menu: true,
          rightMenu: !G.currentUser.guest,
          login: G.currentUser.guest
        };
        
        this.addChild('header', new Header({
          viewId: this.cid,
          parentView: this,
          model: this.model
        }));
      }

      this.makeTemplate(options.template || U.getCurrentUrlInfo().params.template, 'template');
    },
    
    render: function() {
      this.$el.html(this.template());
      if (!this.$el.parentNode) 
        $('body').append(this.$el);
    }    
  }, {
    displayName: 'StaticPage'
  });
});