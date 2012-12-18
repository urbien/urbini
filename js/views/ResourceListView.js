define([
  'cache!jquery',
  'cache!underscore',
  'cache!backbone',
  'cache!utils',
  'cache!events',
  'cache!modelsBase',
  'cache!templates',
  'cache!jqueryMobile',
  'cache!views/ResourceMasonryItemView',
  'cache!views/ResourceListItemView',
  'cache!views/CommentListItemView'
], function($, _, Backbone, U, Events, MB, Templates, __jqm__, ResourceMasonryItemView, ResourceListItemView, CommentListItemView) {
  return Backbone.View.extend({
    displayPerPage: 7, // for client-side paging
    page: null,
    changedViews: [],
    skipScrollEvent: false,
    
    initialize: function () {
      _.bindAll(this, 'render', 'tap', 'swipe', 'getNextPage', /*'renderMany', 'renderOne',*/ 'refresh', 'changed', 'onScroll', 'pageChanged', 'alignNewBricks'); // fixes loss of context for 'this' within methods
      Events.on('refresh', this.refresh);
      this.model.on('reset', this.render, this);
      $(window).on('scroll', this.onScroll);
      Events.on('changePage', this.pageChanged);
      this.$el.on('create', this.alignNewBricks);
      return this;
    },
    refresh: function(model, modified) {
      if (model && model != this.model)
        return this;
  
//      if (this.$el.hasClass('ui-listview')) {
      //Element is already initialized
//      var lis = this.$('li').detach();
//      var frag = document.createDocumentFragment();
      
      var models = this.model.models;
      var isModification = U.isAssignableFrom(models[0].constructor, 'Modification', MB.typeToModel);
      var meta = models[0].__proto__.constructor.properties;
      meta = meta || models[0].properties;

      var viewMode = models[0].constructor['viewMode'];
      var isList = (typeof viewMode != 'undefined'  &&  viewMode == 'List');
      var isMasonry = !isList  &&  U.isA(models[0].constructor, 'ImageResource')  &&  (U.getCloneOf(meta, 'ImageResource.mediumImage').length > 0 || U.getCloneOf(meta, 'ImageResource.bigMediumImage').length > 0  ||  U.getCloneOf(meta, 'ImageResource.bigImage').length > 0);
      var isComment = !isModification  &&  !isMasonry &&  U.isAssignableFrom(models[0].constructor, 'Comment', MB.typeToModel);
      var lis = isModification || isMasonry ? this.$('.nab') : this.$('li');
      var hasImgs = U.hasImages(models);
      var curNum = lis.length;
      var num = Math.min(models.length, (this.page + 1) * this.displayPerPage);
      
      var i = 0;
      var nextPage = false;
      var frag;
      if (typeof modified == 'undefined'  ||  modified.length == 0) {
        i = curNum;
        if (curNum == num)
          return this;
        if (curNum > 0)
          nextPage = true;
      }

      if (!nextPage) {
        lis = lis.detach();
        frag = document.createDocumentFragment();
      }
      
      for (; i < num; i++) {
        var m = models[i];
        var uri = m.get('_uri');
        if (i >= lis.length || _.contains(modified, uri)) {
          var liView;
          if (isModification  ||  isMasonry) 
            liView = new ResourceMasonryItemView({model:m});
          else if (isComment)
            liView = new CommentListItemView({model:m});
          else
            liView = hasImgs ? new ResourceListItemView({model:m, hasImages: 'y'}) : new ResourceListItemView({model:m});
          if (nextPage)  
            this.$el.append(liView.render().el);
          else
            frag.appendChild(liView.render().el);
        }
        else if (!nextPage)
          frag.appendChild(lis[i]);
      }

      if (!nextPage) {
        this.$el.html(frag);
      }
      
//      this.$el.html(frag);
//      this.renderMany(this.model.models.slice(0, lis.length));
      
      if (this.initializedListView) {
        if (isModification  ||  isMasonry)
          this.$el.trigger('create');
        else
          this.$el.listview('refresh');
      }
      else
        this.initializedListView = true;
//      else {
//        //Element has not been initiliazed
//        this.$el.listview().listview('refresh');
//        this.initializedListView = true;
//      }
      
    },
    getNextPage: function() {
      var before = this.model.models.length;
      
      // there is nothing to fetch, we've got them all
      if (before < this.model.perPage)
        return;
      
      this.isLoading = true;
      var after = function() {
        self.isLoading = false;
        self.onNextPageFetched();
      };
      
      this.page++;
      var self = this;
      
      var requested = (this.page + 1) * this.displayPerPage;
      
      if (before > requested) {
        this.refresh(this.model);
        after();
        return;
      }
        
      this.model.getNextPage({
        success: after,
        error: after
      });      
    },
    tap: Events.defaultTapHandler,
    click: Events.defaultClickHandler,  
    swipe: function(e) {
      console.log("swipe");
    },
    changed: function(view) {
      this.changedViews.push(view);
    },
    render: function(e) {
      console.log("render listView");
      this.numDisplayed = 0;
//      this.renderMany(this.model.models);
      this.refresh();
  //    e && this.refresh(e);
  
      this.rendered = true;
      return this;
    },
  
    // endless page function
    onScroll: function() {
      if (!this.visible)
        return;
      
      var $wnd = $(window);
      if (this.skipScrollEvent) // wait for a new data portion
        return;
  
      var pageContainer = $(".ui-page-active");
      if (pageContainer.height() > $wnd.scrollTop() + $wnd.height())
        return;
     
      // order is important, because view.getNextPage() may return immediately if we have some cached rows
      this.skipScrollEvent = true; 
      this.getNextPage();
    },
    onNextPageFetched: function () {
      this.skipScrollEvent = false;
    },
    // initial masonry alignment
    pageChanged: function() {
      var self = this;
      this.$wall = $('#nabs_grid');
      if (this.$wall != null)
        this.$wall.imagesLoaded( function(){ self.$wall.masonry(); });
      // note: use this.$wall.masonry(); if images have defined height
    },
    // masonry alignment on nex data portion downloading
    alignNewBricks: function() {
      if (this.$wall == null)
        return;
      // filter unaligned "bricks" which do not have calculated, absolute position 
      $bricks = $(this.$wall[0].childNodes).filter(function(idx, node) {
                  return (node.style.position != "absolute"  );
                });

      var self = this;
      this.$wall.imagesLoaded( function(){ self.$wall.masonry( 'appended', $bricks ); });
    }
  });
});
