define([
  'cache!underscore',
  'cache!backbone',
  'cache!templates',
  'cache!utils'
], function(_, Backbone) {
  Backbone.View.prototype.close = function(){
    this.remove();
    this.unbind();
    if (this.onClose){
      this.onClose();
    }
  };  
});