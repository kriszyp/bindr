define(['./Transform'], function(Transform){
	var Symbol = Transform.Symbol;
	function Cascade(){
		return {
			create: function(){},
			get: function(name, input){
				
			}
		}
	}
	/*function resolveName(name, stack){
		stack = stack.slice(0);// make a copy so it won't change
		var result;
		return new Varying(function(provide){
			var i = stack.length;
			function next(){
				i--;
				var nextHandle, result;
				var handle = stack[i].get(name).then(function(value){
					result = value;
					if(result === undefined){
						// not a value, need to go to the next
						if(!nextHandle && i){
							nextHandle = next();
						}
					}else{
						// got a value, remove lower listeners, don't need them anymore
						if(nextHandle){
							nextHandle.remove();
						}
						provide(value);
					}
				});
				return {
					remove: function(){
						i++;
						handle.remove();
						nextHandle && nextHandle.remove();
					}
				};
			}
			return next();
		});
		return varying;
	}*/
	return function(jss, model){
		/*if(!(model instanceof DOMContext)){
			model = new DOMContext(model);
		}*/

		var target, symbol, inArray, context = {object: model, inArray: false}, stack = [context];
		var setName;
		jss.replace(/\s*(\/)?([^;: {[]*)([:;} \[\]{])/g, function(t, slash, name, operator){
			var inSelector;
			if(name && operator != ':'){
				if(target){
					target.extend(symbol = new Symbol(name));
				}else{
					if(name == 'from'){
						target = new Transform;
						target.set('source', symbol = new Symbol(['this', 'source']));
						symbol.from = true;
					}else{
						target = context.object.get(name);
						target.extend(symbol = new Symbol(name));
					}
					if(context.inArray){
						context.object.push(target);
					}
					//symbol.names.push(name);
				}
			}
			if(operator != '/'){
				symbol = null;
			}
			switch(operator){
				case " ": case "/":
					break;
				case ":":
					context.object.set(name, target = new Transform);
					//target = target.get(name);
					//inSelector = true;
//						setName = name;
					break;
				/*case "+":
					target.addChild(target = new Cascade);
					break;*/
				case "[":
				case "{":
					inArray = operator == '[';
					if(target){	
						var newContext = new Transform;
						newContext.extend(target);
						newContext.extend(context);
						context = {object: newContext, inArray: inArray};
						target = null;
					}
					/*var value = name ? resolveName(name, stack) : target.create();
					if(setName){
						target.set(setName, value);
					}else{
						target.put(value);
					}
					context = target = value;*/
					stack.push(context);
					break;
				case ";":
					target = null;
					/*var value = resolveName(name, stack);
					if(setName){
						if(!props){
							props = new Properties();
							target.insert(props);
						}
						props.set(setName, value);
					}else{
						props = null;
						target.insert(value);
					}
					target = context;
					inSelector = false;*/
					break;
				case "}": case "]":
					stack.pop();
					context = stack[stack.length - 1];
					break;
			};
		});
		if(stack.length){
			throw new Error("Unclosed curly braces");
		}
		return model;
	};

});