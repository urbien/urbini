
//Lablz.Type = (function () {
//	var loc = window.location.href;
//	return loc.substring(loc.lastIndexOf('/'));
//})();


// Router
var documentReadyCount = 0;
var AppRouter = Backbone.Router.extend({

  routes:{
      ":type":"list",
      "view/*path":"view",
      "map/:type":"map"
  },
  l: {},
  v: {},
  resources: {},
  lists: {},

  backClicked: false, 
      
  initialize: function () {
    this.firstPage = true;
    $(document).on('click', 'a.back', function(event) {
      event.preventDefault();
      AppRouter.backClicked = true;
      window.history.back();
    });
  },

  map: function (type) {
    var self = this;
    this.mapModel = new Lablz.MapModel({url: Lablz.apiUrl + type});
    this.mapView = new Lablz.MapView({model: this.mapModel});
    this.mapModel.fetch({
      add: true, 
      success: function() {
        self.changePage(self.mapView);
      }
    });    
  },

  list: function (type) {
    if (this.lists[type] && this.l[type]) {
      this.changePage(this.l[type]);
      return;
    }
    
    var model = Lablz.shortNameToModel[type];
    if (!model)
      return;
    
    var params = type.split('&');
    var self = this;
    var list = this.lists[type] = new Lablz.ResourceList(null, {model: model});
    var listView = this.l[type] = new Lablz.ListPage({model: list});
    list.fetch({
      add: true, 
      success: function() {
        self.changePage(listView);
//          self.loadExtras(params);
      }
    });
  },

  view: function (uri) {
    uri = Utils.getLongUri(uri);
    if (this.resources[uri] && this.v[uri]) {
      this.changePage(this.v[uri]);
      return this;
    }

    var self = this;
    var type = Utils.getType(uri);
    if (this.lists[type]) {
      var res = this.resources[uri] = this.lists[type].get(uri);
      if (res) {
        this.v[uri] = new Lablz.ViewPage({model: res});
        this.changePage(this.v[uri]);
        return this;
      }
    }

    uri = Utils.getLongUri(uri, Utils.getTypeUri(type));
    var typeCl = Lablz.shortNameToModel[type];
    if (!typeCl)
      return this;
    
    var res = this.resources[uri] = new typeCl({_uri: uri});
    var view = this.v[uri] = new Lablz.ViewPage({model: res});
    var paintMap;
    var success = function(data) {
      self.changePage(view);
//      self.loadExtras(params);
    }
    
		res.fetch({success: success});
  },
  
  loadExtras: function(params) {
    if (params.length == 0)
      return;
    
    paramToVal = {};
    params = _.each(params.slice(1), 
      function(nameVal) {
        nameVal = nameVal.split("=");
        paramToVal[nameVal[0]] = nameVal[1];
      }
    );
    
    params = paramToVal;
    if (params["-map"] != 'y')
      return;
    
    console.log("painting map");
  },
  
  changePage: function(view) {
//    console.log("change page: " + view.$el.tagName + view.$el.id);
    if (view == this.currentView) {
//      view.render();
      console.log("Not replacing view with itself");
      return;
    }
    
//    if (this.currentView)
//      this.currentView.close();
  
//    $(selector).empty().append(view.render().el);
    view.$el.attr('data-role', 'page');
    if (!view.rendered) {
      view.render();
      $('body').append(view.$el);
    }

    this.currentView = view;
    if (this.firstPage) {
      transition = 'none';
      this.firstPage = false;
    }
    
    // hot to transition
    var isReverse = false;
    var transition = "slide"; //$.mobile.defaultPageTransition;
    if (AppRouter.backClicked == true) {
      AppRouter.backClicked = false;
      isReverse = true;
    }
    
    // perform transition
    $.mobile.changePage(view.$el, {changeHash:false, transition: transition, reverse: isReverse});
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