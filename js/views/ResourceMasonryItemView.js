//'use strict';
define('views/ResourceMasonryItemView', [
  'globals',
  'underscore',
  'utils',
  'events',
  'views/BasicView',
  'domUtils',
  'physicsBridge'
], function(G, _, U, Events, BasicView, DOM, Physics) {
  var RMIV = BasicView.extend({
//    className: 'nab nabBoard masonry-brick',
//    className: 'pin',
//    tagName: 'li',

    className: 'nab masonry-brick',
    tagName: 'div',
    TAG: "ResourceMasonryItemView",
    style: {
      'transform-origin': '50% 50%'
    },
    initialize: function(options) {
      if (this._initialized) {
        this._initializedCounter++;
        this.resource = this.model = options.resource || options.model;
        return;
      }

      _.bindAll(this, 'render', 'like', 'click'); // fixes loss of context for 'this' within methods
      BasicView.prototype.initialize.apply(this, arguments);

      options = options || {};
      options.vocModel = this.vocModel;

      var type = this.vocModel.type;
//          preinitialized = options.preinitialized || RMIV.preinitialize(options);
//      _.extend(this, preinitialized);
      var cloned = this.clonedProperties;
      var viewport = G.viewport;

      this.isModification = this.doesModelSubclass('system/changeHistory/Modification'); //U.isAssignableFrom(this.vocModel, U.getLongUri1('system/changeHistory/Modification'));
      if (this.isModification)
        this.makeTemplate('masonry-mod-list-item', 'template', type);
      else
        this.makeTemplate('masonry-list-item', 'template', type);

      if (viewport.height > viewport.width) {
        this.IMG_MAX_WIDTH = 272;
        vocModel = this.vocModel;
        var imgP, isBM, clonedIR = cloned.ImageResource;

        var ww = viewport.width;
        if (/*ww >= 320  && */ ww < 340)
          imgP = clonedIR  &&  clonedIR['bigMedium320'];
        else  if (/*ww >= 360  &&*/  ww < 380)
          imgP = clonedIR  &&  clonedIR['bigMedium360'];
        else if (ww <= 420) {
          imgP = clonedIR  &&  clonedIR['bigMedium400'];
//          if (ww != 400)
//            isBM = true;
        }

        if (!imgP) {
          imgP = clonedIR  &&  clonedIR['bigMediumImage'];
          if (imgP)
            isBM = true;
          else
            imgP = clonedIR  &&  clonedIR['mediumImage'];
        }
        else if (!isBM)
          this.IMG_MAX_WIDTH = vocModel.properties[imgP].imageWidth;
      }
      else
        this.IMG_MAX_WIDTH = 205; // value of CSS rule: ".nab .anab .galleryItem_css3 img"      // resourceListView will call render on this element
//      this.$el.attr('style', 'width:' + (this.IMG_MAX_WIDTH + 20) + 'px !important');
  //    this.model.on('change', this.render, this);
      this._initialized = true;
      return this;
    },

    reset: function() {
      this.rendered = false;
      this.undelegateNonDOMEvents();
//      this.el.$empty();
      return this;
    },

    events: {
      'click .like': 'like',
      'click': 'click'
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
          G.log(self.TAG, 'error', 'couldn\'t create like');
        }
      });
    },
//    tap: Events.defaultTapHandler,
    click: function(e) {
//      if (this.mvProp)
//        Events.defaultClickHandler(e);
//      else {
      if (this.mvProp)
        return;
      if (e.target.tagName != 'A'  &&  (!e.target.className  || e.target.className.indexOf('like') == -1)) {
        var p = this.parentView;
        if (p && p.mode == G.LISTMODES.CHOOSER) {
          Events.stopEvent(e);
          Events.trigger('chooser:' + U.getQueryParams().$prop, this.model);
        }
      }
//      G.log(this.TAG, "Recording step for tour: selector = 'href'; value = '" + e.target.href);
    },

    doRender: function(options, data) {
      if (this.el.childElementCount)
        return this.updateTile(options, data);

      var html = this.template(data, options && options.unlazifyImages);
      if (options && options.renderToHtml) {
//        var tagName = this.tagName || 'div';
//        this._html = '<{0} class="{1}">{2}</{0}>'.format(tagName, this.className, html);
//        this._html = '<{0}>{1}</{0}>'.format(tagName, html);
//        this._html = html;
        this._html = html;
        return this;
      }
      else
        this.el.$html(html);

      if (options && options.style)
        this.el.$css(options.style);
    },

    render: function(options) {
      if (this.isModification)
        return this.renderModificationTile(options);

      if (this.doesModelImplement('Reference'))
        return this.renderReferenceTile(options);

      if (!this.doesModelImplement('Intersection'))
        return this.renderTile(options);

      var vocModel = this.vocModel,
          viewCl = this.constructor,
          meta = vocModel.properties,
          m = this.resource,
          cloned = viewCl.clonedProperties,
          clonedXProps = cloned.Intersection;

      if (!meta)
        return this;

      var href = window.location.href;
      var qidx = href.indexOf('?');
      var a = clonedXProps['a'];
      var b = clonedXProps['b'];
      if (!a  ||  !b)
        return this.renderTile(options);

      if (qidx == -1)
        return this.renderIntersectionTile(options, a, 'Intersection.a');
      var p = href.substring(qidx + 1).split('=')[0];
      if (p == a)
        return this.renderIntersectionTile(options, b, 'Intersection.b');
      else
        return this.renderIntersectionTile(options, a, 'Intersection.a');
//        var href = window.location.href;
//        var qidx = href.indexOf('?');
//        var a = U.getCloneOf(meta, 'Intersection.a')[0];
//        var aprop;
//        if (qidx == -1) {
//          aprop = models[0].get(a);
//        }
//        else {
//          var b = U.getCloneOf(meta, 'Intersection.b')[0];
//          var p = href.substring(qidx + 1).split('=')[0];
//          var delegateTo = (p == a) ? b : a;
//          aprop = models[0].get(delegateTo);
//        }
//        var type = U.getTypeUri(U.getTypeUri(aprop['value']), {type: aprop['value']});


//      return this.renderTile();
    },

    updateTile: function(options, obj) {
      var gItem = this.el.firstChild,
          gItemA = gItem.querySelector('a'),
          gItemImg = gItemA.querySelector('img'),
          nabRL = this.el.querySelector('.nabRL'),
          appBadge = this.el.querySelector('.appBadge'),
          nabRLDivs = nabRL.$('div'),
          nabRLGridCols = nabRLDivs[0],
          nabRLSocial = nabRLDivs[1],
          tournament = nabRL.querySelector('.b'),
          meta = this.vocModel.properties,
          resourceUri = U.makePageUrl('view', this.resource.getUri()),
          atts = this.resource.attributes,
          imgSrc = obj.resourceMediumImage,
          cloned = this.clonedProperties,
          gridCols = this.el.querySelector('.gridCols');
          blankImg = G.getBlankImgSrc(),
          prevStyle = this._prevGalleryItemStyle || "",
          newStyle = "";

//              comments = data.v_showCommentsFor && nabRLSocial.firstChild,
//              votes = data.v_showVotesFor && nabRLSocial.firstChild
      if (obj.imgWidth) {
        if (!obj.top)
          newStyle += "height:" + obj.imgHeight + "px;";

        if (!obj.left)
          newStyle += "width:" + obj.imgWidth + "px;";

        if (newStyle != prevStyle)
          gItem.$attr('style', newStyle);
      }
      else {
        if (obj.height)
          newStyle += "height:" + obj.height + "px;";

        if (obj.width)
          newStyle += "width:" + obj.width + "px;";

        if (newStyle != prevStyle)
          gItem.$attr('style', newStyle);
      }

      this._prevGalleryItemStyle = newStyle;

      gItemA.href = obj.rUri || 'about:blank';
      gItemImg.$data('for', U.getImageAttribute(this.resource, obj.imageProperty));
      if (imgSrc && G.lazifyImages) {
        gItemImg.setAttribute(G.lazyImgSrcAttr, imgSrc);
        gItemImg.$removeClass('wasLazyImage');
        gItemImg.$addClass('lazyImage');
        gItemImg.src = blankImg;
      }
      else
        gItemImg.src = imgSrc || blankImg;

      if (obj.imgWidth)
        gItemImg.style.width = obj.imgWidth + 'px';
      else
        gItemImg.$attr('width', obj.width + 'px');
      if (obj.imgHeight)
        gItemImg.style.height = obj.imgHeight + 'px';
      else
        gItemImg.$attr('height', obj.height + 'px');

      if (!appBadge) {
        if (_.has(obj, 'friendMeCount')) {
          appBadge = document.createElement('div');
          appBadge.setAttribute('class', 'appBadge');
          appBadge.innerHTML = '<a style="color:white;" href="' + obj.friendMeUri + '">' + obj.friendMeCount + '</a>';
          this.el.insertBefore(appBadge, nabRL);
        }
      }
      else {
        if (_.has(obj, 'friendMeCount')) {
          var a = appBadge.querySelector('a');
          if (a) {
            a.href = obj.friendMeUri;
            a.textContent = obj.friendMeCount;
          }
        }
      }
      if (obj.modifiedBy) {
        var modA = this.el.querySelector('.urbien a');
        modA.href = obj.modifiedBy;
        var img = modA.children[0];

        if (img && G.lazifyImages) {
          img.setAttribute(G.lazyImgSrcAttr, imgSrc);
          img.$removeClass('wasLazyImage');
          img.$addClass('lazyImage');
          img.src = blankImg;
        }
        else {
          var src = this.resource.get('modifiedBy.thumb');
          if (src) {
            var idx = src.indexOf('wf/');
            if (idx != -1)
              src = src.substring(idx);
          }
          img.src = src;
        }
      }
//      nabRLGridCols.innerHTML = obj.gridCols;
      /*
      var grid = U.getCols(this.resource, 'grid');
      if (grid) {
        var mediumImageProp = cloned['ImageResource'].mediumImage,
            smallImageProp = cloned['ImageResource'].smallImage,
            a,
            s;

        for (var row in grid) {
          var pName = grid[row].propertyName,
              prop;

          if (pName == mediumImageProp  ||  pName == smallImageProp)
            continue;

          prop = meta[pName];
          if (!prop.skipLabelInGrid) {
            var label = nabRLGridCols.querySelector('.label[data-prop="' + pName + '"]');
            if (label)
              label.textContent = row;
          }

          a = nabRLGridCols.querySelector('a[data-prop="' + pName + '"]');
          if (a) {
            s = grid[row].value;
            if (grid[row].resourceLink) {
              a.href = resourceUri;
              a.textContent = atts[pName];
  //            s = '<a href="' + resourceUri + '">' + atts[pName] + '</a>';
            }
            else if (meta[pName].facet  &&  meta[pName].facet.indexOf("/href") != -1) {
              a.href = s;
              a.textContent = s;
  //            s = '<a href="' + s + '">' + s + '</a>';
            }
          }

//          gridCols += s;
        }
      }
      */
      if (obj.gridCols) {
        gridCols.innerHTML = obj.gridCols;
//        DOM.queueRender(gridCols, {
//          innerHTML: obj.gridCols
//        });
      }
      else {
        if (gridCols)
          gridCols.style.visibility = 'hidden';
      }
      if (obj.v_showCommentsFor) {
        var a = nabRLSocial.$('a'),
            aMake = a[0],
            aList = a[1];

        if (aMake) {
          aMake.href = U.makePageUrl('make', 'http://www.hudsonfog.com/voc/model/portal/Comment', {$editCols: 'description', forum: obj.v_showCommentsFor.uri, '-makeId': G.nextId()});
          if (aList && obj.v_showCommentsFor.count) {
            aList.href = U.makePageUrl('list', 'model/portal/Comment', {forum: obj.v_showCommentsFor.uri});
            var countNode = aList.childNodes[1];
            if (countNode)
              countNode.textContent = obj.v_showCommentsFor.count;
          }
        }
      }

      if (obj.v_showVotesFor) {
        var aMake = nabRLSocial.querySelector('.like');
        if (aMake) {
          aMake.href = U.makePageUrl('make', 'http://www.hudsonfog.com/voc/aspects/tags/Vote', {vote: 'Like', votable: obj.v_showVotesFor.uri, '-makeId': G.nextId()});
          var divList = nabRLSocial.$('div')[0];
          if (divList) {
            var aList = divList.querySelector('a');
            if (aList && obj.v_showVotesFor.count) {
              var aList = nabRLSocial.querySelector('div');
              aList.href = U.makePageUrl('list', 'aspects/tags/Vote', {votable: obj.v_showVotesFor.uri, $title: davDisplayName + ' liked by'});
              var countNode = aList.childNodes[1];
              if (countNode)
                countNode.textContent = obj.v_showVotesFor.count;
            }
          }
        }
      }

      if (tournament && obj.v_submitForTournament) {
        tournament.href = obj.v_submitForTournament;
      }
    },

    renderTile: function(options, event) {
      var self = this,
          m = this.resource,
          atts = m.attributes,
          vocModel = this.vocModel,
          meta = vocModel.properties,
          imgP = this.imageProperty,
          cloned = this.clonedProperties;

      if (!meta)
        return this;

      var imgWidth = meta[imgP].imageWidth;
      this.IMG_MAX_WIDTH = imgWidth ||  this.maxImageDimension;
      var rUri = m.getUri();
//      if (!rUri) {
//        // <debug>
//        debugger;
//        // </debug>
//      }

      var tmpl_data = this.getBaseTemplateData();

//      var img = U.getCloneOf(vocModel, 'ImageResource.bigMediumImage')[0];
//      if (!img)
//        img = U.getCloneOf(vocModel, 'ImageResource.mediumImage')[0];

      tmpl_data.resourceMediumImage = img = atts[imgP];
      tmpl_data.imageProperty = imgP;

      var resourceUri = U.makePageUrl('view', rUri);
      var gridCols = '';
      var resourceLink;
      var i = 0;

      tmpl_data.contentWidth = this.IMG_MAX_WIDTH - 3;
      var grid = U.getColsMeta(vocModel, 'grid'),
          gCols = [],
          linesCount = 0,
          lineWidth = tmpl_data.contentWidth / 5;

      for (var g = 0; g < grid.length; g++) {
        var mediumImageProp = cloned['ImageResource'].mediumImage,
            smallImageProp = cloned['ImageResource'].smallImage,
            pName = grid[g],
            prop = meta[pName],
            pDisplayName = U.getPropDisplayName(prop),
            val = atts[pName] || prop.propertyGroupList || '';

        if (pName == mediumImageProp  ||  pName == smallImageProp)
          continue;

        symbolsCount = val.length;

        val = U.makeProp(m, prop, val || '').value || '';
        var label = '';
        if (!prop.skipLabelInGrid) {
          label += '<span data-prop="' + pName + '" class="label">' + pDisplayName + '</span>';
          symbolsCount += pDisplayName.length + 1;
        }
        if (prop.resourceLink)
          val = '<a data-prop="' + pName + '" href="' + resourceUri + '">' + val + '</a>';

        else if (prop.facet  &&  prop.facet.indexOf("/href") != -1)
          val = '<a data-prop="' + pName + '" href="' + val + '">' + val + '</a>';
//        else if (meta[pName].range == 'date' ||  meta[pName].range == 'ComplexDate'  ||  meta[pName].range == 'dateTime')
//          s += U.getFormattedDate(json[pName]);

        linesCount += (symbolsCount < lineWidth ? 1 : Math.round(symbolsCount / lineWidth) + 1);
        if (label || val)
          gCols.push(label + val);
      }

      gridCols = gCols.join('<br />');
      var divHeight;
      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
  //      tmpl_data = _.extend(tmpl_data, {imgSrc: img});


        var idx = img.lastIndexOf('.jpg_');
        var idx1 = img.indexOf('_', idx + 5);
        if (idx != -1  &&  idx1 != -1) {
          var s = img.substring(idx + 5, idx1);
          idx = s.indexOf("-");
          if (idx != -1) {
            var w = s.substring(0, idx);
            if (w <= this.IMG_MAX_WIDTH) {
              tmpl_data['width'] = s.substring(0, idx);
              tmpl_data['height'] = s.substring(idx + 1);
            }
          }
        }
        if (tmpl_data['width'])
          maxDim = imgWidth;
        else {
          var oWidth  = m.get('ImageResource.originalWidth'); //atts.originalWidth;
          var oHeight = m.get('ImageResource.originalHeight');
          if (typeof oWidth != 'undefined' && typeof oHeight != 'undefined') {
            var ratio = 1;
            if (oWidth > oHeight) {
              if (oWidth > this.IMG_MAX_WIDTH)
                ratio = this.IMG_MAX_WIDTH / oWidth;
            }
            else {
              if (imgWidth) {
                if (oWidth > this.IMG_MAX_WIDTH)
                  ratio = this.IMG_MAX_WIDTH / oWidth;
              }
              else if (oHeight > this.IMG_MAX_WIDTH)
                ratio = this.IMG_MAX_WIDTH / oHeight;
            }
            var iW = Math.floor(oWidth * ratio);
            var iH = Math.floor(oHeight * ratio);
            tmpl_data['imgWidth'] = iW;
            tmpl_data['imgHeight'] = iH;
            var maxDim = this.maxImageDimension;

            if (imgWidth) {
              var idx = img.lastIndexOf('.jpg_');
              var idx1 = img.indexOf('_', idx + 5);
              if (idx != -1  &&  idx1 != -1) {
                var s = img.substring(idx + 5, idx1);
                idx = s.indexOf("-");
                if (idx != -1) {
                  var w = s.substring(0, idx);
                  if (w <= imgWidth) {
                    tmpl_data['width'] = s.substring(0, idx);
                    tmpl_data['height'] = s.substring(idx + 1);
                  }
                }
              }
              if (tmpl_data['width'])
                maxDim = imgWidth;
            }

            if (maxDim  &&  (maxDim > this.IMG_MAX_WIDTH)) {
              var mdW, mdH;
              if (oWidth >= oHeight) {
                mdW = maxDim > oWidth ? oWidth : maxDim;
                var r = maxDim /oWidth;
                mdH = Math.floor(oHeight * r);
              }
              else {
                mdH = maxDim > oHeight ? oHeight : maxDim;
                var r = maxDim /oHeight;
                mdW = Math.floor(oWidth * r);
              }
              var dW = Math.floor((mdW - iW) / 2);
              var dH = Math.floor((mdH - iH) / 2);
              tmpl_data['top'] = dH;
              tmpl_data['right'] = iW + dW;
              tmpl_data['bottom'] = iH + dH;
              tmpl_data['left'] = dW;
              tmpl_data['margin-top'] = 0;
              tmpl_data['margin-left'] = 0 - dW;
            }
          }
        }
      }
      var dn = atts.davDisplayName;
      var dnProps = this.displayNameProps;
      if (dn)
        tmpl_data['davDisplayName'] = dn;

      else if (dnProps) {
        var first = true;
        dn = '';
        for (var i=0; i<dnProps.length; i++) {
          var val = atts[dnProps[i]];
          if (val) {
            if (first)
              first = false;
            else
              dn += ' ';
            dn += val;
          }
        }
        tmpl_data['davDisplayName'] = dn;
      }
      if (!gridCols.length)
        gridCols = '<a href="' + resourceUri + '">' + dn + '</a>';

      tmpl_data['gridCols'] = gridCols;

//      var rUri = G.pageRoot + '#view/' + _.encode(U.getLongUri1(json[imgSrc].value), snmHint);

      var submittedBy = cloned['Submission']  &&  cloned['Submission'].submittedBy;
      if (submittedBy) {
        tmpl_data.creator = atts[submittedBy];
        tmpl_data.creatorDisplayName = atts[submittedBy + '.displayName'];
        tmpl_data.creatorThumb = atts[submittedBy + '.thumb'];
      }

      tmpl_data['rUri'] = resourceUri;
      this.setCollaborationPointData(tmpl_data, atts, rUri);
      this.setVotableData(tmpl_data, atts, rUri);
//      var comments = cloned['CollaborationPoint.comments'];
//      if (comments) {
//        var pMeta = meta[comments];
//        comments = atts[pMeta.shortName] || {count: 0};
//        tmpl_data.v_showCommentsFor = { uri: U.getLongUri1(rUri), count: comments.count }; // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
//      }
//
//      if (this.doesModelImplement('Votable')) {
//        var votes = cloned['Votable.likes'];
//        if (!votes)
//          votes = cloned['Votable.voteUse'];
//
//        if (votes) {
//          var pMeta = meta[votes];
//          votes = atts[pMeta.shortName] || {count: 0};
//          tmpl_data.v_showVotesFor = { uri: U.getLongUri1(rUri), count: votes.count }; // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
//        }
//      }

      if (this.doesModelSubclass(G.commonTypes.App)) {
        var params = _.getParamMap(window.location.hash);
        if ((params  &&  params.$myApps)  ||  (atts.lastPublished  &&  atts.lastModifiedWebClass  && atts.lastPublished >= atts.lastModifiedWebClass) || (!atts.lastPublished  &&  atts.dashboard)) {
          var uri = G.serverName + '/' + G.pageRoot.substring(0, G.pageRoot.lastIndexOf('/') + 1) + atts.appPath;
          tmpl_data.tryApp = uri;
          tmpl_data.rUri = uri;
        }

        var followers = atts.appConnections || {count: 0};
        var followersCount = followers.count;
        if (followersCount) {
          tmpl_data.followersCount = followersCount;
          tmpl_data.followersUri = U.getPageUrl('list', meta.appConnections.range, {friend2: atts._uri});
        }
//        if (json['friends'].count)
//          tmpl_data.friends = json['friends'].count;
      }

      if (this.doesModelSubclass("commerce/urbien/Tournament"))
        tmpl_data.v_submitForTournament = U.makePageUrl('list', 'media/publishing/Video', {'-tournament': rUri, '-tournamentName': dn});

      var nabs = cloned['ImageResource'].nabs;
      if (nabs) {
        var pMeta = meta[nabs];
        var uri = _.encode(U.getLongUri1(rUri) + '?m_p=' + nabs + '&b_p=' + pMeta.backLink);
        tmpl_data.v_showRenabFor = uri;
      }

      this.style.width = (this.IMG_MAX_WIDTH + 17) + 'px';
      if (tmpl_data['height'])
        this.style.height = tmpl_data['height'];

      _.extend(this.el.style, this.style);
//      this.el.style.setProperty('width', (self.IMG_MAX_WIDTH + 17) + 'px'); //, 'important'); // 17 is all paddings around the image
//      this.el.style.setProperty('height', tmpl_data['height']);
//      var h = tmpl_data['imgHeight'] ? tmpl_data['imgHeight'] : 0;
//      var linesHeight = (linesCount * 15); // 15 is the font height of 12px with surrounding space;
//      this.el.style.setProperty('height', h + linesHeight + 50 + 'px'); // + 50 to include comments and likes
//      tmpl_data['commentLikeTop'] = linesHeight - 4;
//      if (typeof img == 'undefined')  //  if there is no image the title is too close to the to border and comments do not touch bottom border
//        tmpl_data['commentLikeTop'] += 19;
//      if (!this.postRender) {
//        this.postRender = function() {
//    //      this.$el.attr('style', 'width:' + (this.IMG_MAX_WIDTH + 20) + 'px !important;');
//          var style = self.el.style,
//              gItem = self.el.querySelector('.galleryItem_css3'),
//              gItemImg = self.el.querySelector('.galleryItem_css3 img'),
//              gItemImgStyle = gItemImg.style;
//
//          style.setProperty('width', (self.IMG_MAX_WIDTH + 17) + 'px', 'important');
//          if (divHeight)
//            style.height = divHeight + 'px';
//          else
//            style.removeProperty('height');
//    //      if (!tmpl_data['top'])
//    //        this.$el.find('.galleryItem_css3 img').attr('style', 'max-width:' + this.IMG_MAX_WIDTH + 'px !important;');
//
//          gItemImgStyle.width = tmpl_data['imgWdth'];
//          gItemImgStyle.height = tmpl_data['imgHeight'];
//          if (tmpl_data['top']  &&  isBM) {
//            gItem.style.height = (tmpl_data['bottom'] - tmpl_data['top']) + 'px';
//            gItemImgStyle.position = 'absolute';
//            gItemImgStyle[G.crossBrowser.css.transformLookup] = DOM.positionToMatrix(tmpl_data['top'], tmpl_data['left']);
////            gItemImgStyle.top = '-' + tmpl_data['top'] + 'px';
////            gItemImgStyle.left = '-' + tmpl_data['left'] + 'px';
//            gItemImgStyle.clip = 'rect(' + tmpl_data['top'] + 'px,' + tmpl_data['right'] + 'px,' + tmpl_data['bottom'] + 'px,' + tmpl_data['left'] + 'px)';
////            tmpl_data['top'] = dH;
////            tmpl_data['right'] = iW + dW;
////            tmpl_data['bottom'] = iH + dH;
////            tmpl_data['left'] = dW;
////            tmpl_data['margin-top'] = 0;
////            tmpl_data['margin-left'] = 0 - dW;
//          }
//        };
//      }
      this.doRender(options, tmpl_data);
//      if (!this.postRender) {
//        this.postRender = function() {
//    //      this.$el.attr('style', 'width:' + (this.IMG_MAX_WIDTH + 20) + 'px !important;');
//          var style = self.el.style,
//              gItem = self.el.querySelector('.galleryItem_css3'),
//              gItemImg = self.el.querySelector('.galleryItem_css3 img'),
//              gItemImgStyle = gItemImg.style;
//
//          style.setProperty('width', (self.IMG_MAX_WIDTH + 17) + 'px', 'important');
//          if (divHeight)
//            style.height = divHeight + 'px';
//          else
//            style.removeProperty('height');
//    //      if (!tmpl_data['top'])
//    //        this.$el.find('.galleryItem_css3 img').attr('style', 'max-width:' + this.IMG_MAX_WIDTH + 'px !important;');
//
//          gItemImgStyle.width = tmpl_data['imgWdth'];
//          gItemImgStyle.height = tmpl_data['imgHeight'];
//          if (tmpl_data['top']  &&  isBM) {
//            gItem.style.height = (tmpl_data['bottom'] - tmpl_data['top']) + 'px';
//            gItemImgStyle.position = 'absolute';
//            gItemImgStyle[DOM.prefix('transform')] = DOM.positionToMatrix3DString(tmpl_data['left'], tmpl_data['top']);
////            gItemImgStyle.top = '-' + tmpl_data['top'] + 'px';
////            gItemImgStyle.left = '-' + tmpl_data['left'] + 'px';
//            gItemImgStyle.clip = 'rect(' + tmpl_data['top'] + 'px,' + tmpl_data['right'] + 'px,' + tmpl_data['bottom'] + 'px,' + tmpl_data['left'] + 'px)';
//            /*
//            tmpl_data['top'] = dH;
//            tmpl_data['right'] = iW + dW;
//            tmpl_data['bottom'] = iH + dH;
//            tmpl_data['left'] = dW;
//            tmpl_data['margin-top'] = 0;
//            tmpl_data['margin-left'] = 0 - dW;
//            */
//          }
//        };
//      }

      return this;
    },

    renderReferenceTile: function(options, event) {
      var m = this.resource,
          atts = m.attributes,
          meta = this.vocModel.properties,
          cloned = this.clonedProperties;

      if (!meta)
        return this;

//      var img = U.getCloneOf(meta, 'ImageResource.mediumImage')[0];
//      if (img == null)
//        img = U.getCloneOf(meta, 'ImageResource.bigMediumImage')[0];
//      if (img == null)
//      var json = m.toJSON();
      var tmpl_data = this.getBaseTemplateData();

      var forResource = U.getCloneOf(vocModel, 'Reference.forResource')[0];
      var resourceDisplayName = U.getCloneOf(vocModel, 'Reference.resourceDisplayName')[0];
      var forResourceUri = atts[forResource];
      if (!forResourceUri)
        return this;
      var rUri = U.getLongUri1(forResourceUri);

      var img = U.getCloneOf(vocModel, 'Reference.resourceImage')[0] ||
                U.getCloneOf(vocModel, 'ImageResource.mediumImage')[0];

      img = img && atts[img];
      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
  //      tmpl_data = _.extend(tmpl_data, {imgSrc: img});
      }

      var dn = atts[resourceDisplayName];
      tmpl_data['davDisplayName'] = dn;

      var resourceUri = G.pageRoot + '#view/' + _.encode(rUri);
      var resourceLink;
