define('physicsTransitions', ['globals', 'utils', 'domUtils', 'lib/fastdom', 'physicsBridge'], function(G, U, DOM, Q, Physics) {
  var _oppositeDir = {
    left: 'right',
    right: 'left',
    up: 'down',
    down: 'up'
  };
  
  function getOppositeDir(dir) {
    return _oppositeDir[dir]; 
  }
  
  function doTransition(direction, transition, fromView, toView, options) {//, springStiffness, springDamping) {
    var dfd = $.Deferred(),
        promise = dfd.promise(),
        from = fromView && fromView.getContainerBodyId(),
        to = toView.getContainerBodyId(),
        $from = fromView && fromView.$el,
        $to = toView && toView.$el,
        isJQM = G.isJQM(),
        toDir = direction,
        fromDir = getOppositeDir(direction),
        finished = 0;

    if ($from)
      $from.trigger('page_beforehide');
      
    $to.trigger('page_beforeshow');
    function switchRoles() {
      toView.el.style.opacity = 1;
      toView.el.style['z-index'] = 1000;
      if (fromView)
        fromView.el.style['z-index'] = 1;
    }
    
    if (from) {
      var dfd = $.Deferred(),
          numCallbacks = 2;
      
      toView.onload(function() {
        Physics.disableDrag();
//        G.disableClick();
        if (options.via) {
          var bodyId = options.via.getBodyId(),
              mason = options.via.parentView.mason,
              time = 1000;
          
          numCallbacks = 1;
          Physics.there.chain(
//            {
//              method: 'teleport', 
//              args: [bodyId, null, null, 1]
//            },
            {
              object: mason.id,
              method: 'saveState' 
            },
            {
              object: mason.id,
              method: 'isolate',
              args: [bodyId, 'pop']
            },            
//            {
//              object: mason.id,
//              method: 'flyToTopCenter',
//              args: [bodyId, 3, null, function() {
//                Physics.there.rpc(null, 'opacity', [to, Physics.constants.maxOpacity, time, finish]);
//              }]
//            },
            {
              object: mason.id,
              method: 'center',
              args: [bodyId, 500, function() {
                Physics.there.rpc(null, 'opacity', [to, Physics.constants.maxOpacity, time, finish]);
              }]
            },
//            {
//              object: mason.id,
//              method: 'maximize', 
//              args: [bodyId, time, finish]
//            },
            {
              method: 'opacity', 
              args: [to, 0, 0]
            },
            {
              method: 'teleportCenterX', 
              args: [to]
            }
          );
        }
        else if (transition == 'snap') {
          Physics.there.chain({
              method: 'teleport' + fromDir.capitalizeFirst(), 
              args: [to, fromDir]
            },
            {
              method: 'snap', 
  //            args: [from, toDir, 0.5, 0.995, finish]
              args: [from, toDir, options.springStiffness, options.springDamping, finish]
            },
            {
              method: 'snap', 
  //            args: [to, 'center', 0.8, 0.995, finish]
              args: [to, 'center', options.springStiffness, options.springDamping, finish]
            }
          );
        }
        else if (transition == 'slide') {
          Physics.there.chain({
              method: 'teleport' + fromDir.capitalizeFirst(), 
              args: [to, fromDir]
            },
            {
              method: 'fly' + toDir.capitalizeFirst(), 
              args: [from, 1, 0, finish]
            },
            {
              method: 'flyCenter', 
              args: [to, 2, Physics.constants.maxOpacity, finish]
            }
          );
        }
        
        Physics.echo(function() {
          Physics.here.once('render', toView.getContainerBodyId(), switchRoles);
        });
        
//        Physics.there.rpc(null, 'teleport' + fromDir.capitalizeFirst(), [to, fromDir]); // teleportLeft, teleportRight, etc.
//        Physics.there.rpc(null, 'snap', [from, toDir, springStiffness, springDamping, finish]);
//        Physics.there.rpc(null, 'snap', [to, 'center', springStiffness, springDamping, finish]);
        
        function finish() {
          if (++finished >= numCallbacks) {
            Physics.enableDrag();
//            G.enableClick();
            
            if (fromView) {
              fromView.turnOffPhysics();
              Q.write(function() {
                $from.trigger('page_hide');
                fromView.el.style.opacity = 0;
              });
              
              if (options.via)
                Physics.there.rpc(mason.id, 'loadState');
            }
            
            $to.trigger('page_show');
            dfd.resolve();
          }
        };
      });
    }
    else {
      Q.write(function() {
        switchRoles();
        dfd.resolve();
      });
    }
    
    return dfd.promise();
  }

  return {
    transition: doTransition
  }
});