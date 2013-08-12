//'use strict';
define('views/AddButton', [
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
      if (!U.isAssignableFrom(this.vocModel, 'Intersection')) {
        this.router.navigate('make/' + encodeURIComponent(this.vocModel.type) + '?' + $.param(colParams), {trigger: true});
        return this;
      }
        
      var a = U.getCloneOf(this.vocModel, 'Intersection.a')[0];
      var b = U.getCloneOf(this.vocModel, 'Intersection.b')[0];
      var aUri = colParams[a];
      var bUri = colParams[b];
      if (!aUri  &&  !bUri) {
        this.router.navigate('make/' + encodeURIComponent(this.vocModel.type) + '?' + $.param(colParams), {trigger: true});
        return this;
      }
          
      var title = U.getParamMap(window.location.hash)['$title'];
      if (aUri) {
        var params = {
          $forResource: aUri,
          $propA: a,
          $propB: b,
          $type: this.vocModel.type, 
          $title: title
        };
        this.router.navigate('chooser/' + encodeURIComponent(this.vocModel.properties[b].range) + "?" + $.param(params) , {trigger: true});
      }
      else if (bUri) {
        var params = {
          $forResource: bUri,
          $propA: a,
          $propB: b,
          $title: title,
          $type: this.vocModel.type
        };
        this.router.navigate('chooser/' + encodeURIComponent(this.vocModel.properties[a].range) + "?" + $.param(params) , {trigger: true});
      }
      return this;
    },
    render: function(options) {
      if (!this.template)
        return this;
      
      if (typeof options !== 'undefined' && options.append)
        this.$el.append(this.template());
      else if (this.collection.models.length)
        this.$el.html(this.template());
      else
        this.$el.html(this.template({empty: true}));

      
      return this;
    }
  },
  {
    displayName: 'AddButton'
  });
});