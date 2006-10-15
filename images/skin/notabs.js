var gnurl = 'http://www.gurunet.com/';
var oldOMM;

function submitHandler(f_el,target,ts,p){
var val=f_el.s.value;
if (val && val.search(/\S/)!=-1) {
	if (location.pathname.indexOf("/answers/")==0) return true;
    if (val=="robots.txt"||val=="favicon.ico") val = '"'+val+'"';
	var func = typeof(encodeURIComponent) != "undefined" ? encodeURIComponent : escape;
	var url = location.protocol + "//" + (ts?ts:location.host) + "/" + func(val) + (p?"?"+p:"");
	if (target){window.open(url,target);}
	else location.href = url;
}
return false;
}

function setFocus() {
	if (document.getElementById)
		document.getElementById("s").focus();
	return 1;
}
// google websearch page functions
function setStatus(url){window.status = url; return true;}
function clearStatus(){window.status = '';}
function gotoURL(url){window.location = url; return true;}

function addLinkTextToHref(f_el) {
var href=f_el.href;
if (href.indexOf("?") > 0)
	href += "&";
else
	href += "?";
f_el.href = href + "linktext=" + encodeURIComponent(f_el.innerHTML);
}
function showHide_TellMeAbout2(hide){
	searchBox = document.getElementById("s");
	var val=searchBox.value;
	searchBox.style.backgroundImage = ((hide || val && val.search(/\S/)!=-1) ? "url(/main/images/empty_box.gif)" : "url(/main/images/tell_me_about.gif)");
}
function prepImgs(up,su) {
answersD = new Image(); answersD.src=up+su+"/images/lookup_answers_d.gif";
answersU = new Image(); answersU.src = up+su+"/images/lookup_answers.gif";
webD = new Image(); webD.src=up+su+"/images/lookup_web_d.gif";
webU = new Image(); webU.src=up+su+"/images/lookup_web.gif";
shopD = new Image(); shopD.src=up+su+"/images/lookup_shop_d.gif";
shopU = new Image(); shopU.src=up+su+"/images/lookup_shop.gif";
return true;
}
function changeImg(obj,img,ud){obj.src=img.src}

function showHide_TellMeAbout(hide){
searchBox = document.getElementById("s");
if(hide == "true")
	searchBox.style.backgroundImage = "url(/main/images/empty_box.gif)";
else
	searchBox.style.backgroundImage = (searchBox.value == "" ? "url(/main/images/tell_me_about.gif)" : "url(/main/images/empty_box.gif)");
}
