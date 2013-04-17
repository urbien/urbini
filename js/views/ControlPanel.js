//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'events', 
  'utils',
  'views/BasicView',
  'vocManager',
  'collections/ResourceList',
  'cache'
], function(G, $, _, Events, U, BasicView, Voc, ResourceList, C) {
  return BasicView.extend({
    tagName: "tr",
    initialize: function(options) {
      _.bindAll(this, 'render', 'refresh', 'add'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate('propGroupsDividerTemplate', 'propGroupsDividerTemplate', this.vocModel.type);
      this.makeTemplate('inlineListItemTemplate', 'inlineListItemTemplate', this.vocModel.type);
      this.makeTemplate('cpTemplate', 'cpTemplate', this.vocModel.type);
      this.makeTemplate('cpMainGroupTemplate', 'cpMainGroupTemplate', this.vocModel.type);
      this.makeTemplate('cpMainGroupTemplateH', 'cpMainGroupTemplateH', this.vocModel.type);
      this.makeTemplate('cpTemplateNoAdd', 'cpTemplateNoAdd', this.vocModel.type);
      this.resource.on('change', this.refresh, this);
      this.isMainGroup = options.isMainGroup;
//      this.resource.on('inlineList', this.setInlineList, this);
  //    Globals.Events.on('refresh', this.refresh);
      return this;
    },
    events: {
      'click a[data-shortName]': 'add'
//        ,
//      'click': 'click'
    },
    add: function(e) {
      var t = e.target;
      while (t && t.tagName != 'A') {
        t = t.parentNode;
      }
      
      if (!t)
        return;
      
      Events.stopEvent(e);
      var shortName = t.dataset.shortname;
      var prop = this.vocModel.properties[shortName];
      var params = {
        '$backLink': prop.backLink,
        '-makeId': G.nextId(),
        '$title': t.dataset.title
      };

      params[prop.backLink] = this.resource.getUri();
      this.router.navigate('make/{0}?{1}'.format(encodeURIComponent(prop.range), $.param(params)), {trigger: true});
      G.log(this.TAG, 'add', 'user wants to add to backlink');
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
      if (!this.$el.hasClass('ui-listview'))
        this.$el.trigger('create');
      else {
        this.$el.trigger('create');
        this.$el.listview('refresh');
      }
    },
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
      if (this.isMainGroup  &&  !mainGroup)
        return;
      var isHorizontal;      
      if (this.isMainGroup) {
        if (!U.isA(this.vocModel, 'ImageResource')  &&  !U.isA(this.vocModel, 'Intersection')) {
          this.$el.css("float", "left");
          this.$el.css("width", "100%");
          isHorizontal = true;
        }
        else {
          this.$el.css("float", "right");
          this.$el.css("width", "35%");
          this.$el.css("min-width", "130");
        }
      }
      
      var mainGroupArr = mainGroup &&  mainGroup.length ? mainGroup[0]['propertyGroupList'].replace(/\s/g, '').split(",") : null;
      var propGroups = this.isMainGroup &&  mainGroup ?  mainGroup : U.getArrayOfPropertiesWith(meta, "propertyGroupList");
      
      propGroups = propGroups.sort(function(a, b) {return a.index < b.index});
      var backlinks = U.getBacklinks(meta);
      var displayInline = !this.isMainGroup && U.getPropertiesWith(this.vocModel.properties, [{name: "displayInline", value: true}, {name: "backLink"}]);
      if (displayInline) {
        res.off('inlineList', this.refreshOrRender, this);
        res.on('inlineList', this.refreshOrRender, this);
        if (_.size(res.inlineLists)) {
          // either all the lists will be on the resource (if it's being loaded from the server), in which case we either paint them in this render call or wait for the 'inlineList' event...
        }
        else {
          // ...or we have to fetch them separately, and once again, wait for the 'inlineList' event
          var self = this;
          var ranges = [];
          var inlineLists = {};
          _.each(displayInline, function(prop, name) {
            U.pushUniq(ranges, U.getTypeUri(prop.range));
          });
          
          Voc.getModels(ranges).done(function() {
            _.each(displayInline, function(prop, name) {
              var params = U.getListParams(res, prop);
              var type = U.getTypeUri(prop.range);
              var inlineList = C.getResourceList(type, $.param(params));
              if (!inlineList) {
                inlineList = new ResourceList(null, {model: U.getModel(type), params: params});
                inlineList.fetch({
                  success: function() {
//                    if (inlineList.size()) {
//                      res.setInlineList(name, inlineList);
//                    }
                    
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
      var color = ['rgba(156, 156, 255, 0.8)', 'rgba(255, 0, 255, 0.8)', 'rgba(32, 173, 176, 0.8)', 'rgba(255, 255, 0, 0.8)', 'rgba(255, 156, 156, 0.8)', 'purple'];
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
            U.addToFrag(frag, this.inlineListItemTemplate({name: U.getDisplayName(iRes), _uri: iRes.getUri(), comment: iRes.comment, _problematic: iRes.get('_error') }));
            displayedProps[name] = true;
            iRes.off('change', this.refreshOrRender, this);
            iRes.on('change', this.refreshOrRender, this);
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
            if (prop['app']  &&  (!currentAppProps  || !currentAppProps[p]))
              continue;
            if (!prop  ||  (!_.has(json, p)  &&  typeof prop.readOnly != 'undefined')) {
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
              var common = {range: range, backlink: prop.backLink, name: n, value: cnt, _uri: uri, title: t, comment: prop.comment, color: color[colorIdx++]};
              if (this.isMainGroup) {
                if (!icon)
                  icon = 'ui-icon-star-empty';
                
                if (isHorizontal)
                  U.addToFrag(frag, this.cpMainGroupTemplateH(_.extend({shortName: p, icon: icon}, common)));
                else
                  U.addToFrag(frag, this.cpMainGroupTemplate(_.extend({shortName: p, icon: icon}, common)));
              }
              else {
                if (isPropEditable)
                  U.addToFrag(frag, this.cpTemplate(_.extend({shortName: p}, common)));
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
          if (prop['app']  &&  (!currentAppProps  || !currentAppProps[p]))
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
            var common = {range: range, backlink: prop.backLink, value: cnt, _uri: uri, title: t, comment: comment, name: n};
            if (isPropEditable)
              U.addToFrag(frag, this.cpTemplate(_.extend({shortName: p}, common)));
            else
              U.addToFrag(frag, this.cpTemplateNoAdd(common));            
          }
        }
      }
      
      this.$el.html(frag);
      
//      var self = this;
//      var problems = $('.problematic');
//      problems.each(function() {
//        $(this).css('color', '#f66');
//        if (!this.innerHTML.startsWith('<i'))
//          this.innerHTML = '<i class="ui-icon-ban-circle"></i> ' + this.innerHTML;
//      });
      
      return this;
    }
  }, {
    displayName: 'ControlPanel'
  });
});
