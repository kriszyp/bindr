define(['./dbind',  './parser', 'dojo/domReady!'], function(dbind, parser){
	function search(tag){
		var elements = document.getElementsByTagName(tag);
		for(var i = 0; i < elements.length; i++){
			scanSheetElement(elements[i]);
		}
	}
	var root = dbind.createRoot(document.body);
	function scanSheetElement(element){
		var sheet = element.sheet || element.styleSheet, 
			cssRules = sheet.rules || sheet.cssRules;
		for(var i = 0; i < cssRules.length; i++){
			var rule = cssRules[i];
			if(rule.selectorText == "x-dbind"){
				var url = rule.href;
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
				return;
			}
		}
	}
	search("link");
	search("style");
	root.then(function(){});// trigger the start
	function request(baseUrl){
		return function(url, callback){
			url = absoluteUrl(baseUrl, url);
			get(url, function(text){
				callback({
					text: text,
					request: request(url)
				});
			});
		};
	}
	function get(url, callback){
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
	
});