//'use strict';
define('mobiscroll-enum', ['mobiscroll'], function () {
  var ms = $.mobiscroll;
  return {
    makeEnumScroller: function(type, vals, defaultValue) {
      defaultValue = defaultValue || vals[0];
      var values = [];
      for (var i = 0; i < vals.length; i++)
        values[i] = vals[i];
        
      var preset = ms.presets[type] = ms.presets[type] || function(inst) {
        var wheel = {},
            wheels = [wheel];
            
        wheel[''] = values;
        var elm = $(this); // 'this' refers to the DOM element on which the plugin is called        
        inst.setEnumValue = function (d, fill, time, temp) {
          this.temp = d;
          this.setValue(true, fill, time, temp);        
        };

//        var getValue = function(d) {
//          return d;//d[0] ? values[parseInt(d[0])] : defaultValue;
//        };
        
        inst.getEnumValue = function() {
//          d = d || inst.temp;
//          return getValue(d);
          return inst.temp;
        };
        

        return {
          // Typically a preset defines the 'wheels', 'formatResult', and 'parseValue' settings
          wheels: wheels,
          methods: {
            setEnumValue: inst.setEnumValue,
            getEnumValue: inst.getEnumValue
          },
          
          formatResult: function(d) {
            return d; //d[0] ? values[parseInt(d[0])] : defaultValue;
          },
          
          parseValue: function() {
            var val = elm.val();
            return val ? [val] : [defaultValue];
          },
          
          // The preset may override any other core settings
          headerText: function (v) {
            return inst.settings.label; // inst.temp;
          }
        };
      };
      
      $.mobiscroll.presetShort(type);
    }
  }  
});