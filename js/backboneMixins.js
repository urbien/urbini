define('backboneMixins', ['globals', 'underscore', 'backbone', 'events', 'utils', 'hammer'], function(G, _, Backbone, Events, U, Hammer) {
  (function(doc, _, Backbone, HTML, CSS) {
    Backbone.hammerOptions = {
//      prevent_default: true,
//      tap_always: false
    };
    
    var delegateEventSplitter = /^(\.[^\s]*\s*)?(\S+)\s*(.*)$/;
    var viewOptions = ['hammerEvents', 'hammerOptions'];

    var View = Backbone.View;
    var delegateEvents = View.prototype.delegateEvents;
    var undelegateEvents = View.prototype.undelegateEvents;
    var hammer_events = 'touch release hold tap doubletap dragstart drag dragend dragleft dragright dragup dragdown swipe swipeleft swiperight swipeup swipedown transformstart transform transformend rotate pinch pinchin pinchout';
    
    /**
     * @return obj[name] or this[obj[name]] depending on which is a function 
     */
    function getFunction(obj, key) {
      var fn = obj[key];
      fn = typeof fn == 'function' ? fn : this[fn];
      return fn;
    };
    
    function getEventName(key) {
      return getEventInfo(key).eventName;
    }
    
    function getEventInfo(key) {
      var match = key.match(delegateEventSplitter),
          bareEventName = eventName = match[2],
          selector = match[3];
      
      if (/\..*/.test(eventName)) {
//        G.log('events', 'ignoring namespace on event: ' + eventName);
        bareEventName = eventName.replace(/\..*/, '');
      }
      
      match.eventName = Events.getEventName(bareEventName);
      match.selector = selector;
      match.length = 0;
      return match;
    }
    
    function proxyViewFunctionTo(viewProto, to /*, function name list */) {
      for (var i = 2; i < arguments.length; i++) {
        _proxyViewFunctionTo(viewProto, to, arguments[i]);
      }
    };
    
    function _proxyViewFunctionTo(viewProto, to, fnName) {
      viewProto[fnName] = function() {
        if (this.el) {
          var args = _.toArray(arguments);
          args.unshift(this.el);
          to[fnName].apply(to, args);
        }
      };      
    };

    Backbone.View = View.extend({
      constructor: function(options){
        options = options || {};
//        if (!_.has(options, 'delegateEvents') && this.autoFinish !== false)
//          options.delegateEvents = false;
        
        _.extend(this, _.pick(options, viewOptions));
        return View.apply(this, arguments);
      },

      _ensureElement: function(options) {
        if (options && options.ensureElement == false)
          return;
        
        if (!this.el) {
          var attrs = _.extend({}, _.result(this, 'attributes')),
              classes,
              style,
              el;
          
          el = doc.createElement(_.result(this, 'tagName'));          
          this.setElement(el, false);
          
          if (this.classes) 
            classes = _.result(this, 'classes');
          else if (this.className) 
            classes = _.result(this, 'className');
          
          if (classes && !_.isArray(classes))
            classes = classes.split(' ');
          
          if (this.style) { 
            style = _.result(this, 'style');
            if (style)
              this.css(style);
          }
          
          if (this.id) 
            attrs.id = _.result(this, 'id');
          
          this.attr(attrs);
          if (classes)
            this.addClass.apply(this, classes);
        } else {
          this.setElement(_.result(this, 'el'), false);
        }
      },
      
      $: function(selector) {
        return this.el ? this.el.querySelectorAll(selector) : [];
//        var result = this.el ? this.el.querySelectorAll(selector) : [];
//        return /\#[^\.\s]+$/.test(selector) ? result[0] : result; // for #id based selectors, return the first match
      },
      
      setElement: function(element, delegate) {
        var $element = element instanceof $ ? element : $(element);
        element = $element[0];
        this.$el = $element; // may not be set yet even if this.el is
        if (this.el) {
          if (this.el == element)
            return;
        
          this.undelegateEvents();
        }
        
        this.el = element;
        if (delegate !== false) 
          this.delegateEvents();
        
        return this;
      },

      append: function(html) {
        if (!this.el)
          throw "this view has no element to append HTML to";
        
//        var els = html instanceof HTMLElement ? [html] : $.parseHTML(html);
//        for (var i = 0; i < els.length; i++) {
//          this.el.appendChild(els[i]);
//        }
        this.el.innerHTML += html;
        this.redelegateDOMEvents();
      },
      
      html: function(html) {
        this.undelegateDOMEvents();
        this.el.innerHTML = html;
        this.delegateDOMEvents();
      },
      
      empty: function() {
        this.undelegateDOMEvents();
        this.el.innerHTML = "";
      },
      
      _hammered: false,
      _getHammer: function(el, options, create) {
        var hammers = this._hammers = this._hammers || [];
        for (var i = 0; i < hammers.length; i++) {
          var hammer = hammers[i];
          if (hammer.element == el)
            return hammer;
        }
        
        if (create) {
          var hammer = new Hammer(el, options);
          hammers.push(hammer);
          return hammer;
        }
      },

      _delegateEvents: function(events, hammer, delegated) {
        var defaultEls = [hammer.element],
            options = this.hammerOptions;
            
        for(var key in events) {
          if (delegated[key])
            continue;
          
          var method = getFunction.call(this, events, key),
              eventInfo = getEventInfo(key),
              eventName = eventInfo.eventName;
          
          method = _.bind(method, this);
          delegated[key] = method;

          if (eventInfo.selector) {
            var els = this.el.querySelectorAll(eventInfo.selector),
                i = els.length;
            
            while (i--) {
              this._getHammer(els[i], options, true).on(eventName, method); // create if Hammer doesn't exist
            }
          }
          else
            hammer.on(eventName, method); // use view's hammer (for view element)
        }
      },
      
      delegateEvents: function() {
        if (!this.el)
          return;
        
        this.redelegateDOMEvents();
        var globalEvents = this.globalEvents,
            windowEvents = this.windowEvents,
            myEvents = this.myEvents;
        
        if (globalEvents) {
          var delegated = this._delegatedGlobalEvents = this._delegatedGlobalEvents || {};
          for (var key in globalEvents) {
            if (!_.has(delegated, key)) {
              var eventName = getEventName(key),
                  fn = getFunction.call(this, globalEvents, key);
              
              delegated[key] = fn;
              Events.on(eventName, fn, this);
            }
          }
        }
        
        if (windowEvents) {
          var delegated = this._delegatedWindowEvents = this._delegatedWindowEvents || {};
          for (var key in windowEvents) {
            if (!_.has(delegated, key)) {
              var eventName = getEventName(key),
                  fn = getFunction.call(this, windowEvents, key);
              
              delegated[key] = fn.bind(this);
              window.addEventListener(eventName, fn);
            }
          }
        }

        if (myEvents) {
          var delegated = this._delegatedMyEvents = this._delegatedMyEvents || {};
          for (var key in myEvents) {
            if (!_.has(delegated, key)) {
              var eventName = getEventName(key),
                  fn = getFunction.call(this, myEvents, key);
              
              delegated[key] = fn;
              this.on(eventName, fn, this);
            }
          }
        }

        return this;
      },

      _undelegateDOMEvents: function(delegated, hammer) {
        if (!delegated || !hammer)
          return;
        
        var el = hammer.element,
            defaultEls = [el];
        
        for (var key in delegated) {
          var method = delegated[key],
              eventInfo = getEventInfo(key),
              eventName = eventInfo.eventName;
          
          if (eventInfo.selector) {
            els = el.querySelectorAll(eventInfo.selector);
            i = els.length;
            while (i--) {
              var _el = els[i],
                  h = this._getHammer(_el);
              
              if (h)
                h.off(eventName, method);
            }
          }
          else
            hammer.off(eventName, method);
          
          delete delegated[key];
        }
      },

      undelegateEvents: function() {
        if (!this.el)
          return;
        
        var globalEvents = this._delegatedGlobalEvents,
            myEvents = this._delegatedMyEvents,
            windowEvents = this._delegatedWindowEvents;
        
        this.undelegateDOMEvents();
        if (globalEvents) {
          for (var key in globalEvents) {
            var fn = globalEvents[key];
            Events.off(getEventInfo(key).eventName, fn, this);
          }
        }

        if (myEvents) {
          for (var key in myEvents) {
            var fn = myEvents[key];
            this.off(getEventInfo(key).eventName, fn, this);
          }
        }

        if (windowEvents) {
          for (var key in windowEvents) {
            var fn = windowEvents[key];
            window.removeEventListener(getEventInfo(key).eventName, fn);
          }
        }

        return this;
      },
      
      delegateDOMEvents: function() {
        if (!this.rendered)
          return;
        
        if (this.events)
          this._delegateEvents(this.events, this.hammer(), this._delegatedEvents = this._delegatedEvents || {});
        if (this.pageEvents && this.pageView)
          this._delegateEvents(this.pageEvents, this.pageView.hammer(), this._delegatedPageEvents = this._delegatedPageEvents || {});
      },
      
      undelegateDOMEvents: function() {
        this._undelegateDOMEvents(this._delegatedEvents, this.hammer());
        if (this.pageView)
          this._undelegateDOMEvents(this._delegatedPageEvents, this.pageView.hammer());
      },
      
      redelegateDOMEvents: function() {
        this.undelegateDOMEvents();
        this.delegateDOMEvents();
      },
      
      hammer: function(options){
        if (!this._hammered && this.el) {
          this._hammered = true;
          this._hammer = new Hammer(this.el, this.hammerOptions || {}, Backbone.hammerOptions);
//          this._hammer.on(hammer_events, this._debug.bind(this));
        }
        
        return this._hammer;
      },

      _debug: function(e) {
        var args = _.toArray(arguments);
        args.unshift('events', this.TAG, 'HAMMER');
        G.log('events', this.TAG + ' Hammer ' + e.type.toUpperCase() + ' ' + _.now());
      }
    });
    
    proxyViewFunctionTo(Backbone.View.prototype, CSS, 'addClass', 'removeClass', 'css');
    proxyViewFunctionTo(Backbone.View.prototype, HTML, 'attr');
  })(document, _, Backbone, U.HTML, U.CSS);
  
  var eventObjs = ['events', 'myEvents', 'globalEvents', 'pageEvents', 'windowEvents'];
  
  function mixin() {
    var to = this.prototype;
    for (var i = 0, numMixins = arguments.length; i < numMixins; i++) {
      var mixin = arguments[i],
          from = mixin.prototype,
          namespace = (mixin.displayName || _.randomString(10).toLowerCase());
      
      _.extendMethod(to, from, 'initialize');
      _.extendMethod(to, from, 'render');
      
      _.defaults(to, from);                
      _.defaults(to.events, namespaceEvents(from.events, namespace, true)); // namespace events to prevent collisions
      _.defaults(to.pageEvents, namespaceEvents(from.pageEvents, namespace, true));
      _.defaults(to.windowEvents, namespaceEvents(from.windowEvents, namespace, true));
      _.defaults(to.globalEvents, namespaceEvents(from.globalEvents, namespace));
      _.defaults(to.myEvents, namespaceEvents(from.myEvents, namespace));
//      _.defaults(to.events, from.events);
//      _.defaults(to.pageEvents, from.pageEvents);
//      _.defaults(to.windowEvents, from.windowEvents);
//      _.defaults(to.globalEvents, from.globalEvents);
//      _.defaults(to.myEvents, from.myEvents);
    }
  };

  function namespaceEvents(events, namespaceStr, postpend) {
    var namespaced = {};
    for (var prop in events) {
      var namespacedName = postpend ? prop + '..' + namespaceStr : '..' + namespaceStr + ' ' + prop;
      namespaced[namespacedName] = events[prop];
    }
    
    return namespaced;
  }
  
  function patchBackboneExtend() {
    // https://github.com/onsi/cocktail
    var originalExtend = Backbone.View.extend;
    var extend = function(protoProps, classProps) {
//      for (var p in protoProps) {
//        if (typeof protoProps[p] == 'function')
//          protoProps[p] = U.toTimedFunction(protoProps, p, 2);
//      }      

      var klass = originalExtend.call(this, protoProps, classProps),
          mixins = klass.prototype.mixins;

      for (var i = 0; i < eventObjs.length; i++) {
        var events = eventObjs[i];
        if (klass.prototype[events]) {
          klass.prototype[events] = _.clone(klass.prototype[events]); // otherwise we may inadvertently end up mixing in events to superclasses
        }
      }
      
      if (mixins && klass.prototype.hasOwnProperty('mixins'))
        mixin.apply(klass, mixins);

      return klass;
    };

    _([/*Backbone.Model, Backbone.Collection, Backbone.Router,*/ Backbone.View]).each(function(klass) {
      klass.mixin = mixin;
      klass.extend = extend;
      klass.prototype.mixes = function(mixin) {
        if (typeof mixin == 'string') {
          return _.any(this.mixins, function(m) {
            return m.displayName == mixin;
          });
        }
        else
          return _.contains(this.mixins, mixin);
      };
      
      klass.mixes = function(mixin) {
        return this.prototype.mixes(mixin);
      };
    })
  };
  
  patchBackboneExtend();
  Backbone.Mixin = {
    extend: Backbone.View.extend
  };
});