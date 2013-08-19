var scripts = document.getElementsByTagName('script'),
    ahaScriptSrc = scripts[scripts.length - 1].src,
    serverUrl = ahaScriptSrc.slice(0, ahaScriptSrc.indexOf('/js/')),
    currentHref = window.location.href,
    enc = encodeURIComponent,
//    keyword = isAha ? 'Aha!' : 'Huh?',
    buildAhaUrl = serverUrl + '/aha?',
    onAhaMsg = "You have been registered as a bona fide expert on this...whatever it is. You are now a superhero on call in the endless battle against the evil powers of ignorance and bliss. Welcome aboard!",
    containerDiv,
    overlayDiv,
    found = [];

function isIE() {
  return /msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent)
}
function isSafari() {
  return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
}
function isIOS() {
  return navigator.userAgent.match(/iPad/i) != null || navigator.userAgent.match(/iPhone/i) != null || navigator.userAgent.match(/iPod/i) != null || navigator.userAgent.match(/iPod/i) != null
}

function addParam(name, val) {
  buildAhaUrl += enc(name) + '=' + enc(val) + '&';
}

//function isValidImage(img) {
//  return img.height && img.height >= 80;
//}
//
//function aha() {
//  var enc = encodeURIComponent,
//      thisWebsiteUri = serverUrl + 'sql/www.hudsonfog.com/voc/model/social/OnlineResource?href=' + enc(currentHref);
//  
////  if (image) {
////    data.originalImage
////  }
//  if (title)
//    data.title = enc(title);
//  
//  window.open(serverUrl + '/aha?what=' + enc(thisWebsiteUri));
//}

function collectInfo() {
  for (var c = document.getElementsByTagName("meta"), k = 0; k < c.length; k++) {
    var p = c[k].getAttribute('property'),
        hasOGUrl = false;
    
    if (/^og:/.test(p)) {
      found.push(p);
      addParam(p, c[k].getAttribute('content'));
    }  
  }
  
  if (found.indexOf('og:url') == -1)
    addParam('og:url', currentHref);
  if (found.indexOf('og:title') == -1)
    addParam('og:title', document.title);
  if (found.indexOf('og:type') == -1)
    addParam('og:type', 'website');
  if (found.indexOf('og:description') == -1) {
    var a = window,
        b = document,
        description = ("" + (a.getSelection ? a.getSelection() : b.getSelection ? b.getSelection() : b.selection.createRange().text)).replace(/(^\s+|\s+$)/g, "");
    
    if (description.length)
      addParam('og:description', description);
  }
}

function callAha(url) {
  if (isIOS()) {
    setTimeout(function () {
      window.location = url;
    }, 25);
    
    window.location = url;
  } 
  else 
    window.open(url, 'Aha' + +new Date());
//    window.open(url, 'Aha' + (new Date).getTime(), "status=no,resizable=no,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,width=750,height=450,left=0,top=0");
}

function y(a) {
  if (Math.max(a.h, a.w) > 199) {
    if (a.h < a.w) return "margin-top: " + parseInt(100 - 100 * (a.h / a.w)) + "px;";
    return ""
  } else return "margin-top: " + parseInt(100 - a.h / 2) + "px;"
}

function removeOverlay() {
  overlayDiv.parentNode.removeChild(overlayDiv);  
  containerDiv.parentNode.removeChild(containerDiv);  
  return false;
};

function setClass(el, cl) {
  if (isIE()) 
    el.className = cl;
  else 
    el.setAttribute("class", cl);    
};

