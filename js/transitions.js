define('transitions', ['globals', 'utils', 'lib/fastdom'], function(G, U, Q) {  
  var cssIndentityTransform = 'matrix(1, 0, 0, 1, 0, 0)';
  var cssNoTranslation = 'translate(0px, 0px) translateZ(0px)';
  var identityMatrix;
  var vendorPrefixes = ['', '-moz-', '-ms-', '-o-', '-webkit-'];
  var CSS = U.CSS;
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
  	var pos = view._getScrollPosition(),
  	    currentX = pos && pos.X || 0,
        currentY = pos && pos.Y || 0;
        
	  return CSS.getTranslationString(currentX + (x || 0), currentY + (y || 0));
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
        CSS.setStylePropertyValues(to.style, {
          transform: transition.toPageBeforeTransition(toView),
          transition: null
        });
      }
      
      if (isJQM)
        $to.addClass('ui-page-active').page();
    });
      
    Q.defer(1, 'write', function() {
      if (from) {
        console.log("FROM PAGE:", $from.width());
        CSS.setStylePropertyValues(from.style, {
          transition: ease,
          transform: transition.fromPageTransition(fromView)
        });        
      }
    
      console.log("TO PAGE:", $to.width());
      CSS.setStylePropertyValues(to.style, {
        transition: ease,
        transform: transition.toPageTransition(toView)
      });
      
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
      Q.nextFramePromise().done(function() {
        if (from)      
          $from.trigger('page_hide');
                  
        $to.trigger('page_show');
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