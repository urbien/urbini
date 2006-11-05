var A_CALENDARS = [], TC0 = [];

var TC1 = 'aAdDFhHilmMsUYy',
    TC2 = 'dMDFhHimsUYy',
    TC3 = { 'a': "([a-z]{2})",   'A': "([A-Z]{2})",   'd': "([0-9]{0,2})",  'D': "([A-z]{3})",    'F': "([A-z]{0,10})",
            'h': "([0-9]{0,2})", 'H': "([0-9]{0,2})", 'i': "([0-9]{0,2})",  'l': "([A-z]{0,10})", 'm': "([0-9]{0,2})",
            'M': "([A-z]{3})",   's': "([0-9]{0,2})", 'U': "([0-9]{0,12})", 'Y': "([0-9]{4})",    'y': "([0-9]{2})" },
    TC4 = { 'a': [null, function(TC5) {
  if (TC5 >= 12)
    return 'pm';
  else
    return 'am'
}, null],   'A': [null, function(TC5) {
  if (TC5 >= 12)
    return 'PM';
  else
    return 'AM'
}, null],   'd': ['setDate', function(TC5, TC6) {
  TC5 = TC5.getDate();

  if (TC5 < 10)
    return ('0' + TC5);
  else
    return TC5
}, function(TC5) {
  return TC5 * 1
} ],        'D': [null, function(TC5) {
  return ARR_STRINGS['short_days'][TC5.getDay()]
} , function(TC5) {
  return TC5 * 1
} ],        'l': [null, function(TC5) {
  return ARR_STRINGS['long_days'][TC5.getDay()]
} , function(TC5) {
  return TC5 * 1
} ],        'h': ['setHours', function(TC5) {
  TC5 = TC5.getHours();

  if (TC5 <= 12)
    return TC5;
  else
    return (TC5 - 12)
}, function(TC5, TC7) {
  TC5 = TC5 * 1;

  if (TC7 == 'PM' || TC7 == 'pm')
    return 12 + (TC5 == 12 ? 0 : TC5);
  else
    return TC5
}],         'H': ['setHours', 'getHours', function(TC5) {
  return TC5 * 1
} ],        'i': ['setMinutes', function(TC5) {
  TC5 = TC5.getMinutes();

  if (TC5 < 10)
    return ('0' + TC5);
  else
    return TC5 * 1
}, function(TC5) {
  return TC5 * 1
} ],        's': ['setSeconds', function(TC5) {
  TC5 = TC5.getSeconds();

  if (TC5 < 10)
    return ('0' + TC5);
  else
    return TC5 * 1
}, function(TC5) {
  return TC5 * 1
} ],        'm': ['setMonth', function(TC5) {
  TC5 = TC5.getMonth() + 1;

  if (TC5 < 10)
    return ('0' + TC5);
  else
    return TC5
}, function(TC5) {
  return (TC5 * 1 - 1)
} ],        'F': ['setMonth', function(TC5) {
  return ARR_STRINGS['long_month'][TC5.getMonth()]
} , function(TC5) {
  var i;

  TC5 = TC5 + '';

  for (i = 0; i < 13; i++)
    if (ARR_STRINGS['long_month'][i].toLowerCase() == TC5.toLowerCase())
      return (i);

  return alert(ARR_STRINGS['bad_month'].replace(/%month_name/g, TC5))
}],         'M': ['setMonth', function(TC5) {
  return ARR_STRINGS['short_month'][TC5.getMonth()]
} , function(TC5) {
  var i;

  TC5 = TC5 + '';

  for (i = 0; i < 13; i++)
    if (ARR_STRINGS['short_month'][i].toLowerCase() == TC5.toLowerCase())
      return (i);

  return alert(ARR_STRINGS['bad_month'].replace(/%month_name/g, TC5))
}],         'U': [],             'Y': ['setFullYear', 'getFullYear', function(TC5) {
  return TC5 * 1
} ],        'y': ['setFullYear', function(TC5) {
  TC5 = TC5.getFullYear() + '';

  return TC5.substring(TC5.length - 2, TC5.length)
}, function(TC5) {
  if (TC5 < 50)
    return ('20' + TC5) * 1;
  else
    return ('19' + TC5) * 1
}] }, TC8,
    TC9;

var tc0a6 = false;

function calendar(initParams, TCB) {

  this.initialized = false;
  
  this.sceduleUrlPart = initParams['scedule']; // A.L.
  
//  var TCC = this.TCC = A_CALENDARS.length;
  var TCC = this.TCC = initParams.formname + '_' + initParams.controlname;

  A_CALENDARS[this.TCC] = this;
  this.flag_error = false;
  TC0[TCC] = [ new Image(), new Image(), new Image(), new Image(), new Image()];
  TC0[TCC][0].src = TCB.hourminusimage.src;
  TC0[TCC][1].src = TCB.hourplusimage.src;
  TC0[TCC][2].src = TCB.disminusimage.src;
  TC0[TCC][3].src = TCB.displusimage.src;
  TC0[TCC][4].src = TCB.todayimage.src;
  this.dateMessage = dateMessage;
  this.getElementId = getElementId;
  this.TCG = (initParams.picttype == 'img' ? 1 : initParams.picttype == 'button' ? 2 : initParams.picttype == 'others' ? 3 : 1);
  this.TCH = (initParams.controlname ? initParams.controlname : 'datetime_' + this.TCC);
  this.TCI = (initParams.pictname ? initParams.pictname : 'calicon_' + this.TCC);
  this.calPosImageId = (initParams.positionname ? initParams.positionname : 'calpos_' + this.TCC);

  this.titleStr = initParams.title;

  if (!initParams.formname) {
    this.dateMessage('need_form_name');
    return
  }

  if (!document.forms[initParams.formname]) {
    this.dateMessage('form_not_found', initParams.formname);
    return
  }

  this.TCK = initParams.formname;

  if (!TC9)
    TC9 = new TCL();

  this.TCM = TCN;
  this.TCO = TCP;
  this.getDateFor = getDateFor;
  this.TCS = TCT;
  this.TCU = TCV;
  this.TCW = TCX;
  this.TCY = TCZ;
  this.TCa = TCb;
  this.TCc = TCd;
  this.TCe = TCf;
  this.TCg = TCh;
  this.TCi = TCj;
  this.TCk = TCl;
  this.TCm = TCn;
  this.TCo = TCp;
  this.TCq = TCr;
  this.TCs = false;
  this.TCB = TCB;
  this.initParams = initParams;
  this.applyForSchedule = applyForSchedule;
  
  var dateformat1 = this.dateformat = !this.initParams.dataformat ? 'Y-d-m' : this.initParams.dataformat;
  //var TCv, TCw = 0, TCx = [];
  var TCw = 0, TCx = [];
  this.TCy = [];
  var TCz = ["\\\\", "\\/", "\\.", "\\+", "\\*", "\\?", "\\$", "\\^", "\\|"];

  for (i = 0, len1=dateformat1.length; i < len1; i++) {
    var TCv = dateformat1.substr(i, 1);

    if (TC1.indexOf(TCv) != -1 && TCv != '') {
      TCx[TCw] = TCv;
      this.TCy[TCw++] = TCv
    }
  }

  TCw = 1;
  var TCx = TCx.sort();

  for (i in TCz) {
    dateformat1 = dateformat1.replace(("/" + TCz[i] + "/g"), TCz[i])
    //dateformat1 = dateformat1.replace(eval("/" + TCz[i] + "/g"), TCz[i]) // mike: old code
  }

  for (i = 0, len = TCx.length; i < len; i++) {
  //for (i = 0; i < TCx.length; i++) { // Mike: old code
    TC00 = new RegExp(TCx[i]);

    dateformat1 = dateformat1.replace(TC00, TC3[TCx[i]])
  }

  this.TC01 = new RegExp("^" + dateformat1.replace(/\s+/g, "\\s+") + "$");
  this.TC02 = (this.dateformat.indexOf(
                   'H') != -1) ? (this.dateformat.indexOf(
                                      's') != -1 ? 2 : 3) : ((this.dateformat.indexOf(
                                                                  'h') != -1) ? ((this.dateformat.indexOf(
                                                                                      'a') < 0 && this.dateformat.indexOf(
                                                                                                      'A') < 0)
                                                                                    ? 99 : 1) : 0);

  if (this.TC02 == 99) {
    this.dateMessage('not_format');
    return
  }

  this.TC03 = (initParams.today ?
               this.TCc(initParams.today) :
               (this.TC02 != 0 ? this.getDateFor(null, true) :
                  this.getDateFor()));
  this.TC04 = this.TCM(initParams.selected, this.TC03, true);
  this.TC05 = initParams.mindate ? this.TCM(initParams.mindate, this.TC03) : null;
  this.TC06 = initParams.maxdate ? this.TCM(initParams.maxdate, this.TC03) : null;
  var TC07 = ['marked', 'allowed', 'forbidden'];

  for (var TC08 in TC07) {
    this.TCS(initParams, TC07[TC08])
  }

  if (initParams.onclickday) {
    this.TCS(initParams.onclickday, 'func')
  }

  if (this.b_allowed) {
    this.TC04 = this.TCa(this.TC04)
  }

  this.TC09 = this.initParams.watch == true ? this.TCe(this.TC04) : '';
  this.TC0A = this.TCY();

  //var db=document.body && document.body.innerHTML; // mike
  var db=true;
  var tc0a64 = this.TC0A & 64;
  var tc0a2 = this.TC0A & 2;
  var tc0a4 = this.TC0A & 4;
  var tc0a8 = this.TC0A & 8;
  var outp = "";
  if (tc0a64 && db) {
  //if (this.TC0A & 64 && document.body && document.body.innerHTML) { //mike
    //document.write('<table cellpadding="0" cellspacing="0" border="0" ><tr>')
    outp='<table cellpadding="0" cellspacing="0" border="0" ><tr>';
  }

  if (tc0a2) {

    if (tc0a64){
      outp=outp+'<td>';
      //document.write(outp);
      //document.write('<td>');
    }
    //document.write('<input type="Text" id="', this.TCH, '"   name="', this.TCH, '" value="', this.TC09, '" ', this.TCO('datacontrol'),   '>');
    outp=outp+'<input type="Text" id="'+ this.TCH+ '"   name="'+ this.TCH+ '" value="'+ this.TC09+ '" '+ this.TCO('datacontrol')+   '>';
    if (tc0a64){
      outp=outp+'<td>';
      //document.write(outp);
      //document.write('</td>')
    }
  }

  if (db) {
  //if (document.body && document.body.innerHTML) { //mike
    if (this.TCG != 3) {
      if (tc0a64 && (tc0a2 && (tc0a4 || tc0a6))){
        outp=outp+'<td><img ' + this.TCO('pixel') + '></td>';
        //document.write('<td><img ' + this.TCO('pixel') + '></td>');
      }
      if (tc0a64 && (tc0a4 || tc0a6)){
        outp=outp+'<td>';
        //document.write('<td>');
  }
      if (tc0a4){
        outp=outp+'<a href="javascript:A_CALENDARS[\'' + this.TCC + '\'].create(); A_CALENDARS[\'' + this.TCC + '\'].showcal();" ><img ' + this.TCO('caliconshow') + ' name="'
                + this.TCI + '"      id="' + this.TCI + '"></a>';
        //document.write(
        //    '<a href="javascript:A_CALENDARS[' + this.TCC + '].create(); A_CALENDARS[' + this.TCC + '].showcal();" ><img ' + this.TCO('caliconshow') + ' name="'
         //       + this.TCI + '"      id="' + this.TCI + '"></a>');
      }
      else if (tc0a6){
        outp=outp+'<input type="button"  ' + this.TCO('calbutton') + ' name="' + this.TCI + '" id="' + this.TCI
                           + '" onclick="A_CALENDARS[\'' + this.TCC + '\'].showcal();return false;">';
        //document.write('<input type="button"  ' + this.TCO('calbutton') + ' name="' + this.TCI + '" id="' + this.TCI
        //                   + '" onclick="A_CALENDARS[' + this.TCC + '].showcal();return false;">');
      }
      if (tc0a64 && (tc0a4 || tc0a6)){
      outp=outp+'<td>';
        //document.write('</td>')
        }
    }
  }

  if (tc0a64 && (tc0a2 || (tc0a4 || tc0a6))){
    outp=outp+'</tr>';
    //document.write('</tr>');
  }
  if (this.TC0A & 32) {
    if (tc0a64) {
      outp=outp+'<tr><td>';
      //document.write('<tr><td>');//mike
    }
    //if (tc0a64)
     // document.write('<td>');
    outp=outp+'<img ' + this.TCO('pixel') + '  name="' + this.calPosImageId + '" id="' + this.calPosImage + '">';
    //document.write('<img ' + this.TCO('pixel') + '  name="' + this.calPosImageId + '" id="' + this.calPosImageId + '">');
    //document.write(outp);
    if (tc0a64){
      outp=outp+'<td>';
      //document.write('</td>');
    }
    if (tc0a64 && (tc0a2 && (tc0a4 || tc0a6))){
      outp=outp+'<td></td><td></td>';
      //document.write('<td></td><td></td>');
    }
    if (tc0a64){
      outp=outp+'<tr>';
      //document.write('</tr>')
    }
  }
  if (tc0a64 && db){
    //if (tc0a64 && document.body && document.body.innerHTML) // mike
    outp=outp+'</table>';
    //document.write('</table>');
  }
//alert(outp);
//  var d = document.getElementById(this.TCH + "_div");
//  d.innerHTML = outp;
  this.create = TC0B;
  this.create1 = create1;
  this.createDiv = createDiv;
  this.TC0C = TC0D;
  this.TC0E = TC0F;
  this.TC0G = TC0H;
  this.TC0I = TC0J;
  this.TC0K = TC0L;
  this.TC0M = TC0N;
  this.setCalendarPosition = setCalendarPosition;
  this.getOffset = getOffset;
  this.showcal = showcal;
  this.isShown = isShown;
  this.TC0T = TC0U
}