//      var i = 0;
      var gridCols = '<a href="' + resourceUri + '">' + dn + '</a>';
      tmpl_data['gridCols'] = gridCols;

//      var rUri = G.pageRoot + '#view/' + _.encode(U.getLongUri1(json[imgSrc].value), snmHint);
      var forResourceModel = U.getModel(U.getTypeUri(forResourceUri));
      var c =  forResourceModel ? forResourceModel : m.vocModel;
      tmpl_data['rUri'] = resourceUri;

      this.setCollaborationPointData(tmpl_data, atts, rUri);
//      var comments = cloned['CollaborationPoint.comments'];
//      if (comments) {
//        var pMeta = meta[comments];
//        tmpl_data.v_showCommentsFor = { uri: U.getLongUri1(rUri), count: atts[pMeta.shortName].count }; //_.encode(U.getLongUri1(rUri)); // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
//      }

      this.setVotableData(tmpl_data, atts, rUri);
//      if (this.doesModelImplement('Votable')) {
//        var votes = cloned['Votable.likes'];
//        if (!votes)
//          votes = cloned['Votable.voteUse'];
//        if (votes) {
//          var pMeta = meta[votes];
//          tmpl_data.v_showVotesFor = { uri: U.getLongUri1(rUri), count: atts[pMeta.shortName].count }; //_.encode(U.getLongUri1(rUri)); // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
//        }
//      }

      this.setImageResourceNabsData(tmpl_data, atts, rUri);
