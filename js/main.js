
//Lablz.Type = (function () {
//	var loc = window.location.href;
//	return loc.substring(loc.lastIndexOf('/'));
//})();


// Router
var documentReadyCount = 0;
var AppRouter = Backbone.Router.extend({

  routes:{
      ":type":"list",
      "view/:uri":"view"
  },

  initialize:function () {
    $('#backButton').on('click', function(event) {
        window.history.back();
        return false;
    });
    this.firstPage = true;
  },
  
  list: function (type) {
    var model = Lablz.shortNameToModel[type];
    if (!model)
      return;
    
    var self = this;
    this.resList = new Lablz.ResourceList(null, {model: model});
    this.resListPage = new Lablz.ListPage({model: this.resList});
    this.resList.fetch({
        add: true, 
        success: function() {
          self.changePage(self.resListPage);
        }
    });
  },

  view: function (uri) {
    uri = decodeURIComponent(uri);
    var self, type, typeCl;
    var success = function(data) {
      var model = data instanceof Backbone.Model ? data : new typeCl(data[0]);
      self.changePage(new Lablz.ViewPage({model: model}));
    }
    
    self = this;
    if (this.resList) {
      success(this.resList.get(uri));
      return this;
    }
    
    type = Utils.getType(uri);
    uri = Utils.getLongUri(uri, Utils.getTypeUri(type));
    typeCl = Lablz.shortNameToModel[type];
    if (!typeCl)
      return this;
        
		this.res = new typeCl({_uri: uri});
		this.res.fetch({success: success});
  },
  
  changePage: function(view) {
    console.log("change page: " + view.el.tagName + view.el.id);
    if (view == this.currentView) {
      console.log("Not replacing view with itself");
      return;
    }
    
//    if (this.currentView)
//      this.currentView.close();
  
//    $(selector).empty().append(view.render().el);
    $(view.el).attr('data-role', 'page');
    view.render();
    $('body').append($(view.el));
    this.currentView = view;
    var transition = $.mobile.defaultPageTransition;
    if (this.firstPage) {
      transition = 'none';
      this.firstPage = false;
    }
    
    $.mobile.changePage($(view.el), {changeHash:false, transition: transition});
    return view;
  },
	
	showView: function(selector, view) {
    if (view == this.currentView) {
      console.log("Not replacing view with itself");
      return;
    }
  
//      $("#backButton").show();
    if (this.currentView)
        this.currentView.close();
	
    //$(selector).empty().append(view.render().el);
    //view.render();
    this.currentView = view;
    return view;
  }
});

function init(success, error) {
  Lablz.initModels();
  var storeNames = [];
  for (var name in Lablz.shortNameToModel) {
    if (storeNames.push(name));
  }
  
//  var type = window.location.hash.substring(1);
//  if (type.indexOf("view") == 0) {
//    var firstSlash = type.indexOf("/");
//    var secondSlash = type.indexOf("/", firstSlash + 1);
//    type = type.slice(firstSlash + 1, secondSlash);
//  }
//  else {
//    var nonLetterIdx = type.search(/[^a-zA-Z]/);
//    type = nonLetterIdx == -1 ? type : type.slice(0, nonLetterIdx);
//  }
  
  Lablz.indexedDB.open(storeNames, null, success, error);
}

//window.addEventListener("DOMContentLoaded", init, false);
if (typeof jq != 'undefined')
  Backbone.setDomLibrary(jq);

$(document).ready(function () {
  console.log('document ready: ' + documentReadyCount++);
  tpl.loadTemplates();
  init(
      function() {
        //console.log('document ready: ' + documentReadyCount);
        app = new AppRouter();
        Backbone.history.start();
      },
      
      function(err) {
        console.log("failed to init app: " + err);
      }
  );
});

//    $.mobile.pushStateEnabled = false;
//});