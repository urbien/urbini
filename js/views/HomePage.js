//'use strict';
define('views/HomePage', [
  'globals',
  'events',
  'jqueryAnyStretch',
  'utils',
  'views/BasicPageView'
], function(G, Events, Jas, U, BasicPageView) {
  return BasicPageView.extend({
    TAG: 'HomePage',
    first: true,
    initialize: function(options) {
      _.bindAll(this, 'render', 'click', 'pagehide', 'pagebeforeshow');
      this.constructor.__super__.initialize.apply(this, arguments);
      
//      Events.on('pagehide', this.pagehide);
//      $(document).on('page_hide',       this.pagehide);
//      $(document).on('page_beforeshow', this.pagebeforeshow);
//      $(div[data-role="page"]).on
      return this;
    },
    pagebeforechange: function(e) {
//      if (this.first)
//        Events.stopEvent(e);
    
    },
    events: {
      'page_hide'            : 'pagehide',
      'page_beforeshow'      : 'pagebeforeshow',
      'click'              : 'click',
      'click #installApp'  : 'installApp'
    },
    
    installApp: function(e) {
      Events.stopEvent(e);
      if (G.hasFFApps) {
        U.require('firefox').done(function(Firefox) {
          Firefox.install();
        });
      }
    },
    
    pagehide: function(e) {
//      this.$el.hide();
      return BasicPageView.prototype.onpageevent.apply(this, arguments);
    },
    
    pagebeforeshow: function(e) {
//      this.$el.show();
      return BasicPageView.prototype.onpageevent.apply(this, arguments);
    },
    
    click: function(e) {
      var id = e.target.id,
          self = this;
      
      if (!id)
        return;
      if (id.startsWith('hpRightPanel')) {
        Events.stopEvent(e);
        U.require(["views/RightMenuPanel"]).done(function(MP) {
          self.menuPanel = new MP({
            viewId: 'viewHome'
          });
          
          self.addChild(self.menuPanel);
          self.menuPanel.render();
        });
      }
      if (id.startsWith('hpLeftPanel')) {
        Events.stopEvent(e);
        U.require(["views/MenuPanel"]).done(function(MP) {
          self.menuPanel = new MP({viewId: 'viewHome'}).render();
        });
      }
    },
    
    render: function(options) {
      var self = this;
      
      if (!this.rendered) {
//      this.$el.trigger('page_beforeshow');
        this.$el.css('display', 'block');
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
      
      if (this.$el.attr("data-stretch"))
        this.$el.anystretch();

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
      return this;
    },
    
    removeInstallBtn: function() {
      this.$('#installApp').remove();
    }
  }, {
    displayName: 'HomePage'
  });
});