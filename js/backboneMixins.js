define('backboneMixins', ['underscore', 'backbone', 'events', 'utils', 'lib/jquery.hammer'], function(_, Backbone, Events, U) {  
  (function(_, Backbone) {
    if( !$.fn.hammer ){
      throw new Error('Hammer jQuery plugin not loaded.');
    }

    Backbone.hammerOptions = {
      prevent_default: true,
      no_mouseevents: true
    };
    
    var delegateEventSplitter = /^(\S+)\s*(.*)$/;
    var viewOptions = ['hammerEvents', 'hammerOptions'];

    var View = Backbone.View;
    var delegateEvents = View.prototype.delegateEvents;
    var undelegateEvents = View.prototype.undelegateEvents;

    Backbone.View = View.extend({
      constructor: function(options){
        options = options || {};
        _.extend(this, _.pick(options, viewOptions));
        return View.apply(this, arguments);
      },

      _hammered: false,

      undelegateEvents: function(){
        return this.undelegateHammerEvents();
//        return undelegateEvents.apply(this, arguments);
      },

      undelegateHammerEvents: function(){
        if (this._hammered) {
          this.hammer().off('.hammerEvents' + this.cid);
        }
        
        return this;
      },

      delegateEvents: function(){
//        delegateEvents.apply(this, arguments);
        return this.delegateHammerEvents();
//        return this;
      },

      delegateHammerEvents: function(events){
        var options = _.defaults(this.hammerOptions || {}, Backbone.hammerOptions);
        if (!(events || (events = _.result(this, 'events')))) return this;
        this.undelegateHammerEvents();
        for(var key in events) {
          var method = events[key];
          if (!_.isFunction(method)) method = this[events[key]];
          if (!method) continue;

          var match = key.match(delegateEventSplitter);
          var eventName = match[1], selector = match[2];
          eventsName = Events.getEventName(eventName);
          eventName += '.hammerEvents' + this.cid;
          method = _.bind(method, this);
          if (selector === '') {
            this.hammer(options).on(eventName, method);
          } else {
            this.hammer(options).on(eventName, selector, method);
          }
        }
        return this;
      },

      hammer: function(options){
        this._hammered = true;
        return this.$el.hammer(options);
      }
    });
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
      _.defaults(to.windowEvents, namespaceEvents(from.windowEvents, namespace));
      _.defaults(to.globalEvents, namespaceEvents(from.globalEvents, namespace));
      _.defaults(to.myEvents, namespaceEvents(from.myEvents, namespace));
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
  
  function patchBackboneEvents() {
    var ViewProto = Backbone.View.prototype,
        origDE = ViewProto.delegateEvents,
        origUDE = ViewProto.undelegateEvents;
    
    ViewProto.delegateEvents = function(events) {
      origDE.apply(this, arguments);
      var eventContexts = {
          myEvents: this,
          globalEvents: Events,
          modelEvents: this.model
//          ,
//          pageEvents: this.pageView.$el
  //        ,
  //        windowEvents: window
        },
        windowEvents = this.windowEvents,
        pageEvents = this.pageEvents,
        pageView = this.pageView,
        $pageViewEl = pageView && pageView.$el;

      for (var eventsType in eventContexts) {
        var events = this[eventsType],
            context = eventContexts[eventsType];
       
        if (events && context) {
          for (var name in events) {
            var fnName = events[name], //Events.getEventName(events[name]),
                fn = typeof fnName == 'string' ? this[fnName] : fnName;
                
            this.listenTo(context, name, fn.bind(this));
          }
        }
      }
      
      if (windowEvents) {
        var subscribeFn = window.addEventListener || window.attachEvent; 
        for (var name in windowEvents) {
          var fnName = windowEvents[name],
              fn = this[fnName];
  
          subscribeFn.call(window, name, fn, false);
        }
      }
      
      if (pageEvents && $pageViewEl) {
        for (var name in pageEvents) {
          var fnName = pageEvents[name],
              fn = this[fnName];
  
          $pageViewEl.on(name, fn);
        }        
      }
    };
    
    ViewProto.undelegateEvents = function() {
      origUDE.apply(this, arguments);
      
      var windowEvents = this.windowEvents,
          pageEvents = this.pageEvents,
          pageView = this.pageView,
          $pageViewEl = pageView && pageView.$el;
//      for (var name in myEvents) {
//        this.off(name, myEvents[name].bind(this));
//      }
      this.off();

//      for (var name in globalEvents) {
//        this.listenTo(Events, name, globalEvents[name].bind(this));
//      }      
      this.stopListening();

      if (windowEvents) {
        var unsubscribeFn = window.removeEventListener || window.deattachEvent; 
        for (var name in windowEvents) {
          unsubscribeFn.call(window, name, this[windowEvents[name]]);
        }
      }
      
      if (pageEvents && $pageViewEl) {
        for (var name in pageEvents) {
          var fnName = pageEvents[name],
              fn = this[fnName];

          $pageViewEl.off(name, fn);
        }
      }
    };
  }
  
  patchBackboneExtend();
  patchBackboneEvents();
  Backbone.Mixin = {
    extend: Backbone.View.extend
  };
});