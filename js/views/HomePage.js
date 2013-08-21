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
      _.bindAll(this, 'render', 'pagehide', 'pagebeforeshow', 'click');
      this.constructor.__super__.initialize.apply(this, arguments);
      
//      Events.on('pagehide', this.pagehide);
//      $(document).on('pagehide',       this.pagehide);
//      $(document).on('pagebeforeshow', this.pagebeforeshow);
//      $(div[data-role="page"]).on
      return this;
    },
    pagebeforechange: function(e) {
//      if (this.first)
//        Events.stopEvent(e);
    
    },
    events: {
      'pagehide'            : 'pagehide',
      'pagebeforeshow'      : 'pagebeforeshow',
      'click'              : 'click',
      'click #installApp'  : 'installApp'
    },
    
    installApp: function(e) {
      Events.stopEvent(e);
      if (G.inFirefoxOS) {
        U.require('firefox').done(function(Firefox) {
          Firefox.install();
        });
      }
    },
    
    pagehide: function(e) {
      this.$el.hide();
      BasicPageView.prototype.onpageevent.apply(this, arguments);
    },
    
    pagebeforeshow: function(e) {
      this.$el.show();
      BasicPageView.prototype.onpageevent.apply(this, arguments);
    },
    
    click: function(e) {
      var id = e.target.id;
      if (!id)
        return;
      if (id.startsWith('hpRightPanel')) {
        Events.stopEvent(e);
        U.require(["views/RightMenuPanel"]).done(function(MP) {
          self.menuPanel = new MP({viewId: 'viewHome'}).render();
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
      this.$el.trigger('pagebeforeshow');
      var item = $('#homePage');
      item.css('display', 'block');
      if (!item || item.length == 0) { 
        var itemS = G.haslocalStorage  &&  G.localStorage.get('homePage');
        if (itemS) { 
          $(itemS).css('display:none');
          $(itemS).appendTo('body');
//          $(itemS).appendTo('#page');
        }
      }
      if ($('#homePage').attr("data-stretch"))
        $('#homePage').anystretch();
//      if (this.first)
//        $.mobile.initializePage();
//      $(".demo").anystretch();
      this.first = false;

      if (navigator.mozApps) {
        var self = this;
        var appSelf = navigator.mozApps.getSelf();
        appSelf.onsuccess = function() {
          if (appSelf.result) {
            G.log(self.TAG, "events", "App installed!");
            self.removeInstallBtn();
          }
        };
      }
      else {
        this.removeInstallBtn();
      }
      $('title').text(G.currentApp.title);
//      this.finish();
      this.$el.trigger('pageshow');
      return this;
    },
    
    removeInstallBtn: function() {
      this.$('#installApp').remove();
    }
  }, {
    displayName: 'HomePage'
  });
});