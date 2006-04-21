/* Copyright Richard Cornford 2004 */
var finalizeMe = (function()  {
  var global = this, base, safe = false, svType = (global.addEventListener && 2) || (global.attachEvent && 3) || 0;

  function addFnc(next, f) {
    function t(ev) {
      if (next) next(ev);

      f(ev);
    }

    ;
    t.addItem = function(d) {
      if (f != d.getFunc()) {
        if (next) {
          next.addItem(d);
        }
        else {
          next = d;
        }
      }

      return this;
    };

    t.remove = function(d) {
      if (f == d) {
        f = null;
        return next;
      }
      else if (next) {
        next = next.remove(d);
      }

      return this;
    };

    t.getFunc = function() {
      return f;
    } ;

    t.finalize = function() {
      if (next) next = next.finalize();

      return (f = null);
    };

    return t;
  }

  ;

  function addFunction(f) {
    if (base) {
      base = base.addItem(addFnc(null, f));
    }
    else {
      base = addFnc(null, f);
    }
  }

  ;

  function ulQue(f) {
    addFunction(f);

    if (!safe) {
      switch (svType) {
        case 2:
          global.addEventListener("unload", base, false);
          safe = true;
          break;
        case 3:
          global.attachEvent("onunload", base);
          safe = true;
          break;
        default:
          if (global.onunload != base) {
            if (global.onunload) addFunction(global.onunload);
            global.onunload = base;
          }
          break;
      }
    }
  }

  ;
  ulQue.remove = function(f) {
    if (base) base.remove(f);
  };

  function finalize() {
    if (base) {
      base.finalize();

      switch (svType) {
        case 3:
          global.detachEvent("onunload", base);
          break;
        case 2:
          global.removeEventListener("unload", base, false);
          break;
        default:
          global.onunload = null;
          break;
      }
      base = null;
    }

    safe = false;
  }

  ;
  ulQue(finalize);
  return ulQue;
})();

var InitializeMe = (function() {
  var global = this, base = null, safe = false;

  var listenerType = (global.addEventListener && 2) || (global.attachEvent && 3) || 0;

  function getStackFunc(next, funcRef, arg1, arg2, arg3, arg4) {
    function l(ev) {
      funcRef((ev ? ev : global.event), arg1, arg2, arg3, arg4);

      if (next)
        next = next(ev);

      return (funcRef = null);
    }

    ;
    l.addItem = function(d) {
      if (next) {
        next.addItem(d);
      }
      else {
        next = d;
      }
    };

    return l;
  }

  ;
  return (function(funcRef, arg1, arg2, arg3, arg4) {
    if (base) {
      base.addItem(getStackFunc(null, funcRef, arg1, arg2, arg3, arg4));
    }
    else {
      base = getStackFunc(null, funcRef, arg1, arg2, arg3, arg4);
    }

    if (!safe) {
      switch (listenerType) {
        case 2:
          global.addEventListener("load", base, false);
          safe = true;
          break;
        case 3:
          global.attachEvent("onload", base);
          safe = true;
          break;
        default:
          if (global.onload != base) {
            if (global.onload) {
              base.addItem(getStackFunc(null, global.onload));
            }
            global.onload = base;
          }
          break;
      }
    }
  });
})();

var queryStrings = (function(out) {
  if (typeof location != 'undefined') {
    var temp = location.search || location.href || '';

    var nvp, ofSet;
    if ((ofSet = temp.indexOf('?')) > -1) {
      temp = temp.split("#")[0];

      temp = temp.substring((ofSet + 1), temp.length);
      var workAr = temp.split('&');
      for (var c = workAr.length; c--; ) {
        nvp = workAr[c].split('=');

        if (nvp.length > 1) {
          out[nvp[0]] = nvp[1];
        }
      }
    }
  }

  return out;
})({
});

