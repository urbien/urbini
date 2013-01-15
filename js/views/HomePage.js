define([
  'globals',
  'cache!jquery', 
  'cache!underscore', 
  'cache!backbone',
  'cache!events'
], function(G, $, _, Backbone, Events) {
  return Backbone.View.extend({
    first: true,
    initialize: function(options) {
      _.bindAll(this, 'render', 'pagebeforechange');
      $(document).on('pagebeforechange', this.pagebeforechange);
      return this;
    },
    pagebeforechange: function(e) {
//      if (this.first)
//        Events.stopEvent(e);
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
      return this;
    }
  }, {
    displayName: 'HomePage'
  });
});