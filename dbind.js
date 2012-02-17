define(['./Reactive', './Cascade', './ReactiveObject', './parser', 'put-selector/put', 'compose/compose'], function(Reactive, Cascade, ReactiveObject, parser, put, Compose){
	var domMap = {
		scroll: 'div.bindr-scroll',
		table: 'table',
		label: 'label',
		text: 'input[type=text]',
		date: 'input[type=date]',
		span: 'span',
		div: 'div'
	}
	var strings = ["green", "bold"];
	var divStyle = put("div").style;
	var ua = navigator.userAgent;
	var vendorPrefix = ua.indexOf("WebKit") > -1 ? "-webkit-" :
		ua.indexOf("Firefox") > -1 ? "-moz-" :
		ua.indexOf("MSIE") > -1 ? "-ms-" :
		ua.indexOf("Opera") > -1 ? "-o-" : "";

	var domContext = new Reactive;
	var DOMElement = Compose(Reactive, {
		then: function(callback){
			var selector = this.selector;
			var element = this.element;
			callback({
				create: function(cascade){
					var parent = cascade.parent;
					if(!element){
						element = cascade.element || (cascade.element = put(selector));
						element.className = getCSSClass(parent);
					}
					var children = parent.children;
					if(children){
						for(var i = 0; i < children.length; i++){
							(function(child){
								var lastChildElement;
								child.get("element").then(function(childElement){
									if(lastChildElement){
										element.removeChild(lastChildElement);
									}
									lastChildElement = childElement;
									if(childElement){
										element.appendChild(childElement);
									}else{
										// if there is no element wrapper, we just get the main value and insert it as a plain text node
										child.then(function(value){
											element.appendChild(document.createTextNode(value));
										});
									}
								})
							})(children[i]);
						}
					}else{
						parent.then(function(value){
							if(value !== undefined){
								// TODO: use polymorphism here
								if(element.tagName == "INPUT"){
									element.value = value;
									element.onchange = function(){
										var newValue = element.value;
										if(typeof value == "number" && !isNaN(newValue)){
											newValue = +newValue;
										}
										parent.put(value = newValue);
									};
								}else{
									element.innerHTML = value;
								}
							}
						});
					}
					function getCSSClass(cascade, callback){
						cascade.eachBase(function(base){
							
						});
						var selector = getCSSClass(cascade.parent) + "-" + cascade.key;
						cascade.keys(function(child){
							var style = (sheet.cssRules || sheet.rules)[sheet.addRule ?
								sheet.addRule(selector, "") : sheet.insertRule(selector + "{}", this.cssRules.length)].style;
							var key = child.key;
							if(key in style || (key = vendorPrefix + key) in style){
								child.then(function(value){
									style[key] = value;
								}); 
							}
							
						});
						return selector;
					}
					parent.keys(function(child){
						if(child.key in divStyle){
							// TODO: make stylesheet rules for styles
							child.then(function(value){
								element.style[child.key] = value;
							}); 
						}else{
							// TODO: set attributes for non-style keys
							child.then(function(value){
								element[child.key] = value;
							});
						}
					});
					return element;
				}
			});
		}
	});
	for(var i = 0; i < strings.length; i++){
		var string = strings[i];
		domContext.get(string).is(string);
	}
	for(var i in domMap){
		var cascade = new Cascade;
		var element = cascade['element-'] = new DOMElement; 
		element.selector = domMap[i];
		domContext[i + '-'] = cascade;
	}
	function dbind(element, data, sheet){
		var root = createRoot(element);
		if(data){
			root.get("source").extend(new ReactiveObject(data));
		}
		parser({text: sheet}, root);
		return root.get("element");
	}
	function createRoot(element){
		var root = new Cascade;
		var rootElement = new DOMElement;
		rootElement.element = element;
		root.get("element").extend(rootElement);
		root.parent = domContext;
		return root;
	}
	dbind.createRoot = createRoot;
	return dbind;
});