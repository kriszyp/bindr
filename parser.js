define(['./Reactive', './Cascade'], function(Reactive, Cascade){
	var parser = function(sheet, target){
		var inExtensions, inArray, context = {object: target, inArray: false}, stack = [context];
		var setName, namePaths, sheetText = sheet.text;
		sheetText = sheetText.replace(/\/\*.*?\*\//g,''); // remove comments, TODO: this would be better as part of the main parser for better performance and to maintain line numbers
		// parse the bindr sheet
		sheetText.replace(/\s*@([\w-]+)|("(?:\\.|[^"])+")|([^;,: }{\][+]*)\s*([:,;}+ \[\]{])/g, function(t, directive, string, name, operator){
			if(directive){
				var directiveHandler = directives[directive];
				if(!directiveHandler){
					throw Error("Directive " + directive + " not supported");
				}
				target = directiveHandler(target, sheet);
			}
			var inSelector;
			if(string){
				// a string is encountered
				var reactive = new Reactive();
				reactive.is(eval(string)); // TODO: don't really want to do an eval, could use JSON parser
				if(context.inArray && !inExtensions){
					target = context.object.get(Math.random());
					context.object.push(target); 
				}
				target.extend(reactive);
			}
			if(name){
				var namePaths = name.split('/');
				if(!inExtensions){
					if(context.inArray && operator != ':'){
						// TODO: use context.object.createChild();
						target = context.object.get(Math.random());
						context.object.push(target);
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
 					var resolution = (inExtensions || context.inArray ? target : target.parent).resolve(namePaths[0]);
					for(var i = 1; i < namePaths.length; i++){
						var dashIndex, namePath = namePaths[i].toLowerCase();
						while((dashIndex = namePath.indexOf('-')) > -1){
							namePath = namePath.substring(0, dashIndex) + namePath.charAt(dashIndex + 1).toUpperCase() + namePath.substring(dashIndex + 2);  
						}
						namePaths[i] = namePath;
					}
					target.extend(resolution, namePaths);
				}
			}
			if(operator != '/'){
				symbol = null;
			}
			switch(operator){
				case " ": case "/":
					break;
				case ":": case "+":
					inExtensions = true;
					break;
				case "[":
				case "{":
					inExtensions = false;
					context = {object: target, inArray: operator == '['};
					stack.push(context);
					break;
				case ";": case ",":
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
	var directives = parser.directives = {};
	directives["import"] = function(object, sheet){
		var target = new Cascade;
		// tell the object to wait for this import
		object.waitFor(function(callback){
			// get the URL from the target
			target.then(function(value){
				// request the next sheet
				sheet.request(value, function(nextSheet){
					// parse it
					parser(nextSheet, object);
					callback();
				});
			});
		});
		return target; 
	};	
	return parser;
});