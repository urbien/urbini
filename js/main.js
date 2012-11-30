// Router
var documentReadyCount = 0;
var App = Backbone.Router.extend({

  routes:{
      ":type":"list",
      "view/*path":"view"
//      "edit/*path":"edit",
//      "map/*type":"map"
  },
  CollectionViews: {},
  Views: {},
  EditViews: {},
  Models: {},
  Collections: {},
  Paginator: {},
  backClicked: false,
  forceRefresh: false,
  errMsg: null,
  info: null,
  initialize: function () {
    this.firstPage = true;
  },
  navigate: function(fragment, options) {
    this.forceRefresh = options.trigger;
    var ret = Backbone.Router.prototype.navigate.apply(this, arguments);
    this.forceRefresh = false;
    if (options) {
      this.errMsg = options.errMsg;
      this.info = options.info;
    }
    
    return ret;
  },
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
    var force = this.forceRefresh;
    
    if (!Lablz.shortNameToModel[type]) {
      Lablz.loadStoredModels([type]);
      
      if (!Lablz.shortNameToModel[type]) {
        Lablz.fetchModels(type, 
           {success: function() {
             self.list.apply(self, [oParams]);
           },
           sync: true}
        );
        
        return;
      } 
    }
    
//    Lablz.Navigation.push();
//    Lablz.Navigation.detectBackButton();
    var c = this.Collections[type];
    if (c && !c.loaded)
      c = null;
      
    if (!query && c && this.CollectionViews[type]) {
      this.changePage(this.CollectionViews[type], {page: page});
      this.Collections[type].fetch({page: page});
      return this;
    }
    
    var model = Lablz.shortNameToModel[type];
    if (!model)
      return this;
    
    var list = new Lablz.ResourceList(null, {model: model, _query: query});    
    var listView = new Lablz.ListPage({model: list});
    
    if (!query) {
      this.Collections[type] = list;
      this.CollectionViews[type] = listView;
    }
    
    list.fetch({
      add: true,
      sync: true,
      success: function() {
        self.changePage(listView);
//          self.loadExtras(oParams);
      }
    });
    
    return this;
  },

  view: function (path) {
    var params = Utils.getHashParams();
    var qIdx = path.indexOf("?");
    var uri, query;
    if (qIdx == -1) {
      uri = path;
      query = '';
    }
    else {
      uri = path.slice(0, qIdx);
      query = path.slice(qIdx + 1);
    }
    
    uri = decodeURIComponent(uri);
    if (uri == 'profile') {
      var p = _.size(params) ? path.slice(qIdx + 1) : '';
      if (Lablz.currentUser)
        this.view(encodeURIComponent(Lablz.currentUser._uri) + "?" + p);
      else
        window.location.replace(Lablz.serverName + "/register/user-login.html?errMsg=Please+login&returnUri=" + encodeURIComponent(window.location.href) + "&" + p);
      
      return;
    }
    
    var self = this;
    var type = Utils.getType(uri);
    uri = Utils.getLongUri(uri, type);
    if (!uri || !Lablz.shortNameToModel[type]) {
      Lablz.loadStoredModels([type]);
        
      if (!uri || !Lablz.shortNameToModel[type]) {
        Lablz.fetchModels(type, 
          {success: function() {
            self.view.apply(self, [path]);
          },
          error: Lablz.Error.getDefaultErrorHandler(),
          sync: true}
        );
        
        return;
      }
    }
    
    var res = this.Models[uri];
    if (res && !res.loaded)
      res = null;
    
    if (!res) {
      var l = this.Collections[type];
      res = this.Models[uri] = l && l.get(uri);
    }
    
    var edit = params['-edit'] == 'y';
    var views = edit ? this.EditViews : this.Views;
    var viewPageCl = edit ? Lablz.EditPage : Lablz.ViewPage;
    if (res) {
      this.Models[uri] = res;
      views[uri] = views[uri] || new viewPageCl({model: res});
      this.changePage(this.Views[uri]);
      res.fetch();
      return this;
    }
    
    if (this.Collections[type]) {
      var res = this.Models[uri] = this.Collections[type].get(uri);
      if (res) {
        views[uri] = new viewPageCl({model: res});
        this.changePage(this.Views[uri]);
        return this;
      }
    }

    var typeCl = Lablz.shortNameToModel[type];
    if (!typeCl)
      return this;
    
    var res = this.Models[uri] = new typeCl({_uri: uri, _query: query});
    var view = views[uri] = new viewPageCl({model: res});
    var paintMap;
    var success = function(data) {
      self.changePage(view);
//      self.loadExtras(oParams);
    }
    
		res.fetch({sync:true, success: success, error: Lablz.Error.getDefaultErrorHandler()});
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
  showAlert: function(options) {
    var msg = options.msg;
    $.mobile.showPageLoadingMsg($.mobile.pageLoadErrorMessageTheme, msg, !options.spinner);
    if (options.fade)
      setTimeout($.mobile.hidePageLoadingMsg, Math.max(1500, msg.length * 50));    
  },
  checkErr: function() {
    var q = U.getQueryParams();
    var msg = q['-errMsg'] || q['-info'] || this.errMsg || this.info;
    if (msg)
      this.showAlert({msg: msg, fade: true});
    
    this.errMsg = null, this.info = null;
  },
  changePage: function(view) {
    try {
      return this.changePage1(view);
    } finally {
      this.checkErr();
    }
  },
  changePage1: function(view) {
    if (view == this.currentView) {
      console.log("Not replacing view with itself");
      return;
    }
    
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
    Lablz.Events.trigger('changePage');
    return view;
  }
});

function init() {
  var error = function(e) {
    console.log("failed to init app, not starting: " + e);
  };
  
  Lablz.Templates.loadTemplates();
  Lablz.checkUser();
  Lablz.loadStoredModels();
  if (!Lablz.changedModels.length && !Lablz.newModels.length) {
    Lablz.updateTables(Lablz.startApp, error);
    return;
  }

  Lablz.fetchModels(null, {success: function() {    
    Lablz.updateTables(Lablz.startApp, error);
  }});
}

//if (typeof jq != 'undefined')
//  Backbone.setDomLibrary(jq);

var app;
Lablz.startApp = function() {
  if (app !== undefined)
    return;
  
  var models = Lablz.requiredModels.models;
  app = new App();
  Backbone.history.start();
  
  Lablz.homePage = Lablz.homePage || _.last(models).shortName;
  if (!window.location.hash) {
    app.navigate(Lablz.homePage, {trigger: true});
  }
};

$(document).ready(function () {
  console.log('document ready: ' + documentReadyCount++);
  init();      
});

//    $.mobile.pushStateEnabled = false;
//});