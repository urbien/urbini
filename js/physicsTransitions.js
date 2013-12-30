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
  
  function doTransition(direction, transition, fromView, toView, springStiffness, springDamping) {
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
        fromView.el.style['z-index'] = 999;
    }
    
    if (from) {
      toView.el.style.opacity = 0;
      var dfd = $.Deferred();
      toView.onload(function() {
        Physics.disableDrag();
//        G.disableClick();
        if (transition == 'snap') {
          Physics.there.chain({
              method: 'teleport' + fromDir.capitalizeFirst(), 
              args: [to, fromDir]
            },
            {
              method: 'snap', 
  //            args: [from, toDir, 0.5, 0.995, finish]
              args: [from, toDir, springStiffness, springDamping, finish]
            },
            {
              method: 'snap', 
  //            args: [to, 'center', 0.8, 0.995, finish]
              args: [to, 'center', springStiffness, springDamping, finish]
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
              args: [from, 1, finish]
            },
            {
              method: 'flyCenter', 
              args: [to, 2, finish]
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
          if (++finished == 2) {
            Physics.enableDrag();
//            G.enableClick();
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