//      var nabs = cloned['ImageResource.nabs'];
//      if (nabs) {
//        var pMeta = meta[nabs];
//        var uri = _.encode(U.getLongUri1(rUri) + '?m_p=' + nabs + '&b_p=' + pMeta.backLink);
//        tmpl_data.v_showRenabFor = uri;
//      }

      return this.doRender(options, tmpl_data);
    },

    renderIntersectionTile: function(options, delegateTo, cloneOf) {
      var m = this.resource,
          atts = m.attributes,
          vocModel = this.vocModel,
          meta = vocModel.properties,
          cloned = this.clonedProperties;

      if (!meta)
        return this;

      var tmpl_data = this.getBaseTemplateData(),
          img,
          dn;

      if (cloneOf == 'Intersection.a') {
        var aF = clonedXProps['aFeatured'];
        var aT = clonedXProps['aThumb'];
        img = aF ? atts[aF[0]] : atts[aT[0]];
      }
      else {
        var bF = clonedXProps['bFeatured'];
        var bT = clonedXProps['bThumb'];
        img = bF ? atts[bF[0]] : atts[bT[0]];
      }

      dn = atts[delegateTo];
      if (!dn)
        return this;

      var rUri = dn;
      dn = atts[delegateTo + '.displayName'] || dn;
//      var img = U.getCloneOf(meta, 'ImageResource.mediumImage')[0];
//      if (img == null)
//        img = U.getCloneOf(meta, 'ImageResource.bigMediumImage')[0];
//      if (img == null)
      tmpl_data.resourceMediumImage = img;

      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
  //      tmpl_data = _.extend(tmpl_data, {imgSrc: img});
      }

      tmpl_data['rUri'] = rUri;
      tmpl_data['davDisplayName'] = dn;

      var resourceUri = G.pageRoot + '#view/' + _.encode(rUri);

      var gridCols = '<a href="' + resourceUri + '">' + dn + '</a>';
      tmpl_data['gridCols'] = gridCols;