function TC0U() {
}

function TCZ() {
  var TC0V = 1;

  if (!this.getElementId(this.TCH, 'form'))
    TC0V |= 2;

  if (this.TCG != 3) {
    if (this.TCG == 1 && !this.getElementId(this.TCI, 'img'))
      TC0V |= 4;
    if (this.TCG == 2 && !this.getElementId(this.TCI, 'form'))
      TC0V |= 8
  }
  else
    TC0V |= 16;

  if (!this.getElementId(this.calPosImageId, 'img'))
    TC0V |= 32;

  if ((TC0V & 2 && TC0V & 32) || (TC0V & 2 && (TC0V & 4 || TC0V & 8)) || ((TC0V & 4 || TC0V & 8) && TC0V & 32))
    TC0V |= 64;

  return TC0V
}

function TCN(TC0W, TC0X, TC0Y) {
  if (!TC0W)
    return (TC0Y ? TC0X : null);

  var TC0Z = /^[+-]?\d+$/, TC0a;
  return (TC0Z.exec(TC0W) ? new Date(TC0X.valueOf() + new Number(TC0W * 864e5)) : this.TCc(TC0W))
}

function createDiv() {
  //if (!document.body || !document.body.innerHTML)
  //  return;
  var thistcc = this.TCC;
  var TC0c = new TC0d();
  TC0c.TC0e('<div id="caldiv',
            thistcc,
            '" name="caldiv',
            thistcc,
            '" style=" position: absolute; left:12; top:12; visibility:hidden; z-index: ',
            1,
            '"></div>');

  if (TC9.needIframe) {
    TC0c.TC0e('<iframe id="cal_iframe',
              thistcc,
              '" src="',
              'about:blank',
              '"  name="cal_iframe',
              thistcc,
              '" style="position: absolute; left:0; top:0; width:0; height:0; visibility:hidden; filter:alpha(opacity=0); z-index: ',
              0,
              '"></iframe>')
  }
  //alert(TC0c.TC0g());
  return TC0c.TC0g();
}

function create1() {
  document.write(this.createDiv());
}

