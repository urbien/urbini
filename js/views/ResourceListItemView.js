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
    tagName: "div",
    className: 'masonry-brick ' + (G.isTopcoat() ? "topcoat-list__item" : (G.isBootstrap() ? "list-group-item" : "")),
    style: {
      'min-width': '100%',
      'position': 'absolute',
      'transform-origin': '50% 50%'
    },
//    tagName: "div",
//    className: "ui-li ui-li-static ui-btn-up-c ui-first-child",
    isCommonTemplate: true,
    initialize: function(options) {
      this.listenTo(this.resource, 'remove', this.remove);
      if (this._initialized) {
        this._initializedCounter++;
        this.resource = this.model = options.resource || options.model;
        this.delegateNonDOMEvents();
        return;
      }
      
      _.bindAll(this, 'render', /*'click', 'recipeShoppingListHack',*/ 'remove'); // fixes loss of context for 'this' within methods
      BasicView.prototype.initialize.apply(this, arguments);      
      var elAttrs = this.attributes,
          classes = this.className;
      
      elAttrs["data-icon"] = "false";
      if (options.imageProperty)
        this.imageProperty = options.imageProperty;
      
      this.checked = options.checked;
//      this.listenTo(this.resource, 'saved', this.render);
      if (!this.isEdit)
        this.makeTemplate('listItemTemplate', 'template', this.vocModel.type, true); // don't fall back to default, we want to know if no template was found for this type
      
//      this.makeTemplate('likesAndComments', 'likesAndComments', this.vocModel.type);
      if (this.template) 
        this.isCommonTemplate = false;
      else {
        if (this.mv) {
          this.makeTemplate('mvListItem', 'template');
//          this.mvProp = options.mvProp;
          elAttrs["data-role"] = "controlgroup";
//          this.mvVals = options.mvVals;
        }
        else if (this.isEdit)
          this.makeTemplate('editListItemTemplate', 'template');
        else if (this.imageProperty) {
//          this.imageProperty = options.imageProperty;
          this.makeTemplate('listItemTemplate', 'template');
          if (G.isJQM()) {
            if (options.swatch)
              classes += " ui-li-up-" + options.swatch;
            else
              classes += " image_fitted ui-btn ui-li ui-li-has-thumb ui-li-static";
          }
        }
        else {
          this.makeTemplate('listItemTemplateNoImage', 'template', this.vocModel.type);
          classes += ' u-noimg';
        }
      }
      
      this.className = classes;
      if (options.swatch)
        elAttrs["data-theme"] = options.swatch;
      elAttrs['class'] = classes;
//      if (this.resource.isA("Buyable"))
//      else
//        this.$el.attr("data-icon", "chevron-right");
   
   //      this.$el.attr("class", "image_fitted ui-btn ui-li-has-arrow ui-li ui-li-has-thumb ui-first-child ui-btn-up-c");
      // resourceListView will call render on this element
  //    this.model.on('change', this.render, this);
      this.className = classes;
      this._initialized = true;
      return this;
    },
    
    reset: function() {
      this.rendered = false;
//      this.el.$empty();
      this.undelegateNonDOMEvents();
      return this;
    },
    
    events: {
//      'click': 'click',
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

//    click: function(e) {
//      Events.stopEvent(e);
//      var self = this,
//          params = U.getQueryParams(),
//          parentView = this.parentView,
//          type = params['$type'],
//          isWebCl = this.doesModelSubclass(G.commonTypes.WebClass),
//          isImplementor = type && type.endsWith('system/designer/InterfaceImplementor'),
//          cloned = this.clonedProperties;
//
//      if (this.mvProp) 
//        return;
//      if (this.doesModelSubclass('model/workflow/Alert')) {
//        Events.stopEvent(e);
//        var atype = this.resource.get('alertType');
//        var action = atype  &&  atype == 'SyncFail' ? 'edit' : 'view';   
//        Events.trigger('navigate', U.makeMobileUrl(action, this.resource.get('forum'), {'-info': this.resource.get('davDisplayName')}));//, {trigger: true, forceFetch: true});
//        return;
//      }
//      if (this.doesModelSubclass('model/social/QuizQuestion')) {
//        var title = _.getParamMap(window.location.hash).$title;
//        if (!title)
//          title = U.makeHeaderTitle(this.resource.get('davDisplayName'), pModel.displayName);
//        var prm = {
//            '-info': 'Please choose the answer', 
//            $forResource: this.resource.get('_uri'), 
//            $propA: 'question',
//            $propB: 'answer',
//            quiz: this.resource.get('quiz'),
//            question: this.resource.get('_uri'),
////            user: G.currentUser._uri,
//            $type: this.vocModel.properties['answers'].range,
//            $title: this.resource.get('davDisplayName')
//        };
//        Events.trigger('navigate', U.makeMobileUrl('chooser', this.vocModel.properties['options'].range, prm)); //, {trigger: true, forceFetch: true});
//        return;
//      }
//
//      // Setting values to TaWith does not work if this block is lower then next if()
//      var p1 = params['$propA'];
//      var p2 = params['$propB'];
//      
//      var t = type ? type : this.vocModel.type;
////      var self = this;
//      Voc.getModels(t).then(function() {
//        var type = t;
//        var isIntersection = type ? U.isA(U.getModel(type), 'Intersection') : false;
//        if (!isImplementor && parentView && parentView.mode == G.LISTMODES.CHOOSER) {
//          if (!isIntersection  &&  (!p1  &&  !p2)) {
//            debugger;
//            Events.stopEvent(e);
//            Events.trigger('chose', self.hashParams.$prop, self.model);
//            return;
//          }
//        }
//        var pModel = type ? U.getModel(type) : null;
//        if (params  &&  type  &&   p1  &&  p2/*isIntersection*/) {
//          Events.stopEvent(e);
//          var rParams = {};
//          var pRange = U.getModel(t).properties[p1].range;
//          if (U.isAssignableFrom(self.vocModel, pRange)) {
//            rParams[p1] = self.resource.get('_uri');
//            rParams[p2] = params['$forResource'];
//          }
//          else {
//            rParams[p1] = params['$forResource'];
//            rParams[p2] = self.resource.get('_uri');
//          }
//          self.forResource = params['$forResource'];
//          rParams.$title = self.resource.get('davDisplayName');
//          if (self.doesModelSubclass(G.commonTypes.WebClass)) {
//            if (type.endsWith('system/designer/InterfaceImplementor')) {
//  //            Voc.getModels(type).done(function() {
//                var m = new (U.getModel('InterfaceImplementor'))();
//                var uri = self.resource.get('_uri');
//                var props = {interfaceClass: uri, implementor: self.forResource};
//                m.save(props, {
//                  success: function() {
//                    Events.trigger('navigate', U.makeMobileUrl('view', self.forResource)); //, {trigger: true, forceFetch: true});        
//                  }
//                });
//  //            });
//              return;
//            }
//            rParams[p2 + '.davClassUri'] =  self.resource.get('davClassUri');
//          }
//          else if (U.isAssignableFrom(pModel, 'model/study/QuizAnswer')) {
//            var m = new pModel();
//            m.save(rParams, {
//              success: function() {
//                Events.trigger('navigate', U.makeMobileUrl('view', self.forResource)); //, {trigger: true, forceFetch: true});        
//              }
//            });
//            return;
//          }
//          
//          Events.trigger('navigate', U.makeMobileUrl('make', type, rParams)); //, {trigger: true, forceFetch: true});
//          return;
//  //        self.router.navigate('make/' + encodeURIComponent(type) + '?' + p2 + '=' + encodeURIComponent(self.resource.get('_uri')) + '&' + p1 + '=' + encodeURIComponent(params['$forResource']) + '&' + p2 + '.davClassUri=' + encodeURIComponent(self.resource.get('davClassUri')) +'&$title=' + encodeURIComponent(self.resource.get('davDisplayName')), {trigger: true, forceFetch: true});
//        }
//        else if (isIntersection  &&  type.indexOf('/dev/') == -1) {
//          var clonedI = cloned.Intersection;
//          var a = clonedI.a;
//          var b = clonedI.b;
//
//          if (a  &&  b) {
//            if (self.hashParams[a]) 
//              Events.trigger('navigate', U.makeMobileUrl('view', self.resource.get(b))); //, {trigger: true, forceFetch: true});
//            else if (self.hashParams[b])
//              Events.trigger('navigate', U.makeMobileUrl('view', self.resource.get(a))); //, {trigger: true, forceFetch: true});
//            else
//              dfd.reject();
////            else
////              Events.trigger('navigate', U.makeMobileUrl('view', self.resource.getUri())); //, {trigger: true, forceFetch: true});
//              
//            return;
//          } 
//        }
//        
//        return G.getRejectedPromise();        
//      }).then (
//        function success () {
//                    
//        },
//        function fail () {
//          var m = U.getModel(t); 
//          if (U.isAssignableFrom(m, "aspects/tags/Tag")) {
//            var params = _.getParamMap(window.location.href);
//            var app = params.application;
//            var appModel;
//            var tag = params['tagUses.tag.tag'];
//            var tag = params['tags'];
//            var tt = self.resource.get('tag') || U.getDisplayName(self.resource);
//            if (app) {
//              for (var p in params) {
//                if (m.properties[p])
//                  delete params[p];
//              }
//              params.$title = tt;
//    //          params['tagUses.tag.tag'] = '*' + self.resource.get('tag') + '*';
//    //              params['tagUses.tag.application'] = app;
//            }
//            else { //if (tag  ||  tags) {
//              app = self._hashInfo.type;
////              app = decodeURIComponent(app.substring(0, idx));
//            }
//            
//            if (app) {
//              appModel = U.getModel(app);
//              if (appModel) {
//                var tagProp = U.getCloneOf(appModel, 'Taggable.tags');
//                if (tagProp  &&  tt != '* Not Specified *') {
//                  params[tagProp] = '*' + tt + '*';
//        
//                  Events.trigger('navigate', U.makeMobileUrl('list', app, params));//, {trigger: true, forceFetch: true});
//                  return;
//                }
//              }
//            }
//          }
//          else if (U.isA(m, 'Reference')) {
//            var forResource = U.getCloneOf(m, 'Reference.forResource')[0];
//            var uri = forResource && self.resource.get(forResource);
//            if (uri) {
//              Events.trigger('navigate', U.makeMobileUrl('view', uri)); //, {trigger: true, forceFetch: true});
//              return;
//            }
//          }
//    
//          var action = U.isAssignableFrom(m, "InterfaceImplementor") ? 'edit' : 'view';
//          Events.trigger('navigate', U.makeMobileUrl(action, self.resource.getUri())); //, {trigger: true, forceFetch: true});
//    //          else {
//    //            var r = _.getParamMap(window.location.href);
//    //            this.router.navigate('view/' + encodeURIComponent(r[pr[0]]), {trigger: true, forceFetch: true});
//    //          }
//        }
//      );      
//    },
    
    doRender: function(options, data) {
      if (this.resource.has('_defaultValue'))
        data.defaultValue = this.resource.get('_defaultValue');
      
      var html = this.template(data, options.unlazifyImages);
      if (options && options.renderToHtml)
        this._html = this.renderHtml(html);
      else 
        this.el.$html(html);
      
      if (options && options.style)
        this.el.$css(options.style);
        
      return this;
    },
    
    render: function(options) {
      var m = this.resource,
          atts = m.attributes,
          vocModel = this.vocModel,
          meta = vocModel.properties || m.properties,
          interfaces = this['implements'],
          superclasses = this['extends'],
          cloned = this.clonedProperties,
          clonedIR = cloned.ImageResource || {};
      
      if (!meta)
        return this;
      
      options = options || {};
      var json = this.getBaseTemplateData();
      if (this.doesModelImplement('Buyable'))
        json.price = this.resource.get('Buyable.price');
      
      if (this.mvProp) {  
        json['chkId'] = G.nextId() + '.' + this.mvProp;
        if (this.checked)
          json['_checked'] = 'checked';
        if (this.doesModelImplement('ImageResource')) {
          var thumb = clonedImageProps.smallImage;
          if (thumb  &&  thumb.length) {
            var img = atts[thumb[0]];
            if (img)
              json['_thumb'] = img;
          }
        }
//        if (this.mvVals  &&  $.inArray(json.davDisplayName, this.mvVals) != -1)
//          json['checked'] = 'checked';
      }

      var distance = m.get('Distance.distance');
      if (distance) {
        json.distance = Math.round(distance * 100) / 100;
        json.distanceUnits = 'mi';
      }
      
      if (!atts._uri)
        G.log(RLIV.TAG, 'error', 'uri undefined 2', JSON.stringify(json));

//      json.shortUri = U.getShortUri(json._uri, this.vocModel);
      var urbienType = G.commonTypes.Urbien,
          isIntersection = this.doesModelImplement('Intersection') && !U.isAssignableFrom(vocModel, 'commerce/trading/TradleFeed');
      
      if (!this.mvProp && isIntersection) { // if it's a multivalue, we want the intersection resource values themselves
        var href = window.location.href;
        var qidx = href.indexOf('?');
        var clonedI = cloned.Intersection;
        var a = clonedI.a;
        var b = clonedI.b;
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
            return this.renderIntersectionItem(options, json, a, 'Intersection.a');
          var p = href.substring(qidx + 1).split('=')[0];
          if (a  &&  p == a)
            return this.renderIntersectionItem(options, json, b, 'Intersection.b');
          else if (b  &&  p == b)   
            return this.renderIntersectionItem(options, json, a, 'Intersection.a');
          if (isBContact)
            return this.renderIntersectionItem(options, json, b, 'Intersection.b');
          else          
            return this.renderIntersectionItem(options, json, a, 'Intersection.a');
        }
      }
      if (!this.isCommonTemplate) {
//        if (this.imageProperty)
//          this.el.classList.add("image_fitted");
        
        return this.doRender(options, json);
      }
      var params = this.hashParams;
      var isEdit = this.isEdit; //(params  &&  params['$edit'])  ||  U.isAssignableFrom(vocModel, G.commonTypes.WebProperty);
      var action = !isEdit ? 'view' : 'edit'; 
      if (this.doesModelSubclass(G.commonTypes.Jst)) {
        json.isJst = true;
        var text = atts.templateText;
        if (text) {
          var comments = _.getHTMLComments(text);
          if (comments && comments.length)
            json.comment = comments[0].trim();
        }
        
        if (params['modelName'])
          json.$title = U.makeHeaderTitle(params['modelName'], atts.templateName);
        
        var detached = this.resource.detached;
        json.liUri = U.makePageUrl(detached ? 'make' : 'edit', detached ? this.vocModel.type : atts._uri, detached && {templateName: atts.templateName, modelDavClassUri: atts.modelDavClassUri, forResource: G.currentApp._uri, $title: json.$title})
      }
      
      json['action'] = action;
      if (this.isEdit) {
        if (params['$editCols']) {
          json['editProp'] = params['$editCols'];
          json['editPropValue'] = atts[params['$editCols']];
        }
        else {
          json['editProp'] = 'label';
          json['editPropValue'] = atts['label'];
        }
      }

      var viewCols = this.getViewCols(json);
      var dn;
      if (this.hashParams.$createInstance == 'y')
        dn = m.get('label');
      else
        dn = U.getDisplayName(m);
      
      json.davDisplayName = dn;

      json.width = json.height = json.top = json.right = json.bottom = json.left = ""; 
      // fit image to frame
      var oW = clonedIR.originalWidth;
      var oH = clonedIR.originalHeight;
      var maxDim = this.maxImageDimension;
      var minDim = this.minImageDimension;
      var w, h;
      if (!oH  &&  !oW  &&  this.imageProperty) {
        var img = atts[this.imageProperty];
        if (img) {
          var idx = img.lastIndexOf(".");
          var dashIdx = img.indexOf('-', idx);
          if (dashIdx) {
            var u1 = img.indexOf('_', idx);
            var u2 = img.indexOf('_', dashIdx);
            if (u1  &&  u2) {
              w = img.substring(u1 + 1, dashIdx);
              h = img.substring(dashIdx + 1, u2);
            }
          }
        }
      }
      
      if (oW  &&  oH  &&  (typeof atts[oW] != 'undefined' &&  typeof  atts[oH] != 'undefined')) {
        var imgUri = atts[this.imageProperty];
        var iW = m.get(oW), iH = m.get(oH);
        if (imgUri) {
          var idx = imgUri.lastIndexOf('.jpg_');
          if (idx != -1) {
            idx += 5;
            var idx1 = imgUri.indexOf('_', idx);
            var wh = imgUri.substring(idx, idx1);
            var dash = wh.indexOf('-');
            iW = wh.substring(0, dash);
            iH = wh.substring(dash + 1);
            maxDim = 80;
          }
        }
        this.el.classList.add("image_fitted");
        
        var clip = U.clipToFrame(80, 80, iW, iH, maxDim, minDim);
        if (clip) {
          json.top = clip.clip_top;
          json.right = clip.clip_right;
          json.bottom = clip.clip_bottom;
          json.left = clip.clip_left;
        }
        else {
          var dim = U.fitToFrame(80, 80, m.get(oW) / m.get(oH));
          json.width = dim.w;
          json.height = dim.h;
          json.top = oW > oH ? dim.y : dim.y + (m.get(oH) - m.get(oW)) / 2;
          json.right = dim.w - dim.x;
          json.bottom = oW > oH ? dim.h - dim.y : dim.h - dim.y + (m.get(oH) - m.get(oW)) / 2;
          json.left = dim.x;
        }
      }
      else if (w  &&  h) {
        var clip = U.clipToFrame(80, 80, w, h, 80);
        if (clip) {
          json.top = clip.clip_top;
          json.right = clip.clip_right;
          json.bottom = clip.clip_bottom;
          json.left = clip.clip_left;
        }
      }
      
      var params = this.hashParams;
      if (this.doesModelSubclass('media/publishing/Video')  &&  params['-tournament'])
        json['v_submitToTournament'] = {uri: params['-tournament'], name: params['-tournamentName']};

      this.addCommonBlock(viewCols, json);

      if (this.imageProperty) {
        json['image'] = atts[this.imageProperty];
      }
      
      if (!json.liUri) {
        if (json['v_submitToTournament'])
          json.liUri = U.makePageUrl(action, atts._uri, {'-tournament': v_submitToTournament.uri, '-tournamentName': v_submitToTournament.name});
        else
          json.liUri = U.makePageUrl(action, atts._uri);
      }  

      return this.doRender(options, json);
    },
    
    addCommonBlock: function(viewCols, json) {
      var vocModel = this.vocModel,
          atts = this.resource.attributes,
          interfaces = this['implements'],
          superclasses = this['extends'],
          cloned = this.clonedProperties;
      
      if (!this.commonBlockProps.length) { 
        json.viewCols = viewCols  &&  viewCols.length ? viewCols : '<div class="commonLI">' + json.davDisplayName + '</div>'; 
        return viewCols;
      }
      var isSubmission = this.doesModelImplement('Submission');
      if (!viewCols.length  ||  isSubmission) {
        var vCols = '';
        if (isSubmission) {
          var d = cloned['Submission']  &&  cloned['Submission'].dateSubmitted;
          var dateSubmitted = d  &&  d.length ? atts[d[0]] : null;
          if (dateSubmitted  &&  this.commonBlockProps.indexOf(d[0]) != -1) {
            var df = this.vocModel.properties[d[0]].dateFormat;
            vCols += '<div class="dateLI">' + (df ? U.getFormattedDate2(dateSubmitted, df) : U.getFormattedDate(dateSubmitted)) + '</div>';
          }  
        }
        if (viewCols.length)
          vCols += viewCols;
        else {
          var isClass = this.doesModelSubclass(G.commonTypes.WebClass);
          vCols += '<div class="commonLI">' + json.davDisplayName;
          if (isClass) {
            var comment = json['comment'];
            if (comment) 
              vCols += '<p>' + comment + "</p>";
          }
        }
        if (isSubmission) {
          var d = cloned['Submission']  &&  cloned['Submission'].submittedBy;
          if (d  &&  !this.hashParams[d]) {
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
        }
        vCols += '</div>';
        viewCols = vCols;
      }
      var meta = vocModel.properties;
      meta = meta || m.properties;

      this.setCollaborationPointData(json, atts);
//      var comments = cloned['CollaborationPoint.comments'];
//      if (comments.length) { 
//        var pMeta = meta[comments[0]];
//        var cnt = json[pMeta.shortName] && json[pMeta.shortName].count;
//        json.v_showCommentsFor = { uri: _.encode(U.getLongUri1(atts['_uri'])), count: cnt }; //_.encode(U.getLongUri1(rUri)); // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
//      }

      this.setVotableData(json, atts);
//      if (this.doesModelImplement('isVotable')) {
//        var votes = cloned['Votable.likes'];
//        if (!votes)
//          votes = cloned['Votable.voteUse'];
//        if (votes) {
//          var pMeta = meta[votes];
//          var cnt = json[pMeta.shortName] && json[pMeta.shortName].count;
//          json.v_showVotesFor = { uri: _.encode(U.getLongUri1(atts['_uri'])), count: cnt }; //_.encode(U.getLongUri1(rUri)); // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
//        }
//      }
      
      json.viewCols = viewCols;
//      json.likesAndComments = this.$el.html(this.likesAndComments(json));
    },
    
    setCollaborationPointData: function(tmpl_data, atts) {
      var cloned = this.clonedProperties,
          cpProps = cloned.CollaborationPoint,
          meta = this.vocModel.properties;
      
      if (cpProps) {
        var comments = cpProps.comments;
        if (comments) { 
          var pMeta = meta[comments];
          var cnt = tmpl_data[pMeta.shortName] && tmpl_data[pMeta.shortName].count;
          tmpl_data.v_showCommentsFor = { uri: _.encode(U.getLongUri1(atts['_uri'])), count: cnt }; //_.encode(U.getLongUri1(rUri)); // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
        }
      }
    },
    
    setVotableData: function(tmpl_data, atts) {
      var clonedProps = this.clonedProperties,
          vProps = clonedProps.Votable;
      
      if (vProps) {
        var votes = vProps['likes'];
        if (!votes)
          votes = vProps['voteUse'];
        
        if (votes) {
          var pMeta = this.vocModel.properties[votes];
          var cnt = tmpl_data[pMeta.shortName] && tmpl_data[pMeta.shortName].count;
          tmpl_data.v_showVotesFor = { uri: _.encode(U.getLongUri1(atts['_uri'])), count: cnt }; //_.encode(U.getLongUri1(rUri)); // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
        }
      }  
    },
    
    getViewCols: function(json) {
      if (this.hashParams.$createInstance == 'y')
        return null;      

      var res = this.resource,
          atts = res.attributes,
          vocModel = res.vocModel,
          meta = this.vocModel.properties,
          viewCols = '';
      
      var grid = this.gridCols ? U.makeCols(res, this.gridCols) : U.getCols(res, 'grid', true);
      if (!grid) 
        return viewCols;
      
      var firstProp = true;
      var containerProp = this.containerProp;

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
            if (!_.has(atts, p)) //  || _.contains(gridCols, p))
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
              if (atts[p].count) 
                json['showCount'] = atts[p];
              continue;
            }
            if (first) {
              first = false;
              viewCols += '<div data-theme="d" style="padding: 5px 0 5px 0;"><i><u>' + U.getPropDisplayName(prop) + '</u></i></div>';                
            }
            
            var val = json[p] = U.makeProp(res, prop1, atts[p]);
//            var v = val.value.replace(/(<([^>]+)>)/ig, '').trim();
            var range = prop1.range;
            var s = range.indexOf('/') != -1 ? atts[p + '.displayName'] || val.value : val.value;
            var isDate = prop1.range == 'date';
            if (!prop1.skipLabelInGrid) 
              viewCols += '<div style="display:inline"><span class="label" style="color:' + G.darkColor + '">' + U.getPropDisplayName(prop1) + '&#160;</span><span style="font-weight:normal">' + s + '</span></div>';
            else
              viewCols += s.indexOf('<') == -1 ? '<span style="font-weight:normal">' + s + '</span>' : s;
            viewCols += '&#160;';
          }
          firstProp = false;
          continue;
        }
        if (prop.backLink) { 
          if (atts[pName].count) 
            json['showCount'] = atts[pName];
          continue;
        }

        var range = meta[pName].range;
        // HACK for Money
        var s = range.indexOf('/') != -1 && range != 'model/company/Money' ? atts[pName + '.displayName']  ||  atts[pName] : grid[row].value;
