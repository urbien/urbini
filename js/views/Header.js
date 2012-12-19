define([
  'globals',
  'cache!jquery',
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!utils',
  'cache!events', 
], function(G, $, __jqm__, _, Backbone, Templates, Events, U) {
  
  return Backbone.View.extend({
    template: 'headerTemplate',
    initialize: function(options) {
      _.bindAll(this, 'render', 'makeWidget', 'makeWidgets');
      _.extend(this, options);
      this.template = _.template(Templates.get(this.template));
      if (typeof this.pageTitle === 'undefined') {
        var hash = window.location.hash && window.location.hash.slice(1);
        if (hash && G.tabs) {
          decHash = decodeURIComponent(hash);
          var matches = _.filter(G.tabs, function(t) {return t.mobileUrl == hash || decodeURIComponent(t.mobileUrl) == decHash});
          if (matches.length)
            this.pageTitle = matches[0].title;
        }
        
        if (!this.pageTitle) {
          if (this.model instanceof Backbone.Collection) {
            this.pageTitle = this.model.plural || this.model.displayName + 's';
          }
          else
            this.pageTitle = this.model.get('davDisplayName');
        }
      }
      
      this.$el.prevObject.attr('data-title', this.pageTitle);
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
