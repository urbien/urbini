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
      'orientationchange': 'reloadMasonry',
      'resize': 'reloadMasonry'
//        ,
//      'pageshow': 'reloadMasonry'
    },

    initialize: function(options) {
      var self = this;
      _.bindAll(this, 'reloadMasonry');
      ResourceListView.prototype.initialize.apply(this, arguments);
      this.autoFinish = false; // we want to say we finished rendering after the masonry is done doing its magic, which may happen async
//      Events.on('pageChange', function(prev, current) {
//        if (self.pageView == current && self.rendered) {
////          self.$el.imagesLoaded(function() {
//            self.masonry('reload');
////          });
//        }
//      });
    },
    
    masonry: function() {
      return this.$el[MASONRY_FN].apply(this.$el, arguments);
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
    
    reloadMasonry: function(e) {
      if (this.rendered)
        this.masonry('reload');
    },
    
    postRender: function(info) {
      var self = this;
      if (this.rendered) {
        if (info.appended.length || info.updated.length) {
          this.$el.imagesLoaded(function() {
            if (info.appended.length)
              self.masonry('appended', $(info.appended));
            if (info.updated.length)
              self.masonry('reload');
            
            self.trigger('refreshed');
          });
        }
      }
      else {
        this.$el.imagesLoaded(function() {          
          self.masonry({
            itemSelector: ITEM_SELECTOR
          });
   
          self.$el.on('pageshow', self.reloadMasonry.bind(self));
          self.finish();
        });        
      }
    }
  }, {
    displayName: "MasonryListView"
  });
});