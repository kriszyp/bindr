define(['./Reactive', './Cascade', './parser', 'put-selector/put', 'compose/compose'], function(Reactive, Cascade, parser, put, Compose){
	var domMap = {
		scroll: 'div.bindr-scroll',
		table: 'table',
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
					
					var children = cascade.children;
					if(children){
						for(var i = 0; i < children.length; i++){
							children[i].then(function(child){
								element.appendChild(child)
							});
						}
					}else{
						cascade.get("content").then(function(value){
							if(value !== undefined){
								element.innerHTML = value;
							}
						});
					}
					cascade.keys(function(child){
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
		var element = new DOMElement;
		element.selector = domMap[i];
		domContext[i + '-'] = element;
	}
	function dbind(element, data, sheet){
		var root = new Cascade;
		var rootElement = new DOMElement;
		rootElement.element = element;
		root.parent = domContext;
		root.extend(rootElement);
		root.get("source").is(data);
		parser(sheet, root);
		return root;
	}
	return dbind;
});