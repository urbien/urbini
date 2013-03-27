//'use strict';
define([
  'globals',
  'jquery',
  'underscore',
  'utils',
  'events',
  'views/BasicView',
  'jqueryMasonry',
  'jqueryImagesloaded'
], function(G, $, _, U, Events, BasicView) {
  return BasicView.extend({
//    className: 'nab nabBoard masonry-brick',
//    className: 'pin',
//    tagName: 'li',
    
    TAG: "ResourceMasonryItemView",
    initialize: function(options) {
      _.bindAll(this, 'render', 'like', 'click'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate('masonry-list-item', 'template', this.vocModel.type);
      this.makeTemplate('masonry-mod-list-item', 'modTemplate', this.vocModel.type);

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
          var json;
          try {
            json = JSON.parse(xhr.responseText).error;
          } catch (err) {
            G.log(self.TAG, 'error', 'couldn\'t create like item, no error info from server');
            return;
          }
          
          Errors.errDialog({msg: json.details});
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
    },
    render: function() {
      try {
        return this.renderHelper.apply(this, arguments);
      } finally {
        this.finish();
      }
    },
    renderHelper: function(event) {
      var vocModel = this.vocModel;
      var isModification = U.isAssignableFrom(vocModel, U.getLongUri1('system/changeHistory/Modification'));
      if (isModification) 
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
      var m = this.resource;
      var vocModel = this.vocModel;
      var meta = vocModel.properties;
      if (!meta)
        return this;
      
      var img;
//      if ($(window).width() > $(window).height()) {
//        img = U.getCloneOf(vocModel, 'ImageResource.mediumImage')[0];
//        if (!img)
//          img = U.getCloneOf(vocModel, 'ImageResource.bigMediumImage')[0];
//      }
//      else {
        img = U.getCloneOf(vocModel, 'ImageResource.bigMediumImage')[0];
        if (!img)
          img = U.getCloneOf(vocModel, 'ImageResource.mediumImage')[0];
      var json = m.toJSON();
      
      var rUri = m.getUri();
      if (!rUri)
        debugger;
        
//      var img = U.getCloneOf(vocModel, 'ImageResource.bigMediumImage')[0];
//      if (!img)
//        img = U.getCloneOf(vocModel, 'ImageResource.mediumImage')[0];
      img = json[img];
      var tmpl_data = _.extend(json, {resourceMediumImage: img});

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
            s = '<a href="' + resourceUri + '">' + json[pName] + '</a>';
          else if (meta[pName].facet  &&  meta[pName].facet.indexOf("/href") != -1)
            s = '<a href="' + s + '">' + s + '</a>';
  //        else if (meta[pName].range == 'date' ||  meta[pName].range == 'ComplexDate'  ||  meta[pName].range == 'dateTime')
  //          s += U.getFormattedDate(json[pName]);
          
          gridCols += s;
        }
      }
      
      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
  //      tmpl_data = _.extend(tmpl_data, {imgSrc: img});
        var oWidth  = json.originalWidth;
        var oHeight = json.originalHeight;
        if (typeof oWidth != 'undefined' && typeof oHeight != 'undefined') {
          var ratio = (oWidth > this.IMG_MAX_WIDTH) ? this.IMG_MAX_WIDTH / oWidth : 1;
          tmpl_data['imgWidth'] = Math.floor(oWidth * ratio);
          tmpl_data['imgHeight'] = Math.floor(oHeight * ratio);
        }

      }
      var dn = json.davDisplayName;
      var dnProps = U.getDisplayNameProps(meta);
      if (!dn  &&  dnProps) {
        var first = true;
        dn = '';
        for (var i=0; i<dnProps.length; i++) {
          var val = json[dnProps[i]];
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
      
//      var rUri = G.pageRoot + '#view/' + U.encode(U.getLongUri1(json[imgSrc].value), snmHint);
      
      if (m.isA('Submission')) { 
        var submittedBy = U.getCloneOf(vocModel, 'Submission.submittedBy');
        if (submittedBy.length) {
          tmpl_data.creator = json[submittedBy[0]];
          tmpl_data.creatorDisplayName = json[submittedBy[0] + '.displayName'];
          tmpl_data.creatorThumb = json[submittedBy[0] + '.thumb'];
        }
      }
      
      tmpl_data['rUri'] = resourceUri;
      if (m.isA('CollaborationPoint')) { 
        var comments = U.getCloneOf(vocModel, 'CollaborationPoint.comments');
        if (comments.length > 0) {
          var pMeta = meta[comments[0]];
          comments = json[pMeta.shortName] || {count: 0};
          tmpl_data.v_showCommentsFor = { uri: U.encode(U.getLongUri1(rUri)), count: comments.count }; // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
        }
      }
      if (m.isA('Votable')) {
        var votes = U.getCloneOf(vocModel, 'Votable.likes');
        if (votes.length == 0)
          votes = U.getCloneOf(vocModel, 'Votable.voteUse');
        if (votes.length > 0) {
          var pMeta = meta[votes[0]];
          votes = json[pMeta.shortName] || {count: 0};
          tmpl_data.v_showVotesFor = { uri: U.encode(U.getLongUri1(rUri)), count: votes.count }; // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
        }
      }
      
      if (U.isAssignableFrom(vocModel, G.commonTypes.App)) {
        var params = U.getParamMap(window.location.hash);
        if ((params  &&  params.$myApps)  ||  (json.lastPublished  &&  json.lastModifiedWebClass  && json.lastPublished >= json.lastModifiedWebClass) || (!json.lastPublished  &&  json.dashboard)) {
          var uri = G.serverName + '/' + G.pageRoot.substring(0, G.pageRoot.lastIndexOf('/') + 1) + json.appPath;
          tmpl_data.tryApp = uri;
          tmpl_data.rUri = uri;
        }
        
        var followers = json.appConnections || {count: 0};
        var followersCount = followers.count;
        if (followersCount) {
          tmpl_data.followersCount = followersCount;
          tmpl_data.followersUri = U.getPageUrl('list', meta.appConnections.range, {friend2: json._uri});
        }
//        if (json['friends'].count) 
//          tmpl_data.friends = json['friends'].count;   
      }
      if (U.isAssignableFrom(vocModel, U.getLongUri1("commerce/urbien/Tournament"))) 
        tmpl_data.v_submitForTournament = G.pageRoot + "#media%2fpublishing%2fVideo?-tournament=" + encodeURIComponent(rUri) + '&-tournamentName=' + encodeURIComponent(dn);

      var nabs = U.getCloneOf(vocModel, 'ImageResource.nabs');
      if (nabs.length > 0) {
        var pMeta = meta[nabs[0]];
        var uri = U.encode(U.getLongUri1(rUri) + '?m_p=' + nabs[0] + '&b_p=' + pMeta.backLink);
        tmpl_data.v_showRenabFor = uri;
      }
      
      try {
        this.$el.html(this.template(tmpl_data));
      } catch (err) {
        G.log(this.TAG, 'failed to build template for masonry item ' + dn + ': ' + err);
      }
      
      return this;
    },
    
    renderReferenceTile: function(event) {
      var m = this.resource;
      var meta = this.vocModel.properties;
      if (!meta)
        return this;
      
//      var img = U.getCloneOf(meta, 'ImageResource.mediumImage')[0]; 
//      if (img == null)
//        img = U.getCloneOf(meta, 'ImageResource.bigMediumImage')[0];
//      if (img == null)
      var json = m.toJSON();
      
      var forResource = U.getCloneOf(vocModel, 'Reference.forResource')[0];
      var resourceDisplayName = U.getCloneOf(vocModel, 'Reference.resourceDisplayName')[0];
      var forResourceUri = json[forResource];
      if (!forResourceUri)
        return this;
      var rUri = U.getLongUri1(forResourceUri);
      
      var img = U.getCloneOf(vocModel, 'Reference.resourceImage')[0];
      if (!img)
        img = U.getCloneOf(vocModel, 'ImageResource.mediumImage')[0];
      img = json[img];
      var tmpl_data = _.extend(json, {resourceMediumImage: img});

      var resourceUri = G.pageRoot + '#view/' + U.encode(rUri);
      var resourceLink;
      var i = 0;

      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
  //      tmpl_data = _.extend(tmpl_data, {imgSrc: img});
      }
      var dn = json[resourceDisplayName];
      tmpl_data['davDisplayName'] = dn;
        
      var gridCols = '<a href="' + resourceUri + '">' + dn + '</a>';
      tmpl_data['gridCols'] = gridCols;
      
//      var rUri = G.pageRoot + '#view/' + U.encode(U.getLongUri1(json[imgSrc].value), snmHint);
      var forResourceModel = U.getModel(U.getTypeUri(forResourceUri));
      var c =  forResourceModel ? forResourceModel : m.vocModel;
      tmpl_data['rUri'] = resourceUri;
      if (U.isA(c, 'CollaborationPoint')) { 
        var comments = U.getCloneOf(vocModel, 'CollaborationPoint.comments');
        if (comments.length > 0) {
          var pMeta = meta[comments[0]];
          tmpl_data.v_showCommentsFor = { uri: U.encode(U.getLongUri1(rUri)), count: json[pMeta.shortName].count }; //U.encode(U.getLongUri1(rUri)); // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
        }
      }
      if (U.isA(c, 'Votable')) {
        var votes = U.getCloneOf(vocModel, 'Votable.likes');
        if (votes.length == 0)
          votes = U.getCloneOf(vocModel, 'Votable.voteUse');
        if (votes.length > 0) {
          var pMeta = meta[votes[0]];
          tmpl_data.v_showVotesFor = { uri: U.encode(U.getLongUri1(rUri)), count: json[pMeta.shortName].count }; //U.encode(U.getLongUri1(rUri)); // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
        }
      }  
      var nabs = U.getCloneOf(vocModel, 'ImageResource.nabs');
      if (nabs.length > 0) {
        var pMeta = meta[nabs[0]];
        var uri = U.encode(U.getLongUri1(rUri) + '?m_p=' + nabs[0] + '&b_p=' + pMeta.backLink);
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
      var m = this.resource;
      var meta = this.vocModel.properties;
      if (!meta)
        return this;
      
      var img;
      var json = m.toJSON();
      if (cloneOf == 'Intersection.a') {
        var aF = U.getCloneOf(vocModel, 'Intersection.aFeatured');
        var aT = U.getCloneOf(vocModel, 'Intersection.aThumb');
        img = aF ? json[aF[0]] : json[aT[0]];
      }
      else {
        var bF = U.getCloneOf(vocModel, 'Intersection.bFeatured');
        var bT = U.getCloneOf(vocModel, 'Intersection.bThumb');
        img = bF ? json[bF[0]] : json[bT[0]];
      }
      var dn = json[delegateTo];
      if (!dn) 
        return this;  
      
      var rUri = dn;
      dn = json[delegateTo + '.displayName'] || dn;
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
      tmpl_data['rUri'] = rUri;  
      tmpl_data['davDisplayName'] = dn;

      var resourceUri = G.pageRoot + '#view/' + U.encode(rUri);
        
      var gridCols = '<a href="' + resourceUri + '">' + dn + '</a>';
      tmpl_data['gridCols'] = gridCols;
      
//      var rUri = G.pageRoot + '#view/' + U.encode(U.getLongUri1(json[imgSrc].value), snmHint);
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
          tmpl_data.v_showCommentsFor = { uri: U.encode(U.getLongUri1(rUri)), count: json[pMeta.shortName].count }; //U.encode(U.getLongUri1(rUri)); // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
        }
      }
      if (U.isA(c, 'Votable')) {
        var votes = U.getCloneOf(vocModel, 'Votable.likes');
        if (votes.length == 0)
          votes = U.getCloneOf(vocModel, 'Votable.voteUse');
        if (votes.length > 0) {
          var pMeta = meta[votes[0]];
          tmpl_data.v_showVotesFor = { uri: U.encode(U.getLongUri1(rUri)), count: json[pMeta.shortName].count }; //U.encode(U.getLongUri1(rUri)); // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
        }
      }  
      var nabs = U.getCloneOf(vocModel, 'ImageResource.nabs');
      if (nabs.length > 0) {
        var pMeta = meta[nabs[0]];
        var uri = U.encode(U.getLongUri1(rUri) + '?m_p=' + nabs[0] + '&b_p=' + pMeta.backLink);
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
      var meta = this.vocModel.properties;
      if (!meta)
        return this;
      
      var json = this.resource.toJSON();
      var imgSrc = json.v_imgSrc;
      if (!imgSrc)
        imgSrc = 'forResource';
      if (typeof json[imgSrc] == 'undefined')
        return this;
      
      var rUri = G.pageRoot + '#view/' + U.encode(U.getLongUri1(json[imgSrc]));
      var tmpl_data = _.extend(json, {rUri: rUri});
  
      var modBy = G.pageRoot + '#view/' + U.encode(U.getLongUri1(json.modifiedBy));
      tmpl_data.modifiedBy = modBy;
      var isHorizontal = ($(window).height() < $(window).width());
  //    alert(isHorizontal);
      var img = json.resourceMediumImage;
      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
  //      tmpl_data = _.extend(tmpl_data, {imgSrc: img});
      }
      
      var commentsFor = tmpl_data.v_showCommentsFor;
      if (typeof commentsFor != 'undefined'  &&  json[commentsFor]) 
        tmpl_data['v_showCommentsFor'] = U.encode(U.getLongUri1(json[commentsFor])); // + '&m_p=comments&b_p=forum');
  
      var votesFor = tmpl_data.v_showVotesFor;
      if (typeof votesFor != 'undefined'  &&  json[votesFor]) 
        tmpl_data['v_showVotesFor'] = U.encode(U.getLongUri1(json[votesFor])); //+ '&m_p=votes&b_p=votable');

      var renabFor = tmpl_data.v_showRenabFor;
      if (typeof renabFor != 'undefined'  &&  json[renabFor]) 
        tmpl_data.v_showRenabFor = U.encode(U.getLongUri1(json[renabFor]) + '&m_p=nabs&b_p=forResource');
      
      // set size of images included in the items to be able
      // to start masonry code before images downloading
      var oWidth  = json.originalWidth;
      var oHeight = json.originalHeight;
      if (typeof oWidth != 'undefined' && typeof oHeight != 'undefined') {
        var ratio = (oWidth > this.IMG_MAX_WIDTH) ? this.IMG_MAX_WIDTH / oWidth : 1;
        tmpl_data.imgWidth = Math.floor(oWidth * ratio);
        tmpl_data.imgHeight = Math.floor(oHeight * ratio);
      }
      
      try {
        this.$el.html(this.modTemplate(tmpl_data));
      } catch (err) {
        G.log(this.TAG, 'failed to build masonry item for Modification resource ' + json.resourceDisplayName + ': ' + err);
      }
      return this;
    }
  }, {
    displayName: 'ResourceMasonryItemView'
  });
});