//      var rUri = G.pageRoot + '#view/' + _.encode(U.getLongUri1(json[imgSrc].value), snmHint);
      var type = U.getTypeUri(rUri);

      var forResourceModel = type ? U.getModel(type) : null;
      var c =  forResourceModel ? forResourceModel : m.constructor;
      if (forResourceModel) {
        var meta = c.properties;
        meta = meta || m.properties;
      }

      tmpl_data['rUri'] = resourceUri;
      this.setCollaborationPointData(tmpl_data, atts, rUri);
      this.setVotableData(tmpl_data, atts, rUri);
      this.setImageResourceNabsData(tmpl_data, atts, rUri);
      return this.doRender(options, tmpl_data);
    },

    setVotableData: function(tmpl_data, atts, rUri) {
      var meta = this.vocModel.properties,
          cloned = this.clonedProperties,
          vProps = cloned.Votable;

      if (vProps) {
        var votes = vProps.likes;
        if (!votes)
          votes = vProps.voteUse;

        if (votes) {
          var pMeta = meta[votes];
          votes = atts[pMeta.shortName] || {count: 0};
          tmpl_data.v_showVotesFor = {
            uri: U.getLongUri1(rUri), count: votes.count
          }; //_.encode(U.getLongUri1(rUri)); // + '?m_p=' + votes[0] + '&b_p=' + pMeta.backLink);
        }
      }
    },

    setImageResourceNabsData: function(tmpl_data) {
      var cloned = this.clonedProperties,
          nabs = cloned['ImageResource'].nabs;

      if (nabs) {
        var pMeta = meta[nabs];
        var uri = _.encode(U.getLongUri1(rUri) + '?m_p=' + nabs + '&b_p=' + pMeta.backLink);
        tmpl_data.v_showRenabFor = uri;
      }
    },

    setCollaborationPointData: function(tmpl_data, atts, rUri) {
      var cloned = this.clonedProperties,
          cpProps = cloned.CollaborationPoint;

      if (cpProps) {
        var comments = cpProps.comments,
            meta = this.vocModel.properties;

        if (comments) {
          var pMeta = meta[comments];
          comments = atts[pMeta.shortName] || {count: 0};
          tmpl_data.v_showCommentsFor = { uri: U.getLongUri1(rUri), count: comments.count }; //_.encode(U.getLongUri1(rUri)); // + '&m_p=' + comments[0] + '&b_p=' + pMeta.backLink);
        }
      }
    },

    renderModificationTile: function(options, event) {
      var meta = this.vocModel.properties,
          res = this.resource,
          atts = res.attributes,
          viewport = G.viewport;

      if (!meta)
        return this;

//      var json = this.resource.toJSON();
      var tmpl_data = this.getBaseTemplateData();
      var imgSrc = atts.v_imgSrc || 'forResource'; // what is this?
      if (typeof atts[imgSrc] == 'undefined')
        return this;

      var rUri = tmpl_data.rUri = U.makePageUrl('view', U.getLongUri1(atts[imgSrc]));
      var modBy = U.makePageUrl('view', U.getLongUri1(atts.modifiedBy));

      _.extend(tmpl_data, _.pick(atts, 'modifiedBy', 'resourceDisplayName', 'resourceMediumImage', 'dateModified', 'v_modifiedByPhoto'))
      var isHorizontal = this.isLandscape();
  //    alert(isHorizontal);
      var img = atts.resourceMediumImage;
      if (typeof img != 'undefined') {
        if (img.indexOf('Image/') == 0)
          img = img.slice(6);
        tmpl_data['resourceMediumImage'] = img;
  //      tmpl_data = _.extend(tmpl_data, {imgSrc: img});
      }

      var commentsFor = atts.v_showCommentsFor;
      if (typeof commentsFor != 'undefined'  &&  atts[commentsFor])
        tmpl_data['v_showCommentsFor'] = res.get(commentsFor); // returns long uri
//        tmpl_data['v_showCommentsFor'] = U.getLongUri1(atts[commentsFor]); // + '&m_p=comments&b_p=forum');


      var votesFor = atts.v_showVotesFor;
      if (typeof votesFor != 'undefined'  &&  atts[votesFor])
        tmpl_data['v_showVotesFor'] = res.get(votesFor); //+ '&m_p=votes&b_p=votable');
//        tmpl_data['v_showVotesFor'] = U.getLongUri1(atts[votesFor]); //+ '&m_p=votes&b_p=votable');

      var renabFor = atts.v_showRenabFor;
      if (typeof renabFor != 'undefined'  &&  atts[renabFor])
        tmpl_data.v_showRenabFor = _.encode(res.get(renabFor) + '&m_p=nabs&b_p=forResource');

      // set size of images included in the items to be able
      // to start masonry code before images downloading
      var oWidth  = atts.originalWidth;
      var oHeight = atts.originalHeight;
      if (typeof oWidth != 'undefined' && typeof oHeight != 'undefined') {
        var ratio = (oWidth > this.IMG_MAX_WIDTH) ? this.IMG_MAX_WIDTH / oWidth : 1;
        tmpl_data.imgWidth = Math.floor(oWidth * ratio);
        tmpl_data.imgHeight = Math.floor(oHeight * ratio);
      }

      this.el.style.setProperty('width', (this.IMG_MAX_WIDTH + 17) + 'px', 'important'); // 17 is all paddings around the image
//      this.el.style.setProperty('height', tmpl_data['height']);
      return this.doRender(options, tmpl_data);
    }
