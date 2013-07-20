'use strict';
define('views/PhotogridListView', [
  'globals',
  'utils',
  'events',
  'views/ResourceListView',
  'views/PhotogridView',
  'collections/ResourceList',
  'jqueryMobile'
], function(G, U, Events, ResourceListView, PhotogridView, ResourceList, $m) {
  return ResourceListView.extend({
//    events: {
//      'orientationchange': 'orientationchange',
//      'resize': 'orientationchange'
//    },
    type: 'photogrid',
    getListItems: function() {
      return this.$('tr');
    },

    preRender: function(info) {
      this.table = $('table#photogridList{0}'.format(this.cid))[0];
      if (this.table)
        this.table.appendChild($('<tr><td colspan="2"><hr /></td></tr>')[0]);
      else
        this.table = $('<table id="photogridList{0}" width="100%"></table>'.format(this.cid))[0];
    },
    
    renderItem: function(res, info) {
      var liView = this.addChild('photogrid item' + G.nextId(), new PhotogridView({
        tagName: 'div', 
        linkToIntersection: true,
        resource: res,
        parentView: this
      }));
      
      liView.render({force: true});
      return liView;
    },
    
    postRenderItem: function(liView, info) {
      var row = $("<tr></tr>")[0];
      var cell = $("<td></td>")[0];
      cell.appendChild(liView.el);
      row.appendChild(cell);
      this.table.appendChild(row);
      if (info.index < info.total - 1)
        this.table.appendChild($('<tr><td colspan="2"><hr /></td></tr>')[0]);
    },
    
    postRender: function(info) {
      info.frag.appendChild(this.table);
      this.table = null;
    }
    
  }, {
    displayName: "PhotogridListView"
  });
});