//'use strict';
define('router', [
  'globals',
  'utils', 
  'events', 
  'error', 
  'models/Resource', 
  'collections/ResourceList',
  'cache',
  'vocManager',
  'views/HomePage',
  'templates'
//  , 
//  'views/ListPage', 
//  'views/ViewPage'
//  'views/EditPage' 
], function(G, U, Events, Errors, Resource, ResourceList, C, Voc, HomePage, Templates/*, ListPage, ViewPage*/) {
//  var ListPage, ViewPage, MenuPage, EditPage; //, LoginView;
  var Router = Backbone.Router.extend({
    TAG: 'Router',
    routes:{
      ""                                                       : "home",
      ":type"                                                  : "list", 
      "view/*path"                                             : "view",
      "templates/*path"                                        : "templates",
//      "views/*path"                                            : "views",
      "edit/*path"                                             : "edit", 
      "make/*path"                                             : "make", 
      "chooser/*path"                                          : "choose", 
      "chat/*path"                                             : "chat", 
      ":type/:backlink"                                        : "list"
    },

    CollectionViews: {},
    MkResourceViews: {},
    ChatViews: {},
    MenuViews: {},
    Views: {},
    EditViews: {},
//    Models: {},
//    Collections: {},
    Paginator: {},
    backClicked: false,
    forceFetch: false,
    errMsg: null,
    homePage: null,
    info: null,
    viewsStack: [],
    urlsStack: [],
//    LoginView: null,
    _failToGoBack: function() {      
      U.alert({
        msg: "Oops! The browsing history ends here."
      });
    },
    initialize: function () {
//      G._routes = _.clone(this.routes);
//      _.bindAll(this, '_backOrHome');
      this.firstPage = true;
      this.homePage = new HomePage({el: $('div#homePage')});
      var self = this;
      Events.on('home', function() {
        self.goHome();
      });
      
      Events.on('back', function() {
//        var now = +new Date();
//        if (self.lastBackClick && now - self.lastBackClick < 100)
//          debugger;

//        debugger;
        
        // if this._hashChanged is true, it means the hash changed but the page hasn't yet, so it's safe to use window.history.back(;
        var haveHistory = self.urlsStack.length || (self._hashChanged && self.currentUrl != null);
//        if (self._hashChanged) { 
//          if (haveHistory) {
//            window.history.back();
//            return;
//          }
//        }
        
        if (haveHistory) {
          window.history.back();
          return;
        }
          
        if (_.isUndefined(self.previousHash)) { 
          // seems we don't have any history to go back to, but as the user has clicked the UI back button, 
          // they probably don't want to exit the app, so let's go somewhere sane
          var hash = U.getHash();
          if (!hash) {
            self._failToGoBack();
            return;
          }
          
          var hashParts = hash.match(/^(chat|edit|templates|view|chooser|make)\/(.*)/);
          if (!hashParts || !hashParts.length) {
            // we're probably at a list view
            self._failToGoBack();
            return;
          }
            
          var method = hashParts[1];
          switch (method) {
            case 'chat':
            case 'edit':
            case 'templates':
              self.navigate('view/' + hashParts[2], {trigger: true});
              return;
            case 'make':
            case 'view':
              self._failToGoBack();
              return;
            case 'chooser':
              Events.trigger('home');
              return;
          }
        }
        
//        self.lastBackClick = now;
        self.previousHash = null;
        self.backClicked = true;
        window.history.back();
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
      
//      var popped = ('state' in window.history);
//      var initialURL = window.location.href;
//      $(window).bind('popstate', function(e) {
//        // Ignore inital popstate that some browsers fire on page load
//        var initialPop = !popped && location.href == initialURL;
//        popped = true
//        if (initialPop) 
//          return;
//        
//        debugger;
//        console.log('pop: ' + e.originalEvent.state);
//      });
      
      
      $(window).hashchange(function() {
        self._hashChanged = true;        
      });
      
      Events.on('pageChange', function() {
        self._hashChanged = false;
//        console.debug('currentUrl:', self.currentUrl);
//        console.debug('previousHash:', self.previousHash);
      });
      
//      _.each(['list', 'view', 'make', 'templates', 'home'], function(method) {
//        var fn = self[method];
//        self[method] = function() {
//          self.previousHash = self.currentHash;
//        }
//      });
    },
    
    defaultOptions: {
//      extraParams: {},
      replace: false
    },
    
    fragmentToOptions: {},
    
    navigate: function(fragment, options) {
//      if (this.previousHash === fragment) {
////      prevents some (not all) duplicate history entries, BUT creates unwanted forward history (for example make/edit views)
//        Events.trigger('back');
//        return;
//      }
      
      if (fragment.startsWith('http://')) {
        var appPath = G.serverName + '/' + G.appRoot;
        if (fragment.startsWith(appPath))
          fragment = fragment.slice(appPath.length);
        else {
          window.location.href = fragment;
          return;
        }
      }
      
      G.log(this.TAG, 'events', 'navigate', fragment);
      options = options || {};
      
      this.fragmentToOptions[fragment] = _.extend({}, this.defaultOptions, _.pick(options, 'forceFetch', 'errMsg', 'info', 'replace', 'postChangePageRedirect'));
      _.extend(this, {
        previousView: this.currentView, 
        previousHash: U.getHash() 
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
    route: function() {
      var currentView = this.currentView;
      this.previousHash = U.getHash(); 
      try {
        return Backbone.Router.prototype.route.apply(this, arguments);
      } finally {
        this.previousView = currentView;
      }
    },

    /**
     * Backbone 1.0 decodes parameters, which confuses our routes, as we have fragments such as
     * #view/http%3A%2F%2Fmark.obval.com%2Furbien%2Fsql%2Furbien.com%2Fvoc%2Fdev%2FGym%2FRun%3Fid%3D32044?$minify=n
     * which when decoded would have two question marks
     */
    _extractParameters: function(route, fragment) {
      return route.exec(fragment).slice(1);
    },

    home: function() {
      var prev = this.currentView;
      if (this.backClicked) {
        this.currentView = this.viewsStack.pop();
        if (!this.currentView) {
          this.homePage.render();
          this.currentView = this.homePage;
          var idx = window.location.href.indexOf('#');
          this.currentUrl = (idx == -1) ? window.location.href : window.location.href.substring(0, idx);
        }
        else {
          this.currentUrl = this.urlsStack.pop();
//          if (!this.viewsStack.length)
//            this.currentView = $.mobile.firstPage;
        }
        $('div.ui-page-active #headerUl .ui-btn-active').removeClass('ui-btn-active');
      }
      else {
        this.currentUrl = window.location.href;
        this.homePage.render();
        this.currentView = this.homePage;
      }
      
      Events.trigger('pageChange', prev, this.currentView);
      $.mobile.changePage(this.currentView.$el, {changeHash:false, transition: 'slide', reverse: true});
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
      var options = this.getChangePageOptions();
      var forceFetch = options.forceFetch;
      
      if (!this.isModelLoaded(typeUri, 'list', arguments))
        return;
      
      var model = U.getModel(typeUri);
      
//      var t = className;  
//      var key = query ? t + '?' + query : t;
      var key = query || typeUri;
      if (query)
        key = U.getQueryString(U.getQueryParams(key), true);
      
      var list = C.getResourceList(model, key);
      if (list && !list._lastFetchedOn)
        list = null;
      
      var meta = model.properties;      
      var viewsCache = this.CollectionViews[typeUri] = this.CollectionViews[typeUri] || {};
      var cView = viewsCache[key];
      if (list && cView) {
        this.currentModel = list;
        cView.setMode(mode || G.LISTMODES.LIST);
        this.changePage(cView, _.extend({page: page}));
        Events.trigger('navigateToList:' + list.listId, list);
        list.fetch({page: page, forceFetch: forceFetch});
        this.monitorCollection(list);
//        setTimeout(function() {c.fetch({page: page, forceFetch: forceFetch})}, 100);
        return this;
      }      
      
      list = this.currentModel = new ResourceList(null, {model: model, _query: query, _rType: className, _rUri: oParams });    
      var listView = new ListPage({model: list});
      
      this.CollectionViews[typeUri][key] = listView;
      listView.setMode(mode || G.LISTMODES.LIST);
      
      list.fetch({
//        update: true,
        sync: true,
        forceFetch: forceFetch,
        _rUri: oParams,
        success: _.once(function() {
          self.changePage(listView);
//          self.loadExtras(oParams);
        }),
//        error: Errors.getDefaultErrorHandler()
        error: _.once(function(collection, xhr, opts) {
          var code = xhr.status;
          if (code === 204)
            self.changePage(listView);
          else {
            if (code == 400)
              Events.trigger('badList', list);
            
            Errors.getDefaultErrorHandler().apply(this, arguments);
          }
        })
      });
      
      this.monitorCollection(list);
      return this;
    },
    
    templates: function(tName) {
      if (!this.ListPage)
        return this.loadViews('ListPage', this.templates, arguments);

      var cached = this.CollectionViews[tName];
      if (cached) {
        this.changePage(cached);
        return;
      }
        
      var previousView = this.currentView;
      if (!previousView) {
        var qIdx = tName.indexOf("?");
        if (qIdx >= 0) // these parameters are meant for the templates route, not for the previous view 
          tName = tName.slice(0, qIdx);
        
        this.navigate(U.decode(tName), {trigger: true, postChangePageRedirect: U.getHash()});
        return;
      }
      
      var descendants = previousView.getDescendants();
      var templateToTypes = {};
      _.each(descendants, function(d) {
        var templates = d._templates || [];
        var type = d.vocModel.type;
        if (templates.length) {
          _.each(templates, function(t) {
            var typeTemplates = templateToTypes[t] = templateToTypes[t] || [];
            U.pushUniq(typeTemplates, type);
          });
        }
      });
      
      var appTemplates = G.appTemplates;
      var templates = [];
      if (appTemplates) {
        _.each(appTemplates.models, function(t) {
          var tName = t.get('templateName');
          var type = t.get('modelDavClassUri');
          var types = templateToTypes[tName] || [];
          var tIdx = types.indexOf(type);
          if (tIdx != -1) {
            types.splice(tIdx, 1);
            if (!types.length)
              delete templateToTypes[tName];
            
            templates.push(t);
          }
        });
      }
      
      var currentAppUri = G.currentApp._uri;
      var modelUri = decodeURIComponent(tName);
      var idx = modelUri.indexOf('?');
      var sqlUri = '/' + G.sqlUri + '/';
      var idx0 = modelUri.indexOf(sqlUri);
      modelUri = idx0 == -1 ||  idx0 > idx ? modelUri.slice(0, idx) : 'http://' + modelUri.slice(idx0 + sqlUri.length, idx);
      if (modelUri === 'view/profile')
        modelUri = G.currentUser._uri;
      if (modelUri.indexOf('http://') == -1)
        modelUri = U.getModel(modelUri).type;
      var jstType = G.commonTypes.Jst;
      var jstModel = U.getModel(jstType);
      var jstUriBase = G.sqlUrl + '/' + jstType.slice(7) + '?';
      _.each(templateToTypes, function(types, tName) {
        templates.push(new jstModel({
          _uri:  jstUriBase + $.param({templateName: tName}),
          templateName: tName,
          forResource: currentAppUri,
          modelDavClassUri: modelUri
        }, {
          detached: true
        }));
      });
      
      var tList = new ResourceList(templates, {params: {forResource: currentAppUri}});
      if (!G.appTemplates)
        G.appTemplates = tList;
      
      var lPage = this.CollectionViews[tName] = new this.ListPage({model: tList});
      this.changePage(lPage);
    },

//    views: function(tName) {
//      if (!this.ListPage)
//        return this.loadViews('ListPage', this.views, arguments);
//
//      var cached = this.CollectionViews[tName];
//      if (cached) {
//        this.changePage(cached);
//        return;
//      }
//        
//      var previousView = this.currentView;
//      if (!previousView) {
//        var qIdx = tName.indexOf("?");
//        if (qIdx >= 0) // these parameters are meant for the "views" route, not for the previous view 
//          tName = tName.slice(0, qIdx);
//        
//        this.navigate(U.decode(tName), {trigger: true, postChangePageRedirect: U.getHash()});
//        return;
//      }
//
//      debugger;
//      var descendants = previousView.getDescendants();
//      var viewToTypes = {};
//      _.each(descendants, function(d) {
//        var views = d._views || [];
//        var type = d.vocModel.type;
//        if (views.length) {
//          _.each(views, function(v) {
//            var typeViews = viewToTypes[v] = viewToTypes[v] || [];
//            U.pushUniq(typeViews, type);
//          });
//        }
//      });
//      
//      var appViews = G.appViews;
//      var views = [];
//      if (appViews) {
//        _.each(appViews.models, function(v) {
//          var vName = v.get('viewName');
//          var type = v.get('modelDavClassUri');
//          var types = viewToTypes[tName] || [];
//          var tIdx = types.indexOf(type);
//          if (tIdx != -1) {
//            types.splice(tIdx, 1);
//            if (!types.length)
//              delete viewToTypes[tName];
//            
//            views.push(v);
//          }
//        });
//      }
//      
//      var currentAppUri = G.currentApp._uri;
//      var modelUri = decodeURIComponent(tName);
//      var idx = modelUri.indexOf('?');
//      var sqlUri = '/' + G.sqlUri + '/';
//      var idx0 = modelUri.indexOf(sqlUri);
//      modelUri = idx0 == -1 ||  idx0 > idx ? modelUri.slice(0, idx) : 'http://' + modelUri.slice(idx0 + sqlUri.length, idx);
//      if (modelUri === 'view/profile')
//        modelUri = G.currentUser._uri;
//      if (modelUri.indexOf('http://') == -1)
//        modelUri = U.getModel(modelUri).type;
//      var jsType = G.commonTypes.JS;
//      var jsModel = U.getModel(jsType);
//      var jsUriBase = G.sqlUrl + '/' + jsType.slice(7) + '?';
//      _.each(viewToTypes, function(types, tName) {
//        views.push(new jsModel({
//          _uri:  jsUriBase + $.param({viewName: tName}),
//          viewName: tName,
//          forResource: currentAppUri,
//          modelDavClassUri: modelUri
//        }, {
//          detached: true
//        }));
//      });
//      
//      var vList = new ResourceList(views, {params: {forResource: currentAppUri}});
//      if (!G.appViews)
//        G.appViews = vList;
//      
//      var lPage = this.CollectionViews[tName] = new this.ListPage({model: vList});
//      this.changePage(lPage);
//    },

    monitorCollection: function(collection) {
      var self = this;
      collection.on('queryChanged', function() {
        debugger;
        var updateHash = function() {
          debugger;
          self.navigate(U.makeMobileUrl('list', collection.vocModel.type, list.params), {trigger: false, replace: true}); // maybe trigger should be true? Otherwise it can't fetch resources from the server
        }
        
        var currentView = self.currentView;
        if (currentView && currentView.collection === collection)
          updateHash();
        else
          Events.once('navigateToList.' + collection.listId, updateHash);
      });
    },
    
    loadViews: function(views, caller, args) {
      views = $.isArray(views) ? views : [views];
      var self = this;
      var unloaded = _.filter(views, function(v) {return !self[v]});
      if (unloaded.length) {
        var unloadedMods = _.map(unloaded, function(v) {return 'views/' + v});
        G.onModulesLoaded(unloadedMods).done(function() {          
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

//    _backOrHome: function() {
//      if (this.urlsStack.length)
//        Events.trigger('back');
//      else
//        this.goHome();
//    },

    goHome: function() {
      window.location.href = G.pageRoot; 
    },
    
    _requestLogin: function(options) {
      Events.trigger('req-login', _.extend(options || {}));
    },
    
    make: function(path) {
      if (!this.EditPage)
        return this.loadViews(['EditPage', 'EditView'], this.make, arguments);
      
      if (G.currentUser.guest) {
        this._requestLogin();
        return;
      }
      
      var EditPage = this.EditPage; 
      var parts = path.split('?');
      var type = decodeURIComponent(parts[0]);
      if (!type.startsWith('http'))
        type = G.defaultVocPath + type;
      
      if (!this.isModelLoaded(type, 'make', arguments))
        return;

      var vocModel = U.getModel(type);
      if (!this.isAppLoadedAndInstalled(type, 'make', arguments))
        return;

      var params = U.getHashParams(),
          makeId = params['-makeId'];
      
      makeId = makeId ? parseInt(makeId) : G.nextId();
      var mPage = this.MkResourceViews[makeId];
      if (mPage && !mPage.model.getUri()) {
        // all good, continue making ur mkresource
      }
      else {
        var model = U.getModel(type);
        mPage = this.MkResourceViews[makeId] = new EditPage({model: new model(), action: 'make', makeId: makeId, source: this.previousHash});
      }
      
      this.currentModel = mPage.resource;
      mPage.set({action: 'make'});
      try {
        this.changePage(mPage);
      } finally {
        if (G.currentUser.guest) {
          this._requestLogin();
        }
      }
    },

    getChangePageOptions: function(fragment) {
      return this.fragmentToOptions[fragment || U.getHash()] || {};
    },
    
    edit: function(path) {
      if (!this.EditPage)
        return this.loadViews(['EditPage', 'EditView'], this.edit, arguments);
      else if (G.currentUser.guest) {
        this._requestLogin();        
        return;
      }
      else {
        try {
          this.view.call(this, path, 'edit');
        } finally {
          if (G.currentUser.guest)
            this._requestLogin();
        }
      }
    },

    chat: function(path) {
      if (!this.ChatPage || !this.ChatView)
        return this.loadViews(['ChatPage', 'ChatView'], this.chat, arguments);
      else if (G.currentUser.guest) {
        this._requestLogin();
        return;
      }
      else {
        try {
          this.view.call(this, path, 'chat');
        } finally {
          if (G.currentUser.guest)
            this._requestLogin();
        }
      }
    },

    _updateCache: function(oldUri, newUri) {
      _.each([this.EditViews, this.Views, this.MkResourceViews], function(views) {
        var cached = views[oldUri];
        if (cached)
          views[newUri] = cached;
      });
    },
    
    /**
     * handles view, edit and chat mode (action)
     */
    view: function (path, action) {
      var edit = action === 'edit',
          chat = action === 'chat';
      
      if (!edit && !chat && !this.ViewPage)
        return this.loadViews('ViewPage', this.view, arguments);

      var views = this[edit ? 'EditViews' : chat ? 'ChatViews' : 'Views'];
      var viewPageCl = edit ? this.EditPage : chat ? this.ChatPage : this.ViewPage;

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
        if (!G.currentUser.guest) {
          var other = U.slice.call(arguments, 1);
          other = other.length ? other : undefined;
          this.view.apply(this, [U.encode(G.currentUser._uri) + (query ? "?" + query : '')].concat(other));
        }
        else {
          this._requestLogin();
//          window.location.replace(G.serverName + "/register/user-login.html?errMsg=Please+login&returnUri=" + U.encode(window.location.href) + "&" + p);
        }
        
        return;
      }
      
      if (chat && /^_/.test(uri)) {
        var chatPage = this.ChatViews[uri] = this.ChatViews[uri] || new this.ChatPage({
          'private': true
        });
        
        this.changePage(chatPage);
        return;
      }      

      uri = U.getLongUri1(decodeURIComponent(uri));
      var typeUri = U.getTypeUri(uri);
      if (!this.isModelLoaded(typeUri, 'view', arguments))
        return;
      
      var model = U.getModel(typeUri);
      if (!model)
        return this;

      var res = C.getResource(uri);
      if (res && !res.loaded)
        res = null;

      var newUri = res && res.getUri();
      var wasTemp = U.isTempUri(uri);
      var isTemp = newUri && U.isTempUri(newUri);
      var self = this;
      if (wasTemp) {
        var updateHash = function(resource) {
          self.navigate(U.makeMobileUrl(action, resource.getUri()), {trigger: false, replace: true});
        }
        
        if (isTemp || !newUri) {
          Events.once('synced:' + uri, function() {            
            self._updateCache(uri, res.getUri());
            var currentView = self.currentView;    
            if (currentView && currentView.resource === res) {
              updateHash(res);
            }
            else
              Events.once('navigateToResource:' + res.resourceId, updateHash);
          });
        }
        else {
          self._updateCache(uri, newUri);
          updateHash(res);
        }
      }

      var options = this.getChangePageOptions();
      var forceFetch = options.forceFetch;
      var collection;
      if (!res) {
        var colCandidate = C.getResourceList(model);
        if (colCandidate) {
          var result = colCandidate.get(uri); // C.searchCollections(collections, uri);
          if (result) {
            collection = result.collection;
            res = result.resource;
          }
        }
      }
      
      if (res) {
        this.currentModel = res;
        var v = views[uri] = views[uri] || new viewPageCl({model: res, source: this.previousHash});
//        if (action === 'view')
//          views[uri] = v;
        
        this.changePage(v);
        Events.trigger('navigateToResource:' + res.resourceId, res);
        res.fetch({forceFetch: forceFetch});
        if (wasTemp && !isTemp)
          this.navigate(U.makeMobileUrl(action, newUri), {trigger: false, replace: true});
        
        return this;
      }
      
      var res = this.currentModel = new model({_uri: uri, _query: query});
      var v = views[uri] = new viewPageCl({model: res, source: this.previousHash});
//      if (action === 'view')
//        views[uri] = v;
      
      var changedPage = false;
      var success = function() {
        if (wasTemp)
          self._checkUri(res, uri, action);
        self.changePage(v);
        Events.trigger('navigateToResource:' + res.resourceId, res);
//        Voc.fetchModelsForLinkedResources(res);
      };
      
      if (chat) {
        res.fetch();
        success();
      }
      else
        res.fetch({sync: true, forceFetch: forceFetch, success: _.once(success)});
      
      return true;
    },
    
    _checkUri: function(res, uri, action) {
      if (U.isTempUri(uri)) {
        var newUri = res.getUri();
        if (!U.isTempUri(newUri))
          this.navigate(U.makeMobileUrl(action, newUri), {trigger: false, replace: true});            
      }
    },
    
/*    
    login: function() {
      console.log("#login page");
      if (!LoginView) {
        var args = arguments;
        var self = this;
        require(['views/LoginButton'], function(LV) {
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
//          debugger;
          Errors.getDefaultErrorHandler().apply(this, arguments);
        });
        
        return false;
      }
    },

    _getInstallTitle: function(appName, edit) {
      if (edit)
        return 'Allow app {0}'.format(appName);
      else
        return 'Install app {0}'.format(appName);
    },

    _getInstallTerms: function(className, appName, appPlugs, edit) {
      if (edit)
        return 'Edit your inter-app connections here';
      else {
        var msg = 'Do you allow app {0} to be added to your profile'.format(appName);
        if (appPlugs.length)
          return '{0} and connect to app{1}? You can always disconnect apps on their app pages and/or remove them from profile.'.format(className, (appPlugs.length === 1 ? ' ' : 's ') + appPlugs.join(', '));
        else
          return '{0}?'.format(msg);
      }
    },

    isAppConfigured: function(app) {
      var appPath = U.getValue(app, 'appPath');
      var userAccType = 'http://urbien.com/voc/dev/{0}/UserAccount'.format(appPath);
      var type = U.getCurrentType();
      if (type === userAccType)
        return true;
      
      var accountModel = U.getModel(userAccType);
      if (!accountModel)
        return true;
      
      if (!_.size(_.omit(accountModel.properties, 'davDisplayName', 'davGetLastModified', '_uri', '_shortUri', 'id', 'app', 'user')))
        return true;
      
//      var existing = C.getResource(function(res) {
//        return res.vocModel == accountModel;
//      });
//      
//      if (existing && existing.length)
//        return true;

      debugger;
      var userAccounts = new ResourceList(null, {model: accountModel, params: {
        user: G.currentUser._uri,
        app: U.getValue(app, '_uri')
      }});
      
      var redirectOptions = {
        $returnUri: window.location.href, 
        '-info': 'Configure your app below', 
        $title: appPath + ' config'          
      };

      var self = this;
      var error = function(uAccs, xhr, options) {
//      switch (xhr.status) {
//      case 404:
        debugger;
        self.navigate(U.makeMobileUrl('make', accountModel.type, redirectOptions), {trigger: true});            
//      }
      };
      
      var success = function(resp, status, options) {
        var acc = userAccounts.models && userAccounts.models[0];
        if (acc)
          self.navigate(U.makeMobileUrl('edit', userAccounts.models[0], redirectOptions), {trigger: true});
        else
          error(userAccounts, status, options);
      }
      
      userAccounts.fetch({
        success: _.once(success),
        error: _.once(error)
      });

      return false;
    },
    
    isAppLoadedAndInstalled: function(type) {
      if (!U.isAnAppClass(type))
        return true;
      
      var appPath = U.getAppPath(type).toLowerCase();
      var user = G.currentUser;
      if (user.guest) {
        this._requestLogin({
          msg: 'Please login before you use this app' 
        });
        
        return false;
      }
      
//      var APP_TERMS = 'Make sure you agree to this app\'s terms and conditions';
      var className = U.getModel(type).displayName;
      var appPathInstallationKey = user.installedApps && _.filter(_.keys(user.installedApps), function(path) {return path.toLowerCase() === appPath});
      var appInfo = appPathInstallationKey && appPathInstallationKey.length && user.installedApps[appPathInstallationKey[0]];
      if (appInfo) {
        if (!appInfo.allowed) {
          var title = this._getInstallTitle(appInfo.davDisplayName);
          var redirectOptions = {
            $returnUri: U.getHash(), 
            $title: title, 
            allow: true
          };
          
          var terms = this._getInstallTerms(className, appInfo.title, null, true);
          if (terms) {
            redirectOptions['-info'] = terms;
          }
          
          this.navigate(U.makeMobileUrl('edit', appInfo.install, redirectOptions), {trigger: true, replace: true});
          return false;
        }
      
        return this.isAppConfigured(appInfo);
      }

      // theoretically, we can only be in G.currentApp, and it's not installed
//      var appUri = G.currentApp._uri;
      var self = this, 
          commonTypes = G.commonTypes,
          appType = commonTypes.App, 
          friendAppType = commonTypes.FriendApp,
          currentApp = G.currentApp;
      
      Voc.getModels([appType, friendAppType], {sync: true}).done(function() {
        var installOptions = {$returnUri: window.location.href};
        var app, appUri, followsList, fetchFollows;
        var fetchFollowsPipe = $.Deferred();
        var appIsCurrentApp = currentApp.appPath === appPath;
        if (appIsCurrentApp)
          appUri = currentApp._uri;
        
        var fetchApp = $.Deferred(function(defer) {
          var appModel = U.getModel(appType);
          if (!appIsCurrentApp) {
            var atts = {appPath: appPath};
            if (!G.online) {
              debugger;
              app = C.search(atts);
              if (!app) {
                Errors.offline();
                return defer.reject();
              }
            }
            else {
              var apps = new ResourceList(null, {model: appModel, params: atts});
              apps.fetch({
                sync: true, 
                success: function() {
                  app = apps.models[0];
                  C.cacheResource(app);
                  followsList = new ResourceList(null, {model: U.getModel(friendAppType), params: {friend1: app.getUri()}}); // FriendApp list representing apps this app follows
                  followsList.fetch({sync: true, success: fetchFollowsPipe.resolve, error: fetchFollowsPipe.resolve});
                  defer.resolve();
                }, 
                error: defer.reject
              });
            }
          }
          else {
            app = C.getResource(appUri);
            if (app) {
              defer.resolve(app);
              return;
            }
            
            app = new appModel({_uri: appUri});
            app.fetch({sync: true, success: defer.resolve, error: defer.reject});
          }
        }).promise();

        if (appIsCurrentApp) {
          followsList = new ResourceList(null, {model: U.getModel(friendAppType), params: {friend1: appUri}}); // FriendApp list representing apps this app follows
          followsList.fetch({sync: true, success: fetchFollowsPipe.resolve, error: fetchFollowsPipe.resolve});
        }

        fetchApp.done(function() {
          installOptions.application = app.getUri();
        });
        
        $.when.apply($, [fetchFollowsPipe, fetchApp]).done(function() {
          var installedAppUris = _.pluck(user.installedApps, '_uri');
          followsList = followsList.filter(function(friend) {
            var target = friend.get('friend2');
            return _.contains(installedAppUris, target);
          });
          
          var followsNames = _.pluck(followsList, 'davDisplayName');
          var followsCSV = followsNames.join(', ');
          var appName = U.getDisplayName(app);
          var title = self._getInstallTitle(appName);
          var redirectOptions = {
            $returnUri: U.getHash(), 
            $title: title, 
            allow: true,
            appPlugs: followsCSV
          };
          
          var terms = self._getInstallTerms(className, appName, followsNames);
          if (terms) {
            redirectOptions['-info'] = terms;
          }

          self.navigate(U.makeMobileUrl('make', 'model/social/AppInstall', _.extend(installOptions, redirectOptions)), {trigger: true, replace: true}); // check all appPlugs by default
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
        U.alert({msg: msg, persist: true});
      
      this.errMsg = null, this.info = null;
    },
    changePage: function(view) {
      try {
        this.changePage1(view);
        return this;
      } finally {
        this.checkErr();
        var pageOptions = this.getChangePageOptions();
        this.fragmentToOptions = {};
        var redirect = pageOptions.postChangePageRedirect;
        if (redirect) {
          pageOptions.postChangePageRedirect = null;
          view.whenDoneLoading(function() {
            if (view.isActive())
              this.navigate(redirect, {trigger: true, replace: true});
          }.bind(this));
        }
//        else if (this.currentView === this.previousView) {
//          G.log(this.TAG, 'info', 'duplicate history, navigating back');
//          window.history.back();
//        }
      }
    },
    
    changePage1: function(view) {
      if (view == this.currentView) {
        G.log(this.TAG, "render", "Not replacing view with itself, but will refresh it");
        view.refresh();
        return;
      }

      var activated = false;
      var prev = this.currentView;
      if (prev && prev !== view)
        prev.trigger('active', false);
      
      var options = this.getChangePageOptions();
      var replace = options.replace;
      var lostHistory = false;
      if (this.backClicked) {
        var currentView = this.currentView;
        if (currentView && !(this.currentView instanceof Backbone.View))
          debugger;
        if (this.currentView instanceof Backbone.View  &&  this.currentView.clicked)
          this.currentView.clicked = false;
        
        this.currentView = this.viewsStack.pop();
        this.currentUrl = this.urlsStack.pop();
        if (currentView && currentView === this.currentView) {
          debugger;
          G.log(this.TAG, 'history', 'Duplicate history entry, backing up some more');
          Events.trigger('back');
          return;
        }
        
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
            view.trigger('active', true) && (activated = true);
            view.render();
          }
      
//          transition = "slide"; //$.mobile.defaultPageTransition;
          if (!replace  &&  this.currentView  &&  this.currentUrl.indexOf('#menu') == -1) {
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
      
      if (!activated)
        view.trigger('active', true);
      
      // perform transition        
      $.mobile.changePage(view.$el, {changeHash: false, transition: transition, reverse: isReverse});
      Events.trigger('pageChange', prev, view);
      return view;
    }
  });
  
  return Router;
});
