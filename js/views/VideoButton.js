//'use strict';
define([
  'underscore', 
  'utils',
  'events', 
  'views/ToggleButton1' 
], function(_, U, Events, ToggleButton1) {
  return ToggleButton1.extend({
    templateName: 'videoButtonTemplate',
    tagName: 'li',
    id: 'videoHeaderBtn',
    depressed: {
      event: 'video:on'
    },
    released: {
      event: 'video:off'        
    },
    render: function(options) {      
      this.$el.html(this.template());
      if (U.getHashParams()['-autoVideo'] === 'y')
        this.pageView.trigger('video:on');
      
      return this;
    }
  }, {
    displayName: 'VideoButton'
  });
});