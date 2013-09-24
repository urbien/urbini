define('backboneMixins', ['underscore', 'backbone', 'events'], function(_, Backbone, Events) {
  function mixin() {
    var to = this.prototype;
    for (var i = 0, numMixins = arguments.length; i < numMixins; i++) {
      var mixin = arguments[i],
          from = mixin.prototype;
      
      _.extendMethod(to, from, 'initialize');
      _.extendMethod(to, from, 'render');
      _.defaults(to, from);
      
      var namespace = (mixin.displayName || _.randomString(10).toLowerCase());
      _.defaults(to.events, namespaceEvents(from.events, namespace, true));
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
      klass.prototype.usesMixin = function(mixin) {
        return _.contains(this.mixins, mixin);
      };
      
      klass.usesMixin = function(mixin) {
        return _.contains(this.prototype.mixins, mixin);
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
  Backbone.Mixin = {
    extend: Backbone.View.extend
  };
});