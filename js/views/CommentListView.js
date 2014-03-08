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

    postRender: function() {
      var result = ResourceListView.prototype.postRender.apply(this, arguments);
      if (this.rendered && G.isJQM()) {
        this.$el.trigger('create');
        if (this.el.$hasClass('ui-listview'))
          this.$el.listview('refresh');
      }

      this.el.$css('display', 'block');
      return result;
    }
  },
  {
    displayName: "CommentListView",
    _itemView: CommentListItemView
  });
});