var TimedQue = (function() {
  var base, timer;

  var interval = 60;
  var newFncs = null;

  function addFnc(next, f) {
    function t() {
      next = next && next();

      if (f()) {
        return t;
      }
      else {
        f = null;
        return next;
      }
    }

    t.addItem = function(d) {
      if (next) {
        next.addItem(d);
      }
      else {
        next = d;
      }

      return this;
    };

    t.finalize = function() {
      return ((next) && (next = next.finalize()) || (f = null));
    } ;

    return t;
  }

  function tmQue(fc) {
    if (newFncs) {
      newFncs = newFncs.addItem(addFnc(null, fc));
    }
    else {
      newFncs = addFnc(null, fc);
    }

    if (!timer) {
      timer = setTimeout(tmQue.act, interval);
    }
  }

  tmQue.act = function() {
    var fn = newFncs, strt = new Date().getTime();

    if (fn) {
      newFncs = null;
      if (base) {
        base.addItem(fn);
      }
      else {
        base = fn;
      }
    }

    base = base && base();

    if (base || newFncs) {
      var t = interval - ( new Date().getTime() - strt);
      timer = setTimeout(tmQue.act, ((t > 0) ? t : 1));
    }
    else {
      timer = null;
    }
  };

  tmQue.act.toString = function() {
    return 'TimedQue.act()';
  } ;

  tmQue.finalize = function() {
    timer = timer && clearTimeout(timer);

    base = base && base.finalize();
    newFncs = null;
  };

  return tmQue;
})();

var getElementWithId = (function() {
  if (document.getElementById) {
    return (function(id) {
      return document.getElementById(id);
    } );
  }
  else if (document.all) {
    return (function(id) {
      return document.all[id];
    } );
  }

  return (function(id) {
    return null;
  } );
})();

function getSimpleExtPxIn(el) {
  var temp, temp2, tick = 0, getBorders = retFalse, doCompStyle = retFalse, defaultView, objList = [];

  function retFalse() {
    return false;
  }

  retFalse.elTest = retFalse;
  retFalse.iY = retFalse.iX = retFalse.y = retFalse.x = retFalse.w = retFalse.h = retFalse.bb = retFalse.bt
    = retFalse.bl = retFalse.br = 0;

  function retThis() {
    return retThis;
  }

  function gCompStyleBorders(p, el) {
    doCompStyle(p, defaultView.getComputedStyle(el, ''));
  }

  function doComputedStyleFloat(p, cs) {
    p.bt = (cs.getPropertyCSSValue('border-top-width').getFloatValue(5));

    p.bl = (cs.getPropertyCSSValue('border-left-width').getFloatValue(5));
    p.br = (cs.getPropertyCSSValue('border-right-width').getFloatValue(5));
    p.bb = (cs.getPropertyCSSValue('border-bottom-width').getFloatValue(5));
  }

  function doComputedStyleValue(p, cs) {
    p.bt = Math.ceil(parseFloat(s.getPropertyValue('border-top-width'))) | 0;

    p.bl = Math.ceil(parseFloat(s.getPropertyValue('border-left-width'))) | 0;
    p.br = Math.ceil(parseFloat(s.getPropertyValue('border-right-width'))) | 0;
    p.bb = Math.ceil(parseFloat(s.getPropertyValue('border-bottom-width'))) | 0;
  }

  function gClientBorders(p, el) {
    if (el.clientWidth || el.clientHeight) {
      p.bb = (el.offsetHeight - (el.clientHeight + (p.bt = el.clientTop | 0))) | 0;
      p.br = (el.offsetWidth - (el.clientWidth + (p.bl = el.clientLeft | 0))) | 0;
    }
  }

  function getInterfaceObj(el) {
    var lastTick = NaN;

    var offsetParent = getSimpleExtPxInFn(el.offsetParent) || retFalse;

    function p(doTick) {
      if (doTick) {
        tick = (1 + tick) % 0xEFFFFFFF;
      }

      if (tick != lastTick) {
        lastTick = tick;

        offsetParent();
        getBorders(p, el);
        p.iY = (p.y = (offsetParent.iY + (el.offsetTop | 0))) + p.bt;
        p.iX = (p.x = (offsetParent.iX + (el.offsetLeft | 0))) + p.bl;
        p.w = el.offsetWidth | 0;
        p.h = el.offsetHeight | 0;
      }

      return p;
    }

    p.elTest = function(elmnt) {
      return (elmnt == el);
    } ;

    p.iY = p.iX = p.w = p.h = p.y = p.x = p.bb = p.bt = p.bl = p.br = 0;
    return (objList[objList.length] = p);
  }

  function getSimpleExtPxInFn(el) {
    if ((!el) || (el == document)) {
      return retFalse;
    }

    for (var c = objList.length; c--; ) {
      if (objList[c].elTest(el)) {
        return objList[c];
      }
    }

    return getInterfaceObj(el);
  }

  function setSpecialObj(el) {
    var lastTick = NaN;

    function p(doTick) {
      if (doTick) {
        tick = (1 + tick) % 0xEFFFFFFF;
      }

      return p;
    }

    p.elTest = function(elmnt) {
      return (elmnt == el);
    } ;

    p.iY = p.iX = p.w = p.h = p.y = p.x = p.bb = p.bt = p.bl = p.br = 0;
    objList[objList.length] = p;
  }

  if (( typeof el.offsetParent != 'undefined') && ( typeof el.offsetTop == 'number')
    && ( typeof el.offsetWidth == 'number')) {
    if (( typeof el.clientTop == 'number') && ( typeof el.clientWidth == 'number')) {
      getBorders = gClientBorders;
    }
    else if ((defaultView = document.defaultView) && defaultView.getComputedStyle && (temp
                                                                                       = defaultView.getComputedStyle(
                                                                                           el,
                                                                                           ''))
      && (((temp.getPropertyCSSValue) && (temp2 = temp.getPropertyCSSValue(
                                                    'border-top-width')) && (temp2.getFloatValue) && (doCompStyle
                                                                                                       = doComputedStyleFloat)) || ((temp.getPropertyValue) && (doCompStyle
                                                                                                                                                                 = doComputedStyleValue))))
      {
      getBorders = gCompStyleBorders;

      temp2 = temp = null;
    }

    if (document.documentElement) {
      setSpecialObj(document.documentElement);
    }

    if (document.body) {
      setSpecialObj(document.body);
    }
    return (getSimpleExtPxIn = getSimpleExtPxInFn)(el);
  }
  else {
    retThis.elTest = retFalse;

    retThis.iY = retThis.iX = retThis.y = retThis.x = retThis.w = retThis.h = retThis.bb = retThis.bt = retThis.bl
      = retThis.br = NaN;
    return (getSimpleExtPxIn = retThis);
  }
}

