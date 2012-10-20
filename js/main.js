
//Lablz.Type = (function () {
//	var loc = window.location.href;
//	return loc.substring(loc.lastIndexOf('/'));
//})();


// Router
var AppRouter = Backbone.Router.extend({

  routes:{
      ":type":"list",
      "view/:type/:id":"view"
  },

  list: function (type) {
    var model = Lablz.shortNameToModel[type];
    if (!model)
      return;
    
//      var typeCl = eval('Lablz.' + type) || Lablz.Resource;
    this.resList = new Lablz.ResourceList({model: model});
    this.resView = new Lablz.ResourceListView({model: this.resList});
//    var self = this;
//    var success = function(collection, resp) {
//      app.showView('#sidebar', self.resView);
//      if (collection.lastFetchOrigin == 'server') {
//        setTimeout(function() {
//          Lablz.indexedDB.addCollection(collection);
//        }, 0);
//      }
//    };
//    var error = function() {
//      var str = '';
//      for (var name in arguments) {
//        str += name + ' = ' + arguments[name] + "\n";
//      }
//      alert(str);
//    };
    
    this.resList.fetch();//{success: success, error: error});
//        $('#sidebar').html(new Lablz.ResourceListView({model:this.resList}).render().el);
  },

  view: function (type, id) {
    var typeCl = Lablz.shortNameToModel[type];
    if (!typeCl)
      return this;
    
		this.res = this.resList ? this.resList.get(id) : new typeCl({id: id});
		this.resView = new Lablz.ResourceView({model:this.res});
		var self = this;
//		var success = function() {
//			//app.showView('#content', self.resView);
//		  //self.resView.model.change();
//      if (self.res.lastFetchOrigin == 'server') {
//        setTimeout(function() {
//          Lablz.indexedDB.addItem(self.res);
//        }, 0);
//      }
//		};
//		
//		var error = function() {
//			var str = '';
//			for (var name in arguments) {
//				str += name + ' = ' + arguments[name] + "\n";
//			}
//			alert(str);
//		};
		
		if (!this.resList)
			this.res.fetch(); //{"success": success, "error": error});
		else
			this.res.change(); //success();
  },
	
	showView: function(selector, view) {
      if (view == this.currentView) {
        console.log("Hmm...replacing view with itself");
      }
      
      if (this.currentView)
          this.currentView.close();
		
      //$(selector).empty().append(view.render().el);
      //view.render();
      this.currentView = view;
      return view;
    },
});

function init(success, error) {
  var type = window.location.hash.substring(1);
  if (type.indexOf("view") == 0) {
    var firstSlash = type.indexOf("/");
    var secondSlash = type.indexOf("/", firstSlash + 1);
    type = type.slice(firstSlash + 1, secondSlash);
  }
  else {
    var nonLetterIdx = type.search(/[^a-zA-Z]/);
    type = nonLetterIdx == -1 ? type : type.slice(0, nonLetterIdx);
  }
  
  Lablz.indexedDB.open(type, null, success, error);
}

//window.addEventListener("DOMContentLoaded", init, false);
//tpl.loadTemplates(['ListItem', 'View', 'Props', 'string', 'int', 'uri', 'image', 'date'], function() {
    init(function() {
           Lablz.initModels();
           app = new AppRouter();
           if (typeof jq != 'undefined')
             Backbone.setDomLibrary(jq);
           Backbone.history.start();
         },
         function() {
           console.log("failed to init app");
         }
    );
//    $.mobile.pushStateEnabled = false;
//});