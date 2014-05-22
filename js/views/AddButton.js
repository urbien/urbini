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
    id: 'addBtn',
    events: {
      'click': 'add'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'add');
      BasicView.prototype.initialize.apply(this, arguments);
      this.makeTemplate(this.template, 'template', this.vocModel.type);
      return this;
    },
    add: function(e) {
      Events.stopEvent(e);
//      Events.trigger('back');
//      window.history.back();
      var colParams = U.getQueryParams(this.collection),
          meta = this.vocModel.properties;
      
      colParams = colParams ? _.clone(colParams) : {};
      colParams['-makeId'] = G.nextId();
      var params = _.getParamMap(window.location.href);
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
          
      var title = _.getParamMap(window.location.hash)['$title'],
          prop = meta[aUri ? b : a],
          params = _.extend({
            $propA: a,
            $propB: b,
            $forResource: aUri || bUri,
            $type: this.vocModel.type, 
            $title: title
          }, U.getWhereParams(prop));
      
      this.router.navigate('chooser/' + encodeURIComponent(prop.range) + "?" + $.param(params) , {trigger: true});
      return this;
    },
    render: function(options) {
      if (!this.template)
        return this;

      var tmpl_data = this.getBaseTemplateData();
      if (typeof options !== 'undefined' && options.append)
        this.append(this.template());
      else if (this.collection.models.length)
        this.html(this.template(tmpl_data));
      else {
        tmpl_data.empty = true;
        this.html(this.template(tmpl_data));
      }

      
      return this;
    }
  },
  {
    displayName: 'AddButton'
  });
});