function getNewFILCFncStac(fnc) {
  function getNewFnc(f) {
    var next = null;

    function t(a) {
      next = next && next(a);

      return (f(a)) ? t : next;
    }

    t.finalize = function() {
      next = next && next.finalize();

      return (f = null);
    };

    t.addItem = function(d) {
      if (f != d) {
        if (next) {
          next.addItem(d);
        }
        else {
          next = getNewFnc(d);
        }
      }

      return this;
    };

    return t;
  }

  var base = getNewFnc(fnc);
  fnc = function(a) {
    base = base && base(a);
  } ;

  fnc.addItem = function(d) {
    if (base) {
      base.addItem(d)
    }
    else {
      base = getNewFnc(d);
    }
  };

  fnc.finalize = function() {
    return (base = base && base.finalize());
  } ;

  return fnc;
}

function GlobalEventMonitor(eventName, functinRef) {
  var finalize, global = this;

  var monitors = { };
  var onName = ['on', ''];

  function mainMonitor(eventName, functinRef) {
    var monitor = monitors[eventName];

    if (monitor) {
      monitor(functinRef);
    }
    else {
      setEventMonitor(eventName, functinRef);
    }
  }

  function setListener(eventName, longName, fncStack) {
    global.addEventListener(eventName, fncStack, false);

    return true;
  }

  function setListener_aE(eventName, longName, fncStack) {
    global.attachEvent(longName, fncStack);

    return true;
  }

  function oldHandler(f) {
    return (function(e) {
      f(e);

      return true;
    });
  }

  function retFalse() {
    return false;
  }

  function setEventMonitor(eventName, functinRef) {
    var fncStack, longName;

    onName[1] = eventName;
    longName = onName.join('');

    function main(funcRef) {
      if (funcRef) {
        fncStack.addItem(funcRef);
        globalCheck();
      }
    }

    function globalCheck() {
      if (global[longName] != fncStack) {
        if (global[longName]) {
          fncStack.addItem(oldHandler(global[longName]));
        }
        global[longName] = fncStack;
      }
    }

    fncStack = getNewFILCFncStac(functinRef);

    if (setListener(eventName, longName, fncStack)) {
      globalCheck = retFalse;
    }
    else {
      globalCheck();
    }

    finalize.addItem(fncStack.finalize);
    monitors[eventName] = main;
    functinRef = null;
  }

  if (!global.addEventListener) {
    if (global.attachEvent) {
      setListener = setListener_aE;
    }
    else {
      setListener = retFalse;
    }
  }

  finalizeMe((finalize = getNewFILCFncStac(function() {
    finalize = monitors = null;
  } )));

  (GlobalEventMonitor = mainMonitor)(eventName, functinRef);
  functinRef = null;
}