//        var s = grid[row].value;
        var isDate = meta[pName].range == 'date'; 
        if (!firstProp  &&  s.indexOf('<div') == -1  &&  viewCols.trim().substring(viewCols.trim().length - 6) != '</div>')
          viewCols += "<br/>";
        if (pName != 'davDisplayName'  &&  !meta[pName].skipLabelInGrid) {
//            if (isDate)
//              viewCols += '<div style="float:right;clear: both;"><span class="label">' + row + ':</span><span style="font-weight:normal">' + s + '</span></div>';
//            else
          viewCols += '<div style="display:block;"><span class="label" style="color:' + G.darkColor + '">' + row + '&#160;</span>';
          viewCols += s.indexOf('<') == -1 ? '<span style="font-weight:normal">' + s + '</span>' :  s;
          viewCols += '</div>';
        }
        else {
          var s = s.trim();
          if (firstProp)
            viewCols += s.charAt('0') != '<' ?'<span>' + s + '</span>' : s;
          else 
            viewCols += s.charAt('0') != '<' ? '<span style="font-weight:normal">' + s + '</span>' : s;
          
//            viewCols += '<span style="font-weight:normal">' + s + '</span>';
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

    renderIntersectionItem: function(options, json, delegateTo, cloneOf) {
      var m = this.resource,
          atts = m.attributes,
          vocModel = this.vocModel,
          meta = vocModel.properties,
          interfaces = this['implements'],
          superclasses = this['extends'],
          cloned = this.clonedProperties,
          clonedIR = cloned.ImageResource || {},
          clonedX = cloned.Intersection || {};
      
      if (!meta)
        return this;
      
      var oW, oH;
      var type = vocModel.type;
      var img, dn, rUri, h, w, ab, prop;
      
      if (cloneOf == 'Intersection.a') {
        prop = clonedX.a;
        if (prop instanceof Array) 
          prop = prop[0];
        
        ab = atts[prop];
        var imageP = clonedX.aThumb;
        var hasAImageProps;
        if (imageP  &&  imageP.length != 0) {
          img = atts[imageP];
          hasAImageProps = true;
        }
        if (!img) {
          imageP = clonedX.aFeatured;
          if (imageP  &&  imageP.length != 0) { 
            img = atts[imageP];
            hasAImageProps = true;
          }
        }
        if (!img  &&  !hasAImageProps  &&  this.doesModelImplement('Intersection')) {
          imageP = clonedIR.smallImage;
          if (imageP  &&  imageP.length != 0) {
            img = atts[imageP];
          }
        }
    //        img = json[U.getCloneOf(vocModel, 'Intersection.aFeatured')] || json[U.getCloneOf(vocModel, 'Intersection.aThumb')];
        oH = clonedX.aOriginalHeight;
        oW = clonedX.aOriginalWidth;
      }
      else {
        prop = clonedX.a;
        ab = atts[prop];
        var imageP = clonedX.bThumb;
        if (imageP  &&  imageP.length != 0)
          img = atts[imageP]; 
        if (!img) {
          imageP = clonedX.bFeatured;
        
          if (imageP) 
            img = atts[imageP];
        }
    //        img = json[U.getCloneOf(vocModel, 'Intersection.bThumb')] || json[U.getCloneOf(vocModel, 'Intersection.bFeatured')];
    //        img = json[U.getCloneOf(vocModel, 'Intersection.bFeatured')] || json[U.getCloneOf(vocModel, 'Intersection.bThumb')];
        oH = clonedX.bOriginalHeight;
        oW = clonedX.bOriginalWidth;
      }
      var range = meta[prop].range;
      var rm = U.getModel(U.getLongUri1(range));
      if (U.isA(rm, 'ImageResource')) {
        var rmeta = rm.properties;
        var imgP = imageP  &&  imageP.indexOf('Featured') == -1 ? U.getCloneOf(rm, 'ImageResource.smallImage') : U.getCloneOf(rm, 'ImageResource.mediumImage'); 
        maxDim = imgP  &&  rmeta[imgP].maxImageDimension;
      }
      if (img) {
        w = atts[oW];
        h = atts[oH];
      }
      if (img  &&  !this.isCommonTemplate) {
//        this.$el.addClass("image_fitted");
//        this.$el.html(this.template(json));
//        return this;
        return this.doRender(options, json);
      }
      
      json.width = json.height = json.top = json.right = json.bottom = json.left = ""; 
      // fit image to frame
      if (typeof w != 'undefined'  &&   typeof h != 'undefined') {
        
//        this.$el.addClass("image_fitted");
        
        var maxDim = this.imageProperty.maxImageDimension;
        var clip = U.clipToFrame(80, 80, m.get(oW), m.get(oH), maxDim);
        if (clip) {
          json.top = clip.clip_top;
          json.right = clip.clip_right;
          json.bottom = clip.clip_bottom;
          json.left = clip.clip_left;
          json.height = json.top + json.bottom;
        }
        else {
          var dim = U.fitToFrame(80, 80, w / h);
          json.width = dim.w;
          json.height = dim.h;
          json.top = dim.y; //w > h ? dim.y : dim.y + (atts[oH] - atts[oW]) / 2;
          json.right = dim.w - dim.x;
          json.bottom = dim.h - dim.y; ////w > h ? dim.h - dim.y : dim.h - dim.y + (atts[oH] - atts[oW]) / 2;
          json.left = dim.x;
//        json.top = dim.y;
//        json.right = dim.w - dim.x;
//        json.bottom = dim.h - dim.y;
        }
        if (w > h)
          json.mH = 80;
        else if (w <= h)
          json.mW = 80;
      }
      if (cloneOf == 'Intersection.a'  &&  this.doesModelImplement('Reference')) 
        dn = atts[cloned['Reference'].resourceDisplayName];
      else
        dn = atts[delegateTo + '.displayName'];
      
      if (type !== G.commonTypes.Handler) {
        rUri = atts[delegateTo];
        if (rUri)
          json['_uri'] = rUri;
      }
      
//      var action = U.isAssignableFrom(this.vocModel, "InterfaceImplementor") ? 'edit' : 'view';
      
//      tmpl_data['_uri'] = rUri;
      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        json['resourceMediumImage'] = img;
      }
      json['image'] = img;
      json['davDisplayName'] = dn;

      var resourceUri = G.pageRoot + '#view/' + _.encode(rUri);
        
      var viewCols = this.getViewCols(json);
      if (!viewCols)
        viewCols = dn;
      this.addCommonBlock(viewCols, json);
      
//      json['viewCols'] = viewCols;
      
      var type = rUri ? U.getTypeUri(rUri) : null;
      
      var forResourceModel = type ? U.getModel(type) : null;
      var c =  forResourceModel ? forResourceModel : m.constructor;
      if (forResourceModel) {
        var meta = c.properties;
        meta = meta || m.properties;
      }
      json['rUri'] = resourceUri;
      
//      if (U.isA(c, 'CollaborationPoint')) { 
//        var comments = U.getCloneOf(meta, 'CollaborationPoint.comments');
//        if (comments.length > 0) {
//          var pMeta = meta[comments[0]];
//          
//          json.v_showCommentsFor = _.encode(U.getLongUri1(rUri, Voc) + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
//        }
//      }
//      if (U.isA(c, 'Votable')) {
//        var votes = U.getCloneOf(meta, 'Votable.voteUse');
//        if (votes.length == 0)
//          votes = U.getCloneOf(meta, 'Votable.likes');
//        if (votes.length > 0) {
//          var pMeta = meta[votes[0]];
//          json.v_showVotesFor = _.encode(U.getLongUri1(rUri, Voc) + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
//        }
//      }  
//      var nabs = U.getCloneOf(meta, 'ImageResource.nabs');
//      if (nabs.length > 0) {
//        var pMeta = meta[nabs[0]];
//        var uri = _.encode(U.getLongUri1(rUri, Voc) + '?m_p=' + nabs[0] + '&b_p=' + pMeta.backLink);
//        json.v_showRenabFor = uri;
//      }
      
//      try {
//        this.$el.html(this.template(json));
        return this.doRender(options, json);
//      } catch (err) {
//        console.log('couldn\'t render resourceListItemView: ' + err);
//      }
//      
//      return this;
    }

  },
  {
    displayName: 'ResourceListItemView',
    preinitData: {
      interfaceProperties: {
        ImageResource: ['smallImage', 'originalWidth', 'originalHeight'],
        Intersection: ['a', 'b', 'aThumb', 'aFeatured', 'aOriginalHeight', 'aOriginalWidth', 'bThumb', 'bFeatured', 'bOriginalHeight', 'bOriginalWidth'],
        Reference: ['resourceDisplayName'],
        Submission: ['dateSubmitted', 'submittedBy'],
        CollaborationPoint: ['comments'],
        Votable: ['likes', 'voteUse'],
        Buyable: null
      },
      superclasses: _.map([
        "media/publishing/Video", 
        G.commonTypes.WebClass, 
        'model/workflow/Alert', 
        'model/study/QuizQuestion', 
        G.commonTypes.WebProperty, 
        G.commonTypes.Jst
      ], U.getLongUri1)
    },
    preinitialize: function(options) {
      var preinitData = this.preinitData,
          vocModel = options.vocModel,
          meta = vocModel.properties,
          preinit = BasicView.preinitialize.apply(this, arguments),
          cloned = preinit.prototype.clonedProperties,
          imageProperty = U.getImageProperty(vocModel),
          gridCols = U.getColsMeta(vocModel, 'grid').slice(),
          commonBlockProps = [],
          params = U.getCurrentUrlInfo().params,
          additional = {        
            gridCols: gridCols,
            commonBlockProps: commonBlockProps,
            containerProp: U.getContainerProperty(vocModel)
          };
//      ,
//          collection = options.parentView.collection;
      
      if (imageProperty) {
        additional.imageProperty = imageProperty;
        if (additional.imageProperty)
          additional.maxImageDimension = meta[additional.imageProperty].maxImageDimension;
      }
          
      if (gridCols) {
        var dateSubmitted = cloned['Submission']  &&  cloned['Submission'].dateSubmitted;
        if (dateSubmitted)
          commonBlockProps.push(dateSubmitted[0]);   
          
        var submittedBy = preinit['Submission.submittedBy'];
        if (submittedBy)
          commonBlockProps.push(submittedBy);
        
        for (var i = 0, len = commonBlockProps.length; i < len; i++) {
          var p = commonBlockProps[i];
          var idx = gridCols.indexOf(p);
          if  (idx != -1) 
            gridCols.splice(idx, 1);
          else {
            commonBlockProps.splice(i, 1);
            len--;
            i--
          }
        }
      }
            
      additional.isEdit = params['$edit']  ||  (preinit.prototype.doesModelSubclass(G.commonTypes.WebProperty) && params['$type'] != "http://www.hudsonfog.com/voc/commerce/trading/Rule");
      return preinit.extend(additional);
    }
  });  
  
  return RLIV;
});
