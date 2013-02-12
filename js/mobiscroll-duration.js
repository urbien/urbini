//'use strict';
define(['jquery', 'mobiscroll'], function ($) {

  var ms = $.mobiscroll;
  var second = 1,
      minute = 60,
      hour = 3600,
      day = 86400,
      week = 604800;
  var secs = [week, day, hour, minute, second];
      
  var defaults = {
      // Default options for the preset
      vals: [0, 1, 0, 0, 0],
      weeks: 0,
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0
  }

  var clean = function(d) {
    for (var i = 0; i < d.length; i++) {
      d[i] = d[i] ? parseInt(d[i]) : 0;
    }
    
    return d;
  }
  
  ms.presets.duration = function(inst) {
      var weeks = {}, days = {}, hours = {}, minutes = {}, seconds = {};
      for (var i = 0; i < 100; i++)
        weeks[i] = i;
      for (var i = 0; i < 8; i++)
        days[i] = i;
      for (var i = 0; i < 61; i++)
        hours[i] = minutes[i] = seconds[i] = i;
  
      var s = $.extend({}, defaults, inst.settings), 
          // Extend settings with preset defaults
          wheels = [{'Weeks': weeks}, {'Days': days}, {'Hours': hours}, {'Minutes': minutes}, {'Seconds': seconds}],
          value = 0,
          // Create custom wheels
          elm = $(this);
          // 'this' refers to the DOM element on which the plugin is called

      // Custom preset logic which is executed
      // when the scroller instance is created, 
      // e.g. create the custom wheels
      
      inst.setDuration = function (d, fill, time, temp) {
        this.temp = clean(d);
        this.setValue(true, fill, time, temp);        
      };
      
      inst.setSeconds = function(s, fill, time, temp) {
        var d = [];
        for (var i = 0; i < secs.length; i++) {
          d[i] = Math.floor(s / secs[i]);
          s = d[i] === 0 ? s : s - d[i] * secs[i];        
        }
        
        inst.setDuration(d, fill, time, temp);
      };
      
      inst.getSeconds = function(d) {
        d = d || inst.temp;
        var sum = 0;
        for (var i = 0; i < secs.length; i++)
          sum += d[i] * secs[i];
        
        return sum; //d[0] * secs[0] + d[1] * day + d[2] * hour + d[3] * minute + d[4];
      };
      
      return {
          // Typically a preset defines the 'wheels', 'formatResult', and 'parseValue' settings
          wheels: wheels,
          methods: {
            setSeconds: inst.setSeconds,
            setDuration: inst.setDuration,
            getSeconds: inst.getSeconds
          },
          formatResult: function(d) {
            for (var i = 0; i < d.length; i++)
              d[i] = parseInt(d[i]);
              
            var numDays = (d[0] || 0) * 7 + (d[1] || 0);
            var str = (numDays ? numDays + ' day{0}, '.format(numDays === 1 ? '' : 's') : '') +
                      (d[2] ? d[2] + ' hour{0}, '.format(d[2] === 1 ? '' : 's') : '') +
                      (d[3] ? d[3] + ' minute{0}, '.format(d[3] === 1 ? '' : 's') : '') +
                      (d[4] ? d[4] + ' second{0}, '.format(d[4] === 1 ? '' : 's') : '');                      
                
            return str.length ? str.slice(0, str.length - 2) : str;
          },
          parseValue: function() {
            var val = elm.val();
            if (!val)
              return defaults.vals;
            
            var match = elm.val().match(/((\d+) week[s]?)?[ ,]*((\d+) day[s]?)?[ ,]*((\d+) hour[s]?)?[ ,]*((\d+) minute[s]?)?[ ,]*((\d+) second[s]?)?[ ,]*/);
            if (!match)
              return defaults.vals;
            else {
              var d = [match[2], match[5], match[8], match[11], match[14]];
              return clean(d);
//              w = w ? parseInt(w) : 0;
//              d = d ? parseInt(d) : 0;
//              h = h ? parseInt(h) : 0;
//              m = m ? parseInt(m) : 0;
//              s = s ? parseInt(s) : 0;
//              return w * week + d * day + h * hour + m * minute + s;
//              return [w ? parseInt(w) : 0,
//                     d = d ? parseInt(d) : 0,
//                     h = h ? parseInt(h) : 0,
//                     m = m ? parseInt(m) : 0,
//                     s = s ? parseInt(s) : 0];
            }
//            return  //[elm.val()];
          },
          // The preset may override any other core settings
          headerText: function (v) {
            return inst.settings.label; // inst.temp;
          }
      };
  };

  // Add this line if you want to be able to use your preset like 
  // $('#selector').mobiscroll().mypreset() as a shorthand for 
  // $('#selector').mobiscroll({ preset: 'mypreset' })
  $.mobiscroll.presetShort('duration');
});