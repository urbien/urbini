// Views
Lablz.ResourceListView = Backbone.View.extend({
    tagName:'ul',
    el: '#sidebar',

    initialize:function () {
      _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
      this.model.bind("reset", this.render, this);
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
		this.template = _.template($('#listItemTemplate').html());
		return this;
//    this.template = _.template(tpl.get('ListItem'));
	},

  render:function (eventName) {
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  }

});

Lablz.ResourceView = Backbone.View.extend({
  el: '#resourceView',
  
	initialize: function() {
		_.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
//		this.template = _.template($('#viewTemplate').html());
		this.model.bind("change", this.change, this);
		this.propRowTemplate = _.template($('#propRowTemplate').html());
    return this;
//    this.template = _.template(tpl.get('View'));
	},
	
	change:function (eventName) {
	  this.render(eventName);
	},
	
  render:function (eventName) {
    var type = this.model.type;
    var path = Utils.getPackagePath(type);
		var meta = eval('packages.' + path + '.' + Utils.getClassName(type) + '.properties');
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
				json[p] = _.template($(propTemplate).html())({value: json[p]});
			
			html += this.propRowTemplate({name: p, value: json[p]});
//      var propTemplate = tpl.get(prop.type);
//      if (propTemplate)
//        json[p] = _.template(propTemplate)({value: json[p]});
		}
		
		var j = {"props": json};
//    $(this.el).html(this.template(j));
		$(this.el).html(html);
    return this;
  }
//	,
//  navigateToResource() {
//    Backbone.history.navigate('/' + type + '/' + this.model.toJSON().id, {trigger: true});
//    return this;
//  }
});
