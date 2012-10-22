tpl = { 
    // Hash of preloaded templates for the app
    templates: {},
 
    // Recursively pre-load all the templates for the app.
    // This implementation should be changed in a production environment:
    // All the template files should be concatenated in a single file.
    loadTemplates: function() {
      var elts = $('script[type="text/template"]');
      for (var i = 0; i < elts.length; i++) {
        this.templates[elts[i].id] = elts[i].innerHTML;
      }
    },
 
    // Get template by name from hash of preloaded templates
    get: function(name) {
      return this.templates[name];
    }
 
};

// Views
Lablz.ResourceView = Backbone.View.extend({
//  el: $('#content'),
//  tagName: 'div',
  initialize: function(options) {
    _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
    this.propRowTemplate = _.template(tpl.get('propRowTemplate'));
//    this.model.bind('change', this.render, this);
//    this.model.bind('reset', this.render, this);
    return this;
  },
  
  render:function (eventName) {
    var type = this.model.type;
//    var path = Utils.getPackagePath(type);
    var meta = this.model.__proto__.constructor.properties;
    meta = meta || this.model.properties;
    if (!meta)
      return this;
    
    var html = "";
    var json = this.model.toJSON();
    for (var p in json) {
      var prop = meta[p];
      if (!prop) {
        delete json[p];
        continue;
      }
      
      var propTemplate = Lablz.templates[prop.type];
      if (propTemplate)
        json[p] = _.template(tpl.get(propTemplate))({value: json[p]});
      
      html += this.propRowTemplate({name: p, value: json[p]});
    }
    
    var j = {"props": json};
    $(this.el).html(html);
    return this;
  }
//  ,
//  navigateToResource() {
//    Backbone.history.navigate('/' + type + '/' + this.model.toJSON().id, {trigger: true});
//    return this;
//  }
});

Lablz.ListPage = Backbone.View.extend({
  initialize:function () {
    _.bindAll(this, 'render');
      this.template = _.template(tpl.get('resource-list'));
  },

  render:function (eventName) {
//    $(this.el).html(this.template(this.model.toJSON()));
//    $(this.el).empty();
    $(this.el).html(this.template(this.model.toJSON()));
//    this.listView = new EmployeeListView      ({el: $('ul', this.el), model: this.model});
    this.listView = new Lablz.ResourceListView({el: $('ul', this.el), model: this.model});
    this.listView.render();
    return this;
  }

});

Lablz.ViewPage = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'render');
    this.template = _.template(tpl.get('resource'));
  },

  render:function (eventName) {
//    $(this.el).empty();
    $(this.el).html(this.template(this.model.toJSON()));
//    $(this.el).append('<div></div>');
    this.view = new Lablz.ResourceView({el: $('ul#resourceView', this.el), model: this.model});
    this.view.render();
    return this;
  }

});

Lablz.ResourceListView = Backbone.View.extend({
//    tagName:'ul',
//    el: '#sidebar',

    initialize:function () {
      _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
//      this.bind('change', this.render, this);
      this.bind('reset', this.render, this);
      return this;
    },
    
    render:function (eventName) {
  		var elt = $(this.el);
  		this.model.each(function (item) {
        elt.append(new Lablz.ResourceListItemView({model:item}).render().el);
      });
        
  		return this;
    }
});

Lablz.ResourceListItemView = Backbone.View.extend({
  tagName:"li",
  
	initialize: function() {
    _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
		this.template = _.template(tpl.get('listItemTemplate'));
		return this;
	},

  render:function (eventName) {
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  }
});
