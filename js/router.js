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
    
    list: function(oParams, backlink) {
      if (!ListPage) {
        var args = arguments;
        var self = this;
        require(['cache!views/ListPage'], function(LP) {
          ListPage = LP;
          self.list.apply(self, args);
        })
        
        return;
      }
      if (this.backClicked) {
      }
      var self = this;
      var params = oParams.split("?");
      var type = decodeURIComponent(params[0]);
      if (backlink) {
        type = U.getType(type);
        
        var m = this.isModelLoaded(self, type, oParams, backlink);
        if (!m)
          return;
//        var m = MB.shortNameToModel[type];
//        if (!m) {
//          MB.loadStoredModels({models: [type]});
//          
//          if (!MB.shortNameToModel[type]) {
//            MB.fetchModels(type, 
//               {success: function() {
//                 self.list.apply(self, [oParams, backlink]);
//               },
//               error: Error.getDefaultErrorHandler(),
//               sync: true}
//            );
//            
//            return;
//          } 
//        }
        var meta = m.properties;
        var bltype = meta[backlink].range;
        bltype = U.getType(bltype);
        
        if (!this.isModelLoaded(self, bltype, oParams, backlink))
          return;
//        var m = MB.shortNameToModel[bltype];
//        if (!m) {
//          MB.loadStoredModels({models: [bltype]});
//          
//          if (!MB.shortNameToModel[bltype]) {
//            MB.fetchModels(bltype, 
//               {success: function() {
//                 self.list.apply(self, [oParams, backlink]);
//               },
//               error: Error.getDefaultErrorHandler(),
//               sync: true}
//            );
//            
//            return;
//          } 
//        }
////        var m1 = MB.shortNameToModel[pType];
////        if (!m1)
////          m1 = m1;
      }
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
      
      if (!this.isModelLoaded(self, type, oParams, backlink))
        return;
//      if (!MB.shortNameToModel[type]) {
//        MB.loadStoredModels({models: [type]});
//        
//        if (!MB.shortNameToModel[type]) {
//          MB.fetchModels(type, 
//             {success: function() {
//               self.list.apply(self, [oParams, backlink]);
//             },
//             error: Error.getDefaultErrorHandler(),
//             sync: true}
//          );
//          
//          return;
//        } 
//      }
      if (backlink) {
        
      }
      
      var t = backlink ? bltype : type;  
      var c = this.Collections[t];
      if (c && !c.loaded)
        c = null;
      
      var cView = this.CollectionViews[t];
      if (!query && c && cView) {
        this.currentModel = c;
        this.changePage(cView, {page: page});
        if (!backlink)
          this.Collections[t].fetch({page: page});
        else
          this.Collections[t].fetch({page: page, _backlink: backlink, _rType: type, _rUri: oParams});
        return this;
      }      
      
      var model = MB.shortNameToModel[t];
      if (!model)
        return this;
      
      var list = this.currentModel = new ResourceList(null, {model: model, _query: query, _backlink: backlink, _rType: type, _rUri: oParams });    
      var listView = new ListPage({model: list});
      
      if (!query) {
        this.Collections[t] = list;
        this.CollectionViews[t] = listView;
      }
      
      list.fetch({
        add: true,
        sync: true,
        _backlink: backlink,
        _rUri: oParams,
        success: function() {
          self.changePage(listView);
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
      uri = U.getLongUri(uri, {shortNameToModel: MB.shortNameToModel});
      if (!uri || !MB.shortNameToModel[type]) {
        MB.loadStoredModels({models: [type]});
          
        if (!uri || !MB.shortNameToModel[type]) {
          MB.fetchModels(type, 
            {success: function() {
              self.view.apply(self, [path]);
            },
            error: Error.getDefaultErrorHandler(),
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
    
    isModelLoaded: function(self, type, oParams, backlink) {
      var m = MB.shortNameToModel[type];
      if (m)
        return m;
      if (backlink)
        MB.loadStoredModels({models: [type], backlink: backlink});
      else
        MB.loadStoredModels({models: [type]});
      m = MB.shortNameToModel[type];
      if (m)
        return m;

      MB.fetchModels(type, { 
         success: function() {
           self.list.apply(self, [oParams, backlink]);
         },
         error: Error.getDefaultErrorHandler(),
         sync: true
      });
      
      return null;
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
      if (this.backClicked) {
        if (this.currentView instanceof Backbone.View  &&  this.currentView.clicked)
          this.currentView.clicked = false;
        this.currentView = this.viewsStack.pop();
        this.currentUrl = this.urlsStack.pop();
          view = this.currentView;
      }
      else {
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
  
      var transition = "slide"; //$.mobile.defaultPageTransition;
          if (this.currentView) {
            this.viewsStack.push(this.currentView);
            this.urlsStack.push(this.currentUrl);
          }
      this.currentView = view;
          this.currentUrl = window.location.href
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
