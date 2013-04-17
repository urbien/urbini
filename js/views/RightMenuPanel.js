//'use strict';
define([
  'globals',
  'utils',
  'events',
  'vocManager',
  'views/BasicView'
], function(G, U, Events, Voc, BasicView) {
  function isCreatorOrAdmin(res) {
    return (G.currentUser._uri == G.currentApp.creator  ||  U.isUserInRole(U.getUserRole(), 'admin', res));
  };
  
  return BasicView.extend({
    TAG: 'RightMenuPanel',
    initialize: function(options) {
      _.bindAll(this, 'render', 'grab', 'release');
      this.constructor.__super__.initialize.apply(this, arguments);
  //    this.resource.on('change', this.render, this);
      this.makeTemplate('rightMenuP', 'template', this.vocModel.type);
      this.makeTemplate('menuItemTemplate', 'menuItemTemplate', this.vocModel.type);
      this.makeTemplate('propGroupsDividerTemplate', 'groupHeaderTemplate', this.vocModel.type);
      this.viewId = options.viewId + 'r';
      this.isPanel = true;
      Events.on('pageChange', this.destroy, this);
    },
    destroy: function() {
      this.$el.empty();
      this.stopListening();
    },
    events: {
      'click [data-grab]': 'grab',
      'click [data-release]': 'release',
//      'click #edit': 'edit',
      'click #add': 'add',
      'click #delete': 'delete',
      'click #subscribe': 'subscribe',
      'click': 'click'
//      'click #logout': 'logout',
    },
    click: function(e) {
      var t = e.target;
      var text = t.innerHTML;
      while (t  &&  t.nodeName.toLowerCase() != 'a') {
        if ($(t).attr("data-href"))
          break;
        t = t.parentNode;
      }
      
      if (typeof t === 'undefined' || !t)
        return;

      var href = $(t).attr('href') || $(t).attr('link') || $(t).attr("data-href");
      var idx = href.lastIndexOf('#');
      href = idx == -1 ? href : href.slice(idx + 1);
      
      this.router.navigate(href, {trigger: true});
    },
    
    release: function(e) {
      Events.stopEvent(e);
      var target = e.target;
//      var li = target;
//      var foundLi = false;
//      while (li && li.tagName && !(foundLi = li.tagName.toLowerCase() == 'li'))
//        li = li.parentNode;
//      
//      if (!foundLi)
//        return;
//      
//      li.parentNode.removeChild(li);
      var uri = target.dataset.release;
      var grabbed = G.currentUser.grabbed;
      var item = U.isTempUri(uri) ? grabbed.where({_oldUri: uri})[0] : grabbed.get(uri);
      var self = this;
      item.cancel({
        sync: true,
        success: function() {
          item['delete']();
          self.refresh();
        },
        error: function() {
          debugger;
        }
      });
    },
    
    grab: function(e) {
      Events.stopEvent(e);
      var target = e.target;
//      var li = target;
//      var foundLi = false;
//      while (li && li.tagName && !(foundLi = li.tagName.toLowerCase() == 'li'))
//        li = li.parentNode;
//      
//      if (!foundLi)
//        return;
//      
      var self = this;
//      li.parentNode.removeChild(li);
      var grabParams = target.dataset.grab;
      var grabType = G.commonTypes.Grab;
      Voc.getModels(grabType).done(function() {
        var grabModel = U.getModel(grabType);
        var grab = new grabModel(grabParams ? U.getParamMap(grabParams) : {});
        grab.save(null, {
          success: function() {
            var grabbed = G.currentUser.grabbed;
            if (!grabbed.get(grab))
              grabbed.add(grab);
            
            self.refresh();
          },
          error: function() {
            debugger;            
          }
        });
      });
      
      return this;
    },
//    edit: function(e) {
//      Events.stopEvent(e);
//      this.router.navigate(U.makeMobileUrl('edit', this.resource.getUri()), {trigger: true, replace: true});
//      return this;
//    },
    logout: function(e) {
      Events.stopEvent(e);
      Events.trigger('logout');
      return;
    },
//    click: function(e) {
//      var t = e.target;
//      var text = t.innerHTML;
//      while (t  &&  t.nodeName.toLowerCase() != 'a') {
//        if ($(t).attr("data-href"))
//          break;
//        t = t.parentNode;
//      }
//      
//      if (typeof t === 'undefined' || !t)
//        return;
//      
//      text = U.removeHTML(text).trim();
//      var href = $(t).attr('href') || $(t).attr('link') || $(t).attr("data-href");
//      var idx = href.lastIndexOf('#');
//      var href = idx == -1 ? href : href.slice(idx + 1)
//          
//      if (this.tabs[text]) {
//        if (this.tabs[text] == href) {
//          e.originalEvent.preventDefault();
//          this.router.navigate(href, {trigger: true, destinationTitle: text});
//          return;
//        }
//      }
//      
//      this.router.navigate(href, {trigger: true});
//    },
    refresh: function() {
      this.$el.empty();
      this.render();
    },
    
    render:function (eventName) {
      var mi = $('#' + this.viewId).find('ul#rightMenuItems');
      if (mi  &&  mi.length != 0) {
        $('#' + this.viewId).panel("open");
        return;
      }
      
      var self = this;
      var res = this.model;
      var model = this.vocModel;
      var json = this.resource && res.toJSON();
//      var isSuperUser = isCreatorOrAdmin(res);
      this.$el.html(this.template(json));      

      var ul = this.$('#rightMenuItems');
      var frag = document.createDocumentFragment();
      var isItemListing = res.isA("ItemListing");
      var isBuyable = res.isA("Buyable");
      if (isItemListing || isBuyable) {
        var licenseProp = U.getCloneOf(model, isItemListing ? 'ItemListing.license' : 'Buyable.license')[0];
        var license = res.get(licenceProp);
        if (license) {
          var ccEnum = U.getEnumModel('CCLicense');
          var licenseMeta = _.filter(ccEnum.values, function(val) {
            return val.displayName === license;
          })[0];
          
          if (licenceMeta) {
            U.addToFrag(frag, this.menuItemTemplate({title: 'License', image: licenseMeta.icon}));
          }
        }
      }

      this.buildGrabbed(frag);
      this.buildGrab(frag);
      this.buildActionsMenu(frag);
      
      if (this.resource  &&  U.isA(this.vocModel, 'ModificationHistory')) {
        var ch = U.getCloneOf(this.vocModel, 'ModificationHistory.allowedChangeHistory');
        if (!ch  ||  !ch.length)
          ch = U.getCloneOf(this.vocModel, 'ModificationHistory.changeHistory');
        if (ch  &&  ch.length  && !this.vocModel.properties[ch[0]].hidden) { 
          var cnt = res.get(ch[0]) && res.get(ch[0]).count;
          if (cnt  &&  cnt > 0) 
            U.addToFrag(frag, this.menuItemTemplate({title: "Activity", pageUrl: U.makePageUrl('list', 'system/changeHistory/Modification', {forResource: this.resource.getUri()})}));
        }
      }

      ul.append(frag);
      var p = $('#' + this.viewId);
      p.append(this.$el);
      p.panel("open");
      ul.listview();
//      p.trigger("updatelayout")
      return this;
    },

    grabExists: function(grab) {
      var type = grab.grabClass;
      var filter = grab.filter;
      var grabsForType = G.currentUser.grabbed.where({
        grabClass: type
      });
      
      return _.filter(grabsForType, function(item) {
        return U.areQueriesEqual(item.get('filter'), filter);
      }).length;
    },
    
    buildGrab: function(frag) {
      if (G.currentUser.guest)
        return;
      
      var grabType = G.commonTypes.Grab;      
      var res = this.resource;
      var isList = !res;
      var pageTitle = this.getPageTitle(); //$('#pageTitle').text();
      if (isList) {
        var grab = {
          filter: $.param(this.collection.params), 
          grabClass: this.vocModel.type,
          title: pageTitle
        };

        if (this.grabExists(grab))
          return;
        
        U.addToFrag(frag, this.groupHeaderTemplate({value: 'Grab'}));
        U.addToFrag(frag, this.menuItemTemplate({
          title: pageTitle, 
          data: {
            grab: $.param(grab)
          }
        }));
        
        return;
      }
      
      var uri = res.getUri();
      if (U.isTempUri(uri))
        return this;
      
      var grab = {
        grabClass: this.vocModel.type,
        filter: $.param({SELF: uri}),
        title: pageTitle
      };
      
      var addedHeader = false;
      var meta = this.vocModel.properties;
      var resName = U.getDisplayName(res);
      if (!this.grabExists(grab)) {
        U.addToFrag(frag, this.groupHeaderTemplate({value: 'Grab'}));
        addedHeader = true;
        U.addToFrag(frag, this.menuItemTemplate({
          title: resName, 
          data: {
            grab: $.param(grab)
          }
        }));
      }
      
      var backlinks = U.getBacklinks(meta);
      for (var bl in backlinks) {
        var blProp = backlinks[bl];
        var backlink = blProp.backLink;
        var qParams = {};
        qParams[backlink] = uri;
        var propName = U.getPropDisplayName(blProp);
        var grab = {
          grabClass: U.getTypeUri(blProp.range),
          filter: $.param(qParams),
          title: resName + ' - ' + propName
        };
        
        if (this.grabExists(grab))
          continue;
        
        if (!addedHeader) {
          U.addToFrag(frag, this.groupHeaderTemplate({value: 'Grab'}));
          addedHeader = true;
        }

        U.addToFrag(frag, this.menuItemTemplate({
          title: propName, 
          data: {
            grab: $.param(grab)
          }
        }));
      }
    },
    
    buildGrabbed: function(frag) {
      if (G.currentUser.guest)
        return;
      
      var grabbed = G.currentUser.grabbed; // maybe it should just be a regular collection, req'd after stuff loads
      if (grabbed.length) {
        U.addToFrag(frag, this.groupHeaderTemplate({value: 'Grabbed'}));
        grabbed.each(function(item) {
          U.addToFrag(frag, this.menuItemTemplate({
            title: item.get('title'), 
            data: {
              release: item.getUri(),
            }
          }));
        }.bind(this));
      }
    },
    
    buildActionsMenu: function(frag) {
      var haveActions;
      if (this.resource)
        haveActions = this.buildActionsMenuForRes(frag);
      else
        haveActions = this.buildActionsMenuForList(frag);
      
      if (!G.currentUser.guest) {
        if (!haveActions)
          this.addActionsHeader(frag);
        
        U.addToFrag(frag, this.menuItemTemplate({title: 'Follow', mobileUrl: '', id: 'subscribe'}));
      }
      
      if (!this.resource)
        return this;
      
      var res = this.resource;
      var model = this.vocModel;
      var isSuperUser = isCreatorOrAdmin(res);
      if (!isSuperUser)
        return this;
            
      var uri = U.getLongUri1(G.currentApp._uri);
      pageUrl = U.makePageUrl('view', uri);
      var title = 'Edit ' + G.currentApp.title;
      var img = G.currentApp.smallImage;
      if (!img) 
        U.addToFrag(frag, this.menuItemTemplate({title: title, pageUrl: pageUrl}));
      else {
        if (typeof G.currentApp.originalWidth != 'undefined' &&
            typeof G.currentApp.originalHeight != 'undefined') {
          
//              this.$el.addClass("image_fitted");
          
//              var dim = U.fitToFrame(60, 60, G.currentApp.originalWidth / G.currentApp.originalHeight);
//              var width = dim.w;
//              var height = dim.h;
//              var top = dim.y;
//              var right = dim.w - dim.x;
//              var bottom = dim.h - dim.y;
//              var left = dim.x;
//              U.addToFrag(frag, this.menuItemTemplate({title: title, pageUrl: pageUrl, image: img, width: width, height: height, top: top, right: right, bottom: bottom, left: left, cssClass: 'menu_image_fitted'}));
          U.addToFrag(frag, this.menuItemTemplate({title: title, pageUrl: pageUrl, image: img, cssClass: 'menu_image_fitted'}));
        }
        else
          U.addToFrag(frag, this.menuItemTemplate({title: title, pageUrl: pageUrl, image: img}));
      }
      
      U.addToFrag(frag, this.groupHeaderTemplate({value: 'Page Assets'}));        
      var wHash = U.getHash(true);
      var params = {};
      params.modelName = model.displayName;
      U.addToFrag(frag, this.menuItemTemplate({title: 'Templates', pageUrl: U.makePageUrl('templates', wHash, params)}));
//      U.addToFrag(frag, this.menuItemTemplate({title: 'Views', pageUrl: U.makePageUrl('views', wHash, params)}));
      U.addToFrag(frag, this.menuItemTemplate({title: 'Plugs', pageUrl: U.makePageUrl('list', G.commonTypes.Handler, {effectDavClassUri: model.type})}));      
      return this;
    },

    addActionsHeader: function(frag) {
      U.addToFrag(frag, this.groupHeaderTemplate({value: 'Actions'}));      
    },
    
    buildActionsMenuForList: function(frag) {
      var m = this.vocModel;
      var cMojo = m.classMojoMultiplier;
      var user = G.currentUser;
      if (!user.guest && typeof cMojo !== 'undefined' && user.totalMojo > cMojo) {
        this.addActionsHeader(frag);
        U.addToFrag(frag, this.menuItemTemplate({title: 'Add', mobileUrl: 'make/' + U.encode(m.shortName), id: 'add'}));
        return true;
      }
      
      return false;
    },
    
    buildActionsMenuForRes: function(frag) {
      var m = this.resource;
      var user = G.currentUser;
      var edit = m.get('edit');
      if (!user.guest  &&  edit  &&  user.totalMojo > edit) {
        this.addActionsHeader(frag);
        U.addToFrag(frag, this.menuItemTemplate({title: 'Add', mobileUrl: 'make/' + U.encode(m.constructor.shortName), id: 'add'}));
        U.addToFrag(frag, this.menuItemTemplate({title: 'Edit', mobileUrl: 'edit/' + U.encode(m.getUri()), id: 'edit'}));
        U.addToFrag(frag, this.menuItemTemplate({title: 'Delete', mobileUrl: '', id: 'delete'}));
        return true;
      }
      
      return false;
    },
        
    subscribe: function(e) {
      Events.stopEvent(e);
      var self = this;
      Voc.getModels("model/portal/MySubscription").done(function() {
        var m = U.getModel("model/portal/MySubscription");
        var res = new m();
        var props = {forum: self.resource.getUri(), owner: G.currentUser._uri};
        res.save(props, {
          sync: true,
          success: function(resource, response, options) {
            var rUri = self.resource.getUri();
            var uri = 'view/' + encodeURIComponent(rUri) + '?-info=' + encodeURIComponent("You were successfully subscribed to " + self.vocModel.displayName + ' ' + self.resource.get('davDisplayName'));
            self.router.navigate(uri, {trigger: true, replace: true, forceFetch: true, removeFromView: true});
          },
          error: function(resource, xhr, options) {
            var code = xhr ? xhr.code || xhr.status : 0;
            switch (code) {
            case 401:
              Events.trigger('req-login');
//              Errors.errDialog({msg: msg || 'You are not authorized to make these changes', delay: 100});
//              Events.on(401, msg || 'You are not unauthorized to make these changes');
              break;
            case 404:
              debugger;
              Errors.errDialog({msg: msg || 'Item not found', delay: 100});
              break;
            case 409:
              debugger;
              var rUri = self.resource.getUri();
              var uri = 'view/' + encodeURIComponent(rUri) + '?-info=' + encodeURIComponent("You've already been subscribed to " + self.vocModel.displayName + ' ' + self.resource.get('davDisplayName'));
              self.router.navigate(uri, {trigger: true, replace: true, forceFetch: true, removeFromView: true});
//              Errors.errDialog({msg: msg || 'The resource you\re attempting to create already exists', delay: 100});
              break;
            default:
              Errors.errDialog({msg: msg || xhr.error && xhr.error.details, delay: 100});
//              debugger;
              break;
            }
          }
        });
//        self.redirect.apply(self, args);
      }).fail(function() {
        self.router.navigate(U.makeMobileUrl('view', uri), options);
      });

      alert('subscribed...not really though');
    },
    
    add: function() {
    },
    
    "delete": function() {
      alert('deleted...not really though');
    }    
  }, 
  {
    displayName: 'RightMenuPanel'
  });
});
