//'use strict';
define('templates', [
  'globals',
//  'fileCache!../templates.jsp',
  '../templates.jsp',
  'underscore',
  'events'
], function(G, HTML, _, Events) {
  _.templateSettings = {
    evaluate:    /\{\{(.+?)\}\}/g,
    interpolate: /\{\{=(.+?)\}\}/g
//    variable: 'G'
  };
  
  var lazyImgSrcAttr = G.lazyImgSrcAttr,
      blankImgDataUrl = G.blankImgDataUrl;
  
  window.onimageload = function onimageload() {
    var self = this;
    window.raf(function() {      
      $(self).trigger('imageOnload');
    });
    
    return false;
  };
  
  window.onimageerror = function onimageerror() {
    var self = this;
    window.raf(function() {      
      $(self).trigger('imageOnerror');
    });
    
    return false;
  };
  
  function prepTemplate(text) {
//    return text.trim();
    return text.trim().replace('<img src=', '<img src="{0}" onload="window.onimageload.call(this);" onerror="window.onimageerror.call(this);" {1}='.format(blankImgDataUrl, lazyImgSrcAttr));
//    return text.trim().replace('<img src=', '<img src="{0}" onload="lzld(this);" onerror="lzld(this)" {1}='.format(blankImgDataUrl, lazyImgSrcAttr));
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
      "emailAddress": "emailPT",
      "phone": "telPT",
      "mobilePhone": "telPT",
      "Url": "UrlPT",
      "system/primitiveTypes/Duration": "durationPT",
      "date": "datePT",
      "dateTime": "datePT",
      "resource": "resourcePT",
      "model/company/Money": "moneyPT",
      "ComplexDate": "complexDatePT",
      "Image": "imagePT"
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
      "date": "datePET",
      "ComplexDate": "datePET",
      "system/primitiveTypes/Duration": "datePET",
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
      var elts = $('script[type="text/template"]', $(HTML));
      _.each(elts, function(elt) {
        this.templates[elt.id] = {
          'default': prepTemplate(elt.innerHTML)
        };
      }.bind(this));
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
      
      return template ? template : (prop.range.indexOf('/') == -1 && prop.range != 'Class' ? t.string : t.resource);
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
  };
  
  Events.on('newResource', Templates.prepNewTemplate);
  Events.on('newTemplate', Templates.prepNewTemplate);

  return Templates;
});