(function(window) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };

	var i = 0, 
		started,
		$prev, 
		$page, 
		$next,
		$wnd = $(window),
		cssIndentityTransform = 'matrix(1, 0, 0, 1, 0, 0)',
		identityMatrix,
		vendorPrefixes = ['', '-moz-', '-ms-', '-o-', '-webkit-'],
		transitions = {
			none: {
	      tween: {
  				fromPageTransition: function() {
  					return identity();
  					//return identityTransition(); // reuse
  				},
  				toPageBeforeTransition: function() {
  					return identity();
  					//return identityTransition();
  				}
	      },
	      css: {
          fromPageTransition: function() {
            return cssIndentityTransform;
          },
          toPageBeforeTransition: function() {
            return cssIndentityTransform;
          }	        
	      }
			},
			left: {
				tween: {
  			  fromPageTransition: function() {
  					return translation(-$wnd.width());
  				},
  				toPageBeforeTransition: function(to) {
  					return translation($wnd.width());
  				}
			  },
			  css: {
          fromPageTransition: function() {
            return 'translateX({0}px)'.format(-$wnd.width());
          },
          toPageBeforeTransition: function(to) {
            return 'translateX({0}px)'.format($wnd.width());
          }			    
			  }
			},
			right: {
			  tween: {
  				fromPageTransition: function() {
  					return translation($wnd.width());
  				},
  				toPageBeforeTransition: function() {
  					return translation(-$wnd.width());
  				}
			  },
        css: {
          fromPageTransition: function() {
            return 'translateX({0}px)'.format($wnd.width());
          },
          toPageBeforeTransition: function(to) {
            return 'translateX({0}px)'.format(-$wnd.width());
          }         
        }
			},
			up: {
			  tween: {
  				fromPageTransition: function() {
  					return translation(0, -$wnd.height());
  				},
  				toPageBeforeTransition: function() {
  					return translation(0, window.innerHeight + window.scrollY);
  				}
			  },
        css: {
          fromPageTransition: function() {
            return 'translateY({0}px)'.format(-$wnd.height());
          },
          toPageBeforeTransition: function(to) {
            return 'translateY({0}px)'.format($wnd.height());
          }         
        }
			},
			down: {
			  tween: {
  				fromPageTransition: function() {
  					return translation(0, $wnd.height());
  				},
  				toPageBeforeTransition: function() {
  					return translation(0, -$wnd.height());
  				}
			  },
        css: {
          fromPageTransition: function() {
            return 'translateY({0}px)'.format($wnd.height());
          },
          toPageBeforeTransition: function(to) {
            return 'translateY({0}px)'.format(-$wnd.height());
          }         
        }
			},
			zoomIn: {
			  tween: {
  				fromPageTransition: function() {
  					return identity();
  				},
  				toPageBeforeTransition: function() {
  					return scale(0, 0);
  				}
			  },
        css: {
          fromPageTransition: function() {
            return cssIndentityTransform;
          },
          toPageBeforeTransition: function(to) {
            return 'matrix(0, 0, 0, 0, 0, 0)';
          }         
        }
			},
			downLeft: {
			  tween: {
  				fromPageTransition: function() {
  					return transitions.upRight.tween.toPageBeforeTransition();
  				},
  				toPageBeforeTransition: function() {
  					return translation($wnd.width(), -$wnd.height());
  				}
			  },
        css: {
          fromPageTransition: function() {
            return transitions.upRight.css.toPageBeforeTransition();
          },
          toPageBeforeTransition: function() {
            return 'translate({0}px, {1}px)'.format($wnd.width(), -$wnd.height());
          }
        }
			},
			downRight: {
			  tween: {
  				fromPageTransition: function() {
  					return transitions.upLeft.tween.toPageBeforeTransition();
  				},
  				toPageBeforeTransition: function() {
  					return translation(-$wnd.width(), -$wnd.height());
  				}
			  },
			  css: {
          fromPageTransition: function() {
            return transitions.upLeft.css.toPageBeforeTransition();
          },
          toPageBeforeTransition: function() {
            return 'translate({0}px, {1}px)'.format(-$wnd.width(), -$wnd.height());
          }			    
			  }
			},
			upLeft: {
			  tween: {
  				fromPageTransition: function() {
  					return transitions.downRight.tween.toPageBeforeTransition();
  				},
  				toPageBeforeTransition: function() {
  					return translation($wnd.width(), $wnd.height());
  				}					
        },
        css: {
          fromPageTransition: function() {
            return transitions.downRight.css.toPageBeforeTransition();
          },
          toPageBeforeTransition: function() {
            return 'translate({0}px, {1}px)'.format($wnd.width(), $wnd.height());
          }         
        }
			},
			upRight: {
			  tween: {
  				fromPageTransition: function() {
  					return transitions.downLeft.tween.toPageBeforeTransition();
  				},
  				toPageBeforeTransition: function() {
  					return translation(-$wnd.width(), $wnd.height());
  				}					
        },
        css: {
          fromPageTransition: function() {
            return transitions.downLeft.css.toPageBeforeTransition();
          },
          toPageBeforeTransition: function() {
            return 'translate({0}px, {1}px)'.format(-$wnd.width(), $wnd.height());
          }         
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

  function setStylePropertyValues(style, propMap) {
    for (var prop in propMap) {
      var value = propMap[prop];
      for (var i = 0; i < vendorPrefixes.length; i++) {
        style[vendorPrefixes[i] + prop] = value;
      }
    }
  }

	function Transition() {
		this._sequence = [];
		return this;
	};

	Transition.prototype.add = function(transform, duration, ease) {
		this._sequence.push({
			transform: transform,
			duration: duration,
			ease: ease
		});
		
		return this;
	};

	Transition.prototype.clone = function() {
		var trans = new Transition();
		for (var i = 0, length = this._sequence.length; i < length; i++) {
			var step = this._sequence[i];
			trans.add(transform.dup(), step.duration, step.ease);
		}
		
		return trans;
	};

	Transition.prototype.run = function(element, override) {
		var tween = createjs.get(this._el, {override: override});
		for (var i = 0, length = this._sequence.length; i < length; i++) {
			var step = this._sequence[i];
			if (step.transform) {
				tween.to({
					transform: step.transform.elements
				}, step.duration, step.ease);
			}
			else
				tween.wait(step.duration);
		}
		
		return tween;
	};
	
	var defaults = {
	  tween: {
    	defaultToPageTransition: function(to) {
    		return identity();
    	}
	  },
	  css : {
      defaultToPageTransition: function(to) {
        return cssIndentityTransform;
      }	    
	  }
	}

	for (var name in transitions) {
		var trans = transitions[name];
		for (var type in trans) {
		  var transForType = trans[type];
  		if (!transForType.toPageTransition)
  			transForType.toPageTransition = defaults[type].defaultToPageTransition;
		}
	}

	if (window.createjs) {
    createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
    if (createjs.Matrix3DPlugin)
      createjs.Matrix3DPlugin.install(createjs.Tween);
  //    cssTweener.install(createjs.Tween);         
	}
	
	if (window.Matrix) {
    Matrix.prototype.scale = function() {
      if (!this.isSquare())
        throw "only a square matrix can be scaled uniformly";
        
      var rows = this.rows(),
        m = Matrix.Zero(rows, rows),
        elements = m.elements;
        
      for (var i = 0; i < rows; i++) {
        m.elements[i][i] = arguments[i] || 1;
      }
      
      return this.multiply(m);
    };
	}
	
//	cssTweener = createjs.CSSPlugin;

	function translation(x, y, z) {
		var i = identity(true);
		i.elements[3] = [x || 0, y || 0, z || 0, 1];
		return i;
	}

	function translate(matrix, x, y, z) {
		return matrix.x(translation(x, y, z));
	}

	var doTransition = {
	  tween: function(from, to, transition, ease, duration, doTween) {
	    if (typeof transition == 'string')
	      transition = transitions[transition].tween;
	    
  		duration = duration || 1000;
  		ease = ease || createjs.Ease.sineInOut;
  		
  		var complete = false,
  		    type = doTween ? 'tween' : 'css';
  			
  		function onComplete() {
  			if (!complete) {
  				complete = true;
  				if (from)
  					$(from).removeClass('ui-page-active');
  			}
  		}
  
  		$(to).addClass('ui-page-active');
  		transform(to, transition.toPageBeforeTransition(to));
  		if (from)
  			transform(from, transition.fromPageTransition(), duration, ease).call(onComplete);
  
		  transform(to, transition.toPageTransition(to), duration, ease);
  		
  		if (!from)
  			onComplete();
	  },
	  css: function(from, to, transition, ease, duration) {
	    var dfd = $.Deferred();
      if (typeof transition == 'string')
        transition = transitions[transition].css;
      
      duration = typeof duration == 'number' ? duration : 1000;
      ease = 'all {0}ms {1}'.format(duration, ease || 'ease-in-out');
      setStylePropertyValues(to.style, {
        transform: transition.toPageBeforeTransition(to)
      });
      
      $(to).addClass('ui-page-active');
      if (from) {
        setStylePropertyValues(from.style, {
          transition: ease,
          transform: transition.fromPageTransition()
        });
      }
      
      setStylePropertyValues(to.style, {
        transition: ease,
        transform: transition.toPageTransition(to)
      });
      
      if (!from)
        dfd.resolve();
      else
        setTimeout(dfd.resolve.bind(dfd), duration);
      
      return dfd.promise();
	  }
	}

	function position(what, where) {
		var matrix = identity(true);
		for (var i = 0; i < arguments.length; i++) {
			matrix.elements[3][i] = arguments[i];
		}
		
		return matrix;
	}

	function scale(/*x, y, z*/) {
		var matrix = identity(true);
		for (var i = 0; i < arguments.length; i++) {
			matrix.elements[i][i] = arguments[i];
		}
		
		return matrix;
	}

	function skew(/*x, y, z*/) {
		var x = Math.tan(arguments[0] || 0),
			y = Math.tan(arguments[1] || 0),
			z = Math.tan(arguments[2] || 0);
			
		return $M([
		  [1, y, z, 0],
		  [x, 1, z, 0],
		  [x, y, 1, 0],
		  [0, 0, 0, 1]
		]);
	}

	function identity(newCopy) {
	  return newCopy ? Matrix.I(4) : identityMatrix || (identityMatrix = Matrix.I(4));
	}
	
	function setTransform(el, matrix) {
		setStylePropertyValues(el.style, {
		  transform: createjs.Matrix3DPlugin.toMatrix3DString(matrix)
		});
	}

	function transform(el, matrix, speed, ease) {
		matrix = matrix.elements || matrix;
		if (!speed) {
			setTransform(el, matrix);
			return;
		}
		
		return createjs.Tween.get(el).to({
			transform: matrix
		}, speed, ease);
	}

	function identityTransition(el) {
		return new Transition(el);
	};
	
	window.transitions = transitions;
	window.transition = doTransition;
})(window);