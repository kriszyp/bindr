define(['./Cascade', 'put-selector/put'], function(Cascade, put){
	var get = Cascade.get;
	var keys = Cascade.keys;
	var allKeys = Cascade.allKeys;
	var extraSheetNode = put(document.getElementsByTagName("head")[0], "style");
	var extraSheet = extraSheetNode.sheet || extraSheetNode.styleSheet;
es = extraSheet;
	var divStyle = put("div").style;
	var ua = navigator.userAgent;
	var cssConversionTimeout;
	var vendorPrefix = ua.indexOf("WebKit") > -1 ? "-webkit-" :
		ua.indexOf("Firefox") > -1 ? "-moz-" :
		ua.indexOf("MSIE") > -1 ? "-ms-" :
		ua.indexOf("Opera") > -1 ? "-o-" : "";

	var domContext = new Cascade;
	var exports = {
		apply: function(target, args){
			var selector = args[0] + '';
			target["-element"] = {
				getValue: exports.makeGetValue(selector)
			};
			target.get = function(key){
				console.log("element get " + key);
				return this[key] || (this[key] = new Cascade);
			}
		},
		makeGetValue: function(selector, inputType){
			return function(callback){
				var element = this.element;
				var parent = this.parent;
				if(!element){
					element = this.element = put(selector);
					if(inputType){
						element.type = inputType;
					}
					var className = getCSSClass(parent, function(className){
						element.className += ' ' + className;
					});
					element.className += ' ' + className; 
				}
				get(parent, "children", function(children){
					if(children){
						for(var i = 0; i < children.length; i++){
							(function(child){
								var lastChild;
								get(child, "-element", function(childElement){
									if(childElement){
										lastChild ? 
											element.replaceChild(childElement, lastChild) :
											element.appendChild(childElement);
										lastChild = childElement;
									}else{
										// if there is no element wrapper, we just get the main value and insert it as a plain text node
										get(child, function(value){
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
						get(parent, function(value){
							if(element.tagName == "INPUT"){
								element.value = value;
								if(parent.put){
									element.onchange = function(){
										var newValue = element.value;
										if(typeof value == "number" && !isNaN(newValue)){
											newValue = +newValue;
										}
										parent.put(value = newValue);
									};
								}else{
									element.readOnly = true;
								}
							}else{
								if(value !== undefined){
									// TODO: use polymorphism here
										element.innerHTML = value;
								}
							}
						});
					}
				});
				allKeys(parent, function(key){
					if(key.slice && key.slice(0,2) == "on"){
						// event handlers are handled as time varying values with a value that matches the last event
						exports.on(element, key.slice(2), function(event){
							get(parent, key, function(value){
								value(event);
							});
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
					keys(cascade, function(key){
						var child = cascade[key];
						if(isNaN(key) && (key in divStyle || (key = vendorPrefix + key) in divStyle)){
							if(!ruleStyle){
								var rules = extraSheet.cssRules || extraSheet.rules;
								ruleStyle = rules[extraSheet.addRule ?
										(extraSheet.addRule('.' + selector, ""), rules.length -1) : extraSheet.insertRule('.' + selector + "{}", rules.length)].style;
							}
							var set;
							get(child, function(value){
								if(typeof value == "number"){
									// by default we use pixels as the unit
									value = value + "px";
								}
								ruleStyle[key] = set = value;
/*if(!cssConversionTimeout){
	cssConversionTimeout = setTimeout(function(){
		cssConversionTimeout = false;
		// this is to reconvert the stylesheet so that webkit inspector can read it 
		styleSheet = document.createElement("style");
		styleSheet.setAttribute("type", "text/css");
		var css = '';
		for(var i= 0;i < extraSheet.cssRules.length; i++){
			css += extraSheet.cssRules[i].cssText + "\n";
		}
		console.log("updated css " + css);
		styleSheet.appendChild(document.createTextNode(css));
		var head = document.head;
		head.replaceChild(styleSheet, extraSheetNode);
		extraSheetNode = styleSheet;
		extraSheet = styleSheet.sheet;
	}, 500);
}*/
							});
							var bases = child.bases;
							if(!set && bases){
								// we use the path name if no value was provided
								ruleStyle[key] = bases[bases.length - 1].key;
//console.log(selector + " { " + key + ": " + bases[bases.length - 1].key + "}");
							}
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
		}
	};
	exports.on = function(element, type, listener){
		// very simple event listener functionality
		element['on' + type] = listener;
	}
	return exports;
});