  function focusOnUserName() {
    var f = document.forms['loginform'];
    if (f) {
      var jstest = f.elements['.jstest'];
      jstest.value = "ok"; // server will know that JavaScript worked
      if (typeof window.Cordova != 'undefined' || typeof window.Phonegap != 'undefined') {
        var cordova = document.createElement("input");
        cordova.type = "hidden";
        cordova.value = "yes";
        f.appendChild(cordova); // add it to the form

        var appId = document.createElement("input");
        appId.type = "hidden";
        appId.value = getAppId();
        f.appendChild(appId); // add it to the form
      }
      
      var u = f.elements['j_username'];
      if (u && u.type && u.type != 'hidden')
         try {
         u.focus();} catch (e) { }
    }
    else {
      // wait for the form ready
      setTimeout(focusOnUserName, 50);
    }
    
    return true;
  }
  setTimeout(focusOnUserName, 50);
