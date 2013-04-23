//'use strict';
define([
  'underscore', 
  'utils',
  'events', 
  'views/BasicView' 
], function(_, U, Events, BasicView) {
  return BasicView.extend({
    templateName: 'backButtonTemplate',
    tagName: 'li',
    id: 'back',
    events: {
      'click': 'back'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'back');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate(this.templateName, 'template', this.vocModel.type); // fall back to default template if there is none specific to this particular model
      return this;
    },
    back: function(e) {
      Events.stopEvent(e);
      Events.trigger('back');
      return this;
    },
    render: function(options) {
      if (!this.template)
        return this;
      
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