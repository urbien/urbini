define('views/IntersectionListItemView', [
  'globals',
  'underscore',
  'backbone',
  'utils',
  'events',
  'views/BasicView',
  'views/HorizontalListItemView',
  'lib/fastdom',
  'jqueryMasonry'
], function(G, _, Backbone, U, Events, BasicView, HorizontalListItemView, Q) {
  return BasicView.extend({
    template: 'intersectionListItemTemplate',
    initialize: function(options) {
      BasicView.prototype.initialize.apply(this, arguments);
      this.template = this.makeTemplate(this.template, 'template', this.vocModel.type);
      this.hItemA = new this._preinitializedHILV({
        resource: this.resource,
        source: this.resource.get('Intersection.a')        
      });

      this.hItemB = new this._preinitializedHILV({
        resource: this.resource,
        source: this.resource.get('Intersection.b')        
      });
    },
    
    render: function(options) {
      var _options1 = _.defaults({
        force: true,
        cloneOf: 'Intersection.a',
        renderToHtml: true
      }, options);
      var _options2 = _.defaults({
        force: true,
        cloneOf: 'Intersection.b',
        renderToHtml: true
      }, options);
      
      this.hItemA.render(_options1);
      this.hItemB.render(_options2);
      var htmlA = this.hItemA._html,
          htmlB = this.hItemB._html;
      
      if (!htmlA || !htmlB)
        return false;
      
      var html = this.template({
        a: htmlA,
        b: htmlB
      });
      
      if (options.renderToHtml)
        this._html = html;
      else 
        this.$el.html(this.template(html));
      
      return this;
    },
    
    setElement: function() {
      var result = Backbone.View.prototype.setElement.apply(this, arguments);
      if (this.hItemA) {
        var a = this.$el.first();
        this.hItemA.setElement(a);
        this.hItemB.setElement(a.next());
      }
      
      return result;
    }
  }, {
    displayName: 'IntersectionListItemView',
//    preinitData: {
//      interfaceProperties: {
//        Intersection: ['a', 'b', 'aThumb', 'aFeatured', 'aOriginalHeight', 'aOriginalWidth', 'bThumb', 'bFeatured', 'bOriginalHeight', 'bOriginalWidth']
//      },
//      superclasses: _.map([
//        G.commonTypes.FriendApp,
//        G.commonTypes.Friend,
//        G.commonTypes.Handler
//      ], U.getLongUri1)
//    },
    preinitialize: function(options) {
      var preinitData = this.preinitData,
          vocModel = options.vocModel,
          meta = vocModel.properties,
          preinit = BasicView.preinitialize.apply(this, arguments);
      
      preinit.prototype._preinitializedHILV = HorizontalListItemView.preinitialize({
        parentView: options.parentView,
        vocModel: options.vocModel
      });
      
      return preinit;
    }
  });
});