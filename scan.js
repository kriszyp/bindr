define(['./dbind',  './parser', './Cascade', 'dojo/has'], function(dbind, parser, Cascade, has){
	var root, get = Cascade.get;
	function search(tag){
		var elements = document.getElementsByTagName(tag);
		for(var i = 0; i < elements.length; i++){
			scanSheetElement(elements[i]);
		}
	}
	function scanSheetElement(element){
		if(element.getAttribute("data-bindr") || has('config-bindrAllSheets')){
			var url = element.href;
			// an extension is used, needs to be parsed
			if(url){
				// we use sync XHR because we assume the file is in the cache, and sync is faster when it comes from the cache
				var text = get(url); 
			}else{
				text = element.innerHTML;
			}
			parser({
				text: text,
				request: request(url || "")
			}, root);
		}
	}
	function scan(source){
		root = dbind.createRoot(document.body);
		if(source){
			parser({
				text: source,
				request: request("")
			}, get(root, "source"));
		}
		search("link");
		search("style");
		get(root, "-element", function(){});// trigger the start
	}
	if(!has("config-manualScan")){
		require(["dojo/domReady!"], function(){
			scan();
		});
	}
	function request(baseUrl){
		return function(url, callback){
			url = absoluteUrl(baseUrl, url);
			retrieve(url, function(text){
				callback({
					text: text,
					request: request(url)
				});
			});
		};
	}
	function retrieve(url, callback){
		var xhr = new XMLHttpRequest;
		xhr.open("GET", url, !!callback);
		xhr.send();
		if(callback){
			xhr.onreadystatechange = function(){
				if(xhr.readyState == 4){
					callback(xhr.responseText);
				}
			}
		}
		return xhr.responseText;
	}
	function absoluteUrl(base, url) {
		if(!url || url.indexOf(":") > 0 || url.charAt(0) == '/'){
			return url;
		}
		// in IE we do this trick to get the absolute URL
		var lastUrl;
		url = ((base || location.toString()).replace(/[^\/]*$/,'') + url).replace(/\/\.\//g,'/');
		while(lastUrl != url){
			lastUrl = url;
			url = url.replace(/\/[^\/]+\/\.\.\//g, '/');
		}
		return url;
	}
	return scan;
});