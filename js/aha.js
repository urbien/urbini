(function() {
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
    setImage = true,
    description,
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

function collectInfo() {
  for (var c = document.getElementsByTagName("meta"), k = 0; k < c.length; k++) {
    var p = c[k].getAttribute('property'),
        hasOGUrl = false;
    
    if (/^og:/.test(p)) {
      found.push(p);
      addParam(p, c[k].getAttribute('content'));
    }
    else {
      if (p == 'keywords' || p === 'author')
        addParam(p, c[k].getAttribute('content'));
    }
  }
  
  var ogUrlIdx = found.indexOf('og:url');
  if (ogUrlIdx == -1)
    addParam('og:url', currentHref);
  else
    currentHref = found[ogUrlIdx];
    
  if (found.indexOf('og:title') == -1)
    addParam('og:title', document.title);
  if (found.indexOf('og:type') == -1)
    addParam('og:type', 'website');
  
  if (found.indexOf('og:image') != -1)
    setImage = false;
  
  var descIdx = found.indexOf('og:description');
  if (descIdx == -1) {
    var a = window,
        b = document,
        description = ("" + (a.getSelection ? a.getSelection() : b.getSelection ? b.getSelection() : b.selection.createRange().text)).replace(/(^\s+|\s+$)/g, "");
    
    if (description.length)
      addParam('og:description', description);
  }
  else
    description = found[descIdx];
}

function callAha(url) {
  url = url || buildAhaUrl;
  removeOverlay();
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
  overlayDiv.parentNode && overlayDiv.parentNode.removeChild(overlayDiv);  
  containerDiv.parentNode && containerDiv.parentNode.removeChild(containerDiv);  
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
        buildAhaUrl += '&aha=' + (name == 'Huh?' ? 'n' : 'y');
        if (setImage)
          showImageChooser();
        else {
          removeOverlay();
          callAha();
        }

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
checkDuplicate(); // check for duplicate online resource
overlay();

function checkDuplicate() {
//  var xmlhttp = new XMLHttpRequest();
//  xmlhttp.onreadystatechange = function() {
//    if (xmlhttp.readyState == 4) {
//      debugger;
//      setImage = xmlhttp.status != 200; // if it's 200, means we already have one
//    }
//  }
//  
//  debugger;
//  xmlhttp.open("GET", serverUrl + '/api/v1/OnlineResource?$select=dateScraped&url=' + enc(currentHref), true);
//  xmlhttp.send();
}

function showImageChooser() {
  removeOverlay();
  
  function isValidImage(img) {
    return img.height && img.height >= 80;
  }
  
  function nab() {      
      function y(a) {
          if (Math.max(a.h, a.w) > 199) {
              if (a.h < a.w) return "margin-top: " + parseInt(100 - 100 * (a.h / a.w)) + "px;";
              return ""
          } else return "margin-top: " + parseInt(100 - a.h / 2) + "px;"
      }
      
      var p = [];
      if (document.tpmLjs) {
        return;
      }
      
      document.tpmLjs = 1;
      var i = /^https?:\/\/.*?\.?facebook\.com\//,
          f = /^https?:\/\/.*?\.?google\.com\/reader\//;
              
      if (location.href.match(i) || location.href.match(f))
        callAha();
      else {
        var w = buildAhaUrl,
            x = buildAhaUrl,
            q = null;
        
        if (description && description.length > 0) 
          q = description;
        
        var m = function () {
              function a(g) {
                  var j = new Image;
                  j.height = 360;
                  j.width = 480;
                  j.src = "http://img.youtube.com/vi/" + g + "/0.jpg";
                  return e(j, "video")
              }
              function b(g) {
                  if (g.src && g.src != "") {
                      var j = g.src.indexOf("?") > -1 ? "&" : "?";
                      g.src += j + "autoplay=0";
                      g.src += "&wmode=transparent"
                  }
                  g.setAttribute("wmode", "transparent");
                  j = g.parentNode;
                  var r = g.nextSibling;
                  j.removeChild(g);
                  j.insertBefore(g, r)
              }
              for (var d = [], e = function (g, j) {
                      j = j || "image";
                      var r = g.height,
                          z = g.width,
                          t = g.src,
                          u = new Image;
                      u.src = t;
                      return {
                          w: z,
                          h: r,
                          src: t,
                          img: g,
                          alt: "alt",
                          im2: u,
                          type: j
                      }
                  }, c = document.getElementsByTagName("iframe"), k = 0; k < c.length; k++) {
                  var l = /^http:\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9\-_]+)/;
                  if (l = l.exec(c[k].src)) {
                      d.push(a(l[1]));
                      b(c[k])
                  }
              }
//              for (k = 0; k < openGraphImages.length; k++) {
//                d.push(e(openGraphImages[k]));
//              }
              c = document.getElementsByTagName("embed");
              for (k = 0; k < c.length; k++) {
                  l = /^http:\/\/www\.youtube\.com\/v\/([a-zA-Z0-9\-_]+)/;
                  if (l = l.exec(c[k].src)) {
                      d.push(a(l[1]));
                      b(c[k])
                  }
              }
              l = /^http:\/\/www\.youtube\.com\/watch\?.*v=([a-zA-Z0-9\-_]+)/;
              if (l = l.exec(window.location.href)) {
                  d.push(a(l[1]));
                  b(document.getElementById("movie_player"))
              }
              for (k = 0; k < document.images.length; k++) {
                  c = document.images[k];
                  if (c.style.display != "none") {
                      c = e(c);
                      if (c.w > 80 && c.h > 80 && (c.h > 109 || c.w > 109)) d.push(c)
                  }
              }
              return d
          }();

          if (m.length == 0) {
            callAha();
            return null;
          }
            
          i = function () {
              o.parentNode.removeChild(o);
              n.parentNode.removeChild(n);
              document.tpmLjs = 0;
              if (isIE()) for (var a = 0; a < p.length; a++) p[a].parent.insertBefore(p[a].player, p[a].sibling);
              return false
          };
          
          html = "<style>\n#tpm_Container {font-family: 'helvetica neue', arial, sans-serif; position: absolute; padding-top: 37px; z-index: 100000002; top: 0; left: 0; background-color: transparent; opacity: 1;}\n#tpm_Overlay {position: fixed; z-index: 9999; top: 0; right: 0; bottom: 0; left: 0; background-color: #f2f2f2; opacity: .95;}\n#tpm_Control {position:relative; z-index: 100000; float: left; background-color: #fcf9f9; border: solid #ccc; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1;}\n#tpm_Control img {position: relative; padding: 0; display: block; margin: 82px auto 0; -ms-interpolation-mode: bicubic;}\n#tpm_Control a {position: fixed; z-index: 10001; right: 0; top: 0; left: 0; height: 24px; padding: 12px 0 0; text-align: center; font-size: 14px; line-height: 1em; text-shadow: 0 1px #fff; color: #211922; font-weight: bold; text-decoration: none; background: #fff url(" + serverUrl + "/images/nabit/fullGradient07Normal.png') 0 0 repeat-x; border-bottom: 1px solid #ccc; -mox-box-shadow: 0 0 2px #d7d7d7; -webkit-box-shadow: 0 0 2px #d7d7d7;}\n#tpm_Control a:hover {color: #fff; text-decoration: none; background-color: #1389e5; border-color: #1389e5; text-shadow: 0 -1px #46A0E6;}\n#tpm_Control a:active {height: 23px; padding-top: 13px; background-color: #211922; border-color: #211922; background-image: url(" + serverUrl + "/images/nabit/fullGradient07Inverted.png); text-shadow: 0 -1px #211922;}\n.tpmImagePreview {position: relative; padding: 0; margin: 0; float: left; background-color: #fff; border: solid #e7e7e7; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1; z-index: 10002; text-align: center;}\n.tpmImagePreview .tpmImg {border: none; height: 200px; width: 200px; opacity: 1; padding: 0;}\n.tpmImagePreview .tpmImg a {margin: 0; padding: 0; position: absolute; top: 0; bottom: 0; right: 0; left: 0; display: block; text-align: center;  z-index: 1;}\n.tpmImagePreview .tpmImg a:hover {background-color: #fcf9f9; border: none;}\n.tpmImagePreview .tpmImg .ImageToNab {max-height: 200px; max-width: 200px; width: auto !important; height: auto !important;}\n.tpmImagePreview img.tpm_NabIt {border: none; position: absolute; top: 82px; left: 42px; display: none; padding: 0; background-color: transparent; z-index: 100;}\n.tpmImagePreview img.tpm_vidind {border: none; position: absolute; top: 75px; left: 75px; padding: 0; background-color: transparent; z-index: 99;}\n.tpmDimensions { position: relative; margin-top: 180px; text-align: center; font-size: 10px; z-index:10003; display: inline-block; background: white; border-radius: 4px; padding: 0 2px;}\n\n</style>";
          if (isIE()) {
              f = document.createElement("style");
              f.type = "text/css";
              f.media = "screen";
              f.styleSheet.cssText = "#tpm_Container {font-family: 'helvetica neue', arial, sans-serif; position: absolute; padding-top: 37px; z-index: 100000002; top: 0; left: 0; background-color: transparent; opacity: 1;}\n#tpm_Overlay {position: fixed; z-index: 9999; top: 0; right: 0; bottom: 0; left: 0; background-color: #f2f2f2; opacity: .95;}\n#tpm_Control {position:relative; z-index: 100000; float: left; background-color: #fcf9f9; border: solid #ccc; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1;}\n#tpm_Control img {position: relative; padding: 0; display: block; margin: 82px auto 0; -ms-interpolation-mode: bicubic;}\n#tpm_Control a {position: fixed; z-index: 10001; right: 0; top: 0; left: 0; height: 24px; padding: 12px 0 0; text-align: center; font-size: 14px; line-height: 1em; text-shadow: 0 1px #fff; color: #211922; font-weight: bold; text-decoration: none; background: #fff url(" + serverUrl + "/images/nabit/fullGradient07Normal.png) 0 0 repeat-x; border-bottom: 1px solid #ccc; -mox-box-shadow: 0 0 2px #d7d7d7; -webkit-box-shadow: 0 0 2px #d7d7d7;}\n#tpm_Control a:hover {color: #fff; text-decoration: none; background-color: #1389e5; border-color: #1389e5; text-shadow: 0 -1px #46A0E6;}\n#tpm_Control a:active {height: 23px; padding-top: 13px; background-color: #211922; border-color: #211922; background-image: url(" + serverUrl + "/images/nabit/fullGradient07Inverted.png); text-shadow: 0 -1px #211922;}\n.tpmImagePreview {position: relative; padding: 0; margin: 0; float: left; background-color: #fff; border: solid #e7e7e7; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1; z-index: 10002; text-align: center;}\n.tpmImagePreview .tpmImg {border: none; height: 200px; width: 200px; opacity: 1; padding: 0;}\n.tpmImagePreview .tpmImg a {margin: 0; padding: 0; position: absolute; top: 0; bottom: 0; right: 0; left: 0; display: block; text-align: center;  z-index: 1;}\n.tpmImagePreview .tpmImg a:hover {background-color: #fcf9f9; border: none;}\n.tpmImagePreview .tpmImg .ImageToNab {max-height: 200px; max-width: 200px; width: auto !important; height: auto !important;}\n.tpmImagePreview img.tpm_NabIt {border: none; position: absolute; top: 82px; left: 42px; display: none; padding: 0; background-color: transparent; z-index: 100;}\n.tpmImagePreview img.tpm_vidind {border: none; position: absolute; top: 75px; left: 75px; padding: 0; background-color: transparent; z-index: 99;}\n.tpmDimensions { position: relative; margin-top: 180px; text-align: center; font-size: 10px; z-index:10003; display: inline-block; background: white; border-radius: 4px; padding: 0 2px;}\n";
              document.getElementsByTagName("head")[0].appendChild(f)
          } else {
              if (navigator.userAgent.lastIndexOf("Safari/") > 0 && parseInt(navigator.userAgent.substr(navigator.userAgent.lastIndexOf("Safari/") + 7, 7)) < 533) {
                  f = document.createElement("style");
                  f.innerText = "\n#tpm_Container {font-family: 'helvetica neue', arial, sans-serif; position: absolute; padding-top: 37px; z-index: 100000002; top: 0; left: 0; background-color: transparent; opacity: 1;}\n#tpm_Overlay {position: fixed; z-index: 9999; top: 0; right: 0; bottom: 0; left: 0; background-color: #f2f2f2; opacity: .95;}\n#tpm_Control {position:relative; z-index: 100000; float: left; background-color: #fcf9f9; border: solid #ccc; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1;}\n#tpm_Control img {position: relative; padding: 0; display: block; margin: 82px auto 0; -ms-interpolation-mode: bicubic;}\n#tpm_Control a {position: fixed; z-index: 10001; right: 0; top: 0; left: 0; height: 24px; padding: 12px 0 0; text-align: center; font-size: 14px; line-height: 1em; text-shadow: 0 1px #fff; color: #211922; font-weight: bold; text-decoration: none; background: #fff url(" + serverUrl + "/images/nabit/fullGradient07Normal.png) 0 0 repeat-x; border-bottom: 1px solid #ccc; -mox-box-shadow: 0 0 2px #d7d7d7; -webkit-box-shadow: 0 0 2px #d7d7d7;}\n#tpm_Control a:hover {color: #fff; text-decoration: none; background-color: #1389e5; border-color: #1389e5; text-shadow: 0 -1px #46A0E6;}\n#tpm_Control a:active {height: 23px; padding-top: 13px; background-color: #211922; border-color: #211922; background-image: url(" + serverUrl + "/images/nabit/fullGradient07Inverted.png); text-shadow: 0 -1px #211922;}\n.tpmImagePreview {position: relative; padding: 0; margin: 0; float: left; background-color: #fff; border: solid #e7e7e7; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1; z-index: 10002; text-align: center;}\n.tpmImagePreview .tpmImg {border: none; height: 200px; width: 200px; opacity: 1; padding: 0;}\n.tpmImagePreview .tpmImg a {margin: 0; padding: 0; position: absolute; top: 0; bottom: 0; right: 0; left: 0; display: block; text-align: center;  z-index: 1;}\n.tpmImagePreview .tpmImg a:hover {background-color: #fcf9f9; border: none;}\n.tpmImagePreview .tpmImg .ImageToNab {max-height: 200px; max-width: 200px; width: auto !important; height: auto !important;}\n.tpmImagePreview img.tpm_NabIt {border: none; position: absolute; top: 82px; left: 42px; display: none; padding: 0; background-color: transparent; z-index: 100;}\n.tpmImagePreview img.tpm_vidind {border: none; position: absolute; top: 75px; left: 75px; padding: 0; background-color: transparent; z-index: 99;}\n.tpmDimensions { position: relative; margin-top: 180px; text-align: center; font-size: 10px; z-index:10003; display: inline-block; background: white; border-radius: 4px; padding: 0 2px;}\n\n"
              } else {
                  f = document.createElement("style");
                  f.innerHTML = "\n#tpm_Container {font-family: 'helvetica neue', arial, sans-serif; position: absolute; padding-top: 37px; z-index: 100000002; top: 0; left: 0; background-color: transparent; opacity: 1;}\n#tpm_Overlay {position: fixed; z-index: 9999; top: 0; right: 0; bottom: 0; left: 0; background-color: #f2f2f2; opacity: .95;}\n#tpm_Control {position:relative; z-index: 100000; float: left; background-color: #fcf9f9; border: solid #ccc; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1;}\n#tpm_Control img {position: relative; padding: 0; display: block; margin: 82px auto 0; -ms-interpolation-mode: bicubic;}\n#tpm_Control a {position: fixed; z-index: 10001; right: 0; top: 0; left: 0; height: 24px; padding: 12px 0 0; text-align: center; font-size: 14px; line-height: 1em; text-shadow: 0 1px #fff; color: #211922; font-weight: bold; text-decoration: none; background: #fff url(" + serverUrl + "/images/nabit/fullGradient07Normal.png) 0 0 repeat-x; border-bottom: 1px solid #ccc; -mox-box-shadow: 0 0 2px #d7d7d7; -webkit-box-shadow: 0 0 2px #d7d7d7;}\n#tpm_Control a:hover {color: #fff; text-decoration: none; background-color: #1389e5; border-color: #1389e5; text-shadow: 0 -1px #46A0E6;}\n#tpm_Control a:active {height: 23px; padding-top: 13px; background-color: #211922; border-color: #211922; background-image: url(" + serverUrl + "/images/nabit/fullGradient07Inverted.png); text-shadow: 0 -1px #211922;}\n.tpmImagePreview {position: relative; padding: 0; margin: 0; float: left; background-color: #fff; border: solid #e7e7e7; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1; z-index: 10002; text-align: center;}\n.tpmImagePreview .tpmImg {border: none; height: 200px; width: 200px; opacity: 1; padding: 0;}\n.tpmImagePreview .tpmImg a {margin: 0; padding: 0; position: absolute; top: 0; bottom: 0; right: 0; left: 0; display: block; text-align: center;  z-index: 1;}\n.tpmImagePreview .tpmImg a:hover {background-color: #fcf9f9; border: none;}\n.tpmImagePreview .tpmImg .ImageToNab {max-height: 200px; max-width: 200px; width: auto !important; height: auto !important;}\n.tpmImagePreview img.tpm_NabIt {border: none; position: absolute; top: 82px; left: 42px; display: none; padding: 0; background-color: transparent; z-index: 100;}\n.tpmImagePreview img.tpm_vidind {border: none; position: absolute; top: 75px; left: 75px; padding: 0; background-color: transparent; z-index: 99;}\n.tpmDimensions { position: relative; margin-top: 180px; text-align: center; font-size: 10px; z-index:10003; display: inline-block; background: white; border-radius: 4px; padding: 0 2px;}\n\n"
              }
              document.body.appendChild(f)
          }
          
          var o = document.createElement("div");
          o.setAttribute("id", "tpm_Overlay");
          document.keydown = i;
          document.body.appendChild(o);
          var n = document.createElement("div");
          n.setAttribute("id", "tpm_Container");
          document.body.appendChild(n);
          f = document.createElement("div");
          f.setAttribute("id", "tpm_Control");
          t_img = new Image;
          t_img.src = serverUrl + "/images/urbienLogoBig.png";
          t_img.width = "180";
          f.appendChild(t_img);
          t_a = document.createElement("a");
          t_a.href = "#";
          t_a.id = "tpm_RemoveLink";
          t_a.appendChild(document.createTextNode("Cancel"));
          f.appendChild(t_a);
          n.appendChild(f);
          document.getElementById("tpm_RemoveLink").onclick = i;
          i = {};
          for (var h = 0; h < m.length; h++) if (!(i[m[h].src] || isValidImage(m[h]))) {
              i[m[h].src] = 1;
              (function (a) {
                  var b = document.createElement("div");
                  if (isIE()) b.className = "tpmImagePreview";
                  else b.setAttribute("class", "tpmImagePreview");
                  var d = document.createElement("div");
                  if (isIE()) d.className = "tpmImg";
                  else d.setAttribute("class", "tpmImg");
                  var e = document.createElement("span");
                  e.innerHTML = a.w + " x " + a.h;
                  if (isIE()) e.className = "tpmDimensions";
                  else e.setAttribute("class", "tpmDimensions");
                  b.appendChild(e);
                  document.getElementById("tpm_Container").appendChild(b).appendChild(d);
                  b = document.createElement("a");
                  b.setAttribute("href", "#");
                  b.onclick = function () {
                      buildAhaUrl += '&og:image=' + enc(a.src);
                      callAha();
                      o.parentNode.removeChild(o);
                      n.parentNode.removeChild(n);
                      document.tpmLjs = 0;
                      return false
                  };
                  d.appendChild(b);
                  e = document.createElement("img");
                  if (isIE()) d.className = "tpmImg";
                  else d.setAttribute("class", "tpmImg");
                  e.setAttribute("style", "" + y(a));
                  e.src = a.src;
                  e.setAttribute("alt", "Nab It");
                  e.className = "ImageToNab";
                  b.appendChild(e);
//                  var c = document.createElement("img");
////                            var c = document.createElement("button");
//                  if (isIE()) c.className = "tpm_NabIt";
//                  else c.setAttribute("class", "tpm_NabIt");
//                  c.src = serverUrl + "/images/nabit/NabThis.png";
//                  c.setAttribute("alt", "Nab It");
//                  c.innerHTML = "Nab It";
//                  if (isIE()) {
//                      b.attachEvent("onmouseover", function () {
//                          c.style.display = "block"
//                      });
//                      b.attachEvent("onmouseout", function () {
//                          c.style.display = "none"
//                      })
//                  } else {
//                      b.addEventListener("mouseover", function () {
//                          c.style.display = "block"
//                      }, false);
//                      b.addEventListener("mouseout", function () {
//                          c.style.display = "none"
//                      }, false)
//                  }
//                  b.appendChild(c);
                  if (m[h].type == "video") {
                      d = document.createElement("img");
                      if (isIE()) d.className = "tpm_vidind";
                      else d.setAttribute("class", "tpm_vidind");
                      d.src = serverUrl + "/images/aha/VideoIndicator.png";
                      b.appendChild(d)
                  }
              })(m[h])
          }
          if (isIE()) {
              i = document.getElementsByTagName("object");
              for (h = 0; h < i.length; h++) {
                  f = {
                      player: i[h],
                      parent: i[h].parentNode,
                      sibling: i[h].nextSibling
                  };
                  f.parent.removeChild(i[h]);
                  p.push(f)
              }
          }
          scroll(0, 0);
          return m;
      }
  };
  
  nab();
}

})();

//function getHelp() {
//  window.open(buildAhaUrl);
//}

//if (isAha)
//  call();
//else
//  getHelp();
//overlay();
//window.open(buildAhaUrl);