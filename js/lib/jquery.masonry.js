/**
 * jQuery Masonry v2.0.110517 beta
 * The flip-side of CSS Floats.
 * jQuery plugin that rearranges item elements to a grid.
 * http://masonry.desandro.com
 *
 * Licensed under the MIT license.
 * Copyright 2011 David DeSandro
 */

define('lib/jquery.masonry', ['globals', 'underscore', 'domUtils', 'lib/fastdom'], function(G, _, DOM, Q) {
  // ========================= Masonry ===============================

  var CSS = G.crossBrowser.css;
  
  // our "Widget" object constructor
  function Mason( options, element ){
    this.element = element;
    this._create( options );
    this._init();
  };

  function cleanData(bricks) {
    var i = bricks.length,
        data;
    
    while (i--) {
      data = bricks[i].dataset;
      delete data.outerWidth;
      delete data.outerHeight;
    }
  }
  
  function getXYZ(brick) {
    return DOM.parseTranslation(brick.style[CSS.transformLookup]);
  };
  
  // styles of container element we want to keep track of
  var masonryContainerStyles = [ 'position', CSS.transformLookup ];

  Mason.settings = {
    horizontal: false,
    oneElementPerCol: false,
    oneElementPerRow: false,
    fromBottom: false,
    isResizable: true,
    gutterWidth: 0,
//    isRTL: false, // only left to right is supported
    isFitWidth: false,
    containerStyle: {
      position: 'relative'
    }
  };

  Mason.prototype = {
    _getBricks: function() {
      return this.element.$(this.options.itemSelector).$slice();
    },
      
    // sets up widget
    _create: function( options ) {
  
      this.options = $.extend( true, {}, Mason.settings, options );
      this.originalFromBottom = this.options.fromBottom;
      this.styleQueue = [];
      // need to get bricks
      this.reloadItems();
  
  
      // get original styles in case we re-apply them in .destroy()
      var elemStyle = this.element.style;
      this.originalStyle = {};
      for ( var i=0, len = masonryContainerStyles.length; i < len; i++ ) {
        var prop = masonryContainerStyles[i];
        this.originalStyle[ prop ] = elemStyle[ prop ] || null;
      }
  
      this.element.$css(this.options.containerStyle);
      this.containerSize = {};
      
      // get top left position of where the bricks should be
      this.offset = {};
      
      var $element = $(this.element);
      var $cursor = $( document.createElement('div') ); 
      $element.prepend( $cursor );
      this.offset.y = Math.round( $cursor.position().top );
      // get horizontal offset
      $cursor.css({ 'float': 'right', display: 'inline-block'});
      this.offset.x = Math.round( $element.outerWidth() - $cursor.position().left );
      $cursor.remove();
  
      // add masonry class first time around
      var instance = this;
      setTimeout( function() {
        instance.element.$addClass('masonry');
      }, 0 );
  
      // bind resize method
//      if ( this.options.isResizable ) {
//        this._resizeEventHandler = this.resize.bind(this);
//        window.addEventListener('debouncedresize', this._resizeEventHandler);
//        //        this.bindDOMEvent(window, 'debouncedresize', );
//      }
  
    },
  
    // _init fires when your instance is first created
    // (from the constructor above), and when you
    // attempt to initialize the widget again (by the bridge)
    // after it has already been initialized.
    _init: function( callback ) {
  
      this.reLayout( callback );
  
    },
    
    getBounds: function() {
      return {
        min: Math.max.apply(Math, this.topColYs),
        max: Math.min.apply(Math, this.bottomColYs)
      }
    },
  
    option: function( key, value ){
  
      // get/change options AFTER initialization:
      // you don't have to support all these cases,
      // but here's how:
  
      // signature: $('#foo').bar({ cool:false });
      if ( $.isPlainObject( key ) ){
        this.options = $.extend(true, this.options, key);
  
        // signature: $('#foo').option('cool');  - getter
      } else if ( key && typeof value === "undefined" ){
        return this.options[ key ];
  
        // signature: $('#foo').bar('option', 'baz', false);
      } else {
        this.options[ key ] = value;
      }
  
      return this; // make sure to return the instance!
    },
  
    // ====================== General Layout ======================
  
    _calcContainerSize: function() {
      var containerSize = this.containerSize;
//    containerSize.height = Math.max.apply( Math, this.bottomColYs ) - Math.min.apply( Math, this.topColYs ) + 'px';
      containerSize.height = Math.max.apply( Math, this.bottomColYs ) - this.offset.y + 'px';
      if ( this.options.isFitWidth ) {
        containerSize.width = this.cols * this.columnWidth - this.options.gutterWidth + 'px';
      }
      
      return containerSize;
    },

    _resizeContainer: function() {
      var style = this.element.style;
      style.width = this.containerSize.width;
      style.height = this.containerSize.height;
    },

    // used on collection of atoms (should be filtered, and sorted before )
    // accepts atoms-to-be-laid-out to start with
    layout: function( bricks, callback ) {
//      if (this._inLimbo) {
//        var i = this.cols;
//        while (i--) {
//          this.topColYs[i] = -Infinity;
//          this.bottomColYs[i] = Infinity;
//        }
//        
//        this._recalcColYs(bricks);
//        this._inLimbo = false;
//      }
      
      // layout logic
      var brick, colSpan, groupCount, groupY, groupColY, j, 
      colYs = this._getColYs(), 
      extreme = this.options.fromBottom ? Math.min : Math.max;
  
      for (var i=0, len = bricks.length; i < len; i++) {
        brick = bricks[i];
        //how many columns does this brick span
        colSpan = Math.ceil( this._getOuterWidth(brick) / this.columnWidth );
        colSpan = Math.min( colSpan, this.cols );
  
        if ( colSpan === 1 ) {
          // if brick spans only one column, just like singleMode
          this._placeBrick( brick, this.cols, colYs );
        } else {
          // brick spans more than one column
          // how many different places could this brick fit horizontally
          groupCount = this.cols + 1 - colSpan;
          groupY = [];
  
          // for each group potential horizontal position
          for ( j=0; j < groupCount; j++ ) {
            // make an array of colY values for that one group
            groupColY = colYs.slice( j, j+colSpan );
            // and get the max value of the array
            groupY[j] = extreme.apply( Math, groupColY );
          }
  
          this._placeBrick( brick, groupCount, groupY );
        }
      }
  
      // set the size of the container
      // TODO: adjust this if necessary to take into account both sets of cols
      this._calcContainerSize();
      this.styleQueue.push({ el: this.element, style: this.containerSize });
  
      // process styleQueue
      var obj;
      for (i=0, len = this.styleQueue.length; i < len; i++) {
        obj = this.styleQueue[i];
        obj.el.$css(obj.style);
        for (var p in obj.data) {
          obj.el.dataset[p] = obj.data[p];
        }
        
        if (obj.className)
          obj.el.$addClass(obj.className);
      }
  
      // clear out queue for next time
      this.styleQueue = [];
  
      // provide elems as context for the callback
      if ( callback ) {
        callback.call( bricks );
      }
  
//      this.isLaidOut = true;
  
      return this;
    },
  
    // calculates number of columns
    // i.e. this.columnWidth = 200
    _getColumns: function() {
      if (this.options.oneElementPerRow) {
        this.columnWidth = this.containerSize.width = this.element.offsetWidth;
        this.cols = 1;
        return;
      }
      
      var container = this.options.isFitWidth ? this.element.parentNode : this.element,
          containerWidth = container.offsetWidth;
  
      this.columnWidth = this.options.columnWidth ||
                         // or use the size of the first item
                         this.bricks.length && this._getOuterWidth(this.bricks[0]) ||
                         // if there's no items, use size of container
                         containerWidth;
  
      this.columnWidth += this.options.gutterWidth;
  
      this.cols = Math.floor( ( containerWidth + this.options.gutterWidth ) / this.columnWidth );
      this.cols = Math.max( this.cols, 1 );
  
      return this;
    },
  
    _getColYs: function() {
      return this.options.fromBottom ? this.topColYs : this.bottomColYs;
    },
  
    _getOuterHeight: function( brick ) {
//      if (this.options.oneElementPerCol)
//        return this.containerSize.height;
//      else 
      if (brick.dataset.outerHeight)
        return parseInt(brick.dataset.outerHeight);
      
      var offsetHeight = brick.offsetHeight;
      if (!this.hasOwnProperty('_brickExtraHeight'))
        this._brickExtraHeight = $(brick).outerHeight(true) - offsetHeight;
  
      return (brick.dataset.outerHeight = offsetHeight + this._brickExtraHeight); 
    },
  
    _getOuterWidth: function( brick ) {
      if (this.options.oneElementPerRow)
        return this.containerSize.width;
      else if (brick.dataset.outerWidth)
        return parseInt(brick.dataset.outerWidth);
      
      var offsetWidth = brick.offsetWidth;
      if (!this.hasOwnProperty('_brickExtraWidth'))
        this._brickExtraWidth = $(brick).outerWidth(true) - offsetWidth;
  
      return (brick.dataset.outerWidth = offsetWidth + this._brickExtraWidth); 
    },
  
    _placeBrick: function( brick, setCount, setY ) {
      // get the minimum Y value from the columns
      var extreme = this.options.fromBottom ? Math.max : Math.min,
          extremeY  = extreme.apply( Math, setY ),
          multiplier = this.options.fromBottom ? -1 : 1,
          setHeight = extremeY + (this._getOuterHeight(brick) * multiplier),
          i = setY.length,
          shortCol  = i,
          setSpan   = this.cols + 1 - i,
          style     = {},
          colYs = this._getColYs();
  
      //    Which column has the min/max Y value, 
      //         closest to the left/right, 
      // based on if we're appending/prepending
      while (i--) {
        if ( setY[i] === extremeY ) {
          shortCol = i;
          if (this.options.fromBottom)
            break;
        }
      }
  
      // position the brick
      var top,
          left = this.columnWidth * shortCol + this.offset.x;
      
      if (this.options.fromBottom)
        top = setHeight - this.offset.y;
      else
        top = extremeY + this.offset.y;
      
      style[CSS.transformLookup] = DOM.positionToMatrix(top, left);
      style.opacity = 0.99999;
      this.styleQueue.push({ el: brick, style: style, data: {
        top: top,
        left: left
      }});
  
      // apply setHeight to necessary columns
      for ( i=0; i < setSpan; i++ ) {
        colYs[ shortCol + i ] = setHeight;
      }
  
    },
  
    resize: function() {
      var prevColCount = this.cols;
      // get updated colCount
      this._getColumns('masonry');
      if ( this.cols !== prevColCount ) {
        // if column count has changed, do a new column cound
        this._reloadLayout();
      }
    },
  
  
    reLayout: function( callback ) {
      this._getColumns('masonry');
      this._reloadLayout( callback );
    },
  
    _reloadLayout: function( callback ) {
      // reset columns
      this.options.fromBottom = this.originalFromBottom;
      this._resetColYs();
      
      // apply layout logic to all bricks
      this.layout( this.bricks, callback );
    },
  
    _resetColYs: function() {
      var i = this.cols;
      if (!this.topColYs)
        this.topColYs = new Array(i);
      if (!this.bottomColYs)
        this.bottomColYs = new Array(i);
      
      while (i--) {
        this.topColYs[i] = this.offset.y;
        this.bottomColYs[i] = this.offset.y;
      }
      
      this.topColYs.length = this.bottomColYs.length = this.cols;
    },
    
    // ====================== Convenience methods ======================
  
    // goes through all children again and gets bricks in proper order
    reloadItems: function() {
      this.bricks = this._getBricks();
    },
  
    setOffset: function(offset) {
      var top = this.topColYs,
          bottom = this.bottomColYs,
          i = this.cols;
      
      while (i--) {
        top[i] = offset;
        bottom[i] = offset;
      }
    },
    
    reload: function( callback ) {
      this.reloadItems();
      this.reLayout( callback );
    },
  
    appended: function( content, callback, contentIsBricks ) {
      this.options.fromBottom = false;
      this._appended.apply(this, arguments);    
    },
  
    prepended: function(content, callback, contentIsBricks) {
      this.options.fromBottom = true;
      return this._appended.apply(this, arguments);
    },
  
    // convienence method for working with Infinite Scroll
    _appended: function( newBricks, callback ) {
      // add new bricks to brick pool
      this.bricks = this.options.fromBottom ? newBricks.concat(this.bricks) : this.bricks.concat( newBricks );
      this.layout( newBricks, callback );
    },
  
    _getLeftmostColumn: function(brick) {
      var offset = parseInt(getXYZ(brick).X, 10) || 0;
      var edgeCol = Math.round(offset / this.columnWidth);
      return edgeCol;
    },
    
    _getColSpan: function(brick) {
      var colSpan = Math.ceil( this._getOuterWidth(brick) / this.columnWidth );
      return Math.min( colSpan, this.cols );
    },

    _recalcColYs: function() {
      if (!this.bricks.length) {
        this._resetColYs();
        return;
      }
      
      var bricks = this.bricks,
          brick,
          fromCol,
          offset = this.offset.y,
          topColYs = this.bottomColYs.slice(),
          bottomColYs = this.topColYs.slice(),
          cols = this.cols,
          col,
          top,
          height,
          i = bricks.length;

      while (i--) {
        brick = bricks[i];
        fromCol = this._getLeftmostColumn(brick);
        colSpan = this._getColSpan(brick);
        height = this._getOuterHeight(brick);
//        top = parseInt(brick.style.top, 10) || 0;
        top = parseInt(getXYZ(brick).Y, 10) || 0;
        while (colSpan--) {
          col = fromCol + colSpan;
          topColYs[col] = Math.min(top, topColYs[col]);
          bottomColYs[col] = Math.max(top + height, bottomColYs[col]);
        }
      }
    
      this.topColYs = topColYs;
      this.bottomColYs = bottomColYs;
    },

    removed: function(bricks, removeFromDOM) {
      cleanData(bricks);
      
      this.bricks = _.difference(this.bricks, bricks);
      if (removeFromDOM) {
        i = content.length;
        while (i--) {
          content[i].$remove();
        }
      }
      
      this._recalcColYs();
      this._resizeContainer();
    },
        
    // removes elements from Masonry widget
    removedBricks: function(bricks, removeFromDOM) {
      this.bricks = _.difference(this.bricks, bricks);
      cleanData(bricks);
      if (removeFromDOM) {
        var i = bricks.length;
        while (i--) {
          bricks[i].$remove();
        }
      }
      
      this._recalcColYs();
      this._resizeContainer();
    }
//    ,
//  
//    // destroys widget, returns elements and container back (close) to original style
//    destroy: function() {
//      var bricks = this.bricks,
//          brick,
//          style,
//          i = bricks.length;
//  
//      while (i--) {
//        brick = bricks[i];
//        style = brick.style;
//        brick.classList.remove('masonry-brick');
//        brick.style[CSS.transformLookup] = DOM.identityTransformString;
////        style.position = style.top = style.left = '';
//      }
//  
//      // re-apply saved container styles
//      var elemStyle = this.element.style;
//      for ( var i=0, len = masonryContainerStyles.length; i < len; i++ ) {
//        var prop = masonryContainerStyles[i];
//        elemStyle[ prop ] = this.originalStyle[ prop ];
//      }
//  
//      this.element.$removeClass('masonry');
//      window.removeEventListener('debouncedresize', this._resizeEventHandler);
//    }
  };

  return Mason;  
});
