define('domUtils', ['globals', 'lib/fastdom', 'events'], function(G, Q, Events) {
  var doc = document,
      LAZY_DATA_ATTR = G.lazyImgSrcAttr,
      LAZY_ATTR = LAZY_DATA_ATTR.slice(5),
      MAX_OPACITY = 0.999999,
      isFF = G.browser.firefox,
      vendorPrefixes = ['-moz-', '-ms-', '-o-', '-webkit-'],
      ArrayProto = Array.prototype,
      resizeTimeout,
      DOM,
      cssPrefix = {
//        read: {},
//        write: {}
      },
      renderQueue = [],
      tmpdiv = document.createElement("div"),
      OPAQUE_STYLE = {
        style: {
          add: {
            opacity: MAX_OPACITY
          }
        }
      },
      TRANSPARENT_STYLE = {
        style: {
          add: {
            opacity: 0
          }
        }
      },
      SHOW_STYLE = {
        style: {
          add: {
            visibility: 'visible'
          }
        }
      },
      HIDE_STYLE = {
        style: {
          add: {
            visibility: 'hidden'
          }
        }
      },
      isMoz = G.browser.mozilla;

  window.addEventListener('resize', function(e) {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(fireResizeEvent, 100);
  });

  window.addEventListener('debouncedresize', function() {
    console.log("debounced resize event");
  });

  function toTitleCase(str) {
    return str.replace(/(?:^|\s|-)\w/g, function(match) {
        return match.toUpperCase();
    }).replace(/-/, ''); 
  };

  function fireResizeEvent() {
    var v = G.viewport,
        heightChanged = window.innerHeight !== v.height,
        widthChanged = window.innerWidth !== v.width;
    
    if (heightChanged || widthChanged) {
      saveViewportSize();
      window.dispatchEvent(new Event('debouncedresize'));
      window.dispatchEvent(new Event('viewportdimensions'));
      if (heightChanged)
        window.dispatchEvent(new Event('viewportheightchanged'));
      if (widthChanged)
        window.dispatchEvent(new Event('viewportwidthchanged'));
    }
//    if (saveViewportSize()) {
//      window.dispatchEvent(new Event('debouncedresize'));
//      window.dispatchEvent(new Event('viewportdimensions'));
//    }
  }
  
  window.addEventListener('orientationchange', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(fireOrientationchangeEvent, 100);
  });

  window.addEventListener('debouncedorientationchange', function() {
    console.log("debounced orientationchange event");
  });

  function fireOrientationchangeEvent() {
    window.dispatchEvent(new Event('debouncedorientationchange'));
    window.dispatchEvent(new Event('viewportdimensions'));
  }

  function saveViewportSize() {
    var viewport = G.viewport;
    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;
//    var viewport = G.viewport,
//        width = window.innerWidth,
//        height = window.innerHeight,
//        oldWidth = 0,
//        oldHeight = 0,
//        changed = false;
//    
//    if (viewport) {
//      oldWidth = viewport.width;
//      oldHeight = viewport.height;
//    }
//    else
//      viewport = G.viewport = {};
//    
//    if (oldWidth !== width) {
//      viewport.width = width;
//      changed = true;
//    }
//    if (oldHeight !== height) {
//      viewport.height = height;
//      changed = true;
//    }
//
//    if (changed)
//      console.log("Viewport size changed from " + oldWidth + 'x' + oldHeight + ', to ' + width + 'x' + height);
//
//    return changed;
//    Events.trigger('viewportResize', viewport);
  }

  function $wrap(el) {
    return el instanceof $ ? el : $(el);
  }

  function $unwrap(el) {
    return el instanceof $ ? el[0] : el;
  }

  saveViewportSize();  
//  window.addEventListener('orientationchange', saveViewportSize); 
//  window.addEventListener('debouncedresize', saveViewportSize); 

  function isElementCollection(els) {
    return els instanceof Array ||
           els instanceof NodeList || 
           els instanceof HTMLCollection;
  };
  
  function getElementArray(els) {
    return isElementCollection(els) ? els : els && [els];
  };

//  function getUniqueElementID(element) {
//    if (element === window) return 0;
//
//    // Need to use actual `typeof` operator to prevent errors in some
//    // environments when accessing node expandos.
//    if (typeof element._prototypeUID === 'undefined')
//      element._prototypeUID = Element.Storage.UID++;
//    return element._prototypeUID;
//  };
  
  // Bezier functions
  function B1(t) { return t*t*t }
  function B2(t) { return 3*t*t*(1-t) }
  function B3(t) { return 3*t*(1-t)*(1-t) }
  function B4(t) { return (1-t)*(1-t)*(1-t) }

  var nodeProto = Node.prototype;
  var nodeListProto = NodeList.prototype;
  var htmlCollectionProto = HTMLCollection.prototype;
  var elementProto = Element.prototype;
  var $matches = elementProto.matches || elementProto.webkitMatchesSelector || elementProto.mozMatchesSelector || elementProto.msMatchesSelector;
  
  function removeEventListeners(el, event, listeners, _listener) {
    var i = listeners.length,
        listener;
    
    while (i--) {
      listener = listeners[i];
      if (_listener) {
        if (listener.listener == _listener) {
          el.removeEventListener(event, listener.proxy);
          Array.removeFromTo(listeners, i, i + 1);
//          removed = true;
          break;
        }
      }
      else {
        el.removeEventListener(event, listener.proxy);
//        removed = true;
      }
      
    }
    
    if (!_listener)
      listeners.length = 0;
    
//    if (!removed)
//      console.log("FAILED TO REMOVE EVENT LISTENER", event, _listener._listenerId, listeners.map(function(l) { return l.listener._listenerId }).join(','));
//    else
//      console.log("REMOVED EVENT LISTENER", event, _listener._listenerId);
  };
  
  (function extendNodeAndNodeList(win, doc) {
    var NodeAndNodeListAug = {
      $matches: $matches,
      $on: function(event, selector, listener, capture) {
        var self = this,
            proxy;
        
        if (typeof selector == 'function') {
          capture = listener;
          listener = selector;
          selector = '';
        }
        
        if (!this._$handlers)
          this._$handlers = {};
        
        if (!this._$handlers[selector])
          this._$handlers[selector] = [];
        
        if (selector) {
          proxy = function(e) {
//            var matches = self.$(selector),
//                match,
//                i = matches.length;
//            
//            while (i--) {
//              match = matches[i];
//              e.selectorTarget = match;
//              listener(e);
//            }

            if (e._stoppedPropagation || e._stoppedImmediatePropagation)
              return;

            var el = e.target,
                closest;
            
            if (el.$matches(selector)) {
              e.selectorTarget = el;
              listener(e);
            }
            
            while (!e._stoppedImmediatePropagation && (el = el.$closest(selector))) { // bubble
              e.selectorTarget = el;
              listener(e);
            }
          };
        }
        else {
          proxy = function(e) {
            e.selectorTarget = e.selectorTarget;
            return listener(e);
          };
        }
        
//        listener._listenerId = proxy._listenerId = G.nextId();
        this._$handlers[selector].push({
          listener: listener,
          proxy: proxy
        });
        
        this.addEventListener(event, proxy, capture);
        return this;
      },
      $off: function(event, selector, handler, capture) {
        if (!this._$handlers)
          return this;
          
        if (typeof arguments[1] == 'function') {
          capture = handler;
          handler = selector;
          selector = null;
        }

        if (selector)
          removeEventListeners(this, event, this._$handlers[selector], handler);
        else {
          for (var selector in this._$handlers) {
            removeEventListeners(this, event, this._$handlers[selector], handler);
          }
        }
        
        return this;
      },
      $once: function(event, handler, capture) {
        var self = this; 
        return this.$on(event, function proxy() {
          self.$off(proxy);
          handler();
        }, capture);
      },
      $trigger: function(event, data) {
        if (typeof event == 'string')
          event = data ? new Event(event, data) : new Event(event);
        
        this.dispatchEvent(event);
        return this;
      },
      $css: function() {
        switch (arguments.length) {
        case 0:
          return window.getComputedStyle(this);
        case 1:
          var arg0 = arguments[0];
          if (typeof arg0 == 'string')
            return this.style[arg0];
          else {
            for (var prop in arg0) {
              this.style[DOM.prefix(prop)] = arg0[prop];
            }
          }
          
          break;
        case 2:
          this.style[DOM.prefix(arguments[0])] = arguments[1];
          break;
        default:
          throw "invalid arguments to style method of Node";
        }
        
        return this;
      },
      
      $attr: function() {
        var arg0 = arguments[0];
        switch (arguments.length) {
        case 1:
          if (typeof arg0 == 'string') // get
            return this.getAttribute(arg0);
          
          for (var prop in arg0) { // set
            var val = arg0[prop];
            if (val == null)
              this.removeAttribute(prop);
            else
              this.setAttribute(prop, arg0[prop]);
          }
          
          break;
        case 2:
          var val = arguments[1];
          if (val == null)
            this.removeAttribute(arguments[0]);
          else
            this.setAttribute(arguments[0], val);
          break;
        default:
          throw "invalid arguments to style method of Node";
        }
        
        return this;
      },

      $onremove: function(fn) {
        if (!this._removeListeners)
          this._removeListeners = [];
        
        this._removeListeners.push(fn);
      },
      
      $remove: function() {
        if (this._removeListeners) {
          this._removeListeners.forEach(function(fn) { fn() });
          delete this._removeListeners;
        }
          
        delete this._$handlers; // listeners should auto-unbind in modern browsers
        if (this.parentNode)
          this.parentNode.removeChild(this);
        
        return this;
      },
  
      $hide: function() {
        this.style.display = 'none';
        return this;
      },
      
      $show: function() {
        if (this.style.display == 'none')
          this.style.display = '';
        
        return this;
      },
      
      $addClass: function() {
        var i = arguments.length;
        while (i--) this.classList.add(arguments[i]);
        return this;
      },
      
      $removeClass: function() {
        var i = arguments.length;
        while (i--) this.classList.remove(arguments[i]);
        return this;
      },
      
      $toggleClass: function(cl) {
        if (this.$hasClass(cl))
          this.$removeClass(cl);
        else
          this.$addClass(cl);
      },
      
      $empty: function() {
        while (this.lastChild) {
//        this.innerHTML = "";
          this.removeChild(this.lastChild); // http://jsperf.com/removechild-vs-innerhtml-empty/5
        }
        
        return this;
      },
      
      $html: function(htmlOrFrag) {
        if (!arguments.length)
          return this.innerHTML;
        
        if (typeof htmlOrFrag == 'string')
          return this.$html(DOM.parseHTML(htmlOrFrag));
        
        return this.$empty().$append(htmlOrFrag);        
      }
    };
        
    var NodeAug = {
      $: function(selector) {
        switch (this.nodeType) {
        case 1:
        case 9:
        case 11:
          if (G.browser.safari && /^#/.test(selector)) {
//            var nodeList = newNodeList(),
//                match = this.querySelector('[id="' + selector.slice(1) + '"]');
//            
//            if (match)
//              nodeList.push(match);
//            
//            return nodeList;
//            selector = '[id="' + selector.slice(1) + '"]';
//            selector = selector.replace(/#([a-zA-Z0-9\-_]*)/g, '[id="$1"]');
            // replace all id selectors with selection by attribute
            selector = selector.replace(/#([_a-zA-Z]+[_a-zA-Z0-9-]*)/g, '[id="$1"]'); // http://stackoverflow.com/questions/448981/what-characters-are-valid-in-css-class-selectors
          }
          
          return this.querySelectorAll(selector);
        default:
          return DOM.emptyNodeList();
        }
      },
    
      $closest: function(selector) {
        var parent = this;
        while ((parent = parent.parentNode) && parent != doc) {
          if (parent.$matches(selector))
            return parent;
        }
        
        return null;
      },
      
      $offset: function() {
        var box = this.getBoundingClientRect(),
            docElem = doc.documentElement;
        
        return {
          top: box.top  + ( win.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 ),
          left: box.left + ( win.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 )
        };
      },

//      $offsetParent: function() {
//         // from jQuery
//        var offsetParent = this.offsetParent || doc.documentElement;
//        while (offsetParent && offsetParent.nodeName !== "HTML" && win.getComputedStyle(offsetParent).position === "static") {
//          offsetParent = offsetParent.offsetParent;
//        }
//        
//        return offsetParent || doc.documentElement;
//      },
      
      $position: function() {
        var offset = this.$offset(),
            offsetParent = this.offsetParent, // maybe use jQuery's offsetParent?
            style = win.getComputedStyle(this),
            parentStyle = win.getComputedStyle(offsetParent),
            parentOffset = offset.nodeName == 'HTML' ? { top: 0, left: 0 } : offsetParent.$offset(),
            marginTop = 0,
            marginLeft = 0;
        
        if (parentStyle.borderTopWidth)
          parentOffset.top += parseFloat(parentStyle.borderTopWidth);
        if (parentStyle.borderLeftWidth)
          parentOffset.left += parseFloat(parentStyle.borderLeftWidth);
        
        if (style.marginTop)
          marginTop = parseFloat(style.marginTop);
        if (style.marginLeft)
          marginLeft = parseFloat(style.marginLeft);
        
        return {
          top:  offset.top  - parentOffset.top - marginTop,
          left: offset.left - parentOffset.left - marginLeft
        };
      },

      $not: function(selector) {
        return this.$matches(selector) ? false : true;
      },
      
      $before: function(before) {
        if (before.parentNode)
          before.parentNode.insertBefore(this, before);
        
        return this;
      },
    
      $after: function(after) {
        if (after.parentNode)
          after.parentNode.insertBefore(this, after.nextSibling );
        
        return this;
      },
      
      $hasClass: function(cl) {
        return this.classList.contains(cl);
      },
  
      $prepend: function(/* htmlOrFrag, htmlOrFrag, ... */) {
        var i = arguments.length;
        while (i--) {
          var htmlOrFrag = arguments[i];
          if (htmlOrFrag instanceof Array || htmlOrFrag instanceof NodeList) {
            this.$prepend.apply(this, htmlOrFrag);
            continue;
          }
          
          if (!this.firstChild) {
            this.$append(htmlOrFrag);
            continue;
          }
          
          if (typeof htmlOrFrag == 'string')
            htmlOrFrag = DOM.parseHTML(htmlOrFrag);
          
          isElementCollection(htmlOrFrag) ? htmlOrFrag[0].$before(this.firstChild) : htmlOrFrag.$before(this.firstChild);
//           htmlOrFrag.$before(this.firstChild);
        }
        
        return this;
      },  
      
      $append: function(/* htmlOrFrag, htmlOrFrag, ... */) {
        for (var i = 0; i < arguments.length; i++) {
          var htmlOrFrag = arguments[i];
          if (typeof htmlOrFrag == 'string') {
            this.$append(DOM.parseHTML(htmlOrFrag));
            continue;
          }
          else if (htmlOrFrag instanceof Node)
            this.appendChild(htmlOrFrag);
          else if (isElementCollection(htmlOrFrag)) {
            for (var j = 0, l = htmlOrFrag.length; j < l; j++) {
              this.appendChild(htmlOrFrag[j]);
              if (htmlOrFrag.length < l) {
                // we're appending a live collection, so with every element we append, the collection gets smaller
                j--;
                l--;
              }
            }
          }
          else
            throw "only HTML string or DocumentFragment are supported";
        }
        
        return this;
      },
      
      $fadeTo: function(targetOpacity, time, callback) {
        targetOpacity = targetOpacity || 0;
        var style = this.style,
            opacity = parseFloat(style.opacity),
            timeInterval = 40,
            opacityInterval = Math.abs(targetOpacity - opacity) / (time / timeInterval),
            multiplier = targetOpacity - opacity > 0 ? 1 : -1,
            diff;
        
        (function fader() {        
          if (time <= 0 || Math.abs(targetOpacity - opacity) <= opacityInterval) {
            style.opacity = targetOpacity;
            if (targetOpacity == 0)
              style.display = "none";
            
            if (callback)
              callback.call(self);
          }
          else {
            time = time - timeInterval;
            opacity += opacityInterval * multiplier;
            style.opacity = opacity;
            setTimeout(fader, timeInterval);
          }
        })();
        
        return this;
      },

      $padding: function() {
        var style = window.getComputedStyle(this);
        return {
          top: parseFloat(style.paddingTop),
          left: parseFloat(style.paddingLeft),
          bottom: parseFloat(style.paddingBottom),
          right: parseFloat(style.paddingRight)
        }
      },

      $margin: function() {
        var style = window.getComputedStyle(this);
        return {
          top: parseFloat(style.marginTop || 0),
          left: parseFloat(style.marginLeft || 0),
          bottom: parseFloat(style.marginBottom || 0),
          right: parseFloat(style.marginRight || 0)
        }
      },

      $outerHeight: function(includeMargin) {
        if (!includeMargin)
          return this.offsetHeight;
        else {
          var margin = this.$margin();
          return this.offsetHeight + margin.top + margin.bottom;
        }
      },
      
      $outerWidth: function(includeMargin) {
        if (!includeMargin)
          return this.offsetWidth;
        else {
          var margin = this.$margin();
          return this.offsetWidth + margin.left + margin.right;
        }
      },
      
      $data: function(/* key, val or properties object */) {
        var arg0 = arguments[0];
        if (arguments.length == 2) {
          this.setAttribute('data-' + arg0, arguments[1]);
        }
        else {
          if (typeof arg0 == 'string')
            return this.getAttribute('data-' + arg0);
          else {
            for (var key in arg0) {
              if (arg0.hasOwnProperty(key))
                this.setAttribute(key, arg0[key]);
            }
          }
        }
        
        return this;
      }
    };
    
    _.defaults(nodeListProto, {
      $not: function(selector) {
        var i = this.length,
            node,
            filtered = [];
        
        while (i--) {
          node = this[i];
          if (!node.$matches(selector))
            filtered.push(node);
        }
        
        return filtered;
      }
    });
    
    var arrayMethods = Object.getOwnPropertyNames( ArrayProto ),
        arrayMethodI = arrayMethods.length;
    
    while (arrayMethodI--) {
      var methodName = arrayMethods[arrayMethodI];
      var method = ArrayProto[methodName];
      if (typeof method == 'function') {
        methodName = '$' + methodName;
        nodeListProto[methodName] = method;
        htmlCollectionProto[methodName] = method;
      }
    }
    
    function extendCollection(col, fnName) {
      var nodeFn = nodeProto[fnName];
      if (nodeFn) {
        col[fnName] = function() {
          var args = arguments,
              result,
              node,
              i = this.length;
          
          while (i--) {
            node = this[i];
            nodeFn.apply(node, args);
          }
          
          return this;
        }
      }
    }
    
    _.defaults(nodeProto, NodeAug, NodeAndNodeListAug);
  
    for (var prop in NodeAndNodeListAug) {
      var method = NodeAndNodeListAug[prop];
      if (!nodeListProto[prop])
        extendCollection(nodeListProto, prop);
      if (!htmlCollectionProto[prop])
        extendCollection(htmlCollectionProto, prop);
    }
    
    NodeList.prototype.$eq = HTMLCollection.prototype.$eq = function(idx) {
      return this[idx >= 0 ? idx : this.length + idx];
    };
    
  })(window, document);

  DOM = {
    getBezierCoordinate: function(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y, percentComplete) {
      percentComplete = Math.max(0, Math.min(percentComplete, 1));
      var percent = 1 - percentComplete;
      return [p1x*B1(percent) + p2x*B2(percent) + p3x*B3(percent) + p4x*B4(percent),
              p1y*B1(percent) + p2y*B2(percent) + p3y*B3(percent) + p4y*B4(percent)];
    },
        
    getBezierPercentComplete: function(x1, y1, x2, y2, xTarget, xTolerance) {
      var self = this;
      xTolerance = xTolerance || 0.01; //adjust as you please
      var myBezier = function(t) {
        return self.getBezierCoordinate(0, 0, x1, y1, x2, y2, 1, 1, t);
      };
  
      //we could do something less stupid, but since the x is monotonic
      //increasing given the problem constraints, we'll do a binary search.
  
      //establish bounds
      var lower = 0;
      var upper = 1;
      var percent = (upper + lower) / 2;
  
      //get initial x
      var bezier = myBezier(percent);
      var x = bezier[0];
      var numLoops = 0;
  
      //loop until completion
      while (Math.abs(xTarget - x) > xTolerance) {
        if (numLoops++ > 100)
          debugger;
        
        if (xTarget > x) 
          lower = percent;
        else 
          upper = percent;
  
        percent = (upper + lower) / 2;
        bezier = myBezier(percent);
        x = bezier[0];
      }
      //we're within tolerance of the desired x value.
      //return the y value.
      return bezier[1];
    },
    getNewIdentityTransform: function(n) {
      return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    },

    identityTransformString: function() {
      return 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)';
    },
    
    parseTransform: function(transformStr) {
      if (!transformStr || transformStr == 'none')
        return this.getNewIdentityTransform();
      
      var split = transformStr.slice(transformStr.indexOf('(') + 1).split(', '),
          xIdx = split.length == 6 ? 4 : 12,
          yIdx = xIdx + 1; 

      split = split.map(parseFloat.bind(window));
      if (split.length == 6) {
        return [
          split[0], split[2], 0, 0,
          split[2], split[3], 0, 0,
          0,        0,        1, 0,
          split[4], split[5], 0, 1
        ];
      }
      else
        return split;
    },

    getTranslationString: function(position) {
      var x, y, z;
      if (typeof position == 'object') {
        x = position.x;
        y = position.y;
        z = position.z;
      }
      else {
        x = position;
        y = arguments[1];
        z = arguments[2];
      }
      
      return 'translate3d(' + (x || 0) + 'px, ' + (y || 0) + 'px, ' + (z || 0) + 'px)'; //+ (isFF ? ' rotate(0.01deg)' : '');
    },
    
    _zeroTranslation: {
      X:0,
      Y:0,
      Z:0
    },
    
    /**
     * @return { X: x-offset, Y: y-offset }
     */
    parseTranslation: function(transformStr) {
      transformStr = transformStr.trim();
      if (!transformStr || transformStr == 'none')
        return _.clone(this._zeroTranslation);
      
      var match = transformStr.match(/^matrix/);
      if (match) {
        var matrix = this.parseTransform(transformStr);
        return {
          X: matrix[12],
          Y: matrix[13],
          Z: matrix[14]
        }
      }
      
      if (/translate/.test(transformStr)) {
        var xyz = transformStr.match(/(\d)+/g);
        if (!xyz)
          return _.clone(this._zeroTranslation);

        return {
          X: parseFloat(xyz[0] || 0, 10),
          Y: parseFloat(xyz[1] || 0, 10),
          Z: parseFloat(xyz[2] || 9, 10)
        }
      }
      else {
        return {
          X: 0,
          Y: 0,
          Z: 0
        }
      }

//      throw "can't parse transform";
    },
    
    getStylePropertyValue: function(computedStyle, prop) {
      return computedStyle.getPropertyValue(this.prefix(prop));
    },

    setTransform: function(el, transform, transition) {
      var transformProp = this.prefix('transform');
      if (typeof transform == 'string')
        el.style[transformProp] = transform;
      else
        el.style[transformProp] = this.toMatrix3DString(transform);
      
      if (arguments.length == 3)
        el.style[this.prefix('transition')] = transition || '';
    },
    
    toMatrix3DString: function(transform) {
      var transformStr = 'matrix3d(';
      for (var i = 0; i < 16; i++) {
        transformStr += transform[i].toFixed(10);
        if (i != 15)
          transformStr += ", ";
      }
      
      return transformStr + ")";
    },

    setStylePropertyValues: function(style, propMap) {
      for (var prop in propMap) {
        style[this.prefix(prop)] = propMap[prop];
      }
    },

    getTranslation: function(el) {
      return this.parseTranslation(el.style[this.prefix('transform')]);
    },

    getTransform: function(el) {
      return this.parseTransform(el.style[this.prefix('transform')]);
    },
    
    empty: function(els) {
      els = getElementArray(els);
      if (els) {
        var i = els.length;
//      while (node.hasChildNodes()) {
//      while (node.firstChild) {
//        node.removeChild(node.lastChild);
//      }
        while (i--) {
          els[i].innerHTML = '';
        }
      }
    },
    remove: function(els) {
      els = getElementArray(els);
      if (els) {
        var i = els.length,
            el;
        
        while (i--) {
          el = els[i];
          if (el.parentNode)
            el.parentNode.removeChild(el);
        }
      }
    },
    tag: function(name, content, attributes) {
      return {
        name: name, 
        attributes: attributes, 
        content: _.isArray(content) ? content : 
                             content == null ? [] : [content]
      };
    },
    
    toAttributesString: function(attributes) {
      var result = [];
      if (attributes) {
        for (var name in attributes) { 
          result.push(" " + name + "=\"" + this.escape(attributes[name]) + "\"");
        }
      }
      
      return result.join("");
    },
  
    /**
     * @param element: e.g. {
     *  name: 'p',
     *  attributes: {
     *    style: 'color: #000'
     *  },
     *  content: ['Hello there'] // an array of elements 
     * } 
    **/
    
    toHTML: function(element) {
      // Text node
      if (typeof element == "string") {
        return element; // already html
      }
      // Empty tag
      else if (!element.content || element.content.length == 0) {
        return "<" + element.name + this.toAttributesString(element.attributes) + "/>";
      }
      // Tag with content
      else {
        var html = ["<", element.name, this.toAttributesString(element.attributes), ">"],
            content = element.content,
            len = content.length;
        
        for (var i = 0; i < len; i++) {
          html[html.length] = this.toHTML(content[i]);
        }
        
        html[html.length] = "</" + element.name + ">";
        return html.join("");
      }
    },
  
    _replacements: [[/&/g, "&amp;"], [/"/g, "&quot;"], [/</g, "&lt;"], [/>/g, "&gt;"]],
    escape: function(text) {
      if (typeof text !== 'string')
        text = '' + text;
      
      var replacements = this._replacements;
      for (var i = 0; i < replacements.length; i++) {
        var replace = replacements[i];
        text = text.replace(replace[0], replace[1]);
      }
      
      return text;
    },

    lazyClassRegex: /(class="?'?[^"']*)lazyImage\s*([^"']*"?'?)/ig,
    lazyRegex: null,
    unlazifyImagesInHTML: function(html) {
      if (!DOM.lazyRegex)
        DOM.lazyRegex = new RegExp('src="{0}" {1}=\"?\'?([^\"\']+)\"?\'?'.format(G.getBlankImgSrc(), G.lazyImgSrcAttr), 'ig');
      
      return html.replace(DOM.lazyRegex, 'src="$1"').replace(DOM.lazyClassRegex, '$1 wasLazyImage $2');
    },
    
    /**
     * @param img {HTMLElement}
     * @param info {Object}
     *    Example: {
     *      width: 100,
     *      height: 100,
     *      onload: function() {},
     *      onerror: function() {},
     *      data: {File or Blob},
     *      realSrc: src of the actual image
     *    } 
     */
    unlazifyImage: function(img, info) {
      img.onload = null;
      img.onerror = null;
      img.removeAttribute(LAZY_DATA_ATTR);
      img.classList.remove('lazyImage');
      if (!info)
        return;
      
      img.classList.add('wasLazyImage');
      if (_.has(info, 'width'))
        img.style.width = info.width;
      if (_.has(info, 'height'))
        img.style.height = info.height;
      if (info.data) {
        var src = URL.createObjectURL(info.data), // blob or file
            onload = info.onload,
            onerror = info.onerror;
        
        if (info.realSrc)
          img.setAttribute(LAZY_DATA_ATTR, info.realSrc);
        
        img.src = src;
        this.onImageLoad(img, function() {
          try {
            return onload && onload.apply(this, arguments);
          } finally {
            URL.revokeObjectURL(src);
          }
        });

        this.onImageError(img, function() {
          try {
            return onerror && onerror.apply(this, arguments);
          } finally {
            URL.revokeObjectURL(src);
          }          
        });
      }
      else if (info.realSrc) {
        img.src = info.realSrc;
        
        if (info.onload)
          this.onImageLoad(img, info.onload); // probably store img in local filesystem
        if (info.onerror)
          this.onImageError(img, info.onerror);        
      }
    },
    
    onImageError: function(img, callback) {
      if (img.complete)
        return;
      
      var onerror = img.onerror;
      img.onerror = function() {
        onerror && onerror.call(img);
        callback.call(img);
      };
    },
    
    onImageLoad: function(img, callback) {
      if (img.complete)
        callback.call(img);
      else {
        var onload = img.onload;
        img.onload = function() {
          onload && onload.call(img);
          callback.call(img);
        };
      }
//        img.$on('load', callback);
    },
    
    lazifyImage: function(img, immediately) {
      if (!G.lazifyImages)
        return img;
      
      return this.lazifyImages([img], immediately)[0];
    },
    
    lazifyImages: function(images, immediately) {
      if (!G.lazifyImages)
        return images;
      
      var infos = [],
          lazyImgAttr = G.lazyImgSrcAttr,
          blankImg = G.getBlankImgSrc(),
          img,
          src,
          realSrc,
          isHTMLElement = images[0] instanceof HTMLElement,
          get = isHTMLElement ? function(el, attr) { return el.getAttribute(attr) || el.style[attr] } : _.index;
      
      function read() {
        for (var i = 0, num = images.length; i < num; i++) {
          img = images[i];
          realSrc = get(img, lazyImgAttr);
          src = get(img, 'src');
          
          if (realSrc && src == blankImg) {
            infos.push(null); // already lazy
//            debugger;
          }
          else {
            infos.push({
              src: realSrc || src,
              width: get(img, 'width'),
              height: get(img, 'height')
            });  
          }
        }
      }

      function write() {
        for (var i = images.length - 1; i >= 0; i--) { // MUST be backwards loop, as this may be a NodeList and thus may be automatically updated by the browser when we add/remove a class
          var img = images[i],
              info = infos[i];
          
          if (!info)
            continue;
            
          if (isHTMLElement) {
            if (!info.src.startsWith('data:') || info.src != blankImg) {
              img.setAttribute(lazyImgAttr, info.src);
              img.classList.remove('wasLazyImage');
              img.classList.add('lazyImage');
            }
            if (typeof info.width == 'number')
              img.style.width = info.width;
            if (typeof info.height == 'number')
              img.style.height = info.height;
            
  //          img.onload = window.onimageload;
  //          img.onerror = window.onimageerror;
          }
          else {
            img[lazyImgAttr] = info.src;
            img['class'] = 'lazyImage';
  //          img.onload = 'window.onimageload.call(this)';
  //          img.onerror = 'window.onimageerror.call(this)';
          }
          
          img.src = blankImg;
        }
      }
      
      if (isHTMLElement && !immediately) {
        Q.read(read);
        Q.write(write);
      }
      else {
        read();
        write();
        return images;
      }
    },
    
    toggleButton: function(btn, disable) {
      if (G.isJQM()) {
        btn = $wrap(btn);
        btn.button().button(disable ? 'disable' : 'enable');
      }
      else {
        btn = $unwrap(btn);
        btn.$attr('disabled', disable ? true : null);
      }
    },
    
    closeDialog: function(p) {
      if (G.isJQM())
        $wrap(p).popup('close');
      else
        $unwrap(p).$remove();
    },
    
    getCachedWidth: function(el) {
      var width = el.$data('width');
      if (width)
        return parseInt(width);
    },

    getCachedHeight: function(el) {
      var height = el.$data('height');
      if (height)
        return parseInt(height);
    },

//    positionToMatrix3D: function(x, y, z) {
//      return [
//        [1, 0, 0, 0],
//        [0, 1, 0, 0],
//        [0, 0, 1, 0],
//        [x || 0, y || 0, z || 0, 1]
//      ];
//    },
//    
//    positionToMatrix3DString: function(x, y, z) {
//      return 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ' + (x || 0) + ', ' + (y || 0) + ', ' + (z || 0) + ', 1)';
//    },
   
    prefix: function(prop) {
      if (cssPrefix[prop]){
        return cssPrefix[prop];
      }

      var arrayOfPrefixes = ['Webkit', 'Moz', 'Ms', 'O'],
          TitleCase = toTitleCase(prop),
          titleCase = TitleCase.slice(0, 1).toLowerCase() + TitleCase.slice(1),
          name;

      if (isMoz) {
        switch (prop) {
        case 'transform':
        case 'perspective':
        case 'transform-origin':
        case 'transition':
          return cssPrefix[prop] = prop;
        default:
          // handle as usual
          break;
        }
      }
      
      for (var i = 0, l = arrayOfPrefixes.length; i < l; ++i) {
        name = arrayOfPrefixes[i] + TitleCase;

        if (name in tmpdiv.style){
          return cssPrefix[prop] = name;
        }
      }

      if (titleCase in tmpdiv.style){
        return cssPrefix[prop] = titleCase;
      }

      G.log("DOMUtils", "error", "no such css property: " + prop);
      return false;
    },

    /**
     * @param renderData - e.g. {
     *    innerHTML: <blah>...</blah>
     *    style: {
     *      add: {
     *        width: '100px'
     *      },
     *      remove: ['height']
     *    }, 
     *    attributes: {
     *      add: {
     *        'data-blah': 12
     *      },
     *      remove: ['stupid']
     *    }, 
     *    class: {
     *      add: ['hey', 'ho'],
     *      remove: ['yo', 'booya'],
     *      set: 'yo there'
     *    }
     * }
     */
    queueRender: function(el, renderData) {
      renderQueue[renderQueue.length] = arguments;
      if (renderQueue.length == 1) // no need to queue processing multiple times
        Q.write(this.processRenderQueue, this);
    },

    processRenderQueue: function() {
      var i = renderQueue.length,
          item;
          
      while (i--) {
        item = renderQueue[i];
        this.render(item[0] /* el */, item[1] /* renderData */);  // see queueRender method
      }
      
      renderQueue.length = 0;
    },
    
    blankRenderData: function() {
      return { 
        style: {}, 
        attributes: {}, 
        'class': {}
      };
    },
    
    _renderCallbacks: [],
    onNextRender: function(callback) {
      this._renderCallbacks.push(callback);
    },
    
    /**
     * changes an element's styles, attributes, classes (see queueRender method signature for parameter definitions)
     */
    render: function(el, renderData) {
      var html = renderData.innerHTML,
          style = renderData.style, 
          attrs = renderData.attributes, 
          classes = renderData['class'], 
          add, remove, replace,
          i = this._renderCallbacks.length;
      
      if (i) {
        while (i--) {
          this._renderCallbacks[i]();
        }
        
        this._renderCallbacks.length = 0;
      }
      
      if (html)
        el.innerHTML = html;
      
      if (style) {
        if ((add = style.add))
          el.$css(add);
        if ((remove = style.remove)) {
          i = remove.length;
          while (i--) {
            el.style.removeProperty(remove[i]);
          }
        }
      }
      
      if (attrs) {
        if ((add = attrs.add))
          el.$attr(add);
        if ((remove = attrs.remove)) {
          i = remove.length;
          while (i--) {
            el.removeAttribute(remove[i]);
          }
        }
      }

      if (classes) {
        if ((add = classes.add)) {
          if (typeof add == 'string')
            el.$addClass(add);
          else
            el.$addClass.apply(el, add);
        }

        if ((remove = classes.remove)) {
          if (typeof remove == 'string')
            el.$removeClass(remove);
          else
            el.$removeClass.apply(el, remove);
        }
        
        if ((replace = classes['set']) !== undefined) {
          if (replace instanceof Array)
            replace = replace.join(' ');
          
          el.setAttribute('class', replace);
        }
      }
    },

    maxOpacity: MAX_OPACITY,
    
    /**
     * IMPORTANT: returns a live NodeList (meaning if you start taking its nodes and appending them somewhere, the collection length WILL change automatically)
     */
    parseHTML: function(html) {
//      return $.parseHTML(html);
//      var tmp = document.createDocumentFragment(),
      var div = document.createElement('div');
      
//      tmp.appendChild(div);
      div.innerHTML = html;
      return div.childNodes; // live NodeList
//      var tmp = document.implementation.createHTMLDocument();
//      tmp.body.innerHTML = html;
//      tmp.innerHTML = html;
//      return tmp.body.children; // live NodeList
//      var copy = tmp.body.childNodes.$slice();
//      tmp.body.$empty(); //childNodes.$remove();
//      return copy;
    },

//    parseHTML1: function(html) {
//      var tmp = document.implementation.createHTMLDocument();
//      tmp.body.innerHTML = html;
//      tmp.innerHTML = html;
//      return tmp.body.children; // live NodeList
//    },
    
    /**
     * Replaces all of a's child nodes with b's
     */
    replaceChildNodes: function(a, b) {
      a.$empty();
      var nodes = b.childNodes;
      for (var i = 0, l = nodes.length; i < l; i++) {
        a.appendChild(nodes[i]);
      }
    },

    emptyNodeList: function() {
      var frag = document.createDocumentFragment();
      return frag.querySelectorAll("html");
    },
    window: {
      width: function() {
        return doc.documentElement.clientWidth;
      },
      height: function() {
        return doc.documentElement.clientHeight;
      }      
    },
    isCollection: function(obj) {
      return isElementCollection(obj);
    },
    transparentStyle: TRANSPARENT_STYLE,
    opaqueStyle: OPAQUE_STYLE,
    hideStyle: HIDE_STYLE,
    showStyle: SHOW_STYLE
  };
  
  return DOM;
});