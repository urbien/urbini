var scripts = document.getElementsByTagName('script'),
    ahaScriptSrc = scripts[scripts.length - 1].src,
    serverUrl = ahaScriptSrc.slice(0, ahaScriptSrc.indexOf('/js/bookmarklets')),
    isAha = ahaScriptSrc.indexOf('aha=y') != -1,
    currentHref = window.location.href,
    enc = encodeURIComponent,
//    keyword = isAha ? 'Aha!' : 'Huh?',
    buildAhaUrl = serverUrl + '/aha?aha=' + (isAha ? 'y' : 'n') + '&',
    onAhaMsg = "You have been registered as a bona fide expert on this...whatever it is. You are now a superhero on call in the endless battle against the evil powers of ignorance and bliss. Welcome aboard!",
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
    window.open(url, 'Aha' + (new Date).getTime(), "status=no,resizable=no,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,width=750,height=450,left=0,top=0");
}

function y(a) {
  if (Math.max(a.h, a.w) > 199) {
    if (a.h < a.w) return "margin-top: " + parseInt(100 - 100 * (a.h / a.w)) + "px;";
    return ""
  } else return "margin-top: " + parseInt(100 - a.h / 2) + "px;"
}

function removeLink() {
  o.parentNode.removeChild(o);
  n.parentNode.removeChild(n);
  document.tpmLjs = 0;
  if (isIE()) {
    for (var a = 0; a < p.length; a++) 
      p[a].parent.insertBefore(p[a].player, p[a].sibling);
  }
  
  return false;
};

function y(a) {
  if (Math.max(a.h, a.w) > 199) {
    if (a.h < a.w) 
      return "margin-top: " + parseInt(100 - 100 * (a.h / a.w)) + "px;";
    
    return ""
  } else 
    return "margin-top: " + parseInt(100 - a.h / 2) + "px;"
}

