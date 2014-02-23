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
//    _flySpeed: 3.5,
//    _acceleration: 0.05,
    _drag: 0.2,
    _stiffness: 0.1,
    _damping: 0.3,
    style: {
      opacity: 0,
      display: 'table',
      width: '100%',
      background: 'none',
      visibility: 'visible',
      'transform-origin': '100% 0%'
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
//        Physics.there.rpc(null, 'squeezeAndStretch', [self.getContainerRailBodyId(), self.getContainerBodyId()]);
//        Physics.there.rpc(null, 'skewWhenMoving', [self.getContainerRailBodyId(), self.getContainerBodyId(), 'x']);
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
      var self = this;
      if (this._hidden) {
        if (e)
          Events.stopEvent(e);
        
//        if (this.ulWidth == G.viewport.width) {
//          var self = this;
//          // HACK!!
//          setTimeout(function tryAgain() {
//            if (self._updateSize())
//              self.show();
//            else
//              setTimeout(tryAgain, 50);
//          }, 50);
//          
//          return;
//        }
        
        var accActionId = _.uniqueId('accAction');
        
        this._hidden = false;
        this._transitioning = true;
        Physics.there.chain(
          {
            method: 'style',
            args: [this.getContainerBodyId(), {
              'z-index': 10002,
              visibility: 'visible'
            }]
          },
          {
            method: 'teleport', 
            args: [this.getContainerRailBodyId(), this.ulWidth]
          },
//          {
//            method: 'accelerateTo', 
//            args: [{
//              actionId: accActionId,
//              body: this.getContainerRailBodyId(), 
//              x: 0, 
//              a: this._acceleration,
//              drag: this._drag
//            }]
//          },
          {
            method: 'snapTo', 
            args: [{
              actionId: accActionId,
              body: this.getContainerRailBodyId(),
              stiffness: this._stiffness,
              damping: this._damping,
              drag: this._drag,
              x: 0 
            }]
          },
          {
            method: 'animateStyle',
            args: [{
              body: this.getContainerBodyId(),
              property: 'opacity',
              end: DOM.maxOpacity,
              duration: 200
//              trackAction: {
//                body: this.getContainerRailBodyId(),
//                action: accActionId
//              }
            }]
          }
        );
        
        Physics.here.once('render', this.getContainerBodyId(), function() {
          self._finishTransition();
          Q.write(function() {
            self.ul.style.visibility = 'visible';
          });
        });
      }
    },

    hide: function(e) {
      if (!this._hidden) {
        if (e)
          Events.stopEvent(e);
        
        var self = this,
            accActionId = _.uniqueId('accAction');

        this._hidden = true;
        this._transitioning = true;
        if (G.isJQM())
          this.$el.closest('[data-role="panel"]').panel('close');

        Physics.there.chain(
          {
//            method: 'accelerateTo',
            method: 'snapTo',
            args: [{
//              actionId: accActionId,
              body: this.getContainerRailBodyId(), 
              x: this.ulWidth, 
              stiffness: this._stiffness,
              damping: this._damping,
              drag: this._drag,
//              a: this._acceleration,
              oncomplete: function() {
                self._finishTransition();
                Physics.there.style(self.getContainerBodyId(), {
                  'z-index': 0,
                  visibility: 'hidden'
                });
                
                Q.write(function() {
                  self.ul.style.visibility = 'hidden';
                });
              }
            }]
          },
          {
            method: 'animateStyle',
            args: [{
              body: this.getContainerBodyId(),
              property: 'opacity',
              end: 0,
              duration: 200
//              trackAction: {
//                body: this.getContainerRailBodyId(),
//                action: accActionId
//              }
            }]
          }
        );
        
        return true;
      }
    },
    
    _updateSize: function() {
      var viewport = G.viewport,
          height = this.ulHeight = parseInt(this.ul.style.height || 0),
          outerWidth = this.ul.$outerWidth(),
          outerHeight = this.ul.$outerHeight();

      if (outerWidth >= G.viewport.width) {
        if (!resetTimeout(this._measureMenuTimeout))
          this._measureMenuTimeout = setTimeout(this._updateSize.bind(this), 50); // HACK - ul is full screen width on first check
      }
      
      this.ulWidth = outerWidth;
      if (this._outerWidth != viewport.width || this._outerHeight != outerHeight || height != viewport.height) {
        this._bounds[0] = this._bounds[1] = 0;
        this._outerWidth = this._width = this._bounds[2] = viewport.width;
        this._outerHeight = outerHeight;
        this._height = this._bounds[3] = viewport.height;
        Q.write(function() {
          this.ul.style.height = viewport.height + 'px'; // to keep the menu the same height as the screen
        }, this);
        
        return true;
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