function TC0B() {
  var thistcc = this.TCC;
  var calRef = document.getElementById('caldiv' + thistcc);

  //if (!document.body || !document.body.innerHTML || this.initialized)
   // return;
  if (this.initialized)
    return;
  this.initialized = true;

  if (this.TC02 != 2)
    this.TC04.setSeconds(0);

  var signal = TC9.TC0b ? 'onclick' : 'onchange';
  var TC0c = new TC0d();

  var title = "<div class='menuTitle' style='font-size:11; margin-bottom:1px; overflow:visible;'>" + this.titleStr + "</div>";
  TC0c.TC0e('<table ',
			'style="padding:1px; background-color:#eef;"',
            this.TCO('outertable'),
            '>',
            '<tr><td>',
            title,
            '</td></tr>',
            '<tr><td><table',
            this.TCO('navtable'),
            '><tr>',
            (this.TCB.todaycell && this.TCB.todayimage ? '<td rowspan="2"' + this.TCO('todaycell')
                + '><a href="javascript:  A_CALENDARS[\'' + thistcc + '\'].TC0G(null, '
                + this.TCU(this.TC03) + ');"><img name="cal_itoday' + thistcc + '"' + this.TCO(
                                                                                           'todayimage') + '></a></td>'
                : ''),
            '');
  TC0c.TC0e('<td rowspan="2"',            this.TCO('monthselectorcell'),
            '><select name="cal_mon',     thistcc + '"',
            this.TCO('monthselector'),    ' id="cal_mon',
            thistcc,                     '"  ',
            signal,                       '="A_CALENDARS[\'',
            thistcc,                     '\'].TC0G(\'mon\')"></select></td><td',
            this.TCO('monthscrollcell'),  '><a href="#" name="cal_amminus',
            thistcc,                     '" id="cal_amminus',
            thistcc,                     '"><img name="cal_imminus',
            thistcc,                     '" id="cal_imminus',
            thistcc,                     '" ',
            this.TCO('monthminusimage'),  '></a></td><td rowspan="2"',
            this.TCO('yearselectorcell'), '><select name="cal_year',
            thistcc,                     '"',
            this.TCO('yearselector'),     ' id="cal_year',
            thistcc,                     '"  ',
            signal,                       '="A_CALENDARS[\'',
            thistcc,                     '\'].TC0G(\'year\')"></select></td><td',
            this.TCO('yearscrollcell'),   '><a href="#"  name="cal_ayminus',
            thistcc,                     '" id="cal_ayminus',
            thistcc,                     '" ><img name="cal_iyminus',
            thistcc,                     '" id="cal_iyminus',
            thistcc,                     '" ',
            this.TCO('yearminusimage'),   '></a></td></tr><tr><td',
            this.TCO('monthscrollcell'),  '><a href="#" name="cal_amplus',
            thistcc,                     '" id="cal_amplus',
            thistcc,                     '"><img name="cal_implus',
            thistcc,                     '" id="cal_implus',
            thistcc,                     '" ',
            this.TCO('monthplusimage'),   '></a></td><td',
            this.TCO('yearscrollcell'),   '><a href="#" name="cal_ayplus',
            thistcc,                     '" id="cal_ayplus',
            thistcc,                     '"><img name="cal_iyplus',
            thistcc,                     '" id="cal_iyplus',
            thistcc,                     '" ',
            this.TCO('yearplusimage'),    '></a></td></tr></table></td></tr><tr><td id="cal_grid',
            thistcc,                     '"',
            this.TCO('gridcell'),         '>',
            this.TC0C(),                  '</td></tr>');

  if (this.TC02) {
    TC0c.TC0e('<tr><td align="center"><table', this.TCO('timetable'),            '><tr><td rowspan="2"',
              this.TCO('timeselectorcell'),    '><select name="cal_hour',        thistcc,
              '" id="cal_hour',                thistcc,                         '"   ',
              this.TCO('timeselector'),        ' ',                              signal,
              '="A_CALENDARS[\'',                thistcc,                         '\'].TC0G(\'time\')"></select></td><td',
              this.TCO('timescrollcell'),      '><a href="#" name="cal_ahminus', thistcc,
              '" id="cal_ahminus',             thistcc,                         '"><img name="cal_ihminus',
              thistcc,                        '" id="cal_ihminus',              thistcc,
              '" ',                            this.TCO('hourminusimage'),       '></a></td><td rowspan="2"',
              this.TCO('timeselectorcell'),    '><select name="cal_min',         thistcc,
              '" id="cal_min',                 thistcc,                         '" ',
              this.TCO('timeselector'),        ' ',                              signal,
              '="A_CALENDARS[\'',                thistcc,                         '\'].TC0G(\'time\')"></select></td><td',
              this.TCO('timescrollcell'),      '><a href="#" name="cal_aiminus', thistcc,
              '" id="cal_aiminus',             thistcc,                         '"><img name="cal_iiminus',
              thistcc,                        '" id="cal_iiminus',              thistcc,
              '" ',                            this.TCO('minminusimage'),        '></a></td>');

    if (this.TC02 == 1)
      TC0c.TC0e('<td rowspan="2"',                                                   this.TCO('timeselectorcell'),
                '><select name="cal_ap',                                             thistcc,
                '" id="cal_ap',                                                      thistcc,
                '" ',                                                                this.TCO('timeselector'),
                ' ',                                                                 signal,
                '="A_CALENDARS[\'',                                                    thistcc,
                '\'].TC0G(\'time\')"></select></td><td><a href="#" name="cal_aaminus', thistcc,
                '" id="cal_aaminus',                                                 thistcc,
                '"><img name="cal_iaminus',                                          thistcc,
                '" id="cal_iaminus',                                                 thistcc,
                '" ',                                                                this.TCO('apminusimage'),
                '></a></td>');

    if (this.TC02 == 2)
      TC0c.TC0e('<td rowspan="2"',                                                   this.TCO('timeselectorcell'),
                '><select name="cal_sec',                                            thistcc,
                '" id="cal_sec',                                                     thistcc,
                '" ',                                                                this.TCO('timeselector'),
                ' ',                                                                 signal,
                '="A_CALENDARS[\'',                                                    thistcc,
                '\'].TC0G(\'time\')"></select></td><td><a href="#" name="cal_asminus', thistcc,
                '" id="cal_asminus',                                                 thistcc,
                '"><img name="cal_isminus',                                          thistcc,
                '" id="cal_isminus',                                                 thistcc,
                '" ',                                                                this.TCO('secminusimage'),
                '></a></td>');

    TC0c.TC0e('</tr><tr><td><a href="#" name="cal_ahplus',  thistcc,
              '" id="cal_ahplus',                           thistcc,
              '"><img name="cal_ihplus',                    thistcc,
              '" id="cal_ihplus',                           thistcc,
              '" ',                                         this.TCO('hourplusimage'),
              '></a></td><td><a href="#" name="cal_aiplus', thistcc,
              '" id="cal_aiplus',                           thistcc,
              '"><img name="cal_iimplus',                   thistcc,
              '" id="cal_iiplus',                           thistcc,
              '" ',                                         this.TCO('minplusimage'),
              '></a></td>');

    if (this.TC02 == 1)
      TC0c.TC0e('<td',                     this.TCO('timescrollcell'), '><a href="#" name="cal_aaplus',
                thistcc,                  '" id="cal_aaplus',         thistcc,
                '"><img name="cal_iaplus', thistcc,                   '" id="cal_iaplus',
                thistcc,                  '" ',                       this.TCO('applusimage'),
                '></a></td>');

    if (this.TC02 == 2)
      TC0c.TC0e('<td',                     this.TCO('timescrollcell'), '><a href="#" name="cal_asplus',
                thistcc,                  '" id="cal_asplus',         thistcc,
                '"><img name="cal_isplus', thistcc,                   '" id="cal_isplus',
                thistcc,                  '" ',                       this.TCO('secplusimage'),
                '></a></td>');
    TC0c.TC0e('</tr></table></td></tr>')
  }

  TC0c.TC0e('</table>');

  calRef.innerHTML = TC0c.TC0g();

  this.TC0h = this.getElementId('cal_mon' + thistcc);
  this.TC0i = this.getElementId('cal_year' + thistcc);
  this.TC0j = this.getElementId('cal_grid' + thistcc);
  this.caldiv = this.getElementId('caldiv' + thistcc);

  if (TC9.needIframe)
    this.iframe = this.getElementId('cal_iframe' + thistcc);

  this.TC0m = this.getElementId(this.TCH, 'form');
  // this.TC0m.value  = this.TC09; //  commented out by A. L.
  this.calPosImage = this.getElementId(this.calPosImageId, 'img');

//  if (this.TCG == 1) { // icon is not used now
//    this.TC0o = this.getElementId(this.TCI, 'img');
//  }

  this.TC0p = this.getElementId('cal_implus' + thistcc, 'img');
  this.TC0q = this.getElementId('cal_imminus' + thistcc, 'img');
  this.TC0r = this.getElementId('cal_iyplus' + thistcc, 'img');
  this.TC0s = this.getElementId('cal_iyminus' + thistcc, 'img');
  this.TC0t = this.getElementId('cal_amplus' + thistcc);
  this.TC0u = this.getElementId('cal_amminus' + thistcc);
  this.TC0v = this.getElementId('cal_ayplus' + thistcc);
  this.TC0w = this.getElementId('cal_ayminus' + thistcc);

  if (this.TC02) {
    this.TC0x = this.getElementId('cal_hour' + thistcc);

    this.TC0y = this.getElementId('cal_min' + thistcc);
    this.TC0z = this.getElementId('cal_ihplus' + thistcc, 'img');
    this.TC10 = this.getElementId('cal_ihminus' + thistcc, 'img');
    this.TC11 = this.getElementId('cal_ahplus' + thistcc);
    this.TC12 = this.getElementId('cal_ahminus' + thistcc);
    this.TC13 = this.getElementId('cal_iiplus' + thistcc, 'img');
    this.TC14 = this.getElementId('cal_iiminus' + thistcc, 'img');
    this.TC15 = this.getElementId('cal_aiplus' + thistcc);
    this.TC16 = this.getElementId('cal_aiminus' + thistcc);

    if (this.TC02 == 2) {
      this.TC17 = this.getElementId('cal_sec' + thistcc);

      this.TC18 = this.getElementId('cal_isplus' + thistcc, 'img');
      this.TC19 = this.getElementId('cal_isminus' + thistcc, 'img');
      this.TC1A = this.getElementId('cal_asplus' + thistcc);
      this.TC1B = this.getElementId('cal_asminus' + thistcc)
    }
    if (this.TC02 == 1) {
      this.TC1C = this.getElementId('cal_ap' + thistcc);

      this.TC1D = this.getElementId('cal_iaplus' + thistcc, 'img');
      this.TC1E = this.getElementId('cal_iaminus' + thistcc, 'img');
      this.TC1F = this.getElementId('cal_aaplus' + thistcc);
      this.TC1G = this.getElementId('cal_aaminus' + thistcc)
    }
  }

  this.TC0G();
  this.setCalendarPosition();

  // set a handler which hides the calendar	 
  Calendar_popupHandler.start(this.caldiv, this.iframe, this.TC0m);
}

