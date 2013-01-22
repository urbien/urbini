define([
  'globals',
  'cache!jquery', 
  'cache!underscore', 
  'cache!events', 
  'cache!templates', 
  'cache!utils',
  'cache!views/BasicView',
  'cache!vocManager'
], function(G, $, _, Events, Templates, U, BasicView, Voc) {
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
        if (options.hasImages)
          this.template = _.template(Templates.get('listItemTemplate'));
        else
          this.template = _.template(Templates.get('listItemTemplateNoImage'));
      }
      // resourceListView will call render on this element
  //    this.model.on('change', this.render, this);
      this.parentView = options && options.parentView;
      return this;
    },
    events: {
      'click': 'click',
      'click .recipeShoppingList': 'recipeShoppingListHack',
      'click .cancelItem': 'cancelItem'
    },
    cancelItem: function(e) {
      Events.stopEvent(e);
      var error = function(json, xhr, options) {
        G.log(self.TAG, 'error', 'couldn\'t create shopping list items', json);
      }

      var props = this.vocModel.properties;
      var canceled = U.getCloneOf(props, 'Cancellable.cancelled');
      if (!canceled.length)
        return;
      
      canceled = canceled[0].shortName;
      var data = {};
      data[canceled] = true;
      var res = this.resource;
      $.ajax({
        url: G.apiUrl + 'e/' + encodeURIComponent(res.getUri()),
        method: 'POST',
        data: data,
        success: function(json, status, xhr) {
          if (xhr.status == 200) {
            if (json.error)
              error(json, xhr)
            else
              res.trigger('cancel');
          }
        },
        error: error
      });
      
//      this.resource.save({canceled: true}, {patch: true,
//        success: function(model, response, options) {
//          if (response.status == 200) {
//            var json = JSON.parse(response.responseText);
//            if (json.error)
//              error(mode, response, options)
//            else
//              this.resource.collection.remove(this.resource);
//          }
//        },
//        error: function(model, xhr, options) {
//          G.log(self.TAG, 'error', 'couldn\'t create shopping list items');
//        }
//      });
      
    },
    recipeShoppingListHack: function(e) {
      Events.stopEvent(e);
      var self = this;
      var args = arguments;
      if (!Voc.shortNameToModel.RecipeShoppingList) {
        Voc.loadStoredModels({models: [G.defaultVocPath + 'commerce/urbien/RecipeShoppingList']});
        var allGood = Voc.fetchModels(null, { 
           success: function() {
             self.recipeShoppingListHack.apply(self, args);
           },
           sync: true,
        });
        
        return;
      }
        
      var a = $(e.target).parent('a');
      var href = a.attr('href') || a.attr('link');
      var params = U.getQueryParams(href);
      var recipeShoppingList = new Voc.shortNameToModel.RecipeShoppingList();
      var props = {};
      var shoppingList = props[params.backLink] = U.getLongUri(decodeURIComponent(params.on));
      var recipe = props.recipe = U.getLongUri(this.resource.get('recipe').value);
      recipeShoppingList.save(props, {
        success: function(model, response, options) {
          self.router.navigate(encodeURIComponent('commerce/urbien/ShoppingListItem') + '?shoppingList=' + encodeURIComponent(shoppingList), {trigger: true});
        }, 
        error: function(model, xhr, options) {
          G.log(self.TAG, 'error', 'couldn\'t create shopping list items');
        }
      });
    },
    click: function(e) {
      var p = this.parentView;
      if (p && p.mode == G.LISTMODES.CHOOSER) {
        Events.stopEvent(e);
        Events.trigger('chooser', this.model);
      }
    },
    render: function(event) {
      var m = this.resource;
      var meta = this.vocModel.properties;
      meta = meta || m.properties;
      if (!meta)
        return this;
      var json = m.toJSON();
      var distance = m.get('distance');
      if (typeof distance != 'undefined') {
        var meta = this.vocModel.properties;
        var prop = meta['distance'];
        var d = U.getCloneOf(meta, 'Distance.distance');
        if (d)
          json['distance'] = distance + ' mi';
      }
      if (!this.isCommonTemplate) {
        this.$el.html(this.template(json));
        return this;
      }
      if (U.isA(this.vocModel, 'Intersection')) {
        var href = window.location.href;
        var qidx = href.indexOf('?');
        var a = U.getCloneOf(meta, 'Intersection.a')[0];
        var b = U.getCloneOf(meta, 'Intersection.b')[0];
        if (a  ||  b) {
          if (a  &&  qidx == -1) 
            return this.renderIntersectionItem(a, 'Intersection.a');
          var p = href.substring(qidx + 1).split('=')[0];
          if (a  &&  p == a)
            return this.renderIntersectionItem(b, 'Intersection.b');
          else    
            return this.renderIntersectionItem(a, 'Intersection.a');
        }
      }
      
      var viewCols = this.getViewCols(json);
      var dn = U.getDisplayName(m);
      json['davDisplayName'] = dn;
      if (!viewCols.length) 
        viewCols = '<h3>' + dn + '</h3>';
      json['viewCols'] = viewCols;

      json['width'] = json['height'] = json['top'] = json['right'] = json['bottom'] = json['left'] = ""; 
      // fit image to frame
      if (typeof json['originalWidth'] != 'undefined' &&
          typeof  json['originalHeight'] != 'undefined' ) {
        
        this.$el.addClass("image_fitted");
        
        var dim = U.fitToFrame(80, 80, json['originalWidth'] / json['originalHeight'])
        json['width'] = dim.w;
        json['height'] = dim.h;
        json['top'] = dim.y;
        json['right'] = dim.w - dim.x;
        json['bottom'] = dim.h - dim.y;
        json['left'] = dim.x;
      }
      
      this.$el.html(this.template(json));
      return this;
    },
    
    getViewCols: function(json) {
      var model = this.resource;
      var meta = this.vocModel.properties;
      var viewCols = '';
      var grid = U.getGridCols(model);
      if (!grid)
        return viewCols;
      var firstProp = true;
      for (var row in grid) {
        var pName = grid[row].propertyName;
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
              delete json[p];
              continue;
            }
                  
            if (p.charAt(0) == '_')
              continue;
            if (p == 'davDisplayName')
              continue;
            if (prop1['displayNameElm'])
              continue;
            if (!U.isPropVisible(model, prop1))
              continue;
  
            if (first) {
              first = false;
              viewCols += '<div data-theme="d" style="padding: 5px 0 5px 0;"><i><u>' + prop.displayName + '</u></i></div>';                
            }
            json[p] = U.makeProp(prop1, json[p]);
//              var v = json[p].value.replace(/(<([^>]+)>)/ig, '').trim();
            var range = prop1.range;
            var s = range.indexOf('/') != -1 ? json[p].displayName  ||  json[p] : json[p].value;
            var isDate = prop1.range == 'date';
            if (!prop1.skipLabelInGrid) 
              viewCols += '<div style="display:inline"><span class="label">' + prop1.displayName + ':</span><span style="font-weight:normal">' + s + '</span></div>';
            else
              viewCols += '<span style="font-weight:normal">' + s + '</span>';
            viewCols += '&#160;';
          }
          firstProp = false;
          continue;
        }

        var range = meta[pName].range;
        var s = range.indexOf('/') != -1 ? json[pName].displayName  ||  json[pName] : grid[row].value;
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
      var json = m.toJSON();
      if (cloneOf == 'Intersection.a') {
        img = json[U.getCloneOf(meta, 'Intersection.aFeatured')] || json[U.getCloneOf(meta, 'Intersection.aThumb')];
      }
      else {
        img = json[U.getCloneOf(meta, 'Intersection.bFeatured')] || json[U.getCloneOf(meta, 'Intersection.bThumb')];
      }
      dn = json[delegateTo].displayName;
      rUri = json[delegateTo].value;
        
