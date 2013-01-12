define([
  'globals',
  'cache!../templates.jsp',
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore' 
], function(G, HTML, $, __jqm__, _) {
  _.templateSettings = {
    evaluate:    /\{\{(.+?)\}\}/g,
    interpolate: /\{\{=(.+?)\}\}/g
  };
  
  var Templates = {
    // Hash of preloaded templates for the app
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
      "Duration": "complexDatePT",
      "date": "datePT",
      "dateTime": "datePT",
      "resource": "resourcePT",
      "Money": "moneyPT",
      "ComplexDate": "complexDatePT",
      "Image": "imagePT"
    },

    propEditTemplates: {
      "string": "stringPET",
      "enum": "enumPET",
      "resource": "resourcePET",
      "boolean": "booleanPET"
//       ,
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
      var elts = $('script[type="text/template"]', $(HTML));
      for (var i = 0; i < elts.length; i++) {
        Templates.templates[elts[i].id] = elts[i].innerHTML;
      }
    },
 
    // Get template by name from hash of preloaded templates
    get: function(name) {
      return this.templates[name];
    },
    
    facet: 'http://www.hudsonfog.com/voc/system/fog/Property/facet',
    getPropTemplate: function(prop, edit) {
      var t = edit ? Templates.propEditTemplates : Templates.propTemplates;
      var facet = this.facet;
      return (prop[facet] && t[prop[facet]]) || t[prop.range] || (prop.range.indexOf('/') == -1 ? t.string : t.resource);
    }
  };
  
  return Templates;
});