function TC0L() {
  var TC1H = this.TCW(this.TC04);

  if (this.TC05 && this.TC04.getFullYear() - 1 < this.TC05.getFullYear()) {
    this.TC0s.src = this.TCB.disminusimage.src;
    this.TC0w.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0T()"
  }
  else {
    this.TC0s.src = this.TCB.yearminusimage.src;
    this.TC0w.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0G(null, " + this.TCU(this.TC04, null, -1) + ");"
  }

  if (this.TC06 && this.TC04.getFullYear() + 1 > this.TC06.getFullYear()) {
    this.TC0r.src = this.TCB.displusimage.src;
    this.TC0v.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0T()"
  }
  else {
    this.TC0r.src = this.TCB.yearplusimage.src;
    this.TC0v.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0G(null, " + this.TCU(this.TC04, null, +1) + ");"
  }

  if (this.TC05 && (TC1H & 4096) && (TC1H & 8192)) {
    this.TC0q.src = this.TCB.disminusimage.src;
    this.TC0u.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0T()"
  }
  else {
    this.TC0q.src = this.TCB.monthminusimage.src;
    this.TC0u.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0G(null, " + this.TCU(this.TC04, -1, null) + ");"
  }

  if (this.TC06 && (TC1H & 131072) && (TC1H & 262144)) {
    this.TC0p.src = this.TCB.displusimage.src;
    this.TC0t.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0T()"
  }
  else {
    this.TC0p.src = this.TCB.monthplusimage.src;
    this.TC0t.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0G(null, " + this.TCU(this.TC04, +1, null) + ");"
  }

  if (this.TC02) {
    if (this.TC05 && (TC1H & 16384) && (TC1H & 8192) && (TC1H & 4096) && (TC1H & 4194304)) {
      this.TC10.src = this.TCB.disminusimage.src;
      this.TC12.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0T()"
    }
    else {
      this.TC10.src = this.TCB.hourminusimage.src;
      this.TC12.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0G(null, " + this.TCU(this.TC04, null, null,
                                                                                           -1) + ");"
    }

    if (this.TC06 && (TC1H & 524288) && (TC1H & 131072) && (TC1H & 262144) && (TC1H & 8388608)) {
      this.TC0z.src = this.TCB.displusimage.src;
      this.TC11.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0T()"
    }
    else {
      this.TC0z.src = this.TCB.hourplusimage.src;
      this.TC11.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0G(null, " + this.TCU(this.TC04, null, null,
                                                                                           +1) + ");"
    }

    if (this.TC05 && (TC1H & 32768) && (TC1H & 16384) && (TC1H & 8192) && (TC1H & 4096) && (TC1H & 4194304)) {
      this.TC14.src = this.TCB.disminusimage.src;
      this.TC16.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0T()"
    }
    else {
      this.TC14.src = this.TCB.minminusimage.src;
      this.TC16.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0G(null, " + this.TCU(
                                                                                      this.TC04, null, null, null,
                                                                                      -1) + ");"
    }

    if (this.TC06 && (TC1H & 1048576) && (TC1H & 524288) && (TC1H & 131072) && (TC1H & 262144) && (TC1H & 8388608)) {
      this.TC13.src = this.TCB.displusimage.src;
      this.TC15.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0T()"
    }
    else {
      this.TC13.src = this.TCB.minplusimage.src;
      this.TC15.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0G(null, " + this.TCU(
                                                                                      this.TC04, null, null, null,
                                                                                      +1) + ");"
    }

    if (this.TC02 == 2) {
      if (this.TC05 && (TC1H & 65536) && (TC1H & 32768) && (TC1H & 16384) && (TC1H & 8192) && (TC1H & 4096)
          && (TC1H & 4194304)) {
        this.TC19.src = this.TCB.disminusimage.src;
        this.TC1B.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0T()"
      }
      else {
        this.TC19.src = this.TCB.secminusimage.src;
        this.TC1B.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0G(null, " + this.TCU(
                                                                                        this.TC04, null, null, null,
                                                                                        null,      -1) + ");"
      }
      if (this.TC06 && (TC1H & 2097152) && (TC1H & 1048576) && (TC1H & 524288) && (TC1H & 131072) && (TC1H & 262144)
          && (TC1H & 8388608)) {
        this.TC18.src = this.TCB.displusimage.src;
        this.TC1A.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0T()"
      }
      else {
        this.TC18.src = this.TCB.secplusimage.src;
        this.TC1A.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0G(null, " + this.TCU(
                                                                                        this.TC04, null, null, null,
                                                                                        null,      +1) + ");"
      }
    }
    if (this.TC02 == 1) {
      if (this.TC04.getHours() < 12
          || (this.TC05 && (TC1H & 16384) && (TC1H & 8192) && (TC1H & 4096) && (TC1H & 4194304))) {
        this.TC1E.src = this.TCB.disminusimage.src;
        this.TC1G.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0T()"
      }
      else {
        this.TC1E.src = this.TCB.apminusimage.src;
        this.TC1G.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0G(null, " + this.TCU(
                                                                                        this.TC04, null, null, -12,
                                                                                        null,      0) + ");"
      }
      if (this.TC04.getHours() >= 12
          || (this.TC06 && (TC1H & 524288) && (TC1H & 131072) && (TC1H & 262144) && (TC1H & 8388608))) {
        this.TC1D.src = this.TCB.displusimage.src;
        this.TC1F.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0T()"
      }
      else {
        this.TC1D.src = this.TCB.applusimage.src;
        this.TC1F.href = "javascript:  A_CALENDARS['" + this.TCC + "'].TC0G(null, " + this.TCU(
                                                                                        this.TC04, null, null, +12,
                                                                                        null,      0) + ");"
      }
    }
  }
}

function TCh(TC1I) {
  var TC1J = true;

  // by A.L. prevents repetitive creation
  if(this.TC0i.options.length != 0) 
	return;

  if (!TC1I)
    TC1I = new Date(this.TC04);

  if (this.TC0i.options.length != 0)
    TC1J = new Number(this.TC0i.options[this.TC0i.selectedIndex].text) == TC1I.getFullYear() ? false : true;

  if (TC1J) {
    this.TC0i.options.length = 0;

    var TC1K = TC1I.getFullYear() - this.TCB.yearsbefore, TC1L = TC1I.getFullYear() + this.TCB.yearsafter,
        TC1M = new Date(TC1K, 11, 31),                    TC1N = new Date(TC1K, 0, 1),
        TC08;

    if (!(this.TCW(TC1M) & 256))
      this.TC0i.options[0] = new Option('<< ' + (TC1K), '-');

    for (TC1O = TC1K + 1; TC1O < TC1L; TC1O++) {
      TC1M.setFullYear(TC1O);

      TC1N.setFullYear(TC1O);

      if (!(this.TCW(TC1M) & 256 || this.TCW(TC1N) & 512)) {
        TC08 = this.TC0i.options.length;

        this.TC0i.options[TC08] = new Option(TC1O, '_');
        this.TC0i.options[TC08].selected = (TC1O == TC1I.getFullYear())
      }
    }

    TC1N.setFullYear(TC1L);
    if (!(this.TCW(TC1N) & 512))
      this.TC0i.options[this.TC0i.options.length] = new Option(TC1L + ' >>', '+')
  }
}

function TCj(TC1I) {
  var TC1J = true;

  var TC1P = 0;

  if (!TC1I)
    TC1I = new Date(this.TC04);

  if (TC1J) {
 //   this.TC0h.options.length = 0; // A. L.

    TC1Q = TC1R = new Date(TC1I);
    for (var TC1S = 0; TC1S < 12; TC1S++) {
      if (this.TC05) {
        if (TC1I.getFullYear() == this.TC05.getFullYear()) {
          TC1J = (TC1S >= this.TC05.getMonth()) ? true : false
        }
      }

      if (this.TC06 && TC1J) {
        if (TC1I.getFullYear() == this.TC06.getFullYear()) {
          TC1J = (TC1S <= this.TC06.getMonth()) ? true : false
        }
      }

      if (TC1J) {
		if(this.TC0h.options.length < 12) // A. L. prevents repetitive creation
			this.TC0h.options[TC1P] = new Option(this.TCB.months[TC1S], TC1S);

        this.TC0h.options[TC1P].selected = (TC1S == TC1I.getMonth());
        TC1P++
      }
    }
  }
}

function TCl(TC1I) {
  var TC1J = true;

  var TC1T = 0;

  if (!TC1I)
    TC1I = new Date(this.TC04);

  TC1H = this.TCW(TC1I);
  //this.TC0x.options.length = 0;

  if (this.TC02 == 1) {
    var TC1U = (TC1I.getHours() > 12 ? 12 : 0);
    for (TC1V = TC1I.getHours() > 12 ? 1 : 0; TC1V <= 12; TC1V++) {
      if (this.TC05 && (TC1H & 8192) && (TC1H & 4096) && (TC1H & 4194304)) {
        TC1J = ((TC1V + TC1U) >= this.TC05.getHours()) ? true : false
      }

      if (this.TC06 && TC1J && (TC1H & 131072) && (TC1H & 262144) && (TC1H & 8388608)) {
        TC1J = (TC1V + TC1U <= this.TC06.getHours()) ? true : false
      }

      if (TC1J) {
		if(this.TC0x.options.length < 12)
			this.TC0x.options[TC1T] = new Option(TC1V, TC1V);

        this.TC0x.options[TC1T].selected = (TC1V == (TC1I.getHours() > 12 ? TC1I.getHours() - 12 : TC1I.getHours()));
        TC1T++
      }
    }
  }
  else {
    for (TC1V = 0; TC1V < 24; TC1V++) {
      if (this.TC05 && (TC1H & 8192) && (TC1H & 4096) && (TC1H & 4194304)) {
        TC1J = (TC1V >= this.TC05.getHours()) ? true : false
      }

      if (this.TC06 && TC1J && (TC1H & 131072) && (TC1H & 262144) && (TC1H & 8388608)) {
        TC1J = (TC1V <= this.TC06.getHours()) ? true : false
      }

      if (TC1J) {
		if(this.TC0x.options.length < 24)
			this.TC0x.options[TC1T] = new Option(TC1V, TC1V);

        this.TC0x.options[TC1T].selected = (TC1V == TC1I.getHours());
        TC1T++
      }
    }
  }
}