//    ,
//
//    _getCID: function(options) {
//      var res = options.resource;
//      return 'li' + res.collection.indexOf(res);
//    }
  }, {
    displayName: 'ResourceMasonryItemView',
    preinitData: {
      interfaceProperties: {
        ImageResource: ['bigMedium320', 'bigMedium360', 'bigMedium400', 'bigMediumImage', 'mediumImage', 'nabs'],
        Intersection: ['a', 'b', 'aThumb', 'aFeatured', 'aOriginalHeight', 'aOriginalWidth', 'bThumb', 'bFeatured', 'bOriginalHeight', 'bOriginalWidth'],
        Reference: ['resourceDisplayName'],
        Submission: ['dateSubmitted', 'submittedBy'],
        CollaborationPoint: ['comments'],
        Votable: ['likes', 'voteUse'],
        Buyable: null
      },
      superclasses: _.map(["commerce/urbien/Tournament", 'system/changeHistory/Modification', G.commonTypes.App], U.getLongUri1)
    },

    preinitialize: function(options) {
      var preinitData = this.preinitData,
          vocModel = options.vocModel,
          meta = vocModel.properties,
          preinit = BasicView.preinitialize.apply(this, arguments),
//          cloned = preinit.prototype.clonedProperties,
          imageProperty = U.getImageProperty(vocModel),
          more = {};

      if (imageProperty) {
        more.imageProperty = imageProperty;
        if (more.imageProperty)
          more.maxImageDimension = meta[imageProperty].maxImageDimension;
      }

      more.displayNameProps = U.getDisplayNameProps(vocModel);
      return preinit.extend(more);
    }
  });

  return RMIV;
});
