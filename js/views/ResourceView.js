//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'events', 
  'utils',
  'views/BasicView'
], function(G, $, _, Events, U, BasicView) {
  var willShow = function(res, prop, role) {
    var p = prop.shortName;
    return p.charAt(0) != '_' && p != 'davDisplayName' && !prop.displayNameElm  &&  !prop.avoidDisplayingInView  &&  U.isPropVisible(res, prop, role);
  };

  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'refresh'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      _.each(['propRowTemplate', 'propRowTemplate2', 'propGroupsDividerTemplate'], function(t) {
        this.makeTemplate(t, t, this.vocModel.type, true);
      }.bind(this));
      
      this.resource.on('change', this.refresh, this);
      this.TAG = 'ResourceView';
      var uri = this.resource.getUri(), self = this;
      if (U.isTempUri(uri)) {
        Events.once('synced:' + uri, function(data) {
          if (self.isActive()) {
            var newUri = data._uri;
            self.router.navigate('view/' + encodeURIComponent(newUri), {trigger: false, replace: true});
          }
        });
      }

//      this.isTemplate = this.vocModel.type === G.commonTypes.Jst;
//      var readyDfd = $.Deferred(function(defer) {
//        if (this.isTemplate) {
//          U.require(['codemirrorHighlighting', 'codemirrorCss'], function() {
//            defer.resolve();
//          }, this);
//        }
//        else
//          defer.resolve();        
//      }.bind(this));
//      
//      this.ready = readyDfd.promise();      
      return this;
    },
    events: {
//      'click': 'click'
    },
    refresh: function(resource, options) {
      options = options || {};
      if (options.skipRefresh || options.fromDB)
        return;
      
      var res = this.resource;   
      
//      if (res.lastFetchOrigin === 'edit')
//        return;
      
      var collection, modified;
      if (U.isCollection(arguments[0])) {
        collection = arguments[0];
        modified = arguments[1];
        if (collection != res.collection || !_.contains(modified, res.getUri()))
          return this;
      }

      this.render();
    },
