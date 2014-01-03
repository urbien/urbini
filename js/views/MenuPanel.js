//'use strict';
define('views/MenuPanel', [
  'globals',
  'utils',
  'events',
  'vocManager',
  'views/BasicView',
  'domUtils',
  'physicsBridge'
], function(G, U, Events, Voc, BasicView, DOM, Physics) {
  return BasicView.extend({
//    role: 'data-panel',
//    id: 'menuPanel',
//    theme: 'd',
    _flySpeed: 2,
    style: {
      opacity: 0
    },
    _hidden: true,
    _horizontal: true, // only moves horizontally
    _draggable: true,
    _dragAxis: 'x',
//    style: (function() {
//      var style = {};
//      style[DOM.prefix('transform')] = DOM.positionToMatrix3DString(0, 0, -100);
//      return style;
//    })(),
    initialize: function(options) {
      var self = this,
          type = this.modelType;
      
      _.bindAll(this, 'render', 'show', 'hide');
      BasicView.prototype.initialize.apply(this, arguments);
      this.tagName = options.tagName;
      this.makeTemplate('menuItemTemplate', 'menuItemTemplate', type);
      this.makeTemplate('propGroupsDividerTemplate', 'groupHeaderTemplate', type);
      this.viewId = options.viewId;
      this.isPanel = true;      
      
      this.onload(function() {
        self.addToWorld(null, false);
        self.show();
      });
    },
    
    pageEvents: {
      'page_beforehide': 'hide',
      'page_hide': 'destroy'
    },
    
    windowEvents: {
      'viewportdimensions': 'repositionPanel'
    },
    
    isHidden: function() {
      return this._hidden;
    },
    
    show: function() {
      if (this._hidden) {
        var self = this;
        
        this._hidden = false;
        Physics.there.rpc(null, 'flyBy', [this.getContainerBodyId(), -this._outerWidth, 0, 0, this._flySpeed]);
        Physics.here.once('render', this.getContainerBodyId(), function() {
          DOM.queueRender(self.el, {
            style: {
              add: {
                'z-index': 10002,
                visibility: 'visible'
              }
            }
          });
        });
      }
    },

    hide: function() {
      if (!this._hidden) {
        var self = this;
        
        this._hidden = true;
        if (G.isJQM())
          this.$el.closest('[data-role="panel"]').panel('close');
        
        Physics.there.rpc(null, 'flyTo', [this.getContainerBodyId(), G.viewport.width, 0, 0, this._flySpeed, null, function() {
          DOM.queueRender(self.el, DOM.hideStyle);
        }]);
      }
    },
    
    repositionPanel: function() {
      BasicView.prototype._onViewportDimensionsChanged.apply(this, arguments);
      Physics.there.rpc(null, 'teleport', [this.getContainerBodyId(), this.isHidden() ? G.viewport.width : G.viewport.width - this._outerWidth]);
    },
    
    getContainerBodyOptions: function() {
      var options = BasicView.prototype.getContainerBodyOptions.apply(this, arguments);
      
      // make sure it starts just offscreen
      options.x = G.viewport.width;
      options.lock.y = 0;
      return options;
    }
  }, 
  {
    displayName: 'MenuPanel'
  });
});
