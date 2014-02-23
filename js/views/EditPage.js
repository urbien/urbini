//'use strict';
define('views/EditPage', [
  'globals',
  'underscore',
  'utils',
  'events',
  'vocManager',
  'cache',
  'collections/ResourceList',
  'views/BasicPageView',
  'views/Header',
  'views/EditView',
  'views/ResourceImageView',
  'views/ResourceListView',
  'views/ControlPanel'
], function(G, _, U, Events, Voc, C, ResourceList, BasicPageView, Header, EditView, ResourceImageView, ResourceListView, ControlPanel) {
  var editParams = ['action', 'viewId'];
  return BasicPageView.extend({
    autoFinish: false,
    className: 'scrollable',
    initialize: function(options) {
      _.bindAll(this, 'render', 'edit', 'home', 'set', 'resetForm');
      BasicPageView.prototype.initialize.apply(this, arguments);
      
  //    this.resource.on('change', this.render, this);
      this.makeTemplate('resourceEdit', 'template', this.vocModel.type);
      this.editOptions = _.extend({action: 'edit'}, _.pick(options, editParams));
      _.extend(this, this.editOptions);
      this.listenTo(Events, "mapReady", this.showMapButton);

      var res = this.resource;
  //    var json = res.toJSON();
  //    json.viewId = this.cid;
      this.settings = {viewId: this.cid};
      if (U.isAssignableFrom(res, "AppInstall")) {
        settings.submit = this.loc('allow');
        settings.cancel = this.loc('deny');
        this.editOptions.saveOnBack = false;
//        settings.noCancel = true;
      }
      
      var isGeo = this.isGeo();
      this.buttons = {
        back: true,
//        menu: true,
        rightMenu: !G.currentUser.guest,
        login: G.currentUser.guest
      };
    
      this.header = new Header({
        model: res, 
  //      pageTitle: this.pageTitle || res.get('davDisplayName'), 
        buttons: this.buttons,
        viewId: this.cid,
        parentView: this,
        isEdit: true
      });
      
      this.addChild(this.header);
      
      var reqParams = _.getParamMap(window.location.href);
      var editCols =  reqParams['$editCols'];
      this.isVideo = res.isA('VideoResource');
      if (!editCols && !this.isVideo) {
        this.imageView = new ResourceImageView({model: res, parentView: this});
        this.addChild(this.imageView);
      }
      
      this.editView = new EditView(_.extend({model: res, parentView: this}, this.editOptions));
      this.addChild(this.editView);
      if (this.editParams)
        this.editView.set(this.editParams);
    },
    
//    shortcut: function() {
//      U.hasUnsetEditableProperties(this.resource);
//      var meta = this.resource.vocModel.properties,
//          atts = this.resource.attributes,
//          numUnset = 0;
//      
//      for (var props in meta) {
//        if (meta[])
//      }
//    },
    
    set: function(params) {
      _.extend(this, params);
      if (this.editView)
        this.editView.set(params);
      else
        this.editParams = params;
    },
    events: {
      'click #edit'   : 'edit',
//      'click': 'click',
      'click #homeBtn': 'home'
    },
    resetForm: function() {
      this.editView && this.editView.resetForm();
    },
    home: function() {
//      this.router.navigate('', {trigger: true, replace: false});
      var here = window.location.href;
      window.location.href = here.slice(0, here.indexOf('#'));
      return this;
    },
    edit: function(e) {
      Events.stopEvent(e);
      this.router.navigate(U.makeMobileUrl('edit', this.resource), {trigger: true, replace: true});
      return this;
    },

    render: function(options) {
      if (!this.rendered) 
        this.addToWorld(null, true);
      
      var self = this;
      this.getFetchPromise().done(function() {
        self.renderHelper(options);
        self.finish();
      });
    },
    
    renderHelper: function(options) {
      this.$el.html(this.template(this.settings));
      var views = {
        '#resourceEditView': this.editView,
        '#headerDiv'       : this.header
      };
      
//      if (this.imageView)
//        views['div#resourceImage'] = this.imageView;

      this.assign(views);      
//      if (G.theme.backgroundImage) 
//        this.$('#resourceEditView').$css('background-image', 'url(' + G.theme.backgroundImage +')');

      // Comments inline
      var isComment = U.isAssignableFrom(this.vocModel, U.getLongUri1("model/portal/Comment"));
      if (!isComment) 
        return this;
      
      var self = this;
      var ranges = [];
      ranges.push(this.vocModel.type);
      var inlineLists = {};
      Voc.getModels(ranges).done(function() {
        var params = _.getParamMap(window.location.href);
        var type = self.vocModel.type;
        var listModel = U.getModel(type);
        var inlineList = C.getResourceList(self.vocModel, U.getQueryString(params, true));
        if (!inlineList) {
          inlineList = new ResourceList(null, {model: self.vocModel, params: params});
          inlineList.fetch({
            success: function() {
//              var currentlyInlined =  res.inlineLists || {};
//              if (inlineList.size() && !res._settingInlineList) && !currentlyInlined[name]) {
//                res.setInlineList(name, inlineList);
//              }
            self.commentsView = new ResourceListView({model: inlineList, parentView: self, el: this.$('#comments')[0]});
            self.addChild(self.commentsView);
            self.assign('#comments', self.commentsView);
              
//              _.each(['updated', 'added', 'reset'], function(event) {
//                self.stopListening(inlineList, event);
//                self.listenTo(inlineList, event, function(resources) {
//                  resources = U.isCollection(resources) ? resources.models : U.isModel(resources) ? [resources] : resources;
//                  var options = {};
//                  options[event] = true;
//                  var commonParams = {
//                      model: rl,
//                      parentView: this
//                    };
//
//                  self.refresh(resources, options);
//                });
//              });
            }
          });
        }
      // end Comments
      });
      
      return this;
    }
  }, {
    displayName: 'EditPage'
  });
});
