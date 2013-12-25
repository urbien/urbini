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
  
  function doTransition(transition, fromView, toView, springStiffness, springDamping) {
    var dfd = $.Deferred(),
        promise = dfd.promise(),
        from = fromView && fromView.getBodyContainerId(),
        to = toView.getBodyContainerId(),
        $from = fromView && fromView.$el,
        $to = toView && toView.$el,
        isJQM = G.isJQM(),
        toDir = transition,
        fromDir = getOppositeDir(transition);

    if ($from)
      $from.trigger('page_beforehide');
      
    $to.trigger('page_beforeshow');
    toView.el.style.opacity = 1;
    if (from) {
      var dfd = $.Deferred();
      toView.onload(function() {
        Physics.disableDrag();
        Physics.there.rpc(null, 'teleport' + fromDir.capitalizeFirst(), [to, fromDir]); // teleportLeft, teleportRight, etc.
        Physics.there.rpc(null, 'snap', [from, toDir, springStiffness, springDamping, finish]);
        Physics.there.rpc(null, 'snap', [to, 'center', springStiffness, springDamping, finish]);
        
        function finish() {
          if (dfd.state() != 'resolved') {
            Physics.enableDrag();
            if (fromView)
              fromView.el.style.opacity = 0;
            
            dfd.resolve();
          }
        };
      });
      
      return dfd.promise();
    }
    else
      return G.getResolvedPromise();
  }

  return {
    transition: doTransition
  }
});