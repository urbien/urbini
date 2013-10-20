'use strict';
define('views/HorizontalListView', [
  'globals',
  'utils',
  'events',
  'views/ResourceListView',
  'views/HorizontalListItemView',
  'views/mixins/Scrollable'
], function(G, U, Events, ResourceListView, HorizontalListItemView, Scrollable) {
  return ResourceListView.extend({
    mixins: [Scrollable],
    _scrollableOptions: {
      axis: 'X'
    },
    _horizontal: true,
    _visible: false,
    _elementsPerPage: 6,
    className: 'thumbnail-gallery',
    events: {
      'orientationchange': 'refresh',
      'resize': 'refresh',
      'refresh': 'refresh'
    },

    initialize: function(options) {
//      _.bindAll(this, 'renderItem');
      ResourceListView.prototype.initialize.apply(this, arguments);
      _.extend(this, options);
    },
    
    getPageTag: function() {
      return 'div';
    },

    getPageAttributes: function() {
      return 'style="display:inline-block;"';
    },

    renderItem: function(res, info) {
      if (!this._preinitializedItem) {
        this._preinitializedItem = HorizontalListItemView.preinitialize({
          vocModel: this.vocModel,
          parentView: this
        });
      }
      
      var liView = new this._preinitializedItem({
        resource: res
      });
      
      var rendered = liView.render({
        force: true,
        renderToHtml: true
      });
      
      if (rendered === false)
        return false;
            
      this.addChild(liView);
      return liView;
    },
    
    postRender: function() {
      if (!this._visible) {
        this._visible = true;
        this.el.dataset.viewid = this.cid;
        this.$el.removeClass("hidden")
                .trigger("create");
      }
    }
  }, {
    displayName: "HorizontalListView"
  });
});