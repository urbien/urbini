define('d3widgets', ['lib/d3'], function() {
  function interpolateHsl(a, b) {
    var i = d3.interpolateString(a, b);
    return function(t) {
      return d3.hsl(i(t));
    };
  };

  return {
    concentricCircles: function(divId, options) {
      var $chart = divId instanceof $ ? divId : typeof divId === 'string' ? $('#' + divId) : $(divId),
          w = options.width,
          h = options.height,
          _circles = options.circles,
          numCircles = _circles.length,
          r = Math.min(w, h) / 2,
          animate = options.animate,
          s = 1 / (numCircles * 1.5);
      
      $chart.empty();
      var layers = [];
      var lIdx = 0;
      while (true) {
        var addedLayer = false, layer = layers[lIdx] = [];
        for (var i = 0; i < numCircles; i++) {
          var circle = _circles[i],
              percent;
          
          if (!_.has(circle, 'percent'))
            circle.percent = (circle.degrees / 360) * 100;
          
          var clone = _.clone(circle);
          layer.push(clone);
          if (circle.percent <= 100) {
            circle.percent = 0;
            continue;
          }
          
          clone.percent = 99.99; // hack
          circle.percent -= 99.99; // hack
  //        circle.fill = d3.hcl(circle.fill).darker().toString();
          addedLayer = true;
        }
        
        if (!addedLayer)
          break;
        
        lIdx++;
      }
  
      var fill = d3.scale.linear()
          .range(["hsl(-180,50%,50%)", "hsl(180,50%,50%)"])
          .interpolate(interpolateHsl);
  
      var arc = d3.svg.arc()
          .startAngle(0)
          .endAngle(function(d) { 
            return d.value * 2 * Math.PI; 
           })
          .innerRadius(function(d) { 
            return (d.index + (s - s / (1 + d.layer / 2))) * r; 
          })
          .outerRadius(function(d) { 
            return (d.index + s) * r; 
          });
      
      var svg = d3.select($chart[0]).append("svg")
          .attr("width", w)
          .attr("height", h);
  
  
      var firstLayer = layers[0];
      var circles = _.flatten(layers);
      var initialData = _.map(circles, function(circle, idx) {
        return _.extend({
          value: animate ? 0 : circle.percent / 100,
          index: (1 / (numCircles + 1)) * (numCircles - (idx % numCircles)),
          layer: Math.floor(idx / numCircles)
        }, circle);
      });
      
      var pie = svg.selectAll("g")
          .data(function() {
            return initialData;
          })
          .enter().append("g");
  
      
      // circles
      var current;
      pie.append("path")
          .style("fill", function(d) { return d.fill || '#000'; })
          .style("opacity", function(d) { return d.opacity || 1; })
          .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")")
          .attr("id", function(d, i){return "s" + i;})
          .attr("d", arc)
          .each(function(d) { current = d; });
  
  //    d3.select(self.frameElement).style("height", h + "px");
      
      if (animate) {
        svg.selectAll("path").data(function() {
            return _.map(circles, function(circle, idx) {
              return _.defaults({
                value: circle.percent / 100
              }, initialData[idx]);
            })
          })
          .transition()
          .duration(1000)
          .attrTween("d", function(newData) {
            var interpolation = d3.interpolate(current, newData);
            current = interpolation(0);
            return function(t) {
              return arc(interpolation(t));
            };
          })
          .each("end", function() {
            paintText();
            $chart.drags();            
  
          });
      }
      else
        paintText();
      
      function paintText() {
        var text = svg.selectAll("text")
            .data(function() {
              return _.map(firstLayer, function(circle, idx) {
                return _.extend(_.pick(circle, 'text'), {
                  x: s * r,
                  y: idx * s * r * 1.5
                });
              })          
            })
            .enter().append("text");
        
        text.attr("dy", Math.round(r / numCircles / 3) + "px")
        .append("textPath")
  //        .attr("text-anchor", "middle")
        .attr("textLength",function(d,i) {
          return 90-i*5 ;
         })
        .style("fill", "#777")
        .style("font", "Arial")
        .style("text-shadow", "none")
        .style("font-weight", "bold")
        .attr("xlink:href",function(d,i){
          return "#s"+i;
        })
        .attr("startOffset", 0)
        .text(function(d) { 
          return d.text; 
        });
      }
    }
  }
});