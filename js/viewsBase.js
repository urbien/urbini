define([
  'cache!underscore', 
  'cache!backbone' 
], function(_, Backbone) {
  Backbone.View.prototype.close = function(){
    this.remove();
    this.unbind();
    if (this.onClose){
      this.onClose();
    }
  };  
});