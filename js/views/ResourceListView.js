define([
  'jquery',
  'underscore',
  'backbone',
  'utils',
  'events',
  'templates',
  'views/ResourceMasonryModItemView',
  'views/ResourceListItemView',
  'jqueryMobile'
], function($, _, Backbone, U, Events, Templates, ResourceMasonryModItemView, ResourceListItemView) {
  return Backbone.View.extend({
    displayPerPage: 7, // for client-side paging
    page: null,
    changedViews: [],
    skipScrollEvent: false,
    
    initialize: function () {
      _.bindAll(this, 'render', 'tap', 'swipe', 'getNextPage', /*'renderMany', 'renderOne',*/ 'refresh', 'changed'); // fixes loss of context for 'this' within methods
      Events.on('refresh', this.refresh);
      this.model.on('reset', this.render, this);
      var self = this;
      $(window).on('scroll', function() { self.onScroll(self); });
      return this;
    },
    refresh: function(model, modified) {
      if (model && model != this.model)
        return this;
  
//      if (this.$el.hasClass('ui-listview')) {
      //Element is already initialized
      var lis = isModification ? this.$('.nab') : this.$('li');
//      var lis = this.$('li').detach();
//      var frag = document.createDocumentFragment();
      
      var models = this.model.models;
      var hasImgs = U.hasImages(models);
      var num = Math.min(models.length, (this.page + 1) * this.displayPerPage);
      
      var i = 0;
      var nextPage = false;
      var frag;
      if (typeof modified == 'undefined') {
        i = lis.length;
        nextPage = true;
      }
      else
        frag = document.createDocumentFragment();
      
      for (; i < num; i++) {
        var m = models[i];
        var uri = m.get('_uri');
        if (i >= lis.length || _.contains(modified, uri)) {
//          var liView = hasImgs ? new ResourceListItemView({model:m, hasImages: 'y'}) : new ResourceListItemView({model:m});
          var liView;
          if (isModification) 
            liView = new Lablz.ResourceMasonryModItemView({model:m});
          else
            liView = hasImgs ? new Lablz.ResourceListItemView({model:m, hasImages: 'y'}) : new Lablz.ResourceListItemView({model:m});
//            $('.ui-listview li:eq(' + i + ')').remove();
          if (nextPage)  
            this.$el.append(liView.render().el);
          else
            frag.appendChild(liView.render().el);
        }
        else if (!nextPage)
          frag.appendChild(lis[i]);
      }

      if (!nextPage) {
        lis.detach();
        this.$el.html(frag);
      }
      
//      this.$el.html(frag);
//      this.renderMany(this.model.models.slice(0, lis.length));
      if (this.initializedListView)
        this.$el.listview('refresh');
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
//    renderOne: function(model) {
//      var meta = model.__proto__.constructor.properties;
//      meta = meta || model.properties;
//  
//      var type = this.model.type;
//      var cmpStr = '/changeHistory/Modification';
//      var isModification = type.indexOf(cmpStr) == type.length - cmpStr.length;
//      var liView;
//      if (isModification) 
//        liView = new ResourceMasonryModItemView({model:model});
//      else {
//        var hasImgs = Utils.isA(model.constructor, 'ImageResource')  &&  meta != null  &&  U.getCloneOf(meta, 'ImageResource.mediumImage').length != 0; 
//        liView = hasImgs ? new ResourceListItemView({model:model, hasImages: 'y'}) : new Lablz.ResourceListItemView({model:model});
//      }
//      this.$el.append(liView.render().el);
//      return this;
//    },
//    renderMany: function(models) {
//      if (models instanceof Backbone.Model) // one model
//        this.renderOne(models);
//      else {
//        var self = this;
//  
//        var hasImgs = U.hasImages(models); 
//  
//        var type = this.model.type;
//        var cmpStr = '/changeHistory/Modification';
//        var isModification = type.indexOf(cmpStr) == type.length - cmpStr.length;
//  
//        var frag = document.createDocumentFragment();
//        _.forEach(models, function(model) {
//          var liView;
//          if (isModification) 
//            liView = new ResourceMasonryModItemView({model:model});
//          else
//            liView = hasImgs ? new ResourceListItemView({model:model, hasImages: 'y'}) : new ResourceListItemView({model:model});
//          var s = liView.render().el;
//          frag.appendChild(s);
//        });
//        
//        this.$el.append(frag);
//      }
//      
//      return this;
//    },
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
    onScroll: function(view) {
      if (!view.visible)
        return;
      
      var $wnd = $(window);
  //    console.log(view.skipScrollEvent);
      if (view.skipScrollEvent) // wait for a new data portion
        return;
  
      var pageContainer = $(".ui-page-active");
      if (pageContainer.height() > $wnd.scrollTop() + $wnd.height())
        return;
     
  //    console.log("CALLING getNextPage");
      // order is important, because view.getNextPage() may return immediately if we have some cached rows
      view.skipScrollEvent = true; 
      view.getNextPage();
    },
    onNextPageFetched: function () {
      this.skipScrollEvent = false;
    }
  });
});