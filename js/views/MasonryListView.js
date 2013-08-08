'use strict';
define('views/MasonryListView', [
  'globals',
  'utils',
  'events',
  'views/ResourceListView',
  'views/ResourceMasonryItemView',
  'collections/ResourceList',
  'jqueryMobile',
  'jqueryImagesLoaded'
], function(G, U, Events, ResourceListView, ResourceMasonryItemView, ResourceList, $m) {
  var MASONRY_FN = 'masonry', // in case we decide to switch to Packery or some other plugin
      ITEM_SELECTOR = '.nab';
  
  return ResourceListView.extend({
    type: 'masonry',
    events: {
      'orientationchange': 'orientationchange',
      'resize': 'orientationchange'
    },

    initialize: function(options) {
      var self = this;
      _.bindAll(this, 'orientationchange');
      this.superInitialize(options);
      this.autoFinish = false; // we want to say we finished rendering after the masonry is done doing its magic, which may happen async
    },
    
    masonry: function() {
      return this.$el[MASONRY_FN];
    },
    
    getListItems: function() {
      return this.$(ITEM_SELECTOR);
    },
    
    renderItem: function(res, info) {
      var liView = this.addChild('masonryItem' + G.nextId(), new ResourceMasonryItemView({
        className: 'nab nabBoard',
        parentView: this,
        resource: res
      }));
      
      liView.render({force: true});
      return liView;
    },
    
    orientationchange: function(e) {
      this.masonry('reload');
    },
    
    postRender: function(info) {
      var self = this;
      if (this.rendered) {
        this.$el.trigger('create');
        if (info.appended.length) {
          this.$el.imagesLoaded(function() {            
            self.masonry('appended', $(info.appended));
          });
        }
      }
      else {
        this.$el.imagesLoaded(function() {          
          self.masonry({
            itemSelector: ITEM_SELECTOR
          });
          
          self.finish();
        });        
      }
    }
  }, {
    displayName: "MasonryListView"
  });
});