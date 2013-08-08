//'use strict';
define('views/HomePage', [
  'globals',
  'events',
  'jqueryAnyStretch',
  'utils',
  'views/BasicView'
], function(G, Events, Jas, U, BasicView) {
  return BasicView.extend({
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
      'pagehide': 'pagehide',
      'pagebeforeshow': 'pagebeforeshow',
      'click': 'click',
      'click #installApp': 'installApp'
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
      $('#bg').hide();
    },    
    pagebeforeshow: function(e) {
      $('#bg').show();
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

//      this.finish();
      return this;
    },
    
    removeInstallBtn: function() {
      this.$('#installApp').remove();
    }
  }, {
    displayName: 'HomePage'
  });
});