function TCn(TC1I) {
  var TC1J = true;

  var TC1W = 0;

  if (!TC1I)
    TC1I = new Date(this.TC04);

  TC1H = this.TCW(TC1I);
  //this.TC0y.options.length = 0;

  for (TC1X = 0; TC1X < 60; TC1X++) {
    if (this.TC05 && (TC1H & 8192) && (TC1H & 4096) && (TC1H & 4194304) && (TC1H & 16384)) {
      TC1J = (TC1X >= this.TC05.getMinutes()) ? true : false
    }

    if (this.TC06 && TC1J && (TC1H & 131072) && (TC1H & 262144) && (TC1H & 8388608) && (TC1H & 524288)) {
      TC1J = (TC1X <= this.TC06.getMinutes()) ? true : false
    }

    if (TC1J) {
	  if(this.TC0y.options.length < 60)	
		this.TC0y.options[TC1W] = new Option(TC1X, TC1X);

      this.TC0y.options[TC1W].selected = (TC1X == TC1I.getMinutes());
      TC1W++
    }
  }
}

function TCp(TC1I) {
  var TC1J = true;

  var TC1Y = 0;

  if (!TC1I)
    TC1I = new Date(this.TC04);

  TC1H = this.TCW(TC1I);
  //this.TC17.options.length = 0;

  for (TC1Z = 0; TC1Z < 60; TC1Z++) {
    if (this.TC05 && (TC1H & 8192) && (TC1H & 4096) && (TC1H & 4194304) && (TC1H & 16384) && (TC1H & 32768)) {
      TC1J = (TC1Z >= this.TC05.getSeconds()) ? true : false
    }

    if (this.TC06 && TC1J && (TC1H & 131072) && (TC1H & 262144) && (TC1H & 8388608) && (TC1H & 524288)
        && (TC1H & 1048576)) {
      TC1J = (TC1Z <= this.TC06.getSeconds()) ? true : false
    }

    if (TC1J) {
      if(this.TC17.options.length < 60)
		this.TC17.options[TC1Y] = new Option(TC1Z, TC1Z);

      this.TC17.options[TC1Y].selected = (TC1Z == TC1I.getSeconds());
      TC1Y++
    }
  }
}

function TCr(TC1I) {
  var TC1a = TC1b = true;

  if (!TC1I)
    TC1I = new Date(this.TC04);

  TC1H = this.TCW(TC1I);
  //this.TC1C.options.length = 0;

  if (this.TC05 && (TC1H & 8192) && (TC1H & 4096) && (TC1H & 4194304)) {
    TC1V = this.TC05.getHours();

    TC1a = TC1V > 12 ? false : true;
    TC1b = true
  }

  if (this.TC06 && (TC1H & 131072) && (TC1H & 262144) && (TC1H & 8388608)) {
    TC1V = this.TC06.getHours();

    TC1b = TC1V > 12 ? true : false;
    TC1a = true
  }

  if (TC1a) {
    TC1Y = 0;//this.TC1C.options.length;
    if(this.TC1C.options.length == 0)
		this.TC1C.options[TC1Y] = new Option('am', 'am');
		
    this.TC1C.options[TC1Y].selected = (TC1I.getHours() < 12);
    TC1Y++
  }

  if (TC1b) {
    TC1Y = this.TC1C.options.length;
	if(this.TC1C.options.length < 2)
		this.TC1C.options[TC1Y] = new Option('pm', 'pm');
    this.TC1C.options[TC1Y].selected = (TC1I.getHours() >= 12);
    TC1Y++
  }
}

function TC0H(TC1c, TC1d, TC1J) {
  var TC1e = TC1d ? new Date(TC1d) : new Date(this.TC04);
  if (!TC1d) {
    if (this.TC0i.options.length != 0) {
      var TC1f = this.TC0h.options[this.TC0h.selectedIndex].value;
      if (TC1c == 'time') {
        TC1V = this.TC0x.options[this.TC0x.selectedIndex].value;

        TC1X = this.TC0y.options[this.TC0y.selectedIndex].value;
        if (this.TC02 == 1) {
          TC1g = this.TC1C.options[this.TC1C.selectedIndex].value;

          TC1V = TC1g == 'pm' ? (TC1V == 12 ? 1 * TC1V : 1 * TC1V + 12) : (TC1V == 12 ? 0 : TC1V);
          TC1e.setHours(TC1V);
          TC1e.setMinutes(TC1X);
          TC1e.setSeconds(0)
        }
        else {
          TC1e.setHours(TC1V);

          TC1e.setMinutes(TC1X);
          if (this.TC02 == 2) {
            TC1Z = this.TC17.options[this.TC17.selectedIndex].value;
            TC1e.setSeconds(TC1Z)
          }
        }
      }
      else {
        if (TC1c == 'year') {

          var TC1h = this.TC0i.options[this.TC0i.selectedIndex].text;

          var TC1i = this.TC0i.options[this.TC0i.selectedIndex].value;
          var TC1j;

          if (TC1i && TC1i != '_') {
            TC1j = (TC1i == '+'
                       ? (TC1e.getFullYear() + this.TCB.yearsbefore) : (TC1e.getFullYear() - this.TCB.yearsbefore))
          }
          else
            TC1j = new Number(TC1h);

          TC1e.setFullYear(TC1j);
          if (TC1f != TC1e.getMonth()) {
            TC1e.setDate(0)
          }
        }
        if (TC1c == 'mon') {
          TC1e.setMonth(TC1f);
          if (TC1f != TC1e.getMonth()) {
            TC1e.setDate(0)
          }
        }
      }
    }
  }
  this.TC04 = new Date(TC1e);
  this.TC04 = this.TCa(this.TC04);
  this.TC0M(TC1c);
  
  if (this.initParams.watch == true) {
    if (this.shown || this.TC0m.value) {
       this.TC0m.value = this.TCe(this.TC04)
    }
  }
  else if (TC1c == 'chislo') {
    if (this.shown || this.TC0m.value) {
      // 'if' is a hack by A.L. - No change on the calendar openning.
		  var date = this.TCe(this.TC04);
		  if(typeof TC1d != 'undefined') {
			  this.TC0m.value = date;
  			
			  // scheduleTimeFromCalendar - Day .java // A.L.
        if(typeof this.sceduleUrlPart != 'undefined' && this.sceduleUrlPart != null)
          this.applyForSchedule(date);
  			  
			  Calendar_popupHandler.end();
		  }
    }
  }
}

function applyForSchedule(dateStr) {
 // schedule uses format 'm-d-Y'
 var dateArr = dateStr.split('-');
 var day = dateArr[1];
 var month = dateArr[0];
 var year = dateArr[2];
 
 var location = this.sceduleUrlPart
  + "&$day=" + day
  + "&$month=" + (month - 1) // 0-based month counting
  + "&$year=" + year;

 window.location = location;
}

function TC0N(TC1c) {
  this.TC0K();

  if (TC1c != 'time') {
    this.TCg();
    this.TCi()
  }

  if (this.TC02) {
    this.TCk();

    this.TCm();

    if (this.TC02 == 2)
      this.TCo();
    if (this.TC02 == 1)
      this.TCq()
  }

  if (this.TC02 != 2)
    this.TC04.setSeconds(0);

  if (this.TCs) {
    this.TC0j.innerHTML = '';
    this.TC0j.innerHTML = this.TC0C()
  }

  this.TCs = true
}

