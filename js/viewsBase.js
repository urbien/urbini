define([
  'cache!backbone' 
], function(Backbone) {
  Backbone.View.prototype.close = function() {
    this.remove();
    this.unbind();
    if (this.onClose){
      this.onClose();
    }
  }; 
});