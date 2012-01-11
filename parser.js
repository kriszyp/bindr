define(['./Cascade'], function(Cascade){
	return function(sheet, target){
		var inExtensions, inArray, context = {object: target, inArray: false}, stack = [context];
		var setName, namePaths;
		// parse the bindr sheet
		sheet.replace(/\s*([^;: }{[]*)([:;} \[\]{])/g, function(t, name, operator){
			var inSelector;
			if(name){
				var namePaths = name.split('/');
				if(!inExtensions){
					if(context.inArray && operator != ':'){
						// TODO: use context.object.createChild();
						target = context.object.get(Math.random());
					}else{
						if(name == 'from'){
							target = new Cascade;
							target.set('source', symbol = new Symbol(['this', 'source']));
							symbol.from = true;
						}else{
							target = context.object;
							for(var i = 0; i < namePaths.length; i++){
								target = target.get(namePaths[i]);
							}
						}
						if(context.inArray){
							context.object.push(target);
						}
					}
				}
				if(operator != ':'){
					// name { ...} is sugar for name: name { ...}
 					var resolution = (inExtensions ? target : target.parent).resolve(namePaths[0]);
					for(var i = 1; i < namePaths.length; i++){
						var dashIndex, namePath = namePaths[i].toLowerCase();
						while((dashIndex = namePath.indexOf('-')) > -1){
							namePath = namePath.substring(0, dashIndex) + namePath.charAt(dashIndex + 1).toUpperCase() + namePath.substring(dashIndex + 2);  
						}
						resolution = resolution.get(namePath);
					}
					target.extend(resolution);
				}
			}
			if(operator != '/'){
				symbol = null;
			}
			switch(operator){
				case " ": case "/":
					break;
				case ":":
					inExtensions = true;
					break;
				case "[":
				case "{":
					inExtensions = false;
					context = {object: target, inArray: operator == '['};
					stack.push(context);
					break;
				case ";":
					target = context.object;
					inExtensions = false;
					break;
				case "}": case "]":
					inExtensions = false;
					stack.pop();
					context = stack[stack.length - 1];
					target = context.object;
					break;
			};
		});
		if(stack.length > 1){
			throw new Error("Unclosed braces");
		}
		return context.object;
	};

});