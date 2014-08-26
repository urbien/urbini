//'use strict';
define('views/CommentListItemView', [
  'globals',
  'underscore',
  'events',
  'utils',
  'views/BasicView'
], function(G, _, Events, U, BasicView) {
  return BasicView.extend({
    tagName: 'tr',
    className: 'commentList',
    initialize: function(options) {
      _.bindAll(this, 'render', "like"); // fixes loss of context for 'this' within methods
      BasicView.prototype.initialize.apply(this, arguments);
      this.makeTemplate('comment-item', 'template', this.vocModel.type);

      // resourceListView will call render on this element
  //    this.model.on('change', this.render, this);
      return this;
    },
    events: {
      'click .like': 'like',
      'click #reply': 'reply'

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
        userEdit: true,
        success: function(resource, response, options) {
          // self.router.navigate(window.location.hash, options);
          window.location.reload(); // ?
        },
        error: function(model, xhr, options) {
          var error = U.getJSON(xhr.responseText);
          if (!error) {
            self.log('error', 'couldn\'t create like item, no error info from server');
            return;
          }

          Errors.errDialog({msg: error.details});
          self.log('error', 'couldn\'t create like');
        }
      });
    },
    reply: function(e) {
      Events.stopEvent(e);
      var prop = this.vocModel.properties['replies'];
      var params = {
        '$backLink': prop.backLink,
        '$title': e.target.$data('title'),
        '-makeId': G.nextId(),
        'forum': this.resource.get('forum')
      };

      params[prop.backLink] = this.resource.getUri();
      Events.trigger('navigate', U.makeMobileUrl('make', prop.range, params));
    },

//    tap: Events.defaultTapHandler,
//    click: Events.defaultClickHandler,
    render: function(options) {
      var json = _.pick(this.resource.attributes, 'submitter', 'submitter.displayName', 'submitter.thumb', 'submitTime', 'title', 'description', 'votes');
      var thumb = json['submitter.thumb'];
      if (thumb) {
        var idx = thumb.indexOf('=');
        thumb = thumb.slice(idx + 1);
        json['submitter.thumb'] = thumb;

        var idx = thumb.indexOf('_thumbnail.');
        if (idx > 0) {
          var i = idx - 1;
          for (; i>=0  &&  thumb.charAt(i) != '_'; i--) {}
          var w, h;
          if (i) {
            var s = thumb.substring(i + 1, idx);
            idx = s.indexOf('-');
            w = s.substring(0, idx);
            h = s.substring(idx + 1);
          }
          var maxDim = w > h ? w : h;
          var clip = U.clipToFrame(60, 60, w, h, maxDim);
          if (clip) {
            json.top = clip.clip_top;
            json.right = clip.clip_right;
            json.bottom = clip.clip_bottom;
            json.left = clip.clip_left;
          }
        }
      }
      var html = this.template(json);
      if (options && options.renderToHtml)
//        this._html = '<{0} data-viewid="{2}">{1}</{0}>'.format(this.tagName, html, this.cid);
        this._html = '<{0}>{1}</{0}>'.format(this.tagName, html);
      else
        this.el.$html(html);

      U.recycle(json);
      return this;
    }
  }, {
    displayName: 'CommentListItemView'
  });
});
