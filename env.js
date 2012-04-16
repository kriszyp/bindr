define(['./Reactive', './Cascade', 'compose/compose'], function(Reactive, Cascade, Compose){
	return function(env){
		var get = Cascade.get;
		var resolve = Cascade.resolve;
		var moduleBase = get(env, 'module');
		moduleBase.apply = function(target, args){
			return {
				then: function(callback){
					require([args[0].join('/')], function(module){
						if(module.call){
							module.call(moduleBase, target);
						}else{
							for(var i in module){
								target[i] = module[i];
							}
						}
						if(target.whenReady){
							target.whenReady(callback);
						}else{
							callback();
						}
					});
				}
			};
		};
		function reactiveFunction(target, func){
			target.apply = function(target, args){
				target.getValue = function(callback){
					var resolvedArgs = [];
					var doneInit;
					for(var i = 0; i < args.length; i++){
						var arg = args[i];
						(function(arg, i){
							get(arg, function(value){
								resolvedArgs[i] = value;
								if(doneInit){
									// only call this asyncronously
									callback(func.apply(this, resolvedArgs));
								}
							});
						})(arg.splice ? resolve(this, arg) : arg, i);
					}
					doneInit = true;
					if(resolvedArgs.length){
						// some have resolved now at least, call the function
						callback(func.apply(this, resolvedArgs));
					}
				};
			};
		};
		reactiveFunction(get(env, 'or'), function(a, b){
			return a || b;
		});
		reactiveFunction(get(env, 'and'), function(a, b){
			return a && b;
		});
		reactiveFunction(get(env, 'add'), function(a, b){
			return a + b;
		});
		get(env, 'transaction').apply = function(target, args){
			var dirty = [];
			function addTrans(target, original){
				var newValue;
				get(target, "save").is(function(){
					for(var i = 0; i < dirty.length; i++){
						// TODO: should be put
						dirty[i].original.put(dirty[i].value);
					}
				});
				if(original.getValue){
					target.getValue = function(callback){
						original.getValue(callback);
					};
				}
				target.get = function(key){
					return this[key] || (this[key] = addTrans(new Cascade, get(original, key)));
				};
				target.put = function(value){
					this.is(value);
					dirty.push({
						original: original,
						value: value
					});
				};
				return target;
			}
			return addTrans(target, resolve(target, args[0]));
		};
	};
});