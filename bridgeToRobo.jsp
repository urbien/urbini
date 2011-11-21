<div>
<bridgeToRobo />
<script type="text/javascript">
<![CDATA[   
  function tryRedirect(url) {
    var time = getUrlParam(window.location.href, "time");
    if (time && (new Date().getTime() - new Date(parseInt(time)).getTime() > (30 * 60 * 1000))) { // expires after 30 mins
      alert('This page has expired, please hit the Back Button and restart the purchase process.');
    }
    else {
      window.location = url;
    }
  }
]]>       
</script>
</div>