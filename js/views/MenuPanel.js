//'use strict';
define('views/MenuPanel', [
  'globals',
  'utils',
  'events',
  'vocManager',
  'views/BasicView',
  'domUtils',
  'physicsBridge',
  'lib/fastdom'
], function(G, U, Events, Voc, BasicView, DOM, Physics, Q) {
  return BasicView.extend({
//    role: 'data-panel',
//    id: 'menuPanel',
//    theme: 'd',
    _flySpeed: 5,
    style: {
      opacity: 0,
      display: 'table',
      width: '100%',
      background: 'none',
      visibility: 'hidden'
    },
    _hidden: true,
    _dragAxis: 'y',
    _scrollAxis: 'y',
    _scrollbar: true,
    _draggable: true,
//    _dragAxis: 'y',
//    style: (function() {
//      var style = {};
//      style[DOM.prefix('transform')] = DOM.positionToMatrix3DString(0, 0, -100);
//      return style;
//    })(),
    initialize: function(options) {
      var self = this,
          type = this.modelType;
      
      _.bindAll(this, 'show', 'hide');
      BasicView.prototype.initialize.apply(this, arguments);
      this.tagName = options.tagName;
      this.makeTemplate('menuItemTemplate', 'menuItemTemplate', type);
      this.makeTemplate('propGroupsDividerTemplate', 'groupHeaderTemplate', type);
      this.viewId = options.viewId;
      this.isPanel = true;      
      
      this.onload(function() {
        self.addToWorld(null, true);
        self.show();
      });

//      document.$on('click', function hide(e) {
////        if (G.canClick())
//        if (!self.isHidden() && !self._transitioning)
//          self.hide(e);
//      }, true);
//      
//      this.once('destroy', function() {
//        document.$off('click', hide);
//      }, this);
    },
    
    pageEvents: {
      'page_beforehide': 'hide',
      'page_hide': 'destroy',
      'tap': 'hide'
    },
    
//    windowEvents: {
//      'viewportdimensions': '_resizePanel'
//    },
    
    isHidden: function() {
      return this._hidden;
    },
    
    _finishTransition: function() {
      this._transitioning = false;
      if (this._repositionAfterTransition) {
        this._repositionAfterTransition = false;
        this._repositionPanel();
      }
    },
    
    show: function(e) {
      if (this._hidden) {
        if (e)
          Events.stopEvent(e);
        
        var self = this;        
        
        this._hidden = false;
        this._transitioning = true;
        Physics.there.chain({
          method: 'teleport', 
          args: [this.getContainerBodyId(), this.ulWidth]
        },
        {
          method: 'flyTo', 
          args: [this.getContainerBodyId(), 0, null, null, this._flySpeed, Physics.constants.maxOpacity]
        });
        
        Physics.here.once('render', this.getContainerBodyId(), function() {
          self._finishTransition();
          Q.write(function() {
            self.ul.style.visibility = 'visible';
            self.el.style.visibility = 'visible';
            self.el.style['z-index'] = 10002;
          });
        });
      }
    },

    hide: function(e) {
      if (!this._hidden) {
        if (e)
          Events.stopEvent(e);
        
        var self = this;
        this._hidden = true;
        this._transitioning = true;
        if (G.isJQM())
          this.$el.closest('[data-role="panel"]').panel('close');


        Physics.there.rpc(null, 'flyTo', [this.getContainerBodyId(), this.ulWidth, null, null, this._flySpeed, 0, function() {
          self._finishTransition();
          Q.write(function() {
            self.ul.style.visibility = 'hidden';
            self.el.style.visibility = 'hidden';
            self.el.style['z-index'] = 0;
          });
        }]);
        
        return true;
      }
    },
    
    _updateSize: function() {
      var viewport = G.viewport,
          outerHeight = this.ulHeight = this.ul.$outerHeight();
      
      this.ulWidth = this.ul.$outerWidth();
      try {
        if (this._outerWidth != viewport.width || this._height != viewport.height || this._outerHeight != outerHeight) {
          this._bounds[0] = this._bounds[1] = 0;
          this._outerWidth = this._width = this._bounds[2] = G.viewport.width;
          this._outerHeight = outerHeight;
          this._height = this._bounds[3] = viewport.height;
          return true;
        }
      } finally {
        if (this.ulHeight != viewport.height) {
          Q.write(function() {
            this.ul.style.height = viewport.height + 'px';
          }, this);
        }
      }
    },

//    _resizePanel: function() {
////      BasicView.prototype._recheckDimensions.apply(this, arguments);
//      this._recheckDimensions();
//      var viewport = G.viewport;
//      this._width = this._bounds[2] = viewport.width;
//      this._height = this._bounds[3] = viewport.height;
//      this.buildViewBrick();
//      this.updateMason();
//    },
    
    repositionPanel: function() {
      if (this._transitioning)
        this._repositionAfterTransition = true;
      else
        Physics.there.rpc(null, 'teleport', [this.getContainerBodyId(), this.isHidden() ? this.ulWidth : 0]);
    },

    getBodyId: function() {
      return BasicView.prototype.getBodyId.apply(this, arguments) + '-' + this.TAG;
    },
    
    getContainerBodyOptions: function() {
      var options = BasicView.prototype.getContainerBodyOptions.apply(this, arguments);
      
      // make sure it starts just offscreen
      options.x = G.viewport.width;
//      options.lock.y = 0;
      return options;
    }
  }, 
  {
    displayName: 'MenuPanel'
  });
});
