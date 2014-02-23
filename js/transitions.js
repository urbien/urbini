define('transitions', ['globals', 'utils', 'domUtils', 'lib/fastdom', 'physicsBridge'], function(G, U, DOM, Q, Physics) {  
  var identityMatrix;
  var vendorPrefixes = ['', '-moz-', '-ms-', '-o-', '-webkit-'];
  var cssNoTranslation = DOM.positionToMatrix3DString(0, 0);
  var transitions = {
		none: {
      fromPageTransition: function(fromView) {
        return cssNoTranslation;
      },
      toPageBeforeTransition: function(toView) {
        return cssNoTranslation;
      }	        
		},
		left: {
      fromPageTransition: function(fromView) {
        return adjustTranslation(fromView, -G.viewport.width);
      },
      toPageBeforeTransition: function(toView) {
        return adjustTranslation(toView, G.viewport.width);
      }			    
		},
		right: {
      fromPageTransition: function(fromView) {
        return adjustTranslation(fromView, G.viewport.width);
      },
      toPageBeforeTransition: function(toView) {
        return adjustTranslation(toView, -G.viewport.width);
      }         
		},
		up: {
      fromPageTransition: function(fromView) {
        return adjustTranslation(fromView, 0, -G.viewport.height);
      },
      toPageBeforeTransition: function(toView) {
        return adjustTranslation(toView, 0, G.viewport.height);
      }         
		},
		down: {
      fromPageTransition: function(fromView) {
        var viewport = G.viewport;
        return adjustTranslation(fromView, 0, viewport.height);
      },
      toPageBeforeTransition: function(toView) {
        var viewport = G.viewport;
        return adjustTranslation(toView, 0, -viewport.height);
      }         
		},
//		zoomIn: {
//      fromPageTransition: function(fromView) {
//        return cssNoTranslation;
//      },
//      toPageBeforeTransition: function(toView) {
//        return 'matrix(0, 0, 0, 0, 0, 0)';
//      }         
//		},
		downLeft: {
      fromPageTransition: function(fromView) {
        return transitions.upRight.css.toPageBeforeTransition(fromView);
      },
      toPageBeforeTransition: function(toView) {
        var viewport = G.viewport;
        return adjustTranslation(toView, viewport.width, -viewport.height);
      }
		},
		downRight: {
      fromPageTransition: function(fromView) {
        return transitions.upLeft.css.toPageBeforeTransition(fromView);
      },
      toPageBeforeTransition: function(toView) {
        var viewport = G.viewport;
        return adjustTranslation(toView, -viewport.width, -viewport.height);
      }			    
		},
		upLeft: {
      fromPageTransition: function(fromView) {
        return transitions.downRight.css.toPageBeforeTransition(fromView);
      },
      toPageBeforeTransition: function(toView) {
        var viewport = G.viewport;
        return adjustTranslation(toView, viewport.width, viewport.height);
      }         
		},
		upRight: {
      fromPageTransition: function(fromView) {
        return transitions.downLeft.css.toPageBeforeTransition(fromView);
      },
      toPageBeforeTransition: function(toView) {
        var viewport = G.viewport;
        return adjustTranslation(toView, -viewport.width, viewport.height);
      }
		}
		/*,
		skewRight: {
			fromPageTransition: function(fromView) {
				return transitions.right.fromPageTransition();
			},
			toPageBeforeTransition: function(toView) {
				return transitions.right.toPageBeforeTransition();
			}
		},*/

	};
	
	function adjustTranslation(view, x, y) {
//  	var pos = view._getScrollPosition(),
//  	    currentX = pos && pos.X || 0,
//        currentY = pos && pos.Y || 0;
//        
//	  return DOM.getTranslationString(currentX + (x || 0), currentY + (y || 0));
	  return DOM.positionToMatrix3DString(x || 0, y || 0);
	}
	
  function defaultToPageTransition(view) {
    return adjustTranslation(view, 0, 0);
  }     

  for (var name in transitions) {
    var trans = transitions[name];
    if (!trans.toPageTransition)
      trans.toPageTransition = defaultToPageTransition;
  }

	function doTransition(transition, fromView, toView, ease, duration) {
    var dfd = $.Deferred(),
        promise = dfd.promise(),
        canceled = false,
        transitionTimeout,
        from = fromView && fromView.el,
        to = toView && toView.el,
        $from = fromView && fromView.$el,
        $to = toView && toView.$el,
        isJQM = G.isJQM();

    duration = typeof duration == 'number' ? duration : 600;
    ease = 'all {0}ms {1}'.format(duration, ease || 'linear');
    if ($from)
      $from.trigger('page_beforehide');
      
    $to.trigger('page_beforeshow');
    Q.write(function() {
      if (fromView) {
        DOM.setTransform(to, transition.toPageBeforeTransition(toView), '');
      }
      
      if (isJQM) {
        to.classList.add('ui-page-active');
        $to.page();
      }
    });
      
    Q.defer(1, 'write', function() {
      if (from) {
        console.log("FROM PAGE:", $from.width());
        DOM.setTransform(from, transition.fromPageTransition(fromView), ease);
      }
    
//      console.log("TO PAGE:", $to.width());
      DOM.setTransform(to, transition.toPageTransition(toView), ease);
      if (isJQM)
        $to.trigger('create');
      
      if (!duration)
        dfd.resolve();
      else
        transitionTimeout = setTimeout(dfd.resolve, duration);
    });
        
    promise.cancel = function() {
      canceled = true;
      if (transitionTimeout)
        clearTimeout(transitionTimeout);
      
      dfd.reject();
      // reverse transition?
    };
    
    promise.done(function() {
      Q.waitOne().done(function() {
        if (from) {
          from.dispatchEvent(new Event('page_hide'));
//          $from.trigger('page_hide');
        }
                  
//        $to.trigger('page_show');
        to.dispatchEvent(new Event('page_show'));
      });
    });
    
    return promise;
  }

	var Transitioner = {};
	for (var name in transitions) {
	  Transitioner[name] = doTransition.bind(null, transitions[name]);
	}
	
	return Transitioner;
});