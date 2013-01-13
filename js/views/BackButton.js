define([
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!events' 
], function($, __jqm__, _, Backbone, Templates, Events) {
  return Backbone.View.extend({
    template: 'backButtonTemplate',
    events: {
      'click #back': 'back'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'back');
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