/** DOMReady v2.0.1 - MIT license - https://github.com/freelancephp/DOMReady */
(function(a){a.DOMReady=function(){var b=[],c=false,d=null,e=function(a,b){try{a.apply(this,b||[])}catch(c){if(d)d.call(this,c)}},f=function(){c=true;for(var a=0;a<b.length;a++)e(b[a].fn,b[a].args||[]);b=[]};this.setOnError=function(a){d=a;return this};this.add=function(a,d){if(c){e(a,d)}else{b[b.length]={fn:a,args:d}}return this};if(a.addEventListener){a.document.addEventListener("DOMContentLoaded",function(){f()},false)}else{(function(){if(!a.document.uniqueID&&a.document.expando)return;var b=a.document.createElement("document:ready");try{b.doScroll("left");f()}catch(c){setTimeout(arguments.callee,0)}})()}return this}()})(window);

DOMReady.add( function () {
  'use strict';
  var l = Lablz,
      head = d.head,
      mc = d.createElement('div'),
      mp = d.createElement('div'),
      mph = d.createElement('div');
  
  d.title = l.currentApp.title;
  mc.className = 'modal-cover';
  mp.className = 'modal-popups vcentered';

  d.body.appendChild(mc);
  d.body.appendChild(mp);

  if (localStorage  &&  localStorage.getItem) {
    try {
      localStorage.setItem('homePage', l.homePage);
      localStorage.setItem('homePageCss', l.globalCss);
    } catch (err) {
      localStorage.clear();
      localStorage.setItem('homePage', l.homePage);
      localStorage.setItem('homePageCss', l.globalCss);
    }
  }
  
  var hash = window.location.hash;
  if ((!hash && /app\/[a-zA-Z]+$/.test(window.location.href)) || /\#home/.test(hash)) {
    d.body.innerHTML = d.body.innerHTML + l.homePage;
    delete l.homePage;
    var style = d.createElement('style');
    style.type = 'text/css';
    style.textContent = l.globalCss; 
    head.appendChild(style);
    delete l.globalCss;

    var scripts = d.body.getElementsByTagName('script');
/*  console.log('scripts: ' + scripts.length); */ 

    try {
      for (var i=0; scripts  &&  i<scripts.length; i++) {
        var s = d.createElement('script'); 
        s.type = 'text/javascript';
        if (scripts[i].innerText)
          s.innerText = scripts[i].innerText;
        else 
          s.innerHTML =  scripts[i].innerHTML;
  /*      console.log('script: ' + scripts[i].innerHTML); */ 
        head.appendChild(s);
  /*      eval(scripts[i].innerText); */ 
      }
    } catch (e) {
      console.log('eval failed: ' + e);
    }
  }
  
  
/*  if (window.location.hash) { 
    div.style.display = 'none';
  }*/
  
  /*d.getElementById('page').appendChild(div);*/
/*  d.body.appendChild(div);*/
  /*setTimeout(function() {*/
  
      var s = d.createElement('script'); 
      s.type = 'text/javascript';
      s.charset = 'utf-8';
      s.async = true;
      
      s.src = l.initScript.src; 
      s.setAttribute('data-main', l.initScript['data-main']);
      head.appendChild(s);
/*  }, 0); */
  
    l.serverName = (function() {     
      var s = d.getElementsByTagName('base')[0].href;
      return s.match("/$") ? s.slice(0, s.length - 1) : s;
    })();
    
    for (var i = 0, r = l.X_CSS; i < r.length; i++) {
      var k = d.createElement('link');
      k.rel = 'stylesheet';
      k.type = 'text/css';
      k.href = r[i]; 
      head.appendChild(k);
    }
});
