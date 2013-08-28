(function() {
var scripts = document.getElementsByTagName('script'),
    ahaScriptSrc = scripts[scripts.length - 1].src,
    serverUrl = ahaScriptSrc.slice(0, ahaScriptSrc.indexOf('/js/')).replace(/^https:\/\//, 'http://'),
    currentHref = window.location.href,
    enc = encodeURIComponent,
//    keyword = isAha ? 'Aha!' : 'Huh?',
    saveAhaUrl = serverUrl + '/aha?',
    onAhaMsg = "You have been registered as a bona fide expert on this...whatever it is. You are now a superhero on call in the endless battle against the evil powers of ignorance and bliss. Welcome aboard!",
    containerDiv,
    overlayDiv,
    setImage = true,
    description,
    ogTags = [],
    images = [],
    $ = function() {
      return document.querySelector.apply(document, arguments);
    };

function isIE() {
  return /msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent)
}
function isSafari() {
  return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
}
function isIOS() {
  return navigator.userAgent.match(/iPad|iPhone|iPod|iPod/i) != null
}

function addParam(name, val) {
  saveAhaUrl += enc(name) + '=' + enc(val) + '&';
}

function collectInfo() {
  var infoTags = ['keywords', 'author', 'news_keywords', 'abstract'];
  for (var c = document.getElementsByTagName("meta"), k = 0; k < c.length; k++) {
    var p = c[k].getAttribute('property') || c[k].getAttribute('name'),
        hasOGUrl = false;
    
    if (!p)
      continue;
    
    if (/^og:/.test(p)) {
      ogTags.push(p);
      var value = c[k].getAttribute('content');
      if (p == 'og:image') {
        setImage = true;
        images.push(value);
        var img = new Image;
        img.src = value;
        img.onload = function() {
          if (this.width < 200 || this.height < 200) {
            images.splice(images.indexOf(value), 1);
            if (!images.length)
              setImage = true;
          }
        };
      }
      else
        addParam(p, value);
    }
    else {
      if (infoTags.indexOf(p) != -1)
        addParam(p, c[k].getAttribute('content'));
    }
  }
  
  var ogUrlIdx = ogTags.indexOf('og:url');
  if (ogUrlIdx == -1)
    addParam('url', currentHref);
  else
    currentHref = ogTags[ogUrlIdx];
    
  if (ogTags.indexOf('og:title') == -1)
    addParam('title', document.title);
  if (ogTags.indexOf('og:type') == -1)
    addParam('og:type', 'website');
  
  var descIdx = ogTags.indexOf('og:description');
  if (descIdx == -1) {
    var a = window,
        b = document,
        description = ("" + (a.getSelection ? a.getSelection() : b.getSelection ? b.getSelection() : b.selection.createRange().text)).replace(/(^\s+|\s+$)/g, "");
    
    if (description.length)
      addParam('og:description', description);
  }
  else
    description = ogTags[descIdx];
}

function callAha() {
  if (images.length)
    saveAhaUrl += '&og:image=' + enc(images[0]);
    
  removeOverlay();
  if (isIOS()) {
//    setTimeout(function () {
//      window.location = saveAhaUrl;
//    }, 25);
    
    window.location = saveAhaUrl;
  } 
  else 
    window.open(saveAhaUrl, 'Aha' + +new Date());
//    window.open(url, 'Aha' + (new Date).getTime(), "status=no,resizable=no,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,width=750,height=450,left=0,top=0");
}

function y(a) {
  if (Math.max(a.h, a.w) > 199) {
    if (a.h < a.w) return "margin-top: " + parseInt(100 - 100 * (a.h / a.w)) + "px;";
    return ""
  } else return "margin-top: " + parseInt(100 - a.h / 2) + "px;"
}

function removeOverlay() {
  var overlay = $('#ahaOverlay');
  if (overlay && overlay.parentNode)
    overlay.parentNode.removeChild(overlay);
  
  var container = $('#ahaContainer');
  if (container && container.parentNode)
    container.parentNode.removeChild(container);  
  
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
            "#ahaContainer {position: absolute; z-index: 100000002; top: 0; left: 0; background-color: transparent; opacity: 1; width: 100%; height: 100%}\n" +
            "#ahaContainer h1, #ahaContainer h2, #ahaContainer a, #ahaContainer p {font-family: 'helvetica neue', arial, sans-serif;}\n" +
//            "#ahaHeader {padding-top: 10px; margin-bottom: 30px; text-align:center; font-family: 'helvetica neue', arial, sans-serif; opacity: 1; z-index: 100000002; top: 0; left: 0; width: 100%;}\n" +
//            "#ahaHeader img {max-width: 95%;}\n" +
            "#ahaBtn, #huhBtn {padding-top: 30px; text-align:center; font-family: 'helvetica neue', arial, sans-serif; background-color: transparent; opacity: 1; width: 50%; height: 90%; z-index: 100000002;}\n" +
            "#ahaButton img, #huhButton img { max-width: 50%; }" +
//            "#ahaCancelBtn {float:right; background-color: #f00; height: 100%}\n" + 
            "#ahaCancelBtn {text-decoration:none; float:right; position: absolute; right: 5px; top: 5px; cursor: pointer; z-index:100000005}"; //\n" +
//            "#ahaTip, #huhTip {display: none}";
//            "#ahaBtn {float:left}\n" + 
//            "#huhBtn {float:right}\n" + 
//            "#ahaBtn a, #huhBtn a {margin: 0 auto;}\n" + 
//            "#ahaBtn img, #huhBtn img {max-width: 50%;}\n" +
//            "#ahaBtn img:hover, #huhBtn img:hover {color: #fff; text-decoration: none; text-shadow: 0 -1px #46A0E6;}\n" + 
//            "#ahaBtn img:hover {color: #fff; text-decoration: none; background-color: #00ff00; border-color: #1389e5;}\n" + 
//            "#huhBtn img:hover {color: #fff; text-decoration: none; background-color: #ff0000; border-color: #1389e5; text-shadow: 0 -1px #46A0E6;}"; 
  
  var f;
  if (isIE()) {
    f = document.createElement("style");
    f.type = "text/css";
    f.media = "screen";
    f.styleSheet.cssText = css;
    $("head")[0].appendChild(f)
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
  
  
// text version
//  var overlayHTML = " <span id=\"ahaCancelBtn\" style=\"float:right\"><img src=\"http://urbien.com/images/x.png\" /></span>\r\n" + 
//  		"    <table id=\"ahaContainer\" cols=\"4\">\r\n" + 
//  		"        <tr height=\"10%\">\r\n" + 
//  		"            <td colspan=\"4\" style=\"text-align:center\">\r\n" + 
//  		"                <h1>Get it?</h1>\r\n" + 
//  		"            </td>\r\n" + 
//  		"        </tr>\r\n" + 
//  		"        <tr height=\"90%\" style=\"text-align:center\">\r\n" + 
//  		"            <td colspan=\"2\" width=\"50%\">\r\n" + 
//  		"                <h2><a href=\"#\" id=\"ahaButton\">Aha!</a></h2>\r\n" + 
//  		"                <p id=\"ahaTip\">(I'm ready to explain this to others)</p>\r\n" + 
//  		"            </td>\r\n" + 
//  		"            <td colspan=\"2\" width=\"50%\">\r\n" + 
//  		"                <h2><a href=\"#\" id=\"huhButton\">Huh?</a></h2>\r\n" + 
//  		"                <p id=\"huhTip\">(Can someone please explain it to me?)</p>\r\n" + 
//  		"            </td>\r\n" + 
//  		"        </tr>\r\n" + 
//  		"    </table>";

// image version
  var overlayHTML = "<span id=\"ahaCancelBtn\" style=\"color:white;font-size:20px; font-weight:bold;\">X<!--img src=\"http://urbien.com/images/x.png\" /--></span>\r\n" + 
  		"    <table id=\"ahaContainer\" cols=\"4\">\r\n" + 
  		"        <tr height=\"10%\">\r\n" + 
  		"            <td colspan=\"4\" style=\"background-color: #1d1dc5; color: #eee; opacity: 0.8;text-align:center\">\r\n" + 
  		"                <span style=\"font-size:30px\">Get it??</span>\r\n" + 
  		"            </td>\r\n" + 
  		"        </tr>\r\n" + 
      "        <tr height=\"5%\" style=\"text-align:center\"></tr>" + 
  		"        <tr height=\"85%\" style=\"text-align:center\">\r\n" + 
  		"            <td colspan=\"2\" width=\"50%\">\r\n" + 
  		"                <a href=\"javascript:void(0);\" id=\"ahaButton\"><img alt=\"Aha!\" src=\"http://urbien.com/images/aha/aha_big.png\" /></a>\r\n" + 
  		"                <br/><span id=\"ahaTip\" style=\"font-size:18px;\">(I'm ready to explain this to others)</span>\r\n" + 
  		"            </td>\r\n" + 
  		"            <td colspan=\"2\" width=\"50%\">\r\n" + 
  		"                <a href=\"javascript:void(0);\" id=\"huhButton\"><img alt=\"Huh?\" src=\"http://urbien.com/images/aha/huh_big.png\" /></a>\r\n" + 
  		"                <br/><span id=\"huhTip\" style=\"font-size:18px;\">(Can someone please explain it to me?)</span>\r\n" + 
  		"            </td>\r\n" + 
  		"        </tr>\r\n" + 
  		"    </table>";
  
  var overlayDiv = document.createElement("div");
  overlayDiv.setAttribute("id", "ahaOverlay");
  overlayDiv.innerHTML = overlayHTML;
  
  document.body.appendChild(overlayDiv);
  document.keydown = removeOverlay;
  
  var ahaBtn = $('#ahaButton'),
      huhBtn = $('#huhButton');
  
  ahaBtn.onclick = function() {
    onchoose(true);
    return false;
  };
  
  huhButton.onclick = function() {
    onchoose(false);
    return false;
  };

  $('#ahaCancelBtn').onclick = function() {
    removeOverlay();
    return false;
  };
  
  var ahaTip = $('#ahaTip'),
      huhTip = $('#huhTip');
  
//  if (isIE()) {
//    ahaBtn.attachEvent("onmouseover", function () {
//      ahaTip.style.display = "block";
//    });
//    ahaBtn.attachEvent("onmouseout", function () {
//      ahaTip.style.display = "none"
//    });
//    
//    huhBtn.attachEvent("onmouseover", function () {
//      huhTip.style.display = "block";
//    });
//    huhBtn.attachEvent("onmouseout", function () {
//      huhTip.style.display = "none"
//    });   
//  } else {
//    ahaBtn.addEventListener("mouseover", function () {
//      ahaTip.style.display = "block"
//    }, false);
//    ahaBtn.addEventListener("mouseout", function () {
//      ahaTip.style.display = "none"
//    }, false);
//    huhBtn.addEventListener("mouseover", function () {
//      huhTip.style.display = "block"
//    }, false);
//    huhBtn.addEventListener("mouseout", function () {
//      huhTip.style.display = "none"
//    }, false);
//  }


  function onchoose(aha) {
    saveAhaUrl += '&aha=' + (aha ? 'y' : 'n');
    if (setImage)
      showImageChooser();
    else {
      removeOverlay();
      callAha();
    }
  };
  
  scroll(0, 0);
}

overlay();
collectInfo();  
checkDuplicate(); // check for duplicate online resource

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
        var w = saveAhaUrl,
            x = saveAhaUrl,
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

          var noImg = new Image;
          noImg.src = serverUrl + '/images/no_image.png';
          m.push({
            w: 300,
            h: 300,
            src: noImg.src,
            alt: 'No good image here',
            im2: new Image,
            img: noImg
          });
          
          i = function () {
              o.parentNode.removeChild(o);
              n.parentNode.removeChild(n);
              document.tpmLjs = 0;
              if (isIE()) for (var a = 0; a < p.length; a++) p[a].parent.insertBefore(p[a].player, p[a].sibling);
              return false
          };
          
          html = "<style>\n#tpm_Container {font-family: 'helvetica neue', arial, sans-serif; position: absolute; padding-top: 37px; z-index: 100000002; top: 0; left: 0; background-color: transparent; opacity: 1;}\n#tpm_Overlay {position: fixed; z-index: 9999; top: 0; right: 0; bottom: 0; left: 0; background-color: #f2f2f2; opacity: .95;}\n#tpm_Control {position:relative; z-index: 100000; float: left; background-color: #F7D695; border: solid #ccc; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1;}\n#tpm_Control img {position: relative; padding: 0; display: block; margin: 82px auto 0; -ms-interpolation-mode: bicubic;}\n#tpm_Control a {position: fixed; z-index: 10001; right: 0; top: 0; left: 0; height: 24px; padding: 12px 0 0; text-align: center; font-size: 14px; line-height: 1em; text-shadow: 0 1px #fff; color: #211922; font-weight: bold; text-decoration: none; background: #fff url(" + serverUrl + "/images/nabit/fullGradient07Normal.png') 0 0 repeat-x; border-bottom: 1px solid #ccc; -mox-box-shadow: 0 0 2px #d7d7d7; -webkit-box-shadow: 0 0 2px #d7d7d7;}\n#tpm_Control a:hover {color: #fff; text-decoration: none; background-color: #1389e5; border-color: #1389e5; text-shadow: 0 -1px #46A0E6;}\n#tpm_Control a:active {height: 23px; padding-top: 13px; background-color: #211922; border-color: #211922; background-image: url(" + serverUrl + "/images/nabit/fullGradient07Inverted.png); text-shadow: 0 -1px #211922;}\n.tpmImagePreview {position: relative; padding: 0; margin: 0; float: left; background-color: #fff; border: solid #e7e7e7; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1; z-index: 10002; text-align: center;}\n.tpmImagePreview .tpmImg {border: none; height: 200px; width: 200px; opacity: 1; padding: 0;}\n.tpmImagePreview .tpmImg a {margin: 0; padding: 0; position: absolute; top: 0; bottom: 0; right: 0; left: 0; display: block; text-align: center;  z-index: 1;}\n.tpmImagePreview .tpmImg a:hover {background-color: #F7D695; border: none;}\n.tpmImagePreview .tpmImg .ImageToNab {max-height: 200px; max-width: 200px; width: auto !important; height: auto !important;}\n.tpmImagePreview img.tpm_NabIt {border: none; position: absolute; top: 82px; left: 42px; display: none; padding: 0; background-color: transparent; z-index: 100;}\n.tpmImagePreview img.tpm_vidind {border: none; position: absolute; top: 75px; left: 75px; padding: 0; background-color: transparent; z-index: 99;}\n.tpmDimensions { position: relative; margin-top: 180px; text-align: center; font-size: 10px; z-index:10003; display: inline-block; background: white; border-radius: 4px; padding: 0 2px;}\n\n</style>";
          if (isIE()) {
              f = document.createElement("style");
              f.type = "text/css";
              f.media = "screen";
              f.styleSheet.cssText = "#tpm_Container {font-family: 'helvetica neue', arial, sans-serif; position: absolute; padding-top: 37px; z-index: 100000002; top: 0; left: 0; background-color: transparent; opacity: 1;}\n#tpm_Overlay {position: fixed; z-index: 9999; top: 0; right: 0; bottom: 0; left: 0; background-color: #f2f2f2; opacity: .95;}\n#tpm_Control {position:relative; z-index: 100000; float: left; background-color: #F7D695; border: solid #ccc; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1;}\n#tpm_Control img {position: relative; padding: 0; display: block; margin: 82px auto 0; -ms-interpolation-mode: bicubic;}\n#tpm_Control a {position: fixed; z-index: 10001; right: 0; top: 0; left: 0; height: 24px; padding: 12px 0 0; text-align: center; font-size: 14px; line-height: 1em; text-shadow: 0 1px #fff; color: #211922; font-weight: bold; text-decoration: none; background: #fff url(" + serverUrl + "/images/nabit/fullGradient07Normal.png) 0 0 repeat-x; border-bottom: 1px solid #ccc; -mox-box-shadow: 0 0 2px #d7d7d7; -webkit-box-shadow: 0 0 2px #d7d7d7;}\n#tpm_Control a:hover {color: #fff; text-decoration: none; background-color: #1389e5; border-color: #1389e5; text-shadow: 0 -1px #46A0E6;}\n#tpm_Control a:active {height: 23px; padding-top: 13px; background-color: #211922; border-color: #211922; background-image: url(" + serverUrl + "/images/nabit/fullGradient07Inverted.png); text-shadow: 0 -1px #211922;}\n.tpmImagePreview {position: relative; padding: 0; margin: 0; float: left; background-color: #fff; border: solid #e7e7e7; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1; z-index: 10002; text-align: center;}\n.tpmImagePreview .tpmImg {border: none; height: 200px; width: 200px; opacity: 1; padding: 0;}\n.tpmImagePreview .tpmImg a {margin: 0; padding: 0; position: absolute; top: 0; bottom: 0; right: 0; left: 0; display: block; text-align: center;  z-index: 1;}\n.tpmImagePreview .tpmImg a:hover {background-color: #F7D695; border: none;}\n.tpmImagePreview .tpmImg .ImageToNab {max-height: 200px; max-width: 200px; width: auto !important; height: auto !important;}\n.tpmImagePreview img.tpm_NabIt {border: none; position: absolute; top: 82px; left: 42px; display: none; padding: 0; background-color: transparent; z-index: 100;}\n.tpmImagePreview img.tpm_vidind {border: none; position: absolute; top: 75px; left: 75px; padding: 0; background-color: transparent; z-index: 99;}\n.tpmDimensions { position: relative; margin-top: 180px; text-align: center; font-size: 10px; z-index:10003; display: inline-block; background: white; border-radius: 4px; padding: 0 2px;}\n";
              document.getElementsByTagName("head")[0].appendChild(f)
          } else {
              if (navigator.userAgent.lastIndexOf("Safari/") > 0 && parseInt(navigator.userAgent.substr(navigator.userAgent.lastIndexOf("Safari/") + 7, 7)) < 533) {
                  f = document.createElement("style");
                  f.innerText = "\n#tpm_Container {font-family: 'helvetica neue', arial, sans-serif; position: absolute; padding-top: 37px; z-index: 100000002; top: 0; left: 0; background-color: transparent; opacity: 1;}\n#tpm_Overlay {position: fixed; z-index: 9999; top: 0; right: 0; bottom: 0; left: 0; background-color: #f2f2f2; opacity: .95;}\n#tpm_Control {position:relative; z-index: 100000; float: left; background-color: #F7D695; border: solid #ccc; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1;}\n#tpm_Control img {position: relative; padding: 0; display: block; margin: 82px auto 0; -ms-interpolation-mode: bicubic;}\n#tpm_Control a {position: fixed; z-index: 10001; right: 0; top: 0; left: 0; height: 24px; padding: 12px 0 0; text-align: center; font-size: 14px; line-height: 1em; text-shadow: 0 1px #fff; color: #211922; font-weight: bold; text-decoration: none; background: #fff url(" + serverUrl + "/images/nabit/fullGradient07Normal.png) 0 0 repeat-x; border-bottom: 1px solid #ccc; -mox-box-shadow: 0 0 2px #d7d7d7; -webkit-box-shadow: 0 0 2px #d7d7d7;}\n#tpm_Control a:hover {color: #fff; text-decoration: none; background-color: #1389e5; border-color: #1389e5; text-shadow: 0 -1px #46A0E6;}\n#tpm_Control a:active {height: 23px; padding-top: 13px; background-color: #211922; border-color: #211922; background-image: url(" + serverUrl + "/images/nabit/fullGradient07Inverted.png); text-shadow: 0 -1px #211922;}\n.tpmImagePreview {position: relative; padding: 0; margin: 0; float: left; background-color: #fff; border: solid #e7e7e7; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1; z-index: 10002; text-align: center;}\n.tpmImagePreview .tpmImg {border: none; height: 200px; width: 200px; opacity: 1; padding: 0;}\n.tpmImagePreview .tpmImg a {margin: 0; padding: 0; position: absolute; top: 0; bottom: 0; right: 0; left: 0; display: block; text-align: center;  z-index: 1;}\n.tpmImagePreview .tpmImg a:hover {background-color: #F7D695; border: none;}\n.tpmImagePreview .tpmImg .ImageToNab {max-height: 200px; max-width: 200px; width: auto !important; height: auto !important;}\n.tpmImagePreview img.tpm_NabIt {border: none; position: absolute; top: 82px; left: 42px; display: none; padding: 0; background-color: transparent; z-index: 100;}\n.tpmImagePreview img.tpm_vidind {border: none; position: absolute; top: 75px; left: 75px; padding: 0; background-color: transparent; z-index: 99;}\n.tpmDimensions { position: relative; margin-top: 180px; text-align: center; font-size: 10px; z-index:10003; display: inline-block; background: white; border-radius: 4px; padding: 0 2px;}\n\n"
              } else {
                  f = document.createElement("style");
                  f.innerHTML = "\n#tpm_Container {font-family: 'helvetica neue', arial, sans-serif; position: absolute; padding-top: 37px; z-index: 100000002; top: 0; left: 0; background-color: transparent; opacity: 1;}\n#tpm_Overlay {position: fixed; z-index: 9999; top: 0; right: 0; bottom: 0; left: 0; background-color: #f2f2f2; opacity: .95;}\n#tpm_Control {position:relative; z-index: 100000; float: left; background-color: #F7D695; border: solid #ccc; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1;}\n#tpm_Control img {position: relative; padding: 0; display: block; margin: 82px auto 0; -ms-interpolation-mode: bicubic;}\n#tpm_Control a {position: fixed; z-index: 10001; right: 0; top: 0; left: 0; height: 24px; padding: 12px 0 0; text-align: center; font-size: 14px; line-height: 1em; text-shadow: 0 1px #fff; color: #211922; font-weight: bold; text-decoration: none; background: #fff url(" + serverUrl + "/images/nabit/fullGradient07Normal.png) 0 0 repeat-x; border-bottom: 1px solid #ccc; -mox-box-shadow: 0 0 2px #d7d7d7; -webkit-box-shadow: 0 0 2px #d7d7d7;}\n#tpm_Control a:hover {color: #fff; text-decoration: none; background-color: #1389e5; border-color: #1389e5; text-shadow: 0 -1px #46A0E6;}\n#tpm_Control a:active {height: 23px; padding-top: 13px; background-color: #211922; border-color: #211922; background-image: url(" + serverUrl + "/images/nabit/fullGradient07Inverted.png); text-shadow: 0 -1px #211922;}\n.tpmImagePreview {position: relative; padding: 0; margin: 0; float: left; background-color: #fff; border: solid #e7e7e7; border-width: 0 1px 1px 0; height: 200px; width: 200px; opacity: 1; z-index: 10002; text-align: center;}\n.tpmImagePreview .tpmImg {border: none; height: 200px; width: 200px; opacity: 1; padding: 0;}\n.tpmImagePreview .tpmImg a {margin: 0; padding: 0; position: absolute; top: 0; bottom: 0; right: 0; left: 0; display: block; text-align: center;  z-index: 1;}\n.tpmImagePreview .tpmImg a:hover {background-color: #F7D695; border: none;}\n.tpmImagePreview .tpmImg .ImageToNab {max-height: 200px; max-width: 200px; width: auto !important; height: auto !important;}\n.tpmImagePreview img.tpm_NabIt {border: none; position: absolute; top: 82px; left: 42px; display: none; padding: 0; background-color: transparent; z-index: 100;}\n.tpmImagePreview img.tpm_vidind {border: none; position: absolute; top: 75px; left: 75px; padding: 0; background-color: transparent; z-index: 99;}\n.tpmDimensions { position: relative; margin-top: 180px; text-align: center; font-size: 10px; z-index:10003; display: inline-block; background: white; border-radius: 4px; padding: 0 2px;}\n\n"
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
                      images.push(a.src);
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
//  window.open(saveAhaUrl);
//}

//if (isAha)
//  call();
//else
//  getHelp();
//overlay();
//window.open(saveAhaUrl);