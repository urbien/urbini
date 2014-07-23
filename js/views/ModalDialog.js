define('views/ModalDialog', ['domUtils', 'events'], function(DOM, Events) {
  
/*!
 * modal 0.1
 * http://lab.hakim.se/modal
 * MIT licensed
 *
 * Copyright (C) 2012 Hakim El Hattab, http://hakim.se
 */
  var container = document.documentElement,
      popup = document.querySelector( '.modal-popup-animate' ),
      cover = document.querySelector( '.modal-cover' ),
      currentState = null,
      dismissible = true,
      hideCallbacks = [];
//          ,
//      emptyTimeout;

  container.className = container.className.replace( /\s+$/gi, '' ) + ' modal-ready';

  // Deactivate on ESC
  function onDocumentKeyUp( event ) {
    if (dismissible && event.keyCode === 27 ) {
      hide();
    }
  }

  // Deactivate on click outside
  function onDocumentClick( event ) {
    if (dismissible) {
      if (!cover || event.target === cover || event.target.contains(cover) || !popup || (popup != event.target && !popup.contains(event.target))) {
        hide();
      }
    }
  }

  function activate( state ) {
//    clearTimeout(emptyTimeout);
    listen(true);
    if (currentState)
      popup.$removeClass(currentState);
    
    popup.$addClass('no-transition');
    if (state)
      popup.$addClass(popup, state);

    setTimeout( function() {
//      removeClass( popup, 'no-transition' );
//      addClass( container, 'modal-active' );
      popup.$removeClass('no-transition');
      container.$addClass('modal-active');
    }, 1);

    currentState = state;
  }

  function listen(attach) {
    var method = attach ? 'addEventListener' : 'removeEventListener';
    document[method]( 'tap', onDocumentClick, false );
    document[method]( 'keyup', onDocumentKeyUp, false );
//    document[method]( 'click', onDocumentClick, false );
//    document[method]( 'touchstart', onDocumentClick, false );
  };
  
  function deactivate() {
    listen(true);
    if (container)
      container.$removeClass('modal-active');
    
    if (popup) {
      popup.$removeClass('modal-popup-animate');
      popup.$('audio,video,iframe,object,embed').$forEach(function(a) {
        a.pause && a.pause();
        delete(a); // @sparkey reports that this did the trick!
        a.$remove();
      });
      
//      emptyTimeout = setTimeout(emptyPopup, 300);
    }
  }

//  function emptyPopup() {
//    clearTimeout(emptyTimeout);
//    popup.$empty();
//  }
//  
//  function addClass( element, name ) {
//    element.className = element.className.replace( /\s+$/gi, '' ) + ' ' + name;
//  }
//
//  function removeClass( element, name ) {
//    element.className = element.className.replace( name, '' );
//  }

  function show(selector, onhide, indismissible) {
    dismissible = !indismissible;
    if (typeof selector == 'string')
      popup = document.querySelector( selector );
    else
      popup = selector;
    
    hideCallbacks.length = 0;
    if (onhide)
      hideCallbacks.push(onhide);
    else
      hideCallbacks.push(deactivate);
    
    popup.$addClass('modal-popup-animate');
    activate();
    return this;
  }
  
  function hide() {
    dismissible = true;
    deactivate();
    for (var i = 0; i < hideCallbacks.length; i++) {
      hideCallbacks[i]();
    }
    
    hideCallbacks.length = 0;
  }

  Events.on('pageChange', hide);
  
  return window.ModalDialog = {
    activate: activate,
    deactivate: deactivate,
    show: show,
    hide: hide
  }
});