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
    renderItem: function(res, last) {
      var liView = this.addChild('comment' + G.nextId(), new CommentListItemView({
        parentView: this,
        resource: res
      }));
      
      liView.render({force: true});
      return liView;
    },
    
    postRender: function() {
      if (this.rendered) {
        this.$el.trigger('create');
        if (this.$el.hasClass('ui-listview'))
          this.$el.listview('refresh');
      }
      else
        this.$el.prevObject.find('#comments').css('display', 'block');
    }
  },
  {
    displayName: "CommentListView"
  });
});