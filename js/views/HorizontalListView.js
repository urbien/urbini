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
    _renderedUris: [],
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
      var uri = res.getUri();
      if (!this._preinitializedItem) {
        var source = this.parentView.resource;
        this._preinitializedItem = HorizontalListItemView.preinitialize({
          vocModel: this.vocModel,
          parentView: this,
          source: source && source.getUri()
        });
      }

      if (this._preinitializedItem.prototype.doesModelImplement('Intersection') && 
         (~this._renderedUris.indexOf(res.get('Intersection.a')) || ~this._renderedUris.indexOf(res.get('Intersection.b')))) {
        // avoid painting both sides of a single Intersection (like both Friend resources me->you and you->me)
        debugger;
        return;
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
            
      this._renderedUris.push(uri);
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