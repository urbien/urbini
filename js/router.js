//'use strict';
define([
  'globals',
  'utils', 
  'events', 
  'error', 
  'models/Resource', 
  'collections/ResourceList',
  'cache',
  'vocManager',
  'views/HomePage'
//  , 
//  'views/ListPage', 
//  'views/ViewPage'
//  'views/EditPage' 
], function(G, U, Events, Errors, Resource, ResourceList, C, Voc, HomePage/*, ListPage, ViewPage*/) {
//  var ListPage, ViewPage, MenuPage, EditPage; //, LoginView;
  var Router = Backbone.Router.extend({
    TAG: 'Router',
    routes:{
      ""                                                       : "home",
      ":type"                                                  : "list", 
      "view/*path"                                             : "view",  
      "edit/*path"                                             : "edit", 
      "make/*path"                                             : "make", 
      "chooser/*path"                                          : "choose", 
      ":type/:backlink"                                        : "list"
    },

    CollectionViews: {},
    MkResourceViews: {},
    MenuViews: {},
    Views: {},
    EditViews: {},
//    Models: {},
//    Collections: {},
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
    
    defaultOptions: {
      forceRefresh: false,
      extraParams: {},
      removeFromView: false
    },
    
    navigate: function(fragment, options) {
      G.log(this.TAG, 'events', 'navigate', fragment);
      options = options || {};
      _.extend(this, this.defaultOptions, _.pick(options, 'extraParams', 'forceRefresh', 'removeFromView', 'errMsg', 'info'), {
        previousView: this.currentView, 
        previousFragment: U.getHash(), 
        previousViewsCache: this.viewsCache
      });
            
      var ret = Backbone.Router.prototype.navigate.apply(this, arguments);
      _.extend(this, this.defaultOptions);
      return ret;
    },
    
//    route: function() {
//      return Backbone.Router.prototype.route.apply(this, arguments);
//    },
//    
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
    
    choose: function(path) { //, checked, props) {
      this.list.call(this, path, G.LISTMODES.CHOOSER); //, {checked: checked !== 'n', props: props ? props.slice(',') : []});
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
      
      var model = U.getModel(typeUri);
      
//      var t = className;  
//      var key = query ? t + '?' + query : t;
      var key = query || typeUri;
      this.viewsCache = this.CollectionViews[typeUri] = this.CollectionViews[typeUri] || {};
      var c = C.getResourceList(typeUri, key);
      if (c && !c._lastFetchedOn)
        c = null;
      
      var meta = model.properties;      
      var cView = this.CollectionViews[typeUri][key];
      if (c && cView) {
        this.currentModel = c;
        cView.setMode(mode || G.LISTMODES.LIST);
        this.changePage(cView, {page: page});
        Events.trigger('navigateToList.' + c.listId, c);
        c.fetch({page: page, forceFetch: forceFetch});
        this.monitorCollection(c);
//        setTimeout(function() {c.fetch({page: page, forceFetch: forceFetch})}, 100);
        return this;
      }      
      
      c = this.currentModel = new ResourceList(null, {model: model, _query: query, _rType: className, _rUri: oParams });    
      var listView = new ListPage(_.extend(this.extraParams || {}, {model: c}));
      
      this.CollectionViews[typeUri][key] = listView;
      listView.setMode(mode || G.LISTMODES.LIST);
      
      c.fetch({
        sync: true,
        forceFetch: forceFetch,
        _rUri: oParams
      }).done(function() {
        self.changePage(listView);
        Events.trigger('navigateToList.' + c.listId);
        Voc.fetchModelsForReferredResources(c);
        Voc.fetchModelsForLinkedResources(c.vocModel);
//          self.loadExtras(oParams);
      }).fail(function(collection, xhr, options) {
        if (xhr.status === 204)
          self.changePage(listView);
        else
          Errors.getDefaultErrorHandler().apply(this, arguments);
      });
      
      this.monitorCollection(c);
      
      return this;
    },
    
    monitorCollection: function(collection) {
      var qMap = collection.queryMap;
      if (!qMap)
        return;
      
      var vocModel = collection.vocModel,
          meta = vocModel.properties,
          self = this;
      
      for (var param in qMap) {
        var prop = meta[param];
        if (!prop || !U.isResourceProp(prop))
          continue;
        
        var uri = qMap[param];
        if (!U.isTempUri(uri))
          continue;
        
        Events.once('synced.' + uri, function(data) {
          debugger;
          qMap[param] = data._uri;
          var updateHash = function() {
            self.navigate(U.makeMobileUrl('list', vocModel.type, qMap), {trigger: false, replace: true}); // maybe trigger should be true? Otherwise it can't fetch resources from the server
          }
          
          var currentView = self.currentView;
          if (currentView && currentView.collection === collection)
            updateHash();
          else
            Events.once('navigateToList.' + collection.listId, updateHash);
        });
      }
    },
    
    loadViews: function(views, caller, args) {
      views = $.isArray(views) ? views : [views];
      var self = this;
      var unloaded = _.filter(views, function(v) {return !self[v]});
      if (unloaded.length) {
        var unloadedMods = _.map(unloaded, function(v) {return 'views/' + v});
        G.onPostBundleLoaded(function() {
          U.require(unloadedMods, function() {
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

      var vocModel = U.getModel(type);
      if (!this.isAppLoaded(type, 'make', arguments))
        return;

      var params = U.getHashParams(),
          makeId = params['-makeId'];
      
      makeId = makeId ? parseInt(makeId) : G.nextId();
      var mPage = this.MkResourceViews[makeId];
      if (mPage && !mPage.model.get('_uri')) {
        // all good, continue making ur mkresource
      }
      else {
        var model = U.getModel(type);
        mPage = this.MkResourceViews[makeId] = new EditPage({model: new model(), action: 'make', makeId: makeId, source: this.previousFragment});
      }
      
      this.viewsCache = this.MkResourceViews;
      this.currentModel = mPage.resource;
      mPage.set({action: 'make'});
      try {
        this.changePage(mPage);
      } finally {
        if (G.currentUser.guest)
          Events.trigger('req-login');
      }
    },

    edit: function(path) {
      if (!this.EditPage)
        return this.loadViews(['EditPage', 'EditView'], this.edit, arguments);
      else {
        try {
          this.view.call(this, path, true);
        } finally {
          if (G.currentUser.guest)
            Events.trigger('req-login');
        }
      }
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
      var typeCl = U.getModel(className) || U.getModel(typeUri);
      if (!typeCl)
        return this;

      var res = C.getResource(uri);
      if (res && !res.loaded)
        res = null;

      if (U.isTempUri(uri)) {
        Events.once('synced.' + uri, function() {
          debugger;
          var currentView = self.currentView;
          var updateHash = function() {
            self.navigate(U.makeMobileUrl('view', res.getUri()), {trigger: false, replace: true});
          }
          
          if (currentView && currentView.resource === res)
            updateHash();
          else
            Events.once('navigateToResource.' + res.resourceId, updateHash);
        });
      }

      var forceFetch = this.forceRefresh;
      var self = this;
      var collection;
      if (!res) {
        var collections = C.getResourceList(typeUri);
        if (collections) {
          var result = C.searchCollections(collections, uri);
          if (result) {
            collection = result.collection;
            res = result.model;
          }
        }
      }
      
      if (res) {
        this.currentModel = res;
        var v = views[uri] = views[uri] || new viewPageCl(_.extend(this.extraParams || {}, {model: res, source: this.previousFragment}));
        this.changePage(v);
        Events.trigger('navigateToResource.' + res.resourceId, res);
        res.fetch({forceFetch: forceFetch}).done(function() {
//          var newUri = res.getUri();
//          if (newUri !== uri) {
//            self.navigate(U.makeMobileUrl('view', newUri), {trigger: false, replace: true});
//            res.fetch();
//          }
        }).fail(function() {
          debugger;
        });
                
        return this;
      }
      
      var res = this.currentModel = new typeCl({_uri: uri, _query: query});
      var v = views[uri] = new viewPageCl(_.extend(this.extraParams || {}, {model: res, source: this.previousFragment}));
      res.fetch({sync: true, forceFetch: forceFetch}).done(function(data) {
        // in case we were at a temp uri, we want to clean up our history as best we can
//        var newUri = res.getUri();
//        if (newUri !== uri) {
//          self.navigate(U.makeMobileUrl('view', newUri), {trigger: false, replace: true});
//          res.fetch();
//        }
//        else {
          self.changePage(v);
          Events.trigger('navigateToResource.' + res.resourceId, res);
          Voc.fetchModelsForLinkedResources(res);
//        }
      }).fail(function() {
        debugger;
      });
  
      return true;
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
      var m = U.getModel(type);
      if (m)
        return m;

      var self = this;
//      Voc.loadStoredModels({models: [type]});
      var fetchModels = Voc.getModels(type, {sync: true});
      if (fetchModels.isResolved())
        return true;
      else {
        fetchModels.done(function() {
          self[method].apply(self, args);
        }).fail(function() {
          debugger;
          Errors.getDefaultErrorHandler();
        });
        
        return false;
      }
    },

    isAppLoaded: function(type, method, args) {
      if (!U.isAnAppClass(type))
        return true;
      
      var appPath = U.getAppPath(type);
      var user = G.currentUser;
      if (user.guest) {
        Events.trigger('req-login', {msg: 'Please login before you use this app'});
        return false;
      }
      
      var APP_TERMS = 'Before you use this app, you need to agree to its terms and conditions';
      var appInfo = user.installedApps && user.installedApps[appPath];
      if (appInfo) {
        if (!appInfo.installed) {
          this.navigate(U.makeMobileUrl('edit', appInfo.install, {'-info': APP_TERMS, returnUri: window.location.href}), {trigger: true});
          return false;
        }
      
        return true;
      }

      // theoretically, we can only be in G.currentApp, and it's not installed
      var appUri = G.currentApp._uri;
      var self = this, 
          appType = U.getTypeUri(appUri), 
          friendAppType = U.getTypeUri('model/social/FriendApp');
      
      Voc.getModels([appType, friendAppType], {sync: true}).done(function() {
        var followsList = G.newResourceList(ResourceList, null, {model: U.getModel(friendAppType), queryMap: {friend1: appUri}}); // FriendApp list representing apps this app follows
        var fetchFollows = followsList.fetch({sync: true}).promise();
        var fetchFollowsPipe = $.Deferred();
        fetchFollows.always(fetchFollowsPipe.resolve);
        var installOptions = {'-info': APP_TERMS, returnUri: window.location.href, application: appUri};
        var fetchApp = $.Deferred(function(defer) {
          var app = C.getResource(appUri);
          if (app) {
            defer.resolve(app);
            return;
          }
          
          var model = U.getModel(appType);
          app = new model({_uri: appUri});
          app.fetch({sync: true}).done(defer.resolve).fail(defer.reject);
        }).promise();

        $.when.apply($, [fetchFollowsPipe, fetchApp]).done(function() {
          debugger;
          var followsNames = followsList.pluck('davDisplayName');
          self.navigate(U.makeMobileUrl('make', 'model/social/AppInstall', _.extend(installOptions, {appPlugs: followsNames.join(','), allow: true, $returnUri: U.getHash()})), {trigger: true}); // check all appPlugs by default
//          self.navigate(U.makeMobileUrl('make', 'model/social/AppInstall', installOptions), {trigger: true});
        }).fail(function() {
          debugger;
        });
      }).fail(function() {
        debugger;
        Errors.getDefaultErrorHandler().apply(this, arguments);
      });
      
      return false;
    },
    
    checkErr: function() {
      var q = U.getQueryParams();
      var msg = q['-errMsg'] || q['-info'] || this.errMsg || this.info;
      if (msg)
        Errors.errDialog({msg: msg});
      
      this.errMsg = null, this.info = null;
    },
    changePage: function(view) {
      try {
        this.changePage1(view);
//        this.navigateDone();
        return this;
      } finally {
        this.checkErr();
//        if (this.removeFromView) {
//          var self = this;
//          this.previousView && this.previousView.close();
//          var cache = this.previousViewsCache;
//          if (cache) {
//            var c = U.filterObj(cache, function(key, val) {
//              return val === self.previousView;
//            });
//            
//            if (_.size(c))
//              delete cache[U.getFirstProperty(cache)];
//          }
//          
//          delete this.previousView;
//        }
          
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
      view.active = true;
      if (this.previousView)
        this.previousView.active = false;
      $.mobile.changePage(view.$el, {changeHash: false, transition: transition, reverse: isReverse});
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
