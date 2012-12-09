define([
  'cache!jquery', 
  'cache!jqmConfig', 
  'cache!jqueryMobile', 
  'cache!underscore' 
], function($, __jqm__, __jqmConfig__, _) {
  _.templateSettings = {
    evaluate:    /\{\{(.+?)\}\}/g,
    interpolate: /\{\{=(.+?)\}\}/g
  };
  
  return {
    // Hash of preloaded templates for the app
    templates: {},
    propTemplates: {
      "string": "stringPT",
      "boolean": "booleanPT",
      "int": "intPT",
      "float": "intPT",
      "double": "intPT",
      "http://www.hudsonfog.com/voc/system/primitiveTypes/emailAddress": "emailPT",
      "http://www.hudsonfog.com/voc/system/primitiveTypes/phone": "telPT",
      "http://www.hudsonfog.com/voc/system/primitiveTypes/mobilePhone": "telPT",
      "http://www.hudsonfog.com/voc/system/fog/Url": "UrlPT",
      "http://www.hudsonfog.com/voc/system/primitiveTypes/Duration": "complexDatePT",
      "date": "datePT",
      "resource": "resourcePT",
      "http://www.hudsonfog.com/voc/model/company/Money": "moneyPT",
      "http://www.hudsonfog.com/voc/system/fog/ComplexDate": "complexDatePT",
      "http://www.hudsonfog.com/voc/model/portal/Image": "imagePT"
    },

    propEditTemplates: {
      "string": "stringPET"
//      "boolean": "booleanPET",
//      "int": "intPET",
//      "float": "intPET",
//      "double": "intPET",
//      "http://www.hudsonfog.com/voc/system/primitiveTypes/emailAddress": "emailPET",
//      "http://www.hudsonfog.com/voc/system/primitiveTypes/phone": "telPET",
//      "http://www.hudsonfog.com/voc/system/primitiveTypes/mobilePhone": "telPET",
//      "http://www.hudsonfog.com/voc/system/fog/Url": "UrlPET",
//      "http://www.hudsonfog.com/voc/system/primitiveTypes/Duration": "complexDatePET",
//      "date": "datePET",
//      "resource": "resourcePET",
//      "http://www.hudsonfog.com/voc/model/company/Money": "moneyPET",
//      "http://www.hudsonfog.com/voc/system/fog/ComplexDate": "complexDatePET",
//      "http://www.hudsonfog.com/voc/model/portal/Image": "imagePET"
    },

 
    // This implementation should be changed in a production environment:
    // All the template files should be concatenated in a single file.
    loadTemplates: function() {
      var elts = $('script[type="text/template"]');
      for (var i = 0; i < elts.length; i++) {
        this.templates[elts[i].id] = elts[i].innerHTML;
      }
    },
 
    // Get template by name from hash of preloaded templates
    get: function(name) {
      return this.templates[name];
    },
    
    getPropTemplate: function(prop, edit) {
      var t = edit ? this.propEditTemplates : this.propTemplates;
      var f = 'http://www.hudsonfog.com/voc/system/fog/Property/facet';
      return (prop[f] && t[prop[f]]) || t[prop.range] || (edit ? t.string : t.resource);
    }
  };
});