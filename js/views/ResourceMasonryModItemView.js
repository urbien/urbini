// needs Lablz.pageRoot

define([
  'jquery',
  'underscore',
  'backbone',
  'utils',
  'events',
  'templates',
  'modelsBase',
  'jqueryMobile',
  'jquery.masonry.min.js',
  'jquery.imagesloaded.min.js' // in case if inages do not have height declaration
                               // then need to align "bricks after their downloading 
], function($, _, Backbone, U, Events, Templates, MB) {
  return Backbone.View.extend({
    className: 'nab nabBoard masonry-brick',
    initialize: function(options) {
      _.bindAll(this, 'render', 'tap'); // fixes loss of context for 'this' within methods
      this.template = _.template(Templates.get('masonry-mod-list-item'));
      
      // resourceListView will call render on this element
  //    this.model.on('change', this.render, this);
      
      this.parentView = options && options.parentView;
      return this;
    },
    events: {
      'tap': 'tap',
      'click': 'click'
    },
    tap: Events.defaultTapHandler,
    click: Events.defaultClickHandler,
    render: function(event) {
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
      
      var snmHint = {shortNameToModel: MB.shortNameToModel};
      var rUri = Lablz.pageRoot + '#view/' + encodeURIComponent(U.getLongUri(json[imgSrc].value), snmHint);
      var tmpl_data = _.extend(json, {rUri: rUri});
  
      var modBy = Lablz.pageRoot + '#view/' + encodeURIComponent(U.getLongUri(json['modifiedBy'].value, snmHint));
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
        tmpl_data['v_showCommentsFor'] = encodeURIComponent(U.getLongUri(json[commentsFor].value, snmHint) + '?m_p=comments&b_p=forum');
  
      var votesFor = tmpl_data['v_showVotesFor'];
      if (typeof votesFor != 'undefined'  &&  json[votesFor]) 
        tmpl_data['v_showVotesFor'] = encodeURIComponent(U.getLongUri(json[votesFor].value, snmHint) + '?m_p=votes&b_p=votable');
  
      var renabFor = tmpl_data['v_showRenabFor'];
      if (typeof votesFor != 'undefined'  &&  json[renabFor]) 
        tmpl_data['v_showRenabFor'] = encodeURIComponent(U.getLongUri(json[renabFor].value, snmHint) + '?m_p=nabs&b_p=forResource');
      
      this.$el.html(this.template(tmpl_data));
      return this;
    }
  });
});