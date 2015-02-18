//'use strict';
define('templates', [
  'globals', 
  'underscore',
  'domUtils',
  'events'].concat(Lablz._widgetTemplates)
, function(G,_, DOM, Events, HTML, HTML_bb, HTML_topcoat, HTML_bootstrap) {
  _.templateSettings = {
    evaluate:    /\{\{(.+?)\}\}/g,
    interpolate: /\{\{=(.+?)\}\}/g
//    variable: 'G'
  };
  
  var lazyImgSrcAttr = G.lazyImgSrcAttr,
      blankImgSrc,
      lazyReplacement,
      lazyRegex,
      emptyLazyRegex,
      lazyClassRegex = DOM.lazyClassRegex,
//      initBlankImg,
      prepTemplate;
  
//  if (G.lazifyImages) {
//    initBlankImg = function() {
//      if (!blankImgSrc) {
//        blankImgSrc = G.getBlankImgSrc();
//        lazyReplacement = 'src="{0}" {1}'.format(blankImgSrc, lazyImgSrcAttr);
//        lazyRegex = new RegExp('src="{0}" {1}=\"?\'?([^\"\']+)\"?\'?'.format(blankImgSrc, lazyImgSrcAttr), 'ig');
//  //      emptyLazyRegex = new RegExp('src="{0}" {1}=\"\s*"?\'?'.format(blankImgSrc, lazyImgSrcAttr), 'ig');
//      }
//    };
//    
//    prepTemplate = function(text) {
//      initBlankImg();
//      return text.trim().replace(lazyImgSrcAttr, lazyReplacement);
//    };
//    
//    Events.once('appStart', initBlankImg);
//  } 
//  else {
//  }
  function prepTemplate(text) {
    return text.trim().replace(lazyImgSrcAttr, "src").replace(lazyClassRegex, "$1$2");
  };
  
  var Templates = {
    // Hash of preloaded templates for the app
    TAG: 'Templates',
    templates: {},
    propTemplates: {
      "string": "stringPT",
      "boolean": "booleanPT",
      "int": "intPT",
      "float": "intPT",
      "double": "intPT",
      "long": "intPT",
      "emailAddress": "emailPT",
      "phone": "telPT",
      "mobilePhone": "telPT",
      "Url": "UrlPT",
      "href": "hrefPT",
      "Duration": "durationPT",
      "system/primitiveTypes/Duration": "durationPT",
      "date": "datePT",
      "dateTime": "datePT",
      "Percent": "percentPT",
      "system/primitiveTypes/Percent": "percentPT",
      "resource": "resourcePT",
      "model/company/Money": "moneyPT",
      "ComplexDate": "complexDatePT",
      "Image": "imagePT",
      "src": "srcPT"
    },

    propEditTemplates: {
      "string": "stringPET",
      "enum": "enumPET",
      "enum1": "shortEnumPET",
      "enum2": "longEnumPET",
      "resource": "resourcePET",
      "boolean": "booleanPET",
      "phone": "telPET",
      "mobilePhone": "telPET",
      "emailAddress": "emailPET",
//      "times": "timesPET",
      "date": "datePET",
      "ComplexDate": "datePET",
      "Duration": "datePET",
      "system/primitiveTypes/Duration": "datePET",
      "Percent": "percentPET",
      "system/primitiveTypes/Percent": "percentPET",
//    "model/portal/Image": "fileUpload",
      "model/company/Money": "moneyPET"
//       ,
//      "boolean": "booleanPET",
//      "int": "intPET",
//      "float": "intPET",
//      "double": "intPET",
//      "http://www.hudsonfog.com/voc/system/fog/Url": "UrlPET",
//      "Duration": "complexDatePET",
//      "resource": "resourcePET",
//      "http://www.hudsonfog.com/voc/model/company/Money": "moneyPET",
//      "http://www.hudsonfog.com/voc/system/fog/ComplexDate": "complexDatePET",
//      "http://www.hudsonfog.com/voc/model/portal/Image": "imagePET"
    },

 
    // This implementation should be changed in a production environment:
    // All the template files should be concatenated in a single file.
    loadTemplates: function() {
      var self = this,
          div = document.createElement('div');
      
      if (HTML_bb) {
        HTML += HTML_bb;
        HTML_bb = null; // in case loadTemplates is ever called again;
      }
      
      if (HTML_topcoat) {
        HTML += HTML_topcoat;
        HTML_topcoat = null; // in case loadTemplates is ever called again;
      }
      if (HTML_bootstrap) {
        HTML += HTML_bootstrap;
        HTML_bootstrap = null; // in case loadTemplates is ever called again;
      }
      
//      var elts = DOM.parseHTML1(HTML);
      
      div.innerHTML = HTML;
      div.$('script[type="text/template"]').$forEach(function(elt) {
        self.templates[elt.id] = {
          'default': prepTemplate(elt.innerHTML)
        };
      });
    },
 
    _treatTemplate: function(text) {
      text = text.trim();
      var matches = text.match(/<script[^>]*>([\s\S]*)<\/script>/);
      return matches ? matches[1] : text;
    },
    
    addCustomTemplate: function(template) {
      var type = template.get('modelDavClassUri');
      var name = template.get('templateName');
      var templates = this.templates[name];
      if (!templates) // currently, only allow to override default templates
        return;
      
      var text = this._treatTemplate(template.get('templateText'));
      if (type)
        templates[type] = text;
      else {
        templates['originalDefault'] = templates['default'];
        templates['default'] = text;
      }
      
//      Events.trigger('templateUpdate:' + name, template);      
    },
    
    // Get template by name from hash of preloaded templates
    /**
     * @param name: template name
     * @param custom: set to false if you want the default template, otherwise will return custom template (if available, else default template)
     */
    get: function(name, type) {
      var templates = this.templates[name];
      if (!templates)
        return null;
      
      return type ? templates[type] : templates['default'];
    },
    
    getDefaultTemplate: function(name) {
      var template = this.templates[name];
      return template && template['default'];
    },
    
    getOriginalTemplate: function(name) {
      var template = this.templates[name];
      return template ? template['originalDefault'] || template['default'] : null;
    },

    getCustomTemplate: function(name, type) {
      var template = this.templates[name];
      return template && template[type]; 
    },

    getPropTemplate: function(prop, edit, val) {
      var t = edit ? Templates.propEditTemplates : Templates.propTemplates;
      var template;
      if (prop.facet  &&  !prop.multiValue)
        template = t[prop.facet];
      if (!template) {
        if (prop.multiValue  &&  edit)
          return t.resource;
        template = t[prop.range];
      }
      
      return template ? template : (prop.range.indexOf('/') == -1 && prop.range != 'Class' && prop.range != 'Resource' ? t.string : t.resource);
    },
    __DEFAULT_TEMPLATE: '<!-- put your template code here -->',
    prepNewTemplate: function(t) {
      if (t.vocModel.type !== G.commonTypes.Jst)
        return;
      
      if (!t.get('templateText')) {
        var tName = t.get('templateName');
        var text;
        if (tName)
          text = Templates.get(tName);
        
        text = text || Templates.__DEFAULT_TEMPLATE;
        t.set({templateText: text});
      }
    }
//    removeEmptyLazyImagesInHTML: function(html) {
//      return html.replace(emptyLazyRegex, 'src="$1"').replace(lazyClassRegex, '$1 $2'); // gave up. Replacing classes is tricky, don't know which ones to replace without more complex regex
//    },    
  };
  
  Events.on('newResource:' + G.commonTypes.Jst, Templates.prepNewTemplate);
  return Templates;
});