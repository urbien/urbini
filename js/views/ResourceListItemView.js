//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'events', 
  'error', 
  'templates', 
  'utils',
  'views/BasicView',
  'vocManager'
], function(G, $, _, Events, Errors, Templates, U, BasicView, Voc) {
  return BasicView.extend({
    TAG: 'ResourceListItemView',
    tagName:"li",
    isCommonTemplate: true,
    initialize: function(options) {
      _.bindAll(this, 'render', 'click', 'recipeShoppingListHack', 'remove'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      this.resource.bind('remove', this.remove);
      var key = this.vocModel.shortName + '-list-item';
      this.template = U.getTypeTemplate('list-item', this.resource);
      if (this.template) 
        this.isCommonTemplate = false;
      else {
        if (options.mv) {
          this.template = _.template(Templates.get('mvListItem'));
          this.$el.attr("data-role", "controlgroup");
          this.mvProp = options.mvProp;
          this.mvVals = options.mvVals;
        }
        else if (options.imageProperty) {
          this.imageProperty = options.imageProperty;
          this.template = _.template(Templates.get('listItemTemplate'));
        }
        else
          this.template = _.template(Templates.get('listItemTemplateNoImage'));
      }
        
      // resourceListView will call render on this element
  //    this.model.on('change', this.render, this);
      return this;
    },
    events: {
      'click': 'click',
      'click .recipeShoppingList': 'recipeShoppingListHack',
      'click .cancelItem': 'cancelItem'
    },
    cancelItem: function(e) {
      Events.stopEvent(e);
      this.resource.cancel({
        error: function(resource, xhr, options) {
          var code = xhr.code || xhr.status;
          if (xhr.statusText === 'error' || code === 0) {            
            Errors.errDialog({msg: 'There was en error with your request, please try again', delay: 100});
            return;
          }
        }
      });
    },
    recipeShoppingListHack: function(e) {
      Events.stopEvent(e);
      var self = this;
      var args = arguments;
      if (!G.shortNameToModel.RecipeShoppingList) {
        Voc.loadStoredModels({models: [G.defaultVocPath + 'commerce/urbien/RecipeShoppingList']});
        var allGood = Voc.fetchModels(null, { 
           success: function() {
             self.recipeShoppingListHack.apply(self, args);
           },
           sync: true
        });
        
        return;
      }
        
      var a = $(e.target).parent('a');
      var href = a.attr('href') || a.attr('link');
      var params = U.getQueryParams(href);
      var recipeShoppingList = new G.shortNameToModel.RecipeShoppingList();
      var props = {};
      var shoppingList = props[params.backLink] = U.getLongUri(decodeURIComponent(params.on));
      var recipe = props.recipe = U.getLongUri(this.resource.get('recipe'));
      recipeShoppingList.save(props, {
        success: function(model, response, options) {
          self.router.navigate(encodeURIComponent('commerce/urbien/ShoppingListItem') + '?shoppingList=' + encodeURIComponent(shoppingList), {trigger: true, forceRefresh: true});
        }, 
        error: function(model, xhr, options) {
          var json;
          try {
            json = JSON.parse(xhr.responseText).error;
          } catch (err) {
            G.log(self.TAG, 'error', 'couldn\'t create shopping list items, no error info from server');
            return;
          }
          
          Errors.errDialog({msg: json.details});
          G.log(self.TAG, 'error', 'couldn\'t create shopping list items');
        }
      });
    },
    click: function(e) {
      if (this.mvProp)
        Events.defaultClickHandler(e);  
      else {
        var p = this.parentView;
        if (p && p.mode == G.LISTMODES.CHOOSER) {
          Events.stopEvent(e);
          Events.trigger('chooser', this.model);
        }
      }
    },
    render: function(event) {
      var m = this.resource;
      var meta = this.vocModel.properties;
      meta = meta || m.properties;
      if (!meta)
        return this;
      var json = m.toJSON();
      _.extend(json, {U:U, G:G});

      if (this.mvProp) {  
        json['chkId'] = G.nextId() + '.' + this.mvProp;
        if (this.mvVals  &&  $.inArray(json.davDisplayName, this.mvVals) != -1)
          json['checked'] = 'checked';
      }
      var distance = m.get('distance');
      if (typeof distance != 'undefined') {
        var meta = this.vocModel.properties;
        var prop = meta['distance'];
        var d = U.getCloneOf(this.vocModel, 'Distance.distance');
        if (d)
          json.distance = distance + ' mi';
      }
      json.shortUri = U.getShortUri(json._uri, this.vocModel);
      if (m.isA('Intersection')) {
        var href = window.location.href;
        var qidx = href.indexOf('?');
        var a = U.getCloneOf(this.vocModel, 'Intersection.a')[0];
        var b = U.getCloneOf(this.vocModel, 'Intersection.b')[0];
        if (a  ||  b) {
          var urbModel = G.shortNameToModel['Urbien'];
          var isAContact;
          var isBContact;
          if (urbModel) {
            var idx = meta[a].range.lastIndexOf('/');
            var aModel = G.typeToModel[U.getLongUri(meta[a].range)];
            isAContact = aModel  &&  U.isAssignableFrom(aModel, 'Urbien', G.typeToModel);
            idx = meta[b].range.lastIndexOf('/');
            var bModel = G.typeToModel[U.getLongUri(meta[b].range)];
            isBContact = bModel  &&  U.isAssignableFrom(bModel, 'Urbien', G.typeToModel);
          }
          if (a  &&  qidx == -1) 
            return this.renderIntersectionItem(a, 'Intersection.a');
          var p = href.substring(qidx + 1).split('=')[0];
          if (a  &&  p == a)
            return this.renderIntersectionItem(b, 'Intersection.b');
          else if (b  &&  p == b)   
            return this.renderIntersectionItem(a, 'Intersection.a');
          if (isBContact)
            return this.renderIntersectionItem(b, 'Intersection.b');
          else          
            return this.renderIntersectionItem(a, 'Intersection.a');
        }
      }
      if (!this.isCommonTemplate) {
        if (this.imageProperty)
          this.$el.addClass("image_fitted");
        this.$el.html(this.template(json));
        return this;
      }
      
      var viewCols = this.getViewCols(json);
      var dn = U.getDisplayName(m);
      json.davDisplayName = dn;
      if (!viewCols.length) {
        var isClass = U.isAssignableFrom(vocModel, 'WebClass', G.typeToModel);
        viewCols = '<h3>' + dn + '</h3>';
        if (isClass) {
          var comment = json['comment'];
          if (comment) 
            viewCols += '<p>' + comment + "</p>";
        }
      }
      json.viewCols = viewCols;

      json.width = json.height = json.top = json.right = json.bottom = json.left = ""; 
      // fit image to frame
      if (typeof json.originalWidth != 'undefined' &&
          typeof  json.originalHeight != 'undefined' ) {
        
        this.$el.addClass("image_fitted");
        
        var dim = U.fitToFrame(80, 80, json.originalWidth / json.originalHeight)
        json.width = dim.w;
        json.height = dim.h;
        json.top = dim.y;
        json.right = dim.w - dim.x;
        json.bottom = dim.h - dim.y;
        json.left = dim.x;
      }
      if (this.imageProperty)
        json['image'] = json[this.imageProperty];
      this.$el.html(this.template(json));
      return this;
    },
    
    getViewCols: function(json) {
      var res = this.resource;
      var meta = this.vocModel.properties;
      
      var viewCols = '';
      var grid = U.getCols(res, 'grid', true);
      if (!grid) 
        return viewCols;
      var firstProp = true;
      var containerProp = U.getContainerProperty(vocModel);

      for (var row in grid) {
        var pName = grid[row].propertyName;
        if (containerProp  &&  containerProp == pName)
          continue;
        // show groupped gridCols properties in one line
        var prop = meta[pName];
        var pGr = prop.propertyGroupList;
        if (pGr) {
          var props = pGr.split(",");
          var first = true;
          for (var j = 0; j < props.length; j++) {
            var p = props[j].trim();
            if (!_.has(json, p)) //  || _.contains(gridCols, p))
              continue;
            
            var prop1 = meta[p];
            if (!prop1) {
//              delete json[p];
              continue;
            }
                  
            if (p.charAt(0) == '_')
              continue;
            if (p == 'davDisplayName')
              continue;
            if (prop1['displayNameElm'])
              continue;
            if (!U.isPropVisible(res, prop1))
              continue;
  
            if (first) {
              first = false;
              viewCols += '<div data-theme="d" style="padding: 5px 0 5px 0;"><i><u>' + U.getPropDisplayName(prop) + '</u></i></div>';                
            }
            
            var val = json[p] = U.makeProp({resource: res, prop: prop1, value: json[p]});
//            var v = val.value.replace(/(<([^>]+)>)/ig, '').trim();
            var range = prop1.range;
            var s = range.indexOf('/') != -1 ? json[p + '.displayName'] || val.value : val.value;
            var isDate = prop1.range == 'date';
            if (!prop1.skipLabelInGrid) 
              viewCols += '<div style="display:inline"><span class="label">' + U.getPropDisplayName(prop1) + ':</span><span style="font-weight:normal">' + s + '</span></div>';
            else
              viewCols += '<span style="font-weight:normal">' + s + '</span>';
            viewCols += '&#160;';
          }
          firstProp = false;
          continue;
        }

        var range = meta[pName].range;
        // HACK for Money
        var s = range.indexOf('/') != -1 && range != 'model/company/Money' ? json[pName + '.displayName']  ||  json[pName] : grid[row].value;
//        var s = grid[row].value;
        var isDate = meta[pName].range == 'date'; 
        if (!firstProp)
          viewCols += "<br/>";
        if (!meta[pName].skipLabelInGrid) {
//            if (isDate)
//              viewCols += '<div style="float:right;clear: both;"><span class="label">' + row + ':</span><span style="font-weight:normal">' + s + '</span></div>';
//            else
          viewCols += '<div style="display:inline"><span class="label">' + row + ':</span><span style="font-weight:normal">' + s + '</span></div>';
        }
        else {
          if (firstProp)
            viewCols += '<span>' + s + '</span>';
          else
            viewCols += '<span style="font-weight:normal">' + s + '</span>';
        }
        firstProp = false;
      }
      return viewCols;
    },
    renderIntersectionItem: function(delegateTo, cloneOf) {
      var m = this.resource;
      var meta = this.vocModel.properties;
      if (!meta)
        return this;
      
      var img;
      var dn;
      var rUri;
      var json = m.attributes;
      var h = '', w = '';
      if (cloneOf == 'Intersection.a') {
        var imageP = U.getCloneOf(this.vocModel, 'Intersection.aThumb');
        var hasAImageProps;
        if (imageP  &&  imageP.length != 0) {
          img = json[imageP[0]];
          hasAImageProps = true;
        }
        if (!img) {
          imageP = U.getCloneOf(this.vocModel, 'Intersection.aFeatured');
          if (imageP  &&  imageP.length != 0) { 
            img = json[imageP[0]];
            hasAImageProps = true;
          }
        }
        if (!img  &&  !hasAImageProps  &&  U.isA(this.vocModel, 'Intersection')) {
          imageP = U.getCloneOf(this.vocModel, 'ImageResource.smallImage');
          if (imageP  &&  imageP.length != 0) {
            img = json[imageP[0]];
          }
        }
    //        img = json[U.getCloneOf(this.vocModel, 'Intersection.aFeatured')] || json[U.getCloneOf(this.vocModel, 'Intersection.aThumb')];
        if (img) {
          w = json[U.getCloneOf(this.vocModel, 'Intersection.aOriginalWidth')];
          h = json[U.getCloneOf(this.vocModel, 'Intersection.aOriginalHeight')];
        }
      }
      else {
        var imageP = U.getCloneOf(this.vocModel, 'Intersection.bThumb');
        if (imageP  &&  imageP.length != 0)
          img = json[imageP[0]]; 
        if (!img) {
          imageP = U.getCloneOf(this.vocModel, 'Intersection.bFeatured');
        
          if (imageP) 
            img = json[imageP[0]];
        }
    //        img = json[U.getCloneOf(this.vocModel, 'Intersection.bThumb')] || json[U.getCloneOf(this.vocModel, 'Intersection.bFeatured')];
    //        img = json[U.getCloneOf(this.vocModel, 'Intersection.bFeatured')] || json[U.getCloneOf(this.vocModel, 'Intersection.bThumb')];
        if (img) {
          w = json[U.getCloneOf(this.vocModel, 'Intersection.bOriginalWidth')];
          h = json[U.getCloneOf(this.vocModel, 'Intersection.bOriginalHeight')];
        }
      }
      if (img  &&  !this.isCommonTemplate) {
        this.$el.addClass("image_fitted");
        this.$el.html(this.template(json));
        return this;
      }
      
      json.width = json.height = json.top = json.right = json.bottom = json.left = ""; 
      // fit image to frame
      if (typeof w != 'undefined'  &&   typeof h != 'undefined') {
        
        this.$el.addClass("image_fitted");
        
        var dim = U.fitToFrame(80, 80, w / h)
        json.width = dim.w;
        json.height = dim.h;
        json.top = dim.y;
        json.right = dim.w - dim.x;
        json.bottom = dim.h - dim.y;
        json.left = dim.x;
      }
      if (cloneOf == 'Intersection.a'  &&  m.isA('Reference')) 
        dn = json[U.getCloneOf(this.vocModel, 'Reference.resourceDisplayName')];
      else
        dn = json[delegateTo + '.displayName'];
      
      rUri = json[delegateTo];
      if (rUri)
        json['_uri'] = rUri;
      var tmpl_data = _.extend(json, {resourceMediumImage: img});
//      tmpl_data['_uri'] = rUri;
      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
      }
      tmpl_data['image'] = img;
      tmpl_data['davDisplayName'] = dn;

      var resourceUri = G.pageRoot + '#view/' + U.encode(rUri);
        
      var viewCols = '<h3>' + dn + '</h3>';
      
      tmpl_data['viewCols'] = viewCols;
      
      var type = rUri ? U.getTypeUri(rUri) : null;
      
      var forResourceModel = type ? G.typeToModel[type] : null;
      var c =  forResourceModel ? forResourceModel : m.constructor;
      if (forResourceModel) {
        var meta = c.properties;
        meta = meta || m.properties;
      }
      tmpl_data['rUri'] = resourceUri;
//      if (U.isA(c, 'CollaborationPoint')) { 
//        var comments = U.getCloneOf(meta, 'CollaborationPoint.comments');
//        if (comments.length > 0) {
//          var pMeta = meta[comments[0]];
//          
//          tmpl_data.v_showCommentsFor = U.encode(U.getLongUri(rUri, Voc) + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
//        }
//      }
//      if (U.isA(c, 'Votable')) {
//        var votes = U.getCloneOf(meta, 'Votable.voteUse');
//        if (votes.length == 0)
//          votes = U.getCloneOf(meta, 'Votable.likes');
//        if (votes.length > 0) {
//          var pMeta = meta[votes[0]];
//          tmpl_data.v_showVotesFor = U.encode(U.getLongUri(rUri, Voc) + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
//        }
//      }  
//      var nabs = U.getCloneOf(meta, 'ImageResource.nabs');
//      if (nabs.length > 0) {
//        var pMeta = meta[nabs[0]];
//        var uri = U.encode(U.getLongUri(rUri, Voc) + '?m_p=' + nabs[0] + '&b_p=' + pMeta.backLink);
//        tmpl_data.v_showRenabFor = uri;
//      }
      
      try {
        this.$el.html(this.template(tmpl_data));
      } catch (err) {
        console.log('couldn\'t render resourceListItemView: ' + err);
      }
      
      return this;
    }

  });  
});
