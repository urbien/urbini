// sample button that subclasses this button:
/*
define([
  'underscore', 
  'utils',
  'events', 
  'views/ToggleButton1' 
], function(_, U, Events, ToggleButton1) {
  return ToggleButton1.extend({
    templateName: 'someButtonTemplate',
    depressed: {
      event: 'video:on'  // event to trigger when this button is pressed
      target: this.resource,
      handler: function(e) {
        // do something when this button is depressed
      }
    },
    released: {
      event: 'video:off'        // event to trigger when this button is released
    },
    render: function(options) {      
      this.$el.html(this.template());
      return this;
    }
  }, {
    displayName: 'AToggleButton'
  });
});
*/


//'use strict';
define('views/ToggleButton1', [
  'underscore', 
  'utils',
  'events', 
  'views/BasicView' 
], function(_, U, Events, BasicView) {
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render'); //, 'chat');
      BasicView.prototype.initialize.apply(this, arguments);
      options = options || {};
      
      if (this.templateName)
        this.makeTemplate(this.templateName, 'template', this.modelType); // fall back to default template if there is none specific to this particular model
      
      _.extend(this, _.pick(options, ['depressed', 'released']));
      var btn = this;
      _.each(['depressed', 'released'], function(action) {
        var method = action === 'depressed' ? 'addClass' : 'removeClass';
        action = btn[action];
        if (action) {
          (action.target || btn.pageView).on(action.event, function() {
            btn.$('a')[method]('ui-btn-active');
            action.handler && action.handler.apply(this, arguments);
          });
        }        
      });

      return this;
    },
    events: {
      'vclick': 'toggle'
    },
    toggle: function(e) {
      Events.stopEvent(e);
      if (this.$('a').hasClass('ui-btn-active'))
        (this.released.target || this.pageView).trigger(this.released.event);
      else
        (this.depressed.target || this.pageView).trigger(this.depressed.event);
    },
    render: function(options) {      
      this.$el.html(this.template());
      return this;
    }
  }, {
    displayName: 'ToggleButton1'
  });
});