//    tap: Events.defaultTapHandler,  
//    click: Events.defaultClickHandler,
    
    render: function() {
      var args = arguments;
      if (!this.ready)
        return this.renderHelper.apply(this, args);
      
      this.ready.done(function() {
        this.renderHelper.apply(this, args);
        this.finish();
      }.bind(this));
    },
    
    renderHelper: function(options) {
      G.log(this.TAG, "render");

      var res = this.resource;
      var vocModel = this.vocModel;

      var params = U.getParamMap(window.location.hash);
      var isApp = U.isAssignableFrom(res, G.commonTypes.App);
      var isAbout = isApp  &&  !!params['$about']  &&  !!res.get('description');
      if (isAbout) {
        this.$el.removeClass('hidden');
        this.$el.html(res.get('description'));      
        this.$el.trigger('create');      
        this.rendered = true;
        return this;
      }
      
      var meta = vocModel.properties;
      var userRole = U.getUserRole();
      var json = res.toJSON();
      var frag = document.createDocumentFragment();

      var currentAppProps = U.getCurrentAppProps(meta);
      
      var propGroups = U.getPropertiesWith(meta, "propertyGroupList"); // last param specifies to return array
//      propGroups = propGroups.length ? propGroups : U.getPropertiesWith(vocModel.properties, "propertyGRoupsList", true);
      propGroups = _.sortBy(propGroups, function(pg) {
        return pg.index;
      });
      
      var backlinks = U.getPropertiesWith(meta, "backLink");
//      var backlinksWithCount = backlinks ? U.getPropertiesWith(backlinks, "count") : null;
      
      var displayedProps = {};
      var idx = 0;
      var groupNameDisplayed;
      var maxChars = 30;
      if (propGroups.length) {
        for (var i = 0; i < propGroups.length; i++) {
          var grMeta = propGroups[i];
          var pgName = U.getPropDisplayName(grMeta);
          var props = grMeta.propertyGroupList.split(",");
          groupNameDisplayed = false;
          for (var j = 0; j < props.length; j++) {
            var p = props[j].trim();
            if (!/^[a-zA-Z]/.test(p) || !_.has(json, p) || _.has(backlinks, p))
              continue;
            
            var prop = meta[p];
            if (!prop) {
//              delete json[p];
              continue;
            }
                  
            if (!willShow(res, prop, userRole))
              continue;
  
            if (prop['app']  &&  (!currentAppProps || !currentAppProps[p]))
              continue;
            displayedProps[p] = true;
            var val = U.makeProp({resource: res, prop: prop, value: json[p]});
            if (!groupNameDisplayed) {
              U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
              groupNameDisplayed = true;
            }
  
            // remove HTML tags, test length of pure text
            var v = val.value.replace(/(<([^>]+)>)/ig, '').trim();
            if (val.name.length + v.length > maxChars)
              U.addToFrag(frag, this.propRowTemplate2(val));
            else
              U.addToFrag(frag, this.propRowTemplate(val));
            
            json[p] = val;
          }
        }
      }
      
      var otherLi;
      groupNameDisplayed = false;
      var numDisplayed = _.size(displayedProps);
      for (var p in json) {
        if (!/^[a-zA-Z]/.test(p))
          continue;

        var prop = meta[p];
        if (!_.has(json, p) || displayedProps[p] || _.has(backlinks, p))
          continue;
        
        if (!prop) {
//          delete json[p];
          continue;
        }
        if (prop['app']  &&  (!currentAppProps || !currentAppProps[p]))
          continue;
        if (prop.autoincrement)
          continue;
//        if (prop.displayNameElm)
//          continue;
        if (!willShow(res, prop)) //(!U.isPropVisible(res, prop))
          continue;
  
        if (numDisplayed  &&  !groupNameDisplayed) {
          otherLi = '<li data-role="collapsible" data-inset="false" style="border:0px" data-content-theme="' + G.theme.list + '"  data-theme="' + G.theme.list + '" id="other"><h3 style="margin:0px;">Other</h3><ul data-role="listview" style="margin: -10px 0px;">';
  //        this.$el.append('<li data-role="collapsible" data-content-theme="c" id="other"><h2>Other</h2><ul data-role="listview">'); 
          groupNameDisplayed = true;
        }
        
        var val = U.makeProp({resource: res, propName: p, prop: prop, value: json[p]});
        var v = val.value.replace(/(<([^>]+)>)/ig, '').trim();
        if (otherLi) {
          if (val.name.length + v.length > maxChars)
            otherLi += this.propRowTemplate2(val);
          else
            otherLi += this.propRowTemplate(val);
        }
        else {
          if (val.name.length + v.length > maxChars)
            U.addToFrag(frag, this.propRowTemplate2(val));
          else
            U.addToFrag(frag, this.propRowTemplate(val));
        }
      }
      
      if (otherLi) {
        otherLi += "</ul></li>";
        U.addToFrag(frag, otherLi);
      }
  //    if (displayedProps.length  &&  groupNameDisplayed)
  //      this.$el.append("</ul></li>");
      
  //    var j = {"props": json};
  //    this.$el.html(html);
      this.$el.html(frag);      
      if (this.$el.hasClass('ui-listview')) {
        this.$el.trigger('create');      
        this.$el.listview('refresh');
      }
      else
        this.$el.trigger('create');      


//      if (this.isTemplate) {
//        var templateLi = this.$('[data-shortname="templateText"]')[0];
//        if (templateLi) {
//          var lineNo = 1, output = templateLi, numbers = document.getElementById("numbers");
////          output.innerHTML;// = numbers.innerHTML = "";
//          highlightText(output.innerHTML, this.__addLine);
//        }
//      }

      this.rendered = true;
      return this;
    },
    
    __addLine: function(line) {
      var doc = document;
      numbers.appendChild(doc.createTextNode(String(lineNo++)));
      numbers.appendChild(doc.createElement("BR"));
      for (var i = 0; i < line.length; i++) output.appendChild(line[i]);
      output.appendChild(doc.createElement("BR"));
    }

  }, {
    displayName: 'ResourceView'
  });
});
