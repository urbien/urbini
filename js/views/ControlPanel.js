//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'events', 
  'utils',
  'views/BasicView'
], function(G, $, _, Events, U, BasicView) {
  return BasicView.extend({
    tagName: "tr",
    initialize: function(options) {
      _.bindAll(this, 'render', 'refresh', 'add'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      this.propGroupsDividerTemplate = this.makeTemplate('propGroupsDividerTemplate');
      this.cpTemplate = this.makeTemplate('cpTemplate');
      this.cpMainGroupTemplate = this.makeTemplate('cpMainGroupTemplate');
      this.cpTemplateNoAdd = this.makeTemplate('cpTemplateNoAdd');
      this.resource.on('change', this.refresh, this);
      this.TAG = 'ControlPanel';
      this.isMainGroup = options.isMainGroup;
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
    refresh: function() {
      var collection, modified;
      if (U.isCollection(arguments[0])) {
        collection = arguments[0];
        modified = arguments[1];
        if (collection != this.resource.collection || !_.contains(modified, this.resource.get('_uri')))
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
//    tap: Events.defaultTapHandler,  
//    click: Events.defaultClickHandler,
    render: function(options) {
      G.log(this.TAG, "render");
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
      var propGroups = this.isMainGroup &&  mainGroup ?  mainGroup : U.getArrayOfPropertiesWith(meta, "propertyGroupList");
      
      propGroups = propGroups.sort(function(a, b) {return a.index < b.index});
      var backlinks = U.getPropertiesWith(meta, "backLink");
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
      if (propGroups.length) {
        for (var i = 0; i < propGroups.length; i++) {
          var grMeta = propGroups[i];
//          if (mainGroup  &&  !isMainGroup  &&  _.has(mainGroup, grMeta.shortName))
//            continue;
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
            var n = U.getPropDisplayName(prop);
            var range = prop.range; 
            var isPropEditable = U.isPropEditable(res, prop, role);
            
            var doShow = false;
            var cnt;
            if (!_.has(json, p)) { 
              cnt = count > 0 ? count : 0;
              
              if (cnt != 0 || isPropEditable)
                doShow = true;
//              U.addToFrag(frag, this.cpTemplateNoValue({name: n}));
            }
            else {
              var v = json[p].value;
              cnt = json[p].count;
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
              
//              var uri = U.getShortUri(res.get('_uri'), vocModel); 
              var uri = res.getUri();
              var t = U.makeHeaderTitle(title, n);
              if (colorIdx == color.length) 
                colorIdx = 0;
              var common = {range: range, backlink: prop.backLink, name: n, value: cnt, _uri: uri, title: t, comment: prop.comment, color: color[colorIdx++]};
              if (this.isMainGroup) 
                U.addToFrag(frag, this.cpMainGroupTemplate(_.extend({shortName: p, count: cnt}, common)));
              else {
                if (isPropEditable)
                  U.addToFrag(frag, this.cpTemplate(_.extend({shortName: p}, common)));
                else
                  U.addToFrag(frag, this.cpTemplateNoAdd(common));
              }
//              if (isPropEditable)
//                U.addToFrag(frag, this.cpTemplate({propName: p, name: n, value: cnt, _uri: res.get('_uri')}));
//              else
//                U.addToFrag(frag, this.cpTemplateNoAdd({propName: p, name: n, value: cnt, _uri: res.get('_uri')}));
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
          if (!_.has(json,p)) {
            cnt = count > 0 ? count : 0;
            if (cnt != 0 || isPropEditable)
              doShow = true;
          }
          else {
            var v = json[p].value;
            cnt = json[p].count;
            if (typeof cnt == 'undefined'  ||  !cnt)
              cnt = 0;
            if (isPropEditable  ||  cnt != 0)
              doShow = true;
          }
          if (doShow) {
  //          if (isPropEditable)
  //            U.addToFrag(frag, this.cpTemplate({propName: p, name: n, value: cnt, _uri: res.get('_uri')}));
  //          else
  //            U.addToFrag(frag, this.cpTemplateNoAdd({propName: p, name: n, value: cnt, _uri: res.get('_uri')}));
  //          var range = U.getClassName(prop.range);
            var range = prop.range;
  //          var uri = U.getShortUri(res.get('_uri'), vocModel); 
            var uri = res.getUri();
            var t = title + "&nbsp;&nbsp;<span class='ui-icon-caret-right'></span>&nbsp;&nbsp;" + n;
            var comment = prop.comment;
            if (isPropEditable)
              U.addToFrag(frag, this.cpTemplate({range: range, backlink: prop.backLink, shortName: p, name: n, value: cnt, _uri: uri, title: t, comment: comment}));
            else
              U.addToFrag(frag, this.cpTemplateNoAdd({range: range, backlink: prop.backLink, name: n, value: cnt, _uri: uri, title: t, comment: comment}));
          }
        }
      }
      if (!options || options.setHTML)
        this.$el.html(frag);
      
//      var self = this;  
      this.rendered = true;
      return this;
    }
  });
});
