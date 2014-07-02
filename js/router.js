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
  'templates',
  '@widgets',
  'appAuth',
  'redirecter',
  'physicsTransitions',
  'domUtils',
  'lib/fastdom',
  'physicsBridge'
//  , 
//  'views/ListPage', 
//  'views/ViewPage'
//  'views/EditPage' 
], function(G, U, Events, Errors, Resource, ResourceList, C, Voc, HomePage, Templates, $m, AppAuth, Redirecter, Transitioner, DOM, Q, Physics /*, ListPage, ViewPage*/) {
//  var ListPage, ViewPage, MenuPage, EditPage; //, LoginView;
  var Modules = {},
      doc = document,
      publicTypes = [
        'software/crm/Feature', 
        'media/publishing/Article', 
        'media/publishing/Blog',
        'commerce/trading/Lead',
        'aspects/tags/Vote',
        'model/portal/Comment'
      ].map(U.getTypeUri);
  
  function log() {
    var args = [].slice.call(arguments);
    args.unshift("router");
    G.log.apply(G, args);
  };
  
//  function newPageElement() {
//    var page = document.createElement('div');
//    page.$data('role') = "page";
//  };

  var lastViewportWidth = G.viewport.width,
      transitionLookup = DOM.prefix('transition'),
      transformLookup = DOM.prefix('transform');
  
  window.addEventListener('resize', Q.debounce(function() {
    if (!lastViewportWidth) {
      lastViewportWidth = G.viewport.width;
      return;
    }
    
    var newWidth = window.innerWidth;
    if (newWidth == lastViewportWidth)
      return;

    var pages = doc.querySelectorAll('[data-role="page"]'),
        page,
        translation,
        x,
        i = pages.length;
    
    while (i--) {
      page = pages[i];
      transform = DOM.getTransform(page);
      if (transform && (x = transform[12])) {
        var sign = x < 0 ? -1 : 1;
        transform[12] = newWidth * sign;
        page.style[transformLookup] = DOM.toMatrix3DString(transform);
        page.style[transitionLookup] = '';
      }
    }
  }, 20));
  
//  $doc.on('click', '[data-href]', function(e) {
//    e.preventDefault();
//    Events.trigger('navigate', this.$data('href'));
//  });

  var Router = Backbone.Router.extend({
    TAG: 'Router',
    routes:{
      ""                                                       : "home",
      "home/*path"                                             : "home",
//      "install/*path"                                          : "install",
      "social/*path"                                           : "social",
      "static/*path"                                           : "static",
      "buy/*path"                                              : "buy",
//      "tour/*path"                                             : "tour",
      ":type"                                                  : "list", 
      "list/*path"                                             : "list", 
      "view/*path"                                             : "view",
      "templates/*path"                                        : "templates",
//      "views/*path"                                            : "views",
      "article/*path"                                          : "article", 
      "edit/*path"                                             : "edit", 
      "make/*path"                                             : "make", 
      "chooser/*path"                                          : "choose", 
      "chat/*path"                                             : "chat", 
      "chatPrivate/*path"                                      : "chat", 
      "chatLobby/*path"                                        : "chat", 
      "login/*path"                                            : "login", 
      ":type/:backlink"                                        : "list"
    },

//    CollectionViews: {},
//    MkResourceViews: {},
//    PrivateChatViews: {},
//    ChatViews: {},
//    LobbyChatViews: {},
//    MenuViews: {},
//    Views: {},
//    EditViews: {},
//    Models: {},
//    Collections: {},
    Paginator: {},
    backClicked: false,
    forceFetch: false,
    errMsg: null,
    homePage: null,
    info: null,
//    viewsStack: [],
    urlsStack: [],
//    LoginView: null,
    _failToGoBack: function() {      
      U.alert({
        msg: "Oops! The browsing history ends here."
      });
    },
    initialize: function () {
//      G._routes = _.clone(this.routes);
//      window.router = this;
      G.router = this;
      this.firstPage = true;
      this.updateHashInfo();
//      this.homePage = new HomePage({el: $('#homePage')});
      var self = this;
      Events.on('home', function() {
        self.goHome();
      });

      Events.on('navigate', function(fragment, options) {
        self.navigate.apply(self, [fragment, _.defaults(options || {}, {trigger: true, replace: false})]);
      });

      Events.on('pageChange', function(prev, current) {
        self.backClicked = self.firstPage = false;
//        if (G.DEBUG)
          window.view = current;
      });

      Events.once('pageChange', this.loadTourGuide.bind(this));
      Events.on('back', _.debounce(function(reason) {
        if (!reason)
          debugger;
        
        console.log("GOING BACK: " + reason);
        self.previousFragment = null;
        self.backClicked = true;
        window.history.back();
//        var href = window.location.href, i = 10;
//        while (i-- > 0) {
//          window.history.back();
//          if (window.location.href != href)
//            break;
//        }
//        
//        if (window.location.href == href) {
//          // there's nowhere to go back to
//          if (ifNoHistory) {
//            setTimeout(ifNoHistory, 2000);
//          }
//            
//          return;
//        }
        
//        // if this._hashChanged is true, it means the hash changed but the page hasn't yet, so it's safe to use window.history.back(;
//        var haveHistory = self.urlsStack.length || (self._hashChanged && self.currentUrl != null);        
//        if (haveHistory) {
//          window.history.back();
//          return;
//        }
//          
//        // seems we don't have any history to go back to, but as the user has clicked the UI back button, 
//        // they probably don't want to exit the app, so let's go somewhere sane
//        var hash = U.getHash();
//        if (!hash) {
//          self._failToGoBack();
//          return;
//        }
//        
//        var hashParts = hash.match(/^(chat|edit|templates|view|chooser|make)\/(.*)/);
//        if (!hashParts || !hashParts.length) {
//          // we're probably at a list view
//          self._failToGoBack();
//          return;
//        }
//          
//        var method = hashParts[1];
//        switch (method) {
//          case 'chat':
//          case 'edit':
//          case 'templates':
//            self.navigate('view/' + hashParts[2], {trigger: true});
//            return;
//          case 'make':
//          case 'view':
//            self._failToGoBack();
//            return;
//          case 'chooser':
//            Events.trigger('home');
//            return;
//        }
//        
////        self.lastBackClick = now;
//        self.previousHash = null;
//        self.backClicked = true;
//        window.history.back();
      }, 100, true));
      
      Events.on('forward', function() {
        window.history.forward();
      });


//      if (G.isJQM()) {
//        // a hack to prevent browser address bar from dropping down
//        // see: https://forum.jquery.com/topic/stopping-the-url-bar-from-dropping-down-i-discovered-a-workaround
//        $('[data-role="page"]').on('pagecreate',function(event) {
//          $('a[href]', this).each(function() {
//              var self = $(this);
//              if (!self.is( "[rel='external']" ) ) {
//                  self.attr('link', self.attr('href'));
//                  self.removeAttr('href');
//              }
//          });
//        });
//      }

      Events.on('uriChanged', function(tempUri, data) {
        self.checkUpdateHash(tempUri, U.getValue(data, '_uri'));
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
      
      
//      $(window).hashchange(function() {
//        self._hashChanged = true;        
//      });
//      
//      Events.on('pageChange', function() {
//        self._hashChanged = false;
////        console.debug('currentUrl:', self.currentUrl);
////        console.debug('previousHash:', self.previousHash);
//      });
      
//      _.each(['list', 'view', 'make', 'templates', 'home'], function(method) {
//        var fn = self[method];
//        self[method] = function() {
//          self.previousHash = self.currentHash;
//        }
//      });
      
//      window.onpopstate = function(e) {
//        if (self.firstPage)
//          return;
//        else {
//          Events.stopEvent(e);
//          Events.trigger('back');
//        }
//      }
//      $('a').click(function(e) {
//        if (this.href.startsWith(G.appUrl)) {
//          e.preventDefault();
//          self.navigate(this.href.slice(G.appUrl + 1));
//          return false;
//        }        
//      });
    },
    
    defaultOptions: {
//      extraParams: {},
      trigger: true,
      replace: false
    },
    
    fragmentToOptions: {},
    
    navigate: function(fragment, options) {
      console.log("NAVIGATING: " + fragment);
      
//      if (this.previousHash === fragment) {
////      prevents some (not all) duplicate history entries, BUT creates unwanted forward history (for example make/edit views)
//        Events.trigger('back');
//        return;
//      }
      if (_.has(arguments[0], 'toFragment')) {
        debugger;
        // hash info object
        var hashInfo = arguments[0];
        fragment = hashInfo.toFragment();
        options = hashInfo.options;
      }
      
      
      options = options || {};
      var adjustedOptions = _.extend({}, this.defaultOptions, _.pick(options, 'forceFetch', 'errMsg', 'info', 'replace', 'postChangePageRedirect', 'via')),
          hashInfo = G.currentHashInfo,
          pageRoot = G.pageRoot;
      
      if (G.inFirefoxOS)
        U.rpc('setUrl', window.location.href);
      
      if (/^(mailto:|https?:\/\/)/.test(fragment)) {
        var appPath = G.serverName + '/' + pageRoot;
        if (fragment.startsWith(appPath)) // link within app
          fragment = fragment.slice(appPath.length + 1); // cut off #
        else {
          if (~fragment.indexOf("?") && fragment.indexOf("#") == -1)
            debugger; // are we leaving the app?
          
          window.location.href = fragment;
          return;
        }
      }
      else if (fragment.startsWith(pageRoot)) // link within app
        fragment = fragment.slice(pageRoot.length + 1); // cut off #
      else if (/app\/[a-zA-Z]+\#/.test(fragment)) { // link to another app
        debugger;
        window.location.href = G.serverName + '/' + fragment;
        return;
      }
      
      G.log(this.TAG, 'events', 'navigate', fragment);
      
      this.fragmentToOptions[fragment] = adjustedOptions;
      _.extend(this, {
//        previousView: this.currentView, 
        previousHash: G.currentHash 
      });
      
      if (options.transition)
        this.nextTransition = options.transition;
      
      try {
        Backbone.Router.prototype.navigate.call(this, fragment, options);
      } finally {
        if (options.trigger == false)
          this.updateHashInfo();
      }
      
//      _.extend(this, this.defaultOptions);
//      return ret;
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
//      var currentView = this.currentView;
//      this.previousHash = U.getHash(); 
////      try {
//        return Backbone.Router.prototype.route.apply(this, arguments);
////      } finally {
////        this.previousView = currentView;
////      }
//    },

    /**
     * Backbone 1.0 decodes parameters, which confuses our routes, as we have fragments such as
     * #view/http%3A%2F%2Fmark.obval.com%2Furbien%2Fsql%2Furbien.com%2Fvoc%2Fdev%2FGym%2FRun%3Fid%3D32044?$minify=n
     * which when decoded would have two question marks
     */
    _extractParameters: function(route, fragment) {
      return route.exec(fragment).slice(1);
    },

    home: function() {
      if (!this.routePrereqsFulfilled('home', arguments))
        return;
      
      var homePage = C.getCachedView(),
          currentView = this.currentView;
      
      if (!homePage) {
        if (currentView && currentView.getHashInfo().route == 'home') {
          currentView.destroy(true); // don't nuke contents
          this._previousView = this.currentView = null; 
        }
        
        var homePageEl = doc.$('#homePage')[0];
        if (!homePageEl) {
          if (G.homePage) {
            doc.body.$append(G.homePage);
            delete G.homePage;
          }
          else {
            debugger;
            doc.body.$append(localStorage.getItem('homePage'));
          }
          
          homePageEl = doc.$('#homePage')[0];
        }
        
        homePage = new HomePage({
          el: homePageEl 
        });
      }
      
      this.changePage(homePage);
    },
    
    social: function() {
      if (!this.routePrereqsFulfilled('social', arguments))
        return;
      
      var view = C.getCachedView();
      if (!view)
        view = new Modules.SocialNetworkPage();
      
      this.changePage(view);
    },

    buy: function() {
      if (!this.routePrereqsFulfilled('buy', arguments))
        return;
      
      var page = new Modules.PaymentPage({});
      this.changePage(page);
    },

    'static': function() {
      if (!this.routePrereqsFulfilled('static', arguments))
        return;
      
      var view = C.getCachedView();
      if (!view) {
        var hashInfo = G.currentHashInfo,
            template = hashInfo.uri,
            data;
        
        if (template == 'advisorsPageTemplate') {
          // TODO: unhack, fetch actual backlink
          data = {
            advisors: [
              {
                davDisplayName: 'Dmitriy Katsnelson',
                featured: 'http://www.fortigent.com/wp-content/uploads/2013/08/DSC0686DimitriKatsnelson.jpg',
                title: 'Senior Analyst',
                company: 'Fortigent, LLC',
                linkedin: 'https://www.linkedin.com/profile/view?id=56792021'
              },
              {
                davDisplayName: 'David Raviv',
                featured: 'http://nyetm.com/wp-content/uploads/2013/03/david.png',
                title: 'Advancing Information Security',
                linkedin: 'https://www.linkedin.com/profile/view?id=3937988'
              },
              {
                davDisplayName: 'Jeff Weisman',
                featured: 'http://jfenetwork.com/wp-content/uploads/2014/04/jeff.jpg',
                title: 'Account Executive',
                company: 'Salesforce.com',
                linkedin: 'https://www.linkedin.com/profile/view?id=2396844'
              },
              {
                davDisplayName: 'David Miller',
                featured: 'https://media.licdn.com/mpr/mpr/wc_240_240/p/4/000/152/0b0/33612c4.jpg',
                title: 'Portfolio Manager & Co-founder',
                company: 'Catalyst Mutual Funds',
                linkedin: 'https://www.linkedin.com/profile/view?id=3115936'
              },
              {
                davDisplayName: 'Michael Fox-Rabinovitz',
                featured: 'https://media.licdn.com/media/p/1/000/001/0a6/0ffda3f.jpg',
                title: 'Partner / Portfolio Manager',
                company: 'Strategic Streams',
                linkedin: 'https://www.linkedin.com/profile/view?id=70513'
              },
              {
                davDisplayName: 'Greg Irwin',
                title: 'Partner',
                company: 'BWG Strategy LLC',
                linkedin: 'https://www.linkedin.com/profile/view?id=10934599',
                featured: 'https://media.licdn.com/mpr/mpr/wc_240_240/p/1/005/040/38f/08b3c9d.jpg'
              }
            ]
          };
        }
        
//        if (hashInfo.params.template) {
        
          view = new Modules.StaticPage({
            template: template,
            data: data
          });
//        }
//        else if (hashInfo.params.selector) {
//          var el = doc.body.$(hashInfo.params.selector)[0]; // + '[data-role="page"]')[0];
//          if (!el) {
//            Events.trigger('navigate', 'home/', { replace: true, trigger: true });
//            return;
//          }
//            
//          view = new Modules.StaticPage({
//            el: el
//          });
//        }
      }
      
      this.changePage(view);
    },

    choose: function(path) { //, checked, props) {
      if (this.routePrereqsFulfilled('choose', arguments)) {
//        if (!Redirecter.getCurrentChooserBaseResource()) {
//          var params = U.getCurrentUrlInfo().params,
//              forResource = params.$forResource;
//          
//          if (!forResource && !params.$createInstance) {
//            Events.trigger('back', 'back from chooser route due to no current chooser, no $forResource and no $createInstance'); 
//            return;
//          }
//        }
          
        this.list(path, G.LISTMODES.CHOOSER); //, {checked: checked !== 'n', props: props ? props.slice(',') : []});
      }
    },

    /**
     * return true if page change will be asynchronous, false or undefined otherwise
     */
    list: function(oParams, mode) {
      if (!this.routePrereqsFulfilled('list', arguments))
        return;

      var self = this,
          ListPage = Modules.ListPage,
          hashInfo = G.currentHashInfo,
          cachedView = C.getCachedView(),
          typeUri = hashInfo.type,
          params = hashInfo.params,
          query = hashInfo.query;
          
      if (query) {        
        if (_.has(params, '$page')) {
          this.page = parseInt(params.$page);
          query = _.param(params);
        }
//        var q = query.split("&");
//        for (var i = q.length - 1; i >= 0; i--) {
//          if (q[i] == "$page") {
//            this.page = parseInt(q[i].split("=")[1]); // page is special because we need it for lookup in db
//            q.splice(i, 1);
//            query = q.length ? q.join("&") : '';
//            break;
//          }
//        }
      }
      
      var page = this.page = this.page || 1;
      var options = this.getChangePageOptions();
      var forceFetch = options.forceFetch;
      
//      if (!this.isModelLoaded(typeUri, 'list', arguments))
//        return;
      
      var model = U.getModel(typeUri),
          className = model.displayName;
      
      if (params['-aroundMe'] == 'y') {
        // auto load location-based results
        U.getCurrentLocation(model).done(function(position) {
          _.extend(params, U.toModelLatLon(position, model), {'-item': 'me', '$orderBy': 'distance'});            
        }).always(function() {
          delete params['-aroundMe'];
          self.navigate(U.makeMobileUrl(hashInfo.action, typeUri, params), {trigger: true, replace: true});
        });
        
        return;
      }
      
//      var t = className;  
//      var key = query ? t + '?' + query : t;
//      var key = query || typeUri;
//      if (query)
//        key = U.getQueryString(U.getQueryParams(key, model), true);

      var params = U.getHashParams();
//      var list =  (mode &&  mode == G.LISTMODES.CHOOSER &&  (params['$more'] || params['$less'])) ? null : C.getResourceList(model, query);
      var list;
      if (mode &&  mode == G.LISTMODES.CHOOSER &&  (params['$more'] || params['$less']))
        list = null;
      else {
        if (cachedView)
          list = cachedView.collection;
        else {
          var filtered = U.filterObj(params, function(key) { return !/^-/.test(key) });
          list = C.getResourceList(model, U.getQueryString(filtered, {sort: true}));
        }
      }
//      if (list && !list._lastFetchedOn)
//        list = null;
      
      var meta = model.properties;      
//      var viewsCache = this.CollectionViews[typeUri] = this.CollectionViews[typeUri] || {};
      if (list) {
        if (!cachedView)
          cachedView = new ListPage({model: list});
        
        this.currentModel = list;
        cachedView.setMode(mode || G.LISTMODES.LIST);
        this.changePage(cachedView, _.extend({page: page}));
        Events.trigger('navigateToList:' + list.listId, list);
//        G.whenNotRendering(function() {
          list.fetch({
            page: page, 
            forceFetch: forceFetch
          });
//        });
        
        this.monitorCollection(list);
//        setTimeout(function() {c.fetch({page: page, forceFetch: forceFetch})}, 100);
        return this;
      }
      
      list = this.currentModel = new ResourceList(null, {
        model: model,
        params: params,
//        _query: query, 
        _rType: className, 
        rUri: oParams 
      });
      
      var listView = new ListPage({
        model: list, 
        fetchOptions: {
          forceFetch: forceFetch
//          , 
//          sync: true
        }
      });
      
      listView.setMode(mode || G.LISTMODES.LIST);
      
//      list.fetch({
////        update: true,
//        sync: true,
////        params: {
////          $select: '$viewCols,$gridCols,$images'
////        },
//        forceFetch: forceFetch,
//        rUri: oParams,
////        success: _.once(function() {
////          self.changePage(listView);
//////          self.loadExtras(oParams);
////        }),
//////        error: Errors.getDefaultErrorHandler()
////        error: _.once(function(collection, resp, opts) {
////          var code = resp.code;
////          if (code === 204)
////            self.changePage(listView);
////          else {
////            if (code == 400)
////              Events.trigger('badList', list);
////            
////            Errors.getBackboneErrorHandler().apply(this, arguments);
////          }
////        })
//      });
      
      this.changePage(listView);
      this.monitorCollection(list);
      return this;
    },
    
    templates: function(tName) {
      if (!this.routePrereqsFulfilled('templates', arguments))
        return;

      var hashInfo = G.currentHashInfo,
          cached = C.getCachedView();
      
      if (cached) {
        this.changePage(cached);
        return;
      }
        
      var previousView = this.currentView;
      if (!previousView) {
        tName = _.decode(tName.split('?')[0]); // url is of a form make%2f...?modelName=..., we just want the unencoded "make/..."        
        this.navigate(tName, {trigger: true, postChangePageRedirect: U.getHash()});
        return;
      }
      
      var descendants = previousView.getDescendants();
      var templateToTypes = {};
      for (var i = 0, len = descendants.length; i < len; i++) {
        var d = descendants[i];
        var templates = d._templates || [];
        var type = d.vocModel.type;
        if (templates.length) {
          for (var j = 0, tLen = templates.length; j < tLen; j++) {
            var t = templates[j];
            var typeTemplates = templateToTypes[t] = templateToTypes[t] || [];
            _.pushUniq(typeTemplates, type);
          }
        }
      }
      
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
      
      var type = hashInfo.sub.type;
      var currentAppUri = G.currentApp._uri;
      var jstType = G.commonTypes.Jst;
      var jstModel = U.getModel(jstType);
      var jstUriBase = G.sqlUrl + '/' + jstType.slice(7) + '?';
      for (var tName in templateToTypes) {
        var types = templateToTypes[tName];
        templates.push(new jstModel({
          _uri:  jstUriBase + _.param({templateName: tName}),
          templateName: tName,
          forResource: currentAppUri,
          modelDavClassUri: type
        }, {
          detached: true
        }));
      }
      
      var tList = new ResourceList(templates, {params: {forResource: currentAppUri}});
      if (!G.appTemplates)
        G.appTemplates = tList;
      
      var lPage = new Modules.ListPage({model: tList});
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
//        this.navigate(_.decode(tName), {trigger: true, postChangePageRedirect: U.getHash()});
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
//            _.pushUniq(typeViews, type);
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
//          _uri:  jsUriBase + _.param({viewName: tName}),
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
        var updateHash = function() {
          self.navigate(U.makeMobileUrl(U.getCurrentUrlInfo().route, collection.vocModel.type, collection.params), {trigger: false, replace: true}); // maybe trigger should be true? Otherwise it can't fetch resources from the server
        }
        
        var currentView = self.currentView;
        if (currentView && currentView.collection === collection)
          updateHash();
        else
          Events.once('navigateToList.' + collection.listId, updateHash);
      });
    },
    
//    loadViews: function(views, caller, args) {
//      views = $.isArray(views) ? views : [views];
//      var self = this;
//      var unloaded = _.filter(views, function(v) {return !self[v]});
//      if (unloaded.length) {
//        var unloadedMods = _.map(unloaded, function(v) {return 'views/' + v});
//        U.require(unloadedMods, function() {
//          var a = U.slice.call(arguments);
//          for (var i = 0; i < a.length; i++) {              
//            Modules[unloaded[i]] = a[i];
//          }
//          
//          caller.apply(self, args);
//        });
//      }
//    },
//
//    _backOrHome: function() {
//      if (this.urlsStack.length)
//        Events.trigger('back');
//      else
//        this.goHome();
//    },

    goHome: function() {
      Events.trigger('navigate', G.pageRoot); 
    },
    
    _requestLogin: function(options) {
      Events.trigger('req-login', _.extend(options || {}));
    },
    
    make: function(path) {
      if (!this.routePrereqsFulfilled('make', arguments))
        return;

      var hashInfo = G.currentHashInfo,
          EditPage = Modules.EditPage, 
          type = hashInfo.type,
          vocModel = U.getModel(type),
          params = U.getHashParams(),
          makeId = params['-makeId'];
      
      if (params.$template) {
        Events.trigger('navigate', U.makeMobileUrl('chooser', type, params), {replace: true});
        return;
      }
      
      makeId = makeId ? parseInt(makeId) : G.nextId();
      var mPage = C.getCachedView(); //this.MkResourceViews[makeId];
      if (mPage && !mPage.model.getUri()) {
        // all good, continue making ur mkresource
      }
      else {
        var model = U.getModel(type),
            modelParams = U.getQueryParams(hashInfo.params, model),
            resource = new model(U.filterInequalities(modelParams));
        
        if (!resource.getUri() && Redirecter.fastForwardMake(resource))
          return;
        
//        if (_.isEmpty(U.getPropertiesForEdit(resource))) {
//          resource.save();
//          return;
//        }
        
        mPage = new EditPage({
          model: resource, 
          action: 'make', 
          makeId: makeId, 
          source: this.previousHash
        });
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
      fragment = fragment || U.getHash();
      return this.fragmentToOptions[fragment] || (this.fragmentToOptions[fragment] = {});
    },

    article: function(path) {
      if (!this.routePrereqsFulfilled('article', arguments))
        return;
      
      try {
        this.view(path, 'article');
      } finally {
        if (G.currentUser.guest)
          this._requestLogin();
      }
    },

    edit: function(path) {
      if (!this.routePrereqsFulfilled('edit', arguments))
        return;
      
      try {
        this.view(path, 'edit');
      } finally {
        if (G.currentUser.guest)
          this._requestLogin();
      }
    },

    chat: function(path) {
      if (!this.routePrereqsFulfilled('chat', arguments))
        return;
      
      try {
        this.view(path, 'chat');
      } finally {
        if (G.currentUser.guest)
          this._requestLogin();
      }
    },
    
    updateHashInfo: function() {
      G.previousHash = G.currentHash;
      G.previousHashInfo = G.currentHashInfo;
      G.currentHash = U.getHash();
      if (G.currentHash !== G.previousHash)
        G.currentHashInfo = U.getUrlInfo(G.currentHash);
      
      return G.currentHashInfo;
    },
    
    routePrereqsFulfilled: function(route, args) {
      Events.trigger('changingPage');
      return this._routePrereqsFulfilled.apply(this, arguments); 
    },
    
    _routePrereqsFulfilled: function(route, args) {
      this.updateHashInfo();
      var self = this,
          views,
          missingTypes,
          prereqs,
          installationState,
          isWriteRoute,
          hashInfo = U.getCurrentUrlInfo(),
          type = hashInfo.type,
          params = hashInfo.params,
          current = hashInfo.url,
          replaceWith = current;

      if (replaceWith.length < G.appUrl.length)
        replaceWith = G.appUrl;
      
      if (replaceWith.endsWith('/home'))
        replaceWith += '/';
      else if (replaceWith.endsWith(G.appUrl))
        replaceWith = G.appUrl + "/home/";
      
      if (!G.currentUser.guest && !params['-ref']) {
        replaceWith = U.replaceParam(replaceWith, '-ref', U.getUserReferralParam());
      }
      
      if (replaceWith != current) {
        Events.trigger('navigate', replaceWith, { trigger: false, replace: true });
        return this.routePrereqsFulfilled.apply(this, arguments);
      }
        
      if (G.currentUser.guest && /^(chat|edit|make|social)/.test(route)) {
        this._requestLogin();
        return false;
      }
      
      // the user is attempting to install the app, or at least pretending well
      isWriteRoute = U.isWriteRoute(route);
      if (!type || !type.endsWith(G.commonTypes.AppInstall)) {
//        if (G.currentApp.forceInstall || isWriteRoute) {
//          installationState = AppAuth.getAppInstallationState(); //hashInfo.type);
//          if (!installationState.allowed) {
        if ((G.currentApp.forceInstall || isWriteRoute) && !G.currentUser.installedThisApp) {
          if (G.currentUser.guest) {
            this._requestLogin();
            return false;
          }

          Voc.getModels(hashInfo.type);
          AppAuth.requestInstall(G.currentApp);
          return false;
        }
      }

      if (G.currentApp.isInPrivateBeta && !G.currentUser.isActivated) {
        // obviously not meant as security, if someone really wants to browse the site, let them 
        if (route != 'home' && route != 'static' && publicTypes.indexOf(type) == -1) {
          Events.trigger('navigate', 'static/privateBetaPageTemplate', {replace: true});
          return false;
        }
      }
      
      switch (route) {
      case 'chat':        
        views = ['ChatPage'];
        break;
      case 'social':        
        views = ['SocialNetworkPage'];
        break;
      case 'static':        
        views = ['StaticPage'];
        break;
      case 'view':
        views = ['ViewPage'];
        break;
      case 'article':
        views = ['ArticlePage'];
        break;
      case 'buy':
        views = ['PaymentPage'];
        break;
      case 'edit':
      case 'make':
        views = ['EditPage', 'EditView'];
        break;
      case 'templates':
      case 'list':
      case 'choose':
        views = ['ListPage'];
        break;
      }
      
      prereqs = [];
      if (views) {
        var missing = _.filter(views, function(view) {
          return !Modules[view];
        });
        
        if (missing.length) {
//          this.loadViews(missing, this[route], args);
//          return false;
          var unloadedMods = _.map(missing, function(v) {return 'views/' + v}),
              viewsPromise = U.require(unloadedMods, function() {
                for (var i = 0, l = arguments.length; i < l; i++) {              
                  Modules[missing[i]] = arguments[i];
                }
              });
          
          prereqs.push(viewsPromise);
        }
      }

      for (var p in params) {
        var val = params[p];
        if (U.isTempUri(val)) {
          U.getResourcePromise(val);
        }
      }
      
      missingTypes = [];    
      var sub = hashInfo;
      while (sub) {
        if (sub.type) {
          sub.type = G.classMap[sub.type] || sub.type;
          if (!U.getModel(sub.type) && missingTypes.indexOf(sub.type) == -1)
            missingTypes.push(sub.type);
        }
        
        sub = sub.sub;
      }
      
      if (missingTypes.length)
        prereqs.push(Voc.getModels(missingTypes));
      
      if (!_.all(prereqs, function(p) { return p.state() == 'resolved' })) {
        $.whenAll.apply($, prereqs).then(function() {
          self[route].apply(self, args);
        });
        
        return false;
      }

      return true;
    },
    
    checkUpdateHash: function(tempUri, uri) {
      var replaceHash = false,
          hashInfo = U.getCurrentUrlInfo(),
          params = hashInfo.params,
          redirectOptions = {
            trigger: false,
            replace: true
          };

      if (U.isResourceRoute()) {
        if (hashInfo.uri == tempUri) {
          delete params[U.getTempIdParameterName()];
          Events.trigger('navigate', U.makeMobileUrl(hashInfo.route, uri, params), redirectOptions);
          this.updateHashInfo();
        }
        
        return;
      }      

      for (var p in params) {
        var val = params[p];
        if (val == tempUri) {
          params[p] = uri;
          replaceHash = true;
        }
      }
      
      if (replaceHash)
        Events.trigger('navigate', U.makeMobileUrl(hashInfo.route, hashInfo.type, hashInfo.params), redirectOptions);
    },
    
    updateHash: function(hashInfo) {
      debugger;
    },
        
    login: function(path) {
      if (!this.routePrereqsFulfilled('login', arguments))
        return;
      
      var self = this,
          hashInfo = U.getCurrentUrlInfo(),
          params = hashInfo.params;
      
      this._requestLogin({
        returnUri: params && params.$returnUri || G.appUrl,
        returnUriHash: params && params.$returnUriHash,
        dismissible: false
//        ,
//        onDismiss: function() {
//          self.goHome();
//        }
      });
    },
    
    /**
     * handles view, edit and chat mode (action)
     */
    view: function (path, action) {
      action = action || 'view';
      if (!this.routePrereqsFulfilled(action, arguments))
        return;
      
      var self = this,
          hashInfo = G.currentHashInfo,
          cachedView = C.getCachedView(),
          uri = hashInfo.uri,
          typeUri = hashInfo.type,
          edit = hashInfo.action == 'edit',
          chat = hashInfo.action == 'chat',
          viewPageCl,
          view,
          model,
          res;
      
      switch (action) {
        case 'chat':
          viewPageCl = Modules.ChatPage;
          break;
        case 'article':
          viewPageCl = Modules.ArticlePage;
          break;
        case 'edit':
          viewPageCl = Modules.EditPage;
          break;
        default:
          viewPageCl = Modules.ViewPage;
      }

      if (hashInfo.special == 'profile') {
        if (G.currentUser.guest) {
          this._requestLogin();
          return;
        }
        else {
          this.navigate(U.makeMobileUrl('view', uri, hashInfo.params), {trigger: true, replace: true});
          return;          
        }
      }
      
      if (chat && /^_/.test(uri)) {
        var chatPage = cachedView || new Modules.ChatPage();
        this.changePage(chatPage);
        return;
      }      

      model = U.getModel(typeUri);
      if (!model)
        return this;

      res = cachedView ? cachedView.resource : C.getResource(uri);
      if (res && !res.loaded)
        res = null;

      var newUri = res && res.getUri();
      var wasTemp = U.isTempUri(uri);
      var isTemp = newUri && U.isTempUri(newUri);
//      if (wasTemp) {
//        function updateHash(resource) {
//          self.navigate(U.makeMobileUrl(action, resource.getUri()), {trigger: false, replace: true});
//        }
//        
//        if (isTemp || !newUri) {
//          Events.once('synced:' + uri, function() {            
//            var currentView = self.currentView;    
//            if (currentView && currentView.resource === res) {
//              updateHash(res);
//            }
//            else
//              Events.once('navigateToResource:' + res.cid, updateHash);
//          });
//        }
//        else {
//          updateHash(res);
//        }
//      }

      var options = this.getChangePageOptions();
      var forceFetch = options.forceFetch;
      if (res) {
        this.currentModel = res;
        view = cachedView || new viewPageCl({model: res, source: this.previousHash });
        
        this.changePage(view);
//        Events.trigger('navigateToResource:' + res.cid, res);
//        G.whenNotRendering(function() {
          res.fetch({forceFetch: forceFetch});
//        });
        
        if (wasTemp && !isTemp)
          this.navigate(U.makeMobileUrl(action, newUri), {trigger: false, replace: true});
        
        return this;
      }
      
      res = this.currentModel = new model({_uri: uri});
      view = new viewPageCl({
        model: res, 
        source: this.previousHash,
        fetchOptions: {
          forceFetch: forceFetch
        }
      });
      
      this.changePage(view);
      
//      function success() {
//        if (wasTemp)
//          self._checkUri(res, uri, action);
//        
//        self.changePage(view);
//        Events.trigger('navigateToResource:' + res.cid, res);
//      };
//      
//      if (chat) {
//        res.fetch();
//        success();
//      }
//      else {
//        res.fetch({
////          sync: true, 
//          forceFetch: forceFetch, 
//          success: _.once(success)
//        });
//      }
      
      return true;
    },
    
//    tour: function(path) {
//      if (!this.routePrereqsFulfilled('tour', arguments))
//        return;
//      
//      var self = this,
//          hashInfo = G.currentHashInfo,
//          sub = hashInfo.sub,
//          params = hashInfo.params,
//          tourUri = hashInfo.uri,
//          tourModel = U.getModel(G.commonTypes.Tour),
//          stepUri = params.$step && U.getLongUri1(params.$step),
//          stepModel = U.getModel(G.commonTypes.TourStep);
//
////      else if (sub)
////        debugger; // TODO figure out what the hell the user is trying to do
////      else if (hashInfo.type == TOUR_STEP_TYPE)
////        stepUri = hashInfo.uri;
////      else if (hashInfo.type == TOUR_TYPE)
////        debugger; // TODO go to the first step
////
////          ,
////          steps,
////          tourUri,
////          tourRes;
//      
//      debugger;
//      if (!tourUri || !stepUri)
//        return fail();
//      
//      function fail() {
//        debugger;
////        self.navigate(hashInfo.sub.hash);
//      };
//
//      function success(tour, steps) {
//        step = steps.get(stepUri);
//        var action = step.get('action');
//        if (self._currentTour !== tour)
//          Events.trigger('tourStart', tour, steps);
//        
//        Events.trigger('tourStep', step);
////        if (sub.type)
////          self[route].apply(self, hashInfo.sub.hash);
////        else
////          self.navigate(U.makeMobileUrl('tour', U.makeMobileUri(step.get('action'), step.get('typeUri'), _.getParamMap(step.get('urlQuery') || ''))), {replace: true});
//        self[action].apply(self, U.makeMobileUrl(action, step.get('typeUri'), _.getParamMap(step.get('urlQuery') || '')));
//      }
//      
//      $.whenAll(
//          getTour(tourUri, tourModel), 
//          getSteps(tourUri, stepModel)
//      ).then(success, fail);
//    },
    
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
        U.require(['views/LoginButton'], function(LV) {
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
//
//    isModelLoaded: function(type, method, args) {
//      return this.areModelsLoaded([type], method, args);
//    },
//
//    areModelsLoaded: function(types, method, args) {
//      var self = this,
//          missing = _.filter(types, _.negate(U.getModel));
//      
//      if (!missing.length)
//        return true;
//      
//      var fetchModels = Voc.getModels(missing, {sync: true});
//      method = typeof method == 'function' ? method : self[method];
////      Voc.loadStoredModels({models: [type]});
//      if (fetchModels.state() === 'resolved')
//        return true;
//      
//      fetchModels.done(function() {
//        method.apply(self, args);
//      }).fail(function() {
////          debugger;
//        Errors.getBackboneErrorHandler().apply(this, arguments);
//      });
//        
//      return false;
//    },

    checkErr: function() {
//      var q = U.getQueryParams();
//      var msg = q['-errMsg'] || q['-info'] || this.errMsg || this.info;
//      if (msg)
//        U.alert({msg: msg, persist: true});
//      
//      this.errMsg = null, this.info = null;
      var params = G.currentHashInfo.params,
          info = params['-info'] || params['-gluedInfo'],
          error = params['-error'] || params['-gluedError'];
          
      if (info || error) {
//        if (/^home\//.test(U.getHash())) {
////          Events.trigger('headerMessage', {
////            info: {
////              msg: info,
////              glued: info === params['-gluedInfo']
////            },
////            error: {
////              msg: error,
////              glued: error === params['-gluedError']
////            }
////          });
//          var errorBar = $.mobile.activePage.find('#headerMessageBar');
//          errorBar.html("");
//          errorBar.html(U.template('headerErrorBar')({error: error, info: info, style: "text-color:#FFFC40;"}));
//
//          if (!params['-gluedInfo']) {
//            var hash = U.getHash().slice(1);
//            delete params['-info'];
//            delete params['-error']; 
//            // so the dialog doesn't show again on refresh
//            Events.trigger('navigate', U.replaceParam(U.getHash(), {'-error': null, '-info': null}), {trigger: false, replace: true});
//          }
//        }
      
        var data = {};
        if (info) {
          data.info = {
            msg: info,
            glued: !!params['-gluedInfo']
          };
        }
        if (error) {
          data.error = {
            msg: error,
            glued: !!params['-gluedError']
          };
        }
        
        Events.trigger('headerMessage', data);
      }
    },

    $changePage: function(options) {
//      var method = G.isJQM() ? this.$changePageJQM : this.$changePageBB;
      var method = this.$changePageBB;
      return method.call(this, this._previousView, this.currentView, options);
    },
    
    $changePageBB: function(fromView, toView, options) {
      if (fromView == toView)
        return;
      
      var toBlur,
          changePageOptions = this.getChangePageOptions(),
          transOptions = _.extend({ 
            direction: options && options.reverse ? 'right' : 'left',
            from: fromView,
            to: toView
          }, changePageOptions, options);
      
      delete changePageOptions.via;
      if (fromView && !fromView.isListPage())
        delete transOptions.via; // HACK - for when user clicks on ListPage and then clicks on another item before transition has completed, issuing a faux transition from ViewPage with "via"
      
      this._previousView = toView;
      
      // kill the keybord, from JQM
      try {
        Q.read(function() {          
          if ( document.activeElement && document.activeElement.nodeName.toLowerCase() !== 'body' ) {
            toBlur = document.activeElement;
          } else {
            toBlur = fromView && fromView.$( "input:focus, textarea:focus, select:focus" );
          }
          
          if (toBlur && toBlur.length) {
            Q.write(function() {
              toBlur.blur();
            });
          }
        });
      } catch( e ) {}
      
//      Transitioner[options && options.reverse ? 'right' : 'left'](fromView, toView, null, this.firstPage ? 0 : 400).done(function() {
//        G.$activePage = $m.activePage = toView.$el;
//        G.activePage = toView.el;
//      });
      
      transOptions.transition = transOptions.via ? 'zoomInTo' : 'snap';//'slide';
//      transOptions.transition = transOptions.via ? 'rotateAndZoomInTo' : 'snap';
      Transitioner.transition(transOptions).done(function() {
//        if (changePageOptions.replace || (fromView && /^make|edit/.test(fromView.hash) && fromView.isSubmitted()))
        if (fromView && Modules.EditPage && fromView instanceof Modules.EditPage && fromView.isSubmitted())
          fromView.destroy();
//          Events.trigger('uncacheView', fromView); // destroy

        if (fromView && fromView.el)
          fromView.el.$trigger('page_hide');
        
        toView.el.$trigger('page_show');
        G.$activePage = toView.$el;
        if ($m)
          $m.activePage = G.$activePage;
        
        G.activePage = toView.el;
      });
    },
    
    $changePageJQM: function(fromView, toView, options) {
      if (!$m.autoInitializePage)
        $m.initializePage(toView.$el);
      
      $m.changePage(toView.$el, options);
      G.$activePage = toView.$el;
      G.activePage = toView.el;
    },

//    $changePage: function(toPage, options) {
//      var path = $m.path,
//          urlHistory = $m.navigate.history,
//          documentUrl = path.documentUrl,
//          fromPage = $m.activePage,
//          mpc = $m.pageContainer,
//          settings = _.extend({
//            pageContainer: mpc,
//            fromPage: fromPage
//          }, $m.changePage.defaults, options),
//          pbcEvent = new $.Event( "pagebeforechange" ),
//          triggerData = { 
//            toPage: toPage, 
//            options: settings, 
//            absUrl: toPage.data('absUrl')
//          };
//
//      mpc.trigger(pbcEvent, triggerData);
//      if (pbcEvent.isDefaultPrevented())
//        return;
//
//      if (toPage[0] === $m.firstPage[0] && !settings.dataUrl)
//        settings.dataUrl = documentUrl.hrefNoHash;
//      
//      if (fromPage && fromPage[0] === toPage[0])
//        return;
//      
//      var url = ( settings.dataUrl && path.convertUrlToDataUrl( settings.dataUrl ) ) || toPage.jqmData( "url" ),
//          // The pageUrl var is usually the same as url, except when url is obscured as a dialog url. pageUrl always contains the file path
//          pageUrl = url,
//          fileUrl = path.getFilePath( url ),
//          active = urlHistory.getActive(),
//          activeIsInitialPage = urlHistory.activeIndex === 0,
//          historyDir = 0,
//          pageTitle = document.title;
//
//      // We need to make sure the page we are given has already been enhanced.
//      toPage.page();
//
//      // If the changePage request was sent from a hashChange event, check to see if the
//      // page is already within the urlHistory stack. If so, we'll assume the user hit
//      // the forward/back button and will try to match the transition accordingly.
//      if ( settings.fromHashChange ) {
//        historyDir = options.direction === "back" ? -1 : 1;
//      }
//
//      // Kill the keyboard.
//      // XXX_jblas: We need to stop crawling the entire document to kill focus. Instead,
//      //            we should be tracking focus with a delegate() handler so we already have
//      //            the element in hand at this point.
//      // Wrap this in a try/catch block since IE9 throw "Unspecified error" if document.activeElement
//      // is undefined when we are in an IFrame.
//      try {
//        if ( document.activeElement && document.activeElement.nodeName.toLowerCase() !== 'body' ) {
//          $( document.activeElement ).blur();
//        } else {
//          $( "input:focus, textarea:focus, select:focus" ).blur();
//        }
//      } catch( e ) {}
//
//      // if title element wasn't found, try the page div data attr too
//      // If this is a deep-link or a reload ( active === undefined ) then just use pageTitle
//      var newPageTitle = ( !active )? pageTitle : toPage.jqmData( "title" ) || toPage.children( ":jqmData(role='header')" ).find( ".ui-title" ).text();
//      if ( !!newPageTitle && pageTitle === document.title ) {
//        pageTitle = newPageTitle;
//      }
//      
//      if ( !toPage.jqmData( "title" ) ) {
//        toPage.jqmData( "title", pageTitle );
//      }
//
//      // Set the location hash.
//      if ( url && !settings.fromHashChange ) {
//        debugger;
//        var params;
//
//        // rebuilding the hash here since we loose it earlier on
//        // TODO preserve the originally passed in path
//        if( !path.isPath( url ) && url.indexOf( "#" ) < 0 ) {
//          url = "#" + url;
//        }
//
//        // TODO the property names here are just silly
//        params = {
//          transition: settings.transition,
//          title: pageTitle,
//          pageUrl: pageUrl,
//          role: settings.role
//        };
//
//        if ( settings.changeHash !== false && $.mobile.hashListeningEnabled ) {
//          $.mobile.navigate( url, params, true);
//        } else if ( toPage[ 0 ] !== $.mobile.firstPage[ 0 ] ) {
//          $.mobile.navigate.history.add( url, params );
//        }
//      }
//
//      //set page title
//      document.title = pageTitle;
//
//      //set "toPage" as activePage
//      $m.activePage = toPage;
//
//      // If we're navigating back in the URL history, set reverse accordingly.
//      settings.reverse = settings.reverse || historyDir < 0;
//
//      if ( fromPage ) {
//        //trigger before show/hide events
//        fromPage.data( "mobile-page" )._trigger( "beforehide", null, { nextPage: toPage } );
//      }
//
//      toPage.data( "mobile-page" )._trigger( "beforeshow", null, { prevPage: fromPage || $( "" ) } );
//
//      //clear page loader
//      $m.hidePageLoadingMsg();          
//      if (fromPage) {
////        var direction = settings.reverse ? 'right' : 'left',
////            transition = $.mobile._maybeDegradeTransition(settings.transition),
////            reverseClass = settings.reverse ? " reverse" : "",
////            screenHeight = $.mobile.getScreenHeight(),
////            maxTransitionOverride = $m.maxTransitionWidth !== false && $m.window.width() > $m.maxTransitionWidth,
////            none = !$.support.cssTransitions || maxTransitionOverride || !transition || transition === "none" || Math.max( $m.window.scrollTop(), toScroll ) > $m.getMaxScrollForTransition(),
////            toPreClass = " ui-page-pre-in",
////            toScroll = $m.urlHistory.getActive().lastScroll || $m.defaultHomeScroll;
//            
//        toPage.css("z-index", -10).addClass($m.activePageClass + toPreClass);
//        Transitioner[settings.reverse ? 'right' : 'left'](fromPage[0], toPage[0], 'ease-in-out', 600).done(function() {
//
//          // Send focus to page as it is now display: block
//          $m.focusPage( toPage );
//
//          // Set to page height
//          toPage.height($m.getScreenHeight() + toScroll);
//
//          window.scrollTo(0, toScroll);
//
//          // Restores visibility of the new page: added together with $to.css( "z-index", -10 );
//          toPage.css( "z-index", "" );
//
//          toPage
//            .removeClass( toPreClass )
//            .addClass(transition + " in" + reverseClass);
//
//          if ( none ) {
//            doneIn();
//          }
//
//          //trigger show/hide events
//          if ( fromPage ) {
//            fromPage.data( "mobile-page" )._trigger( "hide", null, { nextPage: toPage } );
//          }
//
//          //trigger page_show, define prevPage as either fromPage or empty jQuery obj
//          toPage.data( "mobile-page" )._trigger( "show", null, { prevPage: fromPage || $( "" ) } );
//                      
////            removeActiveLinkClass();
//
//          //if there's a duplicateCachedPage, remove it from the DOM now that it's hidden
//          if ( settings.duplicateCachedPage ) {
//            settings.duplicateCachedPage.remove();
//          }
//
////            releasePageTransitionLock();
//          mpc.trigger( "pagechange", triggerData);
//        });
//      }
//    },
    
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
          if (view.isActive())
            this.navigate(redirect, {trigger: true, replace: true});
        }
      }
    },
    
    changePage1: function(view) {
      var self = this,
          activated = false,
          prev = this.currentView,
          options = this.getChangePageOptions(),
          replace = options.replace,
          transition = 'slide',
          isReverse = false,
          renderPromise;
      
      if (view == this.currentView) {
        G.log(this.TAG, "render", "Not replacing view with itself, but will refresh it");
        view.refresh();
        return;
      }
            
      if (prev) {
        if (prev == view) {
          Events.trigger('back', 'Duplicate history entry, backing up some more');
          return;
        }
//        else
//          prev.trigger('active', false);
      }

      Events.trigger('activeView', view);
      this.currentView = view;
      if (!view.rendered) {
//        view.trigger('active', true);
        activated = true;
//        view.render();
        this.getChangePageOptions().render = true;
        if (!view.el.parentNode)
          document.body.appendChild(view.el);
//        renderPromise = view.render();
//        view.onload(function() {          
//          view.$el.attr({
//            id: 'page' + G.nextId(),
//            'data-role': 'page'
//          }); //.attr('data-fullscreen', 'true');
//        });
      }

//      if (!G.browser.mobile) {
//        if (Modules.ListPage && view instanceof Modules.ListPage)
//          $('body').css('overflow', 'hidden');
//        else
//          $('body').css('overflow', 'visible');
//      }
          
      if (this.firstPage)
        transition = 'none';
      
      // HACK //
//      isReverse = false;
      // END HACK //

      // back button: remove highlighting after active page was changed
      
//      if (!activated)
//        view.trigger('active', true);
      
      this.checkBackClick();
      // perform transition
//      view.onload(function() {
      
      var activePage = document.querySelector('div.ui-page-active');
      if (activePage) {
        var headerUl = activePage.$('#headerUl')[0];
        if (headerUl) {
          headerUl.$('.ui-btn-active').$removeClass('ui-btn-active');
        }
      }
      
//        $('div.ui-page-active #headerUl .ui-btn-active').removeClass('ui-btn-active');
        
//        if (G.isJQM()) 
      
//      Physics.echo(function() {
//        console.log("CHANGING PAGE");
      this.$changePage({changeHash: false, transition: self.nextTransition || transition, reverse: this.getTransitionDirection() == 'right'});
      
//      if (_.isPromise(renderPromise))
//        renderPromise.done(doChangePage);
//      else
//        doChangePage();
      
//      }.bind(this));
        
//        Physics.echo(function() {
//          console.log("CHANGING PAGE");
//          this.$changePage({changeHash: false, transition: this.nextTransition || transition, reverse: this.backClicked});
//          this.nextTransition = null;
//          Events.trigger('pageChange', prev, view);
//        }.bind(this));

/*
        if (G.currentApp.widgetLibrary  && G.currentApp.widgetLibrary == 'Building Blocks') {
          var hdr = $('div.ui-page-active .hdr');
          if (hdr) {
            var bg = G.theme.menuHeaderBackground, 
                c  = G.theme.color,
                liBg = G.theme.liBg;
            if (!c) {
              var swatch = G.theme.header;
              if (swatch > 'c') {
                var bg = $('.ui-body-' + swatch).css('background')  ||  $('.ui-body-' + swatch).css('background-color');
                if (bg  &&  bg.indexOf('rgb(') != -1) {
                  G.theme.menuHeaderBackground = bg = U.colorLuminanceRGB(bg, -0.1);
                  G.theme.color = c = $('.ui-body-' + swatch + ' .ui-link').css('color');
                }
                if (!liBg  &&  view.collection) {
                  var bgI = $('.ui-body-' + swatch).css('background-image');
                  if (bgI) {
                    var i1 = bgI.indexOf('rgb(');
                    if (i1) {
                      var i2 = bgI.indexOf(')');
                      G.theme.liBg = liBg = bgI.substring(i1, i2 + 1);
                    }
                  }
                }
              }    
              else {
                G.theme.menuHeaderBackground = '#ddd';
                G.theme.color = '#333333';
              }
              c  = G.theme.color;
              bg = G.theme.menuHeaderBackground;
            }
            if (c  &&  bg) {
              $('div.ui-page-active #buttons #name').css('background', bg);
//              if (view.collection  &&  liBg)
//                $('div.ui-page-active #sidebar li').css('background', liBg);
              $('div.ui-page-active #pageTitle').css('color', c);
              c = $('[data-role="page"]').css('color');
//              $('div.ui-page-active #sidebar span').css('color', c);
              G.theme.descColor = c.charAt(0) == '#' ? U.colorLuminance(c, 0.7) : U.colorLuminanceRGB(c, 0.7);
              $('.u-desc').css('color', G.theme.descColor );
            }
          }
//            var bg = $('.ui-body-' + swatch).css('background')  ||  $('.ui-body-' + swatch).css('background-color');
//            if (bg  &&  bg.indexOf('rgb(') != -1)
//              $('div.ui-page-active .hdr').css('background', U.colorLuminanceRGB(bg, -0.1));
//            var c = $('.ui-body-' + swatch + ' .ui-link').css('color');
//            if (c  &&  c.indexOf('rgb(') != -1)
//              $('div.ui-page-active #pageTitle').css('color', c);
//            }
        }
*/        
        this.nextTransition = null;
        Events.trigger('pageChange', prev, view);
//      }.bind(this));
      
      return view;
    },
    
    getTransitionDirection: function() {
      var dirParam = G.currentHashInfo.params['-transitionDirection'];
      if (dirParam)
        return dirParam;
      else
        return this.backClicked ? 'right' : 'left';
    },
    
    checkBackClick: function() {
      if (this.backClicked) {
        this.urlsStack.pop();
        return;
      }
      
      var options = this.getChangePageOptions(),
          replace = options.replace,
          here = window.location.href;
      
//      if (this.currentView instanceof Backbone.View  &&  this.currentView.clicked) {
//        this.currentView.clicked = false;
//        return;
//      }
//      // Check if browser's Back button was clicked
//      else 
      if (this.urlsStack.length != 0) {
        var url = this.urlsStack[this.urlsStack.length - 2];
        if (url == here) {
          this.backClicked = true;
          this.urlsStack.pop();
          return;
        }
      }
      
      if (replace)
        this.urlsStack = this.urlsStack.slice(0, this.urlsStack.length - 1);
      
      this.urlsStack.push(here);
    },
    
    loadTourGuide: function() {
      if (G.tourGuideEnabled) {
        var self = this;
        U.require('tourGuide').done(function(tourGuide) {
          tourGuide.init(self.currentView);
        });
      }
    }
//    ,
//    
//    changePage2: function(view) {
//      if (view == this.currentView) {
//        G.log(this.TAG, "render", "Not replacing view with itself, but will refresh it");
//        view.refresh();
//        return;
//      }
//
//      var activated = false;
//      var prev = this.currentView;
//      if (prev && prev !== view)
//        prev.trigger('active', false);
//      
//      var options = this.getChangePageOptions();
//      var replace = options.replace;
//      var lostHistory = false;
//      if (this.backClicked) {
//        var currentView = this.currentView;
//        if (currentView && !(this.currentView instanceof Backbone.View))
//          debugger;
//        if (this.currentView instanceof Backbone.View  &&  this.currentView.clicked)
//          this.currentView.clicked = false;
//        
//        this.currentView = this.viewsStack.pop();
//        this.currentUrl = this.urlsStack.pop();
//        if (currentView && currentView === this.currentView) {
//          debugger;
//          G.log(this.TAG, 'history', 'Duplicate history entry, backing up some more');
//          Events.trigger('back');
//          return;
//        }
//        
//        if (this.currentView)
//          view = this.currentView;
//        else
//          lostHistory = true;
//      }
//      
//      var transition = "slide";
//      if (!this.backClicked || lostHistory) {
//        if (this.currentView instanceof Backbone.View  &&  this.currentView.clicked)
//          this.currentView.clicked = false;
//        // Check if browser's Back button was clicked
//        else if (!this.backClicked  &&  this.viewsStack.length != 0) {
//          var url = this.urlsStack[this.viewsStack.length - 1];
//          if (url == window.location.href) {
//            this.currentView = this.viewsStack.pop();
//            this.currentUrl = this.urlsStack.pop();
//            view = this.currentView;
//            this.backClicked = true;
//          }
//        }
//        if (!this.backClicked  ||  lostHistory) {
//          if (!view.rendered) {
//            view.$el.attr('data-role', 'page'); //.attr('data-fullscreen', 'true');
//            view.trigger('active', true);
//            activated = true;
//            view.render();
//          }
//      
////          transition = "slide"; //$m.defaultPageTransition;
//          if (!replace  &&  this.currentView  &&  this.currentUrl.indexOf('#menu') == -1) {
//            this.viewsStack.push(this.currentView);
//            this.urlsStack.push(this.currentUrl);
//          }
//          
//          this.currentView = view;
//          this.currentUrl = window.location.href;
//        }
//      }
//
//      if (this.firstPage) {
//        transition = 'none';
//        this.firstPage = false;
//      }
//      
//      // hot to transition
//      var isReverse = false;
//      if (this.backClicked == true) {
//        this.backClicked = false;
//        isReverse = true;
//      }
//
//      // back button: remove highlighting after active page was changed
//      $('div.ui-page-active #headerUl .ui-btn-active').removeClass('ui-btn-active');
//      
//      if (!activated)
//        view.trigger('active', true);
//      
//      // perform transition        
//      $m.changePage(view.$el, {changeHash: false, transition: this.nextTransition || transition, reverse: isReverse});
//      this.nextTransition = null;
//      Events.trigger('pageChange', prev, view);
//      return view;
//    }
//    ,
//    isListRoute: function(route) {
//      return _.contains(['list', 'chooser', 'templates'], route);
//    },
//    isResourceRoute: function(route) {
////      return !this.isListRoute(route);
//      return !this.isListRoute(route) && route != 'make';
//    },
//    isProxyRoute: function(route) {
//      return _.contains(['templates'/*, 'tour'*/], route);
//    },
  });

  return Router;
});
  
