//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'events', 
  'error', 
  'utils',
  'views/BasicView',
  'vocManager'
], function(G, $, _, Events, Errors, U, BasicView, Voc) {
  var RLIV = BasicView.extend({
    TAG: 'ResourceListItemView',
    tagName:"li",
    isCommonTemplate: true,
    initialize: function(options) {
      _.bindAll(this, 'render', 'click', 'recipeShoppingListHack', 'remove'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      this.checked = options.checked;
      this.resource.on('remove', this.remove, this);
//      this.resource.on('change', this.render, this);
      var key = this.vocModel.shortName + '-list-item';
      this.isEdit = options  &&  options.edit;
      if (!this.isEdit) {
        this.makeTemplate('listItemTemplate', 'template', this.vocModel.type); //= !this.isEdit //U.getTypeTemplate('list-item', this.resource);
      }
      
//      this.likesAndComments = this.makeTemplate('likesAndComments');
      if (this.template) 
        this.isCommonTemplate = false;
      else {
        if (options.mv) {
          this.makeTemplate('mvListItem', 'template');
          this.$el.attr("data-role", "controlgroup");
          this.mvProp = options.mvProp;
//          this.mvVals = options.mvVals;
        }
        else if (this.isEdit)
          this.makeTemplate('editListItemTemplate', 'template');
        else if (options.imageProperty) {
          this.imageProperty = options.imageProperty;
          this.makeTemplate('listItemTemplate', 'template');
        }
        else
          this.makeTemplate('listItemTemplateNoImage', 'template');
      }
      if (options.swatch) {
        this.$el.attr("data-theme", options.swatch);
      }
      if (this.resource.isA("Buyable"))
        this.$el.attr("data-icon", "false");
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
      var rslModel = U.getModel('RecipeShoppingList');
      if (!rslModel) {
//        Voc.loadStoredModels({models: [G.defaultVocPath + 'commerce/urbien/RecipeShoppingList']});
        Voc.getModels('commerce/urbien/RecipeShoppingList', {sync: true}).done(function() {
          self.recipeShoppingListHack.apply(self, args);
        });
        
        return;
      }
        
      var a = $(e.target).parent('a');
      var href = a.attr('href') || a.attr('link');
      var params = U.getQueryParams(href);
      var recipeShoppingList = new rlsModel();
      var props = {};
      var shoppingList = props[params.backLink] = U.getLongUri1(decodeURIComponent(params.on));
      var recipe = props.recipe = U.getLongUri1(this.resource.get('recipe'));
      recipeShoppingList.save(props, {
        success: function(model, response, options) {
          self.router.navigate(encodeURIComponent('commerce/urbien/ShoppingListItem') + '?shoppingList=' + encodeURIComponent(shoppingList), {trigger: true, forceFetch: true});
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
//      if (this.mvProp)
//        Events.defaultClickHandler(e);  
      if (this.mvProp) 
        return;
      if (!U.isAssignableFrom(this.vocModel, U.getLongUri1('model/workflow/Alert'))) {
        var p = this.parentView;
        if (p && p.mode == G.LISTMODES.CHOOSER) {
          Events.stopEvent(e);
          Events.trigger('chooser:' + U.getQueryParams().$prop, this.model);
        }
        
        return;
      }
      Events.stopEvent(e);
      var atype = this.resource.get('alertType');
      var action = atype  &&  atype == 'SyncFail' ? 'edit' : 'view';   
      this.router.navigate(action + '/' + encodeURIComponent(this.resource.get('forum')) + '?-info=' + encodeURIComponent(this.resource.get('davDisplayName')), {trigger: true, forceFetch: true});
    },
    
    render: function() {
      try {
        return this.renderHelper.apply(this, arguments);
      } finally {
        this.finish();
      }
    },
    
    renderHelper: function(event) {
      var m = this.resource;
      var vocModel = this.vocModel;
      var meta = vocModel.properties;
      meta = meta || m.properties;
      if (!meta)
        return this;
      
      var json = m.toJSON();
      if (this.mvProp) {  
        json['chkId'] = G.nextId() + '.' + this.mvProp;
        if (this.checked)
          json['_checked'] = 'checked';
//        if (this.mvVals  &&  $.inArray(json.davDisplayName, this.mvVals) != -1)
//          json['checked'] = 'checked';
      }

//      var distanceProp = U.getCloneOf(this.vocModel, 'Distance.distance')[0];
//      if (distanceProp) {
//        var distance = m.get(distanceProp);
//        json.distanceUnits = 'mi';
//      }
      
      if (!json._uri)
        G.log(RLIV.TAG, 'error', 'uri undefined 2', JSON.stringify(json));

      json.shortUri = U.getShortUri(json._uri, this.vocModel);
      var urbienType = G.commonTypes.Urbien;
      if (!this.mvProp && m.isA('Intersection')) { // if it's a multivalue, we want the intersection resource values themselves
        var href = window.location.href;
        var qidx = href.indexOf('?');
        var a = U.getCloneOf(this.vocModel, 'Intersection.a')[0];
        var b = U.getCloneOf(this.vocModel, 'Intersection.b')[0];
//        if (a && b && vocModel.type == G.commonTypes.Handler)
//          return this.renderIntersectionItem(json, a, b);
          
        if (a  ||  b) {
          var urbModel = U.getModel('Urbien');
          var isAContact;
          var isBContact;
          if (urbModel) {
            var idx = meta[a].range.lastIndexOf('/');
            var aModel = U.getModel(U.getLongUri1(meta[a].range));
            isAContact = aModel  &&  U.isAssignableFrom(aModel, urbienType);
            idx = meta[b].range.lastIndexOf('/');
            var bModel = U.getModel(U.getLongUri1(meta[b].range));
            isBContact = bModel  &&  U.isAssignableFrom(bModel, urbienType);
          }
          if (a  &&  qidx == -1) 
            return this.renderIntersectionItem(json, a, 'Intersection.a');
          var p = href.substring(qidx + 1).split('=')[0];
          if (a  &&  p == a)
            return this.renderIntersectionItem(json, b, 'Intersection.b');
          else if (b  &&  p == b)   
            return this.renderIntersectionItem(json, a, 'Intersection.a');
          if (isBContact)
            return this.renderIntersectionItem(json, b, 'Intersection.b');
          else          
            return this.renderIntersectionItem(json, a, 'Intersection.a');
        }
      }
      if (!this.isCommonTemplate) {
        if (this.imageProperty)
          this.$el.addClass("image_fitted");
        this.$el.html(this.template(json));
        return this;
      }
      var params = U.getQueryParams(window.location.hash);
      var isEdit = (params  &&  params['$edit'])  ||  U.isAssignableFrom(vocModel, G.commonTypes.WebProperty); //  ||  U.isAssignableFrom(this.vocModel, G.commonTypes.CloneOfProperty);
      var action = !isEdit ? 'view' : 'edit'; 
      if (U.isAssignableFrom(vocModel, G.commonTypes.Jst)) {
        var text = json.templateText;
        if (text) {
          var comments = U.getHTMLComments(text);
          if (comments && comments.length)
            json.comment = comments[0].trim();
        }
        if (params['modelName'])
          json.$title = U.makeHeaderTitle(params['modelName'], json.templateName);
      }

      
      json['action'] = action;
      if (this.isEdit) {
        if (params['$editCols']) {
          json['editProp'] = params['$editCols'];
          json['editPropValue'] = json[params['$editCols']];
        }
        else {
          json['editProp'] = 'label';
          json['editPropValue'] = json['label'];
        }
      }

      var viewCols = this.getViewCols(json);
      var dn = U.getDisplayName(m);
      json.davDisplayName = dn;

      json.width = json.height = json.top = json.right = json.bottom = json.left = ""; 
      // fit image to frame
      
      var oW = U.getCloneOf(this.vocModel, 'ImageResource.originalWidth');
      var oH;
      if (oW)
        oH = U.getCloneOf(this.vocModel, 'ImageResource.originalHeight');
      
      if (oW  &&  oH  &&  (typeof json[oW] != 'undefined' &&
          typeof  json[oH] != 'undefined')) {
        
        this.$el.addClass("image_fitted");
        
        var dim = U.fitToFrame(80, 80, json[oW] / json[oH])
        json.width = dim.w;
        json.height = dim.h;
        json.top = dim.y;
        json.right = dim.w - dim.x;
        json.bottom = dim.h - dim.y;
        json.left = dim.x;
      }
      var params = U.getParamMap(window.location.hash);
      if (U.isAssignableFrom(vocModel, U.getLongUri1("media/publishing/Video"))  &&  params['-tournament'])
        json['v_submitToTournament'] = {uri: params['-tournament'], name: params['-tournamentName']};

      this.addCommonBlock(viewCols, json);
      
      if (this.imageProperty)
        json['image'] = json[this.imageProperty];
      _.extend(json);
      
      this.$el.html(this.template(json));
      return this;
    },
    
    addCommonBlock: function(viewCols, json) {
      var vocModel = this.vocModel;
      if (!viewCols.length) {
        viewCols = '';
        var isSubmission = this.resource.isA('Submission');
        if (isSubmission) {
          var d = U.getCloneOf(vocModel, 'Submission.dateSubmitted');
          var dateSubmitted = d  &&  d.length ? json[d[0]] : null;
          if (dateSubmitted)
            viewCols += '<div class="dateLI">' + U.getFormattedDate(dateSubmitted) + '</div>';
        }
        
        var isClass = U.isAssignableFrom(vocModel, G.commonTypes.WebClass);
        viewCols += '<div class="commonLI">' + json.davDisplayName;
        if (isClass) {
          var comment = json['comment'];
          if (comment) 
            viewCols += '<p>' + comment + "</p>";
        }
        if (isSubmission) {
          var d = U.getCloneOf(vocModel, 'Submission.submittedBy');
          var submittedBy = d  &&  d.length ? json[d[0]] : null;
          if (submittedBy) {
//            viewCols += '<p>' + propDn + '<a href="' + G.pageRoot + '#view/' + encodeURIComponent(submittedBy) + '">' + json[d[0] + '.displayName'] + '</p>';
            var thumb = json[d[0] + '.thumb'];
            viewCols += '<div style="padding-top:3px;">';
            if (thumb) {
              var idx = thumb.indexOf('/Image?url=');
              if (idx == -1)
                viewCols += '<img src="' + thumb + '" />';
              else
                viewCols += '<img src="' + thumb.slice(idx + 11) + '" />';
            }
//            viewCols += '<span style="color: #737373; font-weight: normal; font-size: 12px; text-align: center;">' + json[d[0] + '.displayName'] + '</span></div>';
            var submitterName = json[d[0] + '.displayName'];
            if (submitterName) {
              viewCols += '<div class="submitter">&#160;&#160;' + submitterName + '</div>'
              viewCols += '</div>';
            }
          }
        }
        viewCols += '</div>';
      }
      var meta = vocModel.properties;
      meta = meta || m.properties;

      if (this.resource.isA('CollaborationPoint')) { 
        var comments = U.getCloneOf(vocModel, 'CollaborationPoint.comments');
        if (comments.length > 0) {
          var pMeta = meta[comments[0]];
          var cnt = json[pMeta.shortName] && json[pMeta.shortName].count;
          json.v_showCommentsFor = { uri: U.encode(U.getLongUri1(json['_uri'])), count: cnt }; //U.encode(U.getLongUri1(rUri)); // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
        }
      }
      if (this.resource.isA('Votable')) {
        var votes = U.getCloneOf(vocModel, 'Votable.likes');
        if (votes.length == 0)
          votes = U.getCloneOf(vocModel, 'Votable.voteUse');
        if (votes.length > 0) {
          var pMeta = meta[votes[0]];
          var cnt = json[pMeta.shortName] && json[pMeta.shortName].count;
          json.v_showVotesFor = { uri: U.encode(U.getLongUri1(json['_uri'])), count: cnt }; //U.encode(U.getLongUri1(rUri)); // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
        }
      }  
      json.viewCols = viewCols;
//      json.likesAndComments = this.$el.html(this.likesAndComments(json));
    },
    getViewCols: function(json) {
      var res = this.resource;
      var vocModel = res.vocModel;
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
    
//    renderTwinIntersectionItem: function(json, a, b) {
//      var m = this.resource;
//      var vocModel = this.vocModel;
//      var meta = vocModel.properties;
//      if (!meta)
//        return this;
//      
//    }

    renderIntersectionItem: function(json, delegateTo, cloneOf) {
      var m = this.resource;
      var vocModel = this.vocModel;
      var meta = vocModel.properties;
      if (!meta)
        return this;
      
      var type = vocModel.type;
      var img;
      var dn;
      var rUri;
      var h = '', w = '';
      if (cloneOf == 'Intersection.a') {
        var imageP = U.getCloneOf(vocModel, 'Intersection.aThumb');
        var hasAImageProps;
        if (imageP  &&  imageP.length != 0) {
          img = json[imageP[0]];
          hasAImageProps = true;
        }
        if (!img) {
          imageP = U.getCloneOf(vocModel, 'Intersection.aFeatured');
          if (imageP  &&  imageP.length != 0) { 
            img = json[imageP[0]];
            hasAImageProps = true;
          }
        }
        if (!img  &&  !hasAImageProps  &&  U.isA(vocModel, 'Intersection')) {
          imageP = U.getCloneOf(vocModel, 'ImageResource.smallImage');
          if (imageP  &&  imageP.length != 0) {
            img = json[imageP[0]];
          }
        }
    //        img = json[U.getCloneOf(vocModel, 'Intersection.aFeatured')] || json[U.getCloneOf(vocModel, 'Intersection.aThumb')];
        if (img) {
          w = json[U.getCloneOf(vocModel, 'Intersection.aOriginalWidth')];
          h = json[U.getCloneOf(vocModel, 'Intersection.aOriginalHeight')];
        }
      }
      else {
        var imageP = U.getCloneOf(vocModel, 'Intersection.bThumb');
        if (imageP  &&  imageP.length != 0)
          img = json[imageP[0]]; 
        if (!img) {
          imageP = U.getCloneOf(vocModel, 'Intersection.bFeatured');
        
          if (imageP) 
            img = json[imageP[0]];
        }
    //        img = json[U.getCloneOf(vocModel, 'Intersection.bThumb')] || json[U.getCloneOf(vocModel, 'Intersection.bFeatured')];
    //        img = json[U.getCloneOf(vocModel, 'Intersection.bFeatured')] || json[U.getCloneOf(vocModel, 'Intersection.bThumb')];
        if (img) {
          w = json[U.getCloneOf(vocModel, 'Intersection.bOriginalWidth')];
          h = json[U.getCloneOf(vocModel, 'Intersection.bOriginalHeight')];
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
        dn = json[U.getCloneOf(vocModel, 'Reference.resourceDisplayName')];
      else
        dn = json[delegateTo + '.displayName'];
      
      if (type !== G.commonTypes.Handler) {
        rUri = json[delegateTo];
        if (rUri)
          json['_uri'] = rUri;
      }
      
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
        
      var viewCols = this.getViewCols(json);
      if (!viewCols)
        viewCols = dn;
      
      tmpl_data['viewCols'] = viewCols;
      
      var type = rUri ? U.getTypeUri(rUri) : null;
      
      var forResourceModel = type ? U.getModel(type) : null;
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
//          tmpl_data.v_showCommentsFor = U.encode(U.getLongUri1(rUri, Voc) + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
//        }
//      }
//      if (U.isA(c, 'Votable')) {
//        var votes = U.getCloneOf(meta, 'Votable.voteUse');
//        if (votes.length == 0)
//          votes = U.getCloneOf(meta, 'Votable.likes');
//        if (votes.length > 0) {
//          var pMeta = meta[votes[0]];
//          tmpl_data.v_showVotesFor = U.encode(U.getLongUri1(rUri, Voc) + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
//        }
//      }  
//      var nabs = U.getCloneOf(meta, 'ImageResource.nabs');
//      if (nabs.length > 0) {
//        var pMeta = meta[nabs[0]];
//        var uri = U.encode(U.getLongUri1(rUri, Voc) + '?m_p=' + nabs[0] + '&b_p=' + pMeta.backLink);
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
  
  return RLIV;
});
