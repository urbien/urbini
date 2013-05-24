//'use strict';
define('mobiscroll-duration', ['mobiscroll'], function () {

  var ms = $.mobiscroll,
      second = 1,
      minute = 60,
      hour = 3600,
      day = 86400,
      week = 604800,
      secs = [week, day, hour, minute, second],
      units = ['weeks', 'days', 'hours', 'minutes', 'seconds'],
//      abbreviations = {
//        hours: 'hrs',
//        minutes: 'mins',
//        seconds: 'secs'
//      },
      defaults = {
          // Default options for the preset
          weeks: 0,
          days: 1,
          hours: 0,
          minutes: 0,
          seconds: 0
      };

  function isNum(str) {
    return /^\d+$/.test(str);
  };
  
  function clean(d) {
    for (var i = 0; i < d.length; i++) {
      var num = d[i];
      d[i] = num && isNum(num) ? parseInt(num) : 0;
    }
    
    return d;
  };

  function getWheelValues(seconds, names) {
    var d = [];
    for (var i = 0; i < names.length; i++) {
      var name = names[i],
          idx = units.indexOf(name);
      
      d[i] = Math.floor(seconds / secs[idx]);
      seconds = d[i] === 0 ? seconds : seconds - d[i] * secs[idx];        
    }
    
    return d;
  };
  
  function zeroes(length) {
    var arr = [], i = 0;
    for (; i < length; i++)
      arr[i] = 0;
    
    return arr;
  }
  
  function getUnitWheelName(unit) {
//    return unit; //abbreviations[unit] || unit;
    return unit.slice(0,1).toUpperCase() + unit.slice(1);
  };
  
  ms.presets.duration = function(inst) {
    var settings = inst.settings || {},
        wheelNames = settings.durationWheels || ['days', 'hours', 'minutes'],
        wheels = [],
        wheelNames,
        defaultVals = settings.defaults || [],
        setDefaults = !defaultVals.length,
        elm = $(this); // 'this' refers to the DOM element on which the plugin is called
        
    
      $.each(wheelNames, function(idx, name) {
          name = name.toLowerCase();
          var data = {}, //wheelData[name] = {},
              w = wheels[idx] = {};
          
          setDefaults && defaultVals.push(idx ? 0 : 1);
          w[getUnitWheelName(name)] = data;
          switch (name) {
            case 'weeks': 
              for (var i = 0; i < 100; i++)
                data[i] = i;
              
              break;
            case 'days': 
              for (var i = 0; i <= 365; i++)
                data[i] = i;
              
              break;
            case 'hours':
            case 'minutes':
            case 'seconds':
              for (var i = 0; i < 60; i++)
                data[i] = i;
              
              break;
          }
      });
      
      inst.setDuration = function (d, fill, time, temp) {
        this.temp = clean(d);
        this.setValue(true, fill, time, temp);        
      };
      
      inst.setSeconds = function(s, fill, time, temp) {
        var d = getWheelValues(s, wheelNames);
        inst.setDuration(d, fill, time, temp);
      };
      
      inst.getSeconds = function(d) {
        d = d || inst.temp;
        var sum = 0;
        for (var i = 0; i < wheelNames.length; i++)
          sum += d[i] * secs[units.indexOf(wheelNames[i])];
        
        return sum;
      };
      
      return {
          wheels: wheels,
          methods: {
            setSeconds: inst.setSeconds,
            setDuration: inst.setDuration,
            getSeconds: inst.getSeconds
          },
          formatResult: function(d) {
            clean(d);
            var str = '';
            $.each(units, function(idx, unit) {
              var idx = wheelNames.indexOf(unit);
              if (idx >= 0) {
                var val = d[idx];
                if (val == 0 || !isNum(val))
                  return;
                else                  
                  str += d[idx] + ' ' + unit;
                
                if (val == 1) 
                  str = str.slice(0, str.length - 1); // make it singular (2 minutes but 1 minute)
                
                str += ', ';
              }
            });
            
            return str.length ? str.slice(0, str.length - 2) : '(none)';
          },
          
          parseValue: function() {
            var val = elm.val();
            if (!val)
              return defaultVals.slice(0);
            
            if (typeof val === 'string') {
              val = val.trim();
              if (!val.length)
                return defaultVals.slice(0);

              if (val === '(none)')
                return zeroes(wheelNames.length);
              
              if (isNum(val))
                val = parseInt(val);
            }
            
            if (typeof val === 'number')
              return getWheelValues(val, wheelNames);
            
            var d = [];
            $.each(wheelNames, function(idx, name) {
              var nIdx = val.indexOf(name.slice(0, name.length - 1)); // singular
              if (nIdx >= 0) {
                var startComma = Math.max(val.lastIndexOf(',', nIdx), 0),
                    endComma = val.indexOf(',', nIdx);
                
                endComma = endComma < 0 ? val.length : endComma;
                var numsMatch = val.slice(startComma, endComma).match(/(\d+)/);
                if (numsMatch && numsMatch.length) {
                  d.push(parseInt(numsMatch[0]));
                  return;
                }
              }
              
              d.push(0);
            });
            
            return d.length ? clean(d) : defaultVals;
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