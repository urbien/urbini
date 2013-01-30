define([
  'globals',
  'cache!../templates.jsp',
  'jquery', 
  'underscore' 
], function(G, HTML, $, _) {
  _.templateSettings = {
    evaluate:    /\{\{(.+?)\}\}/g,
    interpolate: /\{\{=(.+?)\}\}/g
//    variable: 'G'
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
      "Duration": "durationPT",
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
      "model/company/Money": "stringPET"
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
      for (var i = 0; i < elts.length; i++) {
        Templates.templates[elts[i].id] = elts[i].innerHTML;
      }
    },
 
    // Get template by name from hash of preloaded templates
    get: function(name) {
      return this.templates[name];
    },
    
    getPropTemplate: function(prop, edit, val) {
      var t = edit ? Templates.propEditTemplates : Templates.propTemplates;
      var template;
      if (prop.facet  &&  !prop.multiValue)
        template = t[prop.facet];
      if (!template) {
        if (prop.multiValue)
          return t.resource;
        template = t[prop.range];
      }
      return template ? template : (prop.range.indexOf('/') == -1 ? t.string : t.resource);
    }
  };
  
  return Templates;
});