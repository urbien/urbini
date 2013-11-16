'use strict';
define('views/mixins/Masonry', [
  'globals', 
  'underscore', 
  'utils', 
  'events', 
  'lib/fastdom', 
  'hammer'
], function(G, _, U, Events, Q) {
  
  // ADAPTED FROM:
  /**
   * jQuery Masonry v2.1.06
   * A dynamic layout plugin for jQuery
   * The flip-side of CSS Floats
   * http://masonry.desandro.com
   *
   * Licensed under the MIT license.
   * Copyright 2012 David DeSandro
   */

  var DEFAULT_SETTINGS = {
    isResizable: true,
    isAnimated: false,
    animationOptions: {
      queue: false,
      duration: 500
    },
    gutterWidth: 0,
    isRTL: false,
    isFitWidth: false,
    containerStyle: {
      position: 'relative'
    },
    itemSelector: '.nab'
  };
  
  var Masonry = Backbone.Mixin.extend({
    className: 'masonry',
    windowEvents: {
      'resize': 'resizeMasonry'
    },
    initialize: function(options) {
      this.options = $.extend(true, {}, DEFAULT_SETTINGS, options);
      _.bindAll(this, 'resizeMasonry');
    },
    
    masonry: function(options) {      
      this._createMasonry(options);
      this._initMasonry();
    },
    
    _filterFindBricks: function(elems) {
      var selector = this.options.itemSelector;
      // if there is a selector
      // filter/find appropriate item elements
      if (!selector)
        return elems;
      
      var matches = [],
          i = elems.length;
      
      while (i--) {
        var el = elems[i];
        if (el.$matches(selector))
          matches.push(el);
      }
      
      i = elems.length;
      while (i--) {
        elems[i].$(selector).$forEach(function(innerMatch) {
          matches.push(innerMatch);
        });
      }
      
      return matches;
    },

    _getBricks: function( elems ) {
      var bricks = this._filterFindBricks( elems ),
          i = bricks.length;
      
      while (i--) {
        bricks[i].$css({ position: 'absolute' })
                 .$addClass('masonry-brick');
      }
        
      return bricks;
    },
    
    // sets up widget
    _createMasonry: function(options) {
      $.extend(true, this.options, options);
      this.styleQueue = [];

      // get original styles in case we re-apply them in .destroy()
      var elemStyle = this.el.style;
      this.originalStyle = {
        // get height
        height: elemStyle.height || ''
      };
      // get other styles that will be overwritten
      var containerStyle = this.options.containerStyle;
      for ( var prop in containerStyle ) {
        this.originalStyle[ prop ] = elemStyle[ prop ] || '';
      }

      this.el.$css( containerStyle );

      this.horizontalDirection = this.options.isRTL ? 'right' : 'left';

      var x = this.el.$css( 'padding-' + this.horizontalDirection );
      var y = this.el.$css( 'padding-top' );
      this.offset = {
        x: x ? parseInt( x, 10 ) : 0,
        y: y ? parseInt( y, 10 ) : 0
      };
      
      this.isFluid = this.options.columnWidth && typeof this.options.columnWidth === 'function';

      // add masonry class first time around
//      var instance = this;
//      setTimeout(function() {
//        instance.el.$addClass('masonry');
//      }, 0);
      
      // need to get bricks
      this.reloadBricks();
    },
  
    // _init fires when instance is first created
    // and when instance is triggered again -> $el.masonry();
    _initMasonry: function( callback ) {
      this._getColumns();
      this._reLayoutMasonry( callback );
    },

    option: function( key, value ){
      // set options AFTER initialization:
      // signature: $('#foo').bar({ cool:false });
      if ( $.isPlainObject( key ) ){
        this.options = $.extend(true, this.options, key);
      } 
    },
    
    // ====================== General Layout ======================

    // used on collection of atoms (should be filtered, and sorted before )
    // accepts atoms-to-be-laid-out to start with
    layoutMasonry: function( bricks, callback ) {

      // place each brick
      for (var i=0, len = bricks.length; i < len; i++) {
        this._placeBrick( bricks[i] );
      }
      
      // set the size of the container
      var containerSize = {};
      containerSize.height = Math.max.apply( Math, this.colYs );
      if ( this.options.isFitWidth ) {
        var unusedCols = 0;
        i = this.cols;
        // count unused columns
        while ( --i ) {
          if ( this.colYs[i] !== 0 ) {
            break;
          }
          unusedCols++;
        }
        // fit container to columns that have been used;
        containerSize.width = (this.cols - unusedCols) * this.columnWidth - this.options.gutterWidth;
      }
      this.styleQueue.push({ $el: this.el, style: containerSize + 'px' });

      // are we animating the layout arrangement?
      // use plugin-ish syntax for css or animate
//      var styleFn = !this.isLaidOut ? '$css' : (
//            this.options.isAnimated ? '$animate' : '$css'
//          ),
//          animOpts = this.options.animationOptions;

      // process styleQueue
      var obj;
      for (i=0, len = this.styleQueue.length; i < len; i++) {
        obj = this.styleQueue[i];
//        obj.$el[ styleFn ]( obj.style, animOpts );
        obj.$el.$css(obj.style);
      }

      // clear out queue for next time
      this.styleQueue = [];

      // provide elems as context for the callback
      if ( callback ) {
        callback.call( bricks );
      }
      
      this.isLaidOut = true;
    },
    
    // calculates number of columns
    // i.e. this.columnWidth = 200
    _getColumns : function() {
      var container = this.options.isFitWidth ? this.$el.parent() : this.$el,
          containerWidth = container.width();

                         // use fluid columnWidth function if there
      this.columnWidth = this.isFluid ? this.options.columnWidth( containerWidth ) :
                    // if not, how about the explicitly set option?
                    this.options.columnWidth ||
                    // or use the size of the first item
                    $(this.bricks).outerWidth(true) ||
                    // if there's no items, use size of container
                    containerWidth;

      this.columnWidth += this.options.gutterWidth;

      this.cols = Math.floor( ( containerWidth + this.options.gutterWidth ) / this.columnWidth );
      this.cols = Math.max( this.cols, 1 );

    },

    // layout logic
    _placeBrick: function( brick ) {
      var $brick = $(brick),
          colSpan, groupCount, groupY, groupColY, j;

      //how many columns does this brick span
      colSpan = Math.ceil( $brick.outerWidth(true) / this.columnWidth );
      colSpan = Math.min( colSpan, this.cols );

      if ( colSpan === 1 ) {
        // if brick spans only one column, just like singleMode
        groupY = this.colYs;
      } else {
        // brick spans more than one column
        // how many different places could this brick fit horizontally
        groupCount = this.cols + 1 - colSpan;
        groupY = [];

        // for each group potential horizontal position
        for ( j=0; j < groupCount; j++ ) {
          // make an array of colY values for that one group
          groupColY = this.colYs.slice( j, j+colSpan );
          // and get the max value of the array
          groupY[j] = Math.max.apply( Math, groupColY );
        }

      }

      // get the minimum Y value from the columns
      var minimumY = Math.min.apply( Math, groupY ),
          shortCol = 0;
      
      // Find index of short column, the first from the left
      for (var i=0, len = groupY.length; i < len; i++) {
        if ( groupY[i] === minimumY ) {
          shortCol = i;
          break;
        }
      }

      // position the brick
      var position = {
        top: minimumY + this.offset.y + 'px'
      };
      // position.left or position.right
      position[ this.horizontalDirection ] = this.columnWidth * shortCol + this.offset.x + 'px';
      this.styleQueue.push({ $el: brick, style: position });

      // apply setHeight to necessary columns
      var setHeight = minimumY + $brick.outerHeight(true),
          setSpan = this.cols + 1 - len;
      for ( i=0; i < setSpan; i++ ) {
        this.colYs[ shortCol + i ] = setHeight;
      }

    },
    
    
    resizeMasonry: function() {
      var prevColCount = this.cols;
      // get updated colCount
      this._getColumns();
      if ( this.isFluid || this.cols !== prevColCount ) {
        // if column count has changed, trigger new layout
        this._reLayoutMasonry();
      }
    },
    
    
    _reLayoutMasonry : function( callback ) {
      // reset columns
      var i = this.cols;
      this.colYs = [];
      while (i--) {
        this.colYs.push( 0 );
      }
      // apply layout logic to all bricks
      this.layoutMasonry( this.bricks, callback );
    },
    
    // ====================== Convenience methods ======================
    
    // goes through all children again and gets bricks in proper order
    reloadBricks: function() {
      this.bricks = this._getBricks( this.el.childNodes );
    },
    
    
    _reloadMasonry: function( callback ) {
      this.reloadBricks();
      this._initMasonry( callback );
    },
    

    // convienence method for working with Infinite Scroll
    appendedBricks: function( content, isAnimatedFromBottom, callback ) {
      if ( isAnimatedFromBottom ) {
        // set new stuff to the bottom
        this._filterFindBricks( content ).css({ top: this.$el.height() });
        var instance = this;
        setTimeout( function(){
          instance._appendedBricks( content, callback );
        }, 1 );
      } else {
        this._appendedBricks( content, callback );
      }
    },
    
    _appendedBricks: function( content, callback ) {
      var $newBricks = this._getBricks( content );
      // add new bricks to brick pool
      this.bricks = Array.prototype.slice.call(this.bricks).concat($newBricks);
      this.layoutMasonry( $newBricks, callback );
    },
    
    removedContent: function(content) {
      this.bricks = _.difference(this.bricks, content);      
    },
    
    // removes elements from Masonry widget
    removeBricks: function( content ) {
      content.$remove();
      this.removedContent(content);
    }
//    ,
//    
//    // destroys widget, returns elements and container back (close) to original style
//    destroy : function() {
//      this.$bricks
//        .$removeClass('masonry-brick')
//        .$forEach(function(brick) {
//          brick.style.position = '';
//          brick.style.top = '';
//          brick.style.left = '';
//        });
//      
//      // re-apply saved container styles
//      var elemStyle = this.element[0].style;
//      for ( var prop in this.originalStyle ) {
//        elemStyle[ prop ] = this.originalStyle[ prop ];
//      }
//
//      this.element
//        .unbind('.masonry')
//        .removeClass('masonry');
//        .removeData('masonry');
//       
//      $(window).unbind('.masonry');
//    }
  });
  
  return Masonry;
});