//function overlay() {
//  var w = buildAhaUrl,
//      x = buildAhaUrl;

  collectInfo();
  var html = "<style>\n.tpm_Container {font-family: 'helvetica neue', arial, sans-serif; position: absolute; padding-top: 37px; z-index: 100000002; top: 0; left: 0; background-color: transparent; opacity: 1;}\n.tpm_Overlay {position: fixed; z-index: 9999; top: 0; right: 0; bottom: 0; left: 0; background-color: #f2f2f2; opacity: .95;}\n.tpm_Control {position:relative; z-index: 100000; float: left; background-color: #fcf9f9; border: solid #ccc; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1;}\n.tpm_Control img {position: relative; padding: 0; display: block; margin: 82px auto 0; -ms-interpolation-mode: bicubic;}\n.tpm_Control a {position: fixed; z-index: 10001; right: 0; top: 0; left: 0; height: 24px; padding: 12px 0 0; text-align: center; font-size: 14px; line-height: 1em; text-shadow: 0 1px #fff; color: #211922; font-weight: bold; text-decoration: none; background: #fff url(" + serverUrl + "/images/nabit/fullGradient07Normal.png') 0 0 repeat-x; border-bottom: 1px solid #ccc; -mox-box-shadow: 0 0 2px #d7d7d7; -webkit-box-shadow: 0 0 2px #d7d7d7;}\n.tpm_Control a:hover {color: #fff; text-decoration: none; background-color: #1389e5; border-color: #1389e5; text-shadow: 0 -1px #46A0E6;}\n.tpm_Control a:active {height: 23px; padding-top: 13px; background-color: #211922; border-color: #211922; background-image: url(" + serverUrl + "/images/nabit/fullGradient07Inverted.png); text-shadow: 0 -1px #211922;}\n.tpmImagePreview {position: relative; padding: 0; margin: 0; float: left; background-color: #fff; border: solid #e7e7e7; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1; z-index: 10002; text-align: center;}\n.tpmImagePreview .tpmImg {border: none; height: 200px; width: 200px; opacity: 1; padding: 0;}\n.tpmImagePreview .tpmImg a {margin: 0; padding: 0; position: absolute; top: 0; bottom: 0; right: 0; left: 0; display: block; text-align: center;  z-index: 1;}\n.tpmImagePreview .tpmImg a:hover {background-color: #fcf9f9; border: none;}\n.tpmImagePreview .tpmImg .ImageToNab {max-height: 200px; max-width: 200px; width: auto !important; height: auto !important;}\n.tpmImagePreview img.tpm_NabIt {border: none; position: absolute; top: 82px; left: 42px; display: none; padding: 0; background-color: transparent; z-index: 100;}\n.tpmImagePreview img.tpm_vidind {border: none; position: absolute; top: 75px; left: 75px; padding: 0; background-color: transparent; z-index: 99;}\n.tpmDimensions { position: relative; margin-top: 180px; text-align: center; font-size: 10px; z-index:10003; display: inline-block; background: white; border-radius: 4px; padding: 0 2px;}\n\n</style>";
  if (isIE()) {
    f = document.createElement("style");
    f.type = "text/css";
    f.media = "screen";
    f.styleSheet.cssText = ".tpm_Container {font-family: 'helvetica neue', arial, sans-serif; position: absolute; padding-top: 37px; z-index: 100000002; top: 0; left: 0; background-color: transparent; opacity: 1;}\n.tpm_Overlay {position: fixed; z-index: 9999; top: 0; right: 0; bottom: 0; left: 0; background-color: #f2f2f2; opacity: .95;}\n.tpm_Control {position:relative; z-index: 100000; float: left; background-color: #fcf9f9; border: solid #ccc; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1;}\n.tpm_Control img {position: relative; padding: 0; display: block; margin: 82px auto 0; -ms-interpolation-mode: bicubic;}\n.tpm_Control a {position: fixed; z-index: 10001; right: 0; top: 0; left: 0; height: 24px; padding: 12px 0 0; text-align: center; font-size: 14px; line-height: 1em; text-shadow: 0 1px #fff; color: #211922; font-weight: bold; text-decoration: none; background: #fff url(" + serverUrl + "/images/nabit/fullGradient07Normal.png) 0 0 repeat-x; border-bottom: 1px solid #ccc; -mox-box-shadow: 0 0 2px #d7d7d7; -webkit-box-shadow: 0 0 2px #d7d7d7;}\n.tpm_Control a:hover {color: #fff; text-decoration: none; background-color: #1389e5; border-color: #1389e5; text-shadow: 0 -1px #46A0E6;}\n.tpm_Control a:active {height: 23px; padding-top: 13px; background-color: #211922; border-color: #211922; background-image: url(" + serverUrl + "/images/nabit/fullGradient07Inverted.png); text-shadow: 0 -1px #211922;}\n.tpmImagePreview {position: relative; padding: 0; margin: 0; float: left; background-color: #fff; border: solid #e7e7e7; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1; z-index: 10002; text-align: center;}\n.tpmImagePreview .tpmImg {border: none; height: 200px; width: 200px; opacity: 1; padding: 0;}\n.tpmImagePreview .tpmImg a {margin: 0; padding: 0; position: absolute; top: 0; bottom: 0; right: 0; left: 0; display: block; text-align: center;  z-index: 1;}\n.tpmImagePreview .tpmImg a:hover {background-color: #fcf9f9; border: none;}\n.tpmImagePreview .tpmImg .ImageToNab {max-height: 200px; max-width: 200px; width: auto !important; height: auto !important;}\n.tpmImagePreview img.tpm_NabIt {border: none; position: absolute; top: 82px; left: 42px; display: none; padding: 0; background-color: transparent; z-index: 100;}\n.tpmImagePreview img.tpm_vidind {border: none; position: absolute; top: 75px; left: 75px; padding: 0; background-color: transparent; z-index: 99;}\n.tpmDimensions { position: relative; margin-top: 180px; text-align: center; font-size: 10px; z-index:10003; display: inline-block; background: white; border-radius: 4px; padding: 0 2px;}\n";
    document.getElementsByTagName("head")[0].appendChild(f)
  } else {
    if (navigator.userAgent.lastIndexOf("Safari/") > 0 && parseInt(navigator.userAgent.substr(navigator.userAgent.lastIndexOf("Safari/") + 7, 7)) < 533) {
      f = document.createElement("style");
      f.innerText = "\n.tpm_Container {font-family: 'helvetica neue', arial, sans-serif; position: absolute; padding-top: 37px; z-index: 100000002; top: 0; left: 0; background-color: transparent; opacity: 1;}\n.tpm_Overlay {position: fixed; z-index: 9999; top: 0; right: 0; bottom: 0; left: 0; background-color: #f2f2f2; opacity: .95;}\n.tpm_Control {position:relative; z-index: 100000; float: left; background-color: #fcf9f9; border: solid #ccc; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1;}\n.tpm_Control img {position: relative; padding: 0; display: block; margin: 82px auto 0; -ms-interpolation-mode: bicubic;}\n.tpm_Control a {position: fixed; z-index: 10001; right: 0; top: 0; left: 0; height: 24px; padding: 12px 0 0; text-align: center; font-size: 14px; line-height: 1em; text-shadow: 0 1px #fff; color: #211922; font-weight: bold; text-decoration: none; background: #fff url(" + serverUrl + "/images/nabit/fullGradient07Normal.png) 0 0 repeat-x; border-bottom: 1px solid #ccc; -mox-box-shadow: 0 0 2px #d7d7d7; -webkit-box-shadow: 0 0 2px #d7d7d7;}\n.tpm_Control a:hover {color: #fff; text-decoration: none; background-color: #1389e5; border-color: #1389e5; text-shadow: 0 -1px #46A0E6;}\n.tpm_Control a:active {height: 23px; padding-top: 13px; background-color: #211922; border-color: #211922; background-image: url(" + serverUrl + "/images/nabit/fullGradient07Inverted.png); text-shadow: 0 -1px #211922;}\n.tpmImagePreview {position: relative; padding: 0; margin: 0; float: left; background-color: #fff; border: solid #e7e7e7; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1; z-index: 10002; text-align: center;}\n.tpmImagePreview .tpmImg {border: none; height: 200px; width: 200px; opacity: 1; padding: 0;}\n.tpmImagePreview .tpmImg a {margin: 0; padding: 0; position: absolute; top: 0; bottom: 0; right: 0; left: 0; display: block; text-align: center;  z-index: 1;}\n.tpmImagePreview .tpmImg a:hover {background-color: #fcf9f9; border: none;}\n.tpmImagePreview .tpmImg .ImageToNab {max-height: 200px; max-width: 200px; width: auto !important; height: auto !important;}\n.tpmImagePreview img.tpm_NabIt {border: none; position: absolute; top: 82px; left: 42px; display: none; padding: 0; background-color: transparent; z-index: 100;}\n.tpmImagePreview img.tpm_vidind {border: none; position: absolute; top: 75px; left: 75px; padding: 0; background-color: transparent; z-index: 99;}\n.tpmDimensions { position: relative; margin-top: 180px; text-align: center; font-size: 10px; z-index:10003; display: inline-block; background: white; border-radius: 4px; padding: 0 2px;}\n\n"
    } else {
      f = document.createElement("style");
      f.innerHTML = "\n.tpm_Container {font-family: 'helvetica neue', arial, sans-serif; position: absolute; padding-top: 37px; z-index: 100000002; top: 0; left: 0; background-color: transparent; opacity: 1;}\n.tpm_Overlay {position: fixed; z-index: 9999; top: 0; right: 0; bottom: 0; left: 0; background-color: #f2f2f2; opacity: .95;}\n.tpm_Control {position:relative; z-index: 100000; float: left; background-color: #fcf9f9; border: solid #ccc; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1;}\n.tpm_Control img {position: relative; padding: 0; display: block; margin: 82px auto 0; -ms-interpolation-mode: bicubic;}\n.tpm_Control a {position: fixed; z-index: 10001; right: 0; top: 0; left: 0; height: 24px; padding: 12px 0 0; text-align: center; font-size: 14px; line-height: 1em; text-shadow: 0 1px #fff; color: #211922; font-weight: bold; text-decoration: none; background: #fff url(" + serverUrl + "/images/nabit/fullGradient07Normal.png) 0 0 repeat-x; border-bottom: 1px solid #ccc; -mox-box-shadow: 0 0 2px #d7d7d7; -webkit-box-shadow: 0 0 2px #d7d7d7;}\n.tpm_Control a:hover {color: #fff; text-decoration: none; background-color: #1389e5; border-color: #1389e5; text-shadow: 0 -1px #46A0E6;}\n.tpm_Control a:active {height: 23px; padding-top: 13px; background-color: #211922; border-color: #211922; background-image: url(" + serverUrl + "/images/nabit/fullGradient07Inverted.png); text-shadow: 0 -1px #211922;}\n.tpmImagePreview {position: relative; padding: 0; margin: 0; float: left; background-color: #fff; border: solid #e7e7e7; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1; z-index: 10002; text-align: center;}\n.tpmImagePreview .tpmImg {border: none; height: 200px; width: 200px; opacity: 1; padding: 0;}\n.tpmImagePreview .tpmImg a {margin: 0; padding: 0; position: absolute; top: 0; bottom: 0; right: 0; left: 0; display: block; text-align: center;  z-index: 1;}\n.tpmImagePreview .tpmImg a:hover {background-color: #fcf9f9; border: none;}\n.tpmImagePreview .tpmImg .ImageToNab {max-height: 200px; max-width: 200px; width: auto !important; height: auto !important;}\n.tpmImagePreview img.tpm_NabIt {border: none; position: absolute; top: 82px; left: 42px; display: none; padding: 0; background-color: transparent; z-index: 100;}\n.tpmImagePreview img.tpm_vidind {border: none; position: absolute; top: 75px; left: 75px; padding: 0; background-color: transparent; z-index: 99;}\n.tpmDimensions { position: relative; margin-top: 180px; text-align: center; font-size: 10px; z-index:10003; display: inline-block; background: white; border-radius: 4px; padding: 0 2px;}\n\n"
    }
    
    document.body.appendChild(f)
  }
  
  function setClass(el, cl) {
    if (isIE()) 
      el.className = cl;
    else 
      el.setAttribute("class", cl);    
  };
  
  var o = document.createElement("div");
  setClass(o, "tpm_Overlay");
