'use strict';
define('views/PhotogridListView', [
  'globals',
  'utils',
  'events',
  'views/ResourceListView',
  'views/HorizontalListItemView',
  'collections/ResourceList',
  'jqueryMobile'
], function(G, U, Events, ResourceListView, HorizontalListItemView, ResourceList, $m) {
  return ResourceListView.extend({
//    events: {
//      'orientationchange': 'orientationchange',
//      'resize': 'orientationchange'
//    },
    type: 'photogrid',
//    getListItems: function() {
//      return this.$('tr');
//    },

    preRender: function(info) {
      var result = ResourceListView.prototype.preRender.call(this, info);
      this.table = this.$('#photogridList{0}'.format(this.cid))[0];
      if (this.table)
        this.table.appendChild($('<tr><td colspan="2"><hr /></td></tr>')[0]);
      else
        this.table = $('<table id="photogridList{0}" width="100%"></table>'.format(this.cid))[0];
      
      return result;
    },
    
    renderItem: function(res) {
      var liView = this.addChild(new this._preinitializedItem({
        tagName: 'div', 
        linkToIntersection: true,
        resource: res,
        bothSides: this._preinitializedItem.prototype.doesModelImplement('Intersection'),
        parentView: this
      }));
      
      liView.render({force: true});
      return liView;
    },
    
    postRenderItem: function(el, info) {
      var row = $("<tr></tr>")[0];
      var cell = $("<td></td>")[0];
      cell.appendChild(el);
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