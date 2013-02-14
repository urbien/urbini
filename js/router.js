//'use strict';
define([
  'globals',
  'utils', 
  'events', 
  'error', 
  'models/Resource', 
  'collections/ResourceList', 
  'vocManager',
  'views/HomePage', 
  'views/ListPage', 
  'views/ViewPage'
//  'views/EditPage' 
], function(G, U, Events, Error, Resource, ResourceList, Voc, HomePage, ListPage, ViewPage) {
//  var ListPage, ViewPage, MenuPage, EditPage; //, LoginView;
  var Router = Backbone.Router.extend({
    routes:{
      ""                : "home",
      ":type"           : "list", 
      "view/*path"      : "view",  
      "edit/*path"      : "edit", 
      "make/*path"      : "make", 
      "chooser/*path"   : "choose", 
      ":type/:backlink" : "list"
    },

    CollectionViews: {},
    MkResourceViews: {},
    MenuViews: {},
    Views: {},
    EditViews: {},
    Models: {},
    Collections: {},
    Paginator: {},
    backClicked: false,
    forceRefresh: false,
    errMsg: null,
    homePage: null,
    info: null,
    viewsStack: [],
    urlsStack: [],
//    LoginView: null,
    initialize: function () {
      this.firstPage = true;
      homePage = new HomePage({el: $('div#homePage')});
      var self = this;
      Events.on('back', function() {
        self.backClicked = true;
      });
      
      // a hack to prevent browser address bar from dropping down
      // see: https://forum.jquery.com/topic/stopping-the-url-bar-from-dropping-down-i-discovered-a-workaround
      $('[data-role="page"]').on('pagecreate',function(event) {
        $('a[href]', this).each(function() {
            var self = $(this);
            if (!self.is( "[rel='external']" ) ) {
                self.attr('link', self.attr('href'));
                self.removeAttr('href');
            }
        });
      });      
    },
    navigate: function(fragment, options) {
      this.forceRefresh = options.forceRefresh;
      this.removeFromView = options.removeFromView;
      this.previousView = this.currentView;
      this.previousFragment = U.getHash();
      this.previousViewsCache = this.viewsCache;
      if (options) {
        this.errMsg = options.errMsg;
        this.info = options.info;
      }
      
      var ret = Backbone.Router.prototype.navigate.apply(this, arguments);
      this.forceRefresh = false;
      this.removeFromView = false;
      return ret;
    },
    
    route: function() {
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
    
    home: function() {
      if (this.backClicked) {
        this.currentView = this.viewsStack.pop();
        if (!this.currentView) {
          homePage.render();
          this.currentView = homePage;
          var idx = window.location.href.indexOf('#');
          this.currentUrl = (idx == -1) ? window.location.href : window.location.href.substring(0, idx);
        }
        else {
          this.currentUrl = this.urlsStack.pop();
//          if (!this.viewsStack.length)
//            this.currentView = $.mobile.firstPage;
        }
        $('div.ui-page-active #headerUl .ui-btn-active').removeClass('ui-btn-active');
        $.mobile.changePage(this.currentView.$el, {changeHash:false, transition: 'slide', reverse: true});
      }
      else {
        this.currentUrl = window.location.href;
        homePage.render();
        this.currentView = homePage;
      }
    },
    
    choose: function(path) {
      this.list.call(this, path, G.LISTMODES.CHOOSER);
    },

    /**
     * return true if page change will be asynchronous, false or undefined otherwise
     */
    list: function(oParams, mode) {
      if (!this.ListPage)
        return this.loadViews('ListPage', this.list, arguments);
      
      var ListPage = this.ListPage;
      var self = this;
      var params = oParams.split("?");
      var typeUri = U.getTypeUri(decodeURIComponent(params[0]));
      var className = U.getClassName(typeUri);
      var query = params.length > 1 ? params[1] : undefined;
      if (query) {
        var q = query.split("&");
        for (var i = 0; i < q.length; i++) {
          if (q[i] == "$page") {
            this.page = parseInt(q[i].split("=")[1]); // page is special because we need it for lookup in db
            q.remove(i);
            query = q.length ? q.join("&") : null;
            break;
          }
        }
      }
      
      var page = this.page = this.page || 1;
      var forceFetch = this.forceRefresh;
      
      if (!this.isModelLoaded(typeUri, 'list', arguments))
        return;
      
//      var t = className;  
//      var key = query ? t + '?' + query : t;
      var key = query || typeUri;
      this.Collections[typeUri] = this.Collections[typeUri] || {};
      this.viewsCache = this.CollectionViews[typeUri] = this.CollectionViews[typeUri] || {};
      var c = this.Collections[typeUri][key];
      if (c && !c._lastFetchedOn)
        c = null;
      
      var cView = this.CollectionViews[typeUri][key];
      if (c && cView) {
        this.currentModel = c;
        cView.setMode(mode || G.LISTMODES.LIST);
        this.changePage(cView, {page: page});
        c.fetch({page: page, forceFetch: forceFetch});
//        setTimeout(function() {c.fetch({page: page, forceFetch: forceFetch})}, 100);
        return this;
      }      
      
      var model = G.shortNameToModel[className] || G.typeToModel[typeUri];
      if (!model)
        return this;
      
      var list = this.currentModel = new ResourceList(null, {model: model, _query: query, _rType: className, _rUri: oParams });    
      var listView = new ListPage({model: list});
      
      this.Collections[typeUri][key] = list;
      this.CollectionViews[typeUri][key] = listView;
      listView.setMode(mode || G.LISTMODES.LIST);
      
      list.fetch({
//        update: true,
        sync: true,
        _rUri: oParams,
        success: function() {
          self.changePage(listView);
          Voc.fetchModelsForReferredResources(list);
          Voc.fetchModelsForLinkedResources(list.model);
//          self.loadExtras(oParams);
        },
        error: function() {
          self.changePage(listView); // show empty list          
        }
      });
      
      return this;
    },
    
    loadViews: function(views, caller, args) {
      views = $.isArray(views) ? views : [views];
      var self = this;
      var unloaded = _.filter(views, function(v) {return !self[v]});
      if (unloaded.length) {
        var unloadedMods = _.map(unloaded, function(v) {return 'views/' + v});
        G.onPostBundleLoaded(function() {
          G.require(unloadedMods, function() {
            var a = U.slice.call(arguments);
            for (var i = 0; i < a.length; i++) {              
              self[unloaded[i]] = a[i];
            }
            
            caller.apply(self, args);
          });
        });
      }
    },
    
    make: function(path) {
      if (!this.EditPage)
        return this.loadViews(['EditPage', 'EditView'], this.make, arguments);
      
      var EditPage = this.EditPage; 
      var parts = path.split('?');
      var type = decodeURIComponent(parts[0]);
      if (!type.startsWith('http'))
        type = G.defaultVocPath + type;
      
      if (!this.isModelLoaded(type, 'make', arguments))
        return;
      
      var params = U.getHashParams();
      var makeId = params['-makeId'];
      makeId = makeId ? parseInt(makeId) : G.nextId();
      var backlinkModel = this.Models[params.on];
      var mPage = this.MkResourceViews[makeId];
      if (mPage && !mPage.model.get('_uri')) {
        // all good, continue making ur mkresource
      }
      else {
        mPage = this.MkResourceViews[makeId] = new EditPage({model: new G.typeToModel[type](), action: 'make', makeId: makeId, backlinkModel: backlinkModel, source: this.previousFragment});
      }
      
      this.viewsCache = this.MkResourceViews;
      this.currentModel = mPage.resource;
      mPage.set({action: 'make'});
      this.changePage(mPage);
    },

    edit: function(path) {
      if (!this.EditPage)
        return this.loadViews(['EditPage', 'EditView'], this.edit, arguments);
      else
        this.view.call(this, path, true);
    },
    
    view: function (path, edit) {
      if (!edit && !this.ViewPage)
        return this.loadViews('ViewPage', this.view, arguments);
      
      var views = this.viewsCache = this[edit ? 'EditViews' : 'Views'];
      var viewPageCl = edit ? this.EditPage : this.ViewPage;

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
      
      if (uri == 'profile') {
        var p = _.size(params) ? path.slice(qIdx + 1) : '';
        if (!G.currentUser.guest) {
          var other = U.slice.call(arguments, 1);
          other = other.length ? other : undefined;
          this.view(U.encode(G.currentUser._uri) + "?" + p, other);
        }
        else {
          Events.trigger('req-login', 'Please login');
//          window.location.replace(G.serverName + "/register/user-login.html?errMsg=Please+login&returnUri=" + U.encode(window.location.href) + "&" + p);
        }
        
        return;
      }
      
      uri = U.getLongUri1(decodeURIComponent(uri));
      var typeUri = U.getTypeUri(uri);
      if (!this.isModelLoaded(typeUri, 'view', arguments))
        return;
      
      var className = U.getClassName(typeUri);
      var typeCl = G.shortNameToModel[className] || G.typeToModel[typeUri];
      if (!typeCl)
        return this;

//      if (!uri || !G.shortNameToModel[className]) {
//        Voc.loadStoredModels({models: [typeUri || className]});
//          
//        if (!uri || !G.shortNameToModel[className]) {
//          Voc.fetchModels(typeUri, 
//            {success: function() {
//              self.view.apply(self, [path]);
//            },
//            sync: true}
//          );
//          
//          return;
//        }
//      }
      
      var res = this.Models[uri];
      if (res && !res.loaded)
        res = null;
      
      var forceFetch = this.forceRefresh;
      var self = this;
      var collection;
      if (!res) {
        var collections = this.Collections[typeUri];
        if (collections) {
          var result = this.searchCollections(collections, uri);
          if (result) {
            collection = result.collection;
            res = this.Models[uri] = result.model;
          }
        }
      }
      
      if (res) {
        this.currentModel = res;
        this.Models[uri] = res;
        var v = views[uri] = views[uri] || new viewPageCl({model: res, source: this.previousFragment});
        this.changePage(v);
//        res.fetch({
//          success: function() {Voc.fetchModelsForLinkedResources(res)}
//        });
//        setTimeout(function() {
          res.fetch({forceFetch: forceFetch});
//        }, 100);
        
        return this;
      }
      
//      if (this.Collections[typeUri]) {
//        var res = this.Models[uri] = this.Collections[typeUri].get(uri);
//        if (res) {
//          this.currentModel = res;
//          var v = views[uri] = new viewPageCl({model: res});
//          this.changePage(v);
//          return this;
//        }
//      }
//  
//      var typeCl = G.shortNameToModel[className];
//      if (!typeCl)
//        return this;
      
      var res = this.Models[uri] = this.currentModel = new typeCl({_uri: uri, _query: query});
      var v = views[uri] = new viewPageCl({model: res, source: this.previousFragment});
      var paintMap;
      var success = function(data) {
        self.changePage(v);
        Voc.fetchModelsForLinkedResources(res);
  //      self.loadExtras(oParams);
      }
      
      res.fetch({sync:true, success: success, forceFetch: forceFetch});
      return true;
    },
    
    /**
     * search a collection map for a collection with a given model
     * @return {collection: collection, model: model}, where collection is the first one found containing a model where model.get('_uri') == uri, or null otherwise
     * @param uri: uri of a model
     */
    searchCollections: function(collections, uri) {
      for (var query in collections) {
        var m = collections[query].get(uri);
        if (m) 
          return {collection: collections[query], model: m};
      }
      
      return null;
    },
/*    
    login: function() {
      console.log("#login page");
      if (!LoginView) {
        var args = arguments;
        var self = this;
        require(['views/LoginButtons'], function(LV) {
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
    
    isModelLoaded: function(type, method, args) {
      var m = G.typeToModel[type];
      if (m)
        return m;

      var self = this;
      Voc.loadStoredModels({models: [type]});
      var fetchModels = Voc.fetchModels(null, {sync: true});
      if (fetchModels.isResolved())
        return true;
      else {
        fetchModels.done(function() {
          self[method].apply(self, args);
        });
        
        return false;
      }
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
        if (this.removeFromView) {
          this.previousView && this.previousView.remove();
          var cache = this.previousViewsCache;
          if (cache) {
            var c = U.filterObj(cache, function(key, val) {return val === this.previousView});
            if (_.size(c))
              delete cache[U.getFirstProperty(cache)];
          }
          
          delete this.previousView;
        }
          
      }
    },
    changePage1: function(view) {
      if (view == this.currentView) {
        G.log(this.TAG, "render", "Not replacing view with itself");
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
        else if (!this.backClicked  &&  this.viewsStack.length != 0) {
          var url = this.urlsStack[this.viewsStack.length - 1];
          if (url == window.location.href) {
            this.currentView = this.viewsStack.pop();
            this.currentUrl = this.urlsStack.pop();
            view = this.currentView;
            this.backClicked = true;
          }
        }
        if (!this.backClicked  ||  lostHistory) {
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
      $.mobile.changePage(view.$el, {changeHash:false, transition: transition, reverse: isReverse});
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
