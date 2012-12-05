// needs Lablz.currentUser

define([
  'underscore',
  'templates',
  'utils'
], function(_, Templates, U) {

  Backbone.View.prototype.close = function(){
    this.remove();
    this.unbind();
    if (this.onClose){
      this.onClose();
    }
  };
  
  return {
    makeProp: function(prop, val) {
      var cc = prop.colorCoding;
      if (cc) {
        cc = U.getColorCoding(cc, val);
        if (cc) {
          if (cc.startsWith("icons"))
            val = "<img src=\"" + cc + "\" border=0>&#160;" + val;
          else
            val = "<span style='color:" + cc + "'>" + val + "</span>";
        }
      }
      
      var propTemplate = Templates.getPropTemplate(prop);
      val = val.displayName ? val : {value: val};
      return {name: prop.label || prop.displayName, value: _.template(Templates.get(propTemplate))(val)};
    },
    
    makePropEdit: function(prop, val) {
      var propTemplate = Templates.getPropTemplate(prop, true);
      val = val.displayName ? val : {value: val};
      val.shortName = prop.displayName.toCamelCase();
      return {name: prop.displayName, value: _.template(Templates.get(propTemplate))(val)};
    },
    
    isPropVisible: function(res, prop) {
      if (prop.avoidDisplaying || prop.avoidDisplayingInControlPanel)
        return false;
      
      var userRole = Lablz.currentUser ? Lablz.currentUser.role || 'contact' : 'guest';
      if (userRole == 'admin')
        return true;
      
      var ar = prop.allowRoles;
      if (ar) {
        if (userRole == 'guest')
          return false;
        
        var roles = ar.split(",");
        for (var i = 0; i < roles.length; i++) {
          var r = roles[i].trim();
          if (r == 'admin')
            return false;
          else if (r == 'siteOwner')
            return userRole == 'siteOwner';
          else {
            // TODO: implement this
            
            return false;
          }
        }
      }
      
      return true;
    }
  }
});