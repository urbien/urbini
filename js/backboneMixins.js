define('backboneMixins', ['globals', 'underscore', 'backbone', 'events', 'utils', 'hammer'], function(G, _, Backbone, Events, U, Hammer) {
  var doc = document;
      

//  (function(_, Hammer) {
//    var HAMMER_ID_PROP = '_hammerId',
//        hammerOn = Hammer.Instance.prototype.on,
//        pullOff = Hammer.Instance.prototype.off,
//        cache = {},
//        props = "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" ");
//    
//    function returnTrue() {
//      return true;
//    };
//    
//    function returnFalse() {
//      return false;
//    };
//    
//    function fix(event) {
//      var stop = event.stopPropagation,
//          stopImmediately = event.stopImmediatePropagation;
//      
//      event.stopPropagation = function() {
//        stop.call(event);
//        this._propagationStopped = true;
//      };
//
//      event.stopPropagation = function() {
//        stop.call(event);
//        this._propagationStopped = true;
//      };
//      
//      event.stopImmediatePropagation = function() {
//        this.stopPropagation();
//        this._immediatePropagationStopped = true;
//      };
//      
//      return event;
//    };
//
////    function selectsParentOf(node, selector) {
////      var matched = this.querySelectorAll(selector);
////      for (var i = 0; i < matched.length; i++) {
////        if (matched[i].contains(node))
////          return true;
////      }
////    }
//    
//    /**
//     * @return true if "node" can be selected by "selector" inside "this" (a DOM element), false otherwise
//     */
//    function isSelectedBy(node, selector) {
//      return _.contains(this.querySelectorAll(selector), node);
//    }
//    
//    function getHandlerQueue(event, handleObjs) {
//      var queue = [],
//          delegatesCount = handleObjs.delegatesCount,
//          handleObj,
//          cur = event.target;
//      
//      // Find delegate handlers
//      // Black-hole SVG <use> instance trees (#13180)
//      // Avoid non-left-click bubbling in Firefox (#3861)
//      if (delegatesCount && cur.nodeType && (!event.button || event.type !== "click") ) {
//        for ( ; cur != this; cur = cur.parentNode || this ) {
//
//          // Don't check non-elements (#13208)
//          // Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
//          if ( cur.nodeType === 1 && (cur.disabled !== true || event.type !== "click") ) {
//            matches = [];
//            for ( i = 0; i < delegatesCount; i++ ) {
//              handleObj = handleObjs[i];
//
//              // Don't conflict with Object.prototype properties (#13203)
////              sel = handleObj.selector + " ";
////              if ( matches[ sel ] === undefined ) {
////                matches[ sel ] = handleObj.needsContext ?
////                  jQuery( sel, this ).index( cur ) >= 0 :
////                  jQuery.find( sel, this, null, [ cur ] ).length;
////              }
////              if ( matches[ sel ] ) {
////                matches.push( handleObj );
////              }
//              
//              if (isSelectedBy.call(this, cur, handleObj.selector))
//                matches.push(handleObj);
//            }
//            
//            if ( matches.length ) {
//              queue.push({ el: cur, handleObjs: matches });
//            }
//          }
//        }
//      }
//
//      // Add the remaining (directly-bound) handlers
//      if ( delegatesCount < handleObjs.length ) {
//        queue.push({ el: this, handleObjs: handleObjs.slice(delegatesCount) });
//      }
//      
//      return queue;
//    }
//    
//    function dispatchEvent(event) {
//      var id, data, events, matched, match, el, handleObj, handleObjs, i, j, returnValue;
//      
//      id = this[HAMMER_ID_PROP];
//      if (!id)
//        return;
//        
//      data = cache[id];
//      if (!data)
//        return;
//      
//      events = data.events;
//      if (!events)
//        return;
//        
//      matched = getHandlerQueue.call(this, event, events[event.type]);
//      if (!matched || !matched.length)
//        return;
//      
//      //handleObjs = getHandlers.call(this, event, handleObjs);
//      event = fix(event);
//      i = 0;
//      while ((match = matched[i++]) && !event._propagationStopped) {
//        event.currentTarget = el = match.el;
//        handleObjs = match.handleObjs;
//        j = 0;
//        while ((handleObj = handleObjs[j++]) && !event._immediatePropagationStopped) {        
//          returnValue = handleObj.handler.apply(el, arguments);
//          if (returnValue !== undefined) {
//            if ((event.result = returnValue) === false) {
//              event.preventDefault();
//              event.stopPropagation();
//            }           
//          }
//        }
//      }
//      
//      return event.result;
//    }
//    
//    Hammer.Instance.prototype.on = function(type, selector, handler) {
//      var el = this.element,
//        id = el[HAMMER_ID_PROP],
//        eventHandle,
//        handleObj,
//        events,
//        data;
//        
//      if (!id) {
//        id = G.nextId();
//        el[HAMMER_ID_PROP] = id;
//        cache[id] = {
//          el: this.element
//        }
//      }
//      
//      data = cache[id];
//      if (!(events = data.events)) {
//        events = data.events = {};
//      }
//  
//      if (!(events = data.events[type])) {
//        events = data.events[type] = [];
//        events.delegatesCount = 0;
//      }
//      
//      if (!(eventHandle = data.handle)) {
//        eventHandle = data.handle = function(e) {
//          dispatchEvent.apply(el, arguments);
//        }
//      }
//      
//      handleObj = {
//        type: type,
//        selector: selector == "" ? undefined : selector,
//        handler: handler
//      };
//      
//      if (selector) {
//        events.splice(events.delegatesCount++, 0, handleObj);
//      } else {
//        events.push(handleObj);
//      }
//
//      return hammerOn.call(this, type, eventHandle);
//    };
//    
//    Hammer.Instance.prototype.off = function(type, selector, handler) {
//      var el = this.element,
//          id,
//          data,
//          events,
//          handleObjs,
//          i,
//          result;
//      
//      id = el[HAMMER_ID_PROP];
//      if (!id)
//        return;
//      
//      data = cache[id];
//      events = data.events;
//      if (!events)
//        return;
//
//      if (!arguments.length) {
//        for (var type in events) {
//          this.off(type);
//        }
//        
//        return;
//      }      
//
//      handleObjs = events[type];
//      if (!handleObjs)
//        return;
//        
//      i = handleObjs.length;
//      while (--i) {
//        var handleObj = handleObjs[i];
//        if (handleObj.selector == selector) {
//          result = pullOff.call(this, type, handleObj.handler);
//          Array.remove(handleObjs, i, i + 1);
//        }
//      }
//      
//      return result;
//    };
//  })(_, Hammer);
  
  (function(_, Backbone) {
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
//    var domEventTypes = ['events', 'pageEvents', 'windowEvents'];
    
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
          var attrs = _.extend({}, _.result(this, 'attributes'));
          if (this.id) attrs.id = _.result(this, 'id');
          if (this.className) attrs['class'] = _.result(this, 'className');
//          var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
          var el = doc.createElement(_.result(this, 'tagName'));
          for (var name in attrs) {
            el.setAttribute(name, attrs[name]);
          }
          
          this.setElement(el, false);
//          this.setElement($el, false);
        } else {
          this.setElement(_.result(this, 'el'), false);
        }
      },
      
//      $: function(selector) {
//        return this.el.querySelectorAll(selector);
//      },
      
      setElement: function(element, delegate) {
        var $element = element instanceof $ ? element : $(element);
        element = $element[0];
        if (this.el) {
          if (this.el == element)
            return;
        
          this.undelegateEvents();
        }
        
        this.$el = $element;
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
      
      _hammered: false,
//      _getHammerNamespace: function() {
//        return this._hammerNamespace || (this._hammerNamespace = '.hammerEvents' + this.TAG + this.cid);
//      },
//
//      undelegateEvents: function(events) {
//        if (this._hammered) {
//          this.hammer().off(this._getHammerNamespace());
////          var hammer = this._hammer;
////          if (!(events || (events = _.result(this, 'events')))) return this;
////          for(var key in events) {            
////            var method = events[key];
////            if (!_.isFunction(method)) method = this[events[key]];
////            if (!method) continue;
////
////            var match = key.match(delegateEventSplitter);
////            var eventName = match[1], selector = match[2];
////            if (selector === '') {
////              hammer.off(eventName, method);
////            } else {
////              hammer.off(eventName, selector, method);
////            }
////          }
//        }
//        
//        return this;
//      },
//      
//      delegateEvents: function(events) {
//        var options = _.defaults(this.hammerOptions || {}, Backbone.hammerOptions),
//            hammer = this.hammer(options),
//            hammerNamespace = this._getHammerNamespace();
//        
//        if (!hammer) return this;
//        if (!(events || (events = _.result(this, 'events')))) return this;
//        this.undelegateEvents();
//        for(var key in events) {
//          var method = events[key];
//          if (!_.isFunction(method)) method = this[events[key]];
//          if (!method) continue;
//
//          var match = key.match(delegateEventSplitter);
//          var eventName = match[1], selector = match[2];
//          eventName = Events.getEventName(eventName);
//          eventName += hammerNamespace;
//          method = _.bind(method, this);
//          if (selector === '') {
//            hammer.on(eventName, method);
//          } else {
//            hammer.on(eventName, selector, method);
//          }
//        }
//        return this;
//      },
//
//      hammer: function(options){
//        var hammer = this.$el.hammer(options);
//        if (!this._hammered) {
//          this._hammered = true;
////          if (G.DEBUG)
////            hammer.on(hammer_events, this._debug.bind(this));
//        }
//        
//        return hammer;
//      },
//
//      _bindHammerEventHandler: function(eventName, selector, handler) {
//        var hammer = this._hammer,
//            el = this.el;
//            
//        if (selector === '') {
//          hammer.on(eventName, function(e) {
//            
//          });
//        } else {
//          hammer.on(eventName, selector, method);
//        }
//      },
//      
//      delegateEvents: function(events) {
//        this.undelegateEvents();
//        var options = _.defaults(this.hammerOptions || {}, Backbone.hammerOptions),
//            hammer = this.hammer(options);
//            
//        if (!hammer) return this;
//        if (!(events || (events = _.result(this, 'events')))) return this;
//        for(var key in events) {
//          var method = events[key];
//          if (!_.isFunction(method)) method = this[events[key]];
//          if (!method) continue;
//
//          var match = key.match(delegateEventSplitter);
//          var eventName = match[1], selector = match[2];
//          if (/\..*/.test(eventName)) {
//            console.warn('ignoring namespace on event: ' + eventName + ', in view ' + this.TAG);
//            eventName = eventName.replace(/\..*/, '');
//          }
//          
//          eventName = Events.getEventName(eventName);
////          method = _.bind(method, this);
////          this._bindHammerEventHandler(eventName, selector, method);
//          hammer.on(eventName, selector, method);
////          if (selector === '') {
////            hammer.on(eventName, method);
////          } else {
////            hammer.on(eventName, selector, method);
////          }
//        }
//        
//        return this;
//      },
//
//      undelegateEvents: function(events) {
//        if (this._hammered) {
//          var hammer = this._hammer;
//          if (!(events || (events = _.result(this, 'events')))) return this;
//          for (var key in events) {            
//            var method = events[key];
//            if (!_.isFunction(method)) method = this[events[key]];
//            if (!method) continue;
//
//            var match = key.match(delegateEventSplitter);
//            var eventName = match[1], selector = match[2];
//            hammer.off(eventName, selector, method);
////            if (selector === '') {
////              hammer.off(eventName, method);
////            } else {
////              hammer.off(eventName, selector, method);
////            }
//          }
//        }
//        
//        return this;
//      },
//      
//      _delegatedEvents: {},
//      _hammers: [],
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
            options = this.hammerOptions,
            hammer;
            
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
              hammer = this._getHammer(els[i], options, true); // create if Hammer doesn't exist
              hammer.on(eventName, method);
            }
          }
          else
            hammer.on(eventName, method);
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
                  hammer = this._getHammer(_el);
              
              if (hammer)
                hammer.off(eventName, method);
            }
          }
          else {
            hammer.off(eventName, method);
          }
          
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
    
//    var render = Backbone.View.prototype.render;
//    Backbone.View.prototype.render = function() {
//      var result = render.apply(this, arguments);
//      this.delegateEvents();
//      if (_.isPromise(result) && result.state() == 'pending')
//        result.done(this.delegateEvents);
//      
//      return result;
//    };
  })(_, Backbone);
  
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
      _.defaults(to.events, namespaceEvents(from.events, namespace, true));
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