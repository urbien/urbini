//'use strict';
define([
  'globals',
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, _, U, Events, BasicView) {
  return BasicView.extend({
    template: 'addButtonTemplate',
    tagName: 'li',
    id: '#addBtn',
    events: {
      'click': 'add'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'add');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate(this.template, 'template', this.vocModel.type);
      return this;
    },
    add: function(e) {
      Events.stopEvent(e);
//      Events.trigger('back');
//      window.history.back();
      var colParams = U.getQueryParams(this.collection);
      colParams = colParams ? _.clone(colParams) : {};
      colParams['-makeId'] = G.nextId();
      var params = U.getParamMap(window.location.href);
      if (params['$type']) {
        var forClass = U.isA(this.vocModel, "Referenceable") ? U.getCloneOf(this.vocModel, 'Referenceable.forClass') : (U.isA(this.vocModel, "Reference") ? U.getCloneOf(this.vocModel, 'Reference.forClass') : null);
        if (forClass  &&  forClass.length)
          colParams[forClass[0]] = params['$type'];
      }
      this.router.navigate('make/' + encodeURIComponent(this.vocModel.type) + '?' + $.param(colParams), {trigger: true});
      return this;
    },
    render: function(options) {
      if (!this.template)
        return this;
      
      if (typeof options !== 'undefined' && options.append)
        this.$el.append(this.template());
      else
        this.$el.html(this.template());
      
      return this;
    }
  },
  {
    displayName: 'AddButton'
  });
});