// Router
var documentReadyCount = 0;
var App = Backbone.Router.extend({

  routes:{
      ":type":"list",
      "view/*path":"view",
      "map/*type":"map"
  },
  CollectionViews: {},
  Views: {},
  Models: {},
  Collections: {},
  Paginator: {},
  backClicked: false,       
  initialize: function () {
    this.firstPage = true;
//    $(document).on('click', 'a.back', function(event) {
//      event.preventDefault();
//      App.backClicked = true;
//      window.history.back();
//    });
  },

//  map: function (type) {
//    var self = this;
//    this.mapModel = new Lablz.MapModel({url: Lablz.apiUrl + type});
//    this.mapView = new Lablz.MapView({model: this.mapModel});
//    this.mapModel.fetch({
//      success: function() {
//        self.changePage(self.mapView);
//      }
//    });    
//  },

  list: function (oParams) {
    var params = oParams.split("?");
    var type = decodeURIComponent(params[0]);
    var self = this;
    var query = params.length > 1 ? params[1] : undefined;
    if (query) {
      var q = query.split("&");
      for (var i = 0; i < q.length; i++) {
        if (q[i].indexOf("$page") == 0) {
          this.page = parseInt(q[i].split("=")[1]); // page is special because we need it for lookup in db
          q.remove(i);
          query = q.length ? q.join("&") : null;
          break;
        }
      }
    }
    
    var page = this.page = this.page || 1;
    
    if (!Lablz.shortNameToModel[type]) {
      Lablz.fetchModels(type, function() {
        self.list.apply(self, [oParams]);
      });
      
      return;
    }
    
//    Lablz.Navigation.push();
//    Lablz.Navigation.detectBackButton();
    var c = this.Collections[type];
    if (c && !c.loaded)
      c = null;
      
    if (!query && c && this.CollectionViews[type]) {
      this.Collections[type].asyncFetch({page: page});
      this.changePage(this.CollectionViews[type], {page: page});
      return this;
    }
    
    var model = Lablz.shortNameToModel[type];
    if (!model)
      return this;
    
    var list = this.Collections[type] = new Lablz.ResourceList(null, {model: model, _query: query});
    var listView = this.CollectionViews[type] = new Lablz.ListPage({model: list});
    list.syncFetch({
      add: true,
      success: function() {
        self.changePage(listView);
//          self.loadExtras(oParams);
      }
    });
    
    return this;
  },

  view: function (oParams) {
    var params = oParams.split("?");
    var uri = decodeURIComponent(params[0]);
    if (uri == 'profile') {
      var p = params.length > 1 ? params[1] : '';
      if (Lablz.currentUser)
        this.view(encodeURIComponent(Lablz.currentUser._uri) + "?" + p);
      else
        window.location.replace(Lablz.serverName + "/register/user-login.html?errMsg=Please+login&returnUri=" + encodeURIComponent(window.location.href) + "&" + p);
      
      return;
    }
    
//    Lablz.Navigation.push();
//    Lablz.Navigation.detectBackButton();
    var self = this;
    var type = Utils.getType(uri);
    uri = Utils.getLongUri(uri, type);
    if (!uri || !Lablz.shortNameToModel[type]) {
      Lablz.fetchModels(type, function() {
        self.view.apply(self, [oParams]);
      });
      
      return;
    }
    
    var res = this.Models[uri];
    if (res && !res.loaded)
      res = null;
    
    if (!res) {
      var l = this.Collections[type];
      res = this.Models[uri] = l && l.get(uri);
    }
    
    var query = params.length > 1 ? params[1] : undefined;
    if (res) {
      res.asyncFetch();
      this.Models[uri] = res;
      this.Views[uri] = this.Views[uri] || new Lablz.ViewPage({model: res});
      this.changePage(this.Views[uri]);
      return this;
    }
    
    if (this.Collections[type]) {
      var res = this.Models[uri] = this.Collections[type].get(uri);
      if (res) {
        this.Views[uri] = new Lablz.ViewPage({model: res});
        this.changePage(this.Views[uri]);
        return this;
      }
    }

    var typeCl = Lablz.shortNameToModel[type];
    if (!typeCl)
      return this;
    
    var res = this.Models[uri] = new typeCl({_uri: uri, _query: query});
    var view = this.Views[uri] = new Lablz.ViewPage({model: res});
    var paintMap;
    var success = function(data) {
      self.changePage(view);
//      self.loadExtras(oParams);
    }
    
		res.syncFetch({success: success});
		return this;
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
//    var backBtn = Lablz.Navigation.back;
//    Lablz.Navigation.reset();

//    console.log("change page: " + view.$el.tagName + view.$el.id);
    if (view == this.currentView) {
      console.log("Not replacing view with itself");
      return;
    }
    
//    if (this.currentView)
//      this.currentView.close();
  
//    $(selector).empty().append(view.render().el);
    view.$el.attr('data-role', 'page');
    if (!view.rendered) {
      view.render();
    }

    var transition = "slide"; //$.mobile.defaultPageTransition;
    this.currentView = view;
    if (this.firstPage) {
      transition = 'none';
      this.firstPage = false;
    }
    
    // hot to transition
    var isReverse = false;
    if (App.backClicked == true) {
      App.backClicked = false;
      isReverse = true;
    }
    
    // perform transition
    $.mobile.changePage(view.$el, {changeHash:false, transition: transition, reverse: isReverse});
    return view;
  }
});

function init() {
  var error = function(e) {
    console.log("failed to init app, not starting: " + e);
  };
  
  Lablz.Templates.loadTemplates();
  Lablz.fetchModels(initModels, function() {
    Lablz.updateTables(Lablz.startApp, error);
//    var outOfDateModels = Lablz.loadAndUpdateModels();
//    Lablz.indexedDB.open(null, Lablz.startApp, error);
  });
}

//window.addEventListener("DOMContentLoaded", init, false);
if (typeof jq != 'undefined')
  Backbone.setDomLibrary(jq);

var app;
Lablz.startApp = function() {
  //console.log('document ready: ' + documentReadyCount);
  if (app !== undefined)
    return;
  
  app = new App();
  Backbone.history.start();
};

$(document).ready(function () {
  console.log('document ready: ' + documentReadyCount++);
  init();      
});

//    $.mobile.pushStateEnabled = false;
//});