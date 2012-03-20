define(['./Cascade', './ReactiveObject', './env', './parser', 'put-selector/put', 'compose/compose'], function(Cascade, ReactiveObject, env, parser, put, Compose){
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
	var get = Cascade.get;
	var extraSheet = put(document.getElementsByTagName("head")[0], "style");
	es = extraSheet = extraSheet.sheet || extraSheet.styleSheet;
	var divStyle = put("div").style;
	var ua = navigator.userAgent;
	var vendorPrefix = ua.indexOf("WebKit") > -1 ? "-webkit-" :
		ua.indexOf("Firefox") > -1 ? "-moz-" :
		ua.indexOf("MSIE") > -1 ? "-ms-" :
		ua.indexOf("Opera") > -1 ? "-o-" : "";

	var domContext = new Cascade;
	var domElementValue = function(selector){
		return function(callback){
			var element = this.element;
			var parent = this.parent;
			if(!element){
				element = this.element = put(selector);
				var className = getCSSClass(parent, function(className){
					element.className += ' ' + className;
				});
				element.className += ' ' + className; 
			}
			parent.get("children", function(children){
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
							});
							lastChild || (lastChild = put(element, 'span.dbind-loading', 'Loading...'));
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
			});
			function getCSSClass(cascade, callback){
				var bases = callback && cascade.bases;
				if(bases){
					for(var i = 0; i < bases.length; i++){
						callback(getCSSClass(bases[i]));
					}
				}
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
						var bases = child.bases;
						if(!set && bases){
							// we use the path name if no value was provided
							ruleStyle[key] = bases[bases.length - 1].key;
							console.log(selector + " { " + key + ": " + bases[bases.length - 1].key + "}");
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
		};
	};
	for(var i in domMap){
		var cascade = new Cascade;
		var element = get(cascade,"element");
		element.getValue = domElementValue(domMap[i]); 
		domContext[i] = cascade;
	}
	env(domContext);
	function dbind(element, data, sheet){
		var root = createRoot(element);
		if(data){
			root.source = new ReactiveObject(data);
		}
		parser({text: sheet}, root);
		return root.get("element");
	}
	function createRoot(element){
		var root = new Cascade;
		var rootElement = root.get("element");
		rootElement.element = element;
		rootElement.getValue = domElementValue();
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