function TCb(TC1e) {
  if (this.TC02 != 2) {
    if (this.TC05)
      this.TC05.setSeconds(0);

    if (this.TC06)
      this.TC06.setSeconds(0);

    this.TC04.setSeconds(0);
    this.TC03.setSeconds(0);
    TC1e.setSeconds(0)
  }

  if (this.TC06)
    this.TC06.setMilliseconds(0);

  if (this.TC05)
    this.TC05.setMilliseconds(0);

  TC1e.setMilliseconds(0);
  var TC1l = this.TCW(TC1e);

  if (!(TC1l & 1)) {
    if (TC1l & 64) {
      var TC1m = this.getDateFor(TC1e), TC1n = TC1e, TC1o = 1, TC1J = false, TC1p, TC1q;

      while (!TC1J) {
        if (!TC1p) {
          TC1r = new Date(TC1e.valueOf() + new Number(TC1o * 864e5));
          if (this.TCW(TC1r) & 1) {
            TC1p = TC1r;
            if (TC1r.getMonth() == TC1e.getMonth())
              break
          }
        }

        if (!TC1q) {
          TC1r = new Date(TC1e.valueOf() - new Number(TC1o * 864e5));
          if (this.TCW(TC1r) & 1) {
            TC1q = TC1r;
            if (TC1r.getMonth() == TC1e.getMonth())
              break
          }
        }

        if (TC1p && TC1q) {
          TC1r = ((TC1p.valueOf() - TC1e.valueOf()) < (TC1e.valueOf() - TC1q.valueOf())) ? TC1p : TC1q;
          TC1J = true
        }

        TC1o++
      }
      TC1e = new Date(TC1r)
    }
  }

  if (this.TC05) {
    if (this.TC02) {
      if ((TC1l & 1024)) {
        TC1e = this.TC05;
        this.dateMessage('min_date')
      }
    }
    else if (TC1l & 256) {
      TC1e = this.TC05;

      this.dateMessage('min_date')
    }
  }

  if (this.TC06) {
    if (this.TC02) {
      if (TC1l & 2048) {
        TC1e = this.TC06;
        this.dateMessage('max_date')
      }
    }
    else if (TC1l & 512) {
      TC1e = this.TC06;

      this.dateMessage('max_date')
    }
  }

  if (this.b_allowed && !(TC1l & 129)) {
    var TC1m = this.getDateFor(TC1e), TC1s = TC1t = TC1u = TC1v = 0;

    for (i = 0; i < this.TC1w.length; i++) {
      if (TC1m.valueOf() < this.TC1w[i])
        TC1s = this.TC1w[i];

      if (TC1m.valueOf() > this.TC1w[i])
        TC1t = this.TC1w[i];

      if (TC1s)
        break
    }

    if (TC1s)
      TC1u = TC1s - TC1m.valueOf();

    if (TC1t)
      TC1v = TC1m.valueOf() - TC1t;

    TC1x = TC1u == TC1v ? TC1s : (TC1u == 0 ? TC1t : (TC1v == 0 ? TC1s : (TC1u < TC1v ? TC1s : TC1t)));
    TC1e = new Date(TC1x)
  }

  return (TC1e)
}

function TC0D() {
  var TC0c = new TC0d();

  var TC1y = new Date(this.TC04);
  TC1y.setDate(1);
  TC1y.setDate(1 - (7 + TC1y.getDay() - this.TCB.weekstart) % 7);
  TC0c.TC0e('<table', this.TCO('gridtable'), '><tr>');

  for (var TC1z = 0; TC1z < 7; TC1z++)
      TC0c.TC0e('<td', this.TCO('wdaytitle'), '>', this.TCB.weekdays[(this.TCB.weekstart + TC1z) % 7], '</td>');

  TC0c.TC0e('</tr>');
  var TC20 = this.getDateFor(new Date(TC1y), true);

  while (TC20.getMonth() == this.TC04.getMonth() || TC20.getMonth() == TC1y.getMonth()) {
    TC0c.TC0e('<tr>');

    for (var TC21 = 0; TC21 < 7; TC21++) {
      TC0c.TC0e(this.TC0E(TC20));

      TC20.setDate(TC20.getDate() + 1)
    }

    TC0c.TC0e('</tr>\n')
  }

  TC0c.TC0e('</table>');
  return (TC0c.TC0g())
}

function TC0F(TC22) {
  var TC1n = new Date(TC22);

  var TC1H = this.TCW(TC1n), TC23;

  if (!(TC1H & 1))
    TC23 = 'dayforbidden';
  else if (TC1H & 16)
    TC23 = 'dayothermonth';
  else
    TC23 = 'daynormal';

  var TC24 = (TC1H & 1 ? '<a href="javascript: A_CALENDARS[\'' + this.TCC + '\'].TC0I(' + TC22.valueOf() + ');"' + this.TCO(
                                                                                                                   TC23)
                 + '>' + TC22.getDate() + '</a>' : '<span ' + this.TCO(TC23) + '>' + TC22.getDate() + '</span>');

  if (TC1H & 2)
    TC24 = '<span' + this.TCO('daytodaycell') + '>' + TC24 + '</span>';

  if (TC1H & 4 && (TC1H & 1))
    TC23 = 'dayselectedcell';
  else if (TC1H & 8)
    TC23 = 'dayweekendcell';
  else if (TC1H & 32) TC23 = 'daymarkedcell';
  else
    TC23 = 'daynormalcell';

  return '<td' + this.TCO(TC23) + '>' + TC24 + '</td>'
}

function TCX(TC22) {
  var TC0V = 1;

  TC1n = new Date(TC22);
  var TC1n = this.getDateFor(TC1n);
  var TC03 = new Date(this.TC03);
  var TC04 = new Date(this.TC04);

  if (this.b_allowed)
    TC0V = 0;

  if (this.getDateFor(TC03).valueOf() == TC1n.valueOf())
    TC0V |= 2;

  if (this.getDateFor(TC04).valueOf() == TC1n.valueOf())
    TC0V |= 4;

  if (TC1n.getDay() == 0 || TC1n.getDay() == 6)
    TC0V |= 8;

  if (TC1n.getMonth() != this.TC04.getMonth() || TC1n.getFullYear() != this.TC04.getFullYear())
    TC0V |= 16;

  if (this.a_marked[TC1n.valueOf()])
    TC0V |= 32;

  if (this.a_func && this.a_func[TC1n.valueOf()])
    TC0V |= 33554432;

  if (this.a_forbidden[TC1n.valueOf()]) {
    TC0V |= 64;
    TC0V&=~1
  }

  if (this.a_allowed[TC1n.valueOf()])
    TC0V |= 129;

  if (this.TC05) {
    if (TC1n.valueOf() < this.getDateFor(this.TC05).valueOf()) {
      TC0V |= 256;
      TC0V&=~1
    }

    if (TC22.valueOf() < this.TC05.valueOf())
      TC0V |= 1024;

    if (TC22.getMonth() == this.TC05.getMonth())
      TC0V |= 4096;

    if (TC22.getFullYear() == this.TC05.getFullYear())
      TC0V |= 8192;

    if (TC22.getHours() == this.TC05.getHours())
      TC0V |= 16384;

    if (TC22.getMinutes() == this.TC05.getMinutes())
      TC0V |= 32768;

    if (TC22.getSeconds() == this.TC05.getSeconds())
      TC0V |= 65536;
    if (TC22.getDate() == this.TC05.getDate())
      TC0V |= 4194304
  }

  if (this.TC06) {
    if (TC1n.valueOf() > this.getDateFor(this.TC06).valueOf()) {
      TC0V |= 512;
      TC0V&=~1
    }

    if (TC22.valueOf() > this.TC06.valueOf())
      TC0V |= 2048;

    if (TC22.getMonth() == this.TC06.getMonth())
      TC0V |= 131072;

    if (TC22.getFullYear() == this.TC06.getFullYear())
      TC0V |= 262144;

    if (TC22.getHours() == this.TC06.getHours())
      TC0V |= 524288;

    if (TC22.getMinutes() == this.TC06.getMinutes())
      TC0V |= 1048576;

    if (TC22.getSeconds() == this.TC06.getSeconds())
      TC0V |= 2097152;
    if (TC22.getDate() == this.TC06.getDate())
      TC0V |= 8388608
  }

  return TC0V
}

function dateMessage(TC1H, TC1J) {
  switch (TC1H) {
    case 'max_date':
      TC25 = ARR_STRINGS['max_date'].replace(/%max_date/g, this.TCe(this.TC06));
      break;
    case 'min_date':
      TC25 = ARR_STRINGS['min_date'].replace(/%min_date/g, this.TCe(this.TC05));
      break;
    case 'need_form_name':
      TC25 = ARR_STRINGS['need_form_name'];
      this.flag_error = true;
      break;
    case 'form_not_found':
      TC25 = ARR_STRINGS['form_not_found'].replace(/%form_name/g, TC1J);
      this.flag_error = true;
      break;
    case 'forbidden':
      TC25 = ARR_STRINGS['forbidden'].replace(/%forbidden_date/g, this.TCe(TC1J));
      break;
    case 'not_format':
      TC25 = ARR_STRINGS['not_format'];
      this.flag_error = true;
      break;
    default:
      TC25 = 'ERROR!!!';
      break
  }

  alert(TC25)
}

function TC0J(TC26) {
  var TC1J = true;

  this.TC0G('chislo', TC26);
  this.showcal();

  if (this.b_func) {
    var TC1n = new Date(TC26), TC1H = this.TCW(TC1n);
    if (TC1H & 33554432) {
      TC27 = this.a_func[this.getDateFor(TC1n).valueOf() + ''];
      if (TC27) {
        TC27(this.TCC, TC1n, TC26);
        TC1J = false
      }
    }
  }
  if (TC1J && this.initParams.onclickdayall && typeof (this.initParams.onclickdayall) == 'function') {
    TC27 = this.initParams.onclickdayall;
    TC27(this.TCC, TC1n, TC26)
  }
}

