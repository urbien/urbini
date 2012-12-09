// needs Lablz.currentUser

// Filename: router.js
define([
  'cache!jquery', 
  'cache!jqmConfig',
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!utils', 
  'cache!events', 
  'cache!error', 
  'cache!models/Resource', 
  'cache!collections/ResourceList', 
  'cache!modelsBase', 
  'cache!views/ListPage', 
  'cache!views/ViewPage' 
], function($, __jqm__, __jqmConfig__, _, Backbone, U, Events, Error, Resource, ResourceList, MB, ListPage, ViewPage) {
  return Backbone.Router.extend({
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
      var self = this;
      Events.on('back', function() {
        self.backClicked = true;
      });
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
      
      if (!MB.shortNameToModel[type]) {
        MB.loadStoredModels({models: [type]});
        
        if (!MB.shortNameToModel[type]) {
          MB.fetchModels(type, 
             {success: function() {
               self.list.apply(self, [oParams]);
             },
             error: Error.getDefaultErrorHandler(),
             sync: true}
          );
          
          return;
        } 
      }
      
      var c = this.Collections[type];
      if (c && !c.loaded)
        c = null;
        
      if (!query && c && this.CollectionViews[type]) {
        this.changePage(this.CollectionViews[type], {page: page});
        this.Collections[type].fetch({page: page});
        return this;
      }
      
      var model = MB.shortNameToModel[type];
      if (!model)
        return this;
      
      var list = new ResourceList(null, {model: model, _query: query});    
      var listView = new ListPage({model: list});
      
      if (!query) {
        this.Collections[type] = list;
        this.CollectionViews[type] = listView;
      }
      
      list.fetch({
        add: true,
        sync: true,
        success: function() {
          self.changePage(listView);
          MB.fetchModelsForLinkedResources(list.model);
//          self.loadExtras(oParams);
        }
      });
      
      return this;
    },
  
    view: function (path) {
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
        if (Lablz.currentUser)
          this.view(encodeURIComponent(Lablz.currentUser._uri) + "?" + p);
        else
          window.location.replace(Lablz.serverName + "/register/user-login.html?errMsg=Please+login&returnUri=" + encodeURIComponent(window.location.href) + "&" + p);
        
        return;
      }
      
      var self = this;
      var type = U.getType(uri);
      uri = U.getLongUri(uri, {type: type, shortNameToModel: MB.shortNameToModel});
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
      var viewPageCl = ViewPage; // edit ? Lablz.EditPage : Lablz.ViewPage;
      if (res) {
        this.Models[uri] = res;
        views[uri] = views[uri] || new viewPageCl({model: res});
        this.changePage(this.Views[uri]);
        res.fetch({
          success: function() {MB.fetchModelsForLinkedResources(res)}
        });
        
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
  
      var typeCl = MB.shortNameToModel[type];
      if (!typeCl)
        return this;
      
      var res = this.Models[uri] = new typeCl({_uri: uri, _query: query});
      var view = views[uri] = new viewPageCl({model: res});
      var paintMap;
      var success = function(data) {
        self.changePage(view);
        success: MB.fetchModelsForLinkedResources(res);
  //      self.loadExtras(oParams);
      }
      
      res.fetch({sync:true, success: success});
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
      
      view.$el.attr('data-role', 'page'); //.attr('data-fullscreen', 'true');
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
      if (this.backClicked == true) {
        this.backClicked = false;
        isReverse = true;
      }
      
      // perform transition
      $.mobile.changePage(view.$el, {changeHash:false, transition: transition, reverse: isReverse});
      Events.trigger('changePage', view);
      return view;
    }
  });
});
