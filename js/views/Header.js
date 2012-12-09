define([
  'cache!jquery',
  'cache!jqmConfig', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!utils',
  'cache!events', 
], function($, __jqm__, __jqmConfig__, _, Backbone, Templates, Events, U) {
  
  return Backbone.View.extend({
    template: 'headerTemplate',
    initialize: function(options) {
      _.bindAll(this, 'render', 'makeWidget', 'makeWidgets');
      _.extend(this, options);
      this.template = _.template(Templates.get(this.template));
      return this;
    },
    makeWidget: function(options) {
      var w = options.widget;
      if (typeof w != 'function') {
        w.render({append: true});
        return;
      }
      
      w = new w({model: this.model, el: this.$(options.id)}).render({append: true});
      w.$(options.domEl).addClass(options.css);
      w.$el.trigger('create');
      return this;
    },
    makeWidgets: function(wdgts, options) {
      for (var i = 0; i < wdgts.length; i++) {
        options.widget = wdgts[i];
        this.makeWidget(options);
      }
      
      return this;
    },
    render: function() {
      this.$el.html(this.template());
      var l = this.buttons.left;
      l && this.makeWidgets(l, {domEl: 'a', id: '#headerLeft'}); //, css: 'ui-btn-left'});
      var r = this.buttons.right;
      r && this.makeWidgets(r, {domEl: 'a', id: '#headerRight'}); //, css: 'ui-btn-right'});
      return this;
    }
  });
});
