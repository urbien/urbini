'use strict';
define('views/MasonryListView', [
  'globals',
  'utils',
  'events',
  'views/ResourceListView',
  'views/ResourceMasonryItemView',
  'collections/ResourceList',
  'jqueryMobile'
], function(G, U, Events, ResourceListView, ResourceMasonryItemView, ResourceList, $m) {
  return ResourceListView.extend({
    type: 'masonry',
    events: {
      'orientationchange': 'orientationchange',
      'resize': 'orientationchange'
    },

    getListItems: function() {
      return this.$('.nab');
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
      var o = ($(window).height() > $(window).width()) ? 'portrait' : 'landscape';
      Events.stopEvent(e);
      
      var prevWidth;
      if ($(window).height() > $(window).width()) {
        this.IMG_MAX_WIDTH = 272;
        prevWidth = 205;
      } 
      else {
        this.IMG_MAX_WIDTH = 205; // value of CSS rule: ".nab .anab .galleryItem_css3 img"      // resourceListView will call render on this element
        prevWidth = 272;
      }
      
      $('.nabBoard').attr('style', 'width:' + (this.IMG_MAX_WIDTH + 20) + 'px !important');
      $('.nab .anab .galleryItem_css3 img').attr('style', 'max-width:' + this.IMG_MAX_WIDTH + 'px !important');
      
      this.refresh(null, {orientation: o});
      this.$el.masonry('reload');
    },
    
    // masonry bricks alignment
    onAppend: function() {
      var hash = window.location.hash;
      if (hash.indexOf('make') == 1  ||  hash.indexOf('edit') == 1 || this.$el.width() == 0) {
        this.resumeScrollEventProcessing();
        return;
      }

      // masonry code works with DOM elements already inserted into a page
      // small timeout insures right bricks alignment
      var self = this;
      setTimeout(function() { 
        self.alignBricks(); 
      }, 50);
    },
    
    alignBricks: function(loaded) {
      // masonry is hidden
      var self = this;
      if (this.$el.width() == 0) {
        if (loaded) {
          this.$el.masonry('reload');
          return;
        }
        else {
          this.$el.load(function() {
            G.log(self.TAG, 'event', 'masonry on $el load');
            self.alignBricks(true);
          });
          return;
        }
      }
      
      var needToReload = false;
      // all bricks in masonry
      var $allBricks = $(this.$el.children());
      // new, unaligned bricks - items without 'masonry-brick' class
      var $newBricks = $allBricks.filter(function(idx, node) {
        var $next = $(node).next();
        var hasClass = $(node).hasClass("masonry-brick");
        
        // if current node does not have "masonry-brick" class but the next note has
        // then need to reload/reset bricks
        if ($next.length &&
            !hasClass && 
            $next.hasClass("masonry-brick"))
          needToReload = true;
        
        return !hasClass;
      });

      // if image(s) has width and height parameters then possible to align masonry
      // before inner images downloading complete. Detect it through image in 1st 'brick' 
      var img = $('img', $allBricks[0]);
//      var hasImgSize = (img.exist() && img.width.length > 0 && img.height.length > 0) ? true : false;
      var hasImgSize = (img.length && img.width() && img.height()) ? true : false;
      
      // 1. need to reload. happens on content refreshing from server
      if (needToReload) {
        this.$el.masonry('reload');
        if (hasImgSize) {
          this.resumeScrollEventProcessing();
        }
        else  {
          this.$el.imagesLoaded( function(){ 
            self.$el.masonry('reload'); 
            self.resumeScrollEventProcessing(); 
          });
        }
          
        return;
      }
      
      //  2. initial bricks alignment because there are no items with 'masonry-brick' class   
      if ($allBricks.length != 0 && $allBricks.length == $newBricks.length) {
        if (hasImgSize) {
          this.$el.masonry();
          this.resumeScrollEventProcessing();
        }
        else {  
          this.$el.imagesLoaded( function(){ 
            self.$el.masonry(); 
            self.resumeScrollEventProcessing(); 
          });
        }
        
        return;
      }
      
      // 3. nothing to align
      if ($newBricks.length == 0) {
        this.$el.masonry();
        return; // nothing to align
      }
     
      // 4. align new bricks, on next page, only
      // filter unaligned "bricks" which do not have calculated, absolute position 
      if (hasImgSize) {
        this.$el.masonry('appended', $newBricks);
        this.resumeScrollEventProcessing();
      }
      else {
        this.$el.imagesLoaded( function(){ 
          self.$el.masonry('appended', $newBricks); 
          self.resumeScrollEventProcessing(); 
        });
      }
      
      this.$el.trigger('create');      
    },
    
    postRender: function(info) {
      if (this.rendered) {
        this.$el.trigger('create');        
        this.alignBricks();
      }
      else {
        Events.on('pageChange', function(previousView, currentView) {
          if (currentView !== this.pageView)
            return;

          this.alignBricks();
        }.bind(this));
      }
    }

  }, {
    displayName: "ResourceListMasonryView"
  });
});