function overlay() {
  var css = "#ahaOverlay {opacity: 0.9; position: fixed; top: 0; left: 0; bottom: 0; right: 0; background-color: white; width: 100%; height: 100%; z-index: 100000002;}\n" +
            "#ahaContainer {font-family: 'helvetica neue', arial, sans-serif; position: absolute; z-index: 100000002; top: 0; left: 0; background-color: transparent; opacity: 1; width: 100%; height: 100%}\n" +
            "#ahaHeader {padding-top: 10px; margin-bottom: 30px; text-align:center; font-family: 'helvetica neue', arial, sans-serif; opacity: 1; z-index: 100000002; top: 0; left: 0; width: 100%;}\n" +
            "#ahaHeader img {max-width: 95%;}\n" +
            "#ahaBtn, #huhBtn {padding-top: 30px; text-align:center; font-family: 'helvetica neue', arial, sans-serif; background-color: transparent; opacity: 1; width: 50%; height: 90%; z-index: 100000002;}\n" + 
//            "#ahaCancelBtn {float:right; background-color: #f00; height: 100%}\n" + 
            "#ahaCancelBtn {text-decoration:none; float:right; position: absolute; right: 5px; top: 5px;}\n" + 
            "#ahaBtn {float:left}\n" + 
            "#huhBtn {float:right}\n" + 
//            "#ahaBtn a, #huhBtn a {margin: 0 auto;}\n" + 
            "#ahaBtn img, #huhBtn img {max-width: 50%;}\n" +
            "#ahaBtn img:hover, #huhBtn img:hover {color: #fff; text-decoration: none; text-shadow: 0 -1px #46A0E6;}\n" + 
            "#ahaBtn img:hover {color: #fff; text-decoration: none; background-color: #00ff00; border-color: #1389e5;}\n" + 
            "#huhBtn img:hover {color: #fff; text-decoration: none; background-color: #ff0000; border-color: #1389e5; text-shadow: 0 -1px #46A0E6;}"; 
  
  var f;
  if (isIE()) {
    f = document.createElement("style");
    f.type = "text/css";
    f.media = "screen";
    f.styleSheet.cssText = css;
    document.getElementsByTagName("head")[0].appendChild(f)
  } 
  else {
    if (navigator.userAgent.lastIndexOf("Safari/") > 0 && parseInt(navigator.userAgent.substr(navigator.userAgent.lastIndexOf("Safari/") + 7, 7)) < 533) {
      f = document.createElement("style");
      f.innerText = css;
    } else {
      f = document.createElement("style");
      f.innerHTML = css;
    }
    document.body.appendChild(f)
  }

  overlayDiv = document.createElement("div");
  overlayDiv.setAttribute("id", "ahaOverlay");
  document.body.appendChild(overlayDiv);
  
  document.keydown = removeOverlay;

  // Container div
  containerDiv = document.createElement("div");
  containerDiv.setAttribute("id", "ahaContainer");
  
  // Header with cancel button
  var header = document.createElement("div");
  header.setAttribute("id", "ahaHeader");
  var logo = new Image;
  logo.src = serverUrl + "/images/aha/howDoYouFeel.png";
//  logo.width = "180";
//  header.appendChild(logo);
//  var headerTitle = document.createElement("p");
////  headerTitle.setAttribute("style", "font-size:3em");
//  headerTitle.appendChild(document.createTextNode("How do you feel?"));
  
  
  var cancel = document.createElement("a");
  cancel.href = "#";
  cancel.setAttribute("id", "ahaCancelBtn");
  cancel.onclick = removeOverlay;
  
  var x = new Image;
  x.src = serverUrl + "/images/x.png";
  cancel.appendChild(x);
  
  header.appendChild(cancel);
//  header.appendChild(headerTitle);
  header.appendChild(logo);
  containerDiv.appendChild(header);
  document.body.appendChild(containerDiv);
  
  var buttons = {
    'Huh?': {
      img: {
        src: serverUrl + '/images/aha/huh.png'
      }
    },
    'Aha!' : {
      img: {
        src: serverUrl + '/images/aha/aha.png'
      }
    }
  }
  
  // create the Huh? and Aha! buttons
  for (var name in buttons) {
    (function(name, btnInfo) {      
      var cleanName = name.replace(/[!\?]/, '').toLowerCase();
      var btnDiv = document.createElement("div");
      btnDiv.setAttribute("id", cleanName + "Btn");      
      var link = document.createElement("a");
      link.setAttribute("href", "#");
      link.onclick = function () {
        removeOverlay();
        callAha(buildAhaUrl + '&aha=' + (name == 'Huh?' ? 'n' : 'y'));
        return false;
      };
      
      var img = new Image;
      img.src = btnInfo.img.src;
      
      link.appendChild(img);
      btnDiv.appendChild(link);
      containerDiv.appendChild(btnDiv);
    })(name, buttons[name]);
  }
  
  scroll(0, 0);
}

collectInfo();  
overlay();


//function call() {
//  var xmlhttp = new XMLHttpRequest();
//  xmlhttp.onreadystatechange = function() {
//    if (xmlhttp.readyState==4) {
//      debugger;
//      var response = xmlhttp.responseText;
//      try {
//        var json = JSON.parse(response);
//      } catch(err) {
//        return;
//      }
//      
//      if (json.redirect)
//        window.open(json.redirect);
//      else
//        alert(json.message || onAhaMsg);
////        default:
////          debugger;
////          alert('Oops, your "' + keyword + '" is dead. Would you like to try again?');
////          break;
//    }
//  }
//  
//  xmlhttp.open("GET", buildAhaUrl, true);
//  xmlhttp.send();
//}
//
//function getHelp() {
//  window.open(buildAhaUrl);
//}

//if (isAha)
//  call();
//else
//  getHelp();
//overlay();
//window.open(buildAhaUrl);