//  o.setAttribute("class", "tpm_Overlay");
  document.keydown = removeLink;
  document.body.appendChild(o);
  var n = document.createElement("div");
//  n.setAttribute("id", "tpm_Container");
  setClass(n, "tpm_Overlay tpm_Container");
  document.body.appendChild(n);
//  var f = document.createElement("div");
//  f.setAttribute("id", "tpm_Control");
  var t_a = document.createElement("a");
  t_a.href = "#";
  setClass(t_a, 'tpm_RemoveLink')
//  t_a.id = "tpm_RemoveLink";
  t_a.appendChild(document.createTextNode("Cancel Nab"));
//  f.appendChild(t_a);
  t_a.onclick = removeLink;
  n.appendChild(t_a);
  
  var buttons = {
    'Huh?': {
      img: {
        src: 'blah'
      }
    },
    'Aha!' : {
      img: {
        src: 'blah1'
      }
    }
  }
  
  // create the Huh? and Aha! buttons
  for (var name in buttons) {
    (function(name, btnInfo) {      
      var div1 = document.createElement("div"),
          div2 = document.createElement("div");
      
      if (isIE()) 
        div1.className = "tpmImagePreview";
      else 
        div1.setAttribute("class", "tpmImagePreview");
      
      if (isIE()) 
        div2.className = "tpmImg";
      else 
        div2.setAttribute("class", "tpmImg");
      
      n.appendChild(div1).appendChild(div2);
      var link = document.createElement("a");
      link.setAttribute("href", "#");
      link.onclick = function () {
        callAha(buildAhaUrl + '&aha=' + (name == 'Huh?' ? 'n' : 'y'));
        o.parentNode.removeChild(o);
        n.parentNode.removeChild(n);
        document.tpmLjs = 0;
        return false;
      };
      
      div2.appendChild(link);
      var e = document.createElement("img");
      if (isIE()) 
        div2.className = "tpmImg";
      else 
        div2.setAttribute("class", "tpmImg");
      
//      e.setAttribute("style", "" + y(a));
      e.src = btnInfo.img.src;
      e.setAttribute("alt", name);
      e.className = "ImageToNab";
      div2.appendChild(e);
//      var c = document.createElement("img");
//    //                      var c = document.createElement("button");
//      if (isIE()) c.className = "tpm_NabIt";
//      else c.setAttribute("class", "tpm_NabIt");
//      c.src = serverUrl + "/images/nabit/NabThis.png";
//      c.setAttribute("alt", "Nab It");
//      c.innerHTML = "Nab It";
//      if (isIE()) {
//          b.attachEvent("onmouseover", function () {
//              c.style.display = "block"
//          });
//          b.attachEvent("onmouseout", function () {
//              c.style.display = "none"
//          })
//      } else {
//          b.addEventListener("mouseover", function () {
//              c.style.display = "block"
//          }, false);
//          b.addEventListener("mouseout", function () {
//              c.style.display = "none"
//          }, false)
//      }
    })(name, buttons[name]);
  }
  
//  if (isIE()) {
//    i = document.getElementsByTagName("object");
//    for (h = 0; h < i.length; h++) {
//        f = {
//            player: i[h],
//            parent: i[h].parentNode,
//            sibling: i[h].nextSibling
//        };
//        f.parent.removeChild(i[h]);
//        p.push(f)
//    }
//  }
  scroll(0, 0);
//}

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