var tableScroll = (function() {
  var global = this, finalise, tableList = { };

  var notOnScroll = true, notAbort = true;
  var overrideStyles = { margin: [{ keys: ['margin', 'marginBottom', 'marginLeft', 'marginRight', 'marginTop'],
                                    value: '0px'
  }],                  padding: [{ keys: ['padding', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingTop'],
                                   value: '0px'
  }],                  border: [{ keys: ['border', 'borderBottom', 'borderLeft', 'borderRight', 'borderTop'],
                                  value: '0px none #FFFFFF'
  },                            { keys: ['borderWidth', 'borderLeftWidth', 'borderRightWidth', 'borderBottomWidth',
                                         'borderTopWidth'],
                                  value: '0px'
  },                            { keys: ['borderStyle', 'borderRightStyle', 'borderLeftStyle', 'borderBottomStyle',
                                         'borderTopStyle'],
                                  value: 'none'
  }],                  overflow: [{ keys: ['overflow'], value: 'hidden'
  }],                  positionRel: [{ keys: ['position'], value: 'relative'
  }],                  positionAbs: [{ keys: ['position'], value: 'absolute'
  }],                  top: [{ keys: ['top'], value: '0px'
  }],                  left: [{ keys: ['left'], value: '0px'
  }],                  zIndex: [{ keys: ['zIndex'], value: 2
  }] };

  function setStyleProps(styleObj) {
    var data, dArray;

    for (var c = 1; c < arguments.length; c++) {
      if ((data = overrideStyles[arguments[c]])) {
        for (var d = data.length; d--; ) {
          dArray = data[d].keys;

          for (var e = dArray.length; e--; ) {
            styleObj[dArray[e]] = data[d].value;
          }
        }
      }
    }

    return true;
  }

  function setClass(el, val) {
    if (el.setAttribute) {
      el.setAttribute('class', val);
    }

    return (el.className = val);
  }

  function retFalse() {
    return false;
  }

  function TableScroll(id) {
    var midAbsDiv, parent, vHeaderAbsStyle, vHeaderRelStyle, hHeaderAbsStyle, hHeaderRelStyle;

    var midAbsDivStyle, midAbsinerDivStyle, inRelDivStyle, outRelDivDim;
    var lastScrollTop = NaN, lastScrollLeft = NaN, lastWidth = NaN, lastHeight = NaN, tableDim,
        table = getElementWithId(id);
    var midRelinerDivStyle, midRelinerDiv, testCellDim;

    function position() {
      var nh,                       nw,                        size,                     th, tw, cellWidth, celHeight,
          st = midAbsDiv.scrollTop, sl = midAbsDiv.scrollLeft, h = outRelDivDim(true).h, w = outRelDivDim.w;

      if ((size = ((w != lastWidth) || (h != lastHeight))) || (st != lastScrollTop) || (sl != lastScrollLeft)) {
        hHeaderRelStyle.left = (((cellWidth = (testCellDim().x - tableDim().iX)) + (lastScrollLeft
                                                                                     = sl)) * -1) + 'px'; //position

        vHeaderRelStyle.top = (((celHeight = (testCellDim.y - tableDim.iY)) + (lastScrollTop = st)) * -1) + 'px';
        if (size) {
          vHeaderRelStyle.width = vHeaderAbsStyle.width = midAbsDivStyle.left = hHeaderAbsStyle.left
            = (cellWidth + 'px');

          hHeaderRelStyle.height = hHeaderAbsStyle.height = midAbsDivStyle.top = vHeaderAbsStyle.top
            = (celHeight + 'px');
          inRelDivStyle.left = (cellWidth * -1) + 'px';
          inRelDivStyle.top = (celHeight * -1) + 'px';
          midRelinerDivStyle.width = midAbsinerDivStyle.width = ((tw = tableDim.w) - cellWidth) + 'px';
          midRelinerDivStyle.height = midAbsinerDivStyle.height = ((th = tableDim.h) - celHeight) + 'px';
          midAbsDivStyle.height = vHeaderAbsStyle.height
            = (((nh = ((lastHeight = h) - celHeight)) > celHeight) ? nh : celHeight) + 'px';
          midAbsDivStyle.width = hHeaderAbsStyle.width
            = (((nw = ((lastWidth = w) - cellWidth)) > cellWidth) ? nw : cellWidth) + 'px';
          hHeaderRelStyle.width = inRelDivStyle.width = tw + 'px';
          vHeaderRelStyle.height = inRelDivStyle.height = th + 'px';
        }
      }

      return notOnScroll;
    }

    function onScroll() {
      notOnScroll = false;

      position();
    }

    function onSize() {
      position();

      return true;
    }

    finalise.addItem(function() {
      testCellDim = midRelinerDivStyle = midRelinerDiv = midAbsinerDivStyle = tableDim = vHeaderAbsStyle
        = vHeaderRelStyle = hHeaderAbsStyle = hHeaderRelStyle = inRelDivStyle = outRelDivDim = midAbsDiv = parent
        = table = null;
    } )

    if (table && ( typeof table.scrollTop == 'number') && ( typeof table.offsetHeight == 'number') && table.tagName
      && table.appendChild && table.cloneNode && table.getAttribute && table.getElementsByTagName && (parent
                                                                                                       = table.parentNode) && parent.insertBefore)
      {
      InitializeMe(function() {
        var newTable, testCell;

        var vHeaderAbs, vHeaderRel, hHeaderAbs, hHeaderRel, outRelDiv, midAbsinerDiv, inRelDiv;

        if ((notAbort) && (testCell = table.getElementsByTagName(
                                        'td')[0]) && (newTable = table.cloneNode(
                                                                   true)) && (outRelDiv = document.createElement(
                                                                                            'DIV')) && (setClass(
                                                                                                          outRelDiv,
                                                                                                          'tableBoxOuter'))
          && (midAbsDiv
               = document.createElement(
                   'DIV')) && (midRelinerDiv = document.createElement(
                                                 'DIV')) && (midAbsinerDiv = document.createElement(
                                                                               'DIV')) && (inRelDiv
                                                                                            = document.createElement(
                                                                                                'DIV')) && (vHeaderAbs
                                                                                                             = document.createElement(
                                                                                                                 'DIV')) && (vHeaderRel = document.createElement('DIV')) && (hHeaderAbs = document.createElement('DIV'))
          && (hHeaderRel = document.createElement('DIV'))
          && (setStyleProps(outRelDiv.style,
                            'positionRel',
                            'padding')) && (midAbsDivStyle = midAbsDiv.style) && (setStyleProps(
                                                                                    midAbsDivStyle,
                                                                                    'positionAbs',
                                                                                    'padding',
                                                                                    'margin',
                                                                                    'border',
                                                                                    'zIndex')) && (midRelinerDivStyle
                                                                                                    = midRelinerDiv.style)
          && (setStyleProps(midRelinerDivStyle,
                            'positionRel',
                            'padding',
                            'margin',
                            'border',
                            'top',
                            'left')) && (midAbsinerDivStyle = midAbsinerDiv.style) && (setStyleProps(
                                                                                         midAbsinerDivStyle,
                                                                                         'positionAbs',
                                                                                         'overflow',
                                                                                         'padding',
                                                                                         'margin',
                                                                                         'border',
                                                                                         'top',
                                                                                         'left')) && (inRelDivStyle
                                                                                                       = inRelDiv.style)
          && (setStyleProps(inRelDivStyle,
                            'positionRel',
                            'padding',
                            'margin',
                            'border',
                            'top',
                            'left')) && (vHeaderAbsStyle = vHeaderAbs.style) && (setStyleProps(
                                                                                   vHeaderAbsStyle,
                                                                                   'positionAbs',
                                                                                   'overflow',
                                                                                   'padding',
                                                                                   'margin',
                                                                                   'border',
                                                                                   'top',
                                                                                   'left',
                                                                                   'zIndex')) && (vHeaderRelStyle
                                                                                                   = vHeaderRel.style)
          && (setStyleProps(vHeaderRelStyle,
                            'positionRel',
                            'padding',
                            'margin',
                            'border',
                            'top',
                            'left')) && (hHeaderAbsStyle = hHeaderAbs.style) && (setStyleProps(
                                                                                   hHeaderAbsStyle,
                                                                                   'positionAbs',
                                                                                   'overflow',
                                                                                   'padding',
                                                                                   'margin',
                                                                                   'border',
                                                                                   'top',
                                                                                   'left',
                                                                                   'zIndex')) && (hHeaderRelStyle
                                                                                                   = hHeaderRel.style)
          && (setStyleProps(hHeaderRelStyle,
                            'positionRel',
                            'padding',
                            'margin',
                            'border',
                            'top',
                            'left')) && (setStyleProps(table.style,
                                                       'margin')) && (midAbsDiv.appendChild(midRelinerDiv))
          && (midRelinerDiv.appendChild(midAbsinerDiv)) && (midAbsinerDiv.appendChild(
                                                              inRelDiv)) && (outRelDiv.appendChild(
                                                                               midAbsDiv)) && (vHeaderAbs.appendChild(
                                                                                                 vHeaderRel))
          && (hHeaderAbs.appendChild(
                hHeaderRel)) && (outRelDiv.appendChild(
                                   vHeaderAbs)) && (outRelDiv.appendChild(
                                                      hHeaderAbs)) && (parent.insertBefore(outRelDiv,
                                                                                           table)) && (!isNaN(
                                                                                                          (outRelDivDim
                                                                                                            = getSimpleExtPxIn(
                                                                                                                outRelDiv)).w)) && (inRelDiv.appendChild(table)) && (!isNaN((testCellDim = getSimpleExtPxIn(testCell)).w)) && (!isNaN((tableDim = getSimpleExtPxIn(table)).w)) && (hHeaderRel.appendChild(newTable))
          && (newTable = table.cloneNode(true)) && (vHeaderRel.appendChild(newTable))) {
          midAbsDivStyle.overflow = 'scroll';

          if (midAbsDiv.addEventListener) {
            midAbsDiv.addEventListener('scroll', onScroll, false);
          }
          else if (midAbsDiv.attachEvent) {
            midAbsDiv.attachEvent('onscroll', onScroll);
          }
          else {
            midAbsDiv.onscroll = onScroll;
          }

          GlobalEventMonitor('resize', onSize);
          position();
          TimedQue(position);
        }
        else {
          notAbort = false;
        }
      });
    }
    else {
      notAbort = false;
    }

    return true;
  }

  function main() {
    var id;

    for (var c = 0; c < arguments.length; c++) {
      id = arguments[c];

      if (notAbort && !tableList[id]) {
        tableList[id] = TableScroll(id);
      }
    }
  }

  if ((!global.queryStrings || !queryStrings['noTableScroll']) && global.setTimeout && global.document
    && document.createElement) {
    finalizeMe((finalise = getNewFILCFncStac(function() {
      finalise = tableList = null;
    } )));
    return main;
  }
  else {
    return retFalse;
  }
})();
