<td valign="top" id="ropRight" style="border-left: 1px solid #eeeeee">
<div>
  <!--siteResourceList uri="l.html?-$action=searchLocal&amp;type=http://www.hudsonfog.com/voc/model/social/IntentMessage&amp;-list=y&amp;-title=Messages&amp;forResource=-$this&amp;-asc=-1&amp;limit=10&amp;$order=lastComment&amp;-viewCols=submitted,lastComment.description,lastCommentTime,comments&amp;-gridCols=submitted,lastComment.description,lastCommentTime,comments&amp;-suppressHeader=y&amp;-adTitle=Negotiations&amp;-sidebar=right"/-->
  <div style="white-space: nowrap; padding: 5px"><text text="Call and they will come!" /> </div>
  <property name="-$me.messages" suppressHeader="y" order="lastCommentTime" filter="forResource" />
<br />
<script>
var tips=new Array();

//Configure the below array to hold the 31 possible tips of the month

var randomIdx;
var links = '&lt;br /&gt;&lt;a href=&quot;javascript:previousTip();&quot; style=&quot;font-size:30px&quot;&gt;&amp;#x25C2;&lt;/a&gt;&lt;a href=&quot;javascript:nextTip();&quot; style=&quot;font-size:30px&quot;&gt;&amp;#x25B8;&lt;/a&gt;';
function initTips() {
  randomIdx = Math.floor(Math.random()*tips.length);
  var i = 0;
  var hasMore = true;
  while (hasMore) { 
    var tip = document.getElementById('tip' + i);
    if (tip == null) {
      hasMore = false;
    }
    else {
      tips.push(tip);
      i++;
    }
  }
  randomTip();
}
  
function randomTip() {
  randomIdx= Math.floor(Math.random()*tips.length);
  var a = document.getElementById('usefulTip');
  a.innerHTML = tips[randomIdx].innerHTML + links;
}
function nextTip() {
  randomIdx = (++randomIdx) % tips.length;
  var a = document.getElementById('usefulTip');
  a.innerHTML = tips[randomIdx].innerHTML + links;
}
function previousTip() {
  randomIdx--;
  if (randomIdx &lt; 0) {
    randomIdx = randomIdx + tips.length;
  }
  var a = document.getElementById('usefulTip');
  a.innerHTML = tips[randomIdx].innerHTML + links;
}

setTimeout('initTips()',0);

</script>
<div id="usefulTip" class="tip"></div>
<div id="tip0" class="hidden-tip"><b><text text="TIP:"/> </b><text text="ALL last names are made up and for every coupon you'll get a random new one. It's fun!" />
<text text="Maybe this time your last name is Friendly and you Call everyone in range of your mouse. And then some other time you're McLowStandards and you can just be yourself. No wait...that's us." /></div>
<div id="tip1" class="hidden-tip"><b><text text="TIP:"/></b> <text text="Calling a stranger sounds waaay extroverted. Some of us don't even call our parents. Don't worry! Just cause you called them doesn't mean you have to marry them. You can always ignore them later."/></div>
<div id="tip2" class="hidden-tip"><b><text text="TIP:"/></b> <text text="Forget stalkers, your private information is under lock and key and the key is under lock too."/></div>
</div>
</td>