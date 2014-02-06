'use strict';
define('views/HorizontalListView', [
  'globals',
  'utils',
  'events',
  'views/ResourceListView',
  'views/HorizontalListItemView',
//  'views/mixins/Scrollable',
  'views/mixins/LazyImageLoader',
  'domUtils'
], function(G, U, Events, ResourceListView, HorizontalListItemView, LazyImageLoader, DOM) {
  var mixins = [];
  if (G.lazifyImages)
    mixins.unshift(LazyImageLoader);
  
  return ResourceListView.extend({
    mixins: mixins,
    className: 'thumb-gal',
//    _renderedIntersectionUris: null,
//    _scrollableOptions: {
//      axis: 'X',
//      keyboard: false
//    },
//    _flexigroup: true,
    style: {
      visibility: 'hidden',
      opacity: 0,
      height:'115px', // 150 + 5 for scrollbar
      perspective: '300px'
//          ,
//        'padding-top': '3px'
    },
      
//    _horizontal: true,
    _dragAxis: 'x',
    _scrollAxis: 'x',
    _visible: false,
    _elementsPerPage: 6,

    initialize: function(options) {
//      _.bindAll(this, 'renderItem');
      ResourceListView.prototype.initialize.apply(this, arguments);
      _.extend(this.options, {
        horizontal: true, 
        gutterWidthHorizontal: 5,
        gutterWidthVertical: 0,
        tilt: false,
//        squeeze: true,
        scrollerType: 'horizontal',
        oneElementPerRow: false,
        oneElementPerCol: true,
        stretchRow: false,
        stretchCol: false
      });
      
      delete this.options['gutterWidth'];
//      this._renderedIntersectionUris = [],
      _.extend(this, options);
    },

//    refresh: function() {
//      this._renderedIntersectionUris.length = 0;
//      return ResourceListView.prototype.refresh.apply(this, arguments);
//    },
    
    preRender: function() {
      try {
        if (!this._prerendered) {
          var source = this.parentView.resource,
              vocModel = this.vocModel,
              first = this.collection.models[0];
          
          this.isIntersection = U.isA(vocModel, 'Intersection');
//          this._isIntersectingWithCollection = source && 
//                                               this.isIntersection && 
//                                               source.vocModel.type == U.getTypeUri(first.get('Intersection.a') || first.get('Intersection.b'));
        }
      } finally {
        return ResourceListView.prototype.preRender.apply(this, arguments);
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
//          xUris = this._renderedIntersectionUris,
          a,
          b;

      source = source && source.getUri();
//      if (this._isIntersectingWithCollection) {
//        a = res.get('Intersection.a');
//        b = res.get('Intersection.b');
//        if ((source == a && ~xUris.indexOf(b)) ||
//            (source == b && ~xUris.indexOf(a))) {
//          // if we're in a resource view and are showing intersections with this resource, there may be cases like Friend where there are two intersections to represent the relationship. In that case, only paint one (to avoid having two of the same image) 
//          return false;
//        }
//      }
      
      var liView = new this._preinitializedItem({
        resource: res
      });
      
      liView.render(this._itemRenderOptions);
//      if (rendered === false)
//        debugger;
//        return false;
            
//      if (this._isIntersectingWithCollection) {
//        if (source !== a)
//          xUris.push(a);
//        if (source !== b)
//          xUris.push(b);
//      }
      
      this.addChild(liView);
      return liView;
    },
    
    postRender: function() {
      if (!this._visible) {
        this.setStyle({
          opacity: this.getMaxOpacity(),
          visibility: null
        });
        
        this._visible = true;
        this.el.dataset.viewid = this.cid;
//        this.el.style.height = '150px';
        if (G.isJQM())
          this.$el.trigger("create");
        
        this.parentView.invalidateSize();
      }
      
      return ResourceListView.prototype.postRender.apply(this, arguments);
    }
  }, {
    displayName: "HorizontalListView",
    _itemView: HorizontalListItemView
  });
});