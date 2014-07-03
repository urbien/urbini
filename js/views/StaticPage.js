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
      this.templateData = _.extend(this.getBaseTemplateData(), options.data);
      this.makeTemplate(options.template, 'template');
    },
    
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
    }    
  }, {
    displayName: 'StaticPage'
  });
});