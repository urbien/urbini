//'use strict';
define([
  'underscore', 
  'templates',
  'events', 
  'views/BasicView' 
], function(_, Templates, Events, BasicView) {
  return BasicView.extend({
    template: 'backButtonTemplate',
    events: {
      'click #back': 'back'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'back');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.template = _.template(Templates.get(this.template));
      return this;
    },
    back: function(e) {
      Events.stopEvent(e);
      Events.trigger('back');
      window.history.back();
      return this;
    },
    render: function(options) {
      if (!this.template)
        return this;
      
      if (typeof options !== 'undefined' && options.append)
        this.$el.append(this.template());
      else
        this.$el.html(this.template());
      
//      var noBack = window.history.length <= 1;
//      var a = this.$('a'), disabled = 'ui-disabled';
//      if (noBack)
//        a.addClass(disabled);
//      else {
//        if (a.hasClass(disabled))
//          a.removeClass(disabled);
//      }
      
      return this;
    }
  }, {
    displayName: 'BackButton'
  });
});