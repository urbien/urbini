//'use strict';
define('views/ResourceMasonryItemView', [
  'globals',
  'underscore',
  'utils',
  'events',
  'views/BasicView',
  'jqueryMasonry'
], function(G, _, U, Events, BasicView) {
  return BasicView.extend({
//    className: 'nab nabBoard masonry-brick',
//    className: 'pin',
//    tagName: 'li',
    
    TAG: "ResourceMasonryItemView",
    initialize: function(options) {
      _.bindAll(this, 'render', 'like', 'click'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      var type = this.vocModel.type;
      this.isModification = U.isAssignableFrom(this.vocModel, U.getLongUri1('system/changeHistory/Modification'));

      if (this.isModification)
        this.makeTemplate('masonry-mod-list-item', 'modTemplate', type);
      else
        this.makeTemplate('masonry-list-item', 'template', type);

      if ($(window).height() > $(window).width())
        this.IMG_MAX_WIDTH = 272;
      else
        this.IMG_MAX_WIDTH = 205; // value of CSS rule: ".nab .anab .galleryItem_css3 img"      // resourceListView will call render on this element
//      this.$el.attr('style', 'width:' + (this.IMG_MAX_WIDTH + 20) + 'px !important');
  //    this.model.on('change', this.render, this);
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
      G.log(this.TAG, "Recording step for tour: selector = 'href'; value = '" + e.target.href);
    },
    render: function(options) {
      var vocModel = this.vocModel;
      if (this.isModification) 
        return this.renderModificationTile();
      var m = this.resource;
      var isReference = m.isA('Reference'); 
      if (isReference)
        return this.renderReferenceTile();
      if (!m.isA('Intersection'))   
        return this.renderTile();
      
      var meta = vocModel.properties;
      if (!meta)
        return this;
      
      var href = window.location.href;
      var qidx = href.indexOf('?');
      var a = U.getCloneOf(vocModel, 'Intersection.a')[0];
      var b = U.getCloneOf(vocModel, 'Intersection.b')[0];
      if (!a  ||  !b)
        return this.renderTile();
      if (qidx == -1) 
        return this.renderIntersectionTile(a, 'Intersection.a');
      var p = href.substring(qidx + 1).split('=')[0];
      if (p == a)
        return this.renderIntersectionTile(b, 'Intersection.b');
      else    
        return this.renderIntersectionTile(a, 'Intersection.a');
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
    renderTile: function(event) {
      var m = this.resource,
          atts = m.attributes,
          vocModel = this.vocModel,
          meta = vocModel.properties;
      
      if (!meta)
        return this;
      
      var imgP;
      if ($(window).width() > $(window).height()) {
        imgP = U.getCloneOf(vocModel, 'ImageResource.mediumImage')[0];
        if (!imgP)
          imgP = U.getCloneOf(vocModel, 'ImageResource.bigMediumImage')[0];
      }
      else {
        imgP = U.getCloneOf(vocModel, 'ImageResource.bigMediumImage')[0];
        if (!imgP)
          imgP = U.getCloneOf(vocModel, 'ImageResource.mediumImage')[0];
      }

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
      tmpl_data.resourceMediumImage = img = atts[img];
      tmpl_data.imageProperty = img;

      var resourceUri = U.makePageUrl('view', rUri);
      var gridCols = '';
      var resourceLink;
      var i = 0;

      var grid = U.getCols(m, 'grid');
      if (grid) {
        for (var row in grid) {
          if (i == 0)
            i++;
          else
            gridCols += "<br/>";

          var pName = grid[row].propertyName;
          var gP = meta[pName];          
          if (U.isCloneOf(gP, "ImageResource.mediumImage", vocModel)  ||  U.isCloneOf(gP, "ImageResource.smallImage", vocModel))
            continue;
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
          var ratio = (oWidth > this.IMG_MAX_WIDTH) ? this.IMG_MAX_WIDTH / oWidth : 1;
          var iW = Math.floor(oWidth * ratio);
          var iH = Math.floor(oHeight * ratio);
          tmpl_data['imgWidth'] = iW;
          tmpl_data['imgHeight'] = iH;
          var maxDim = meta[imgP].maxImageDimension;
          
          if (maxDim  &&  (maxDim > this.IMG_MAX_WIDTH)) {
            var mdW, mdH;
            if (oWidth >= oHeight) {
              mdW = maxDim; 
              var r = maxDim /oWidth;
              mdH = Math.floor(oHeight * r); 
            }
            else {
              mdH = maxDim; 
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
      var dnProps = U.getDisplayNameProps(meta);
      if (!dn  &&  dnProps) {
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
      
      if (m.isA('Submission')) { 
        var submittedBy = U.getCloneOf(vocModel, 'Submission.submittedBy')[0];
        if (submittedBy) {
          tmpl_data.creator = atts[submittedBy];
          tmpl_data.creatorDisplayName = atts[submittedBy + '.displayName'];
          tmpl_data.creatorThumb = atts[submittedBy + '.thumb'];
        }
      }
      
      tmpl_data['rUri'] = resourceUri;
      if (m.isA('CollaborationPoint')) { 
        var comments = U.getCloneOf(vocModel, 'CollaborationPoint.comments');
        if (comments.length > 0) {
          var pMeta = meta[comments[0]];
          comments = atts[pMeta.shortName] || {count: 0};
          tmpl_data.v_showCommentsFor = { uri: U.getLongUri1(rUri), count: comments.count }; // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
        }
      }
      if (m.isA('Votable')) {
        var votes = U.getCloneOf(vocModel, 'Votable.likes');
        if (votes.length == 0)
          votes = U.getCloneOf(vocModel, 'Votable.voteUse');
        if (votes.length > 0) {
          var pMeta = meta[votes[0]];
          votes = atts[pMeta.shortName] || {count: 0};
          tmpl_data.v_showVotesFor = { uri: U.getLongUri1(rUri), count: votes.count }; // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
        }
      }
      
      if (U.isAssignableFrom(vocModel, G.commonTypes.App)) {
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
      if (U.isAssignableFrom(vocModel, U.getLongUri1("commerce/urbien/Tournament"))) 
        tmpl_data.v_submitForTournament = G.pageRoot + "#media%2fpublishing%2fVideo?-tournament=" + encodeURIComponent(rUri) + '&-tournamentName=' + encodeURIComponent(dn);

      var nabs = U.getCloneOf(vocModel, 'ImageResource.nabs');
      if (nabs.length > 0) {
        var pMeta = meta[nabs[0]];
        var uri = _.encode(U.getLongUri1(rUri) + '?m_p=' + nabs[0] + '&b_p=' + pMeta.backLink);
        tmpl_data.v_showRenabFor = uri;
      }
      
      try {
        this.$el.html(this.template(tmpl_data));
      } catch (err) {
        G.log(this.TAG, 'failed to build template for masonry item ' + dn + ': ' + err);
      }
//      this.$el.attr('style', 'width:' + (this.IMG_MAX_WIDTH + 20) + 'px !important;');
      this.$el.attr('style', 'width:' + (this.IMG_MAX_WIDTH + 17) + 'px !important;' + (divHeight ? 'height:' +  divHeight + 'px;' : ''));
//      if (!tmpl_data['top'])
//        this.$el.find('.galleryItem_css3 img').attr('style', 'max-width:' + this.IMG_MAX_WIDTH + 'px !important;');
      if (tmpl_data['top']) {
        this.$el.find('.galleryItem_css3').attr('style', 'height:' + (tmpl_data['bottom'] - tmpl_data['top']) + 'px;'); 
        this.$el.find('.galleryItem_css3 img').attr('style', 'position:absolute; top: -' + tmpl_data['top'] + 'px;left: -' + tmpl_data['left'] + 'px; clip: rect(' + tmpl_data['top'] + 'px,' + tmpl_data['right'] + 'px,' + tmpl_data['bottom'] + 'px,' + tmpl_data['left'] + 'px)');
        /*
        tmpl_data['top'] = dH;
        tmpl_data['right'] = iW + dW;
        tmpl_data['bottom'] = iH + dH;
        tmpl_data['left'] = dW;
        tmpl_data['margin-top'] = 0;
        tmpl_data['margin-left'] = 0 - dW;
        */ 
      }
      return this;
    },
    
    renderReferenceTile: function(event) {
      var m = this.resource,
          atts = m.attributes,
          meta = this.vocModel.properties;
      
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
      if (U.isA(c, 'CollaborationPoint')) { 
        var comments = U.getCloneOf(vocModel, 'CollaborationPoint.comments');
        if (comments.length > 0) {
          var pMeta = meta[comments[0]];
          tmpl_data.v_showCommentsFor = { uri: U.getLongUri1(rUri), count: atts[pMeta.shortName].count }; //_.encode(U.getLongUri1(rUri)); // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
        }
      }
      if (U.isA(c, 'Votable')) {
        var votes = U.getCloneOf(vocModel, 'Votable.likes');
        if (votes.length == 0)
          votes = U.getCloneOf(vocModel, 'Votable.voteUse');
        if (votes.length > 0) {
          var pMeta = meta[votes[0]];
          tmpl_data.v_showVotesFor = { uri: U.getLongUri1(rUri), count: atts[pMeta.shortName].count }; //_.encode(U.getLongUri1(rUri)); // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
        }
      }  
      var nabs = U.getCloneOf(vocModel, 'ImageResource.nabs');
      if (nabs.length > 0) {
        var pMeta = meta[nabs[0]];
        var uri = _.encode(U.getLongUri1(rUri) + '?m_p=' + nabs[0] + '&b_p=' + pMeta.backLink);
        tmpl_data.v_showRenabFor = uri;
      }
      
      try {
        this.$el.html(this.template(tmpl_data));
      } catch (err) {
        G.log(this.TAG, "error", "failed to render ResourceMansonryItemView reference tile");
      }
      
      return this;
    },
    renderIntersectionTile: function(delegateTo, cloneOf) {
      var m = this.resource,
          atts = m.attributes,
          vocModel = this.vocModel,
          meta = vocModel.properties;
      
      if (!meta)
        return this;

      var tmpl_data = this.getBaseTemplateData(),
          img,
          dn;
      
      if (cloneOf == 'Intersection.a') {
        var aF = U.getCloneOf(vocModel, 'Intersection.aFeatured');
        var aT = U.getCloneOf(vocModel, 'Intersection.aThumb');
        img = aF ? atts[aF[0]] : atts[aT[0]];
      }
      else {
        var bF = U.getCloneOf(vocModel, 'Intersection.bFeatured');
        var bT = U.getCloneOf(vocModel, 'Intersection.bThumb');
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
      if (m.isA('CollaborationPoint')) { 
        var comments = U.getCloneOf(vocModel, 'CollaborationPoint.comments');
        if (comments.length > 0) {
          var pMeta = meta[comments[0]];          
          tmpl_data.v_showCommentsFor = { uri: U.getLongUri1(rUri), count: atts[pMeta.shortName].count }; //_.encode(U.getLongUri1(rUri)); // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
        }
      }
      if (U.isA(c, 'Votable')) {
        var votes = U.getCloneOf(vocModel, 'Votable.likes');
        if (votes.length == 0)
          votes = U.getCloneOf(vocModel, 'Votable.voteUse');
        if (votes.length > 0) {
          var pMeta = meta[votes[0]];
          tmpl_data.v_showVotesFor = { uri: U.getLongUri1(rUri), count: atts[pMeta.shortName].count }; //_.encode(U.getLongUri1(rUri)); // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
        }
      }  
      var nabs = U.getCloneOf(vocModel, 'ImageResource.nabs');
      if (nabs.length > 0) {
        var pMeta = meta[nabs[0]];
        var uri = _.encode(U.getLongUri1(rUri) + '?m_p=' + nabs[0] + '&b_p=' + pMeta.backLink);
        tmpl_data.v_showRenabFor = uri;
      }
      
      try {
        this.$el.html(this.template(tmpl_data));
      } catch (err) {
        G.log(this.TAG, "error", "failed to render ResourceMansonryItemView intersection tile");
      }
      
      return this;
    },
    renderModificationTile: function(event) {
      var meta = this.vocModel.properties,
          res = this.resource,
          atts = res.attributes;
      
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
      var isHorizontal = ($(window).height() < $(window).width());
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
      
      try {
        this.$el.html(this.modTemplate(tmpl_data));
      } catch (err) {
        // <debug>
        debugger;
        G.log(this.TAG, 'failed to build masonry item for Modification resource ' + atts.resourceDisplayName + ': ' + err);
        // </debug>
      }
      
      return this;
    }
  }, {
    displayName: 'ResourceMasonryItemView'
  });
});
