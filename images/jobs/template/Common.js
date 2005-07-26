function preloadImages() {
	if (document.images) {
		var imgFiles = preloadImages.arguments;
		var preloadArray = new Array();
		for (var i=0; i<imgFiles.length; i++) {
			preloadArray[i] = new Image;
			preloadArray[i].src = imgFiles[i];
		}
	}
}
	
function imageSwap(sImageName, sImageSRC) {
	document.images[sImageName].src = sImageSRC;
}

function CB_OpenWindow(url, parms) {	
	if (parms=='') parms = 'width=700,height=500,resizable=1,left=10,top=10,toolbar,status,scrollbars,menubar,location';
	newWin = window.open ( url, 'wndNew', parms)
}
