$.extend({
  whenAll: function() {
    var dfd = $.Deferred(),
        len = arguments.length,
        counter = 0,
        state = "resolved",
        resolveOrReject = function() {
            if(this.state() === "rejected"){
                state = "rejected";
            }
            counter++;
  
            if(counter === len) {
                dfd[state === "rejected"? "reject": "resolve"]();   
            }
  
        };
  
  
     $.each(arguments, function(idx, item) {
         item.always(resolveOrReject); 
     });
  
    return dfd.promise();    
  },
  
  LazyDeferred: (function() {
    var dfd = $.Deferred();
    
    function lazy(init) {
      this.start = function() {
        init.call(dfd, dfd);
        return this.promise();
      };
      
      if (!(this instanceof lazy))
        return new lazy(init);
    };
      
    for (var fn in dfd) {
      if (typeof dfd[fn] == 'function') {
        lazy.prototype[fn] = dfd[fn].bind(dfd);
      }
    }
    
    return lazy;
  })()
});