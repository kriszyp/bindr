define(['./Reactive', './Cascade', './ReactiveObject', './env', './parser', 'put-selector/put', 'compose/compose'], function(Reactive, Cascade, ReactiveObject, env, parser, put, Compose){
	var domMap = {
		scroll: 'div.bindr-scroll',
		button: 'button',
		table: 'table',
		label: 'label',
		"text-box": 'input[type=text]',
		"password": 'input[type=password]',
		date: 'input[type=date]',
		span: 'span',
		div: 'div'
	}
	var extraSheet = put(document.getElementsByTagName("head")[0], "style");
	es = extraSheet = extraSheet.sheet || extraSheet.styleSheet;
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
						var className = getCSSClass(parent, function(className){
							element.className += ' ' + className;
						});
						element.className += ' ' + className; 
					}
					var children = parent.children;
					if(children){
						for(var i = 0; i < children.length; i++){
							(function(child){
								var lastChild;
								child.get("element").then(function(childElement){
									if(childElement){
										lastChild ? 
											element.replaceChild(childElement, lastChild) :
											element.appendChild(childElement);
										lastChild = childElement;
									}else{
										// if there is no element wrapper, we just get the main value and insert it as a plain text node
										child.then(function(value){
											var newChild = document.createTextNode(value);
											lastChild ? 
												element.replaceChild(newChild, lastChild) :
												element.appendChild(newChild);
											lastChild = newChild;
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
						callback && cascade.eachBase && cascade.eachBase(function(base){
							callback(getCSSClass(base));
						});
						var selector = (cascade.key && cascade.key.charAt && cascade.key.charAt(0) == '.') ? cascade.key.slice(1) : 
							((cascade.isRoot || !cascade.parent) ? "dbind" : getCSSClass(cascade.parent) + "-" + ('' + (cascade.key)).replace(/\./g, '_'));
						var ruleStyle;
						cascade.keys(function(child){
							var key = child.key;
							if(isNaN(key) && (key in divStyle || (key = vendorPrefix + key) in divStyle)){
								if(!ruleStyle){
									var rules = extraSheet.cssRules || extraSheet.rules;
									ruleStyle = rules[extraSheet.addRule ?
											(extraSheet.addRule('.' + selector, ""), rules.length -1) : extraSheet.insertRule('.' + selector + "{}", rules.length)].style;
								}
								var set;
								child.then(function(value){
									ruleStyle[key] = set = value;
								});
								if(!set && child.bases){
									// we use the path name if no value was provided
									ruleStyle[key] = child.bases[0].path;
								}
							}
							if(key.slice && key.slice(0,2) == "on"){
								// event handlers are handled as time varying values with a value that matches the last event
								dbind.on(element, key.slice(2), function(event){
									child.is(event);
								});
							}
						});
						return selector;
					}
/*					parent.keys(function(child){
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
					});*/
					return element;
				}
			});
		}
	});
	for(var i in domMap){
		var cascade = new Cascade;
		var element = cascade['element-'] = new DOMElement; 
		element.selector = domMap[i];
		domContext[i + '-'] = cascade;
	}
	env(domContext);
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
		root.isRoot = true;
		return root;
	}
	dbind.createRoot = createRoot;
	dbind.on = function(element, type, listener){
		element.addEventListener(type, listener, false);
	}
	return dbind;
});