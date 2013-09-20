define('backboneMixins', ['underscore', 'backbone', 'events'], function(_, Backbone, Events) {
  function mixin() {
    var to = this.prototype;
    for (var i = 0, numMixins = arguments.length; i < numMixins; i++) {
      var from = arguments[i];
      
      // we add those methods which exists on `from` but not on `to` to the latter
//      for (var prop in from) {
//        var val = from[prop],
//            origVal = to[prop];
//        
//        switch (Object.prototype.toString.call(val)) {
//          case '[object Function]':
//            if (prop == 'initialize' || prop == 'render')
//              _.extendMethod(to, from, prop);            
//            else {
//              if (!origVal)
//                to[prop] = val;
//            }
//            
//            break;
//          case '[object Object]':          
//          case '[object Array]':
//          default:
//            if (!origVal)
//              to[prop] = _.clone(val);
//            
//            break;
//        }
//      }
      
      _.extendMethod(to, from, 'initialize');
      _.extendMethod(to, from, 'render');
      _.defaults(to, from);
      
      // … and we do the same for events
      _.defaults(to.events, from.events);
      _.defaults(to.windowEvents, from.windowEvents);
      _.defaults(to.globalEvents, from.globalEvents);
      _.defaults(to.myEvents, from.myEvents);
    }
  };
  
  function patchBackboneExtend() {
    // https://github.com/onsi/cocktail
    var originalExtend = Backbone.Model.extend;
    var extend = function(protoProps, classProps) {
      var klass = originalExtend.call(this, protoProps, classProps),
          mixins = klass.prototype.mixins;
      
      if (mixins && klass.prototype.hasOwnProperty('mixins'))
        mixin.apply(klass, mixins);

      return klass;
    };

    _([Backbone.Model, Backbone.Collection, Backbone.Router, Backbone.View]).each(function(klass) {
      klass.mixin = mixin;
      klass.extend = extend;
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
  //        ,
  //        windowEvents: window
        },
        windowEvents = this.windowEvents;

      for (var eventsType in eventContexts) {
        var events = this[eventsType],
            context = eventContexts[eventsType];
       
        if (events && context) {
          for (var name in events) {
            var fnName = events[name],
                fn = typeof fnName == 'string' ? this[fnName] : fnName;
            
            this.listenTo(context, name, fn.bind(this));
          }
        }
      }
      
      if (windowEvents) {
        var subscribeFn = window.addEventListener || window.attachEvent; 
        for (var name in windowEvents) {
          var fnName = windowEvents[name],
              fn = this[fnName] = this[fnName].bind(this);
  
          subscribeFn.call(window, name, fn, false);
        }
      }
    };
    
    ViewProto.undelegateEvents = function() {
      origUDE.apply(this, arguments);
      
      var windowEvents = this.windowEvents;
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
    };
  }
  
  patchBackboneExtend();
  patchBackboneEvents();
});