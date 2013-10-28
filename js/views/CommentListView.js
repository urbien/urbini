define('views/CommentListView', [
  'globals',
  'utils',
  'events',
  'views/ResourceListView',
  'views/CommentListItemView',
  'collections/ResourceList',
  'jqueryMobile'
], function(G, U, Events, ResourceListView, CommentListItemView, ResourceList, $m) {
  return ResourceListView.extend({
    type: 'comment',
    
    preinitializeItem: function() {
    },
        
    getPageTag: function() {
      return 'tbody';
    },
    
    getDummies: function() {
      var dummies = this.$('.dummy');
      return {
        head: dummies.filter('.head'),
        tail: dummies.filter('.tail')
      }
    },

    renderItem: function(res, prepend) {
      var liView = this.addChild(new CommentListItemView({
        resource: res
      }));
      
      this.addChild(liView, prepend);
      liView.render({
        force: true,
        renderToHtml: true
      });
      
      return liView;
    },
    
    postRender: function() {
      if (this.rendered) {
        this.$el.trigger('create');
        if (this.$el.hasClass('ui-listview'))
          this.$el.listview('refresh');
      }

      this.$el.css('display', 'block');
    }
  },
  {
    displayName: "CommentListView",
    _itemView: CommentListItemView
  });
});