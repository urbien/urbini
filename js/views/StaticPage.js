//'use strict';
define('views/StaticPage', [
  'globals',
  'utils',
  'events',
  'views/BasicPageView',
  'views/Header',
  'views/RightMenuButton'
], function(G, U, Events, BasicPageView, Header, MenuButton) {
  return BasicPageView.extend({
    initialize: function(options) {
      options = options || {};
      BasicPageView.prototype.initialize.call(this, options);

      if (options.header) {
        this.headerButtons = {
          back: true,
          menu: true,
          rightMenu: !G.currentUser.guest
        };
        
        this.header = new Header({
          viewId: this.cid,
          parentView: this,
          model: this.model
        });
        
        this.addChild(this.header);
      }

      this.templateData = options.data;
      this.makeTemplate(options.template, 'template');
    },
    
//    events: {
//      'click action': 'performAction'
//    },
    
    render: function() {
      if (this.template)
        this.el.$html(this.template(this.templateData));
      
      if (!this.rendered) {
        var menuBtnEl = this.el.querySelector('#hpRightPanel');
        if (menuBtnEl) {
          this.menuBtn = new MenuButton({
            el: menuBtnEl,
            pageView: this,
            viewId: this.viewId,
            homePage: true
          });
          
          this.menuBtn.render();
        }
        
        this.addToWorld(null, true);
      }
      
      if (!this.el.parentNode) 
        $('body').append(this.$el);
      
      if (!this.rendered)
        this.addToWorld(null, true);
    }    
  }, {
    displayName: 'StaticPage'
  });
});