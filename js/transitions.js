define('transitions', ['globals', 'utils'], function(G, U) {  
  var cssIndentityTransform = 'matrix(1, 0, 0, 1, 0, 0)';
  var identityMatrix;
  var vendorPrefixes = ['', '-moz-', '-ms-', '-o-', '-webkit-'];
  var CSS = U.CSS;
  var transitions = {
		none: {
      fromPageTransition: function() {
        return cssIndentityTransform;
      },
      toPageBeforeTransition: function() {
        return cssIndentityTransform;
      }	        
		},
		left: {
      fromPageTransition: function() {
        return CSS.getTranslationString(-G.viewport.X);
      },
      toPageBeforeTransition: function(to) {
        return CSS.getTranslationString(G.viewport.X);
      }			    
		},
		right: {
      fromPageTransition: function() {
        return CSS.getTranslationString(G.viewport.X);
      },
      toPageBeforeTransition: function(to) {
        return CSS.getTranslationString(-G.viewport.X);
      }         
		},
		up: {
      fromPageTransition: function() {
        var viewport = G.viewport;
        return CSS.getTranslationString(0, -viewport.Y);
      },
      toPageBeforeTransition: function(to) {
        var viewport = G.viewport;
        return CSS.getTranslationString(0, viewport.Y);
      }         
		},
		down: {
      fromPageTransition: function() {
        var viewport = G.viewport;
        return CSS.getTranslationString(0, viewport.Y);
      },
      toPageBeforeTransition: function(to) {
        var viewport = G.viewport;
        return CSS.getTranslationString(0, -viewport.Y);
      }         
		},
		zoomIn: {
      fromPageTransition: function() {
        return cssIndentityTransform;
      },
      toPageBeforeTransition: function(to) {
        return 'matrix(0, 0, 0, 0, 0, 0)';
      }         
		},
		downLeft: {
      fromPageTransition: function() {
        return transitions.upRight.css.toPageBeforeTransition();
      },
      toPageBeforeTransition: function() {
        var viewport = G.viewport;
        return CSS.getTranslationString(viewport.X, -viewport.Y);
      }
		},
		downRight: {
      fromPageTransition: function() {
        return transitions.upLeft.css.toPageBeforeTransition();
      },
      toPageBeforeTransition: function() {
        var viewport = G.viewport;
        return CSS.getTranslationString(-viewport.X, -viewport.Y);
      }			    
		},
		upLeft: {
      fromPageTransition: function() {
        return transitions.downRight.css.toPageBeforeTransition();
      },
      toPageBeforeTransition: function() {
        var viewport = G.viewport;
        return CSS.getTranslationString(viewport.X, viewport.Y);
      }         
		},
		upRight: {
      fromPageTransition: function() {
        return transitions.downLeft.css.toPageBeforeTransition();
      },
      toPageBeforeTransition: function() {
        var viewport = G.viewport;
        return CSS.getTranslationString(-viewport.X, viewport.Y);
      }
		}
		/*,
		skewRight: {
			fromPageTransition: function() {
				return transitions.right.fromPageTransition();
			},
			toPageBeforeTransition: function() {
				return transitions.right.toPageBeforeTransition();
			}
		},*/

	};
	
  function defaultToPageTransition(to) {
    return cssIndentityTransform;
  }     

  for (var name in transitions) {
    var trans = transitions[name];
    if (!trans.toPageTransition)
      trans.toPageTransition = defaultToPageTransition;
  }

	function doTransition(transition, from, to, ease, duration) {
    var dfd = $.Deferred();
    duration = typeof duration == 'number' ? duration : 1000;
    ease = 'all {0}ms {1}'.format(duration, ease || '');
    
    CSS.setStylePropertyValues(to.style, {
      transform: transition.toPageBeforeTransition(to)
    });
    
    if (from) {
      CSS.setStylePropertyValues(from.style, {
        transition: ease,
        transform: transition.fromPageTransition()
      });
    }
    
    CSS.setStylePropertyValues(to.style, {
      transition: ease,
      transform: transition.toPageTransition(to)
    });
    
    if (!from)
      dfd.resolve();
    else
      setTimeout(dfd.resolve.bind(dfd), duration);
    
    return dfd.promise();
  }

	var Transitioner = {};
	for (var name in transitions) {
	  Transitioner[name] = doTransition.bind(null, transitions[name]);
	}
	
	return Transitioner;
});