//      var img = U.getCloneOf(meta, 'ImageResource.mediumImage')[0]; 
//      if (img == null)
//        img = U.getCloneOf(meta, 'ImageResource.bigMediumImage')[0];
//      if (img == null)
      var tmpl_data = _.extend(json, {resourceMediumImage: img});

      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
  //      tmpl_data = _.extend(tmpl_data, {imgSrc: img});
      }
      var tmpl_data = _.extend(json, {mediumImage: img});
      tmpl_data['davDisplayName'] = dn;

      var resourceUri = G.pageRoot + '#view/' + U.encode(rUri);
        
//      var gridCols = '<a href="' + resourceUri + '">' + dn + '</a>';
      var viewCols = this.getViewCols(json);
      var dn = U.getDisplayName(m);
      tmpl_data['davDisplayName'] = dn;
      if (!viewCols.length) 
        viewCols = '<h3>' + dn + '</h3>';
      
      tmpl_data['viewCols'] = viewCols;
      
//      var rUri = G.pageRoot + '#view/' + U.encode(U.getLongUri(json[imgSrc].value), snmHint);
      var type = U.getTypeUri(rUri);
      
      var forResourceModel = type ? Voc.typeToModel[type] : null;
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
        console.log('2. failed to delete table ' + name + ': ' + err);
      }
      
      return this;
    },

  });  
});
