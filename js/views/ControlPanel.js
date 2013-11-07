//'use strict';
define('views/ControlPanel', [
  'globals',
  'underscore', 
  'events', 
  'utils',
  'views/BasicView',
  'vocManager',
  'collections/ResourceList',
  'cache'
], function(G, _, Events, U, BasicView, Voc, ResourceList, C) {
  return BasicView.extend({
    tagName: "tr",
    initialize: function(options) {
      _.bindAll(this, 'render', 'refresh', 'add', 'update'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      var type = this.vocModel.type;
      this.makeTemplate('propGroupsDividerTemplate', 'propGroupsDividerTemplate', type);
      this.makeTemplate('inlineListItemTemplate', 'inlineListItemTemplate', type);
//      this.makeTemplate('comment-item', 'commentItemTemplate', type);
      this.makeTemplate('cpTemplate', 'cpTemplate', type);
      this.makeTemplate('cpMainGroupTemplate', 'cpMainGroupTemplate', type);
      this.makeTemplate('cpMainGroupTemplateH', 'cpMainGroupTemplateH', type);
      this.makeTemplate('cpTemplateNoAdd', 'cpTemplateNoAdd', type);
      this.listenTo(this.resource, 'change', this.refresh);
      this.isMainGroup = options.isMainGroup;
      this.dontStyle = this.isMainGroup && options.dontStyle
//      this.resource.on('inlineList', this.setInlineList, this);
  //    Globals.Events.on('refresh', this.refresh);
      return this;
    },
    events: {
      'click a[data-shortName]': 'add'
//        ,
//      'click': 'click'
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
    _addNoIntersection: function(target, prop) {
      var params = {
        '$backLink': prop.backLink,
        '-makeId': G.nextId(),
        '$title': target.dataset.title
      };

      params[prop.backLink] = this.resource.getUri();
      
      this.router.navigate(U.makeMobileUrl('make', prop.range, params), {trigger: true});
      this.log('add', 'user wants to add to backlink');
    },
    
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
      
      e.preventDefault();
      if ($(t).parents('.__dragged__').length)
        return;
      
      var self = this,       
          shortName = t.dataset.shortname,
          prop = this.vocModel.properties[shortName],
          setLinkTo = prop.setLinkTo;

//      this.log("Recording step for tour: selector = 'data-shortname'; value = '" + shortName + "'");
      if (setLinkTo) {
        shortName = setLinkTo;
        prop = this.vocModel.properties[shortName];
      }
      
//      G.log(this.TAG, "Recording step for tour: selector = 'data-shortname'; value = '" + shortName + "'");

      Voc.getModels(prop.range).done(function() {
        var pModel = U.getModel(prop.range);
        function noIntersection(prop) {
          var params = {
            '$backLink': prop.backLink,
            '$title': t.dataset.title
          };
    
          params[prop.backLink] = self.resource.getUri();
          if (setLinkTo)  
            Events.trigger('navigate', U.makeMobileUrl('list', prop.range, params), {trigger: true});
          else {
            params['-makeId'] = G.nextId();
            Events.trigger('navigate', U.makeMobileUrl('make', prop.range, params), {trigger: true});
          }
          self.log('add', 'user wants to add to backlink');
        };

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
      var res = this.resource;
      var vocModel = this.vocModel;
      var type = res.type;
      var meta = vocModel.properties;
      if (!meta)
        return this;
      
      var json = res.toJSON();
      var frag = document.createDocumentFragment();
  
      var mainGroup = U.getArrayOfPropertiesWith(meta, "mainGroup");
      if (this.isMainGroup  &&  !mainGroup.length)
        return;
      
      var isHorizontal;      
      if (this.isMainGroup && !this.dontStyle) {
        if (!U.isA(this.vocModel, 'ImageResource')  &&  !U.isA(this.vocModel, 'Intersection')) {
          this.$el.css("float", "left");
          this.$el.css("width", "100%");
          isHorizontal = true;
        }
        else {
          this.$el.css("float", "right");
          this.$el.css("max-width", "220px");
          this.$el.css("min-width", "130px");
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
              if (!inlineList) {
                inlineList = new ResourceList(null, {model: listModel, params: params});
                inlineList.fetch({
                  success: function() {
                    var currentlyInlined =  res.inlineLists || {};
                    if (inlineList.size() && !res._settingInlineList && !currentlyInlined[name]) {
                      res.setInlineList(name, inlineList);
                    }
                    
                    _.each(['updated', 'added', 'reset'], function(event) {
                      self.stopListening(inlineList, event);
                      self.listenTo(inlineList, event, function(resources) {
                        resources = U.isCollection(resources) ? resources.models : U.isModel(resources) ? [resources] : resources;
                        var options = {};
                        options[event] = true;
                        self.refresh(resources, options);
                      });
                    });
                  }
                });
                
                self.listenTo(Events, 'preparingModelForDestruction.' + inlineList.cid, function() {
                  Events.trigger('saveModelFromUntimelyDeath.' + inlineList.cid);
                });
              }
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
          var prop = meta[name];
          var propDisplayName = U.getPropDisplayName(prop);
          U.addToFrag(frag, this.propGroupsDividerTemplate({value: propDisplayName}));
          list.each(function(iRes) {
            var params = {
              viewId: this.cid,
              comment: iRes.comment, 
              _problematic: iRes.get('_error'),
              name: U.getDisplayName(iRes)
            };
            
            var grid = U.getCols(iRes, 'grid', true);
            if (U.isA(iRes.vocModel, 'Intersection')) {  
              var a = U.getCloneOf(iRes.vocModel, 'Intersection.a')[0];
              var b = U.getCloneOf(iRes.vocModel, 'Intersection.b')[0];
              if (a == meta[name].backLink) {
                var n = iRes.get(b + '.displayName');
                if (n)
                  params.name = n;
                params.img = iRes.get('bThumb');
              }
              else {
                var n = iRes.get(a + '.displayName');
                if (n)
                  params.name = n;
                params.img = iRes.get('aThumb');
              }
              if (grid) {
                var gridCols = '';
                var aLabel = iRes.vocModel.properties[a].displayName;
                var bLabel = iRes.vocModel.properties[b].displayName;
                for (var row in grid) {
                  if (row != aLabel  &&  row != bLabel)
                    gridCols += grid[row].value;
                }
                if (gridCols)
                  params.gridCols = gridCols;
              }
            }
            else {
              if (grid) {
                var gridCols = '';
                for (var row in grid) 
                  gridCols += grid[row].value;
                
                params.gridCols = gridCols;
              }
              if (U.isA(iRes.vocModel, 'ImageResource')) {
                var imgProp = U.getImageProperty(iRes);
                if (imgProp) {
                  var img = iRes.get(imgProp);
                  if (img) {
                    params.imageProperty = imgProp;
                    params.img = img;
                    var oW = U.getCloneOf(iRes.vocModel, 'ImageResource.originalWidth');
                    var oH;
                    if (oW)
                      oH = U.getCloneOf(iRes.vocModel, 'ImageResource.originalHeight');
                    
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

            var action = iRes.vocModel.adapter || U.isAssignableFrom(iRes.vocModel, 'Intersection') ? 'view' : 'edit';
            params._uri = U.makePageUrl(action, iRes.getUri(), {title: params.name});
            params.resource = iRes;
            U.addToFrag(frag, this.inlineListItemTemplate(params));
            displayedProps[name] = true;
            this.stopListening(iRes, 'change', this.update);
            this.listenTo(iRes, 'change', this.update);
          }.bind(this));
        }.bind(this));
      }
      
      if (propGroups.length) {
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
            if (!prop  ||  prop.mainBackLink  ||  (!_.has(json, p)  &&  typeof prop.readOnly != 'undefined')) {
//              delete json[p];
              continue;
            }
                  
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
            var pValue = json[p];
            if (!_.has(json, p)) { 
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
            
            if (doShow) {
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
              var common = {range: range, backlink: prop.backLink, shortName: p, name: n, value: cnt, _uri: uri, title: t, comment: prop.comment, borderColor: borderColor[colorIdx], color: color[colorIdx], chat: isChat};
              colorIdx++;
              if (this.isMainGroup) {
//                if (!icon)
//                  icon = 'ui-icon-star-empty';
                
                if (isHorizontal)
                  U.addToFrag(frag, this.cpMainGroupTemplateH(_.extend({icon: icon}, common)));
                else
                  U.addToFrag(frag, this.cpMainGroupTemplate(_.extend({icon: icon}, common)));
              }
              else {
                if (isPropEditable)
                  U.addToFrag(frag, this.cpTemplate(common));
                else
                  U.addToFrag(frag, this.cpTemplateNoAdd(common));                
              }
//              if (isPropEditable)
//                U.addToFrag(frag, this.cpTemplate({propName: p, name: n, value: cnt, _uri: res.getUri()}));
//              else
//                U.addToFrag(frag, this.cpTemplateNoAdd({propName: p, name: n, value: cnt, _uri: res.getUri()}));
            }
          }
        }
      }
      if (!this.isMainGroup) {
        groupNameDisplayed = false;
        var tmpl_data;
        for (var p in meta) {
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
            var pMeta = meta[pp];
            if (!pMeta  ||  !pMeta.backLink || json[pp]) 
              continue;
            count = json[p];
            p = pp;
            prop = pMeta;
            tmpl_data = _.extend(json, {p: {count: count}});
          }
          if (count == -1) {
            if (!prop  ||  (!_.has(json, p)  &&  typeof prop.readOnly != 'undefined')) {
  //            delete json[p];
              continue;
            }
          }
                
          if (!U.isPropVisible(res, prop))
            continue;
    
          var isPropEditable = U.isPropEditable(res, prop, role);
          var doShow = false;
          var n = U.getPropDisplayName(prop);
          var cnt;
          var pValue = json[p];
          if (!_.has(json,p)) {
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
  //          if (isPropEditable)
  //            U.addToFrag(frag, this.cpTemplate({propName: p, name: n, value: cnt, _uri: res.getUri()}));
  //          else
  //            U.addToFrag(frag, this.cpTemplateNoAdd({propName: p, name: n, value: cnt, _uri: res.getUri()}));
  //          var range = U.getClassName(prop.range);
            var range = prop.range;
  //          var uri = U.getShortUri(res.getUri(), vocModel); 
            var uri = res.getUri();
            var t = title + "&nbsp;&nbsp;<span class='ui-icon-caret-right'></span>&nbsp;&nbsp;" + n;
            var comment = prop.comment;
            var common = {range: range, shortName: p, backlink: prop.backLink, value: cnt, _uri: uri, title: t, comment: comment, name: n};
            if (isPropEditable)
              U.addToFrag(frag, this.cpTemplate(common));
            else
              U.addToFrag(frag, this.cpTemplateNoAdd(common));            
          }
        }
      }
      this.$el.html(frag);
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
      
      this.$el.trigger('create');
      if (this.rendered && this.$el.hasClass('ui-listview'))
        this.$el.listview('refresh');

      return this;
    }
  }, {
    displayName: 'ControlPanel'
  });
});
