// once loaded, we read the innerHTML of the element with the bindr source
// note that we can use good ol' onload because there should be no images to wait for
onload = function(){
	var source = document.getElementById("__bindr_source").innerHTML;
	//document.body.innerHTML = ""; // clear the body
	require('bindr/scan')(source);
};
// now we load the loader, put up a loading message, create a space for the bindr source below 
document.write('<body><script src="../../dojo/dojo.js" data-dojo-config="async: true, manualScan: true, bindrAllSheets: true, deps: [\'bindr/scan\']"></script><div id="__bindr_source" style="display: none">');
