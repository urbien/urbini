/*!
 * Mobiscroll v2.10.1
 * http://mobiscroll.com
 *
 * Copyright 2010-2014, Acid Media
 * Licensed under the MIT license.
 *
 */
define('mobiscroll', ['domUtils'], function (DOM) {
  var indexOf = function(list, el) {
    return Array.prototype.indexOf.call(list, el);
  };
  
  (function($) {
    function testProps(props) {
        var i;
        for (i in props) {
            if (mod[props[i]] !== undefined) {
                return true;
            }
        }
        return false;
    }

    function testPrefix() {
        var prefixes = ['Webkit', 'Moz', 'O', 'ms'],
            p;

        for (p in prefixes) {
            if (testProps([prefixes[p] + 'Transform'])) {
                return '-' + prefixes[p].toLowerCase() + '-';
            }
        }
        return '';
    }

    function getCoord(e, c) {
        e = e.originalEvent || e;
        return e.changedTouches ? e.changedTouches[0]['page' + c] : e['page' + c];
    }

    function init(that, options, args) {
        var ret = that;
        if (!DOM.isCollection(that)) {
          var div = document.createElement('div');
          div.appendChild(that);
          that = div.children;
        }

        // Init
        if (typeof options === 'object') {
            return that.$forEach(function (el) {
                if (!el.id) {
                    el.id = 'mobiscroll' + (++id);
                }
                if (instances[el.id]) {
                    instances[el.id].destroy();
                }
                new $.mobiscroll.classes[options.component || 'Scroller'](el, options);
            });
        }

        // Method call
        if (typeof options === 'string') {
            that.$forEach(function (el) {
                var r,
                    inst = instances[el.id];

                if (inst && inst[options]) {
                    r = inst[options].apply(el, Array.prototype.slice.call(args, 1));
                    if (r !== undefined) {
                        ret = r;
                        return false;
                    }
                }
            });
        }

        return ret;
    }

    function testTouch(e) {
        if (e.type == 'touchstart') {
            touches[e.target] = true;
        } else if (touches[e.target]) {
            delete touches[e.target];
            return false;
        }
        return true;
    }

    var id = +new Date(),
        touches = {},
        instances = {},
        extend = $.extend,
        mod = document.createElement('modernizr').style,
        has3d = testProps(['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective']),
        hasFlex = testProps(['flex', 'msFlex', 'WebkitBoxDirection']),
        prefix = testPrefix(),
        pr = prefix.replace(/^\-/, '').replace(/\-$/, '').replace('moz', 'Moz');

    $.fn = $.fn || {};
    $.fn.mobiscroll = function (method) {
        extend(this, $.mobiscroll.components);
        return init(this, method, arguments);
    };

    $.mobiscroll = $.mobiscroll || {
        util: {
            prefix: prefix,
            jsPrefix: pr,
            has3d: has3d,
            hasFlex: hasFlex,
            getCoord: getCoord,
            testTouch: testTouch
        },
        presets: {},
        themes: {},
        i18n: {},
        instances: instances,
        classes: {},
        components: {},
        defaults: {},
        userdef: {},
        setDefaults: function (o) {
            extend(this.userdef, o);
        },
        presetShort: function (name, c) {
            this.components[name] = function (s) {
                return init(this, extend(s, { component: c, preset: name }), arguments);
            };
        }
    };

    $.scroller = $.scroller || $.mobiscroll;
    $.fn.scroller = $.fn.scroller || $.fn.mobiscroll;

  })($);

  (function ($) {

  $.mobiscroll.classes.Scroller = function (el, settings) {
      var $doc,
          $header,
          $markup,
          $overlay,
          $persp,
          $popup,
          $wnd,
          hasButtons,
          isLiquid,
          isModal,
          isScrollable,
          isVisible,
          itemHeight,
          preset,
          preventChange,
          preventPos,
          scrollLock,
          theme,
          valueText,
          wasReadOnly,
          wndWidth,
          wndHeight,

          m,
          mw, // Modal width
          mh, // Modal height
          anim,
          lang,
          click,
          moved,
          start,
          startTime,
          stop,
          p,
          min,
          max,
          target,
          index,
          lines,
          timer,
          buttons,
          btn,
          that = this,
          s,
          iv = {},
          pos = {},
          pixels = {},
          wheels = [],
          elmList = [],
          elTag = el.tagName.toLowerCase(),
          isInput = elTag == 'input';

      // Event handlers

      function onStart(ev) {
          // Scroll start
          if (testTouch(ev) && !move && !click && !btn && !isReadOnly(this)) {
              // Prevent touch highlight
              ev.preventDefault();

              move = true;
              isScrollable = s.mode != 'clickpick';
              target = $('.dw-ul', this);
              setGlobals(target);
              moved = iv[index] !== undefined; // Don't allow tap, if still moving
              p = moved ? getCurrentPosition(target) : pos[index];
              start = getCoord(ev, 'Y');
              startTime = new Date();
              stop = start;
              scroll(target, index, p, 0.001);

              if (isScrollable) {
                  target.$closest('.dwwl').$addClass('dwa');
              }

              if (ev.type === 'mousedown') {
                  document.$on('mousemove', onMove).$on('mouseup', onEnd);
              }
          }
      }

      function onMove(ev) {
          if (move) {
              if (isScrollable) {
                  // Prevent scroll
                  ev.preventDefault();
                  ev.stopPropagation();
                  stop = getCoord(ev, 'Y');
                  scroll(target, index, constrain(p + (start - stop) / itemHeight, min - 1, max + 1));
              }
              if (start !== stop) {
                  moved = true;
              }
          }
      }

      function onEnd(ev) {
          if (move) {
              var time = new Date() - startTime,
                  val = constrain(p + (start - stop) / itemHeight, min - 1, max + 1),
                  speed,
                  dist,
                  tindex,
                  ttop = target.offset().top;

              if (has3d && time < 300) {
                  speed = (stop - start) / time;
                  dist = (speed * speed) / s.speedUnit;
                  if (stop - start < 0) {
                      dist = -dist;
                  }
              } else {
                  dist = stop - start;
              }

              tindex = Math.round(p - dist / itemHeight);

              if (!dist && !moved) { // this is a "tap"
                  var idx = Math.floor((stop - ttop) / itemHeight),
                      li = target.$('.dw-li')[idx],
                      hl = isScrollable;
                  if (event('onValueTap', [li]) !== false) {
                      tindex = idx;
                  } else {
                      hl = true;
                  }

                  if (hl) {
                      li.$addClass('dw-hl'); // Highlight
                      setTimeout(function () {
                          li.$removeClass('dw-hl');
                      }, 200);
                  }
              }

              if (isScrollable) {
                  calc(target, tindex, 0, true, Math.round(val));
              }

              if (ev.type === 'mouseup') {
                  document.$off('mousemove', onMove).$off('mouseup', onEnd);
              }

              move = false;
          }
      }

      function onBtnStart(ev) {
          // Can't call preventDefault here, it kills page scroll
          if (btn) {
              btn.$removeClass('dwb-a');
          }
          btn = $(this);
          // Active button
          if (!btn.$hasClass('dwb-d') && !btn.$hasClass('dwb-nhl')) {
              btn.$addClass('dwb-a');
          }
          // +/- buttons
          if (btn.$hasClass('dwwb')) {
              if (testTouch(ev)) {
                  step(ev, btn.closest('.dwwl'), btn.$hasClass('dwwbp') ? plus : minus);
              }
          }
          if (ev.type === 'mousedown') {
              document.$on('mouseup', onBtnEnd);
          }
      }

      function onBtnEnd(ev) {
          if (click) {
              clearInterval(timer);
              click = false;
          }
          if (btn) {
              btn.$removeClass('dwb-a');
              btn = null;
          }
          if (ev.type === 'mouseup') {
              document.$off('mousedown', onBtnEnd);
          }
      }

      function onKeyDown(ev) {
          if (ev.keyCode == 38) { // up
              step(ev, $(this), minus);
          } else if (ev.keyCode == 40) { // down
              step(ev, $(this), plus);
          }
      }

      function onKeyUp() {
          if (click) {
              clearInterval(timer);
              click = false;
          }
      }

      function onScroll(ev) {
          if (!isReadOnly(ev.currentTarget)) {
              ev.preventDefault();
              ev = ev.originalEvent || ev;
              var delta = ev.wheelDelta ? (ev.wheelDelta / 120) : (ev.detail ? (-ev.detail / 3) : 0),
                  t = $('.dw-ul', ev.currentTarget)[0];

              setGlobals(t);
              calc(t, Math.round(pos[index] - delta), delta < 0 ? 1 : 2);
          }
      }

      function onHide(prevAnim) {
          var activeEl,
              value,
              type;

          $markup.remove();
          if ($activeElm && !prevAnim) {
              setTimeout(function () {
                  preventShow = true;
                  activeEl = $activeElm;
                  type = activeEl.type;
                  value = activeEl.value;
                  activeEl.type = 'button';
                  $activeElm.focus();
                  activeEl.type = type;
                  activeEl.value = value;
              }, 200);
          }
          isVisible = false;
      }

      // Private functions

      function step(ev, w, func) {
          ev.stopPropagation();
          ev.preventDefault();
          if (!click && !isReadOnly(w) && !w.$hasClass('dwa')) {
              click = true;
              // + Button
              var t = w.$('.dw-ul')[0];

              setGlobals(t);
              clearInterval(timer);
              timer = setInterval(function () { func(t); }, s.delay);
              func(t);
          }
      }

      function isReadOnly(wh) {
          if (_.isArray(s.readonly)) {
              var i = indexOf($('.dwwl', $markup), wh);
              return s.readonly[i];
          }
          return s.readonly;
      }

      function generateWheelItems(i) {
          var html = '<div class="dw-bf">',
              ww = wheels[i],
              w = ww.values ? ww : convert(ww),
              l = 1,
              labels = w.labels || [],
              values = w.values,
              keys = w.keys || values;

          _.each(values, function (v, j) {
              if (l % 20 === 0) {
                  html += '</div><div class="dw-bf">';
              }
              html += '<div role="option" aria-selected="false" class="dw-li dw-v" data-val="' + keys[j] + '"' + (labels[j] ? ' aria-label="' + labels[j] + '"' : '') + ' style="height:' + itemHeight + 'px;line-height:' + itemHeight + 'px;">' +
                  '<div class="dw-i"' + (lines > 1 ? ' style="line-height:' + Math.round(itemHeight / lines) + 'px;font-size:' + Math.round(itemHeight / lines * 0.8) + 'px;"' : '') + '>' + v + '</div></div>';
              l++;
          });

          html += '</div>';
          return html;
      }

      function setGlobals(t) {
          min = indexOf($('.dw-li', t), $('.dw-v', t).$eq(0));
          max = indexOf($('.dw-li', t), $('.dw-v', t).$eq(-1));
          index = indexOf($('.dw-ul', $markup), t);
      }

      function formatHeader(v) {
          var t = s.headerText;
          return t ? (typeof t === 'function' ? t.call(el, v) : t.replace(/\{value\}/i, v)) : '';
      }

      function readValue() {
          that.temp = that.values ? that.values.slice(0) : s.parseValue(el.value || '', that);
          setValue();
      }

      function getCurrentPosition(t) {
          var style = window.getComputedStyle ? getComputedStyle(t) : t.style,
              matrix,
              px;

          if (has3d) {
              _.each(['t', 'webkitT', 'MozT', 'OT', 'msT'], function (v, i) {
                  if (style[v + 'ransform'] !== undefined) {
                      matrix = style[v + 'ransform'];
                      return false;
                  }
              });
              matrix = matrix.split(')')[0].split(', ');
              px = matrix[13] || matrix[5];
          } else {
              px = style.top.replace('px', '');
          }

          return Math.round(m - (px / itemHeight));
      }

      function ready(t, i) {
          clearTimeout(iv[i]);
          delete iv[i];
          t.closest('.dwwl').$removeClass('dwa');
      }

      function scroll(t, index, val, time, active) {
          var px = (m - val) * itemHeight,
              style = t.style;

          if (px == pixels[index] && iv[index]) {
              return;
          }

          if (time && px != pixels[index]) {
              // Trigger animation start event
              event('onAnimStart', [$markup, index, time]);
          }

          pixels[index] = px;

          style[pr + 'Transition'] = 'all ' + (time ? time.toFixed(3) : 0) + 's ease-out';

          if (has3d) {
              style[pr + 'Transform'] = 'translate3d(0,' + px + 'px,0)';
          } else {
              style.top = px + 'px';
          }

          if (iv[index]) {
              ready(t, index);
          }

          if (time && active) {
              t.closest('.dwwl').$addClass('dwa');
              iv[index] = setTimeout(function () {
                  ready(t, index);
              }, time * 1000);
          }

          pos[index] = val;
      }

      function getValid(val, t, dir) {
          var cell = $('.dw-li[data-val="' + val + '"]', t)[0],
              cells = $('.dw-li', t),
              v = indexOf(cells, cell),
              l = cells.length;

          // Scroll to a valid cell
          if (!cell.$hasClass('dw-v')) {
              var cell1 = cell,
                  cell2 = cell,
                  dist1 = 0,
                  dist2 = 0;

              while (v - dist1 >= 0 && !cell1.$hasClass('dw-v')) {
                  dist1++;
                  cell1 = cells.$eq(v - dist1);
              }

              while (v + dist2 < l && !cell2.$hasClass('dw-v')) {
                  dist2++;
                  cell2 = cells.$eq(v + dist2);
              }

              // If we have direction (+/- or mouse wheel), the distance does not count
              if (((dist2 < dist1 && dist2 && dir !== 2) || !dist1 || (v - dist1 < 0) || dir == 1) && cell2.$hasClass('dw-v')) {
                  cell = cell2;
                  v = v + dist2;
              } else {
                  cell = cell1;
                  v = v - dist1;
              }
          }

          return {
              cell: cell,
              v: v,
              val: cell.$hasClass('dw-v') ? cell.$attr('data-val') : null
          };
      }

      function scrollToPos(time, index, manual, dir, active) {
          // Call validation event
          if (event('validate', [$markup, index, time, dir]) !== false) {
              // Set scrollers to position
              _.each($('.dw-ul', $markup), function (t, i) {
                  var sc = i == index || index === undefined,
                      res = getValid(that.temp[i], t, dir),
                      cell = res.cell;

                  if (!(cell.$hasClass('dw-sel')) || sc) {
                      // Set valid value
                      that.temp[i] = res.val;

                      if (!s.multiple) {
                          $('.dw-sel', t).$attr('aria-selected', null);
                          cell.$attr('aria-selected', 'true');
                      }

                      // Add selected class to cell
                      $('.dw-sel', t).$removeClass('dw-sel');
                      cell.$addClass('dw-sel');

                      // Scroll to position
                      scroll(t, i, res.v, sc ? time : 0.1, sc ? active : false);
                  }
              });

              // Reformat value if validation changed something
              valueText = s.formatResult(that.temp);
              if (that.live) {
                  setValue(manual, manual, 0, true);
              }

              $header.$html(formatHeader(valueText));

              if (manual) {
                  event('onChange', [valueText]);
              }
          }

      }

      function event(name, args) {
          var ret;
          args.push(that);
          _.each([userdef, theme, preset, settings], function (v, i) {
              if (v && v[name]) { // Call preset event
                  ret = v[name].apply(el, args);
              }
          });
          return ret;
      }

      function calc(t, val, dir, anim, orig) {
          val = constrain(val, min, max);

          var cell = $('.dw-li', t).$eq(val),
              o = orig === undefined ? val : orig,
              active = orig !== undefined,
              idx = index,
              time = anim ? (val == o ? 0.1 : Math.abs((val - o) * s.timeUnit)) : 0;

          // Set selected scroller value
          that.temp[idx] = cell.$attr('data-val');

          scroll(t, idx, val, time, active);

          setTimeout(function () {
              // Validate
              scrollToPos(time, idx, true, dir, active);
          }, 10);
      }

      function plus(t) {
          var val = pos[index] + 1;
          calc(t, val > max ? min : val, 1, true);
      }

      function minus(t) {
          var val = pos[index] - 1;
          calc(t, val < min ? max : val, 2, true);
      }

      function setValue(fill, change, time, noscroll, temp) {
          if (isVisible && !noscroll) {
              scrollToPos(time);
          }

          valueText = s.formatResult(that.temp);

          if (!temp) {
              that.values = that.temp.slice(0);
              that.val = valueText;
          }

          if (fill) {

              event('onValueFill', [valueText, change]);

              if (isInput) {
                  el.value = valueText;
                  if (change) {
                      preventChange = true;
                      el.$trigger('change');
                  }
              }
          }
      }

      function attachPosition(ev, checkLock) {
          var debounce;
          window.addEventListener(ev, function () {
              clearTimeout(debounce);
              debounce = setTimeout(function () {
                  if ((scrollLock && checkLock) || !checkLock) {
                      that.position(!checkLock);
                  }
              }, 200);
          });
      }

      // Public functions

      /**
      * Positions the scroller on the screen.
      */
      that.position = function (check) {

          var nw = $persp.$outerWidth(), // To get the width without scrollbar
              nh = window.innerHeight;

          if (!(wndWidth === nw && wndHeight === nh && check) && !preventPos && (event('onPosition', [$markup, nw, nh]) !== false) && isModal) {
              var w,
                  l,
                  t,
                  aw, // anchor width
                  ah, // anchor height
                  ap, // anchor position
                  at, // anchor top
                  al, // anchor left
                  arr, // arrow
                  arrw, // arrow width
                  arrl, // arrow left
                  dh,
                  scroll,
                  totalw = 0,
                  minw = 0,
                  sl = $wnd.scrollLeft,
                  st = $wnd.scrollTop,
                  wr = $('.dwwr', $markup)[0],
                  d = $('.dw', $markup)[0],
                  css = {},
                  anchor = s.anchor === undefined ? el : s.anchor;

              // Set / unset liquid layout based on screen width, but only if not set explicitly by the user
              if (isLiquid && s.layout !== 'liquid') {
                  if (nw < 400) {
                      $markup.$addClass('dw-liq');
                  } else {
                      $markup.$removeClass('dw-liq');
                  }
              }

              if (/modal|bubble/.test(s.display)) {
                  wr.style.width = '';
                  $('.dwc', $markup).$forEach(function (el) {
                      w = el.$outerWidth(true);
                      totalw += w;
                      minw = (w > minw) ? w : minw;
                  });
                  w = totalw > nw ? minw : totalw;
                  wr.$css({
                    width: w,
                    'white-space': totalw > nw ? '' : 'nowrap'
                  });
              }

              mw = d.$outerWidth();
              mh = d.$outerHeight(true);
              scrollLock = mh <= nh && mw <= nw;

              that.scrollLock = scrollLock;

              if (s.display == 'modal') {
                  l = Math.max(0, (nw - mw) / 2);
                  t = st + (nh - mh) / 2;
              } else if (s.display == 'bubble') {
                  scroll = true;
                  arr = $('.dw-arrw-i', $markup);
                  ap = anchor.$offset();
                  at = Math.abs(s.context.$offset().top - ap.top);
                  al = Math.abs(s.context.$offset().left - ap.left);

                  // horizontal positioning
                  aw = anchor.outerWidth();
                  ah = anchor.outerHeight();
                  l = constrain(al - (d.outerWidth(true) - aw) / 2 - sl, 3, nw - mw - 3);

                  // vertical positioning
                  t = at - mh; // above the input
                  if ((t < st) || (at > st + nh)) { // if doesn't fit above or the input is out of the screen
                      d.$removeClass('dw-bubble-top').$addClass('dw-bubble-bottom');
                      t = at + ah; // below the input
                  } else {
                      d.$removeClass('dw-bubble-bottom').$addClass('dw-bubble-top');
                  }

                  // Calculate Arrow position
                  arrw = arr.outerWidth();
                  arrl = constrain(al + aw / 2 - (l + (mw - arrw) / 2) - sl, 0, arrw);

                  // Limit Arrow position
                  $('.dw-arr', $markup).$css({ left: arrl });
              } else {
                  if (s.display == 'top') {
                      t = st;
                  } else if (s.display == 'bottom') {
                      t = st + nh - mh;
                  }
              }

              css.top = t < 0 ? 0 : t;
              css.left = l;
              d.$css(css);

              // If top + modal height > doc height, increase doc height
              $persp.style.height = 0;
              dh = Math.max(t + mh, s.context == 'body' ? document.documentElement.offsetHeight : document.documentElement.scrollHeight);
              $persp.$css({ height: dh, left: sl });

              // Scroll needed
              if (scroll && ((t + mh > st + nh) || (at > st + nh))) {
                  preventPos = true;
                  setTimeout(function () { preventPos = false; }, 300);
                  window.scrollTop = Math.min(t + mh - nh, dh - nh);
              }
          }

          wndWidth = nw;
          wndHeight = nh;
      };

      /**
      * Enables the scroller and the associated input.
      */
      that.enable = function () {
          s.disabled = false;
          if (isInput) {
              el.$attr('disabled', false);
          }
      };

      /**
      * Disables the scroller and the associated input.
      */
      that.disable = function () {
          s.disabled = true;
          if (isInput) {
              el.$attr('disabled', true);
          }
      };

      /**
      * Gets the selected wheel values, formats it, and set the value of the scroller instance.
      * If input parameter is true, populates the associated input element.
      * @param {Array} values Wheel values.
      * @param {Boolean} [fill=false] Also set the value of the associated input element.
      * @param {Number} [time=0] Animation time
      * @param {Boolean} [temp=false] If true, then only set the temporary value.(only scroll there but not set the value)
      */
      that.setValue = function (values, fill, time, temp, change) {
          that.temp = _.isArray(values) ? values.slice(0) : s.parseValue.call(el, values + '', that);
          setValue(fill, change === undefined ? fill : change, time, false, temp);
      };

      /**
      * Return the selected wheel values.
      */
      that.getValue = function () {
          return that.values;
      };

      /**
      * Return selected values, if in multiselect mode.
      */
      that.getValues = function () {
          var ret = [],
              i;

          for (i in that._selectedValues) {
              ret.push(that._selectedValues[i]);
          }
          return ret;
      };

      /**
      * Changes the values of a wheel, and scrolls to the correct position
      * @param {Array} idx Indexes of the wheels to change.
      * @param {Number} [time=0] Animation time when scrolling to the selected value on the new wheel.
      * @param {Boolean} [manual=false] Indicates that the change was triggered by the user or from code.
      */
      that.changeWheel = function (idx, time, manual) {
          if ($markup) {
              var i = 0,
                  nr = idx.length;

              _.each(s.wheels, function (wg, j) {
                  _.each(wg, function (w, k) {
                      if (_.inArray(i, idx) > -1) {
                          wheels[i] = w;
                          debugger;
                          $('.dw-ul', $markup).$eq(i).$html(generateWheelItems(i));
                          nr--;
                          if (!nr) {
                              that.position();
                              scrollToPos(time, undefined, manual);
                              return false;
                          }
                      }
                      i++;
                  });
                  if (!nr) {
                      return false;
                  }
              });
          }
      };

      /**
      * Return true if the scroller is currently visible.
      */
      that.isVisible = function () {
          return isVisible;
      };

      /**
      * Attach tap event to the given element.
      */
      that.tap = function (el, handler, prevent) {
          var startX,
              startY;

          if (s.tap) {
              el.$on('touchstart.dw', function (ev) {
                  // Can't always call preventDefault here, it kills page scroll
                  if (prevent) {
                      ev.preventDefault();
                  }
                  startX = getCoord(ev, 'X');
                  startY = getCoord(ev, 'Y');
              }).$on('touchend.dw', function (ev) {
                  // If movement is less than 20px, fire the click event handler
                  if (Math.abs(getCoord(ev, 'X') - startX) < 20 && Math.abs(getCoord(ev, 'Y') - startY) < 20) {
                      // preventDefault and setTimeout are needed by iOS
                      ev.preventDefault();
                      setTimeout(function () {
                          handler.call(this, ev);
                      }, isOldAndroid ? 400 : 10);
                  }
                  setTap();
              });
          }

          el.$on('click.dw', function (ev) {
              if (!tap) {
                  // If handler was not called on touchend, call it on click;
                  handler.call(this, ev);
              }
              ev.preventDefault();
          });

      };

      /**
      * Shows the scroller instance.
      * @param {Boolean} prevAnim - Prevent animation if true
      * @param {Boolean} prevFocus - Prevent focusing if true
      */
      that.show = function (prevAnim, prevFocus) {
          // Create wheels
          var lbl,
              html,
              l = 0,
              mAnim = '';

          if (s.disabled || isVisible) {
              return;
          }

          if (anim !== false) {
              if (s.display == 'top') {
                  anim = 'slidedown';
              }
              if (s.display == 'bottom') {
                  anim = 'slideup';
              }
          }

          // Parse value from input
          readValue();

          event('onBeforeShow', []);

          if (isModal && anim && !prevAnim) {
              mAnim = 'dw-' + anim + ' dw-in';
          }

          // Create wheels containers
          html = '<div class="' + s.theme + ' dw-' + s.display +
              (isLiquid ? ' dw-liq' : '') +
              (lines > 1 ? ' dw-ml' : '') +
              (hasButtons ? '' : ' dw-nobtn') + '">' +
                  '<div class="dw-persp">' +
                      (isModal ? '<div class="dwo"></div>' : '') + // Overlay
                      '<div' + (isModal ? ' role="dialog" tabindex="-1"' : '') + ' class="dw dwbg ' + mAnim + '">' + // Popup
                          (s.display === 'bubble' ? '<div class="dw-arrw"><div class="dw-arrw-i"><div class="dw-arr"></div></div></div>' : '') + // Bubble arrow
                          '<div class="dwwr">' + // Popup content
                              '<div aria-live="assertive" class="dwv' + (s.headerText ? '' : ' dw-hidden') + '"></div>' + // Header
                              '<div class="dwcc">'; // Wheel group container

          _.each(s.wheels, function (wg, i) { // Wheel groups
              html += '<div class="dwc' + (s.mode != 'scroller' ? ' dwpm' : ' dwsc') + (s.showLabel ? '' : ' dwhl') + '">' +
                          '<div class="dwwc"' + (s.maxWidth ? '' : ' style="max-width:600px;"') + '>' +
                              (hasFlex ? '' : '<table class="dw-tbl" cellpadding="0" cellspacing="0"><tr>');

              _.each(wg, function (w, j) { // Wheels
                  wheels[l] = w;
                  lbl = w.label !== undefined ? w.label : j;
                  html += '<' + (hasFlex ? 'div' : 'td') + ' class="dwfl"' + ' style="' +
                                  (s.fixedWidth ? ('width:' + (s.fixedWidth[l] || s.fixedWidth) + 'px;') :
                                  (s.minWidth ? ('min-width:' + (s.minWidth[l] || s.minWidth) + 'px;') : 'min-width:' + s.width + 'px;') +
                                  (s.maxWidth ? ('max-width:' + (s.maxWidth[l] || s.maxWidth) + 'px;') : '')) + '">' +
                              '<div class="dwwl dwwl' + l + '">' +
                              (s.mode != 'scroller' ?
                                  '<a href="#" tabindex="-1" class="dwb-e dwwb dwwbp" style="height:' + itemHeight + 'px;line-height:' + itemHeight + 'px;"><span>+</span></a>' + // + button
                                  '<a href="#" tabindex="-1" class="dwb-e dwwb dwwbm" style="height:' + itemHeight + 'px;line-height:' + itemHeight + 'px;"><span>&ndash;</span></a>' : '') + // - button
                              '<div class="dwl">' + lbl + '</div>' + // Wheel label
                              '<div tabindex="0" aria-live="off" aria-label="' + lbl + '" role="listbox" class="dwww">' +
                                  '<div class="dww" style="height:' + (s.rows * itemHeight) + 'px;">' +
                                      '<div class="dw-ul">';

                  // Create wheel values
                  html += generateWheelItems(l) +
                      '</div></div><div class="dwwo"></div></div><div class="dwwol"' +
                      (s.selectedLineHeight ? ' style="height:' + itemHeight + 'px;margin-top:-' + (itemHeight / 2 + (s.selectedLineBorder || 0)) + 'px;"' : '') + '></div></div>' +
                      (hasFlex ? '</div>' : '</td>');

                  l++;
              });

              html += (hasFlex ? '' : '</tr></table>') + '</div></div>';
          });

          html += '</div>';

          if (isModal && hasButtons) {
              html += '<div class="dwbc">';
              _.each(buttons, function (b, i) {
                  b = (typeof b === 'string') ? that.buttons[b] : b;
                  html += '<span' + (s.btnWidth ? ' style="width:' + (100 / buttons.length) + '%"' : '') + ' class="dwbw ' + b.css + '"><a href="#" class="dwb dwb' + i + ' dwb-e" role="button">' + b.text + '</a></span>';
              });
              html += '</div>';
          }
          html += '</div></div></div></div>';

          $markup = DOM.parseHTML(html)[0];
          $persp = $('.dw-persp', $markup)[0];
          $overlay = $('.dwo', $markup)[0];
          $header = $('.dwv', $markup)[0];
          $popup = $('.dw', $markup)[0];

          pixels = {};

          isVisible = true;

          scrollToPos();

          event('onMarkupReady', [$markup]);

          // Show
          if (isModal) {
              ms.activeInstance = that;
              $(s.context)[0].$append($markup);
//              $markup.appendTo(s.context);
              if (has3d && anim && !prevAnim) {
                  $markup.$addClass('dw-trans').$on(animEnd, function () {
                      $markup.$removeClass('dw-trans');
                      $markup.$('.dw').$removeClass(mAnim);
                      if (!prevFocus) {
                          $popup.focus();
                      }
                  });
              }
          } else if (elTag =='div') {
              el.$html($markup);
          } else {
              $markup.$insertAfter(el);
          }

          event('onMarkupInserted', [$markup]);

          if (isModal) {
              // Enter / ESC
              window.addEventListener('keydown.dw', function (ev) {
                  if (ev.keyCode == 13) {
                      that.select();
                  } else if (ev.keyCode == 27) {
                      that.cancel();
                  }
              });

              // Prevent scroll if not specified otherwise
              if (s.scrollLock) {
                  $markup.$on('touchmove', function (ev) {
                      if (scrollLock) {
                          ev.preventDefault();
                      }
                  });
              }

              // Disable inputs to prevent bleed through (Android bug)
              //if (isOldAndroid) {
              if (pr !== 'Moz') {
                  $('input,select,button', $doc).$forEach(function (el) {
                      if (!el.disabled) {
                          el.$addClass('dwtd').$attr('disabled', true);
                      }
                  });
              }

              attachPosition('scroll.dw', true);
          }

          // Set position
          that.position();
          attachPosition('orientationchange.dw resize.dw', false);

          // Events
          $markup.$on('selectstart mousedown', prevdef); // Prevents blue highlight on Android and text selection in IE
          $markup.$('.dwwl')
                 .$on('DOMMouseScroll mousewheel', onScroll)
                 .$on('keydown', onKeyDown)
                 .$on('keyup', onKeyUp);
          
          $markup.$('.dwb-e')
              .$on('click', prevdef)
              .$on('keydown', function (ev) {
                  if (ev.keyCode == 32) { // Space
                      ev.preventDefault();
                      ev.stopPropagation();
                      ev.currentTarget.click();
                  }
              });

          setTimeout(function () {
              // Init buttons
              _.each(buttons, function (b, i) {
                  that.tap($('.dwb' + i, $markup), function (ev) {
                      b = (typeof b === 'string') ? that.buttons[b] : b;
                      b.handler.call(this, ev, that);
                  }, true);
              });

              if (s.closeOnOverlay) {
                  that.tap($overlay, function () {
                      that.cancel();
                  });
              }

              if (isModal && !anim && !prevFocus) {
                  $popup.focus();
              }

              $markup.$('.dwwl')
                  .$on('touchstart mousedown', onStart)
                  .$on('touchmove', onMove)
                  .$on('touchend', onEnd);
              
              $markup.$('.dwb-e')
                  .$on('touchstart mousedown', onBtnStart)
                  .$on('touchend', onBtnEnd);

          }, 300);

          event('onShow', [$markup, valueText]);
      };

      /**
      * Hides the scroller instance.
      */
      that.hide = function (prevAnim, btn, force) {

          // If onClose handler returns false, prevent hide
          if (!isVisible || (!force && event('onClose', [valueText, btn]) === false)) {
              return false;
          }

          // Re-enable temporary disabled fields
          //if (isOldAndroid) {
          if (pr !== 'Moz') {
              $('.dwtd', $doc).$forEach(function (el) {
                  el.$attr('disabled', false).$removeClass('dwtd');
              });
          }

          // Hide wheels and overlay
          if ($markup) {
              if (has3d && isModal && anim && !prevAnim && !$markup.$hasClass('dw-trans')) { // If dw-trans class was not removed, means that there was no animation
                  $markup.$addClass('dw-trans').$('.dw').$addClass('dw-' + anim + ' dw-out').$on(animEnd, function () {
                      onHide(prevAnim);
                  });
              } else {
                  onHide(prevAnim);
              }

              // Stop positioning on window resize
              window.removeEventListener('.dw');
          }

          delete ms.activeInstance;
      };

      /**
      * Set button handler.
      */
      that.select = function () {
          if (that.hide(false, 'set') !== false) {
              setValue(true, true, 0, true);
              event('onSelect', [that.val, arguments[0]]);
          }
      };

      /**
      * Cancel and hide the scroller instance.
      */
      that.cancel = function () {
          if (that.hide(false, 'cancel') !== false) {
              event('onCancel', [that.val, arguments[0]]);
          }
      };

      /**
      * Show mobiscroll on focus and click event of the parameter.
      * @param {jQuery} $elm - Events will be attached to this element.
      * @param {Function} [beforeShow=undefined] - Optional function to execute before showing mobiscroll.
      */
      that.attachShow = function (el, beforeShow) {
          elmList.push(el);
          if (s.display !== 'inline') {
              el.$on('mousedown', prevdef);
//                  .$on('mousedown.dw', prevdef) // Prevent input to get focus on tap (virtual keyboard pops up on some devices)
              var doShow = function(ev) {
//              el.$on((s.showOnFocus ? 'focus.dw' : '') + (s.showOnTap ? ' click.dw' : ''), function (ev) {
                      if ((ev.type !== 'focus' || (ev.type === 'focus' && !preventShow)) && !tap) {
                          if (beforeShow) {
                              beforeShow();
                          }
                          // Hide virtual keyboard
                          var activeElTag = document.activeElement.tagName.toLowerCase();
                          if (~'input,textarea'.indexOf(activeElTag)) {
                              document.activeElement.blur();
                          }
                          $activeElm = el;
                          that.show();
                      }
                      setTimeout(function () {
                          preventShow = false;
                      }, 300); // With jQuery < 1.9 focus is fired twice in IE
              }

            if (s.showOnFocus)
              el.$on('focus', doShow); 
            if (s.showOnTap)
              el.$on('click', doShow); 
          }
      };

      /**
      * Scroller initialization.
      */
      that.init = function (ss) {
          var pres;

          // Update original user settings
          extend(settings, ss); 

          s = extend({}, defaults, userdef, settings);

          // Get theme defaults
          theme = ms.themes[s.theme];

          // Get language defaults
          lang = ms.i18n[s.lang];

          event('onThemeLoad', [lang, settings]);

          extend(s, theme, lang, userdef, settings);

          // Add default buttons
          s.buttons = s.buttons || ['set', 'cancel'];

          // Hide header text in inline mode by default
          s.headerText = s.headerText === undefined ? (s.display !== 'inline' ? '{value}' : false) : s.headerText;

          that.settings = s;

          // Unbind all events (if re-init)
          el.$off('.dw');

          pres = ms.presets[s.preset];

          if (pres) {
              preset = pres.call(el, that);
              extend(s, preset, settings); // Load preset settings
          }

          // Set private members
          m = Math.floor(s.rows / 2);
          itemHeight = s.height;
          anim = isOldAndroid ? false : s.animate;
          lines = s.multiline;
          isLiquid = (s.layout || (/top|bottom/.test(s.display) && s.wheels.length == 1 ? 'liquid' : '')) === 'liquid';
          isModal = s.display !== 'inline';
          buttons = s.buttons;
          $wnd = $(s.context == 'body' ? window : s.context);
          $doc = $(s.context)[0];

          if (!s.setText) {
              buttons.splice(_.inArray('set', buttons), 1);
          }
          if (!s.cancelText) {
              buttons.splice(_.inArray('cancel', buttons), 1);
          }
          if (s.button3) {
              buttons.splice(_.inArray('set', buttons) + 1, 0, { text: s.button3Text, handler: s.button3 });
          }

          that.context = $wnd;
          that.live = !isModal || (_.inArray('set', buttons) == -1);
          that.buttons.set = { text: s.setText, css: 'dwb-s', handler: that.select };
          that.buttons.cancel = { text: (that.live) ? s.closeText : s.cancelText, css: 'dwb-c', handler: that.cancel };
          that.buttons.clear = {
              text: s.clearText,
              css: 'dwb-cl',
              handler: function () {
                  that.trigger('onClear', [$markup]);
                  el.value = '';
                  if (!that.live) {
                      that.hide(false, 'clear');
                  }
              }
          };

          hasButtons = buttons.length > 0;

          if (isVisible) {
              that.hide(true, false, true);
          }

          if (isModal) {
              readValue();
              if (isInput) {
                  // Set element readonly, save original state
                  if (wasReadOnly === undefined) {
                      wasReadOnly = el.readOnly;
                  }
                  el.readOnly = true;
              }
              that.attachShow(el);
          } else {
              that.show();
          }

          if (isInput) {
              el.$('.dw').$on('change', function () {
                  if (!preventChange) {
                      that.setValue(el.value, false, 0.2);
                  }
                  preventChange = false;
              });
          }
      };

      /**
      * Sets one ore more options.
      */
      that.option = function (opt, value) {
          var obj = {};
          if (typeof opt === 'object') {
              obj = opt;
          } else {
              obj[opt] = value;
          }
          that.init(obj);
      };

      /**
      * Destroys the mobiscroll instance.
      */
      that.destroy = function () {
          // Force hide without animation
          that.hide(true, false, true);

          // Remove all events from elements
          _.each(elmList, function (v, i) {
              v.off('.dw');
          });

          // Reset original readonly state
          if (isInput) {
              el.readOnly = wasReadOnly;
          }

          // Delete scroller instance
          delete instances[el.id];

          event('onDestroy', []);
      };

      /**
      * Returns the mobiscroll instance.
      */
      that.getInst = function () {
          return that;
      };

      /**
      * Returns the closest valid cell.
      */
      that.getValidCell = getValid;

      /**
      * Triggers a mobiscroll event.
      */
      that.trigger = event;

      instances[el.id] = that;

      that.values = null;
      that.val = null;
      that.temp = null;
      that.buttons = {};
      that._selectedValues = {};

      that.init(settings);
  };

  function setTap() {
      tap = true;
      setTimeout(function () {
          tap = false;
      }, 500);
  }

  function constrain(val, min, max) {
      return Math.max(min, Math.min(val, max));
  }

  function convert(w) {
      var ret = {
          values: [],
          keys: []
      };
      _.each(w, function (v, k) {
          ret.keys.push(k);
          ret.values.push(v);
      });
      return ret;
  }

  var $activeElm,
      move,
      tap,
      preventShow,
      ms = $.mobiscroll,
      instances = ms.instances,
      util = ms.util,
      pr = util.jsPrefix,
      has3d = util.has3d,
      hasFlex = util.hasFlex,
      getCoord = util.getCoord,
      testTouch = util.testTouch,
      prevdef = function (ev) { ev.preventDefault(); },
      extend = $.extend,
      animEnd = 'webkitAnimationEnd animationend',
      userdef = ms.userdef,
      isOldAndroid = /android [1-3]/i.test(navigator.userAgent),
      defaults = extend(ms.defaults, {
          // Localization
          setText: 'Set',
          selectedText: 'Selected',
          closeText: 'Close',
          cancelText: 'Cancel',
          clearText: 'Clear',
          // Options
          minWidth: 80,
          height: 40,
          rows: 3,
          multiline: 1,
          delay: 300,
          disabled: false,
          readonly: false,
          closeOnOverlay: true,
          showOnFocus: true,
          showOnTap: true,
          showLabel: true,
          wheels: [],
          theme: '',
          display: 'modal',
          mode: 'scroller',
          preset: '',
          //lang: 'en-US',
          context: 'body',
          scrollLock: true,
          tap: true,
          btnWidth: true,
          speedUnit: 0.0012,
          timeUnit: 0.1,
          formatResult: function (d) {
              return d.join(' ');
          },
          parseValue: function (value, inst) {
              var val = value.split(' '),
                  ret = [],
                  i = 0,
                  keys;

              _.each(inst.settings.wheels, function (wg, j) {
                  _.each(wg, function (w, k) {
                      w = w.values ? w : convert(w);
                      keys = w.keys || w.values;
                      if (_.inArray(val[i], keys) !== -1) {
                          ret.push(val[i]);
                      } else {
                          ret.push(keys[0]);
                      }
                      i++;
                  });
              });
              return ret;
          }
      });

  // Prevent re-show on window focus
  window.addEventListener('focus', function () {
      if ($activeElm) {
          preventShow = true;
      }
  });

  document.$on('mouseover mouseup mousedown click', function (ev) { // Prevent standard behaviour on body click
      if (tap) {
          ev.stopPropagation();
          ev.preventDefault();
          return false;
      }
  });

  })($);

/*jslint eqeq: true, plusplus: true, undef: true, sloppy: true, vars: true, forin: true */
  (function ($) {

    var ms = $.mobiscroll,
        date = new Date(),
        defaults = {
            dateFormat: 'mm/dd/yy',
            dateOrder: 'mmddy',
            timeWheels: 'hhiiA',
            timeFormat: 'hh:ii A',
            startYear: date.getFullYear() - 100,
            endYear: date.getFullYear() + 1,
            monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            shortYearCutoff: '+10',
            monthText: 'Month',
            dayText: 'Day',
            yearText: 'Year',
            hourText: 'Hours',
            minuteText: 'Minutes',
            secText: 'Seconds',
            ampmText: '&nbsp;',
            nowText: 'Now',
            showNow: false,
            stepHour: 1,
            stepMinute: 1,
            stepSecond: 1,
            separator: ' '
        },
        preset = function (inst) {
            var that = $(this),
                html5def = {},
                format;
            // Force format for html5 date inputs (experimental)
            if (that.is('input')) {
                switch (that.$attr('type')) {
                case 'date':
                    format = 'yy-mm-dd';
                    break;
                case 'datetime':
                    format = 'yy-mm-ddTHH:ii:ssZ';
                    break;
                case 'datetime-local':
                    format = 'yy-mm-ddTHH:ii:ss';
                    break;
                case 'month':
                    format = 'yy-mm';
                    html5def.dateOrder = 'mmyy';
                    break;
                case 'time':
                    format = 'HH:ii:ss';
                    break;
                }
                // Check for min/max attributes
                var min = that.$attr('min'),
                    max = that.$attr('max');
                if (min) {
                    html5def.minDate = ms.parseDate(format, min);
                }
                if (max) {
                    html5def.maxDate = ms.parseDate(format, max);
                }
            }

            // Set year-month-day order
            var s = $.extend({}, defaults, html5def, inst.settings),
                offset = 0,
                wheels = [],
                ord = [],
                o = {},
                i,
                k,
                f = { y: 'getFullYear', m: 'getMonth', d: 'getDate', h: getHour, i: getMinute, s: getSecond, ap: getAmPm },
                p = s.preset,
                dord = s.dateOrder,
                tord = s.timeWheels,
                regen = dord.match(/D/),
                ampm = tord.match(/a/i),
                hampm = tord.match(/h/),
                hformat = p == 'datetime' ? s.dateFormat + s.separator + s.timeFormat : p == 'time' ? s.timeFormat : s.dateFormat,
                defd = new Date(),
                stepH = s.stepHour,
                stepM = s.stepMinute,
                stepS = s.stepSecond,
                mind = s.minDate || new Date(s.startYear, 0, 1),
                maxd = s.maxDate || new Date(s.endYear, 11, 31, 23, 59, 59);

            format = format || hformat;

            if (p.match(/date/i)) {

                // Determine the order of year, month, day wheels
                _.each(['y', 'm', 'd'], function (v, j) {
                    i = dord.search(new RegExp(v, 'i'));
                    if (i > -1) {
                        ord.push({ o: i, v: v });
                    }
                });
                ord.sort(function (a, b) { return a.o > b.o ? 1 : -1; });
                _.each(ord, function (v, i) {
                    o[v.v] = i;
                });

                var w = {};
                for (k = 0; k < 3; k++) {
                    if (k == o.y) {
                        offset++;
                        w[s.yearText] = {};
                        var start = mind.getFullYear(),
                            end = maxd.getFullYear();
                        for (i = start; i <= end; i++) {
                            w[s.yearText][i] = dord.match(/yy/i) ? i : (i + '').substr(2, 2);
                        }
                    } else if (k == o.m) {
                        offset++;
                        w[s.monthText] = {};
                        for (i = 0; i < 12; i++) {
                            var str = dord.replace(/[dy]/gi, '').replace(/mm/, i < 9 ? '0' + (i + 1) : i + 1).replace(/m/, i);
                            w[s.monthText][i] = str.match(/MM/) ? str.replace(/MM/, '<span class="dw-mon">' + s.monthNames[i] + '</span>') : str.replace(/M/, '<span class="dw-mon">' + s.monthNamesShort[i] + '</span>');
                        }
                    } else if (k == o.d) {
                        offset++;
                        w[s.dayText] = {};
                        for (i = 1; i < 32; i++) {
                            w[s.dayText][i] = dord.match(/dd/i) && i < 10 ? '0' + i : i;
                        }
                    }
                }
                wheels.push(w);
            }

            if (p.match(/time/i)) {

                // Determine the order of hours, minutes, seconds wheels
                ord = [];
                _.each(['h', 'i', 's'], function (v, i) {
                    i = tord.search(new RegExp(v, 'i'));
                    if (i > -1) {
                        ord.push({ o: i, v: v });
                    }
                });
                ord.sort(function (a, b) {
                    return a.o > b.o ? 1 : -1;
                });
                _.each(ord, function (v, i) {
                    o[v.v] = offset + i;
                });

                w = {};
                for (k = offset; k < offset + 3; k++) {
                    if (k == o.h) {
                        offset++;
                        w[s.hourText] = {};
                        for (i = 0; i < (hampm ? 12 : 24); i += stepH) {
                            w[s.hourText][i] = hampm && i == 0 ? 12 : tord.match(/hh/i) && i < 10 ? '0' + i : i;
                        }
                    } else if (k == o.i) {
                        offset++;
                        w[s.minuteText] = {};
                        for (i = 0; i < 60; i += stepM) {
                            w[s.minuteText][i] = tord.match(/ii/) && i < 10 ? '0' + i : i;
                        }
                    } else if (k == o.s) {
                        offset++;
                        w[s.secText] = {};
                        for (i = 0; i < 60; i += stepS) {
                            w[s.secText][i] = tord.match(/ss/) && i < 10 ? '0' + i : i;
                        }
                    }
                }

                if (ampm) {
                    o.ap = offset++; // ampm wheel order
                    var upper = tord.match(/A/);
                    w[s.ampmText] = { 0: upper ? 'AM' : 'am', 1: upper ? 'PM' : 'pm' };
                }
                wheels.push(w);
            }

            function get(d, i, def) {
                if (o[i] !== undefined) {
                    return +d[o[i]];
                }
                if (def !== undefined) {
                    return def;
                }
                return defd[f[i]] ? defd[f[i]]() : f[i](defd);
            }

            function step(v, st) {
                return Math.floor(v / st) * st;
            }

            function getHour(d) {
                var hour = d.getHours();
                hour = hampm && hour >= 12 ? hour - 12 : hour;
                return step(hour, stepH);
            }

            function getMinute(d) {
                return step(d.getMinutes(), stepM);
            }

            function getSecond(d) {
                return step(d.getSeconds(), stepS);
            }

            function getAmPm(d) {
                return ampm && d.getHours() > 11 ? 1 : 0;
            }

            function getDate(d) {
                var hour = get(d, 'h', 0);
                return new Date(get(d, 'y'), get(d, 'm'), get(d, 'd', 1), get(d, 'ap') ? hour + 12 : hour, get(d, 'i', 0), get(d, 's', 0));
            }

            inst.setDate = function (d, fill, time, temp) {
                var i;
                // Set wheels
                for (i in o) {
                    this.temp[o[i]] = d[f[i]] ? d[f[i]]() : f[i](d);
                }
                this.setValue(true, fill, time, temp);
            };

            inst.getDate = function (d) {
                return getDate(d);
            };

            return {
                button3Text: s.showNow ? s.nowText : undefined,
                button3: s.showNow ? function () { inst.setDate(new Date(), false, 0.3, true); } : undefined,
                wheels: wheels,
                headerText: function (v) {
                    return ms.formatDate(hformat, getDate(inst.temp), s);
                },
                /**
                * Builds a date object from the wheel selections and formats it to the given date/time format
                * @param {Array} d - An array containing the selected wheel values
                * @return {String} - The formatted date string
                */
                formatResult: function (d) {
                    return ms.formatDate(format, getDate(d), s);
                },
                /**
                * Builds a date object from the input value and returns an array to set wheel values
                * @return {Array} - An array containing the wheel values to set
                */
                parseValue: function (val) {
                    var d = new Date(),
                        i,
                        result = [];
                    try {
                        d = ms.parseDate(format, val, s);
                    } catch (e) {
                    }
                    // Set wheels
                    for (i in o) {
                        result[o[i]] = d[f[i]] ? d[f[i]]() : f[i](d);
                    }
                    return result;
                },
                /**
                * Validates the selected date to be in the minDate / maxDate range and sets unselectable values to disabled
                * @param {Object} dw - jQuery object containing the generated html
                * @param {Integer} [i] - Index of the changed wheel, not set for initial validation
                */
                validate: function (dw, i) {
                    var temp = inst.temp, //.slice(0),
                        mins = { y: mind.getFullYear(), m: 0, d: 1, h: 0, i: 0, s: 0, ap: 0 },
                        maxs = { y: maxd.getFullYear(), m: 11, d: 31, h: step(hampm ? 11 : 23, stepH), i: step(59, stepM), s: step(59, stepS), ap: 1 },
                        minprop = true,
                        maxprop = true;
                    _.each(['y', 'm', 'd', 'ap', 'h', 'i', 's'], function (i, x) {
                        if (o[i] !== undefined) {
                            var min = mins[i],
                                max = maxs[i],
                                maxdays = 31,
                                val = get(temp, i),
                                t = $('.dw-ul', dw).$eq(o[i]),
                                y,
                                m;
                            if (i == 'd') {
                                y = get(temp, 'y');
                                m = get(temp, 'm');
                                maxdays = 32 - new Date(y, m, 32).getDate();
                                max = maxdays;
                                if (regen) {
                                    $('.dw-li', t).$forEach(function (that) {
                                        var d = that.data('val'),
                                            w = new Date(y, m, d).getDay(),
                                            str = dord.replace(/[my]/gi, '').replace(/dd/, d < 10 ? '0' + d : d).replace(/d/, d);
                                        $('.dw-i', that).$html(str.match(/DD/) ? str.replace(/DD/, '<span class="dw-day">' + s.dayNames[w] + '</span>') : str.replace(/D/, '<span class="dw-day">' + s.dayNamesShort[w] + '</span>'));
                                    });
                                }
                            }
                            if (minprop && mind) {
                                min = mind[f[i]] ? mind[f[i]]() : f[i](mind);
                            }
                            if (maxprop && maxd) {
                                max = maxd[f[i]] ? maxd[f[i]]() : f[i](maxd);
                            }
                            if (i != 'y') {
                                var i1 = indexOf($('.dw-li', t), $('.dw-li[data-val="' + min + '"]', t)),
                                    i2 = indexOf($('.dw-li', t), $('.dw-li[data-val="' + max + '"]', t));
                                $('.dw-li', t).$removeClass('dw-v').slice(i1, i2 + 1).$addClass('dw-v');
                                if (i == 'd') { // Hide days not in month
                                    $('.dw-li', t).$removeClass('dw-h').slice(maxdays).$addClass('dw-h');
                                }
                            }
                            if (val < min) {
                                val = min;
                            }
                            if (val > max) {
                                val = max;
                            }
                            if (minprop) {
                                minprop = val == min;
                            }
                            if (maxprop) {
                                maxprop = val == max;
                            }
                            // Disable some days
                            if (s.invalid && i == 'd') {
                                var idx = [];
                                // Disable exact dates
                                if (s.invalid.dates) {
                                    _.each(s.invalid.dates, function (v, i) {
                                        if (v.getFullYear() == y && v.getMonth() == m) {
                                            idx.push(v.getDate() - 1);
                                        }
                                    });
                                }
                                // Disable days of week
                                if (s.invalid.daysOfWeek) {
                                    var first = new Date(y, m, 1).getDay(),
                                        j;
                                    _.each(s.invalid.daysOfWeek, function (v, i) {
                                        for (j = v - first; j < maxdays; j += 7) {
                                            if (j >= 0) {
                                                idx.push(j);
                                            }
                                        }
                                    });
                                }
                                // Disable days of month
                                if (s.invalid.daysOfMonth) {
                                    _.each(s.invalid.daysOfMonth, function (v, i) {
                                        v = (v + '').split('/');
                                        if (v[1]) {
                                            if (v[0] - 1 == m) {
                                                idx.push(v[1] - 1);
                                            }
                                        } else {
                                            idx.push(v[0] - 1);
                                        }
                                    });
                                }
                                _.each(idx, function (v, i) {
                                    $('.dw-li', t).$eq(v).$removeClass('dw-v');
                                });
                            }

                            // Set modified value
                            temp[o[i]] = val;
                        }
                    });
                },
                methods: {
                    /**
                    * Returns the currently selected date.
                    * @param {Boolean} temp - If true, return the currently shown date on the picker, otherwise the last selected one
                    * @return {Date}
                    */
                    getDate: function (temp) {
                        var inst = $(this).mobiscroll('getInst');
                        if (inst) {
                            return inst.getDate(temp ? inst.temp : inst.values);
                        }
                    },
                    /**
                    * Sets the selected date
                    * @param {Date} d - Date to select.
                    * @param {Boolean} [fill] - Also set the value of the associated input element. Default is true.
                    * @return {Object} - jQuery object to maintain chainability
                    */
                    setDate: function (d, fill, time, temp) {
                        if (fill == undefined) {
                            fill = false;
                        }
                        return _.each(this, function (el) {
                            var inst = mobiscroll(el, 'getInst');
                            if (inst) {
                                inst.setDate(d, fill, time, temp);
                            }
                        });
                    }
                }
            };
        };

    _.each(['date', 'time', 'datetime'], function(v, i) {
        ms.presets[v] = preset;
        ms.presetShort(v);
    });

    /**
    * Format a date into a string value with a specified format.
    * @param {String} format - Output format.
    * @param {Date} date - Date to format.
    * @param {Object} settings - Settings.
    * @return {String} - Returns the formatted date string.
    */
    ms.formatDate = function (format, date, settings) {
        if (!date) {
            return null;
        }
        var s = $.extend({}, defaults, settings),
            look = function (m) { // Check whether a format character is doubled
                var n = 0;
                while (i + 1 < format.length && format.charAt(i + 1) == m) {
                    n++;
                    i++;
                }
                return n;
            },
            f1 = function (m, val, len) { // Format a number, with leading zero if necessary
                var n = '' + val;
                if (look(m)) {
                    while (n.length < len) {
                        n = '0' + n;
                    }
                }
                return n;
            },
            f2 = function (m, val, s, l) { // Format a name, short or long as requested
                return (look(m) ? l[val] : s[val]);
            },
            i,
            output = '',
            literal = false;

        for (i = 0; i < format.length; i++) {
            if (literal) {
                if (format.charAt(i) == "'" && !look("'")) {
                    literal = false;
                } else {
                    output += format.charAt(i);
                }
            } else {
                switch (format.charAt(i)) {
                case 'd':
                    output += f1('d', date.getDate(), 2);
                    break;
                case 'D':
                    output += f2('D', date.getDay(), s.dayNamesShort, s.dayNames);
                    break;
                case 'o':
                    output += f1('o', (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000, 3);
                    break;
                case 'm':
                    output += f1('m', date.getMonth() + 1, 2);
                    break;
                case 'M':
                    output += f2('M', date.getMonth(), s.monthNamesShort, s.monthNames);
                    break;
                case 'y':
                    output += (look('y') ? date.getFullYear() : (date.getYear() % 100 < 10 ? '0' : '') + date.getYear() % 100);
                    break;
                case 'h':
                    var h = date.getHours();
                    output += f1('h', (h > 12 ? (h - 12) : (h == 0 ? 12 : h)), 2);
                    break;
                case 'H':
                    output += f1('H', date.getHours(), 2);
                    break;
                case 'i':
                    output += f1('i', date.getMinutes(), 2);
                    break;
                case 's':
                    output += f1('s', date.getSeconds(), 2);
                    break;
                case 'a':
                    output += date.getHours() > 11 ? 'pm' : 'am';
                    break;
                case 'A':
                    output += date.getHours() > 11 ? 'PM' : 'AM';
                    break;
                case "'":
                    if (look("'")) {
                        output += "'";
                    } else {
                        literal = true;
                    }
                    break;
                default:
                    output += format.charAt(i);
                }
            }
        }
        return output;
    };

    /**
    * Extract a date from a string value with a specified format.
    * @param {String} format - Input format.
    * @param {String} value - String to parse.
    * @param {Object} settings - Settings.
    * @return {Date} - Returns the extracted date.
    */
    ms.parseDate = function (format, value, settings) {
        var def = new Date();

        if (!format || !value) {
            return def;
        }

        value = (typeof value == 'object' ? value.toString() : value + '');

        var s = $.extend({}, defaults, settings),
            shortYearCutoff = s.shortYearCutoff,
            year = def.getFullYear(),
            month = def.getMonth() + 1,
            day = def.getDate(),
            doy = -1,
            hours = def.getHours(),
            minutes = def.getMinutes(),
            seconds = 0, //def.getSeconds(),
            ampm = -1,
            literal = false, // Check whether a format character is doubled
            lookAhead = function (match) {
                var matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) == match);
                if (matches) {
                    iFormat++;
                }
                return matches;
            },
            getNumber = function (match) { // Extract a number from the string value
                lookAhead(match);
                var size = (match == '@' ? 14 : (match == '!' ? 20 : (match == 'y' ? 4 : (match == 'o' ? 3 : 2)))),
                    digits = new RegExp('^\\d{1,' + size + '}'),
                    num = value.substr(iValue).match(digits);

                if (!num) {
                    return 0;
                }
                //throw 'Missing number at position ' + iValue;
                iValue += num[0].length;
                return parseInt(num[0], 10);
            },
            getName = function (match, s, l) { // Extract a name from the string value and convert to an index
                var names = (lookAhead(match) ? l : s),
                    i;

                for (i = 0; i < names.length; i++) {
                    if (value.substr(iValue, names[i].length).toLowerCase() == names[i].toLowerCase()) {
                        iValue += names[i].length;
                        return i + 1;
                    }
                }
                return 0;
                //throw 'Unknown name at position ' + iValue;
            },
            checkLiteral = function () {
                //if (value.charAt(iValue) != format.charAt(iFormat))
                //throw 'Unexpected literal at position ' + iValue;
                iValue++;
            },
            iValue = 0,
            iFormat;

        for (iFormat = 0; iFormat < format.length; iFormat++) {
            if (literal) {
                if (format.charAt(iFormat) == "'" && !lookAhead("'")) {
                    literal = false;
                } else {
                    checkLiteral();
                }
            } else {
                switch (format.charAt(iFormat)) {
                case 'd':
                    day = getNumber('d');
                    break;
                case 'D':
                    getName('D', s.dayNamesShort, s.dayNames);
                    break;
                case 'o':
                    doy = getNumber('o');
                    break;
                case 'm':
                    month = getNumber('m');
                    break;
                case 'M':
                    month = getName('M', s.monthNamesShort, s.monthNames);
                    break;
                case 'y':
                    year = getNumber('y');
                    break;
                case 'H':
                    hours = getNumber('H');
                    break;
                case 'h':
                    hours = getNumber('h');
                    break;
                case 'i':
                    minutes = getNumber('i');
                    break;
                case 's':
                    seconds = getNumber('s');
                    break;
                case 'a':
                    ampm = getName('a', ['am', 'pm'], ['am', 'pm']) - 1;
                    break;
                case 'A':
                    ampm = getName('A', ['am', 'pm'], ['am', 'pm']) - 1;
                    break;
                case "'":
                    if (lookAhead("'")) {
                        checkLiteral();
                    } else {
                        literal = true;
                    }
                    break;
                default:
                    checkLiteral();
                }
            }
        }
        if (year < 100) {
            year += new Date().getFullYear() - new Date().getFullYear() % 100 +
                (year <= (typeof shortYearCutoff != 'string' ? shortYearCutoff : new Date().getFullYear() % 100 + parseInt(shortYearCutoff, 10)) ? 0 : -100);
        }
        if (doy > -1) {
            month = 1;
            day = doy;
            do {
                var dim = 32 - new Date(year, month - 1, 32).getDate();
                if (day <= dim) {
                    break;
                }
                month++;
                day -= dim;
            } while (true);
        }
        hours = (ampm == -1) ? hours : ((ampm && hours < 12) ? (hours + 12) : (!ampm && hours == 12 ? 0 : hours));
        var date = new Date(year, month - 1, day, hours, minutes, seconds);
        if (date.getFullYear() != year || date.getMonth() + 1 != month || date.getDate() != day) {
            throw 'Invalid date';
        }
        return date;
    };

  })($);

  (function ($) {

  var ms = $.mobiscroll,
    second = 1,
    minute = 60,
    hour = 3600,
    day = 86400,
    week = 604800,
    month = 30.4 * day,
    year = 365.25 * day,
    secs = [year, month, week, day, hour, minute, second],
    units = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'],
//    abbreviations = {
//      hours: 'hrs',
//      minutes: 'mins',
//      seconds: 'secs'
//    },
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
}

function clean(d) {
  for (var i = 0; i < d.length; i++) {
    var num = d[i];
    d[i] = num && isNum(num) ? parseInt(num) : 0;
  }
  
  return d;
}

function getWheelValues(seconds, names) {
  var d = [];
  for (var i = 0; i < names.length; i++) {
    var name = names[i],
        idx = units.indexOf(name);
    
    d[i] = Math.floor(seconds / secs[idx]);
    seconds = d[i] === 0 ? seconds : seconds - d[i] * secs[idx];        
  }
  
  return d;
}

function zeroes(length) {
  var arr = [], i = 0;
  for (; i < length; i++)
    arr[i] = 0;
  
  return arr;
}

function getUnitWheelName(unit) {
//  return unit; //abbreviations[unit] || unit;
  return unit.slice(0,1).toUpperCase() + unit.slice(1);
}

ms.presets.duration = function(inst) {
  var settings = inst.settings || {},
      wheelNames = settings.durationWheels || ['days', 'hours', 'minutes'],
      wheels = [],
      wheelNames,
      defaultVals = settings.defaults || [],
      setDefaults = !defaultVals.length,
      elm = this; // 'this' refers to the DOM element on which the plugin is called
      
  
    _.each(wheelNames, function(name, idx) {
        name = name.toLowerCase();
        var data = {}, //wheelData[name] = {},
            w = wheels[idx] = {};
        
        setDefaults && defaultVals.push(idx ? 0 : 1);
        w[getUnitWheelName(name)] = data;
        switch (name) {
          case 'years':
          case 'months':
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
          _.each(units, function(unit, idx) {
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
          var val = elm.value;
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
          _.each(wheelNames, function(name, idx) {
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
  })($);
  
  $.mobiscroll.themes.ios = {
      dateOrder: 'MMdyy',
      rows: 5,
      height: 30,
      minWidth: 60,
      headerText: false,
      showLabel: false,
      btnWidth: false,
      selectedLineHeight: true,
      selectedLineBorder: 2,
      useShortLabels: true
  };
});