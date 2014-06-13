/**
 * Adapted for PhysicsJS
 * 
 * jQuery Masonry v2.0.110517 beta
 * The flip-side of CSS Floats.
 * jQuery plugin that rearranges item elements to a grid.
 * http://masonry.desandro.com
 *
 * Licensed under the MIT license.
 * Copyright 2011 David DeSandro
 */

(function(root, Physics) {
  // ========================= Masonry ===============================

  var ArrayProto = Array.prototype;
  var slice = ArrayProto.slice;
  var concat = ArrayProto.concat;
  function difference(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return array.filter(function(value){ return rest.indexOf(value) == -1; });
  }
  
//  function intersection(a, b) {
//    var common = [],
//        id,
//        idInt;
//    
//    for (var i = 0; i < a.length; i++) {
//      id = a[i]._id;
//      idInt = parseInt(a[i]._id.match(/\d+/)[0]);
//      for (var j = 0; j < b.length; j++) {
//        if (id == b[j]._id || idInt == parseInt(b[j]._id.match(/\d+/)[0]))
//          common.push([i, j, id]);
//      }      
//    }
//    
//    return common;
//  };
  
  function getAxis(idx) {
    return idx == 0 ? 'x' : 
            idx == 1 ? 'y' : 'z';
  };
  
  function getBrickCoord(brick, idx) {
    brick = brick._rail ? brick._rail.railBody : brick;
    if (brick._masonryPos)
      return brick._masonryPos[getAxis(idx)];
    else
      return brick.state.pos.get(idx);
  }

  // our "Widget" object constructor
  function Mason( options, bricks ){
    this.flexigroup = options.flexigroup;
    this.bricks = bricks || [];
    this._create( options );
    if (this.bricks.length)
      this._init();
  };

  Mason.settings = {
    horizontal: false,
    oneElementPerCol: false,
    oneElementPerRow: false,
    stretchRow: false,
    stretchCol: false,
    fromBottom: false,
    isResizable: true,
    gutterWidthHorizontal: 0,
    gutterWidthVertical: 0
  };

  Mason.prototype = {
    // sets up widget
    _create: function( options ) {        
      this.options = Physics.util.extend( {}, Mason.settings, options );
        
      this.axis = this.options.horizontal ? 'x' : 'y';
      this.axisIdx = this.options.horizontal ? 0 : 1;
      this.orthoAxisIdx = this.axisIdx ^ 1;
      this.aabbAxisDim = this.options.horizontal ? '_hw' : '_hh';
      this.aabbOrthoAxisDim = this.options.horizontal ? '_hh' : '_hw';
      this.initialAxisOffset = this.flexigroup ? this.flexigroup.state.pos.get(this.axisIdx) : 0;
//      this.AXIS = this.axis.toUpperCase();
      this.originalFromBottom = this.options.fromBottom;
      this.setBounds(options.bounds);
    },
  
    // _init fires when your instance is first created
    // (from the constructor above), and when you
    // attempt to initialize the widget again (by the bridge)
    // after it has already been initialized.
    _init: function() {
      this.reLayout();
      this._initialized = true;
    },

    setBounds: function(bounds) {
      this.bounds = bounds;
      this.offset = {
        x: this.bounds._pos.get(0) - this.bounds._hw,
        y: this.bounds._pos.get(1) - this.bounds._hh
      };
    },
    
    getContentBounds: function() {
      return this.topColYs ? {
        min: Math.min.apply(Math, this.topColYs),
        max: Math.max.apply(Math, this.bottomColYs)
      } : {
        min: this.offset[this.axis],
        max: this.offset[this.axis]
      }
    },

    _getOffsetDueToFlexigroup: function() {
      if (this.options.flexigroup)
        return this.flexigroup.state.pos.get(this.axisIdx) - this.initialAxisOffset;
      else
        return 0;
    },
  
    option: function( key, value ){
  
      // get/change options AFTER initialization:
      // you don't have to support all these cases,
      // but here's how:
  
      // signature: $('#foo').bar({ cool:false });
      if ( Physics.util.isObject( key ) ){
        this.options = Physics.util.extend({}, this.options, key);
  
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
        
    // used on collection of atoms (should be filtered, and sorted before )
    // accepts atoms-to-be-laid-out to start with
    layout: function( bricks ) {
      var self = this,
          brick, colSpan, groupCount, groupY, groupColY, j, 
          colYs = this._getColYs(), 
          extreme = this.options.fromBottom ? Math.min : Math.max;
  
//      for (var i=0, len = bricks.length; i < len; i++) {
      Physics.util.loop(bricks, function(brick) {        
        // how many columns does this brick span
        colSpan = self._getColSpan(brick);
  
        if ( colSpan === 1 ) {
          // if brick spans only one column, just like singleMode
          self._placeBrick( brick, self.cols, colYs );
        } else {
          // brick spans more than one column
          // how many different places could this brick fit horizontally
          groupCount = self.cols + 1 - colSpan;
          groupY = [];
  
          // for each group potential horizontal position
          for ( j=0; j < groupCount; j++ ) {
            // make an array of colY values for that one group
            groupColY = colYs.slice( j, j+colSpan );
            // and get the max value of the array
            groupY[j] = extreme.apply( Math, groupColY );
          }
  
          self._placeBrick( brick, groupCount, groupY );
        }
      }, this.options.fromBottom);
    },
  
    // _calcBrickMargin: function() {
      // if (!this.hasOwnProperty('_brickMarginX') && this.bricks.length) {
        // var brick = this.bricks[0].view;
        // this._brickMarginY = outerHeight(brick, true) - brick.offsetHeight;
        // this._brickMarginX = outerHeight(brick, true) - brick.offsetWidth;
        // this._calcOuterDimensions(brick);
      // }
    // },
    
    getGutterWidth: function(ortho) {
      if (this.options.horizontal && ortho || (!this.options.horizontal && !ortho))
        return this.options.gutterWidthVertical;
      else
        return this.options.gutterWidthHorizontal;
    },
    
    // calculates number of columns
    // i.e. this.alleyDim = 200
    _getColumns: function() {
      if (this.options.oneElementPerRow || this.options.stretchRow) {
        this.alleyDim = this.bounds._hw * 2 - this.getGutterWidth(true);
        this.cols = 1;
        return;
      }
      else if (this.options.oneElementPerCol || this.options.stretchCol) {
        this.alleyDim = this.bounds._hh * 2 - this.getGutterWidth(true);
        this.cols = 1;
        return;
      }
      
      var brick = this.bricks[0],
          dimensionMethod = this.options.horizontal ? '_getOuterHeight' : '_getOuterWidth',
          containerDim = this.options.horizontal ? this.bounds._hh * 2 : this.bounds._hw * 2;
  
      // this._calcBrickMargin();
      this.alleyDim = this.options.alleyDim ||
                         // or use the size of the first item
                         this[dimensionMethod](brick) ||
                         // if there's no items, use size of container
                         containerDim;
  
      this.alleyDim += this.getGutterWidth(true);
  
      this.cols = Math.floor( ( containerDim - this.getGutterWidth(true) ) / this.alleyDim );
      if (isNaN(this.cols)) {
        debugger;
        this.cols = 1;
      }
      
      this.cols = Math.max( this.cols, 1 );
  
      return this;
    },
  
    _getColYs: function() {
      return this.options.fromBottom ? this.topColYs : this.bottomColYs;
    },
  
    _getOuterWidth: function(brick) {
      // return parseFloat(brick.view.dataset.outerWidth);
      if (brick.geometry._aabb)
        return brick.geometry._aabb._hw * 2;
      else
        return brick.aabb().halfWidth * 2;
    },

    _getOuterHeight: function(brick) {
      // return parseFloat(brick.view.dataset.outerHeight);
      if (brick.geometry._aabb)
        return brick.geometry._aabb._hh * 2;
      else
        return brick.aabb().halfHeight * 2;
    },

    _placeBrick: function( brick, setCount, setY ) {
      // get the minimum Y value from the columns
      var view = brick.view,
          dimensionMethod = this.options.horizontal ? '_getOuterWidth' : '_getOuterHeight',
          extreme = this.options.fromBottom ? Math.max : Math.min,
          extremeDepth  = extreme.apply( Math, setY ),
          multiplier = this.options.fromBottom ? -1 : 1,
          setHeight = extremeDepth + multiplier * (this[dimensionMethod](brick) + this.getGutterWidth()),
          i = setY.length,
          shortCol  = i,
          setSpan   = this.cols + 1 - i,
          style     = {},
          colYs = this._getColYs(),
          lock;
  
      //    Which column has the min/max Y value, 
      //         closest to the left/right, 
      // based on if we're appending/prepending
      while (i--) {
        if ( setY[i] === extremeDepth ) {
          shortCol = i;
          if (this.options.fromBottom)
            break;
        }
      }
  
      // position the brick
      var top,
          left;
      
      if (this.options.horizontal) {        
        top = this.getGutterWidth(true) + this.alleyDim * shortCol + /*this.offset.y +*/ brick.geometry._aabb._hh; // alleyDim includes gutterWidth
        
        if (this.options.fromBottom)
          left = extremeDepth /*- this.offset.x*/ - brick.geometry._aabb._hw + this._getOffsetDueToFlexigroup();
        else
          left = extremeDepth /*+ this.offset.x*/ + brick.geometry._aabb._hw + this._getOffsetDueToFlexigroup();
      }
      else {
        left = this.getGutterWidth(true) + this.alleyDim * shortCol + this.offset.x + brick.geometry._aabb._hw; // alleyDim includes gutterWidth
      
        if (this.options.fromBottom)
          top = extremeDepth /*- this.offset.y*/ - brick.geometry._aabb._hh + this._getOffsetDueToFlexigroup();
        else
          top = extremeDepth /*+ this.offset.y*/ + brick.geometry._aabb._hh + this._getOffsetDueToFlexigroup();
      }

//      console.log("adding " + brick.options._id + " (" + brick.geometry._aabb._hw * 2, "x", brick.geometry._aabb._hh * 2, ") brick at (" + left + ", " + top + ")");
//      brick.state.pos.set(left, top, getBrickCoord(brick, 2));
      brick.stop(left, top, getBrickCoord(brick, 2));
      if (this.flexigroup)
        brick._masonryPos = brick.state.pos.values();
      
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
  
//    reset: function(bricks) {
//      this._resetColYs();
//      if (bricks) {
//        this.bricks = bricks;
//        this.reLayout();
//      }
//      else
//        this.bricks.length = 0;
//    },
    
    reLayout: function() {
      if (this.bricks.length) {
        this._getColumns('masonry');
        this._reloadLayout();
      }
    },
  
    _reloadLayout: function() {
      // reset columns
      this.options.fromBottom = this.originalFromBottom;
      this._resetColYs();
      
      // apply layout logic to all bricks
      this.layout( this.bricks );
    },
  
    _resetColYs: function() {
      var i = this.cols,
          offset = this.offset[this.axis];
      
      if (!this.topColYs)
        this.topColYs = new Array(i);
      
      if (!this.bottomColYs)
        this.bottomColYs = new Array(i);
      
      while (i--) {
        this.topColYs[i] = offset;
        this.bottomColYs[i] = offset + this.getGutterWidth();
      }
      
      this.topColYs.length = this.bottomColYs.length = this.cols;
    },
    
    // ====================== Convenience methods ======================
  
    // goes through all children again and gets bricks in proper order
    // reloadItems: function() {
      // this.bricks = this._getBricks();
    // },
  
    setOffset: function(offset) {
      var top = this.topColYs,
          bottom = this.bottomColYs,
          i = this.cols;
      
      while (i--) {
        top[i] = offset;
        bottom[i] = offset;
      }
    },
    
    reload: function(offset) {
      // this.reloadItems();
      if (offset)
        this.offset = offset;
      
      this.reLayout();
    },
  
    appended: function( content ) {
      this.options.fromBottom = false;
      this._appended.apply(this, arguments);    
    },
  
    prepended: function(content) {
      this.options.fromBottom = true;
      return this._appended.apply(this, arguments);
    },
  
    // convienence method for working with Infinite Scroll
    _appended: function( newBricks ) {
      // add new bricks to brick pool
//      var common = intersection(this.bricks, newBricks);
      this.bricks = this.options.fromBottom ? newBricks.concat(this.bricks) : this.bricks.concat( newBricks );
//      if (common.length) {
////        if (Physics.util.unique(this.bricks.map(function(b) {return b.options._uri})).length)
//          debugger;
//      }
      
      if (!this._initialized)
        this._init();
      else
        this.layout( newBricks );
    },
  
    _getLeftmostColumn: function(brick) {
      var offset = getBrickCoord(brick, this.orthoAxisIdx) - brick.geometry._aabb[this.aabbOrthoAxisDim];
      var edgeCol = Math.round(offset / this.alleyDim);
      return edgeCol;
    },

    _getColSpan: function(brick) {
      var colSpan = Math.ceil( this._getOuterWidth(brick) / this.alleyDim );
      return Math.min( colSpan, this.cols );
    },

    _recalcColYs: function() {
      if (!this.bricks.length) {
        this._resetColYs();
        return;
      }
      
      var dimensionMethod = this.options.horizontal ? '_getOuterWidth' : '_getOuterHeight',
          bricks = this.bricks,
          brick,
          fromCol,
          offset = this.offset.y,
          topColYs = this.bottomColYs.slice(),
          bottomColYs = this.topColYs.slice(),
          cols = this.cols,
          col,
          head,
          dim,
          i = bricks.length,
          flexigroupOffset = this._getOffsetDueToFlexigroup();

      while (i--) {
        brick = bricks[i];
        fromCol = this._getLeftmostColumn(brick);
        colSpan = this._getColSpan(brick);
        dim = this[dimensionMethod](brick);
        head = getBrickCoord(brick, this.axisIdx) - brick.geometry._aabb[this.aabbAxisDim] - flexigroupOffset;
        while (colSpan--) {
          col = fromCol + colSpan;
          topColYs[col] = Math.min(head - this.getGutterWidth(), topColYs[col]);
          bottomColYs[col] = Math.max(head + dim + this.getGutterWidth(), bottomColYs[col]);
        }
      }
    
      this.topColYs = topColYs;
      this.bottomColYs = bottomColYs;
    },

    removedFromHead: function(n, bricks) {
//      this.bricks = difference(this.bricks, bricks);
//      this.bricks = this.bricks.slice(Math.min(this.bricks.length, n), this.bricks.length);
      Physics.util.removeFromTo(this.bricks, 0, n);
      var dimensionMethod = this.options.horizontal ? '_getOuterWidth' : '_getOuterHeight',
          gutterWidth = this.getGutterWidth(),
          i = bricks.length,
          brick,
          dim,
          colSpan,
          col,
          numCols = this.cols,
          fromCol,
          colYs = this.topColYs;
      
      while (i--) {
        brick = bricks[i];
        fromCol = this._getLeftmostColumn(brick);
        colSpan = this._getColSpan(brick);
        dim = this[dimensionMethod](brick) + gutterWidth;
        while (colSpan--) {
          col = fromCol + colSpan;
          if (col < numCols)
            colYs[col] += dim;
        }
      }
    },

    removedFromTail: function(n, bricks) {
//      this.bricks = difference(this.bricks, bricks);
      this.bricks.length = Math.max(0, this.bricks.length - n);
      var dimensionMethod = this.options.horizontal ? '_getOuterWidth' : '_getOuterHeight',
          gutterWidth = this.getGutterWidth(),
          brick,
          dim,
          colSpan,
          col,
          numCols = this.cols,
          fromCol,
          colYs = this.bottomColYs;
      
      for (var i = 0; i < bricks.length; i++) {
        brick = bricks[i];
        fromCol = this._getLeftmostColumn(brick);
        colSpan = this._getColSpan(brick);
        dim = this[dimensionMethod](brick) + gutterWidth;
        while (colSpan--) {
          col = fromCol + colSpan;
          if (col < numCols)
            colYs[col] -= dim;
        }
      }
    },

    removed: function(bricks) {
      this.bricks = difference(this.bricks, bricks);      
      this._recalcColYs();
    }
  };
  
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('masonry', function(){ return Mason });
  } else {
    // Browser globals (root is window)
    root.Mason = Mason;
  }
})(this, this.Physics);
