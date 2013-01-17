define([
  'globals',
  'cache!underscore', 
  'cache!templates',
  'cache!utils',
  'cache!events',
  'cache!views/BasicView'
], function(G, _, Templates, U, Events, BasicView) {
  return BasicView.extend({
    template: 'addButtonTemplate',
    events: {
      'click #addBtn': 'add'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'add');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.template = _.template(Templates.get(this.template));
      return this;
    },
    add: function(e) {
      Events.stopEvent(e);
//      Events.trigger('back');
//      window.history.back();
      var colParams = U.getQueryParams(this.collection);
      colParams['-makeId'] = G.nextId();
      this.router.navigate('make/' + encodeURIComponent(this.vocModel.type) + '?' + $.param(colParams), {trigger: true, replace: false});
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
  });
});