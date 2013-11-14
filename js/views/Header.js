//'use strict';
define('views/Header', [
  'globals',
  'events', 
  'utils',
  'domUtils',
  'vocManager',
  'views/BasicView'
//  ,
//  'views/BackButton',
//  'views/LoginButton',
//  'views/AddButton',
//  'views/MapItButton',
//  'views/AroundMeButton',
//  'views/MenuButton',
//  'views/PublishButton'
], function(G, Events, U, DOM, Voc, BasicView/*, BackButton, LoginButton, AddButton, MapItButton, AroundMeButton, MenuButton, PublishButton*/) {
  var SPECIAL_BUTTONS = ['enterTournament', 'forkMe', 'publish', 'doTry', 'testPlug', 'resetTemplate', 'installApp'];
  var REGULAR_BUTTONS = ['back', 'mapIt', 'add', 'video', 'chat', 'login', 'rightMenu'];
  var commonTypes = G.commonTypes;
  return BasicView.extend({
    autoFinish: false,
    template: 'headerTemplate',
    initialize: function(options) {
      _.bindAll(this, 'render', /*'makeWidget', 'makeWidgets',*/ 'fileUpload'); //, '_updateInfoErrorBar', 'checkErrorList', 'sendToCall');
      BasicView.prototype.initialize.apply(this, arguments);
      options = options || {};
      _.extend(this, options);
      this.viewId = options.viewId;
      this.locationHref = window.location.hash;
      if (this.resource) {
        this.resource.on('change', function(res, options) {
//          G.log(this.TAG, 'events', 'change event received for', U.getDisplayName(this.resource));
          if (options && options.skipRefresh)
            return;
          
          this.refresh();
        }, this);
      }

      if (this.buttons)
        this.getButtonViews();
      
      var self = this;
      this.on('destroyed', function() {
        self.buttonViews = {};
      });
      
////      this.calcTitle();
//      this.makeTemplate('errorListTemplate', 'errorListTemplate', this.modelType);
//      this.makeTemplate('callInProgressHeaderTemplate', 'callInProgressHeaderTemplate', this.modelType);
//
//      _.each(['info', 'error'], function(event) {
//        var handler = this._updateInfoErrorBar;
//        Events.off(event, handler);
//        Events.on(event, handler);
//      }.bind(this));

      return this;
    },
    
    getButtonViews: function() {
      var res = this.resource;
      var vocModel = this.vocModel;
      var type = vocModel && vocModel.type;
      this.calcSpecialButtons();
      this.isGeo = this._isGeo();
//      _.extend(this, options);
      this.makeTemplate(this.template, 'template', type);
      this.makeTemplate('fileUpload', 'fileUploadTemplate', type);
      this.info = this.hashParams['-info'];
      
      var buttons = this.buttons;
      if (!this.hash.startsWith('chat') && res && _.any(_.values(_.pick(commonTypes, 'App', 'Handler', 'Jst')), function(type) { return U.isAssignableFrom(res.vocModel, type); }))
        buttons.publish = true;
      else if (vocModel && this.hash.startsWith('chooser')  &&  U.isAssignableFrom(this.vocModel, G.commonTypes.WebClass))
        buttons.publish = true;
      
      var btnOptions = {
        model: this.model, 
        parentView: this,
        viewId: this.viewId
      };
      
      var reqdButtons = [];
      buttons = U.filterObj(buttons, function(key, val) {
        return val;
      });
      
      for (var btn in buttons) {
        btn = btn.camelize(true); // capitalize first letter
        reqdButtons.push('views/{0}Button'.format(btn));
      }
      
      this.buttonViews = {};
      this.readyDfd = $.Deferred();
      this.ready = this.readyDfd.promise();
      U.require(reqdButtons, function() {
        var btns = arguments;
        var i = 0;
        for (var btn in buttons) {
          var model = arguments[i++];
          this.buttonViews[btn] = this.buttonViews[btn] || this.addChild(new model(btnOptions));
        }
        
        this.readyDfd.resolve();
      }.bind(this));
    },
    
    calcTitle: function() {      
      if (typeof this.pageTitle !== 'undefined') {
        this._title = this.title = this.pageTitle;
        return this;
      }
      
      // only use hash the first time
      var hash = this.hash = this.hash || window.location.hash;
      if (hash  &&  hash.charAt(0) == '#')
        hash = hash.slice(1);
      var res = this.model;
      var title, titleHTML;
      if (hash && G.tabs) {
        var decHash = decodeURIComponent(hash);
        var matches = _.filter(G.tabs, function(t) {
          return t.hash == hash || decodeURIComponent(t.hash) == decHash
        });
        
        if (matches.length)
          title = matches[0].title;
      }
      
      if (!title) {
        if (hash) {
          title = this.hashParams.$title;
          title = title  &&  title.replace(/<\/?[^>]+(>|$)/g, "").replace(/&nbsp;/, ":").replace(/&#160;/, ":").replace(/&nbsp;/g, " ").replace(/&#160;/g, " ");
        }

        if (!title && res) {
          if (U.isCollection(res)) 
            title = U.getPlural(res);
          else {
            title = U.getDisplayName(res);
            if (hash  &&  hash.indexOf('make/') == 0) {
//              title = this.pageTitle;
            }
            else {
              if (!U.isAssignableFrom(this.vocModel, "Contact"))
                titleHTML = U.makeHeaderTitle(this.vocModel['displayName'], title);
//              this.pageTitle = this.vocModel['displayName'] + ": " + this.pageTitle;
            }
          }
        }
      }
      
      this._title = title;
      this.title = titleHTML || title;

      return this;
    },
    events: {
      'change #fileUpload'         : 'fileUpload',
      'click #categories'         : 'showCategories',
//      'click #installApp'         : 'installApp',
      'click #moreRanges'         : 'showMoreRanges'
    },
    
    fileUpload: function(e) {
      Events.stopEvent(e);      
      debugger;
      $('#fileUpload').attr('action', G.serverName + '/mkresource');
//      var returnUri = $('$returnUri');
//      if (returnUri) {
//        var fn = $(':file').value;
//        var idx = fn.lastIndexOf('/');
//        $('$returnUri').attr('value', returnUri + '&originalImage=' + encodeURIComponent(G.pageRoot + '/wf/' + params['$location']) + fn.slice(idx));
//      }
      document.forms["fileUpload"].submit();
      /*
      $.ajax({
        url     : G.serverName + '/mkresource',
        type    : 'POST',
        enctype: 'multipart/form-data',
        data    : $('#fileUpload').serialize(),
        success : function( data ) {
           alert('Submitted');
        },
        error   : function( xhr, err ) {
           alert('Error');     
        }
      });
      */    

    },
    showMoreRanges: function(e) {
      Events.stopEvent(e);
      if (this.hashParams['$more']) {
        delete this.hashParams['$more']; 
        this.hashParams['$less'] = 'y'; 
      }
      else {
        delete this.hashParams['$less']; 
        this.hashParams['$more'] = 'y'; 
      }
      this.router.navigate(U.makeMobileUrl('chooser', this.vocModel.type, this.hashParams), {trigger: true, replace: true, forceFetch: true});
    },
    showCategories: function(e) {
      Events.stopEvent(e);
      var self = this;
      Voc.getModels("aspects/tags/Tag").done(function() {
//        var options = _.getParamMap(self.locationHref);
//        var uri = U.makeMobileUrl('list', U.getModel("Tag").type, _.extend({application: self.vocModel.type, $title: "Categories"}, options));
        var params = {};
        var meta = self.vocModel.properties;
        for (var p in self.hashParams) {
          var m = meta[p];
          if (!m)
            continue;
          params['tagUses.(' + self.vocModel.type + ')taggable.' + p] = self.hashParams[p];
        }
        params['application'] = self.vocModel.type;
        params.$title = 'Categories';
        var uri = U.makeMobileUrl('list', U.getModel("Tag").type, params); //, $orderBy: "tagUsesCount", $asc: "-1"});
        self.router.navigate(uri, {trigger: true, replace: true, forceFetch: true});
      }).fail(function() {
        self.router.navigate(U.makeMobileUrl('list', self.vocModel.type));
      });
    },
    
    refresh: function() {
//      this.refreshCallInProgressHeader();
      this.refreshTitle();
      this.calcSpecialButtons();
      this.renderSpecialButtons();
//      this.error = null;
//      this.renderError();
//      this.restyleNavbar();
      return this;
    },
    
    _isGeo: function() {
      return !!_.size(_.pick(this.buttons, 'mapIt', 'aroundMe'));
    },
    
    render: function(options) {
      options = options || {};
      if (!this.buttons || options.buttons) {
        this.buttons = options.buttons;
        this.isGeo = this._isGeo();
        this.getButtonViews();
      }
        
      var args = arguments;
      this.ready.done(function() {
        this.renderHelper.apply(this, args);
        this.finish();
      }.bind(this));
    },

    refreshTitle: function() {
      this.calcTitle();
      this.$('#pageTitle')[0].innerHTML = this.title;
//      $('title').text(this.title);
      this.pageView.trigger('titleChanged', this._title);
    },

    calcSpecialButtons: function() {
      var commonTypes = G.commonTypes,
          res = this.resource,
          self = this;
      
      if (this.isEdit || this.isChat)
        return;

      _.each(SPECIAL_BUTTONS, function(btnName) {
        this[btnName] = false;
      }.bind(this));
      
      if (res  &&  !this.isAbout) {
//        if (this.isEdit && this.vocModel.type === G.commonTypes.Jst) {
//          var tName = res.get('templateName');
//          this.resetTemplate = tName && this.getOriginalTemplate(tName);
//        }
      
        var user = G.currentUser._uri;
        if (U.isAssignableFrom(this.vocModel, commonTypes.App)) {
          var appOwner = U.getLongUri1(res.get('creator') || user);
          var lastPublished = res.get('lastPublished');
          if ((user == appOwner || U.isUserInRole(U.getUserRole(), 'admin', res))  &&  (!lastPublished || (lastPublished  &&  res.get('lastModifiedWebClass') > lastPublished)))
            this.publish = true;
          
          var noWebClasses = !res.get('lastModifiedWebClass')  &&  res.get('dashboard') != null  &&  res.get('dashboard').indexOf('http') == 0;
          var wasPublished = res.get('lastModifiedWebClass') < res.get('lastPublished');
          if (/*res.getUri()  != G.currentApp._uri  &&  */ (noWebClasses ||  wasPublished)) {
            if (res.get('_uri') != G.currentApp._uri)
              this.doTry = true;
            this.forkMe = true;
          }          
        }

        else if (!G.currentUser.guest) {
          if (U.isAssignableFrom(this.vocModel, commonTypes.Handler)) {
//          var plugOwner = U.getLongUri1(res.get('submittedBy') || user);
//          if (user == plugOwner)
            if (!this.resource.isNew())
              this.testPlug = true;            
          }
          else {
            if (U.isAssignableFrom(this.vocModel, U.getLongUri1("media/publishing/Video"))  &&  this.hashParams['-tournament'])
              this.enterTournament = true;
          }
        }
      }
    },
    
    renderSpecialButtons: function() {
      if (this.isEdit || this.isChat)
        return;
      
      var self = this;
      SPECIAL_BUTTONS.forEach(function(btn) {
        var el = self.$('#{0}Btn'.format(btn));
        if (el) {
          el.innerHTML = "";
          DOM.hide(el);
        }
      });
      
      var pBtn = this.buttonViews.publish;
      if (this.publish) {
        this.assign('#publishBtn', pBtn);
        DOM.unhide(this.$('#publishBtn'));
      }
      else if (pBtn) {
        DOM.hide(this.$('#publishBtn'));
        var options = _.filter(SPECIAL_BUTTONS, _['!='].bind(_, 'publish'));  // equivalent to _.filter(SPECIAL_BUTTONS, function(btn) { return btn != 'publish' })
        options.forEach(function(option) {
          var method = 'hide',
              selector = '#{0}Btn'.format(option);
          
          if (self[option]) {
            self.assign(selector, pBtn, _.pick(self, option));
            method = 'unhide';
          }
          
          DOM[method](self.$(selector));
        });
      }
      
      var hash = window.location.hash;
      var isChooser =  hash  &&  hash.indexOf('#chooser/') == 0;
      if (isChooser  &&  U.isAssignableFrom(this.vocModel, "Image")) {
        var forResource = this.hashParams['forResource'];
        var location = this.hashParams['$location'];
        var returnUri = this.hashParams['$returnUri'];
        var pr = this.hashParams['$prop'];
        if (forResource  &&  location  &&  pr) {
          var type = U.getTypeUri(forResource);      
          var cModel = U.getModel(type);
          var self = this;
          if (!cModel) {
            Voc.getModels(type).done(function() {
              cModel = U.getModel(type);
              if (cModel  &&  !cModel.properties[pr].readOnly) {
                var frag = document.createDocumentFragment();
                var rules = ' data-formEl="true"';
                U.addToFrag(frag, self.fileUploadTemplate({name: pr, forResource: forResource, rules: rules, type: type, location: location, returnUri: returnUri }));
                self.$el.append(frag);
              }
            });
          }
          else {
            var frag = document.createDocumentFragment();
            var rules = ' data-formEl="true"';
            U.addToFrag(frag, self.fileUploadTemplate({name: pr, forResource: forResource, rules: rules, type: type, location: location }));
            self.$el.append(frag);
          }
          
        }
      }
      
//      if (!this.publish  &&  !this.doTry  &&  !this.forkMe  &&  !this.testPlug  &&  !this.enterTournament  && ) 
      if (!_.any(SPECIAL_BUTTONS, function(b) { return this[b]; }.bind(this)))
        this.noButtons = true;      
    },
    
    restyleNavbar: function() {
      var navbar = this.$('[data-role="navbar"]')[0];
      $(navbar).navbar();
      navbar.classList.remove('ui-mini');
    },
    
    renderHelper: function() {
      if (window.location.hash.indexOf("#menu") != -1)
        return this;

      var self = this;
      var isJQM = G.isJQM(); //!wl  ||  wl == 'Jquery Mobile';
      var res = this.resource; // undefined, if this is a header for a collection view
      var error = res && res.get('_error');
      if (error)
        this.error = error.details;

      this.calcSpecialButtons();
      if (this.rendered)
        this.html("");
      
      var isTemplates = window.location.hash && window.location.hash.indexOf('#templates/') != -1; 
      
      if (!isTemplates  &&  !res && (U.isAssignableFrom(this.vocModel, G.commonTypes.App) || (U.isA(this.vocModel, 'Taggable')  &&  U.getCloneOf(this.vocModel, 'Taggable.tags').length/*  &&  U.isAssignableFrom(this.vocModel, 'Urbien')*/)))
        this.categories = true;
      else if (!res) {
        var hash = window.location.hash;
        var isChooser =  hash  &&  hash.indexOf('#chooser/') == 0;
        var prop = this.hashParams['$prop'];
        if (isChooser  &&  U.isAssignableFrom(this.vocModel, commonTypes.WebClass)  &&  prop /* == 'range'*/) { 
          this.moreRanges = true;
          var type = this.hashParams['$type'];
          
          var pname;
          if (type) {
            var pModel = U.getModel(type);
            pname = U.getPropDisplayName(pModel.properties[prop]);
          }
          else
            pname =  this.vocModel.properties[prop].displayName;
          if (this.hashParams['$more'])
            this.moreRangesTitle = 'Less ' + pname;
          else
            this.moreRangesTitle = 'More ' + pname;
        }
      }

      var templateSettings = this.getBaseTemplateData();
      if (U.isChatPage()) {
//        templateSettings.more = $.param({
//          "data-position": "fixed"
//        });
      }
      if (isJQM) {
        if (!this.publish  &&  this.doTry  &&  this.forkMe)
          templateSettings.className = 'ui-grid-b';
      }      
      this.html(this.template(templateSettings));
      this.refreshTitle();
//      this.$el.prevObject.attr('data-title', this.pageTitle);
//      this.$el.prevObject.attr('data-theme', G.theme.list);
      var pageData = this.pageView.el.dataset;
      pageData.title = this.pageTitle;
      pageData.theme = G.theme.list;
      var frag = document.createDocumentFragment();
      var btns = this.buttonViews;
      var isMapItToggleable = !!this.collection;
      
//      var numBtns = _.size(btns);
      var paintedBtns = [];      
      REGULAR_BUTTONS.forEach(function(btnName) {
        var btn = btns[btnName];
        if (!btn)
          return;
        
        var btnOptions = {
          force: true
        };
        
        if (btnName === 'mapIt') {
//          this.isGeo = this.isGeo && this.collection && _.any(this.collection.models, function(m) {  return !_.isUndefined(m.get('latitude')) || !_.isUndefined(m.get('shapeJson'));  });
          if (!self.isGeo)
            return;
          
          btnOptions.toggleable = isMapItToggleable;
        }
        
        paintedBtns.push(btn.el);
        frag.appendChild(btn.render(btnOptions).el);
      });      
      
      numBtns = paintedBtns.length;
//      var cols = btns['publish'] ? numBtns - 1 : numBtns;
      var cols = numBtns;
      var btnWidth = Math.round(100 * (100/cols))/100;
      DOM.set(paintedBtns, 'width', btnWidth + '%');
      
      var ul = this.$('#headerUl')[0];
      ul.innerHTML = "";        
      ul.appendChild(frag);
      
//      this.renderError();
      this.renderSpecialButtons();
      
      this.$el.trigger('create');
      if (this.isEdit  ||  this.isChat  ||  this.noButtons) {
        DOM.addClass(this.$('#headerButtons'), 'hidden');
      }
      if (isJQM) {
        if (!this.noButtons  &&  !this.categories  &&  !this.moreRanges) {
          DOM.removeClass(this.$('#name'), 'resTitle');
          if (this.resource  &&  !this.isEdit) {
            var pt = this.$('#pageTitle');
            if (pt.length) {
              DOM.set(pt, {
                'padding-bottom': '4px',
                'border-bottom': '1px solid rgba(255,255,255,0.5)'
              });
            }
          }
          // this.$el.find('#pageTitle').css('margin-bottom', '0px'); 
        }
      }      
      if (!this.noButtons  &&  !this.categories  &&  !this.moreRanges  &&  !this.isEdit) {
        DOM.set(this.$('#name.resTitle'), 'padding-bottom', '0px');
      }
//      var wl = G.currentApp.widgetLibrary;
      if (isJQM) {
        if (this.noButtons) 
          DOM.set(this.$('h4'), 'margin-top', '10px');
        else
          DOM.set(this.$('h4'), 'margin-top', '4px');
      }
      
      for (var btn in btns) {
        var badge = btns[btn].$('.menuBadge');
        if (badge.length) {
          if (G.currentApp.widgetLibrary  &&  G.currentApp.widgetLibrary == 'Topcoat')
            DOM.set(badge, 'left', '50%');
          else
            DOM.set(badge, 'left', Math.floor(btnWidth/2) + '%');
        }
      }
      // HACK
      // this hack is to fix loss of ui-bar-... class loss on header subdiv when going from masonry view to single resource view 
      var header = this.$('.ui-header')[0];
      var barClass = 'ui-bar-{0}'.format(G.theme.header);
      if (!DOM.hasClass(header, barClass))
        DOM.addClass(header, barClass);
      
      // END HACK
      
//      this.refreshCallInProgressHeader();
      if (isJQM)
        this.restyleNavbar();
      if (G.isTopcoat())
        DOM.replaceClass(this.$('li'), 'topcoat-button-bar__item');
      
      this.finish();      
      return this;
    }
  },
  {
    displayName: 'Header'
  });
});
