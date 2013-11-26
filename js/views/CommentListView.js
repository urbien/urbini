define('views/CommentListView', [
  'globals',
  'utils',
  'events',
  'views/ResourceListView',
  'views/CommentListItemView',
  'collections/ResourceList',
  '@widgets'
], function(G, U, Events, ResourceListView, CommentListItemView, ResourceList, $m) {
  return ResourceListView.extend({
    type: 'comment',
    
    preinitializeItem: function() {
    },
        
    getPageTag: function() {
      return 'tbody';
    },
    
    getDummyTag: function() {
      return 'tr';
    },
    
    preinitializeItem: function(res) {
      return CommentListItemView;
    },

    renderItem: function(res, prepend) {
      var liView = this.addChild(new CommentListItemView({
        resource: res
      }));
      
      this.addChild(liView, prepend);
      liView.render(this._itemRenderOptions);
      return liView;
    },
    
    postRender: function() {
      if (this.rendered && G.isJQM()) {
        this.$el.trigger('create');
        if (this.el.$hasClass('ui-listview'))
          this.$el.listview('refresh');
      }

      this.el.$css('display', 'block');
    }
  },
  {
    displayName: "CommentListView",
    _itemView: CommentListItemView
  });
});