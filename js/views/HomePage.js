//'use strict';
define('views/HomePage', [
  'globals',
  'events',
  'backbone',
  'jqueryAnyStretch'
], function(G, Events, Backbone, Jas) {
  return Backbone.View.extend({
    first: true,
    initialize: function(options) {
      _.bindAll(this, 'render', 'pagehide', 'pagebeforeshow', 'click');
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
      'click': 'click' 
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
        require(["views/RightMenuPanel"]).done(function(MP) {
          self.menuPanel = new MP({viewId: 'viewHome'}).render();
        });
      }
      if (id.startsWith('hpLeftPanel')) {
        Events.stopEvent(e);
        require(["views/MenuPanel"]).done(function(MP) {
          self.menuPanel = new MP({viewId: 'viewHome'}).render();
        });
      }
    },
    
    render: function(options) {
      var item = $('#homePage');
      item.css('display', 'inline');
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
//      this.finish();
      return this;
    }
  }, {
    displayName: 'HomePage'
  });
});