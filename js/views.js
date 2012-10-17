// Views
Lablz.ResourceListView = Backbone.View.extend({
    tagName:'ul',

    initialize:function () {
      _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
      this.model.bind("reset", this.render, this);
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
	},

  render:function (eventName) {
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  }

});

Lablz.ResourceView = Backbone.View.extend({
	initialize: function() {
		_.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
		this.template = _.template($('#viewTemplate').html());
	},
	
  render:function (eventName) {
    var type = this.model.className;
		var meta = eval('Lablz.' + type + '.prototype.setProperties().properties');
		meta = meta || this.model.properties;
		if (!meta)
			return this;
		
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
		}
		
		var j = {"props": json};
        $(this.el).html(this.template(j));
        return this;
    }
});