function setCalendarPosition() {
  var TC28 = 0, TC29 = 0;
  var offsetX = offsetY = 0;

  if (TC9.TC2A && TC9.TC2B) {
    if (document.body.leftMargin)
      TC28 = document.body.leftMargin * 1;
    if (document.body.topMargin)
      TC29 = document.body.topMargin * 1
  }

  this.caldiv.style.left = this.calPosImage.x ? this.calPosImage.x : (this.getOffset('Left') + TC28);
  this.caldiv.style.top  = this.calPosImage.y ? this.calPosImage.y : (this.getOffset('Top')  + TC29);
  this.caldiv.style.zIndex = this.calPosImage.style.zIndex + 2;

  //*********** to avoid scrolling - adjust position of the calendar so it displayes in the visible part of browser window
  var scrollXY = getScrollXY();
  var scrollX = scrollXY[0];
  var scrollY = scrollXY[1];

  var coords = getElementCoords(this.calPosImage);
  var left = coords.left;
  var top  = coords.top;

  var screenXY = getWindowSize();
  var screenX = screenXY[0];
  var screenY = screenXY[1];

  // Find out how close to the corner of the window
  var distanceToRightEdge  = screenX + scrollX - left;
  var distanceToBottomEdge = screenY + scrollY - top;

  // first position the div box in the top left corner in order to measure its dimensions
  // (otherwise, if position coirrectly and only then measure dimensions - the width/height will get cut off at the scroll boundary - at least in firefox 1.0)
  this.caldiv.style.display    = 'inline'; // must first make it 'inline' - otherwise div coords will be 0
  reposition(this.caldiv, 0, 0);

  var divCoords = getElementCoords(this.caldiv);
  var margin = 40;

  // this.caldiv.style.display    = 'none';   // must hide it again to avoid screen flicker

  // move box to the left of the hotspot if the distance to window border isn't enough to accomodate the whole div box
  if (distanceToRightEdge < divCoords.width + margin) {
    left = (screenX -  scrollX) - divCoords.width; // move menu to the left by its width and to the right by scroll value
    //alert("distanceToRightEdge = " + distanceToRightEdge + ", divCoords.width = " + divCoords.width + ", screenX = " + screenX + ", scrollX = " + scrollX);
    if (left - margin > 0)
      left -= margin; // adjust for a scrollbar;
  }
  else { // apply user requested offset only if no adjustment
    if (offsetX)
      left = left + offsetX;
  }

  // adjust position of the div box vertically - using the same approach as above
  if (distanceToBottomEdge < divCoords.height + margin) {
    top = (screenY + scrollY) - divCoords.height;
    if (top - margin > 0)
      top -= margin; // adjust for a scrollbar;
  }
  else { // apply user requested offset only if no adjustment
    if (offsetY)
      top = top + offsetY;
  }
  //*********** end adjusting position on screen

  reposition(this.caldiv, left, top);

  if (TC9.needIframe) {
    this.iframe.style.left   = this.caldiv.style.left;
    this.iframe.style.top    = this.caldiv.style.top;
    this.iframe.style.zIndex = this.caldiv.style.zIndex - 1;
  }
}

function getOffset(TC2C) {
  var TC2D = 0, TC2E = this.calPosImage;

  while (TC2E) {
    TC2D = TC2D + TC2E["offset" + TC2C];//mike

    TC2E = TC2E.offsetParent
  }

  return TC2D
}

function isShown() {
	this.shown = (this.caldiv.style.visibility == "hidden") ? false : true;
  return this.shown;
}

function showcal() {
  //if (!document.body || !document.body.innerHTML)
  //  return;

  //if (TC9.needIframe)
  //  var TC2F = String(this.iframe.style.visibility).toLowerCase();

  var TC2G = String(this.caldiv.style.visibility).toLowerCase();

  if (TC2G == 'visible' || TC2G == 'show') {
    this.shown = false;

    this.caldiv.style.visibility = 'hidden';

    if (TC9.needIframe) {
      this.iframe.style.visibility = 'hidden';
    }
//    if (this.TCG == 1) // icon is not used now
//      this.TC0o.src = this.TCB.caliconshow.src;
  }
  else {
    this.setCalendarPosition();

    if (this.TC0m.value) {
      TC2H = this.TCc(this.TC0m.value + '');
      if (TC2H.valueOf() != this.TC04.valueOf()) {
        TC2H = this.TCa(TC2H);

        this.TC04 = new Date(TC2H);
        this.TC0G('chislo');
      }
    }

    if (this.initParams.replace) {
      for (var i in A_CALENDARS) {
        var ac =A_CALENDARS[i];//mike
        if (ac.initialized == false)
          continue;
        if (i != this.TCC) {
          ac.caldiv.style.visibility = 'hidden';

          if (TC9.needIframe)
            ac.iframe.style.visibility = 'hidden';
//          if (ac.TCG == 1) // icon is not used now
//            ac.TC0o.src = ac.TCB.caliconshow.src;
        }
      }
    }

    this.caldiv.style.visibility = 'visible';

    if (TC9.needIframe) {
      thistcol=this.iframe.style;
      thistcol.width = this.caldiv.offsetWidth;

      thistcol.height = this.caldiv.offsetHeight;
      thistcol.visibility = 'visible';
    }

    this.shown = true;
//    if (this.TCG == 1) // icon is not used now
//      this.TC0o.src = this.TCB.caliconhide.src;
  }
}

function TCP(TC2I) {
  var TC2J = [], TC2K = this.TCB[TC2I];

  for (var TC2L in TC2K) TC2J[TC2J.length] = ' ' + TC2L + '="' + TC2K[TC2L] + '"';

  return TC2J.join('')
}

function TCV(TC2M, TC2N, TC2O, TC2P, TC2Q, TC2R) {
  var TC0a = new Date(TC2M);

  if (TC2O)
    TC0a.setFullYear(TC0a.getFullYear() + TC2O);

  if (TC2N) {
    TC0a.setMonth(TC0a.getMonth() + TC2N)
  }

  if (TC2P) {
    TC0a.setHours(TC0a.getHours() + TC2P)
  }

  if (TC2Q) {
    TC0a.setMinutes(TC0a.getMinutes() + TC2Q)
  }

  if (TC2R) {
    TC0a.setSeconds(TC0a.getSeconds() + TC2R)
  }

  if (!(TC2P || TC2Q || TC2R)) {
    if (TC0a.getDate() != TC2M.getDate()) {
      TC0a.setDate(0)
    }
  }

  return TC0a.valueOf()
}

function TCT(TC2S, TC2L) {
  var TC2T = 'a_' + TC2L;

  if (TC2L == 'func')
    var TC2U = TC2S;
  else
    var TC2U = TC2S[TC2L];

  this[TC2T] = {
  };

  if (TC2L == 'allowed') {
    this.TC1w = [];
    var TC2V = 0
  }

  if (!TC2U)
    return;

  this['b_' + TC2L] = true;

  if (TC2L == 'func') {
    for (var TC08 in TC2S) {
      if (TC2S[TC08]) {
        var TC2W = this.TCc(TC08);

        TC2W = this.getDateFor(TC2W).valueOf() + '';
        if (typeof (TC2S[TC08]) == 'function') {
          this[TC2T][TC2W] = TC2S[TC08]
        }
      }
    }
  }
  else {
    if (typeof (TC2U) != 'object')
      TC2U = [TC2U];

    for (var TC08 in TC2U) {
      if (TC2U[TC08]) {
        var TC22 = this.TCc(TC2U[TC08]);

        this[TC2T][String(this.getDateFor(TC22).valueOf())] = 1;
        if (TC2L == 'allowed') {
          this.TC1w[TC2V] = this.getDateFor(TC22).valueOf();
          TC2V++
        }
      }
    }
    if (TC2L == 'allowed')
      this.TC1w.sort()
  }
}


function getDateFor(TC2M, needTime) {
  var TC2X = new Date();

  if (TC2M)
    TC2X = new Date(TC2M);

  if (!needTime) {
    TC2X.setHours(0);

    TC2X.setMinutes(0);
    TC2X.setSeconds(0)
  }

  TC2X.setMilliseconds(0);
  return TC2X;
}

function getElementId(TC2Y, TC1J) {
  if (TC1J == 'form')
    TC2Z = document.forms[this.TCK].elements[TC2Y];
  else if (TC1J == 'img')
    TC2Z = document.all ? document.all[TC2Y] : document.images ? document.images[TC2Y] : document.getElementById(TC2Y);
  else
    TC2Z = document.all ? document.all[TC2Y] : document.getElementById(TC2Y);

  return TC2Z;
}

