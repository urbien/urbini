define('views/ArticlePage', [
  'utils',
  'views/BasicPageView',
  'views/BackButton',
  'views/RightMenuButton'
], function(U, BasicPageView, BackButton, MenuButton) {
  function sectionToCols(section) {
    var cols = [];
    for (var i = 1; i < 5; i++) {
      var title = section.get('title' + i),
          link;
      
      if (!title)
        break;
      
      link = section.get('item' + i + 'Link');
      cols.push({
        icon: section.get('fontIcon' + i),
        title: title,
        subTitle: section.get('subtitle' + i),
        body: section.get('paragraph' + i),
        link: link && {
          text: 'learn more',
          href: link
        }
      })
    }
    
    return cols;
  };
  
  return BasicPageView.extend({
    autoFinish: false,
    style: {
      background: 'white'
    },
    initialize: function(options) {
      options = options || {};
      _.bindAll(this, 'render');
      BasicPageView.prototype.initialize.apply(this, arguments);
      this.makeTemplate('articlePageTemplate', 'template', this.vocModel.type);
      this.makeTemplate('colTemplate', 'colTemplate', this.vocModel.type);

      if (this.resource)
        this.resource.on('change', this.render, this);
      else if (this.collection)
        this.collection.on('reset', this.render, this);      
    },
    
    render: function() {
      var self = this,
          args = arguments;
      
      this.getFetchPromise().done(function() {
        self.renderHelper.apply(self, args);
        self.finish();
      });
    },
    
    renderHelper: function(options) {
      options = options ? _.clone(options) : {};
      if (!this.rendered)
        this.addToWorld(null, true); // auto-add page brick

      if (!this.rendered) {
        this.html(this.template(this.getBaseTemplateData()));
        var common = {
            viewId: this.cid,
            model: this.model,
            parentView: this
          };
          
        this.backBtn = new BackButton(common);
        this.menuBtn = new MenuButton(common);
            
        this.addChild(this.backBtn);
        this.addChild(this.menuBtn);
        this.body = this.$('.section')[0];
        this.btns = this.$('#headerUl')[0];
      }
        
      this.btns.$empty();      
      var frag = document.createDocumentFragment();
      [this.backBtn, this.menuBtn].forEach(function(v) {
        var el = v.render().el;
        el.style.width = '50%';
        frag.appendChild(el);
      });
      
      this.btns.$html(frag);
      
      var colsData = options.data || {};
      if (!colsData.cols)
        colsData.cols = this.getCols();

//      colsData.action = {
//        text: 'BLAAAH!',
//        link: '#'
//      }
      
      this.body.$html(this.colTemplate(_.extend(this.getBaseTemplateData(), colsData)));
    },
    
    getCols: function() {
      var cols = [];
      if (!this.resource)
        throw "unsupported";
        
      if (U.isAssignableFrom(this.vocModel, 'model/portal/Section'))
        return sectionToCols(this.resource);
      else if (this.resource.isA('Submission')) {
        var submitter = U.getCloneOf(this.vocModel, 'Submission.submittedBy')[0];
        return [{
          icon: 'ui-icon-tradle',
          title: this.resource.get('Submission.subject'),
          subTitle: 'by ' + this.resource.get(submitter + '.displayName') + '<br />(' + U.toMDYString(this.resource.get('Submission.dateSubmitted')) + ')',
          body: this.resource.get('Submission.description'),
          link: {
            text: 'more {0} by {1}'.format(U.getPlural(this.vocModel.displayName), this.resource.get(submitter + '.displayName')),
            href: this.resource.get(submitter)
          }
        }];
      }
      else
        throw "unsupported";
    }
  }, {
    displayName: 'ArticlePage'
  });
});