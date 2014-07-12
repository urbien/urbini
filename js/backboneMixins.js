define('backboneMixins', ['globals', 'underscore', 'backbone', 'events', 'utils', 'hammer', 'domUtils'], function(G, _, Backbone, Events, U, Hammer, DOM) {

  (function(doc, _, Backbone) {
    Backbone.hammerOptions = {
//      prevent_default: true,
//      tap_always: false
    };
    
    var delegateEventSplitter = /^(\.[^\s]*\s*)?(\S+)\s*(.*)$/;
    var viewOptions = ['hammerEvents', 'hammerOptions', 'pageView', 'model', 'resource', 'collection', 'source', 'parentView', 'returnUri', 'tagName'];
    var clonedPrototypeProps = ['style', 'attributes', 'classes'];
    
    var View = Backbone.View;
    var delegateEvents = View.prototype.delegateEvents;
    var undelegateEvents = View.prototype.undelegateEvents;
//    var hammer_events = 'touch release hold tap doubletap dragstart drag dragend dragleft dragright dragup dragdown swipe swipeleft swiperight swipeup swipedown transformstart transform transformend rotate pinch pinchin pinchout';
//    var hammer_events_arr = hammer_events.split(' ');
//
//    function hammerOn(el, hammer, event, selector, method) {
//      if (hammer_events.indexOf(event) == -1)
//        return el.$on(event, selector, method);
//      
//      var args = [event];
//      if (!method) {
//        method = selector;
//        selector = '';
//      }
//      else
//        args.push(selector);
//      
//      args.push(method);
//      if (!el._hammerProxies)
//        el._hammerProxies = {};
//      
//      if (!el._hammerProxies[selector])
//        el._hammerProxies[selector] = [];
//        
//      function proxy(e) {
//        el.dispatchEvent(e);
//      };
//      
//      proxy._original = method;
//      el._hammerProxies[selector].push(proxy);
//      hammer.on(event, proxy);
//      return el.$on.apply(el, args);
//    };
//    
//    function hammerOff(el, hammer, event, selector, method) {
//      if (!el._hammerProxies || hammer_events_arr.indexOf(event) == -1)
//        return;
//      
//      var args = [event],
//          proxies,
//          proxy,
//          i;
//      
//      if (!method) {
//        method = selector;
//        selector = '';
//      }
//      else
//        args.push(selector);
//      
//      proxies = el._hammerProxies[selector];
//      if (!proxies)
//        return;
//      
//      args.push(method);
//      i = proxies.length;
//      while (i--) {
//        proxy = proxies[i];
//        if (method) {
//          if (proxy._original == method) {
//            hammer.off(event, proxy);
//            Array.removeFromTo(proxies, i, i + 1);
//            break;
//          }
//        }
//        else
//          hammer.off(event, proxy);          
//      }
//      
//      if (!method)
//        proxies.length = 0;
//        
//      el.$off.apply(el, args);
//    }
    
    /**
     * @return obj[name] or this[obj[name]] depending on which is a function 
     */
    function getFunction(obj, key) {
      var fn = obj[key];
      fn = typeof fn == 'function' ? fn : this[fn];
      return fn;
    }
    
    function getEventName(key) {
      return getEventInfo(key).eventName;
    }
    
    function getEventInfo(key) {
      var match = key.match(delegateEventSplitter),
          eventName = match[2],
          selector = match[3];
      
      if (/\..*/.test(eventName)) {
//        G.log('events', 'ignoring namespace on event: ' + eventName);
        eventName = eventName.replace(/\..*/, '');
      }
      
      match.eventName = Events.getEventName(eventName);
      match.selector = selector;
      match.length = 0;
      return match;
    }
    
    Backbone.View = View.extend({
      tagName: null,
      defaultTagName: 'div',
//      viaHammer: false,
      constructor: function(options){
        options = options || {};
//        if (!_.has(options, 'delegateEvents') && this.autoFinish !== false)
//          options.delegateEvents = false;
        
        _.extend(this, _.pick(options, viewOptions));

        this._delegatedEventsFor = [];
        this.autocreate = !!( !this.parentView || this.tagName || options.createElement );
        // don't autocreate elements for subviews unless:
        //   this view has the tagName property OR
        //   the "createElement" option has been specified

        this.pageView = this.getPageView();
        this.delegateNonDOMEvents();

        var i = clonedPrototypeProps.length;
        while (i--) {
          var prop = clonedPrototypeProps[i],
              val = this[prop];
          
          if (val)
            this[prop] = _.clone(val); // otherwise it will be the same object the prototype points to
        }
        
        return View.apply(this, arguments);
      },

      isPageView: function(view) {
        return false;
      },
      
      getPageView: function() {
        if (this.pageView)
          return this.pageView;
        
        var parent = this;
        while (parent.parentView) {
          parent = parent.parentView;
          if (parent.isPageView())
            return parent;
        }
      },
      
      _ensureElement: function(options) {
        options = options || {};
        if (!this.el) {
          if (!this.autocreate)
            return;
          
          var el = doc.createElement(_.result(this, 'tagName') || this.defaultTagName);          
          this.setElement(el, false);          
        } else {
          this.setElement(_.result(this, 'el'), false);
        }
      },
      
      $: function(selector) {
        // simple version
        // return this.el ? this.el.querySelectorAll(selector) : [];
        
        // version with parsing
//        if (/^\#[^\.\s,]+$/.test(selector)) {
          // id selector
//          return this.el ? this.el.querySelector(selector) : null; // for #id based selectors, return the first match
//          return this.el ? this.el.querySelectorAll(selector) : []; // for #id based selectors, return the first match
//        }
        
//        if (/^\.[^\.\s\#,]+$/.test(selector)) {
//          // class selector
//          return this.el ? this.el.getElementsByClassName(selector.slice(1)) : []; // for class based selectors, use getElementsByClassName, which is faster
//        }
//        else if (/^[a-zA-Z0-9]+$/.test(selector)) {
//          // tag selector
//          return this.el ? this.el.getElementsByTagName(selector) : []; // for tag selectors, use getElementsByTagName, which is faster
//        }
//        else {
//          // generic selector
//          return this.el ? this.el.querySelectorAll(selector) : [];
//        }
        return this.el ? this.el.$(selector) : DOM.emptyNodeList();
      },
      
      setElement: function(element, delegate) {
//        var $element = element instanceof $ ? element : $(element),
        var renderData = DOM.blankRenderData(),
            attrs,
            classes,
            style;
        
//        element = $element[0];
//        this.$el = $element; // may not be set yet even if this.el is
        if (this.el) {
          if (this.el == element && ~this._delegatedEventsFor.indexOf(this)) // events have been delegated
            return this;
        
          this.undelegateEvents();
        }
        
        this.el = element;
        if (this.classes) 
          classes = _.result(this, 'classes');
        else if (this.className) 
          classes = _.result(this, 'className');
        
        if (classes && _.isArray(classes))
          classes = classes.join(' '); //classes.split(' ');

        if (classes)
          renderData['class']['set'] = classes;
        
        if (this.style) 
          renderData.style.add = _.result(this, 'style');
        
        attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) 
          attrs.id = _.result(this, 'id');
        
        if (attrs)
          renderData.attributes.add = attrs;
          
        DOM.render(this.el, renderData);
//        if (this.viaHammer)
//          this.hammer();
        
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
        
//        this.undelegateDOMEvents();
//        this.el.innerHTML += html;
//        this.delegateDOMEvents();
        this.html(this.el.innerHTML + html);
      },
      
      html: function(html) {
        if (!this.el)
          throw "can't set HTML for a view with no element";
        
        this.el.$html(html); // it's the responsibility of the dev to call view.redelegateEvents();
      },
      
      empty: function() {
//        this.undelegateEvents(); // modern browsers will auto-unbind
        this.el.$empty();
      },
      
      _hammered: false,
//      _getHammer: function(el, options, create) {
//        var hammers = this._hammers = this._hammers || [];
//        for (var i = 0; i < hammers.length; i++) {
//          var hammer = hammers[i];
//          if (hammer.element == el)
//            return hammer;
//        }
//        
//        if (create) {
//          var hammer = new Hammer(el, options);
//          hammers.push(hammer);
//          return hammer;
//        }
//      },
//
//      _delegateDOMEvents1: function(events, view, delegated) {
//        var el = view.el,
//            hammer = view._hammer,
//            options = this.hammerOptions,
//            gutless = !el.childNodes.length,
//            method,
//            eventInfo,
//            eventName;
//            
//        for(var key in events) {
//          if (delegated[key])
//            continue;
//          
//          eventInfo = getEventInfo(key);
//          if (gutless && eventInfo.selector)
//            continue;
//          
//          eventName = eventInfo.eventName;
//          method = getFunction.call(this, events, key);
//          method = _.bind(method, this);
//          delegated[key] = method;
//
//          if (eventInfo.selector) {
//            var els = el.$(eventInfo.selector),
//                i = els.length;
//            
//            while (i--) {
//              els[i].$on(eventName, method);
//            }
//            
//          }
//          else {
//            if (hammer)
//              hammer.on(eventName, method); // use view's hammer (for view element)
//            else
//              el.$on(eventName, method);
//          }
//        }
//      },

      _delegateDOMEvents: function(events, view) {
        if (~this._delegatedEventsFor.indexOf(view))
          return;
        
        var el = view.el,
            hammer = view._hammer,
            options = this.hammerOptions,
            gutless = !el.childNodes.length,
            method,
            eventInfo,
            eventName;
            
        for(var key in events) {
//          if (delegated[key])
//            continue;
          
          eventInfo = getEventInfo(key);
//          if (gutless && eventInfo.selector)
//            continue;
          
          eventName = eventInfo.eventName;
          method = getFunction.call(this, events, key);
//          method = _.bind(method, this);
          if (eventInfo.selector) {
//            if (hammer)
//              hammerOn(el, hammer, eventName, eventInfo.selector, method);
//            else
              el.$on(eventName, eventInfo.selector, method);
          }
          else {
//            if (hammer)
//              hammerOn(el, hammer, eventName, method);
//            else
              el.$on(eventName, method);
          }
        }
        
        this._delegatedEventsFor.push(view);
      },

      delegateNonDOMEvents: function() {
        this._nondomDelegated ? this._nondomDelegated++ : this._nondomDelegated = 1;
//        if (this._nondomDelegated > 1)
//          this.log("delegate", "non-DOM", this._nondomDelegated);
        
        var globalEvents = this.globalEvents,
            windowEvents = this.windowEvents,
            myEvents = this.myEvents,
            modelEvents = this.modelEvents;
        
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
                  fn = getFunction.call(this, windowEvents, key).bind(this);
              
              delegated[key] = fn;
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

        if (modelEvents) {
          var delegated = this._delegatedModelEvents = this._delegatedModelEvents || {};
          for (var key in modelEvents) {
            if (!_.has(delegated, key)) {
              var eventName = getEventName(key),
                  fn = getFunction.call(this, modelEvents, key);
              
              delegated[key] = fn;
              this.listenTo(this.model, eventName, fn, this);
            }
          }
        }
      },

      /**
       * delegates DOM (from events, pageEvents blocks) and non-DOM (from windowEvents, globalEvents, myEvents blocks) events from this view
       */
      delegateAllEvents: function() {
        this.delegateEvents();
        this.delegateNonDOMEvents();
        return this;        
      },
      
//      _undelegateDOMEvents: function(delegated, view) {
//        if (!delegated || !view.el)
//          return;
//        
//        var el = view.el,
//            hammer = view._hammer,
//            gutless = !el.childNodes.length,
//            eventInfo,
//            eventName,
//            method;
//        
//        for (var key in delegated) {
//          eventInfo = getEventInfo(key);
//          if (gutless && eventInfo.selector)
//            continue;
//          
//          eventName = eventInfo.eventName;
//          method = delegated[key];
//          if (eventInfo.selector) {
//            els = el.$(eventInfo.selector);
//            i = els.length;
//            while (i--) {
//              els[i].$off(eventName, method);
//            }
//          }
//          else {
//            if (hammer)
//              hammer.off(eventName, method);
//            else
//              el.$off(eventName, method);
//          }
//          
//          delete delegated[key];
//        }
//      },
      
      _undelegateDOMEvents: function(view) {
        view = view || this;
        if (this._delegatedEventsFor.indexOf(view) == -1)
          return;
        
        var el = view.el,
            events = view.events,
            eventInfo,
            event,
            selector,
            method;
        
        if (events) {
          for (var key in events) {
            method = events[key];
            if (typeof method == 'string')
              method = view[method];
            
            eventInfo = getEventInfo(key);
            selector = eventInfo.selector;
            event = eventInfo.eventName;
            if (selector)
              el.$off(event, selector, method);
            else
              el.$off(event, method);
          }
        }
        
        Array.remove(this._delegatedEventsFor, view);
      },

      undelegateNonDOMEvents: function() {        
        var globalEvents = this._delegatedGlobalEvents,
            myEvents = this._delegatedMyEvents,
            windowEvents = this._delegatedWindowEvents,
            modelEvents = this._delegatedModelEvents;
        
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
        
        if (modelEvents) {
          for (var key in modelEvents) {
            var fn = modelEvents[key];
            this.stopListening(this.model, getEventInfo(key).eventName, fn, this);
          }
        }
      },
      
      /**
       * undelegates DOM (from events, pageEvents blocks) and non-DOM (from windowEvents, globalEvents, myEvents blocks) events from this view
       */
      undelegateAllEvents: function() {
        this.undelegateEvents();        
        this.undelegateNonDOMEvents();
        return this;
      },
      
      /**
       * delegates DOM events from this view (from events and pageEvents blocks)
       */
      delegateEvents: function() {
        if (this.el) {
          this._domDelegated ? this._domDelegated++ : this._domDelegated = 1;
//          if (this._domDelegated > 1)
//            this.log("delegate", "DOM", this._domDelegated);
          
  //        if (!this.rendered)
  //          return;
          
          if (this.events)
            this._delegateDOMEvents(this.events, this); //, this._delegatedEvents = this._delegatedEvents || {});
          if (this.pageEvents && this.pageView)
            this._delegateDOMEvents(this.pageEvents, this.pageView); //, this._delegatedPageEvents = this._delegatedPageEvents || {});
        }
        
        return this;
      },
      
      /**
       * undelegates DOM events from this view (from events and pageEvents blocks)
       */
      undelegateEvents: function() {
        if (this.el) {
          if (this.events) {
            this._undelegateDOMEvents(); ///*this._delegatedEvents, */this);
//            delete this._delegatedEvents;
          }
          if (this.pageEvents && this.pageView) {
            this._undelegateDOMEvents(/*this._delegatedPageEvents, */this.pageView);
//            delete this._delegatedPageEvents;
          }
        }
        
        return this;
      },
      
      redelegateEvents: function() {
//        this.undelegateEvents();
//        this.delegateEvents();
      },
      
//      hammer: function(options) {
//        if ((!this._hammered && this.el) || 
//            (this._hammered && this.el !== this._hammer.element)) {
//          this._hammered = true;
//          this._hammer = new Hammer(this.el, this.hammerOptions || {}, Backbone.hammerOptions);
////          this._hammer.on(hammer_events, this._debug.bind(this));
//        }
//        
//        return this._hammer;
//      },

      _debug: function(e) {
        var args = _.toArray(arguments);
        args.unshift('events', this.TAG, 'HAMMER');
        G.log('events', this.TAG + ' Hammer ' + e.type.toUpperCase() + ' ' + _.now());
      }
    });
    
//    var ViewProto = Backbone.View.prototype,
//        proxyFns = ['addClass', 'removeClass', 'css', 'attr'],
//        i = proxyFns.length;
//    
//    _.each(proxyFns, function(fnName) {
//      ViewProto[fnName] = function() {
//        var context = this.el,
//            arg = arguments[0],
//            args = arguments;
//        
//        if (arg instanceof Node || arg instanceof NodeList) { 
//          context = arg;
//          args = _.rest(arguments);
//        }
//        
//        if (!context)
//          throw "no HTML element provided to " + fnName;
//          
//        return context[fnName].apply(context, args);
//      };
//    });
    
  })(document, _, Backbone);
  
  var eventObjs = ['events', 'myEvents', 'globalEvents', 'pageEvents', 'windowEvents'];
  
//  function mixin() {
//    var to = this.prototype;
//    for (var i = 0, numMixins = arguments.length; i < numMixins; i++) {
//      var mixin = arguments[i],
//          from = mixin.prototype,
//          fromCl = from.className,
//          toCl = to.className,
//          namespace = (mixin.displayName || _.randomString(10).toLowerCase());
//      
//      _.extendMethod(to, from, 'initialize');
//      _.extendMethod(to, from, 'render');
//      
//      _.defaults(to, from);                
//      _.defaults(to.attributes, from.attributes);
//      _.defaults(to.style, from.style);
//      _.defaults(to.events, namespaceEvents(from.events, namespace, true)); // namespace events to prevent collisions
//      _.defaults(to.pageEvents, namespaceEvents(from.pageEvents, namespace, true));
//      _.defaults(to.windowEvents, namespaceEvents(from.windowEvents, namespace, true));
//      _.defaults(to.globalEvents, namespaceEvents(from.globalEvents, namespace));
//      _.defaults(to.myEvents, namespaceEvents(from.myEvents, namespace));
//      
//      if (fromCl)
//        to.className = _.unique(_.compact((fromCl + ' ' + (toCl || '')).split(' '))).join(' ');
//      
////      _.defaults(to.events, from.events);
////      _.defaults(to.pageEvents, from.pageEvents);
////      _.defaults(to.windowEvents, from.windowEvents);
////      _.defaults(to.globalEvents, from.globalEvents);
////      _.defaults(to.myEvents, from.myEvents);
//    }
//  }

  function namespaceEvents(events, namespaceStr, postpend) {
    var namespaced = {};
    for (var prop in events) {
      var namespacedName = postpend ? prop + '..' + namespaceStr : '..' + namespaceStr + ' ' + prop;
      namespaced[namespacedName] = events[prop];
    }
    
    return namespaced;
  }
  
//  function patchBackboneExtend() {
//    // https://github.com/onsi/cocktail
//    var originalExtend = Backbone.View.extend;
//    var extend = function(protoProps, classProps) {
////      for (var p in protoProps) {
////        if (typeof protoProps[p] == 'function')
////          protoProps[p] = U.toTimedFunction(protoProps, p, 2);
////      }      
//
//      var klass = originalExtend.call(this, protoProps, classProps),
//          mixins = klass.prototype.mixins;
//
//      for (var i = 0; i < eventObjs.length; i++) {
//        var events = eventObjs[i];
//        if (klass.prototype[events]) {
//          klass.prototype[events] = _.clone(klass.prototype[events]); // otherwise we may inadvertently end up mixing in events to superclasses
//        }
//      }
//      
//      if (mixins && klass.prototype.hasOwnProperty('mixins'))
//        mixin.apply(klass, mixins);
//
//      return klass;
//    };
//
//    _([/*Backbone.Model, Backbone.Collection, Backbone.Router,*/ Backbone.View]).each(function(klass) {
//      klass.mixin = mixin;
//      klass.extend = extend;
//      klass.prototype.mixes = function(mixin) {
//        if (typeof mixin == 'string') {
//          return _.any(this.mixins, function(m) {
//            return m.displayName == mixin;
//          });
//        }
//        else
//          return _.contains(this.mixins, mixin);
//      };
//      
//      klass.mixes = function(mixin) {
//        return this.prototype.mixes(mixin);
//      };
//    })
//  }
//  
//  patchBackboneExtend();
//  Backbone.Mixin = {
//    extend: Backbone.View.extend
//  };
});