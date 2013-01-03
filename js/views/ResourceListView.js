define([
  'globals',
  'cache!jquery',
  'cache!underscore',
  'cache!backbone',
  'cache!utils',
  'cache!events',
  'cache!vocManager',
  'cache!templates',
  'cache!jqueryMobile',
  'cache!views/ResourceMasonryItemView',
  'cache!views/ResourceListItemView',
  'cache!views/CommentListItemView'
], function(G, $, _, Backbone, U, Events, Voc, Templates, __jqm__, ResourceMasonryItemView, ResourceListItemView, CommentListItemView) {
  return Backbone.View.extend({
    displayPerPage: 10, // for client-side paging
    page: null,
    changedViews: [],
    skipScrollEvent: false,
    
    initialize: function () {
      _.bindAll(this, 'render','swipe', 'getNextPage', 'refresh', 'changed', 'onScroll', 'alignBricks'); // fixes loss of context for 'this' within methods
      Events.on('refresh', this.refresh);
      this.model.on('reset', this.render, this);
      $(window).on('scroll', this.onScroll);
      Events.on('changePage', this.alignBricks);
      this.$el.on('create', this.alignBricks);
      
      this.TAG = 'ResourceListView';
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
      var vocModel = this.model.model;
      var isModification = U.isAssignableFrom(vocModel, 'Modification', Voc.typeToModel);
//      var meta = models[0].__proto__.constructor.properties;
//      meta = meta || models[0].properties;
      var meta = vocModel.properties;

      var viewMode = vocModel.viewMode;
      var isList = (typeof viewMode != 'undefined'  &&  viewMode == 'List');
      var isMasonry = !isList  &&  U.isA(vocModel, 'ImageResource')  &&  (U.getCloneOf(meta, 'ImageResource.mediumImage').length > 0 || U.getCloneOf(meta, 'ImageResource.bigMediumImage').length > 0  ||  U.getCloneOf(meta, 'ImageResource.bigImage').length > 0);
      var isComment = !isModification  &&  !isMasonry &&  U.isAssignableFrom(vocModel, 'Comment', Voc.typeToModel);
//      if (!isComment  &&  !isMasonry  &&  !isList) {
//        if (U.isA(vocModel, 'Intersection')) {
//          var href = window.location.href;
//          var qidx = href.indexOf('?');
//          var a = U.getCloneOf(meta, 'Intersection.a')[0];
//          var aprop;
//          if (qidx == -1) {
//            aprop = models[0].get(a);
//          }
//          else {
//            var b = U.getCloneOf(meta, 'Intersection.b')[0];
//            var p = href.substring(qidx + 1).split('=')[0];
//            var delegateTo = (p == a) ? b : a;
//            aprop = models[0].get(delegateTo);
//          }
//          var type = U.getTypeUri(U.getType(aprop['value']), {type: aprop['value'], shortNameToModel: Voc.shortNameToModel});
//          isMasonry = U.isA(Voc.typeToModel[type], 'ImageResource');  
//        }
//      }
      var lis = isModification || isMasonry ? this.$('.nab') : this.$('li');
      var hasImgs = U.hasImages(this.model);
      var curNum = lis.length;
      var num = Math.min(models.length, (this.model.page + 1) * this.displayPerPage);
      
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
      else {
        this.initializedListView = true;
      }
    
      return this;
      
//      else {
//        //Element has not been initiliazed
//        this.$el.listview().listview('refresh');
//        this.initializedListView = true;
//      }

    },
    
    getNextPage: function() {
//      var before = this.model.models.length;
//
//      console.log("called getNextPage");
//      
//      // there is nothing to fetch, we've got them all
//      if (before < this.model.perPage)
//        return;
      
      var self = this;
      var before = this.model.offset;
      this.loadingNextPage = true;
      var after = function() {
        if (self.model.offset > before)
          self.refresh();
        
        self.loadingNextPage = false;
        self.onNextPageFetched();
      };
      
//      this.page++;
//      
//      var requested = (this.page + 1) * this.displayPerPage;
//      
//      if (before > requested) {
//        this.refresh(this.model);
//        after();
//        return;
//      }
        
      this.model.getNextPage({
        success: after,
        error: after
      });      
    },
//    tap: Events.defaultTapHandler,
    click: Events.defaultClickHandler,  

    swipe: function(e) {
      console.log("swipe");
    },
    
    changed: function(view) {
      this.changedViews.push(view);
    },
    
    render: function(e) {
      G.log(this.TAG, "render");
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

    // masonry bricks alignment
    alignBricks: function(todo) {
      // if masonry and bricks have zero dimension then impossible to align them
      if (!this.$el.hasClass("masonry") || this.$el.width() == 0)
        return;

      var self = this;
      // 1. align masonry if first masonry brick was aligned before  
      var $firstBrick = this.$el.children().first();
      if ($firstBrick && $firstBrick.css("position") != "absolute") {
          this.$el.imagesLoaded( function(){ self.$el.masonry(); });
        return;
      }
      
      // 2. append to masonry new bricks on next page
      // filter unaligned "bricks" which do not have calculated, absolute position 
      $bricks = $(this.$el.children()).filter(function(idx, node) {
                  return (node.style.position != "absolute"  );
                });
        
      if ($bricks.length == 0)
        return; // nothing to align
      
      this.$el.imagesLoaded( function(){ self.$el.masonry( 'appended', $bricks ); });
    }
  });
});
