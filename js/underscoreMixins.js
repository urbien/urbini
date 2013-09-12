define('underscoreMixins', ['underscore'], function(_) {
  var ArrayProto = Array.prototype,
      concat = ArrayProto.concat;
  
  _.extend(Array, {
    remove: function(array /* items */) {
      var items = concat.apply(ArrayProto, _.tail(arguments));
      
      for (var i in items) {
        var item = items[i],
            idx = array.indexOf(item);
        
        if (idx != -1)
          array.splice(idx, 1);
      }
      
      return array;
    },

    // courtesy of John Resig
    removeFromTo: function(array, from, to) {
      var rest = array.slice((to || from) + 1 || array.length);
      array.length = from < 0 ? array.length + from : from;
      return array.push.apply(array, rest);
    },

    last: function(array) {
      return Array.peek(array);
    },

    peek: function(array) {
      return array[array.length - 1];
    }    
  });  

  _.mixin({
    partial: function(fn) {
      var args = _.tail(arguments);
      return function() {
        return fn.apply(null, args.concat(_.toArray(arguments)));
      };
    },
    
    partialWith: function(fn, context) {
      var args = ArrayProto.slice.call(arguments, 2);
      return function() {
        return fn.apply(context, args.concat(_.toArray(arguments)));
      };
    },
    
    isPromise: function(obj) {
      return obj && typeof obj.then == 'function';
    }
  });
});