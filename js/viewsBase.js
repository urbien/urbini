define([
  'underscore',
  'backbone',
  'templates',
  'utils'
], function(_, Backbone) {
  Backbone.View.prototype.close = function(){
    this.remove();
    this.unbind();
    if (this.onClose){
      this.onClose();
    }
  };  
});