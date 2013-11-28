//'use strict';
define('views/ResourceMasonryItemView', [
  'globals',
  'underscore',
  'utils',
  'events',
  'views/BasicView',
  'lib/fastdom',
  'domUtils',
  'jqueryMasonry'
], function(G, _, U, Events, BasicView, Q, DOM) {
  var RMIV = BasicView.extend({
//    className: 'nab nabBoard masonry-brick',
//    className: 'pin',
//    tagName: 'li',
    
    className: 'nab masonry-brick',
    attributes: {
      style: 'position: absolute;'
    },
    tagName: 'div',
    TAG: "ResourceMasonryItemView",
    initialize: function(options) {
      if (this._initialized) {
        this.resource = this.model = options.resource || options.model;
        return;
      }
      
      _.bindAll(this, 'render', 'like', 'click'); // fixes loss of context for 'this' within methods
      BasicView.prototype.initialize.apply(this, arguments);
      
      options = options || {};
      options.vocModel = this.vocModel;
      
      var type = this.vocModel.type;
//          preinitialized = options.preinitialized || RMIV.preinitialize(options);
//      _.extend(this, preinitialized);
      var cloned = this.clonedProperties;
      var viewport = G.viewport;
      
      this.isModification = this.doesModelSubclass('system/changeHistory/Modification'); //U.isAssignableFrom(this.vocModel, U.getLongUri1('system/changeHistory/Modification'));
      if (this.isModification)
        this.makeTemplate('masonry-mod-list-item', 'template', type);
      else
        this.makeTemplate('masonry-list-item', 'template', type);

      if (viewport.height > viewport.width) {
        this.IMG_MAX_WIDTH = 272;
        vocModel = this.vocModel;
        var imgP, isBM, clonedIR = cloned.ImageResource;
        
        var ww = viewport.width;
        if (/*ww >= 320  && */ ww < 340) 
          imgP = clonedIR  &&  clonedIR['bigMedium320'];
        else  if (/*ww >= 360  &&*/  ww < 380) 
          imgP = clonedIR  &&  clonedIR['bigMedium360'];
        else if (ww <= 420) {
          imgP = clonedIR  &&  clonedIR['bigMedium400'];
//          if (ww != 400)
//            isBM = true;
        }
        
        if (!imgP) {
          imgP = clonedIR  &&  clonedIR['bigMediumImage'];
          if (imgP)
            isBM = true;
          else
            imgP = clonedIR  &&  clonedIR['mediumImage'];
        }
        else if (!isBM)
          this.IMG_MAX_WIDTH = vocModel.properties[imgP].imageWidth;
      }
      else
        this.IMG_MAX_WIDTH = 205; // value of CSS rule: ".nab .anab .galleryItem_css3 img"      // resourceListView will call render on this element
//      this.$el.attr('style', 'width:' + (this.IMG_MAX_WIDTH + 20) + 'px !important');
  //    this.model.on('change', this.render, this);
      this._initialized = true;
      return this;
    },
    
    reset: function() {
      this.rendered = false;
//      this.el.$empty();
      return this;
    },
    
    events: {
      'click .like': 'like',
      'click': 'click'
    },
    like: function(e) {
      var likeModel = U.getModel('Vote');
      if (!likeModel) 
        return;
      
      Events.stopEvent(e);
      var r = new likeModel();
      self = this;
      var props = {};
      props.vote = 'Like';
      props.votable = this.resource.getUri();
      r.save(props, {
        success: function(resource, response, options) {
          self.router.navigate(window.location.hash, options);
        }, 
        error: function(model, xhr, options) {
          var error = U.getJSON(xhr.responseText);
          if (!error) {
            self.log('error', 'couldn\'t create like item, no error info from server');
            return;
          }
          
          Errors.errDialog({msg: error.details});
          G.log(self.TAG, 'error', 'couldn\'t create like');
        }
      });      
    },
//    tap: Events.defaultTapHandler,
    click: function(e) {
//      if (this.mvProp)
//        Events.defaultClickHandler(e);  
//      else {
      if (this.mvProp) 
        return;
      if (e.target.tagName != 'A'  &&  (!e.target.className  || e.target.className.indexOf('like') == -1)) {
        var p = this.parentView;
        if (p && p.mode == G.LISTMODES.CHOOSER) {
          Events.stopEvent(e);
          Events.trigger('chooser:' + U.getQueryParams().$prop, this.model);
        }
      }
//      G.log(this.TAG, "Recording step for tour: selector = 'href'; value = '" + e.target.href);
    },
    
    doRender: function(options, data) {
      var html = this.template(data);
      if (options && options.renderToHtml) {
        var tagName = this.tagName || 'div';
        this._html = '<{0} class="{1}" {2}>{3}</{0}>'.format(tagName, this.className, DOM.toAttributesString(this.attributes), html);
//        this._html = '<{0}>{1}</{0}>'.format(tagName, html);
//        this._html = html; 
//        this._html = html;
        return this;
      }
      else
        this.el.$html(html);
    },
    
    render: function(options) {      
      if (this.isModification) 
        return this.renderModificationTile(options);
      
      if (this.doesModelImplement('Reference'))
        return this.renderReferenceTile(options);
      
      if (!this.doesModelImplement('Intersection'))   
        return this.renderTile(options);
      
      var vocModel = this.vocModel,
          viewCl = this.constructor,
          meta = vocModel.properties,
          m = this.resource,
          cloned = viewCl.clonedProperties,
          clonedXProps = cloned.Intersection;
      
      if (!meta)
        return this;
      
      var href = window.location.href;
      var qidx = href.indexOf('?');
      var a = clonedXProps['a'];
      var b = clonedXProps['b'];
      if (!a  ||  !b)
        return this.renderTile(options);
      
      if (qidx == -1) 
        return this.renderIntersectionTile(options, a, 'Intersection.a');
      var p = href.substring(qidx + 1).split('=')[0];
      if (p == a)
        return this.renderIntersectionTile(options, b, 'Intersection.b');
      else    
        return this.renderIntersectionTile(options, a, 'Intersection.a');
//        var href = window.location.href;
//        var qidx = href.indexOf('?');
//        var a = U.getCloneOf(meta, 'Intersection.a')[0];
//        var aprop;
//        if (qidx == -1) {
//          aprop = models[0].get(a);
//        }
//        else {
//          var b = U.getCloneOf(meta, 'Intersection.b')[0];
//          var p = href.substring(qidx + 1).split('=')[0];
//          var delegateTo = (p == a) ? b : a;
//          aprop = models[0].get(delegateTo);
//        }
//        var type = U.getTypeUri(U.getTypeUri(aprop['value']), {type: aprop['value']});
          
          
//      return this.renderTile();
    },  
    renderTile: function(options, event) {
      var self = this,
          m = this.resource,
          atts = m.attributes,
          vocModel = this.vocModel,
          meta = vocModel.properties,
          imgP = this.imageProperty,
          cloned = this.clonedProperties;
      
      if (!meta)
        return this;
      
      var imgWidth = meta[imgP].imageWidth;
      this.IMG_MAX_WIDTH = imgWidth ||  this.maxImageDimension;
      var rUri = m.getUri();
      if (!rUri) {
        // <debug>
        debugger;
        // </debug>
      }
      
      var tmpl_data = this.getBaseTemplateData();
        
//      var img = U.getCloneOf(vocModel, 'ImageResource.bigMediumImage')[0];
//      if (!img)
//        img = U.getCloneOf(vocModel, 'ImageResource.mediumImage')[0];

      tmpl_data.resourceMediumImage = img = atts[imgP];
      tmpl_data.imageProperty = imgP;

      var resourceUri = U.makePageUrl('view', rUri);
      var gridCols = '';
      var resourceLink;
      var i = 0;

      var grid = U.getCols(m, 'grid');
      if (grid) {
        var mediumImageProp = cloned['ImageResource'].mediumImage,
            smallImageProp = cloned['ImageResource'].smallImage;
        
        for (var row in grid) {
          if (i == 0)
            i++;
          else
            gridCols += "<br/>";

          var pName = grid[row].propertyName;
          if (pName == mediumImageProp  ||  pName == smallImageProp)
            continue;
          
          var gP = meta[pName];          
          if (!meta[pName].skipLabelInGrid)
            gridCols += '<span class="label">' + row + '</span>';
          var s = grid[row].value;
          if (grid[row].resourceLink) 
            s = '<a href="' + resourceUri + '">' + atts[pName] + '</a>';
          else if (meta[pName].facet  &&  meta[pName].facet.indexOf("/href") != -1)
            s = '<a href="' + s + '">' + s + '</a>';
  //        else if (meta[pName].range == 'date' ||  meta[pName].range == 'ComplexDate'  ||  meta[pName].range == 'dateTime')
  //          s += U.getFormattedDate(json[pName]);
          
          gridCols += s;
        }
      }
      
      var divHeight;      
      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
  //      tmpl_data = _.extend(tmpl_data, {imgSrc: img});
        var oWidth  = m.get('ImageResource.originalWidth'); //atts.originalWidth;
        var oHeight = m.get('ImageResource.originalHeight');
        if (typeof oWidth != 'undefined' && typeof oHeight != 'undefined') {
          var ratio = 1;
          if (oWidth > oHeight) {
            if (oWidth > this.IMG_MAX_WIDTH) 
              ratio = this.IMG_MAX_WIDTH / oWidth;
          }
          else {
            if (imgWidth) {
              if (oWidth > this.IMG_MAX_WIDTH)
                ratio = this.IMG_MAX_WIDTH / oWidth;
            }
            else if (oHeight > this.IMG_MAX_WIDTH) 
              ratio = this.IMG_MAX_WIDTH / oHeight;
          }
          var iW = Math.floor(oWidth * ratio);
          var iH = Math.floor(oHeight * ratio);
          tmpl_data['imgWidth'] = iW;
          tmpl_data['imgHeight'] = iH;
          var maxDim = this.maxImageDimension;
          
          if (imgWidth) {
            var idx = img.lastIndexOf('.jpg_');
            var idx1 = img.indexOf('_', idx + 5);
            if (idx != -1  &&  idx1 != -1) {
              var s = img.substring(idx + 5, idx1);
              idx = s.indexOf("-");
              if (idx != -1) {
                var w = s.substring(0, idx);
                if (w <= imgWidth) {
                  tmpl_data['width'] = s.substring(0, idx);
                  tmpl_data['height'] = s.substring(idx + 1);
                }
              }
            }
            if (tmpl_data['width'])
              maxDim = imgWidth;
          }
          if (maxDim  &&  (maxDim > this.IMG_MAX_WIDTH)) {
            var mdW, mdH;
            if (oWidth >= oHeight) {
              mdW = maxDim > oWidth ? oWidth : maxDim; 
              var r = maxDim /oWidth;
              mdH = Math.floor(oHeight * r); 
            }
            else {
              mdH = maxDim > oHeight ? oHeight : maxDim; 
              var r = maxDim /oHeight;
              mdW = Math.floor(oWidth * r); 
            }
            var dW = Math.floor((mdW - iW) / 2);
            var dH = Math.floor((mdH - iH) / 2);    
            tmpl_data['top'] = dH;
            tmpl_data['right'] = iW + dW;
            tmpl_data['bottom'] = iH + dH;
            tmpl_data['left'] = dW;
            tmpl_data['margin-top'] = 0;
            tmpl_data['margin-left'] = 0 - dW;
          }
        }
      }
      
      var dn = atts.davDisplayName;
      var dnProps = this.displayNameProps;
      if (dn)
        tmpl_data['davDisplayName'] = dn;
      
      else if (dnProps) {
        var first = true;
        dn = '';
        for (var i=0; i<dnProps.length; i++) {
          var val = atts[dnProps[i]];
          if (val) {
            if (first)
              first = false;
            else
              dn += ' ';
            dn += val;
          }  
        }
        tmpl_data['davDisplayName'] = dn;
      }
      if (!gridCols.length) 
        gridCols = '<a href="' + resourceUri + '">' + dn + '</a>';
      
      tmpl_data['gridCols'] = gridCols;
      
//      var rUri = G.pageRoot + '#view/' + _.encode(U.getLongUri1(json[imgSrc].value), snmHint);
      
      var submittedBy = cloned['Submission']  &&  cloned['Submission'].submittedBy;
      if (submittedBy) { 
        tmpl_data.creator = atts[submittedBy];
        tmpl_data.creatorDisplayName = atts[submittedBy + '.displayName'];
        tmpl_data.creatorThumb = atts[submittedBy + '.thumb'];
      }
      
      tmpl_data['rUri'] = resourceUri;
      this.setCollaborationPointData(tmpl_data, atts, rUri);
      this.setVotableData(tmpl_data, atts, rUri);
//      var comments = cloned['CollaborationPoint.comments'];
//      if (comments) { 
//        var pMeta = meta[comments];
//        comments = atts[pMeta.shortName] || {count: 0};
//        tmpl_data.v_showCommentsFor = { uri: U.getLongUri1(rUri), count: comments.count }; // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
//      }
//      
//      if (this.doesModelImplement('Votable')) {
//        var votes = cloned['Votable.likes'];
//        if (!votes)
//          votes = cloned['Votable.voteUse'];
//        
//        if (votes) {
//          var pMeta = meta[votes];
//          votes = atts[pMeta.shortName] || {count: 0};
//          tmpl_data.v_showVotesFor = { uri: U.getLongUri1(rUri), count: votes.count }; // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
//        }
//      }
      
      if (this.doesModelSubclass(G.commonTypes.App)) {
        var params = _.getParamMap(window.location.hash);
        if ((params  &&  params.$myApps)  ||  (atts.lastPublished  &&  atts.lastModifiedWebClass  && atts.lastPublished >= atts.lastModifiedWebClass) || (!atts.lastPublished  &&  atts.dashboard)) {
          var uri = G.serverName + '/' + G.pageRoot.substring(0, G.pageRoot.lastIndexOf('/') + 1) + atts.appPath;
          tmpl_data.tryApp = uri;
          tmpl_data.rUri = uri;
        }
        
        var followers = atts.appConnections || {count: 0};
        var followersCount = followers.count;
        if (followersCount) {
          tmpl_data.followersCount = followersCount;
          tmpl_data.followersUri = U.getPageUrl('list', meta.appConnections.range, {friend2: atts._uri});
        }
//        if (json['friends'].count) 
//          tmpl_data.friends = json['friends'].count;   
      }
      
      if (this.doesModelSubclass("commerce/urbien/Tournament")) 
        tmpl_data.v_submitForTournament = U.makePageUrl('list', 'media/publishing/Video', {'-tournament': rUri, '-tournamentName': dn});

      var nabs = cloned['ImageResource'].nabs;
      if (nabs) {
        var pMeta = meta[nabs];
        var uri = _.encode(U.getLongUri1(rUri) + '?m_p=' + nabs + '&b_p=' + pMeta.backLink);
        tmpl_data.v_showRenabFor = uri;
      }
      
      this.doRender(options, tmpl_data);
      if (!this.postRender) {
        this.postRender = function() {        
    //      this.$el.attr('style', 'width:' + (this.IMG_MAX_WIDTH + 20) + 'px !important;');
          var style = self.el.style,
              gItem = self.el.querySelector('.galleryItem_css3'),
              gItemImg = self.el.querySelector('.galleryItem_css3 img'),
              gItemImgStyle = gItemImg.style;
          
          style.setProperty('width', (self.IMG_MAX_WIDTH + 17) + 'px', 'important');
          if (divHeight)
            style.height = divHeight + 'px';
          else
            style.removeProperty('height');
    //      if (!tmpl_data['top'])
    //        this.$el.find('.galleryItem_css3 img').attr('style', 'max-width:' + this.IMG_MAX_WIDTH + 'px !important;');
          
          gItemImgStyle.width = tmpl_data['imgWdth'];
          gItemImgStyle.height = tmpl_data['imgHeight'];
          if (tmpl_data['top']  &&  isBM) {  
            gItem.style.height = (tmpl_data['bottom'] - tmpl_data['top']) + 'px';
            gItemImgStyle.position = 'absolute';
            gItemImgStyle[G.crossBrowser.css.transformLookup] = DOM.positionToMatrix(tmpl_data['top'], tmpl_data['left']);
//            gItemImgStyle.top = '-' + tmpl_data['top'] + 'px';
//            gItemImgStyle.left = '-' + tmpl_data['left'] + 'px'; 
            gItemImgStyle.clip = 'rect(' + tmpl_data['top'] + 'px,' + tmpl_data['right'] + 'px,' + tmpl_data['bottom'] + 'px,' + tmpl_data['left'] + 'px)';
            /*
            tmpl_data['top'] = dH;
            tmpl_data['right'] = iW + dW;
            tmpl_data['bottom'] = iH + dH;
            tmpl_data['left'] = dW;
            tmpl_data['margin-top'] = 0;
            tmpl_data['margin-left'] = 0 - dW;
            */ 
          }
        };
      }
      
      return this;
    },
    
    renderReferenceTile: function(options, event) {
      var m = this.resource,
          atts = m.attributes,
          meta = this.vocModel.properties,
          cloned = this.clonedProperties;
      
      if (!meta)
        return this;
      
//      var img = U.getCloneOf(meta, 'ImageResource.mediumImage')[0]; 
//      if (img == null)
//        img = U.getCloneOf(meta, 'ImageResource.bigMediumImage')[0];
//      if (img == null)
//      var json = m.toJSON();
      var tmpl_data = this.getBaseTemplateData();
      
      var forResource = U.getCloneOf(vocModel, 'Reference.forResource')[0];
      var resourceDisplayName = U.getCloneOf(vocModel, 'Reference.resourceDisplayName')[0];
      var forResourceUri = atts[forResource];
      if (!forResourceUri)
        return this;
      var rUri = U.getLongUri1(forResourceUri);
      
      var img = U.getCloneOf(vocModel, 'Reference.resourceImage')[0] || 
                U.getCloneOf(vocModel, 'ImageResource.mediumImage')[0];
      
      img = img && atts[img];
      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
  //      tmpl_data = _.extend(tmpl_data, {imgSrc: img});
      }
      
      var dn = atts[resourceDisplayName];
      tmpl_data['davDisplayName'] = dn;

      var resourceUri = G.pageRoot + '#view/' + _.encode(rUri);
      var resourceLink;
//      var i = 0;
      var gridCols = '<a href="' + resourceUri + '">' + dn + '</a>';
      tmpl_data['gridCols'] = gridCols;
      
//      var rUri = G.pageRoot + '#view/' + _.encode(U.getLongUri1(json[imgSrc].value), snmHint);
      var forResourceModel = U.getModel(U.getTypeUri(forResourceUri));
      var c =  forResourceModel ? forResourceModel : m.vocModel;
      tmpl_data['rUri'] = resourceUri;

      this.setCollaborationPointData(tmpl_data, atts, rUri);
//      var comments = cloned['CollaborationPoint.comments'];
//      if (comments) { 
//        var pMeta = meta[comments];
//        tmpl_data.v_showCommentsFor = { uri: U.getLongUri1(rUri), count: atts[pMeta.shortName].count }; //_.encode(U.getLongUri1(rUri)); // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
//      }
      
      this.setVotableData(tmpl_data, atts, rUri);
//      if (this.doesModelImplement('Votable')) {
//        var votes = cloned['Votable.likes'];
//        if (!votes)
//          votes = cloned['Votable.voteUse'];
//        if (votes) {
//          var pMeta = meta[votes];
//          tmpl_data.v_showVotesFor = { uri: U.getLongUri1(rUri), count: atts[pMeta.shortName].count }; //_.encode(U.getLongUri1(rUri)); // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
//        }
//      }
      
      this.setImageResourceNabsData(tmpl_data, atts, rUri);
//      var nabs = cloned['ImageResource.nabs'];
//      if (nabs) {
//        var pMeta = meta[nabs];
//        var uri = _.encode(U.getLongUri1(rUri) + '?m_p=' + nabs + '&b_p=' + pMeta.backLink);
//        tmpl_data.v_showRenabFor = uri;
//      }
      
      return this.doRender(options, tmpl_data);
    },
    
    renderIntersectionTile: function(options, delegateTo, cloneOf) {
      var m = this.resource,
          atts = m.attributes,
          vocModel = this.vocModel,
          meta = vocModel.properties,
          cloned = this.clonedProperties;
      
      if (!meta)
        return this;

      var tmpl_data = this.getBaseTemplateData(),
          img,
          dn;
      
      if (cloneOf == 'Intersection.a') {
        var aF = clonedXProps['aFeatured'];
        var aT = clonedXProps['aThumb'];
        img = aF ? atts[aF[0]] : atts[aT[0]];
      }
      else {
        var bF = clonedXProps['bFeatured'];
        var bT = clonedXProps['bThumb'];
        img = bF ? atts[bF[0]] : atts[bT[0]];
      }

      dn = atts[delegateTo];
      if (!dn) 
        return this;  
      
      var rUri = dn;
      dn = atts[delegateTo + '.displayName'] || dn;
//      var img = U.getCloneOf(meta, 'ImageResource.mediumImage')[0]; 
//      if (img == null)
//        img = U.getCloneOf(meta, 'ImageResource.bigMediumImage')[0];
//      if (img == null)
      tmpl_data.resourceMediumImage = img;

      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
  //      tmpl_data = _.extend(tmpl_data, {imgSrc: img});
      }
      
      tmpl_data['rUri'] = rUri;  
      tmpl_data['davDisplayName'] = dn;

      var resourceUri = G.pageRoot + '#view/' + _.encode(rUri);
        
      var gridCols = '<a href="' + resourceUri + '">' + dn + '</a>';
      tmpl_data['gridCols'] = gridCols;
      
//      var rUri = G.pageRoot + '#view/' + _.encode(U.getLongUri1(json[imgSrc].value), snmHint);
      var type = U.getTypeUri(rUri);
      
      var forResourceModel = type ? U.getModel(type) : null;
      var c =  forResourceModel ? forResourceModel : m.constructor;
      if (forResourceModel) {
        var meta = c.properties;
        meta = meta || m.properties;
      }
      
      tmpl_data['rUri'] = resourceUri;
      this.setCollaborationPointData(tmpl_data, atts, rUri);
      this.setVotableData(tmpl_data, atts, rUri);
      this.setImageResourceNabsData(tmpl_data, atts, rUri);
      return this.doRender(options, tmpl_data);      
    },
    
    setVotableData: function(tmpl_data, atts, rUri) {
      var meta = this.vocModel.properties, 
          cloned = this.clonedProperties,
          vProps = cloned.Votable;
      
      if (vProps) {
        var votes = vProps.likes;
        if (!votes)
          votes = vProps.voteUse;
        
        if (votes) {
          var pMeta = meta[votes];
          votes = atts[pMeta.shortName] || {count: 0};
          tmpl_data.v_showVotesFor = { 
            uri: U.getLongUri1(rUri), count: votes.count 
          }; //_.encode(U.getLongUri1(rUri)); // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
        }
      }  
    },

    setImageResourceNabsData: function(tmpl_data) {
      var cloned = this.clonedProperties,
          nabs = cloned['ImageResource'].nabs;
      
      if (nabs) {
        var pMeta = meta[nabs];
        var uri = _.encode(U.getLongUri1(rUri) + '?m_p=' + nabs + '&b_p=' + pMeta.backLink);
        tmpl_data.v_showRenabFor = uri;
      }
    },
    
    setCollaborationPointData: function(tmpl_data, atts, rUri) {
      var cloned = this.clonedProperties,
          cpProps = cloned.CollaborationPoint;
      
      if (cpProps) {
        var comments = cpProps.comments,
            meta = this.vocModel.properties;
        
        if (comments) {
          var pMeta = meta[comments];
          comments = atts[pMeta.shortName] || {count: 0};
          tmpl_data.v_showCommentsFor = { uri: U.getLongUri1(rUri), count: comments.count }; //_.encode(U.getLongUri1(rUri)); // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
        }
      }
    },
    
    renderModificationTile: function(options, event) {
      var meta = this.vocModel.properties,
          res = this.resource,
          atts = res.attributes,
          viewport = G.viewport;
      
      if (!meta)
        return this;
      
//      var json = this.resource.toJSON();
      var tmpl_data = this.getBaseTemplateData();
      var imgSrc = atts.v_imgSrc || 'forResource'; // what is this?
      if (typeof atts[imgSrc] == 'undefined')
        return this;
      
      var rUri = tmpl_data.rUri = U.makePageUrl('view', U.getLongUri1(atts[imgSrc]));
      var modBy = U.makePageUrl('view', U.getLongUri1(atts.modifiedBy));

      _.extend(tmpl_data, _.pick(atts, 'modifiedBy', 'resourceDisplayName', 'resourceMediumImage', 'dateModified', 'v_modifiedByPhoto'))
      var isHorizontal = this.isLandscape();
  //    alert(isHorizontal);
      var img = atts.resourceMediumImage;
      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
  //      tmpl_data = _.extend(tmpl_data, {imgSrc: img});
      }
      
      var commentsFor = atts.v_showCommentsFor;
      if (typeof commentsFor != 'undefined'  &&  atts[commentsFor])
        tmpl_data['v_showCommentsFor'] = res.get(commentsFor); // returns long uri
//        tmpl_data['v_showCommentsFor'] = U.getLongUri1(atts[commentsFor]); // + '&m_p=comments&b_p=forum');
      
  
      var votesFor = atts.v_showVotesFor;
      if (typeof votesFor != 'undefined'  &&  atts[votesFor]) 
        tmpl_data['v_showVotesFor'] = res.get(votesFor); //+ '&m_p=votes&b_p=votable');
//        tmpl_data['v_showVotesFor'] = U.getLongUri1(atts[votesFor]); //+ '&m_p=votes&b_p=votable');

      var renabFor = atts.v_showRenabFor;
      if (typeof renabFor != 'undefined'  &&  atts[renabFor]) 
        tmpl_data.v_showRenabFor = _.encode(res.get(renabFor) + '&m_p=nabs&b_p=forResource');
      
      // set size of images included in the items to be able
      // to start masonry code before images downloading
      var oWidth  = atts.originalWidth;
      var oHeight = atts.originalHeight;
      if (typeof oWidth != 'undefined' && typeof oHeight != 'undefined') {
        var ratio = (oWidth > this.IMG_MAX_WIDTH) ? this.IMG_MAX_WIDTH / oWidth : 1;
        tmpl_data.imgWidth = Math.floor(oWidth * ratio);
        tmpl_data.imgHeight = Math.floor(oHeight * ratio);
      }
      
      return this.doRender(options, tmpl_data);
    }
  }, {
    displayName: 'ResourceMasonryItemView',
    preinitData: {
      interfaceProperties: {
        ImageResource: ['bigMedium320', 'bigMedium360', 'bigMedium400', 'bigMediumImage', 'mediumImage', 'nabs'],
        Intersection: ['a', 'b', 'aThumb', 'aFeatured', 'aOriginalHeight', 'aOriginalWidth', 'bThumb', 'bFeatured', 'bOriginalHeight', 'bOriginalWidth'],
        Reference: ['resourceDisplayName'],
        Submission: ['dateSubmitted', 'submittedBy'],
        CollaborationPoint: ['comments'],
        Votable: ['likes', 'voteUse'],
        Buyable: null
      },
      superclasses: _.map(["commerce/urbien/Tournament", 'system/changeHistory/Modification', G.commonTypes.App], U.getLongUri1)
    },
    
    preinitialize: function(options) {
      var preinitData = this.preinitData,
          vocModel = options.vocModel,
          meta = vocModel.properties,
          preinit = BasicView.preinitialize.apply(this, arguments),
//          cloned = preinit.prototype.clonedProperties,
          imageProperty = U.getImageProperty(vocModel),
          more = {};
          
      if (imageProperty) {
        more.imageProperty = imageProperty;
        if (more.imageProperty)
          more.maxImageDimension = meta[imageProperty].maxImageDimension;
      }
      
      more.displayNameProps = U.getDisplayNameProps(vocModel);
      return preinit.extend(more);
    }
  });
  
  return RMIV;
});
