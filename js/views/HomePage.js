//'use strict';
define('views/HomePage', [
  'globals',
  'events',
  'backbone'
], function(G, Events, Backbone) {
  return Backbone.View.extend({
    first: true,
    initialize: function(options) {
      _.bindAll(this, 'render', 'pagehide', 'pagebeforeshow');
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
      'pagebeforeshow': 'pagebeforeshow'
    },

    pagehide: function(e) {
      $('#bg').hide();
    },    
    pagebeforeshow: function(e) {
      $('#bg').show();
    },
        
    render: function(options) {
      var item = $('#homePage');
      if (!item || item.length == 0) { 
        var itemS = G.haslocalStorage  &&  G.localStorage.get('homePage');
        if (itemS) { 
          $(itemS).css('display:none');
          $(itemS).appendTo('body');
//          $(itemS).appendTo('#page');
        }
      } 
//      if (this.first)
//        $.mobile.initializePage();
      this.first = false;
//      this.finish();
      return this;
    }
  }, {
    displayName: 'HomePage'
  });
});