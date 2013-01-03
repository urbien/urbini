define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!utils', 
  'cache!events', 
  'cache!error', 
  'cache!models/Resource', 
  'cache!collections/ResourceList', 
  'cache!modelsBase'
//  , 
//  'cache!views/ListPage', 
//  'cache!views/ViewPage' 
], function(G, $, __jqm__, _, Backbone, U, Events, Error, Resource, ResourceList, MB /*, ListPage, ViewPage*/) {
  var ListPage, ViewPage, MenuPage; //, LoginView;
  var Router = Backbone.Router.extend({
//    ":type"           : "list", // e.g. app/ichangeme#<resourceType>
//    ":type/:backlink" : "list", // e.g. app/ichangeme#<resourceUri>/<backlinkProperty>
//    "view/*path"      : "view"  // e.g. app/ichangeme#view/<resourceUri>
    routes:{
      ":type"           : "list", 
      "view/*path"      : "view",  
      "menu/*path"      : "menu", 
      ":type/:backlink" : "list",
//      "login/*path"     : "login" 
    },

    CollectionViews: {},
    MenuViews: {},
    Views: {},
    EditViews: {},
    Models: {},
    Collections: {},
    Paginator: {},
    backClicked: false,
    forceRefresh: false,
    errMsg: null,
    info: null,
    viewsStack: [],
    urlsStack: [],
//    LoginView: null,
    initialize: function () {
      this.firstPage = true;
      var self = this;
      Events.on('back', function() {
        self.backClicked = true;
      });
    },
    navigate: function(fragment, options) {
      this.forceRefresh = options.trigger;
      if (options) {
        this.errMsg = options.errMsg;
        this.info = options.info;
      }
      
      var ret = Backbone.Router.prototype.navigate.apply(this, arguments);
      this.forceRefresh = false;
      return ret;
    },
    route: function() {
//      this.previousHash = window.location.hash;
      return Backbone.Router.prototype.route.apply(this, arguments);
    },
//    navigateDone: function() {
//      this.navigating = false;
//      this.backClicked = false;
//    },
//    wasBackClicked: function() {
//      return !this.navigating && !this.firstPage;
//    },
//    route: function() {
//      var async = Backbone.Router.prototype.route.apply(this, arguments);
//      // Our route functions return true if they performed an asynchronous page change
//      if (async === true)
//        this.navigateDone();
//      
//      return this;
//    },
    /**
     * return true if page change will be asynchronous, false or undefined otherwise
     */
    list: function(oParams) {
//      this.backClicked = this.wasBackClicked();
      if (!ListPage) {
        var args = arguments;
        var self = this;
        require(['cache!views/ListPage'], function(LP) {
          ListPage = LP;
          self.list.apply(self, args);
        })
        
        return true;
      }
      var self = this;
      var params = oParams.split("?");
      var type = decodeURIComponent(params[0]);
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
      
      if (!this.isModelLoaded(self, type, oParams))
        return;
      var t = type;  
      var key = query ? t + '?' + query : t;
      var c = this.Collections[key];
      if (c && !c._lastFetchedOn)
        c = null;
      
      var cView = this.CollectionViews[key];
      if (c && cView) {
        this.currentModel = c;
        this.changePage(cView, {page: page});
        this.Collections[key].fetch({page: page});
        return this;
      }      
      
      var model = MB.shortNameToModel[t];
      if (!model)
        return this;
      
      var list = this.currentModel = new ResourceList(null, {model: model, _query: query, _rType: type, _rUri: oParams });    
      var listView = new ListPage({model: list});
      
      this.Collections[key] = list;
      this.CollectionViews[key] = listView;
      
      list.fetch({
        add: true,
        sync: true,
        _rUri: oParams,
        success: function() {
          self.changePage(listView);
          MB.fetchModelsForReferredResources(list);
          MB.fetchModelsForLinkedResources(list.model);
//          self.loadExtras(oParams);
        }
      });
      
      return this;
    },
    menu: function() {
      if (!MenuPage) {
        var args = arguments;
        var self = this;
        require(['cache!views/MenuPage'], function(MP) {
          MenuPage = MP;
          self.menu.apply(self, args);
        })
        
        return;
      }
      
      var c = this.currentModel;
      var id = c.id || c.url;
      var menuPage = this.MenuViews[id];
      if (!menuPage)
        menuPage = this.MenuViews[id] = new MenuPage({model: this.currentModel});
      
      this.changePage(menuPage);
    },
    
    view: function (path) {
      if (!ViewPage) {
        var args = arguments;
        var self = this;
        require(['cache!views/ViewPage'], function(VP) {
          ViewPage = VP;
          self.view.apply(self, args);
        })
        
        return;
      }
      if (this.backClicked) {
      }

      var params = U.getHashParams();
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
        if (!G.currentUser.guest)
          this.view(encodeURIComponent(G.currentUser._uri) + "?" + p);
        else
          window.location.replace(G.serverName + "/register/user-login.html?errMsg=Please+login&returnUri=" + encodeURIComponent(window.location.href) + "&" + p);
        
        return;
      }
      
      var self = this;
      var type = U.getType(uri);
      uri = U.getLongUri(uri, MB);
      if (!uri || !MB.shortNameToModel[type]) {
        MB.loadStoredModels({models: [type]});
          
        if (!uri || !MB.shortNameToModel[type]) {
          MB.fetchModels(type, 
            {success: function() {
              self.view.apply(self, [path]);
            },
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
      
  //    var edit = params['-edit'] == 'y';
      var views = this.Views; //edit ? this.EditViews : this.Views;
      var viewPageCl = ViewPage; // edit ? G.EditPage : G.ViewPage;
      if (res) {
        this.currentModel = res;
        this.Models[uri] = res;
        var v = views[uri] = views[uri] || new viewPageCl({model: res});
        this.changePage(v);
        res.fetch({
          success: function() {MB.fetchModelsForLinkedResources(res)}
        });
        
        return this;
      }
      
      if (this.Collections[type]) {
        var res = this.Models[uri] = this.Collections[type].get(uri);
        if (res) {
          this.currentModel = res;
          var v = views[uri] = new viewPageCl({model: res});
          this.changePage(v);
          return this;
        }
      }
  
      var typeCl = MB.shortNameToModel[type];
      if (!typeCl)
        return this;
      
      var res = this.Models[uri] = this.currentModel = new typeCl({_uri: uri, _query: query});
      var v = views[uri] = new viewPageCl({model: res});
      var paintMap;
      var success = function(data) {
        self.changePage(v);
        success: MB.fetchModelsForLinkedResources(res);
  //      self.loadExtras(oParams);
      }
      
      res.fetch({sync:true, success: success});
      return true;
    },
/*    
    login: function() {
      console.log("#login page");
      if (!LoginView) {
        var args = arguments;
        var self = this;
        require(['cache!views/LoginButtons'], function(LV) {
          LoginView = LV;
          self.login.apply(self, args);
        })
        return;
      }
      if (!this.LoginView)
        this.LoginView = new LoginView();
      this.LoginView.showPopup();
    },
*/
    
    
//    loadExtras: function(params) {
//      if (params.length == 0)
//        return;
//      
//      paramToVal = {};
//      params = _.each(params.slice(1), 
//        function(nameVal) {
//          nameVal = nameVal.split("=");
//          paramToVal[nameVal[0]] = nameVal[1];
//        }
//      );
//      
//      params = paramToVal;
//      if (params["-map"] != 'y')
//        return;
//      
//      console.log("painting map");
//    },
    
    isModelLoaded: function(self, type, oParams) {
      var m = MB.shortNameToModel[type];
      if (m)
        return m;

      MB.fetchModels(type, { 
         success: function() {
           self.list.apply(self, [oParams]);
         },
         sync: true
      });
      
      return null;
    },
    checkErr: function() {
      var q = U.getQueryParams();
      var msg = q['-errMsg'] || q['-info'] || this.errMsg || this.info;
      if (msg)
        Error.errDialog({msg: msg});
      
      this.errMsg = null, this.info = null;
    },
    changePage: function(view) {
      try {
        this.changePage1(view);
//        this.navigateDone();
        return this;
      } finally {
        this.checkErr();
      }
    },
    changePage1: function(view) {
      if (view == this.currentView) {
        console.log("Not replacing view with itself");
        return;
      }
      
      var lostHistory = false;
      if (this.backClicked) {
        if (this.currentView instanceof Backbone.View  &&  this.currentView.clicked)
          this.currentView.clicked = false;
        this.currentView = this.viewsStack.pop();
        this.currentUrl = this.urlsStack.pop();
        if (this.currentView)
          view = this.currentView;
        else
          lostHistory = true;
      }
      
      var transition = "slide";
      if (!this.backClicked || lostHistory) {
        if (this.currentView instanceof Backbone.View  &&  this.currentView.clicked)
          this.currentView.clicked = false;
        // Check if browser's Back button was clicked
        else if (!this.clicked  &&  this.viewsStack.length != 0) {
          var url = this.urlsStack[this.viewsStack.length - 1];
          if (url == window.location.href) {
            this.currentView = this.viewsStack.pop();
            this.currentUrl = this.urlsStack.pop();
            view = this.currentView;
            this.backClicked = true;
          }
        }
        if (!this.backClicked) {
          if (!view.rendered) {
            view.$el.attr('data-role', 'page'); //.attr('data-fullscreen', 'true');
            view.render();
          }
      
//          transition = "slide"; //$.mobile.defaultPageTransition;
          if (this.currentView  &&  this.currentUrl.indexOf('#menu') == -1) {
            this.viewsStack.push(this.currentView);
            this.urlsStack.push(this.currentUrl);
          }
          this.currentView = view;
          this.currentUrl = window.location.href;
        }
      }

      if (this.firstPage) {
        transition = 'none';
        this.firstPage = false;
      }
      
      // hot to transition
      var isReverse = false;
      if (this.backClicked == true) {
        this.backClicked = false;
        isReverse = true;
      }

      // back button: remove highlighting after active page was changed
      $('div.ui-page-active #headerUl .ui-btn-active').removeClass('ui-btn-active');

      // perform transition
      $.mobile.changePage(view.$el, {changeHash:false, transition: transition, reverse: isReverse || (MenuPage && view instanceof MenuPage)});
      Events.trigger('changePage', view);
//      if (this.backClicked)
//        $(window).resize();
//      if (this.backClicked == true) 
//        previousView.remove();
      return view;
    }
  });
  
  return Router;
});
