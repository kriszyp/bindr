define(['./Cascade'], function(Cascade){
	var get = Cascade.get;
	var newChild = Cascade.newChild;
	var parser = function(sheet, target){
		var inExtensions, inArray, context = {object: target, inArray: false}, stack = [context];
		var setName, namePaths, sheetText = sheet.text;
		sheetText = sheetText.replace(/\/\*[\w\W]*?\*\/|<[^\n]*/g,''); // remove comments, TODO: this would be better as part of the main parser for better performance and to maintain line numbers
		// parse the bindr sheet
		sheetText.replace(/\s*(?:@([\w-]+)|("(?:\\.|[^"])+"|'(?:\\.|[^'])+')|([-\._\w][-\._\w\/]*))?\s*([:,;}+ \)\(\[\]{])/g, function(t, directive, string, name, operator, offset){
			if(directive){
				var directiveHandler = directives[directive];
				if(!directiveHandler){
					throw Error("Directive " + directive + " not supported");
				}
				target = directiveHandler(target, sheet);
				inExtensions = true;
			}
			var inSelector;
			if(string || !isNaN(name)){
				// a string is encountered
				//var reactive = new Reactive();
				//reactive.
				if(context.inArray && !inExtensions){
					target = context.object.newChild ? context.object.newChild() : newChild(context.object);
				}
				target.is(eval(string || name)); // TODO: don't really want to do an eval, could use JSON parser
			}
			else if(name){
				var namePaths = name.split('/');
				if(namePaths[0] == "this"){
					namePaths.shift();
					namePaths.depth = 0;
				}
				if(operator == ":"){
					target = context.object;
					for(var i = 0; i < namePaths.length; i++){
						target = get(target, namePaths[i]);
					}
					if(context.inArray){
						newChild(context.object, target);
					}
				}else{
					if(!inExtensions){
						if(context.inArray){
							// it's an array
							target = context.object.newChild ? context.object.newChild() : newChild(context.object);
							inExtensions = true;
						}else{
							target = context.object;
							for(var i = 0; i < namePaths.length; i++){
								target = get(target, namePaths[i]);
							}
						}						
					}
					target.addRef(namePaths);
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
				case "(": 
					target = namePaths.args = [];
					target.newChild = function(){
						var args = this;
						return {
							is: function(value){
								args.push(value);
							},
							addRef: function(path){
								args.push(path);
							}
						}
					};
				case "[":
				case "{":
					inExtensions = false;
					context = {object: target, inArray: operator != '{', offset: offset + t.length};
					stack.push(context);
					break;
				case ";": case ",":
					target = context.object;
					inExtensions = false;
					break;
				case "}": case "]": case ")":
					inExtensions = false;
					target.asText = sheetText.substring(context.offset, offset);
					// for ) we keep the target, for } and ] we don't
					target = stack[stack.length - 1].object;
					stack.pop();
					context = stack[stack.length - 1];
					if(operator == ")"){
						target = context.object;
					}
					break;
			};
		});
		if(stack.length > 1){
			console.error("Unclosed braces");
		}
		return context.object;
	};
	var directives = parser.directives = {};
	directives["import"] = function(object, sheet){
		var target = new Cascade;
		// tell the object to wait for this import
		var oldWhenReady = object.whenReady;
		object.whenReady = function(callback){
			object.whenReady = oldWhenReady;
			// get the URL from the target
			get(target,function(value){
				// request the next sheet
				sheet.request(value, function(nextSheet){
					// parse it
					parser(nextSheet, object);
					object.whenReady ?
						object.whenReady(callback) : 
						callback();
				});
			});
		};
		return target; 
	};	
	/*directives["extends"] = function(object, sheet){
		// directly use this object for extensions
		return object;
	};*/	
	return parser;
});