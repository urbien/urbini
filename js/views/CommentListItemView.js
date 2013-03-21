//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'events', 
  'views/BasicView'
], function(G, $, _, Events, BasicView) {
  return BasicView.extend({
    tagName: 'tr',
    className: 'commentList',
    initialize: function(options) {
      _.bindAll(this, 'render', "like"); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      this.template = this.makeTemplate('comment-item');
      
      // resourceListView will call render on this element
  //    this.model.on('change', this.render, this);
      return this;
    },
    events: {
      'click .like': 'like'
    },
    like: function(e) {
      var likeModel = U.getModel('Vote');
      if (!likeModel) 
        return;
      Events.stopEvent(e);
      var r = new likeModel();
      self = this;
      var props = {};
      props.vote = 'Like';
      props.votable = this.resource.getUri();
      r.save(props, {
        success: function(resource, response, options) {
          self.router.navigate(window.location.hash, options);
        }, 
        error: function(model, xhr, options) {
          var json;
          try {
            json = JSON.parse(xhr.responseText).error;
          } catch (err) {
            G.log(self.TAG, 'error', 'couldn\'t create like item, no error info from server');
            return;
          }
          
          Errors.errDialog({msg: json.details});
          G.log(self.TAG, 'error', 'couldn\'t create like');
        }
      });      
    },

//    tap: Events.defaultTapHandler,
//    click: Events.defaultClickHandler,  
    render: function(event) {
      var json = this.resource.toJSON();
      var thumb = json['submitter.thumb'];
      if (thumb) {
        var idx = thumb.indexOf('=');
        json['submitter.thumb'] = thumb.slice(idx + 1);
      }
        
      this.$el.html(this.template(json));
      this.finish();
      return this;
    }
  }, {
    displayName: 'CommentListItemView'
  });  
});