function TCL() {
  var b = navigator.appName;

  var v = this.version = navigator.appVersion;
  var TC0Z = /opera/;
  var TC2b = /opera.5/;
  var TC2c = this.TC2d = navigator.userAgent.toLowerCase();
  this.v = parseInt(v);
  this.TC2e = false;
  this.TC2f = (b == "Netscape");
  this.TC2A = (b == "Microsoft Internet Explorer");
  this.TC2a = TC0Z.exec(TC2c) ? true : false;

  if (this.TC2a) {
    this.TC2g = TC2b.exec(TC2c) ? true : false;

    this.TC2h = TC2c.indexOf("opera 6") > 0 ? true : false;
    this.TC2i = TC2c.indexOf("7") > 0 ? true : false
  }

  if (TC2c.indexOf("netscape") < 0 && TC2c.indexOf("msie") < 0 && TC2c.indexOf("opera") < 0 && this.v >= 5) {
    this.TC2e = true;
    this.TC2f = false
  }

  if (this.TC2f) {
    if (TC2c.indexOf('netscape/7.1') > 0)
      this.TC0b = true;
    else {
      this.v = parseInt(v);

      this.TC2j = (this.v == 4);
      this.TC2k = (this.v >= 5);
      this.TC0b = false
    }
  }
  else if (this.TC2A) {
    this.TC2l = this.TC2m = this.TC2n = this.needIframe = false;

    if (v.indexOf('MSIE 4') > 0) {
      this.TC2l = true;
      this.v = 4
    }
    else if (v.indexOf('MSIE 5') > 0) {
      this.TC2m = true;

      this.v = 5
    }
    else if (v.indexOf('MSIE 5.5') > 0) {
      this.TC2n = true;

      this.v = 5.5
    }
    else if (v.indexOf('MSIE 6') > 0) {
      this.needIframe = true;

      this.v = 6
    }
  }
  else if (this.TC2a || this.TC2e) {
    this.v = parseInt(v)
  }

  this.TC2o = TC2c.indexOf("win") > -1;
  this.TC2B = TC2c.indexOf("mac") > -1;
  this.TC2p = (!this.TC2o && !this.TC2B)
}

function TC2q(TC2r) {
  var TC1x = new Date(), i, TC2s = false;

  for (i in TC2r) {
    if (TC2.indexOf(TC2r[i][1]) != -1) {
      var TC2t = TC2r[i][1];

      if (TC2t == 'U')
        return new Date(TC2r[i][0] * 1000);

      if (TC2t == 'h')
        var value = TC4[TC2r[i][1]][2](TC2r[i][0], TC2r[TC8][0]);
      else
        var value = TC4[TC2r[i][1]][2](TC2r[i][0]);

      if (TC2t == 'd') {
        TC2s = true;
        TC2u = value
      }
      if (typeof (TC1x[TC4[TC2t][0]]) == 'function') {
        TC1x[TC4[TC2t][0]](value);
        if ((TC2t == 'm' || TC2t == 'M' || TC2t == 'F') && TC2s) {
          TC1x[TC4['d'][0]](TC2u)
        }
      }
    }
  }

  return TC1x
}

function TCf(TC2v) {
  var TCv, TCw = 0, TCx = [], i = 0, TC2w = '', TC2x = '';

  var TC1x = new Date(TC2v);

  do {
    TCv = this.dateformat.substr(i, 1);

    if (TC1.indexOf(TCv) != -1 && TCv != '') {
      if (TCv == 'A' || TCv == 'a')
        TC2x = new String(TC4[TCv][1](TC8));
      else if (TCv == 'U')
        return TC2v;
      else if (typeof (TC1x[TC4[TCv][1]]) != 'function') TC2x = new String(TC4[TCv][1](TC1x));
      else
        TC2x = new String(TC1x[TC4[TCv][1]]());

      if (TCv == 'h')
        TC8 = TC1x.getHours();
      TC2w += TC2x
    }
    else
      TC2w += TCv;

    i++
  }while (i < this.dateformat.length)

  return TC2w
}

function TCd(TC2y) {
  var TC2z = [], i, TCw = 1, a = this.TC01.exec(TC2y);

  if (!a || typeof (a) != 'object') {
    //alert(ARR_STRINGS['not_meet']);
    return new Date();
  }

  for (i in this.TCy) {
    if (this.TCy[i] == 'A' || this.TCy[i] == 'a')
      TC8 = i;

    TC2z[i] = [a[TCw++], this.TCy[i]]
  }

  TC8 = TC2z.length - 1 - TC8;
  TC27 = TC2q(TC2z.reverse());
  return TC27
}

function TC0d() {
  this.TC30 = [];

  this.TC0e = function() {
    var n = arguments.length;

    for (var i = 0; i < n; i++) this.TC30[this.TC30.length] = arguments[i]
  };

  this.TC0g = function() {
    return this.TC30.join('')
  }
}

function reposition(div, x, y) {
  var intLessTop  = 0;
  var intLessLeft = 0;
  var elm = div.offsetParent;

  // absolute elements become relative to a container with position:relative
  // so must decrease top, left
  while (elm && elm.offsetParent != null) {
    intLessTop  += elm.offsetTop;
    intLessLeft += elm.offsetLeft;
    elm = elm.offsetParent;
  }
  //alert(intLessLeft + "," + intLessTop + ", " + x + ", " + y);
  div.style.left = x - intLessLeft + 'px';
  div.style.top  = y - intLessTop  + 'px';
}


/*****************************************
* Calendar_popupHandler - closes a div on 
* 1. esc, 2. click outside, 3. mouse leaving
*****************************************/
var Calendar_popupHandler = {

	CLOSE_TIMEOUT : 500,
	popupDiv : null,
	iframe   : null,
	inputObj : null,
	oldOnKeyUp : null,
	timerid  : 0,
	
	_onkeyup : function(evt) {
		evt = (evt) ? evt : event;
		var charCode = (evt.charCode) ? evt.charCode : ((evt.keyCode) ? evt.keyCode : 
			((evt.which) ? evt.which : 0));
		if (charCode == 27)
			Calendar_popupHandler.closePopup();
	},
	_onkeyup_input : function(evt) {
			Calendar_popupHandler.closePopup();
	},
	_onmouseup : function(evt) {
		var evt = evt || window.event;
		var target = evt.target || evt.srcElement; 
		if (Calendar_popupHandler.contains(Calendar_popupHandler.popupDiv, target) == false )
			Calendar_popupHandler.closePopup();
	},

	_onmouseover : function(event) {
		var related;
		if (window.event) related = window.event.toElement;
		else related = event.relatedTarget;
		if (Calendar_popupHandler.popupDiv == related || Calendar_popupHandler.contains(Calendar_popupHandler.popupDiv, related))
			clearInterval(Calendar_popupHandler.timerid);
	},
	
	_onmouseout : function(event) {
		var related;
		if (window.event) related = window.event.toElement;
		else related = event.relatedTarget;
		if(related == null)
			return;
		if (Calendar_popupHandler.popupDiv != related && !Calendar_popupHandler.contains(Calendar_popupHandler.popupDiv, related)) {
			Calendar_popupHandler.timerid = setInterval(Calendar_popupHandler.suspendedClose, Calendar_popupHandler.CLOSE_TIMEOUT);
		}
	},
	
	contains : function (a, b) {// Return true if node a contains node b.
		if(a == null || b == null)
			return false;
		while (b.parentNode)
			if ((b = b.parentNode) == a) return true;
		return false;
	},
	
	suspendedClose : function() {
		clearInterval(Calendar_popupHandler.timerid);
		Calendar_popupHandler.closePopup();
	},
	
	closePopup : function() {
		if(this.popupDiv == null)
			return;
		this.popupDiv.style.visibility = "hidden";
		if(typeof this.iframe != "undefined")
			this.iframe.style.visibility = "hidden";
		this.end();
	},
	
	start : function(div, iframe, inputObj) {
		// only 1 popup can be opened concurrently
		if(this.popupDiv != null)
			this.closePopup();

		this.popupDiv = div;
		this.iframe	  = iframe;
		this.inputObj = inputObj;
		this.oldOnKeyUp = document.onkeyup;
		document.onkeyup = this._onkeyup;
		document.onclick = this._onmouseup;

		this.popupDiv.onmouseover = this._onmouseover;
		this.popupDiv.onmouseout  = this._onmouseout;
		
		this.inputObj.onkeyup = this._onkeyup_input;
	},
	
	end : function() { // end on selection; no hidding. 
		document.onkeyup = this.oldOnKeyUp;
		this.popupDiv.onmouseover = null;
		this.popupDiv.onmouseout = null;
		this.popupDiv = null;
	}
}

/**
 * Retrieves calendar using formName + name as a key.
 * If does not exist - creates one.
 */
function getCalendar(event,
                     formName,
                     name,             // date input field id and name
                     initialValue,     // initial value in date format shown below
                     dateFormat,       // dateFormat = (isEuropean) ? "d-m-Y" : "m-d-Y";
                     titleStr,	       // title text
                     sceduleUrlPart) { // scedule; - Day.java
 
   var DEFAULT_TITLE = "select a day";
   try {
    var cal = A_CALENDARS[formName + '_' + name];
    if (cal && cal.isShown()) {
      cal.showcal();
      return stopEventPropagation(event);
    }
    
    if(typeof titleStr == 'undefined')
		titleStr = DEFAULT_TITLE;
		
    var initParams = {
        // a name of HTML form containing the calendar
        'formname' : formName,
        // data format the calendar operates with
        'dataformat' : dateFormat,
        // whether to hide any other opened calendar if opening current one
        'replace' : true,
        'selected' : initialValue,
        'watch' : false,
        'controlname' : name,
        'title' : titleStr,
        'scedule' : sceduleUrlPart
    };
    cal = new calendar(initParams, CAL_TPL1);
    var div = document.getElementById(name + "_div");
    div.innerHTML = cal.createDiv();
    cal.create();
    A_CALENDARS[formName + '_' + name] = cal;
    cal.showcal();
  } catch (e) {
    alert(e);
  }
  return stopEventPropagation(event);
}
