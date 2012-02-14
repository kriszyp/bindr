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
	var domContext = new Reactive;
	var DOMElement = Compose(Reactive, {
		then: function(callback){
			var selector = this.selector;
			var element = this.element;
			callback({
				create: function(cascade){
					if(!element){
						element = cascade.element || (cascade.element = put(selector));
					}
					var parent = cascade.parent;
					var children = parent.children;
					if(children){
						for(var i = 0; i < children.length; i++){
							children[i].get("element").then(function(child){
								if(typeof child == "string"){
									// eventually do this for any non-element, I think
									child = document.createTextNode(child);
								}
								element.appendChild(child);
							});
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
		var root = new Cascade;
		var rootElement = new DOMElement;
		rootElement.element = element;
		root.get("element").extend(rootElement);
		root.parent = domContext;
		root.get("source").extend(new ReactiveObject(data));
		parser(sheet, root);
		return root.get("element");
	}
	return dbind;
});