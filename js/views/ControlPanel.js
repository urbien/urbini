//'use strict';
define('views/ControlPanel', [
  'globals',
  'underscore', 
  'events', 
  'utils',
  'views/BasicView',
  'vocManager',
  'collections/ResourceList',
  'cache',
  'lib/fastdom',
  'physicsBridge'
], function(G, _, Events, U, BasicView, Voc, ResourceList, C, Q, Physics) {
  return BasicView.extend({
    tagName: "tr",
    autoFinish: false,
    initialize: function(options) {
      _.bindAll(this, 'render', 'refresh', 'add', 'update', 'insertInlineScroller', 'removeInlineScroller', 'toggleInlineScroller'); // fixes loss of context for 'this' within methods
      BasicView.prototype.initialize.apply(this, arguments);
      var type = this.vocModel.type;
      this.makeTemplate('propGroupsDividerTemplate', 'propGroupsDividerTemplate', type);
      this.makeTemplate('inlineListItemTemplate', 'inlineListItemTemplate', type);
//      this.makeTemplate('comment-item', 'commentItemTemplate', type);
      this.makeTemplate('cpTemplate', '_cpTemplate', type);
      this.makeTemplate('cpMainGroupTemplate', 'cpMainGroupTemplate', type);
      this.makeTemplate('cpMainGroupTemplateH', 'cpMainGroupTemplateH', type);
      this.makeTemplate('cpTemplateNoAdd', 'cpTemplateNoAdd', type);
      this.listenTo(this.resource, 'change', this.refresh);
      this.isMainGroup = options.isMainGroup;
      this.dontStyle = this.isMainGroup && options.dontStyle;
      this._backlinkInfo = {};
//      this.resource.on('inlineList', this.setInlineList, this);
  //    Globals.Events.on('refresh', this.refresh);
      return this;
    },
    events: {
//      'click a[data-shortName]': 'click',
      'click [data-cancel]': 'cancel',
      'click #mainGroup a[data-shortName]': 'add',
//      'click a[data-shortName]': 'lookupFrom',
//      'pinchout li[data-propname]': 'insertInlineScroller',
//      'pinchin li[data-propname]': 'removeInlineScroller',
      'hold li[data-propname]': 'toggleInlineScroller'
//        ,
//      'click': 'click'
    },
    
    cancel: function(e) {
      Events.stopEvent(e);
      var el = e.currentTarget;
      var data = el.dataset;
      var uri = data.uri;
      var getRes;
      var res = C.getResource(uri);
      if (res)
        getRes = G.getResolvedPromise();
      else {
        var li = el;
        while (li && li.tagName != 'LI') {
          li = li.parentElement;
        }
        
        if (!li)
          return;
        
        getRes = Voc.getModels(this.vocModel.properties[li.dataset.backlink].range).done(function(listModel) {
          res = new listModel({
            _uri: uri
          });
        });
      }
      
      getRes.done(function() {
        res.cancel({
          redirect: false
        });
      });
    },
    
//    click: function(e) {
//      var t = e.target;
//      while (t && t.tagName != 'A') {
//        t = t.parentNode;
//      }
//      
//      if (!t)
//        return;
//      this.prop = this.vocModel.properties[t.dataset.propname];
//      if (prop)
//        G.log(this.TAG, "Recording step for tour: selector = 'propName'; " + " value = '" + t.dataset.propname + "'");
//    },
    
    cpTemplate: function(data) {
      var action = 'list',
          params = { 
            $title: data.title 
          };
      
      params[data.backlink] = data._uri;
      if (U.isPropEditable(this.resource, data.prop, U.getUserRole()) && !data.prop.lookupFrom && !U.getBacklinkCount(this.resource, data.shortName)) {
        params.$backLink = data.backlink;
        action = 'make';
      }
      
      data.params = params;
      data.action = action;
      return this._cpTemplate(data);
    },
    
    _addNoIntersection: function(target, prop) {
      var params = {
        '$backLink': prop.backLink,
        '-makeId': G.nextId(),
        '$title': target.dataset.title
      };

      params[prop.backLink] = this.resource.getUri();
      
      if (U.isAssignableFrom(this.vocModel, 'commerce/trading/TradleFeed') && prop.range.endsWith('commerce/trading/Rule')) {
        params.eventClass = this.resource.get('eventClass');
        params.eventClass = this.resource.get('eventClass');
        params.eventClassRangeUri = this.resource.get('eventClassRangeUri');
        params.feed = this.resource.getUri();
        params.tradle = this.resource.get('tradle');
        params['feed.displayName'] = U.getDisplayName(this.resource);
      }
      
      Events.trigger('navigate', U.makeMobileUrl('make', prop.range, params));
      this.log('add', 'user wants to add to backlink');
    },
    
//    lookupFrom: function(e) {
//      var data = e.currentTarget.dataset,
//          res = this.resource,
//          meta = this.vocModel.properties,
//          lookupFrom = data.lookupfrom.split('.'),
//          base = meta[lookupFrom[0]],
//          baseVal = res.get(base.shortName),
//          toProp = meta[data.shortname],
//          info = {
//            params: {
//              $backLink: toProp.shortName,
//            },
//            action: 'make'
//          };
//      
//      return Voc.getModels([base.range, toProp.range]).then(function(baseModel, blModel) {          
//        if (U.isA(blModel, 'Templatable')) {
//          var bl = baseModel.properties[lookupFrom[1]];
//          var params = U.filterObj(info.params, U.isModelParameter);
//          info.params = U.filterObj(info.params, U.isMetaParameter);
//          info.params[U.getCloneOf(blModel, 'Templatable.isTemplate')[0]] = true;
//          info.params[bl.backLink] = baseVal;
//          info.params.$template = $.param(params);
//        }
//        
//        if (U.isA(model, 'Folder') && U.isA(blModel, 'FolderItem')) {
//          var rootFolder = U.getCloneOf(blModel, 'FolderItem.rootFolder')[0],
//              parentFolder = U.getCloneOf(model, 'Folder.parentFolder')[0];
//          
//          if (rootFolder && parentFolder) {
//            rootFolder = blModel.properties[rootFolder];
//            parentFolder = model.properties[parentFolder];
//            if (rootFolder.range == parentFolder.range) {
//              var val = res.get('Folder.parentFolder');
//              info.params.$rootFolder = val;
//              info.params.$rootFolderProp = rootFolder.shortName;
//            }
//          }
//        }
//
//        return info;
//      });
//    },
    
    add: function(e) {
//      var t = e.target;
//      while (t && t.tagName != 'A') {
//        t = t.parentNode;
//      }
//      
//      if (!t)
//        return;
//      
//      Events.stopEvent(e);
      var t = e.currentTarget;
      if (t.tagName != 'A')
        return;
      
      Events.stopEvent(e);
      if ($(t).parents('.__dragged__').length)
        return;
      
      var self = this,       
          shortName = t.dataset.shortname,
          prop = this.vocModel.properties[shortName],
          setLinkTo = prop.setLinkTo;
//      ,
//          count = U.getBacklinkCount(this.resource, shortName);
//
//      if (count > 0) {
//        Events.trigger('navigate', t.href);
//        return;
//      }
      
//      this.log("Recording step for tour: selector = 'data-shortname'; value = '" + shortName + "'");
      if (setLinkTo) {
        shortName = setLinkTo;
        prop = this.vocModel.properties[shortName];
      }
      
//      G.log(this.TAG, "Recording step for tour: selector = 'data-shortname'; value = '" + shortName + "'");

      Voc.getModels(prop.range).done(function() {
        var pModel = U.getModel(prop.range);
        if (!U.isAssignableFrom(pModel, 'Intersection')) { 
          self._addNoIntersection(t, prop);
          return;
        }
        
        var a = U.getCloneOf(pModel, 'Intersection.a')[0];
        var b = U.getCloneOf(pModel, 'Intersection.b')[0];
        if (!a  &&  !b) {
          self._addNoIntersection(t, prop);
          return;
        }
        
        var meta = pModel.properties,
            title = _.getParamMap(window.location.hash).$title,
            propA = meta[a],
            propB = meta[b],
            aUri = a == prop.backLink ? self.resource.get('_uri') : null,
            bUri = !aUri  &&  b == prop.backLink ? self.resource.get('_uri') : null;
        
        if (!title)
          title = U.makeHeaderTitle(self.resource.get('davDisplayName'), pModel.displayName);
        
        if (!aUri  &&  !bUri) {
          self._addNoIntersection(t, prop);
          return;
        }
        
        if (!aUri && propA.readOnly || !bUri && propB.readOnly) {
          self._addNoIntersection(t, prop);
          return;
        }
        
        var uri = aUri == null ? bUri : aUri;
        var rtype = aUri == null ? propA.range : propB.range;
        var params = {
          $forResource: uri,
          $propA: a,
          $propB: b,
          $type:  pModel.type, 
          $title: title
        };

        var where = aUri == null ? propA.where : propB.where;
        if (where)
          _.extend(params, U.getQueryParams(where));
        Events.trigger('navigate', U.makeMobileUrl('chooser', rtype, params), {trigger: true});
        G.log(self.TAG, 'add', 'user wants to add to backlink');
//        var params = {
//          '$backLink': prop.backLink,
//          '-makeId': G.nextId(),
//          '$title': t.dataset.title
//        };
//  
//        params[prop.backLink] = self.resource.getUri();
//        
//        self.router.navigate('make/{0}?{1}'.format(encodeURIComponent(prop.range), $.param(params)), {trigger: true});
//        G.log(self.TAG, 'add', 'user wants to add to backlink');
      });
    },

    toggleInlineScroller: function(e) {
      var pName = e.currentTarget.dataset.propname;
      var li = e.currentTarget,
          pName = li.dataset.propname,
          info = this._backlinkInfo[pName];
      
      if (info && info.scroller)
        this.removeInlineScroller(e);
      else
        this.insertInlineScroller(e);
    },
    
    removeInlineScroller: function(e) {
      e.gesture.preventDefault();
      e.gesture.stopPropagation();
      e.gesture.stopDetect();
      e.stopPropagation();
      
      var self = this,
          li = e.currentTarget,
          pName = li.dataset.propname,
          info = this._backlinkInfo[pName];
      
      if (info.scroller) {
        info.scroller.mason.destroy(true, function() {
          info.scroller.mason = null;
          info.scroller.destroy(true); // don't remove element
          li.$empty();
          for (var i = 0; i < info.originalContent.length; i++) {
            li.appendChild(info.originalContent[i]);
          }
          
          self.removeChild(info.scroller);
          info.scroller = null;
          info.originalContent = null;
        });
      }
    },

    insertInlineScroller: function(e) {
      e.gesture.preventDefault();
      e.gesture.stopPropagation();
      e.gesture.stopDetect();
      e.stopPropagation();
      var li = e.currentTarget,
          pName = li.dataset.propname,
          info = this._backlinkInfo[pName];
      
      if (!info || !info.scroller) {
        // TODO - check count, if 0, don't bother or throw up an error message
        if (!info)
          this._backlinkInfo[pName] = {};
            
        this._insertInlineScroller(li, pName);
      }
    },
    
    _insertInlineScroller: function(li, pName) {
      var self = this,
          prop = this.vocModel.properties[pName],
          modelPromise = Voc.getModels(prop.range),
          viewPromise = U.require('views/HorizontalListView'),
          listDfd = $.Deferred(),
          params = {},
          list,
          info = this._backlinkInfo[pName];
      
      function fail() {
        // TODO: tell user
      };
      
      params[prop.backLink] = this.resource.getUri();
      
      modelPromise.done(function(blModel) {
        if (!U.isA(blModel, 'ImageResource'))
          return fail();
        
        list = new ResourceList(null, {
          model: blModel,
          params: params
        });
        
        list.fetch({
          success: listDfd.resolve,
          error: listDfd.reject
        });
      }).fail(fail);
      
      $.when(viewPromise, listDfd.promise()).done(function(HorizontalListView) {
        if (!list.length)
          return fail();

        var headerId = pName + '-gal-header',
            galleryId = pName + '-gal';
        
        info.originalContent = li.childNodes.$slice();
        li.innerHTML = _.template("<div id=\"{{= headerId }}\" style=\"top: -3px;\" data-role=\"footer\" data-theme=\"{{= G.theme.photogrid }}\" class=\"thumb-gal-header\"><h3>{{= title }}</h3></div>" +
        		                      "<div id=\"{{= galleryId }}\" data-inset=\"true\" data-filter=\"false\" class=\"thumb-gal\"></div>")({
          G: G,
          headerId: headerId,
          galleryId: galleryId,
          title: U.getPropDisplayName(prop)
        });
        

        info.scroller = new HorizontalListView({
          el: li.$('#' + galleryId)[0],
          model: list, 
          parentView: self
        });
        
        info.scroller.render();
        self.addChild(info.scroller);
      }).fail(fail);
    },
    
    refresh: function(res, options) {
      options = options || {};
      if (options.partOfUpdate)
        return;
      
      var collection, modified;
      if (U.isCollection(arguments[0])) {
        collection = arguments[0];
        modified = arguments[1];
        if (collection != this.resource.collection || !_.contains(modified, this.resource.getUri()))
          return this;
      }
      
      this.render();
//      this._queueTask(this._refreshListview, this);
    },
    
//    _refreshListview: function() {      
//      if (!this.$el.hasClass('ui-listview'))
//        this.$el.trigger('create');
//      else {
//        this.$el.trigger('create');
//        this.$el.listview('refresh');
//      }
//    },

    render: function(options) {
      var invisible = false;
      if (!this.resource.isLoaded()) {
        this.toggleVisibility(true);
        invisible = true;
      }
      
      var self = this;
      return this.getFetchPromise().done(function() {
        self.renderHelper(options);
        if (invisible)
          self.toggleVisibility();
      });
    },
    
    renderHelper: function(options) {
      var res = this.resource;
      var vocModel = this.vocModel;
      var type = res.type;
      var meta = vocModel.properties;
      if (!meta)
        return this;
      
      var json = this.getBaseTemplateData(); //res.toJSON();
      var atts = res.attributes;
      var frag = document.createDocumentFragment();
  
      var mainGroup = U.getArrayOfPropertiesWith(meta, "mainGroup");
      if (this.isMainGroup  &&  !mainGroup.length)
        return;
      
      var isHorizontal;      
      if (this.isMainGroup && !this.dontStyle) {
        if (!U.isA(this.vocModel, 'ImageResource')  &&  !U.isA(this.vocModel, 'Intersection')) {
          this.el.$css("float", "left");
          this.el.$css("width", "100%");
          isHorizontal = true;
        }
        else {
          this.el.$css("float", "right");
          this.el.$css("max-width", "220px");
          this.el.$css("min-width", "130px");
        }
      }
      var isChat = window.location.hash.indexOf('#chat') == 0; 
      var mainGroupArr = mainGroup &&  mainGroup.length ? mainGroup[0]['propertyGroupList'].splitAndTrim(',') : null;
      var propGroups = this.isMainGroup &&  mainGroup ?  mainGroup : U.getArrayOfPropertiesWith(meta, "propertyGroupList");
      
      propGroups = propGroups.sort(function(a, b) {return a.index < b.index});
      var backlinks = U.getBacklinks(meta);
      var displayInline = !this.isMainGroup && U.getPropertiesWith(this.vocModel.properties, [{name: "displayInline", value: true}, {name: "backLink"}]);
      if (displayInline && _.size(displayInline)) {
        this.stopListening(res, 'inlineList', this.update);
        this.listenTo(res, 'inlineList', this.update);
        if (_.size(res.inlineLists)) {
          // either all the lists will be on the resource (if it's being loaded from the server), in which case we either paint them in this render call or wait for the 'inlineList' event...
        }
        else {
          // ...or we have to fetch them separately, and once again, wait for the 'inlineList' event
          var self = this;
          var ranges = [];
          var inlineLists = {};
          _.each(displayInline, function(prop, name) {
            _.pushUniq(ranges, U.getTypeUri(prop.range));
          });
          
          Voc.getModels(ranges).done(function() {
            _.each(displayInline, function(prop, name) {
              var params = U.getListParams(res, prop);
              var type = U.getTypeUri(prop.range);
              var listModel = U.getModel(type);
              var inlineList = C.getResourceList(listModel, U.getQueryString(params, true));
              var firstTime = true;
              if (inlineList)
                return;
              
              function onsuccess() {
                var currentlyInlined =  res.inlineLists || {};
                if (firstTime) {
                  firstTime = false;
                  _.each(['updated', 'added', 'reset', 'removed'], function(event) {
                    self.stopListening(inlineList, event);
                    self.listenTo(inlineList, event, function(resources) {
                      resources = U.isCollection(resources) ? resources.models : U.isModel(resources) ? [resources] : resources;
                      var options = {
                        force: true
                      };
                      
                      options[event] = true;
                      self.refresh(resources, options);
                    });
                  });
                }
                
                if (!inlineList.isFetching() && !inlineList.isOutOfResources()) // get them all!
                  inlineList.getNextPage(fetchOptions);

                if (!res._settingInlineList && !currentlyInlined[name])
                  res.setInlineList(name, inlineList);
              };
              
              var fetchOptions = {
                success: onsuccess
              };
              
              inlineList = new ResourceList(null, {model: listModel, params: params});
              inlineList.fetch(fetchOptions);
              
              self.listenTo(Events, 'preparingModelForDestruction.' + inlineList.cid, function() {
                Events.trigger('saveModelFromUntimelyDeath.' + inlineList.cid);
              });
            });
          });
        }
      }
      
      var backlinksWithCount = backlinks ? U.getPropertiesWith(backlinks, "count") : null;
      
      var role = U.getUserRole();
      var displayedProps = {};
      var idx = 0;
      var groupNameDisplayed;
      var maxChars = 30;
      var first;

      var currentAppProps = U.getCurrentAppProps(meta);
      var title = U.getDisplayName(res);
      var color = ['rgba(156, 156, 255, 0.7)', 'rgba(255, 0, 255, 0.7)', 'rgba(32, 173, 176, 0.7)', 'rgba(255, 255, 0, 0.7)', 'rgba(255, 156, 156, 0.7)', 'purple'];
      var borderColor = ['rgba(156, 156, 255, 1)', 'rgba(255, 0, 255, 1)','rgba(32, 173, 176, 1)', 'rgba(255, 255, 0, 1)', 'rgba(255, 156, 156, 1)', 'purple'];
      var color1 = ['yellow', 'rgba(156, 156, 255, 0.8)', '#9999ff', 'magenta', 'lightseagreen', '#ff9999', 'purple'];
      var colorIdx = 0;
//      if (title)
//        title = ' for ' + title;

      _.each(propGroups, function(gProp) {
        var list = _.map(gProp.propertyGroupList.split(','), function(p) {return p.trim()});
        _.each(list, function(p) {
          var prop = meta[p];
          if (prop && prop.mainGroup)
            delete displayInline[p];
        }.bind(this));
      });

      if (!this.isMainGroup && _.size(res.inlineLists)) {
        _.each(res.inlineLists, function(list, name) {
          if (!list.size())
            return;
          
          var listVocModel = list.vocModel;
          var listMeta = listVocModel.properties;
          var isCancelable = U.isA(listVocModel, 'Cancellable');
          var canceledProp;
          if (isCancelable) {
            canceledProp = listMeta[U.getCloneOf(listVocModel, 'Cancellable.cancelled')[0]];
            isCancelable = canceledProp && U.isPropEditable(list.models[0], canceledProp, role);
          }

          var prop = meta[name];
          var propDisplayName = U.getPropDisplayName(prop);
          U.addToFrag(frag, this.propGroupsDividerTemplate({value: propDisplayName}));
          list.each(function(iRes) {
            var params = {
              viewId: this.cid,
              comment: iRes.comment, 
              _problematic: iRes.get('_error'),
              name: U.getDisplayName(iRes),
              backlink: name
            };
            
            var grid = U.getCols(iRes, 'grid', true);
            if (U.isA(listVocModel, 'Intersection')) {
              var oH, oW, ab;
              var a = U.getCloneOf(listVocModel, 'Intersection.a')[0];
              var b = U.getCloneOf(listVocModel, 'Intersection.b')[0];
              if (a == meta[name].backLink) {
                var n = iRes.get(b + '.displayName');
                if (n)
                  params.name = n;
                params.img = iRes.get('bThumb');
                params.imageProperty = 'bThumb';
                oW = 'bOriginalWidth';
                oH = 'bOriginalHeight';
                ab = b;
              }
              else {
                var n = iRes.get(a + '.displayName');
                if (n)
                  params.name = n;
                params.img = iRes.get('aThumb');
                params.imageProperty = 'aThumb';
                oW = 'aOriginalWidth';
                oH = 'aOriginalHeight';
                ab = a;
              }
              if (grid) {
                var gridCols = '';
                var aLabel = listMeta[a].displayName;
                var bLabel = listMeta[b].displayName;
                for (var row in grid) {
                  if (row != aLabel  &&  row != bLabel)
                    gridCols += grid[row].value;
                }
                if (gridCols)
                  params.gridCols = gridCols;
              }
              var w = iRes.get(oW),
                  h = iRes.get(oH);
              if (w  &&  h) {
                var range = listMeta[ab].range;
                var rm = U.getModel(U.getLongUri1(range));
                if (U.isA(rm, 'ImageResource')) {
                  var rmeta = rm.properties;
                  var imgP = imageP  &&  imageP.indexOf('Featured') == -1 ? U.getCloneOf(rm, 'ImageResource.smallImage') : U.getCloneOf(rm, 'ImageResource.mediumImage'); 
                  maxDim = imgP  &&  rmeta[imgP].maxImageDimension;
                  var clip = U.clipToFrame(80, 80, w, h, maxDim);
                  if (clip) {
                    params.top = clip.clip_top;
                    params.right = clip.clip_right;
                    params.bottom = clip.clip_bottom;
                    params.left = clip.clip_left;
                    params.height = json.top + json.bottom;
                  }
                  else {
                    var dim = U.fitToFrame(80, 80, w / h);
                    params.width = dim.w;
                    params.height = dim.h;
                    params.top = dim.y; //w > h ? dim.y : dim.y + (atts[oH] - atts[oW]) / 2;
                    params.right = dim.w - dim.x;
                    params.bottom = dim.h - dim.y; ////w > h ? dim.h - dim.y : dim.h - dim.y + (atts[oH] - atts[oW]) / 2;
                    params.left = dim.x;
                  }
                }
              }

            }
            else {
              if (grid) {
                var gridCols = '';
                for (var row in grid) 
                  gridCols += grid[row].value;
                
                params.gridCols = gridCols;
              }
              if (U.isA(listVocModel, 'ImageResource')) {
                var imgProp = U.getImageProperty(iRes);
                if (imgProp) {
                  var img = iRes.get(imgProp);
                  if (img) {
                    params.imageProperty = imgProp;
                    params.img = img;
                    var oW = U.getCloneOf(listVocModel, 'ImageResource.originalWidth');
                    var oH;
                    if (oW)
                      oH = U.getCloneOf(listVocModel, 'ImageResource.originalHeight');
                    
                    if (oW  &&  oH  &&  (typeof iRes.get(oW) != 'undefined' &&  typeof  iRes.get(oH) != 'undefined')) {
                      
//                      this.$el.addClass("image_fitted");
//                      
                      var dim = U.fitToFrame(80, 80, iRes.get(oW) / iRes.get(oH));
                      params.width = dim.w;
                      params.height = dim.h;
                      params.top = oW > oH ? dim.y : dim.y + (iRes.get(oH) - iRes.get(oW)) / 2;
                      params.right = dim.w - dim.x;
                      params.bottom = oW > oH ? dim.h - dim.y : dim.h - dim.y + (iRes.get(oH) - iRes.get(oW)) / 2;
                      params.left = dim.x;
                    }
                  }
                }
              }
            }

            if (isCancelable) {
              params.Cancelable = {
                canceled: iRes.get(canceledProp.shortName)
              }
            }
            
//            var action = listVocModel.adapter || U.isAssignableFrom(listVocModel, 'Intersection') ? 'view' : 'edit';
            var action = (U.isAssignableFrom(listVocModel, 'WebProperty')  ||  U.isAssignableFrom(listVocModel, 'commerce/trading/Notification')  ||  U.isAssignableFrom(listVocModel, 'commerce/trading/Rule')) ? 'edit' : 'view';
            params.href = U.makePageUrl(action, iRes.getUri(), {$title: params.name});
            params.resource = iRes;
            U.addToFrag(frag, this.inlineListItemTemplate(params));
            displayedProps[name] = true;
            this.stopListening(iRes, 'change', this.update);
            this.listenTo(iRes, 'change', this.update);
          }.bind(this));
        }.bind(this));
      }
      
      if (propGroups.length) {
        var tmpl_data = {};
        for (var i = 0; i < propGroups.length; i++) {
          var grMeta = propGroups[i];
          if (!this.isMainGroup  &&  grMeta.mainGroup)
            continue;
          var avoidDisplaying = grMeta.avoidDisplayingInView;
           
          var pgName = U.getPropDisplayName(grMeta);
          var props = grMeta.propertyGroupList.split(",");
          groupNameDisplayed = false;
          for (var j = 0; j < props.length; j++) {
            var p = props[j].trim();
            if (!/^[a-zA-Z]/.test(p))
              continue;
            
            var prop = meta[p];
            if (displayedProps[p] || !_.has(backlinks, p))
              continue;
            if (prop['app']  &&  (!currentAppProps  || $.inArray(p, currentAppProps) == -1))
              continue;
            if (!prop  ||  prop.mainBackLink  ||  (!_.has(atts, p)  &&  typeof prop.readOnly != 'undefined'))
              continue;
            if (!U.isPropVisible(res, prop))
              continue;
  
            displayedProps[p] = true;
            if (avoidDisplaying)
              continue;
            var n = U.getPropDisplayName(prop);
            var range = prop.range; 
            var isPropEditable = U.isPropEditable(res, prop, role);
            
            var doShow = false;
            var cnt;
            var pValue = this.resource.get(p); //json[p];
            if (!_.has(atts, p)) { 
              var count = pValue ? pValue.count : 0;
              cnt = count > 0 ? count : 0;
              
              if (cnt != 0 || isPropEditable)
                doShow = true;
//              U.addToFrag(frag, this.cpTemplateNoValue({name: n}));
            }
            else {
              var v = pValue.value;
              cnt = pValue.count;
              if (typeof cnt == 'undefined'  ||  !cnt)
                cnt = 0;
              if (cnt != 0 ||  isPropEditable)
                doShow = true;
//                U.addToFrag(frag, this.cpTemplateNoValue({name: n}));
//              else
            }
            
            if (!doShow) 
              continue;
            
            if (!this.isMainGroup  &&  !groupNameDisplayed) {
              U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
              groupNameDisplayed = true;
            }
            
//              var uri = U.getShortUri(res.getUri(), vocModel); 
            var uri = res.getUri();
            var t = U.makeHeaderTitle(title, n);
            if (colorIdx == color.length) 
              colorIdx = 0;
            var icon;
            if (prop.displayInline) {
              cnt = 0;
              icon = "ui-icon-plus-sign";
            }
            else
              icon = prop['icon'];
            
            tmpl_data.prop = prop;
            tmpl_data.icon = null;
            tmpl_data.range = range;
            tmpl_data.backlink = prop.backLink;
            tmpl_data.shortName = p;
            tmpl_data.name = n;
            tmpl_data.value = cnt;
            tmpl_data._uri = uri;
            tmpl_data.title = t;
            tmpl_data.comment = prop.comment;
            tmpl_data.borderColor = borderColor[colorIdx];
            tmpl_data.color = color[colorIdx];
            tmpl_data.chat = isChat;
            var bl = prop.backLinkSortDescending;
            if (bl) {
              tmpl_data['$order'] = bl;
              tmpl_data['$asc'] = 0;
            }
//              var common = {range: range, backlink: prop.backLink, shortName: p, name: n, value: cnt, _uri: uri, title: t, comment: prop.comment, borderColor: borderColor[colorIdx], color: color[colorIdx], chat: isChat};
            colorIdx++;
            if (this.isMainGroup) {
//                if (!icon)
//                  icon = 'ui-icon-star-empty';
              tmpl_data.icon = icon;
              if (isHorizontal)
                U.addToFrag(frag, this.cpMainGroupTemplateH(tmpl_data));
              else
                U.addToFrag(frag, this.cpMainGroupTemplate(tmpl_data));
            }
            else {
              if (isPropEditable)
                U.addToFrag(frag, this.cpTemplate(tmpl_data));
              else
                U.addToFrag(frag, this.cpTemplateNoAdd(tmpl_data));                
            }
//              if (isPropEditable)
//                U.addToFrag(frag, this.cpTemplate({propName: p, name: n, value: cnt, _uri: res.getUri()}));
//              else
//                U.addToFrag(frag, this.cpTemplateNoAdd({propName: p, name: n, value: cnt, _uri: res.getUri()}));
          }
        }
      }
      if (!this.isMainGroup) {
        groupNameDisplayed = false;
        var tmpl_data = {};
        var cnt = 0;        
        for (var p in meta) {
          cnt++;
          if (!/^[a-zA-Z]/.test(p))
            continue;
          
          var prop = meta[p];
          if (_.has(displayedProps, p))  
            continue;
          if (prop['app']  &&  (!currentAppProps  || $.inArray(p, currentAppProps) == -1))
            continue;
          if (mainGroup  &&  $.inArray(p, mainGroupArr) != -1)
            continue;
          var count = -1;
          if (!_.has(backlinks, p)) {
            var idx;
            if (p.length <= 5  ||  p.indexOf('Count') != p.length - 5) 
              continue;
            
            var pp = p.substring(0, p.length - 5);
            if (_.has(displayedProps, pp))  
              continue;
            
            var pMeta = meta[pp];
            if (!pMeta  ||  !pMeta.backLink || atts[pp]) 
              continue;
            count = atts[p];
//            p = pp;
            prop = pMeta;
            json[pp] = {count: count};
            p = pp;
          }
          
          hasValue = _.has(atts, p);
          if (count == -1) {
            if (!prop)
              continue;
            if (!_.has(atts, p)) {
              if (typeof prop.readOnly != 'undefined') {
    //            delete json[p];
                continue;
              }
            }
            else {
              if (atts[p].count)
                count = atts[p].count;
              else if (prop.range.indexOf('/voc/dev/') == -1)
                continue;
            }
          }
                
          if (!U.isPropVisible(res, prop))
            continue;
    
          var isPropEditable = U.isPropEditable(res, prop, role);
          var doShow = false;
          var n = U.getPropDisplayName(prop);
          var cnt;
          var pValue = atts[p];
          if (!hasValue) {
            cnt = count > 0 ? count : 0;
            if (cnt != 0 || isPropEditable)
              doShow = true;
          }
          else {
            var v = pValue.value;
            cnt = pValue.count;
            if (typeof cnt == 'undefined'  ||  !cnt)
              cnt = 0;
            if (isPropEditable  ||  cnt != 0)
              doShow = true;
          }
          if (doShow) {
            displayedProps[p] = true;
  //          if (isPropEditable)
  //            U.addToFrag(frag, this.cpTemplate({propName: p, name: n, value: cnt, _uri: res.getUri()}));
  //          else
  //            U.addToFrag(frag, this.cpTemplateNoAdd({propName: p, name: n, value: cnt, _uri: res.getUri()}));
  //          var range = U.getClassName(prop.range);
            var range = prop.range;
  //          var uri = U.getShortUri(res.getUri(), vocModel); 
            var uri = res.getUri();
            var t = title + "&nbsp;&nbsp;<span class='ui-icon-caret-right'></span>&nbsp;&nbsp;" + n;
            tmpl_data.prop = prop;
            tmpl_data.range = range;
            tmpl_data.shortName = p;
            tmpl_data.backlink = prop.backLink;
            tmpl_data.value = cnt;
            tmpl_data._uri = uri;
            tmpl_data.title = t;
            tmpl_data.comment = prop.comment;
            tmpl_data.name = n;
            tmpl_data.prop = prop;
              
            var bl = prop.backLinkSortDescending;
            if (bl) {
              tmpl_data['$order'] = bl;
              tmpl_data['$asc'] = 0;
            }
//            var common = {range: range, shortName: p, backlink: prop.backLink, value: cnt, _uri: uri, title: t, comment: comment, name: n};
            if (isPropEditable)
              U.addToFrag(frag, this.cpTemplate(tmpl_data));
            else
              U.addToFrag(frag, this.cpTemplateNoAdd(tmpl_data));            
          }
        }
      }
      
//      if (this.hashParams.$tour) {
//        var s = this.$el.find(this.hashParams.$tourS + '=' + this.hashParams.$tourV);
//        s.css('class', 'hint--left');
//        s.css('class', 'hint--always');
//        s.css('data-hint', this.hashParams.$tourM);
//      }

//      var self = this;
//      var problems = $('.problematic');
//      problems.each(function() {
//        $(this).css('color', '#f66');
//        if (!this.innerHTML.startsWith('<i'))
//          this.innerHTML = '<i class="ui-icon-ban-circle"></i> ' + this.innerHTML;
//      });
      
      if (G.isJQM()) {
        this.$el.trigger('create');
//        if (this.el.$hasClass('ui-listview'))  //this.rendered &&
//          this.$el.listview('refresh');
      }

      Q.write(function() {
        this.el.$html(frag);
//        this.addToWorld(null, false);
//        this.addToWorld({
//          slidingWindow: true
//        }, false);
        this.finish();
//        Q.read(function() {
//          var self = this,
//              id;
//          
//          this.propBricks = this.$('[data-propname],header').$map(function(el) {
//            id = el.dataset.propname || el.innerText;
//            Physics.here.addBody(el, id);
//            return self.buildBrick({
//              _id: id,
//              el: el
//            });            
//          });
//          
//          this.addBricksToWorld(this.propBricks);
//        }, this);
      }, this);
      
      return this;
    }
  }, {
    displayName: 'ControlPanel'
  });
});
