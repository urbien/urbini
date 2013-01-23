define([
  'globals',
  'cache!jquery',
  'cache!underscore',
  'cache!utils',
  'cache!events',
  'cache!templates',
  'cache!views/BasicView',
  'cache!vocManager',
  'cache!jqueryMasonry',
  'cache!jqueryImagesloaded'
], function(G, $, _, U, Events, Templates, BasicView, Voc) {
  return BasicView.extend({
//    className: 'nab nabBoard masonry-brick',
//    className: 'pin',
//    tagName: 'li',
    
    IMG_MAX_WIDTH: 205, // value of CSS rule: ".nab .anab .galleryItem_css3 img"
    
    initialize: function(options) {
      _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      this.template = _.template(Templates.get('masonry-list-item'));
      this.modTemplate = _.template(Templates.get('masonry-mod-list-item'));

      // resourceListView will call render on this element
  //    this.model.on('change', this.render, this);
      this.parentView = options && options.parentView;
      return this;
    },
    events: {
      'click': 'click'
    },
//    tap: Events.defaultTapHandler,
    click: Events.defaultClickHandler,  
    render: function(event) {
      var vocModel = this.vocModel;
      var isModification = U.isAssignableFrom(vocModel, 'Modification', Voc.typeToModel);
      if (isModification) 
        return this.renderModificationTile();
      var m = this.resource;
      var isReference = U.isA(vocModel, 'Reference'); 
      if (isReference)
        return this.renderReferenceTile();
      if (!U.isA(vocModel, 'Intersection', Voc.typeToModel))   
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
//        var type = U.getTypeUri(U.getTypeUri(aprop['value']), {type: aprop['value'], shortNameToModel: Voc.shortNameToModel});
          
          
//      return this.renderTile();
    },  
    renderTile: function(event) {
      var m = this.resource;
      var vocModel = this.vocModel;
      var meta = vocModel.properties;
      if (!meta)
        return this;
      
//      var img = U.getCloneOf(meta, 'ImageResource.mediumImage')[0]; 
//      if (img == null)
//        img = U.getCloneOf(meta, 'ImageResource.bigMediumImage')[0];
//      if (img == null)
      var json = m.toJSON();
      
      var rUri = m.get('_uri');
      
      var img = U.getCloneOf(vocModel, 'ImageResource.mediumImage')[0];
      img = json[img];
      var tmpl_data = _.extend(json, {resourceMediumImage: img});

      var resourceUri = G.pageRoot + '#view/' + U.encode(rUri);
      var gridCols = '';
      var resourceLink;
      var i = 0;

      var grid = U.getGridCols(m);
      if (grid) {
        for (var row in grid) {
          if (i == 0)
            i++;
          else
            gridCols += "<br/>";

          var pName = grid[row].propertyName;
          var gP = meta[pName];          
          if (U.isCloneOf(gP, "ImageResource.mediumImage")  ||  U.isCloneOf(gP, "ImageResource.smallImage"))
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
        var oWidth  = json["originalWidth"];
        var oHeight = json["originalHeight"];
        if (typeof oWidth != 'undefined' && typeof oHeight != 'undefined') {
          var ratio = (oWidth > this.IMG_MAX_WIDTH) ? this.IMG_MAX_WIDTH / oWidth : 1;
          tmpl_data['imgWidth'] = Math.floor(oWidth * ratio);
          tmpl_data['imgHeight'] = Math.floor(oHeight * ratio);
        }

      }
      var dn = json['davDisplayName'];
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
      
//      var rUri = G.pageRoot + '#view/' + U.encode(U.getLongUri(json[imgSrc].value), snmHint);
      
      
      tmpl_data['rUri'] = resourceUri;
      if (U.isA(vocModel, 'CollaborationPoint')) { 
        var comments = U.getCloneOf(vocModel, 'CollaborationPoint.comments');
        if (comments.length > 0) {
          var pMeta = meta[comments[0]];
          
          tmpl_data.v_showCommentsFor = U.encode(U.getLongUri(rUri, Voc) + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
        }
      }
      if (U.isA(vocModel, 'Votable')) {
        var votes = U.getCloneOf(vocModel, 'Votable.voteUse');
        if (votes.length == 0)
          votes = U.getCloneOf(vocModel, 'Votable.likes');
        if (votes.length > 0) {
          var pMeta = meta[votes[0]];
          tmpl_data.v_showVotesFor = U.encode(U.getLongUri(rUri, Voc) + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
        }
      }  
      var nabs = U.getCloneOf(vocModel, 'ImageResource.nabs');
      if (nabs.length > 0) {
        var pMeta = meta[nabs[0]];
        var uri = U.encode(U.getLongUri(rUri, Voc) + '?m_p=' + nabs[0] + '&b_p=' + pMeta.backLink);
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
      var forResourceUri = json[forResource] ? json[forResource].value : null;
      if (!forResourceUri)
        return this;
      var rUri = U.getLongUri(forResourceUri, Voc.shortNameToModel);
      
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
      
//      var rUri = G.pageRoot + '#view/' + U.encode(U.getLongUri(json[imgSrc].value), snmHint);
      var forResourceModel = Voc.typeToModel[U.getTypeUri(forResourceUri)];
      var c =  forResourceModel ? forResourceModel : m.constructor;
      tmpl_data['rUri'] = resourceUri;
      if (U.isA(c, 'CollaborationPoint')) { 
        var comments = U.getCloneOf(vocModel, 'CollaborationPoint.comments');
        if (comments.length > 0) {
          var pMeta = meta[comments[0]];
          
          tmpl_data.v_showCommentsFor = U.encode(U.getLongUri(rUri, Voc) + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
        }
      }
      if (U.isA(c, 'Votable')) {
        var votes = U.getCloneOf(vocModel, 'Votable.voteUse');
        if (votes.length == 0)
          votes = U.getCloneOf(vocModel, 'Votable.likes');
        if (votes.length > 0) {
          var pMeta = meta[votes[0]];
          tmpl_data.v_showVotesFor = U.encode(U.getLongUri(rUri, Voc) + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
        }
      }  
      var nabs = U.getCloneOf(vocModel, 'ImageResource.nabs');
      if (nabs.length > 0) {
        var pMeta = meta[nabs[0]];
        var uri = U.encode(U.getLongUri(rUri, Voc) + '?m_p=' + nabs[0] + '&b_p=' + pMeta.backLink);
        tmpl_data.v_showRenabFor = uri;
      }
      
      try {
        this.$el.html(this.template(tmpl_data));
      } catch (err) {
        console.log('2. failed to delete table ' + name + ': ' + err);
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
      dn = dn.displayName;
      var rUri = json[delegateTo].value;
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
      tmpl_data['_uri'] = rUri;  
      tmpl_data['davDisplayName'] = dn;

      var resourceUri = G.pageRoot + '#view/' + U.encode(rUri);
        
      var gridCols = '<a href="' + resourceUri + '">' + dn + '</a>';
      tmpl_data['gridCols'] = gridCols;
      
//      var rUri = G.pageRoot + '#view/' + U.encode(U.getLongUri(json[imgSrc].value), snmHint);
      var type = U.getTypeUri(rUri);
      
      var forResourceModel = type ? Voc.typeToModel[type] : null;
      var c =  forResourceModel ? forResourceModel : m.constructor;
      if (forResourceModel) {
        var meta = c.properties;
        meta = meta || m.properties;
      }
      tmpl_data['rUri'] = resourceUri;
      if (U.isA(c, 'CollaborationPoint')) { 
        var comments = U.getCloneOf(vocModel, 'CollaborationPoint.comments');
        if (comments.length > 0) {
          var pMeta = meta[comments[0]];
          
          tmpl_data.v_showCommentsFor = U.encode(U.getLongUri(rUri, Voc) + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
        }
      }
      if (U.isA(c, 'Votable')) {
        var votes = U.getCloneOf(vocModel, 'Votable.voteUse');
        if (votes.length == 0)
          votes = U.getCloneOf(vocModel, 'Votable.likes');
        if (votes.length > 0) {
          var pMeta = meta[votes[0]];
          tmpl_data.v_showVotesFor = U.encode(U.getLongUri(rUri, Voc) + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
        }
      }  
      var nabs = U.getCloneOf(vocModel, 'ImageResource.nabs');
      if (nabs.length > 0) {
        var pMeta = meta[nabs[0]];
        var uri = U.encode(U.getLongUri(rUri, Voc) + '?m_p=' + nabs[0] + '&b_p=' + pMeta.backLink);
        tmpl_data.v_showRenabFor = uri;
      }
      
      try {
        this.$el.html(this.template(tmpl_data));
      } catch (err) {
        console.log('2. failed to delete table ' + name + ': ' + err);
      }
      
      return this;
    },
    renderModificationTile: function(event) {
      var meta = this.vocModel.properties;
      if (!meta)
        return this;
      
      var json = this.resource.toJSON();
      var imgSrc = json['v_imgSrc'];
      if (!imgSrc)
        imgSrc = 'forResource';
      if (typeof json[imgSrc] == 'undefined')
        return this;
      
      var rUri = G.pageRoot + '#view/' + U.encode(U.getLongUri(json[imgSrc].value), Voc);
      var tmpl_data = _.extend(json, {rUri: rUri});
  
      var modBy = G.pageRoot + '#view/' + U.encode(U.getLongUri(json['modifiedBy'].value, Voc));
      tmpl_data['modifiedBy'].value = modBy;
      var isHorizontal = ($(window).height() < $(window).width());
  //    alert(isHorizontal);
      var img = json['resourceMediumImage'];
      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
  //      tmpl_data = _.extend(tmpl_data, {imgSrc: img});
      }
      
      var commentsFor = tmpl_data['v_showCommentsFor'];
      if (typeof commentsFor != 'undefined'  &&  json[commentsFor]) 
        tmpl_data['v_showCommentsFor'] = U.encode(U.getLongUri(json[commentsFor].value, Voc) + '&m_p=comments&b_p=forum');
  
      var votesFor = tmpl_data['v_showVotesFor'];
      if (typeof votesFor != 'undefined'  &&  json[votesFor]) 
        tmpl_data['v_showVotesFor'] = U.encode(U.getLongUri(json[votesFor].value, Voc) + '&m_p=votes&b_p=votable');

      var renabFor = tmpl_data['v_showRenabFor'];
      if (typeof renabFor != 'undefined'  &&  json[renabFor]) 
        tmpl_data['v_showRenabFor'] = U.encode(U.getLongUri(json[renabFor].value, Voc) + '&m_p=nabs&b_p=forResource');
      
      // set size of images included in the items to be able
      // to start masonry code before images downloading
      var oWidth  = json["originalWidth"];
      var oHeight = json["originalHeight"];
      if (typeof oWidth != 'undefined' && typeof oHeight != 'undefined') {
        var ratio = (oWidth > this.IMG_MAX_WIDTH) ? this.IMG_MAX_WIDTH / oWidth : 1;
        tmpl_data['imgWidth'] = Math.floor(oWidth * ratio);
        tmpl_data['imgHeight'] = Math.floor(oHeight * ratio);
      }
      
      try {
        this.$el.html(this.modTemplate(tmpl_data));
      } catch (err) {
        console.log(this.TAG, 'failed to build masonry item for Modification resource ' + json['resourceDisplayName'] + ': ' + err);
      }
      return this;
    }
  }, {
    displayName: 'ResourceMasonryItemView'
  });
});
