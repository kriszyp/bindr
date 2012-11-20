define(["put-selector/put"], function(put){
	function create(proto, props){
		var target = Object.create(proto);
		for(var i in props){
			target[i] = props[i];
		}
		return target;
	}
	var elementNames = {};
	var counter = 1;
	function evaluateSelectorString(key, asString, sheet){
		return {
			addChild: function(value, asString){
				if(!this.hasOwnProperty("children")){
					this.children = [];
				}
				value = evaluateSelectorString(value, asString, sheet);
				this.children.push(value);
				value.className = "bindr-" + (counter++); 
				this.render = function(element){
					for(var i = 0; i < this.children.length; i++){
						put(element, this.children[i].createElement());
					}
				};
				return value;
			},
			createElement: function(){
				if(asString){
					return document.createTextNode(key);
				}
				var element = put(key);
				if(this.className){
					element.className += " " + this.className;
				}
				if(this.render){
					this.render(element);
				}
				return element;
			},
			set: function(key, value){
				if(key == "each"){
					value = evaluateSelectorString(value, false, sheet);
				}
				return this[key] = value;
			},
			to: function(value){
				this.addChild(value, true);
				return this;
			},
			onrule: function(text, context){
				if(this.className){
					var styleSheet = sheet.sheet;
console.log('addRule', '.' + this.className, text);
					styleSheet.addRule('.' + this.className, text, styleSheet.cssRules.length);
				}
			}
		};
	}
	function parse(sheet, target, callback){
		target = target || {};
		target.get = function(key){
			if(!(key in elementNames) && !key.match(/\W/)){
				var elementHolder = elementNames[key] = document.createElement(key).toString().indexOf("Unknown") > 0 ? 
					false : evaluateSelectorString(key, false, sheet);
				elementHolder.selector = key;
				require(["dojo/query", "dojo/domReady!"], function(query){
					if(elementHolder.render){
						query(key).forEach(function(element){
							elementHolder.render(element);
						});
					}
				});
			}
			
			return elementNames[key] || [];
		}
		var match,
			model = {
				object: target
			},
			context = {
				target: target || [],
				variables: {}
			},
			stack = [context],
			variables = {};
		function evaluate(value){
			// TODO this element stuff should be moved out
			return context.variables[value] || value;
		}
		function continueParsing(text, callback, topLevel){
			var match;
			var currentRegex = /\s*([\}\]])|\s*([^[{:=;\}'"\]]+)\s*(?:([<\:=]+)?\s*([^[\]{\}'":;]+))?([{\['"])?/g;
									// close    		  key       assignment      value      open-block
			while(match = currentRegex.exec(text)){
				var close = match[1];
				if(close){
					stack.pop();
					/*if(matching[last.operator] != close){
						NonMatchingClose;
					}*/
					if(close == '}' && target.onrule){
						target.onrule(text.slice(context.start, currentRegex.lastIndex - 1), context);
					}
					context = stack[stack.length - 1];
					target = context.target;
				}else{
					var key = match[2],
						assignment = match[3],
						value = match[4],
						open = match[5];
					key = key.trim();
					if(assignment){
						if((value && (value = value.trim())) || !open){
							var assignTo = context[assignment == ':' ? 'target' : 'variables'];
							var evaluatedValue = assignTo.set ? assignTo.set(key, value) : assignTo[key] = value;
							if(evaluatedValue != value){
								// needs the altered CSS to be added a stylesheet 
								context.dirty = true;
								if(evaluatedValue.then){
									evaluatedValue.then(function(){
										// update CSS
									});
								}
							}
							value = evaluatedValue;
						}
					}
					if(context.operator == '[' && (value || key)){
						target.addChild ? (value = target.addChild(value || key)) : target.push(value || key);
					}
					if(open){
						if(open == '"' || open == "'"){
							var scanString = open == "'" ? /((?:\\.|[^'])*)'/g : /((?:\\.|[^"])*)"/g;
							scanString.lastIndex = currentRegex.lastIndex;
							var str = scanString.exec(text)[1];
							currentRegex.lastIndex = scanString.lastIndex;
							if(key && key[0] == '@'){
								// directive
								if(key.slice(0,7) == "@import"){
									return sheet.request(str, function(importedSheet){
										importedSheet.sheet = sheet.sheet;
										parse(importedSheet, target, function(){
											continueParsing(text.slice(currentRegex.lastIndex), callback)
										});
									});
								}
							}
							var lastValue = value.to(str);
						}else{
							stack.push(context = {
								operator: open,
								start: currentRegex.lastIndex,
								target: target = value || (key ? (target.get ? target.get(key) : (target[key] || (target[key] = []))) : lastValue),
								variables: create(context.variables)
							});
						}
					}
					if(name in variables){
						var variable = variables[name]; 
						if(variable["on/"]){
							var result = variable["on/"](path, operator, subsequentText, continueParsing);
							if(topResult && result.get){
								result.get(function(){
	console.log("update css text for this rule");
								});
							}
						}
					}
				}
			}
			callback && callback(result);
		}
		continueParsing(sheet.text, callback, true);
	}
	return parse;
});