define([
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone',
  'cache!events'
], function($, __jqm__, _, Backbone, Events) {
  return Backbone.View.extend({
    first: true,
    initialize: function(options) {
      _.bindAll(this, 'render', 'pagebeforechange');
      $(document).on('pagebeforechange', this.pagebeforechange);
      return this;
    },
    pagebeforechange: function(e) {
//      if (this.first)
//        e.preventDefault();
    },
    
    render: function(options) {
      var item = $('#homePage');
      if (!item) { 
        itemS = localStorage  &&  localStorage.getItem  &&  localStorage.getItem('homePage');
        if (itemS) 
          $(itemS).css('display:none').attr('data-role', 'page').appendTo('body');
      } 
//      if (this.first)
//        $.mobile.initializePage();
      this.first = false;
      return this;
    }
  });
});