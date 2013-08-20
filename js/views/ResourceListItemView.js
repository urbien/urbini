//'use strict';
define('views/ResourceListItemView', [
  'globals',
  'underscore', 
  'events', 
  'error', 
  'utils',
  'views/BasicView',
  'vocManager'
], function(G, _, Events, Errors, U, BasicView, Voc) {
  var RLIV = BasicView.extend({
    tagName:"li",
    isCommonTemplate: true,
    initialize: function(options) {
      _.bindAll(this, 'render', 'click', /*'recipeShoppingListHack',*/ 'remove'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      this.checked = options.checked;
      this.resource.on('remove', this.remove, this);
//      this.resource.on('change', this.render, this);
      var key = this.vocModel.shortName + '-list-item';
      this.isEdit = options  &&  options.edit;
      if (!this.isEdit) {
        this.makeTemplate('listItemTemplate', 'template', this.vocModel.type, true); // don't fall back to default, we want to know if no template was found for this type
      }
      
//      this.makeTemplate('likesAndComments', 'likesAndComments', this.vocModel.type);
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
          this.$el.attr("class", "image_fitted ui-btn ui-li ui-li-has-thumb ui-li-static");
          if (options.swatch)
            this.$el.attr("class", "ui-li-up-" + options.swatch);
        }
        else {
          this.makeTemplate('listItemTemplateNoImage', 'template', this.vocModel.type);
        }
      }
      if (options.swatch) {
        this.$el.attr("data-theme", options.swatch);
      }
//      if (this.resource.isA("Buyable"))
        this.$el.attr("data-icon", "false");
//      else
//        this.$el.attr("data-icon", "chevron-right");
   
   //      this.$el.attr("class", "image_fitted ui-btn ui-li-has-arrow ui-li ui-li-has-thumb ui-first-child ui-btn-up-c");
      // resourceListView will call render on this element
  //    this.model.on('change', this.render, this);

      this.gridCols = U.getColsMeta(this.vocModel, 'grid');
      this.commonBlockProps = [];
      if (this.gridCols) {
        if (U.isA(this.vocModel, 'Submission')) {
          var dateSubmittedCOf = U.getCloneOf(this.vocModel, 'Submission.dateSubmitted');
          var dateSubmitted = (dateSubmittedCOf.length == 0) ? null : dateSubmittedCOf[0];
          if (dateSubmitted) 
            this.commonBlockProps.push(dateSubmitted);   
          
          var submittedByCOf = U.getCloneOf(this.vocModel, 'Submission.submittedBy');
          var submittedBy = (submittedByCOf.length == 0) ? null : submittedByCOf[0];
          if (submittedBy)
            this.commonBlockProps.push(submittedBy);
        }
        if (this.commonBlockProps) {
          var n = this.commonBlockProps.length; 
          for (var i=0; i<n; i++) {
            var p = this.commonBlockProps[i];
            var idx = this.gridCols.indexOf(p);
            if  (idx != -1) 
              this.gridCols.splice(idx, 1);
            else {
              this.commonBlockProps.splice(i, 1);
              n--;
              i--
            }
          }
        }
      }
      return this;
    },
    events: {
      'click': 'click',
//      'click .recipeShoppingList': 'recipeShoppingListHack',
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
//    recipeShoppingListHack: function(e) {
//      Events.stopEvent(e);
//      var self = this;
//      var args = arguments;
//      var rslModel = U.getModel('RecipeShoppingList');
//      if (!rslModel) {
////        Voc.loadStoredModels({models: [G.defaultVocPath + 'commerce/urbien/RecipeShoppingList']});
//        Voc.getModels('commerce/urbien/RecipeShoppingList', {sync: true}).done(function() {
//          self.recipeShoppingListHack.apply(self, args);
//        });
//        
//        return;
//      }
//        
//      var a = $(e.target).parent('a');
//      var href = a.attr('href') || a.attr('link');
//      var params = U.getQueryParams(href);
//      var recipeShoppingList = new rlsModel();
//      var props = {};
//      var shoppingList = props[params.backLink] = U.getLongUri1(decodeURIComponent(params.on));
//      var recipe = props.recipe = U.getLongUri1(this.resource.get('recipe'));
//      recipeShoppingList.save(props, {
//        success: function(model, response, options) {
//          self.router.navigate(encodeURIComponent('commerce/urbien/ShoppingListItem') + '?shoppingList=' + encodeURIComponent(shoppingList), {trigger: true, forceFetch: true});
//        }, 
//        error: function(model, xhr, options) {
//          var json;
//          try {
//            json = JSON.parse(xhr.responseText).error;
//          } catch (err) {
//            G.log(self.TAG, 'error', 'couldn\'t create shopping list items, no error info from server');
//            return;
//          }
//          
//          Errors.errDialog({msg: json.details});
//          G.log(self.TAG, 'error', 'couldn\'t create shopping list items');
//        }
//      });
//    },
    click: function(e) {
//      if (this.mvProp)
//        Events.defaultClickHandler(e);  
      var params = U.getQueryParams(),
          parentView = this.parentView,
          type = params['$type'],
          isWebCl = U.isAssignableFrom(this.vocModel, "WebClass"),
          isImplementor = type && type.endsWith('system/designer/InterfaceImplementor');

      
      if (this.mvProp) 
        return;
      if (U.isAssignableFrom(this.vocModel, U.getLongUri1('model/workflow/Alert'))) {
        Events.stopEvent(e);
        var atype = this.resource.get('alertType');
        var action = atype  &&  atype == 'SyncFail' ? 'edit' : 'view';   
        this.router.navigate(U.makeMobileUrl(action, this.resource.get('forum'), {'-info': this.resource.get('davDisplayName')}), {trigger: true, forceFetch: true});
        return;
      }
      // Setting values to TaWith does not work if this block is lower then next if()
      var p1 = params['$propA'];
      var p2 = params['$propB'];
      var type = params['$type'];
      var isIntersection = type ? U.isAssignableFrom(U.getModel(params['$type']), 'Intersection') : false;
      if (!isImplementor && parentView && parentView.mode == G.LISTMODES.CHOOSER) {
        if (!isIntersection  ||  (!p1  &&  !p2)) {
          Events.stopEvent(e);
          Events.trigger('chose', U.getQueryParams().$prop, this.model);
//          Events.trigger('chose:' + U.getQueryParams().$prop, this.model);
          return;
        }
      }
      
      if (params  &&  type && isIntersection) {
        Events.stopEvent(e);
        var rParams = {};
        rParams[p1] = params['$forResource'];
        this.forResource = params['$forResource'];
        rParams[p2] = this.resource.get('_uri');
        rParams.$title = this.resource.get('davDisplayName');
        var self = this;
        if (U.isAssignableFrom(this.vocModel, "WebClass")) {
          if (type.endsWith('system/designer/InterfaceImplementor')) {
            Voc.getModels(type).done(function() {
              var m = new (U.getModel('InterfaceImplementor'))();
              var uri = self.resource.get('_uri');
              var props = {interfaceClass: uri, implementor: self.forResource};
              m.save(props, {
                success: function() {
                  self.router.navigate(U.makeMobileUrl('view', self.forResource), {trigger: true, forceFetch: true});        
                }
              });
            });
            return;
          }
          rParams[p2 + '.davClassUri'] =  this.resource.get('davClassUri');
        }
        
        this.router.navigate(U.makeMobileUrl('make', type, rParams), {trigger: true, forceFetch: true});        
//        this.router.navigate('make/' + encodeURIComponent(type) + '?' + p2 + '=' + encodeURIComponent(this.resource.get('_uri')) + '&' + p1 + '=' + encodeURIComponent(params['$forResource']) + '&' + p2 + '.davClassUri=' + encodeURIComponent(this.resource.get('davClassUri')) +'&$title=' + encodeURIComponent(this.resource.get('davDisplayName')), {trigger: true, forceFetch: true});
        return;        
      }
      if (U.isAssignableFrom(this.vocModel, "aspects/tags/Tag")) {
        var params = U.getParamMap(window.location.href);
        var app = params.application;
        var appModel;
        var tag = params['tagUses.tag.tag'];
        var tag = params['tags'];
        if (app) {
          delete params.application;
          params.$title = this.resource.get('tag');
//          params['tagUses.tag.tag'] = '*' + this.resource.get('tag') + '*';
//              params['tagUses.tag.application'] = app;
        }
        else { //if (tag  ||  tags) {
          app = this.hash;
          app = decodeURIComponent(app.substring(0, idx));
        }
        if (app) {
          appModel = U.getModel(app);
          if (appModel) {
            var tagProp = U.getCloneOf(appModel, 'Taggable.tags');
            if (tagProp) {
              params[tagProp] = '*' + this.resource.get('tag') + '*';
    
              this.router.navigate(U.makeMobileUrl('list', app, params), {trigger: true, forceFetch: true});
              return;
            }
          }
        }
      }

      if (U.isAssignableFrom(this.vocModel, "InterfaceImplementor"))
        this.router.navigate(U.makeMobileUrl('edit', this.resource.getUri()), {trigger: true, forceFetch: true});
      else {
        var pr;
//          if (!U.isA(this.vocModel, "Delegator")  ||  !(pr = U.getCloneOf(this.vocModel, "Reference.forResource")) || !pr.length)
        this.router.navigate(U.makeMobileUrl('view', this.resource.getUri()), {trigger: true, forceFetch: true});
//          else {
//            var r = U.getParamMap(window.location.href);
//            this.router.navigate('view/' + encodeURIComponent(r[pr[0]]), {trigger: true, forceFetch: true});
//          }
      }
    },
    
    render: function(options) {
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
        if (U.isA(this.vocModel, 'ImageResource')) {
          var thumb = U.getCloneOf(this.vocModel, 'ImageResource.smallImage');
          if (thumb  &&  thumb.length) {
            var img = json[thumb[0]];
            if (img)
              json['_thumb'] = img;
          }
        }
//        if (this.mvVals  &&  $.inArray(json.davDisplayName, this.mvVals) != -1)
//          json['checked'] = 'checked';
      }

      var distanceProp = U.getCloneOf(this.vocModel, 'Distance.distance')[0];
      if (distanceProp) {
        var distance = m.get(distanceProp);
        if (distance) {
          json.distance = Math.round(distance * 100) / 100;
          json.distanceUnits = 'mi';
        }
      }
      
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
      var params = this.hashParams;
      var isEdit = (params  &&  params['$edit'])  ||  U.isAssignableFrom(vocModel, G.commonTypes.WebProperty);
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
        var detached = this.resource.detached;
        json.liUri = U.makePageUrl(detached ? 'make' : 'edit', detached ? this.vocModel.type : json._uri, detached && {templateName: json.templateName, modelDavClassUri: json.modelDavClassUri, forResource: G.currentApp._uri, $title: json.$title})
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
        json.top = oW > oH ? dim.y : dim.y + (json[oH] - json[oW]) / 2;
        json.right = dim.w - dim.x;
        json.bottom = oW > oH ? dim.h - dim.y : dim.h - dim.y + (json[oH] - json[oW]) / 2;
        json.left = dim.x;
      }
      var params = this.hashParams;
      if (U.isAssignableFrom(vocModel, U.getLongUri1("media/publishing/Video"))  &&  params['-tournament'])
        json['v_submitToTournament'] = {uri: params['-tournament'], name: params['-tournamentName']};

      this.addCommonBlock(viewCols, json);

      if (this.imageProperty)
        json['image'] = json[this.imageProperty];
      
      if (!json.liUri) {
        if (json['v_submitToTournament'])
          json.liUri = U.makePageUrl(action, json._uri, {'-tournament': v_submitToTournament.uri, '-tournamentName': v_submitToTournament.name});
        else
          json.liUri = U.makePageUrl(action, json._uri);
      }  
      
      this.$el.html(this.template(json));
      return this;
    },
    
    addCommonBlock: function(viewCols, json) {
      var vocModel = this.vocModel;
      
      if (!this.commonBlockProps.length) { 
        json.viewCols = viewCols  &&  viewCols.length ? viewCols : '<div class="commonLI">' + json.davDisplayName + '</div>'; 
        return viewCols;
      }
      var isSubmission = this.resource.isA('Submission');
      if (!viewCols.length  ||  isSubmission) {
        var vCols = '';
        if (isSubmission) {
          var d = U.getCloneOf(vocModel, 'Submission.dateSubmitted');
          var dateSubmitted = d  &&  d.length ? json[d[0]] : null;
          if (dateSubmitted  &&  this.commonBlockProps.indexOf(d[0]) != -1)
            vCols += '<div class="dateLI">' + U.getFormattedDate(dateSubmitted) + '</div>';
        }
        if (viewCols.length)
          vCols += viewCols;
        else {
          var isClass = U.isAssignableFrom(vocModel, G.commonTypes.WebClass);
          vCols += '<div class="commonLI">' + json.davDisplayName;
          if (isClass) {
            var comment = json['comment'];
            if (comment) 
              vCols += '<p>' + comment + "</p>";
          }
        }
        if (isSubmission) {
          var d = U.getCloneOf(vocModel, 'Submission.submittedBy');
          var submittedBy = d  &&  d.length ? json[d[0]] : null;
          if (submittedBy  &&  this.commonBlockProps.indexOf(d[0]) != -1) {
//            vCols += '<p>' + propDn + '<a href="' + G.pageRoot + '#view/' + encodeURIComponent(submittedBy) + '">' + json[d[0] + '.displayName'] + '</p>';
            var thumb = json[d[0] + '.thumb'];
            vCols += '<div class="submitter">';
            if (thumb) {
              var idx = thumb.indexOf('/Image?url=');
              if (idx == -1)
                vCols += '<img src="' + thumb + '" />';
              else
                vCols += '<img src="' + thumb.slice(idx + 11) + '" />';
            }
//            vCols += '<span style="color: #737373; font-weight: normal; font-size: 12px; text-align: center;">' + json[d[0] + '.displayName'] + '</span></div>';
            var submitterName = json[d[0] + '.displayName'];
            if (submitterName) {
              vCols += '<div>&#160;&#160;' + submitterName + '</div>'
              vCols += '</div>';
            }
            json['_hasSubmittedBy'] = true;
          }
        }
        vCols += '</div>';
        viewCols = vCols;
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
      
      var grid = this.gridCols ? U.makeCols(res, this.gridCols) : U.getCols(res, 'grid', true);
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
  
            if (prop1.backLink) { 
              if (json[p].count) 
                json['showCount'] = p;
              continue;
            }
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
              viewCols += '<div style="display:inline"><span class="label">' + U.getPropDisplayName(prop1) + '&#160;</span><span style="font-weight:normal">' + s + '</span></div>';
            else
              viewCols += '<span style="font-weight:normal">' + s + '</span>';
            viewCols += '&#160;';
          }
          firstProp = false;
          continue;
        }
        if (prop.backLink) { 
          if (json[pName].count) 
            json['showCount'] = pName;
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
          viewCols += '<div style="display:inline"><span class="label">' + row + '&#160;</span><span style="font-weight:normal">' + s + '</span></div>';
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
      
      var oW = U.getCloneOf(vocModel, 'ImageResource.originalWidth');
      var oH = U.getCloneOf(vocModel, 'ImageResource.originalHeight');
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
        json.top = oW > oH ? dim.y : dim.y + (json[oH] - json[oW]) / 2;
        json.right = dim.w - dim.x;
        json.bottom = oW > oH ? dim.h - dim.y : dim.h - dim.y + (json[oH] - json[oW]) / 2;
//        json.top = dim.y;
//        json.right = dim.w - dim.x;
//        json.bottom = dim.h - dim.y;
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
//      var action = U.isAssignableFrom(this.vocModel, "InterfaceImplementor") ? 'edit' : 'view';
      
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
      this.addCommonBlock(viewCols, tmpl_data);
      
//      tmpl_data['viewCols'] = viewCols;
      
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

  },
  {
    displayName: 'ResourceListItemView'
  });  
  
  return RLIV;
});
