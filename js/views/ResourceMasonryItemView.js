define([
  'globals',
  'cache!jquery',
  'cache!underscore',
  'cache!backbone',
  'cache!utils',
  'cache!events',
  'cache!templates',
  'cache!modelsBase',
  'cache!jqueryMobile',
  'cache!jqueryMasonry',
  'cache!jqueryImagesloaded'
], function(G, $, _, Backbone, U, Events, Templates, MB, __jqm__) {
  return Backbone.View.extend({
    className: 'nab nabBoard masonry-brick',
    initialize: function(options) {
      _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
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
      var isModification = U.isAssignableFrom(this.model.constructor, 'Modification', MB.typeToModel);
      return (isModification) ?  this.renderModificationTile() :  this.renderTile();
    },  
    renderTile: function(event) {
      var m = this.model;
      var meta = m.__proto__.constructor.properties;
      meta = meta || m.properties;
      if (!meta)
        return this;
      
//      var img = U.getCloneOf(meta, 'ImageResource.mediumImage')[0]; 
//      if (img == null)
//        img = U.getCloneOf(meta, 'ImageResource.bigMediumImage')[0];
//      if (img == null)
      var img = U.getCloneOf(meta, 'ImageResource.bigImage')[0];
      var json = m.toJSON();
      
      var grid = U.getGridCols(m);

      var rUri = m.get('_uri');
      var resourceUri = G.pageRoot + '#view/' + encodeURIComponent(rUri);
      var gridCols = '';
      var resourceLink;
      var i = 0;
      for (var row in grid) {
        if (i == 0)
          i++;
        else
          gridCols += "<br/>";
        
        var pName = grid[row].propertyName;
        if (!meta[pName].skipLabelInGrid)
          gridCols += '<span class="label">' + row + '</span>';
        var s = grid[row].value;
        if (grid[row].resourceLink) 
          s = '<a href="' + resourceUri + '">' + json[pName] + '</a>';
        else if (meta[pName].facet  &&  meta[pName].facet.indexOf("/href") != -1)
          s = '<a href="' + s + '">' + s + '</a>';
        gridCols += s;
      }
      if (gridCols.length == 0) {
        gridCols = '<a href="' + resourceUri + '">' + json['davDisplayName'] + '</a>';
      }

      
//      var rUri = G.pageRoot + '#view/' + encodeURIComponent(U.getLongUri(json[imgSrc].value), snmHint);
      
      img = json[img];
      var tmpl_data = _.extend(json, {resourceMediumImage: img});
      tmpl_data['gridCols'] = gridCols;
      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
  //      tmpl_data = _.extend(tmpl_data, {imgSrc: img});
      }
      
      var c = m.constructor;
      tmpl_data['rUri'] = resourceUri;
      if (U.isA(c, 'CollaborationPoint')) { 
        var comments = U.getCloneOf(meta, 'CollaborationPoint.comments');
        if (comments.length > 0) {
          var pMeta = meta[comments[0]];
          
          tmpl_data['v_showCommentsFor'] = encodeURIComponent(U.getLongUri(rUri, MB) + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
        }
      }
      if (U.isA(c, 'Votable')) {
        var votes = U.getCloneOf(meta, 'Votable.voteUse');
        if (votes.length == 0)
          votes = U.getCloneOf(meta, 'Votable.likes');
        if (votes.length > 0) {
          var pMeta = meta[votes[0]];
          tmpl_data['v_showVotesFor'] = encodeURIComponent(U.getLongUri(rUri, MB) + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
        }
      }  
      var nabs = U.getCloneOf(meta, 'ImageResource.nabs');
      if (nabs.length > 0) {
        var pMeta = meta[nabs[0]];
        var uri = encodeURIComponent(U.getLongUri(rUri, MB) + '?m_p=' + nabs[0] + '&b_p=' + pMeta.backLink);
        tmpl_data['v_showRenabFor'] = uri;
      }      
      try {
        this.$el.html(this.template(tmpl_data));
      } catch (err) {
        console.log('2. failed to delete table ' + name + ': ' + err);
      }
      return this;
    },
    renderModificationTile: function(event) {
      var meta = this.model.__proto__.constructor.properties;
      meta = meta || this.model.properties;
      if (!meta)
        return this;
      
      var json = this.model.toJSON();
      var imgSrc = json['v_imgSrc'];
      if (!imgSrc)
        imgSrc = 'forResource';
      if (typeof json[imgSrc] == 'undefined')
        return this;
      
      var rUri = G.pageRoot + '#view/' + encodeURIComponent(U.getLongUri(json[imgSrc].value), MB);
      var tmpl_data = _.extend(json, {rUri: rUri});
  
      var modBy = G.pageRoot + '#view/' + encodeURIComponent(U.getLongUri(json['modifiedBy'].value, MB));
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
        tmpl_data['v_showCommentsFor'] = encodeURIComponent(U.getLongUri(json[commentsFor].value, MB) + '&m_p=comments&b_p=forum');
  
      var votesFor = tmpl_data['v_showVotesFor'];
      if (typeof votesFor != 'undefined'  &&  json[votesFor]) 
        tmpl_data['v_showVotesFor'] = encodeURIComponent(U.getLongUri(json[votesFor].value, MB) + '&m_p=votes&b_p=votable');
  
      var renabFor = tmpl_data['v_showRenabFor'];
      if (typeof renabFor != 'undefined'  &&  json[renabFor]) 
        tmpl_data['v_showRenabFor'] = encodeURIComponent(U.getLongUri(json[renabFor].value, MB) + '&m_p=nabs&b_p=forResource');
      try {
        this.$el.html(this.modTemplate(tmpl_data));
      } catch (err) {
        console.log('2. failed to delete table ' + name + ': ' + err);
      }
      return this;
    }
  });
});
