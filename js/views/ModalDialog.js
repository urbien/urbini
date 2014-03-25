define('views/ModalDialog', ['domUtils'], function(DOM) {
  
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

  container.className = container.className.replace( /\s+$/gi, '' ) + ' modal-ready';

  // Deactivate on ESC
  function onDocumentKeyUp( event ) {
    if (dismisible && event.keyCode === 27 ) {
      hide();
    }
  }

  // Deactivate on click outside
  function onDocumentClick( event ) {
    if (dismissible) {
      if (!cover || event.target === cover || event.target.contains(cover) ) {
        hide();
      }
    }
  }

  function activate( state ) {
    document.addEventListener( 'keyup', onDocumentKeyUp, false );
    document.addEventListener( 'click', onDocumentClick, false );
    document.addEventListener( 'touchstart', onDocumentClick, false );

    if (currentState)
      popup.$removeClass(currentState);
    
    popup.$addClass('no-transition');
    if (state)
      popup.$addClass(popup, state);

    window._setTimeout( function() {
//      removeClass( popup, 'no-transition' );
//      addClass( container, 'modal-active' );
      popup.$removeClass('no-transition');
      container.$addClass('modal-active');
    }, 0 );

    currentState = state;
  }

  function deactivate() {
    document.removeEventListener( 'keyup', onDocumentKeyUp, false );
    document.removeEventListener( 'click', onDocumentClick, false );
    document.removeEventListener( 'touchstart', onDocumentClick, false );

    if (container)
      container.$removeClass('modal-active');
    if (popup)
      popup.$removeClass('modal-popup-animate');
  }

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
    disimissible = true;
    deactivate();
    for (var i = 0; i < hideCallbacks.length; i++) {
      hideCallbacks[i]();
    }
  }

  return {
    activate: activate,
    deactivate: deactivate,
    show: show,
    hide: hide
  }
});