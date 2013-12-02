'use strict';
define('views/HorizontalListView', [
  'globals',
  'utils',
  'events',
  'views/ResourceListView',
  'views/HorizontalListItemView',
  'views/mixins/Scrollable',
  'views/mixins/LazyImageLoader'
], function(G, U, Events, ResourceListView, HorizontalListItemView, Scrollable, LazyImageLoader) {
  var mixins = [Scrollable];
  if (G.lazifyImages)
    mixins.unshift(LazyImageLoader);
  
  return ResourceListView.extend({
    mixins: mixins,
    _renderedIntersectionUris: null,
    _scrollableOptions: {
      axis: 'X',
      keyboard: false
    },
    _horizontal: true,
    _visible: false,
    _elementsPerPage: 6,
    className: 'thumbnail-gallery',

    events: {
      'scrollo.horizontalListView': 'onScroll',
      'scrollosize.horizontalListView': '_onScrollerSizeChanged',
      'scrolloable.horizontalListView': '_onScrollerScrollable'
    },
    
    _onScrollerSizeChanged: function(e) {
      if (e.target == this.el)
        ResourceListView.prototype._onScrollerSizeChanged.apply(this, arguments);
    },

    initialize: function(options) {
//      _.bindAll(this, 'renderItem');
      ResourceListView.prototype.initialize.apply(this, arguments);
      _.extend(this._masonryOptions, {
        horizontal: true, 
        oneElementPerRow: false,
        oneElementPerCol: true,
        stretchRow: false,
        stretchCol: false
      });
      
      this._renderedIntersectionUris = [],
      _.extend(this, options);
    },

    refresh: function() {
      this._renderedIntersectionUris.length = 0;
      return ResourceListView.prototype.refresh.apply(this, arguments);
    },
    
    preRender: function() {
      try {
        if (!this._prerendered) {
          var source = this.parentView.resource,
              vocModel = this.vocModel,
              first = this.collection.models[0];
          
          this.isIntersection = U.isA(vocModel, 'Intersection');
          this._isIntersectingWithCollection = source && 
                                               this.isIntersection && 
                                               source.vocModel.type == U.getTypeUri(first.get('Intersection.a') || first.get('Intersection.b'));
        }
      } finally {
        return ResourceListView.prototype.preRender.apply(this, arguments);
      }    
    },
    
    getPageTag: function() {
      return 'div';
    },

    setPageAttributes: function(el) {
      el.style.display = 'inline-block';
    },

    _updateConstraints: function() {
      ResourceListView.prototype._updateConstraints.call(this);
      if (this._viewportDim) {
        if (G.browser.mobile && this._viewportDim < 500)
          this._elementsPerPage = 4;
        else
          this._elementsPerPage = 10;
      }
    },

    preinitializeItem: function(res) {
      var source = this.parentView.resource;
      return HorizontalListItemView.preinitialize({
        vocModel: this.vocModel,
        parentView: this,
        source: source && source.getUri()
      });
    },
    
    renderItem: function(res, info) {
      var source = this.parentView.resource,
          xUris = this._renderedIntersectionUris,
          a,
          b;

      source = source && source.getUri();
      if (this._isIntersectingWithCollection) {
        a = res.get('Intersection.a');
        b = res.get('Intersection.b');
        if ((source == a && ~xUris.indexOf(b)) ||
            (source == b && ~xUris.indexOf(a))) {
          // if we're in a resource view and are showing intersections with this resource, there may be cases like Friend where there are two intersections to represent the relationship. In that case, only paint one (to avoid having two of the same image) 
          return false;
        }
      }
      
      var liView = new this._preinitializedItem({
        resource: res
      });
      
      var rendered = liView.render(this._itemRenderOptions);
      if (rendered === false)
        return false;
            
      if (this._isIntersectingWithCollection) {
        if (source !== a)
          xUris.push(a);
        if (source !== b)
          xUris.push(b);
      }
      
      this.addChild(liView);
      return liView;
    },
    
    postRender: function() {
      if (!this._visible) {
        this._visible = true;
        this.el.dataset.viewid = this.cid;
        this.$el.trigger("create");
      }
      
      return ResourceListView.prototype.postRender.apply(this, arguments);
    }
  }, {
    displayName: "HorizontalListView",
    _itemView: HorizontalListItemView
  });
});