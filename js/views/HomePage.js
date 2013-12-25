//'use strict';
define('views/HomePage', [
  'globals',
  'events',
  'utils',
  'views/BasicPageView'
], function(G, Events, U, BasicPageView) {
  return BasicPageView.extend({
    TAG: 'HomePage',
    first: true,
    initialize: function(options) {
      _.bindAll(this, 'render', 'rightMenu', 'leftMenu'); //, 'pagehide', 'pagebeforeshow');
      BasicPageView.prototype.initialize.apply(this, arguments);
      return this;
    },

    events: {
      'tap #hpRightPanel'   : 'leftMenu',
      'hold #hpRightPanel'  : 'rightMenu',
      'tap #installApp'    : 'installApp'
    },
    
    installApp: function(e) {
      Events.stopEvent(e);
      if (G.hasFFApps) {
        U.require('firefox').done(function(Firefox) {
          Firefox.install();
        });
      }
    },
    
    rightMenu: function(e) {
      var id = e.target.id,
          self = this;
      
      if (!id)
        return;
      if (!id.startsWith('hpRightPanel'))
        return;
      Events.stopEvent(e);
      U.require(["views/RightMenuPanel"]).done(function(MP) {
        self.menuPanel = new MP({
          viewId: 'viewHome'
        });
        
        self.addChild(self.menuPanel);
        self.menuPanel.render();
      });
    },
    leftMenu: function(e) {
      var id = e.target.id,
          self = this;
      
      if (!id)
        return;
      if (!id.startsWith('hpRightPanel'))
        return;
      if (!this.el.querySelector('#hpLeftPanel'))
        return this.rightMenu(e);
//      if (!this.$('#' + this.viewId).length)
//        return;
      
      Events.stopEvent(e);
      U.require(["views/MenuPanel"]).done(function(MP) {
        self.menuPanel = new MP({viewId: 'viewHome'});
        self.addChild(self.menuPanel);
        self.menuPanel.render();
      });
    },
    
    render: function(options) {
      var self = this;
      
      if (!this.rendered) {
//      this.$el.trigger('page_beforeshow');
        this.el.style.display = 'block';
        
        // only allow tap and hold events, click muddies the waters
        this.el.querySelector('#hpRightPanel').$on('click', function(e) {
          e.preventDefault();
        });
      }
//      var item = $('#homePage');
//      item.css('display', 'block');
//      if (!item || item.length == 0) { 
//        var itemS = G.haslocalStorage  &&  G.localStorage.get('homePage');
//        if (itemS) { 
//          $(itemS).css('display:none');
//          $(itemS).appendTo('body');
////          $(itemS).appendTo('#page');
//        }
//      }
      
//      if (this.$el.attr("data-stretch"))
//        this.$el.anystretch();

      this.first = false;
      if (this.rendered)
        return;

      if (navigator.mozApps) {
        G.firefoxAppInstalled.done(function() {
          self.removeInstallBtn();
        });
      }
      else 
        this.removeInstallBtn();
      
      document.title = G.currentApp.title;
      this.addToWorld(null, true);
      return this;
    },
    
    removeInstallBtn: function() {
      this.$('#installApp').$remove();
    }
  }, {
    displayName: 'HomePage'
  });
});