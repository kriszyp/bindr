define(['./Reactive', './Cascade', './parser', 'put-selector/put', 'compose/compose'], function(Reactive, Cascade, parser, put, Compose){
	var domMap = {
		scroll: 'div.bindr-scroll',
		table: 'table',
		text: 'input[type=text]',
		date: 'input[type=date]',
		span: 'span',
		div: 'div'
	}
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
					for(var i = 0; i < children.length; i++){
						children[i].then(function(child){
							element.appendChild(child)
						});
					}
					cascade.keys(function(key){
						if(key in divStyle){
							// TODO: make stylesheet rules for styles
						}else{
							// TODO: set attributes for non-style keys
							cascade.get(key).then(function(value){
								element[key] = value;
							});
						}
					});
						
				}
			});
		}
	});
	
	for(var i in domMap){
		var element = new DOMElement;
		element.selector = i;
		domContext.get(i).is(element);
	}
	function dbind(element, data, sheet){
		var root = new Cascade;
		var rootElement = new DOMElement;
		rootElement.element = element;
		root.extend(domContext);
		root.extend(rootElement);
		root.get("source").is(data);
		parser(sheet, root);
		return root;
	}
	return dbind;
});